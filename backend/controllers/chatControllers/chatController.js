const admin = require('../../config/firebase')

const db = admin.firestore()

function userBriefFromDoc(doc) {
  const d = doc.data() || {}
  return {
    uid: doc.id,
    email: d.email || null,
    fullName: d.fullName || null,
    role: d.role || null,
    profile: d.profile || {},
  }
}

async function getUserBrief(uid) {
  if (!uid) return null
  const snap = await db.collection('users').doc(uid).get()
  if (!snap.exists) return { uid, fullName: null, email: null, role: null, profile: {} }
  return userBriefFromDoc(snap)
}

// GET /api/chat/search-contacts?query=...&userId=...
// Returns professionals and institutes filtered by (case-insensitive) substring of fullName or email
async function searchContacts(req, res) {
  try {
    const { query = '', userId } = req.query || {}
    const q = String(query || '').toLowerCase().trim()

    // fetch a small pool from both roles and filter in memory for substring match
    const limit = q ? 50 : 20
    const [proSnap, instSnap] = await Promise.all([
      db.collection('users').where('role', '==', 'professional').limit(limit).get(),
      db.collection('users').where('role', '==', 'institute').limit(limit).get(),
    ])

    let results = [...proSnap.docs, ...instSnap.docs]
      .filter((doc) => doc.id !== userId)
      .map(userBriefFromDoc)

    if (q) {
      results = results.filter((u) => {
        const name = (u.fullName || '').toLowerCase()
        const email = (u.email || '').toLowerCase()
        return name.includes(q) || email.includes(q)
      })
    }

    // shape a UI-friendly subtitle
    const items = results.slice(0, 30).map((u) => {
      let subtitle = ''
      if (u.role === 'professional') {
        const title = u.profile?.jobTitle || u.profile?.title || null
        const company = u.profile?.company || u.profile?.organization || null
        subtitle = [title, company].filter(Boolean).join(' • ')
      } else if (u.role === 'institute') {
        subtitle = u.profile?.name || u.profile?.instituteName || ''
      }
      return { ...u, subtitle }
    })

    return res.status(200).json({ users: items })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to search contacts', error: error.message })
  }
}

// POST /api/chat/ensure
// Body: { userId, otherId }
async function ensureConversation(req, res) {
  try {
    const { userId, otherId } = req.body || {}
    if (!userId || !otherId) return res.status(400).json({ message: 'Missing userId or otherId' })
    if (userId === otherId) return res.status(400).json({ message: 'Cannot create conversation with self' })

    // find if conversation already exists
    const qs = await db.collection('conversations').where('participantIds', 'array-contains', userId).get()
    let existing = null
    for (const doc of qs.docs) {
      const d = doc.data() || {}
      const arr = d.participantIds || []
      if (Array.isArray(arr) && arr.includes(otherId) && arr.length === 2) {
        existing = { id: doc.id, ...d }
        break
      }
    }

    if (existing) {
      // enrich otherUser
      const other = await getUserBrief(otherId)
      return res.status(200).json({ conversation: { ...existing, otherUser: other } })
    }

    // create new
    const [a, b] = await Promise.all([getUserBrief(userId), getUserBrief(otherId)])
    const payload = {
      participantIds: [userId, otherId],
      participants: {
        [userId]: { uid: a.uid, fullName: a.fullName, email: a.email, role: a.role },
        [otherId]: { uid: b.uid, fullName: b.fullName, email: b.email, role: b.role },
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastMessage: null,
      lastSenderId: null,
    }

    const ref = await db.collection('conversations').add(payload)
    const snap = await ref.get()
    const data = snap.data() || {}
    return res.status(201).json({ conversation: { id: ref.id, ...data, otherUser: b } })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to ensure conversation', error: error.message })
  }
}

// GET /api/chat/conversations?userId=...
async function getConversations(req, res) {
  try {
    const { userId } = req.query || {}
    if (!userId) return res.status(400).json({ message: 'Missing userId' })

    const qs = await db.collection('conversations').where('participantIds', 'array-contains', userId).get()
    const items = qs.docs.map((doc) => {
      const d = doc.data() || {}
      const createdAt = d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : null
      const updatedAt = d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : null
      return { id: doc.id, ...d, createdAt, updatedAt }
    })

    // attach otherUser and sort by updatedAt desc
    const out = []
    for (const c of items) {
      const otherId = (c.participantIds || []).find((id) => id !== userId) || null
      let otherUser = null
      if (otherId) {
        otherUser = c.participants?.[otherId] || (await getUserBrief(otherId))
      }
      out.push({ ...c, otherUser })
    }

    out.sort((a, b) => {
      const ta = a?.updatedAt ? new Date(a.updatedAt).getTime() : 0
      const tb = b?.updatedAt ? new Date(b.updatedAt).getTime() : 0
      return tb - ta
    })

    return res.status(200).json({ conversations: out })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch conversations', error: error.message })
  }
}

// GET /api/chat/messages/:id?limit=50
async function getMessages(req, res) {
  try {
    const { id } = req.params
    const limit = Math.min(parseInt(req.query?.limit || '50', 10) || 50, 200)
    if (!id) return res.status(400).json({ message: 'Missing conversation id' })

    const msgsSnap = await db
      .collection('conversations')
      .doc(id)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()

    const items = msgsSnap.docs.map((d) => {
      const m = d.data() || {}
      const createdAt = m.createdAt?.toDate ? m.createdAt.toDate().toISOString() : null
      return { id: d.id, ...m, createdAt }
    })

    return res.status(200).json({ messages: items })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch messages', error: error.message })
  }
}

// POST /api/chat/messages/:id  Body: { senderId, text }
async function sendMessage(req, res) {
  try {
    const { id } = req.params
    const { senderId, text } = req.body || {}
    if (!id || !senderId || !text || !String(text).trim()) {
      return res.status(400).json({ message: 'Missing id, senderId or text' })
    }

    const convRef = db.collection('conversations').doc(id)
    const convSnap = await convRef.get()
    if (!convSnap.exists) return res.status(404).json({ message: 'Conversation not found' })
    const conv = convSnap.data() || {}
    const participantIds = conv.participantIds || []
    if (!participantIds.includes(senderId)) return res.status(403).json({ message: 'Sender not in conversation' })

    const payload = {
      senderId,
      text: String(text).trim(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    const msgRef = await convRef.collection('messages').add(payload)

    await convRef.update({
      lastMessage: payload.text,
      lastSenderId: senderId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    const msgSnap = await msgRef.get()
    const data = msgSnap.data() || {}
    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null

    return res.status(201).json({ message: { id: msgRef.id, ...data, createdAt } })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send message', error: error.message })
  }
}

module.exports = {
  searchContacts,
  ensureConversation,
  getConversations,
  getMessages,
  sendMessage,
}
