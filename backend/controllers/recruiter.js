const admin = require('../config/firebase')

const db = admin.firestore()

// ---------------- Jobs ----------------
// POST /jobs
async function createJob(req, res) {
  try {
    const { title, location, category, skills, experience, description, recruiterId } = req.body || {}
    if (!title || !location || !category || !skills || !experience || !description || !recruiterId) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const payload = {
      title,
      location,
      category,
      skills: Array.isArray(skills) ? skills : String(skills).split(',').map((s) => s.trim()).filter(Boolean),
      experience,
      description,
      recruiterId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    const docRef = await db.collection('jobs').add(payload)
    const snap = await docRef.get()
    return res.status(201).json({ id: docRef.id, ...snap.data() })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create job', error: error.message })
  }
}

// GET /jobs?recruiterId=...
async function listJobs(req, res) {
  try {
    const recruiterId = req.query.recruiterId || req.body?.recruiterId
    if (!recruiterId) return res.status(400).json({ message: 'Missing recruiterId' })

    const qs = await db.collection('jobs').where('recruiterId', '==', recruiterId).get()
    const items = qs.docs.map((d) => ({ id: d.id, ...d.data() }))
    return res.status(200).json(items)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch jobs', error: error.message })
  }
}

// GET /jobs/:id
async function getJob(req, res) {
  try {
    const { id } = req.params
    const snap = await db.collection('jobs').doc(id).get()
    if (!snap.exists) return res.status(404).json({ message: 'Job not found' })
    return res.status(200).json({ id: snap.id, ...snap.data() })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch job', error: error.message })
  }
}

// PUT /jobs/:id
async function updateJob(req, res) {
  try {
    const { id } = req.params
    const updates = { ...req.body }
    delete updates.id
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp()

    await db.collection('jobs').doc(id).update(updates)
    return res.status(200).json({ message: 'Job updated successfully' })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update job', error: error.message })
  }
}

// DELETE /jobs/:id
async function deleteJob(req, res) {
  try {
    const { id } = req.params

    await db.collection('jobs').doc(id).delete()

    const apps = await db.collection('applicants').where('jobId', '==', id).get()
    const batch = db.batch()
    apps.forEach((doc) => batch.delete(doc.ref))
    await batch.commit()

    return res.status(200).json({ message: 'Job deleted successfully' })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete job', error: error.message })
  }
}

// --------------- Applicants ---------------
// GET /jobs/:id/applicants
async function listApplicants(req, res) {
  try {
    const { id: jobId } = req.params
    if (!jobId) return res.status(400).json({ message: 'Missing jobId' })

    const qs = await db.collection('applicants').where('jobId', '==', jobId).get()
    const items = qs.docs.map((d) => ({ id: d.id, ...d.data() }))
    return res.status(200).json(items)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch applicants', error: error.message })
  }
}

async function updateApplicantStatus(req, res, status) {
  try {
    const { id: jobId, applicantId } = req.params
    if (!jobId || !applicantId) return res.status(400).json({ message: 'Missing jobId or applicantId' })

    const ref = db.collection('applicants').doc(applicantId)
    const snap = await ref.get()
    if (!snap.exists) return res.status(404).json({ message: 'Applicant not found' })

    await ref.update({ status, updatedAt: admin.firestore.FieldValue.serverTimestamp() })

    await db.collection('recruiter_activity').add({
      type: 'applicant_status',
      jobId,
      applicantId,
      status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return res.status(200).json({ ok: true })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update applicant', error: error.message })
  }
}

async function shortlistApplicant(req, res) {
  return updateApplicantStatus(req, res, 'shortlisted')
}

async function rejectApplicant(req, res) {
  return updateApplicantStatus(req, res, 'rejected')
}

async function hireApplicant(req, res) {
  return updateApplicantStatus(req, res, 'hired')
}

// --------------- Dashboard ---------------
// GET /recruiter/:id/dashboard
async function getDashboard(req, res) {
  try {
    const { id: recruiterId } = req.params
    if (!recruiterId) return res.status(400).json({ message: 'Missing recruiterId' })

    const jobsSnap = await db.collection('jobs').where('recruiterId', '==', recruiterId).get()
    const jobIds = jobsSnap.docs.map((d) => d.id)

    let totalApplicants = 0
    let shortlistedCount = 0

    if (jobIds.length > 0) {
      const appsSnap = await db.collection('applicants').where('jobId', 'in', jobIds.slice(0, 10)).get()
      totalApplicants = appsSnap.size
      shortlistedCount = appsSnap.docs.reduce((acc, doc) => acc + (doc.data().status === 'shortlisted' ? 1 : 0), 0)
    }

    const activitySnap = await db
      .collection('recruiter_activity')
      .where('jobId', 'in', jobIds.slice(0, 10))
      .get()

    const recentActivity = activitySnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const ta = a?.createdAt?.toMillis ? a.createdAt.toMillis() : 0
        const tb = b?.createdAt?.toMillis ? b.createdAt.toMillis() : 0
        return tb - ta
      })
      .slice(0, 10)

    return res.status(200).json({
      jobsPosted: jobsSnap.size,
      totalApplicants,
      shortlisted: shortlistedCount,
      recentActivity,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load dashboard', error: error.message })
  }
}

module.exports = {
  // jobs
  createJob,
  listJobs,
  getJob,
  updateJob,
  deleteJob,
  // applicants
  listApplicants,
  shortlistApplicant,
  rejectApplicant,
  hireApplicant,
  // dashboard
  getDashboard,
}
