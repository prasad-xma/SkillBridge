const admin = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

const db = admin.firestore();
const activitiesCollection = db.collection('mentorActivities');
const badgesCollection = db.collection('mentorBadges');
const progressCollection = db.collection('mentorProgress');
const certificatesCollection = db.collection('mentorCertificates');
const remindersCollection = db.collection('mentorReminders');
const usersCollection = db.collection('users');

const toIsoString = (value) => {
  if (!value) {
    return null;
  }
  if (value.toDate) {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return null;
};

const ensureDocument = async (collection, mentorId, payload) => {
  const docRef = collection.doc(mentorId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    await docRef.set(
      {
        mentorId,
        ...payload,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
  return snapshot.exists ? snapshot.data() || {} : payload || {};
};

const ensureMentorSeed = async (mentorId) => {
  if (!mentorId) {
    return;
  }

  await Promise.all([
    ensureDocument(activitiesCollection, mentorId, {
      streakCount: 0,
      longestStreak: 0,
      lastActiveDate: null,
    }),
    ensureDocument(badgesCollection, mentorId, {
      badges: [],
    }),
    ensureDocument(progressCollection, mentorId, {
      mentees: 0,
      active: 0,
      averageCompletion: 0,
    }),
    ensureDocument(certificatesCollection, mentorId, {
      items: [],
    }),
    ensureDocument(remindersCollection, mentorId, {
      items: [],
    }),
    (async () => {
      const docRef = usersCollection.doc(mentorId);
      const snapshot = await docRef.get();
      if (!snapshot.exists) {
        await docRef.set(
          {
            uid: mentorId,
            role: 'mentor',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    })(),
  ]);
};

const readStreak = async (mentorId) => {
  await ensureMentorSeed(mentorId);
  const snapshot = await activitiesCollection.doc(mentorId).get();
  if (!snapshot.exists) {
    return {
      mentorId,
      streakCount: 0,
      longestStreak: 0,
      lastActiveDate: null,
    };
  }

  const data = snapshot.data() || {};
  return {
    mentorId,
    streakCount: data.streakCount || 0,
    longestStreak: data.longestStreak || 0,
    lastActiveDate: toIsoString(data.lastActiveDate),
  };
};

const readBadges = async (mentorId) => {
  await ensureMentorSeed(mentorId);
  const snapshot = await badgesCollection.doc(mentorId).get();
  if (!snapshot.exists) {
    return [];
  }

  const { badges = [] } = snapshot.data() || {};
  return badges
    .map((badge) => ({
      id: badge.id,
      name: badge.name,
      description: badge.description || null,
      earnedDate: toIsoString(badge.earnedDate),
    }))
    .sort((a, b) => {
      if (!a.earnedDate && !b.earnedDate) {
        return 0;
      }
      if (!a.earnedDate) {
        return 1;
      }
      if (!b.earnedDate) {
        return -1;
      }
      return new Date(b.earnedDate).getTime() - new Date(a.earnedDate).getTime();
    });
};

const readReminders = async (mentorId) => {
  await ensureMentorSeed(mentorId);
  const snapshot = await remindersCollection.doc(mentorId).get();
  if (!snapshot.exists) {
    return [];
  }

  const { items = [] } = snapshot.data() || {};
  return items
    .map((item) => ({
      id: item.id,
      note: item.note || null,
      when: toIsoString(item.when),
      createdAt: toIsoString(item.createdAt),
      completed: Boolean(item.completed),
    }))
    .sort((a, b) => {
      if (!a.when && !b.when) {
        return 0;
      }
      if (!a.when) {
        return 1;
      }
      if (!b.when) {
        return -1;
      }
      return new Date(a.when).getTime() - new Date(b.when).getTime();
    });
};

const readProgress = async (mentorId) => {
  await ensureMentorSeed(mentorId);
  const snapshot = await progressCollection.doc(mentorId).get();
  if (!snapshot.exists) {
    return {
      mentees: 0,
      active: 0,
      averageCompletion: 0,
      updatedAt: null,
    };
  }

  const data = snapshot.data() || {};
  return {
    mentees: Number.isFinite(data.mentees) ? data.mentees : 0,
    active: Number.isFinite(data.active) ? data.active : 0,
    averageCompletion: Number.isFinite(data.averageCompletion) ? data.averageCompletion : 0,
    updatedAt: toIsoString(data.updatedAt),
  };
};

const readCertificates = async (mentorId) => {
  await ensureMentorSeed(mentorId);
  const snapshot = await certificatesCollection.doc(mentorId).get();
  if (!snapshot.exists) {
    return [];
  }

  const { items = [] } = snapshot.data() || {};
  return items
    .map((item) => ({
      id: item.id,
      menteeId: item.menteeId,
      menteeName: item.menteeName || null,
      courseId: item.courseId,
      courseName: item.courseName || null,
      issuedBy: item.issuedBy || null,
      notes: item.notes || null,
      issuedAt: toIsoString(item.issuedAt),
    }))
    .sort((a, b) => {
      if (!a.issuedAt && !b.issuedAt) {
        return 0;
      }
      if (!a.issuedAt) {
        return 1;
      }
      if (!b.issuedAt) {
        return -1;
      }
      return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
    });
};

const normalizeAverage = (value) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return 0;
  }
  if (numberValue < 0) {
    return 0;
  }
  if (numberValue > 1) {
    return 1;
  }
  return numberValue;
};

const getDashboard = async (req, res) => {
  try {
    const { mentorId } = req.params;
    if (!mentorId) {
      return res.status(400).json({ message: 'Missing mentor id' });
    }

    await ensureMentorSeed(mentorId);
    const [streak, badges, progress] = await Promise.all([
      readStreak(mentorId),
      readBadges(mentorId),
      readProgress(mentorId),
    ]);

    return res.status(200).json({ streak, badges, progress });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load dashboard data', error: error.message });
  }
};

const getStreak = async (req, res) => {
  try {
    const { mentorId } = req.params;
    if (!mentorId) {
      return res.status(400).json({ message: 'Missing mentor id' });
    }

    const streak = await readStreak(mentorId);
    return res.status(200).json(streak);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load streak data', error: error.message });
  }
};

const updateStreak = async (req, res) => {
  try {
    const { mentorId } = req.params;
    if (!mentorId) {
      return res.status(400).json({ message: 'Missing mentor id' });
    }

    const snapshot = await activitiesCollection.doc(mentorId).get();
    const existing = snapshot.exists ? snapshot.data() || {} : {};

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastActiveRaw = existing.lastActiveDate && existing.lastActiveDate.toDate ? existing.lastActiveDate.toDate() : null;
    const lastActive = lastActiveRaw
      ? new Date(lastActiveRaw.getFullYear(), lastActiveRaw.getMonth(), lastActiveRaw.getDate())
      : null;

    let streakCount = Number(existing.streakCount) || 0;
    let longestStreak = Number(existing.longestStreak) || 0;

    if (!lastActive) {
      streakCount = 1;
    } else {
      const diff = Math.floor((today.getTime() - lastActive.getTime()) / (24 * 60 * 60 * 1000));
      if (diff === 0) {
        streakCount = streakCount || 1;
      } else if (diff === 1) {
        streakCount += 1;
      } else {
        streakCount = 1;
      }
    }

    if (streakCount > longestStreak) {
      longestStreak = streakCount;
    }

    await activitiesCollection.doc(mentorId).set(
      {
        mentorId,
        streakCount,
        longestStreak,
        lastActiveDate: admin.firestore.Timestamp.fromDate(today),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const updated = await readStreak(mentorId);
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update streak', error: error.message });
  }
};

const getBadges = async (req, res) => {
  try {
    const { mentorId } = req.params;
    if (!mentorId) {
      return res.status(400).json({ message: 'Missing mentor id' });
    }

    const badges = await readBadges(mentorId);
    return res.status(200).json({ badges });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load badges', error: error.message });
  }
};

const addBadge = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { name, description, earnedDate } = req.body || {};

    if (!mentorId || !name) {
      return res.status(400).json({ message: 'Missing mentor id or badge name' });
    }

    const docRef = badgesCollection.doc(mentorId);
    const snapshot = await docRef.get();
    const existingBadges = snapshot.exists ? snapshot.data().badges || [] : [];
    const lowerName = name.trim().toLowerCase();

    const duplicate = existingBadges.find((badge) => (badge.name || '').trim().toLowerCase() === lowerName);
    if (duplicate) {
      return res.status(409).json({ message: 'Badge already exists' });
    }

    const now = admin.firestore.Timestamp.now();
    const badge = {
      id: uuidv4(),
      name: name.trim(),
      description: description ? description.trim() || null : null,
      earnedDate: earnedDate
        ? admin.firestore.Timestamp.fromDate(new Date(earnedDate))
        : now,
      createdAt: now,
    };

    await docRef.set(
      {
        mentorId,
        badges: [...existingBadges, badge],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const badges = await readBadges(mentorId);
    return res.status(201).json({ badges });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add badge', error: error.message });
  }
};

const getProgress = async (req, res) => {
  try {
    const { mentorId } = req.params;
    if (!mentorId) {
      return res.status(400).json({ message: 'Missing mentor id' });
    }

    const progress = await readProgress(mentorId);
    return res.status(200).json(progress);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load progress', error: error.message });
  }
};

const updateProgress = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { mentees, active, averageCompletion } = req.body || {};

    if (!mentorId) {
      return res.status(400).json({ message: 'Missing mentor id' });
    }

    await progressCollection.doc(mentorId).set(
      {
        mentorId,
        mentees: Number.isFinite(Number(mentees)) ? Number(mentees) : 0,
        active: Number.isFinite(Number(active)) ? Number(active) : 0,
        averageCompletion: normalizeAverage(averageCompletion),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const progress = await readProgress(mentorId);
    return res.status(200).json(progress);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update progress', error: error.message });
  }
};

const getCertificates = async (req, res) => {
  try {
    const { mentorId } = req.params;
    if (!mentorId) {
      return res.status(400).json({ message: 'Missing mentor id' });
    }

    const certificates = await readCertificates(mentorId);
    return res.status(200).json({ certificates });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load certificates', error: error.message });
  }
};

const addCertificate = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { menteeId, menteeName, courseId, courseName, issuedBy, notes } = req.body || {};

    if (!mentorId || !menteeId || !courseId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const docRef = certificatesCollection.doc(mentorId);
    const snapshot = await docRef.get();
    const existingCertificates = snapshot.exists ? snapshot.data().items || [] : [];

    const now = admin.firestore.Timestamp.now();
    const certificate = {
      id: uuidv4(),
      mentorId,
      menteeId,
      menteeName: menteeName ? menteeName.trim() || null : null,
      courseId,
      courseName: courseName ? courseName.trim() || null : null,
      issuedBy: issuedBy ? issuedBy.trim() || null : null,
      notes: notes ? notes.trim() || null : null,
      issuedAt: now,
      createdAt: now,
    };

    await docRef.set(
      {
        mentorId,
        items: [...existingCertificates, certificate],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const certificates = await readCertificates(mentorId);
    return res.status(201).json({ certificates });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add certificate', error: error.message });
  }
};

const getReminders = async (req, res) => {
  try {
    const { mentorId } = req.params;
    if (!mentorId) {
      return res.status(400).json({ message: 'Missing mentor id' });
    }

    const reminders = await readReminders(mentorId);
    return res.status(200).json({ reminders });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load reminders', error: error.message });
  }
};

const addReminder = async (req, res) => {
  try {
    const { mentorId } = req.params;
    if (!mentorId) {
      return res.status(400).json({ message: 'Missing mentor id' });
    }

    const { note, when } = req.body || {};
    const trimmedNote = typeof note === 'string' ? note.trim() : '';

    if (!trimmedNote) {
      return res.status(400).json({ message: 'Reminder note is required' });
    }

    let whenTimestamp = null;
    if (when) {
      const date = new Date(when);
      if (!Number.isNaN(date.getTime())) {
        whenTimestamp = admin.firestore.Timestamp.fromDate(date);
      }
    }

    const docRef = remindersCollection.doc(mentorId);
    await ensureMentorSeed(mentorId);

    const snapshot = await docRef.get();
    const existing = snapshot.exists ? snapshot.data() || {} : {};
    const items = Array.isArray(existing.items) ? [...existing.items] : [];

    const now = admin.firestore.Timestamp.now();
    const newReminder = {
      id: uuidv4(),
      note: trimmedNote,
      when: whenTimestamp,
      completed: false,
      createdAt: now,
    };

    items.push(newReminder);

    await docRef.set(
      {
        mentorId,
        items,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const reminders = await readReminders(mentorId);
    return res.status(200).json({ reminders });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add reminder', error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const { mentorId } = req.params;
    if (!mentorId) {
      return res.status(400).json({ message: 'Missing mentor id' });
    }

    await ensureMentorSeed(mentorId);
    const snapshot = await usersCollection.doc(mentorId).get();
    if (!snapshot.exists) {
      return res.status(200).json({ profile: null });
    }

    const data = snapshot.data() || {};
    const profile = {
      uid: mentorId,
      fullName: data.fullName || null,
      email: data.email || null,
      role: data.role || null,
      avatarUrl: data.avatarUrl || null,
      bio: data.bio || null,
      expertise: Array.isArray(data.expertise) ? data.expertise : [],
      joinedAt: toIsoString(data.createdAt || data.joinedAt),
      updatedAt: toIsoString(data.updatedAt),
    };

    return res.status(200).json({ profile });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load profile', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { mentorId } = req.params;
    if (!mentorId) {
      return res.status(400).json({ message: 'Missing mentor id' });
    }

    const { fullName, email, avatarUrl, bio, expertise } = req.body || {};

    await usersCollection.doc(mentorId).set(
      {
        uid: mentorId,
        fullName: fullName || null,
        email: email || null,
        avatarUrl: avatarUrl || null,
        bio: bio || null,
        expertise: Array.isArray(expertise)
          ? expertise.filter((item) => typeof item === 'string' && item.trim().length)
          : typeof expertise === 'string'
          ? expertise
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        role: 'mentor',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const snapshot = await usersCollection.doc(mentorId).get();
    const data = snapshot.data() || {};
    return res.status(200).json({
      profile: {
        uid: mentorId,
        fullName: data.fullName || null,
        email: data.email || null,
        role: data.role || null,
        avatarUrl: data.avatarUrl || null,
        bio: data.bio || null,
        expertise: Array.isArray(data.expertise) ? data.expertise : [],
        joinedAt: toIsoString(data.createdAt || data.joinedAt),
        updatedAt: toIsoString(data.updatedAt),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

module.exports = {
  getDashboard,
  getStreak,
  updateStreak,
  getBadges,
  addBadge,
  getProgress,
  updateProgress,
  getCertificates,
  addCertificate,
  getProfile,
  updateProfile,
  getReminders,
  addReminder,
};
