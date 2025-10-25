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

    // Optional extended fields for Job Posting Hub
    const {
      employmentType,
      salaryMin,
      salaryMax,
      status,
      remote,
      benefits,
      applicationLink,
      screeningQuestions,
    } = req.body || {}

    const payload = {
      title,
      location,
      category,
      skills: Array.isArray(skills) ? skills : String(skills).split(',').map((s) => s.trim()).filter(Boolean),
      experience,
      description,
      recruiterId,
      // extended fields (all optional)
      employmentType: employmentType || null,
      salaryMin: Number.isFinite(Number(salaryMin)) ? Number(salaryMin) : null,
      salaryMax: Number.isFinite(Number(salaryMax)) ? Number(salaryMax) : null,
      status: status || 'published',
      remote: typeof remote === 'boolean' ? remote : (String(remote).toLowerCase() === 'true' ? true : false),
      benefits: Array.isArray(benefits)
        ? benefits.filter(Boolean)
        : (typeof benefits === 'string' ? benefits.split(',').map((v) => v.trim()).filter(Boolean) : []),
      applicationLink: applicationLink || null,
      screeningQuestions: Array.isArray(screeningQuestions)
        ? screeningQuestions.filter(Boolean)
        : (typeof screeningQuestions === 'string'
            ? screeningQuestions.split('\n').map((q) => q.trim()).filter(Boolean)
            : []),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    // Decide collection based on status
    const collectionName = (payload.status === 'published') ? 'jobs' : 'temporary_jobs'
    const docRef = await db.collection(collectionName).add(payload)
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

    // Fetch published jobs from 'jobs'
    const pubSnap = await db.collection('jobs').where('recruiterId', '==', recruiterId).get()
    const published = pubSnap.docs.map((d) => ({ id: d.id, ...d.data(), status: (d.data()?.status || 'published') }))

    // Fetch draft/archived from 'temporary_jobs'
    const tmpSnap = await db.collection('temporary_jobs').where('recruiterId', '==', recruiterId).get()
    const temporary = tmpSnap.docs.map((d) => ({ id: d.id, ...d.data(), status: (d.data()?.status || 'draft') }))

    // Attach applicantsCount for published jobs only
    const publishedWithCounts = await Promise.all(
      published.map(async (job) => {
        try {
          const appsSnap = await db.collection('applicants').where('jobId', '==', job.id).get()
          return { ...job, applicantsCount: appsSnap.size }
        } catch (_) {
          return { ...job, applicantsCount: 0 }
        }
      })
    )

    // Temporary jobs have no applicants (not public/applyable)
    const temporaryWithCounts = temporary.map((j) => ({ ...j, applicantsCount: 0 }))

    // Merge and sort by updatedAt desc when available
    const merged = [...publishedWithCounts, ...temporaryWithCounts].sort((a, b) => {
      const ta = a?.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0
      const tb = b?.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0
      return tb - ta
    })

    return res.status(200).json(merged)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch jobs', error: error.message })
  }
}

// GET /jobs/:id
async function getJob(req, res) {
  try {
    const { id } = req.params
    // Try in published collection first
    let snap = await db.collection('jobs').doc(id).get()
    if (!snap.exists) {
      // Fallback to temporary
      snap = await db.collection('temporary_jobs').doc(id).get()
    }
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

    // Determine current collection by probing
    const jobsRef = db.collection('jobs').doc(id)
    const tmpRef = db.collection('temporary_jobs').doc(id)
    const jobSnap = await jobsRef.get()
    const tmpSnap = await tmpRef.get()

    const desiredStatus = updates.status
    const currentData = jobSnap.exists ? jobSnap.data() : (tmpSnap.exists ? tmpSnap.data() : null)
    if (!currentData) return res.status(404).json({ message: 'Job not found' })

    const currentStatus = currentData.status || (jobSnap.exists ? 'published' : 'draft')
    const targetCollection = desiredStatus ? (desiredStatus === 'published' ? 'jobs' : 'temporary_jobs') : (currentStatus === 'published' ? 'jobs' : 'temporary_jobs')
    const sourceCollection = jobSnap.exists ? 'jobs' : 'temporary_jobs'

    // If collection boundary changes, move document; else update in-place
    if (sourceCollection !== targetCollection) {
      const sourceRef = sourceCollection === 'jobs' ? jobsRef : tmpRef
      const targetRef = targetCollection === 'jobs' ? jobsRef : tmpRef
      // Merge existing data with updates and write to target, then delete source
      const newData = { ...currentData, ...updates }
      await targetRef.set(newData, { merge: true })
      await sourceRef.delete()
    } else {
      const ref = sourceCollection === 'jobs' ? jobsRef : tmpRef
      await ref.update(updates)
    }

    return res.status(200).json({ message: 'Job updated successfully' })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update job', error: error.message })
  }
}

// DELETE /jobs/:id
async function deleteJob(req, res) {
  try {
    const { id } = req.params

    // Attempt delete in both collections (id will match only one)
    await Promise.all([
      db.collection('jobs').doc(id).delete().catch(() => {}),
      db.collection('temporary_jobs').doc(id).delete().catch(() => {}),
    ])

    // Clean up applicants only for published jobs
    const apps = await db.collection('applicants').where('jobId', '==', id).get()
    if (!apps.empty) {
      const batch = db.batch()
      apps.forEach((doc) => batch.delete(doc.ref))
      await batch.commit()
    }

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

async function undoApplicant(req, res) {
  return updateApplicantStatus(req, res, 'pending')
}

// --------------- Dashboard ---------------
// GET /recruiter/:id/dashboard
async function getDashboard(req, res) {
  try {
    const { id: recruiterId } = req.params
    if (!recruiterId) return res.status(400).json({ message: 'Missing recruiterId' })

    const jobsSnap = await db.collection('jobs').where('recruiterId', '==', recruiterId).get()
    const jobIds = jobsSnap.docs.map((d) => d.id)
    // Count ALL published jobs across all recruiters (jobs collection only)
    const allJobsSnap = await db.collection('jobs').get()
    const jobsCount = allJobsSnap.size

    // If recruiter has no jobs yet, avoid 'in' queries with empty arrays
    if (jobIds.length === 0) {
      return res.status(200).json({
        jobsPosted: 0,
        totalApplicants: 0,
        shortlisted: 0,
        recentActivity: [],
      })
    }

    let totalApplicants = 0
    let shortlistedCount = 0

    const appsSnap = await db.collection('applicants').where('jobId', 'in', jobIds.slice(0, 10)).get()
    totalApplicants = appsSnap.size
    shortlistedCount = appsSnap.docs.reduce((acc, doc) => acc + (doc.data().status === 'shortlisted' ? 1 : 0), 0)

    const activitySnap = await db
      .collection('recruiter_activity')
      .where('jobId', 'in', jobIds.slice(0, 10))
      .get()

    let recentActivity = activitySnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const ta = a?.createdAt?.toMillis ? a.createdAt.toMillis() : 0
        const tb = b?.createdAt?.toMillis ? b.createdAt.toMillis() : 0
        return tb - ta
      })
      .slice(0, 10)

    // Build job title map for quick lookup
    const jobTitleMap = jobsSnap.docs.reduce((acc, doc) => {
      const data = doc.data() || {}
      acc[doc.id] = data.title || null
      return acc
    }, {})

    // Enrich applicant activities with applicant details (name/email/skills)
    const applicantIds = Array.from(
      new Set(
        recentActivity
          .filter((a) => a?.type === 'applicant_status' && a?.applicantId)
          .map((a) => a.applicantId)
      )
    )

    if (applicantIds.length > 0) {
      // Firestore allows up to 10 in an 'in' query; recentActivity is already sliced to 10
      const appSnap = await db
        .collection('applicants')
        .where(admin.firestore.FieldPath.documentId(), 'in', applicantIds.slice(0, 10))
        .get()

      const appMap = appSnap.docs.reduce((acc, doc) => {
        const d = doc.data() || {}
        acc[doc.id] = {
          name: d.name || null,
          email: d.email || null,
          skills: d.skills || null,
        }
        return acc
      }, {})

      recentActivity = recentActivity.map((a) => {
        if (a?.type === 'applicant_status') {
          const ad = appMap[a.applicantId] || {}
          return {
            ...a,
            jobTitle: jobTitleMap[a.jobId] || null,
            applicantName: ad.name || null,
            applicantEmail: ad.email || null,
            applicantSkills: ad.skills || null,
          }
        }
        return a
      })
    } else {
      // Still attach jobTitle when available even if there are no applicant lookups
      recentActivity = recentActivity.map((a) => ({
        ...a,
        jobTitle: jobTitleMap[a.jobId] || null,
      }))
    }

    return res.status(200).json({
      jobsPosted: jobsCount,
      totalApplicants,
      shortlisted: shortlistedCount,
      recentActivity,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load dashboard', error: error.message })
  }
}

// --------------- Company Profile ---------------
// GET /recruiter/:id/company
async function getCompanyProfile(req, res) {
  try {
    const { id: recruiterId } = req.params
    if (!recruiterId) return res.status(400).json({ message: 'Missing recruiterId' })

    const ref = db.collection('companies').doc(recruiterId)
    const snap = await ref.get()
    if (!snap.exists) {
      return res.status(200).json({ id: recruiterId, name: null, website: null, size: null, industry: null, locations: [], description: null, createdAt: null, updatedAt: null })
    }
    return res.status(200).json({ id: snap.id, ...snap.data() })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch company profile', error: error.message })
  }
}

// PUT /recruiter/:id/company
async function upsertCompanyProfile(req, res) {
  try {
    const { id: recruiterId } = req.params
    if (!recruiterId) return res.status(400).json({ message: 'Missing recruiterId' })

    const {
      name,
      website,
      size,
      industry,
      locations,
      description,
      logoUrl,
      socials,
    } = req.body || {}

    const payload = {
      ...(name !== undefined ? { name } : {}),
      ...(website !== undefined ? { website } : {}),
      ...(size !== undefined ? { size } : {}),
      ...(industry !== undefined ? { industry } : {}),
      ...(locations !== undefined
        ? { locations: Array.isArray(locations) ? locations.filter(Boolean) : String(locations).split(',').map((v) => v.trim()).filter(Boolean) }
        : {}),
      ...(description !== undefined ? { description } : {}),
      ...(logoUrl !== undefined ? { logoUrl } : {}),
      ...(socials !== undefined ? { socials } : {}),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    const ref = db.collection('companies').doc(recruiterId)
    const snap = await ref.get()
    if (!snap.exists) {
      await ref.set({ ...payload, createdAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
    } else {
      await ref.set(payload, { merge: true })
    }

    const latest = await ref.get()
    return res.status(200).json({ id: latest.id, ...latest.data() })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to upsert company profile', error: error.message })
  }
}

// --------------- Company Insights ---------------
// GET /recruiter/:id/company/insights
async function getCompanyInsights(req, res) {
  try {
    const { id: recruiterId } = req.params
    if (!recruiterId) return res.status(400).json({ message: 'Missing recruiterId' })

    const [pubSnap, tmpSnap] = await Promise.all([
      db.collection('jobs').where('recruiterId', '==', recruiterId).get(),
      db.collection('temporary_jobs').where('recruiterId', '==', recruiterId).get(),
    ])

    const publishedJobs = pubSnap.docs.map((d) => ({ id: d.id, ...d.data(), status: d.data()?.status || 'published' }))
    const draftJobs = tmpSnap.docs.map((d) => ({ id: d.id, ...d.data(), status: d.data()?.status || 'draft' }))
    const allJobs = [...publishedJobs, ...draftJobs]

    const totalJobs = allJobs.length
    const openJobs = publishedJobs.length
    const draftCount = draftJobs.length

    // Collect all jobIds for applicant aggregations
    const jobIds = publishedJobs.map((j) => j.id)

    // Batch fetch applicants for up to 10 jobIds per query
    let totalApplicants = 0
    let statusBreakdown = { pending: 0, shortlisted: 0, rejected: 0, hired: 0 }
    let mostAppliedJob = null

    const chunk = (arr, size) => {
      const out = []
      for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
      return out
    }

    const jobIdChunks = chunk(jobIds, 10)
    const jobApplyCounts = {}
    for (const ch of jobIdChunks) {
      const appsSnap = await db.collection('applicants').where('jobId', 'in', ch).get()
      totalApplicants += appsSnap.size
      appsSnap.docs.forEach((doc) => {
        const d = doc.data() || {}
        const st = d.status || 'pending'
        statusBreakdown[st] = (statusBreakdown[st] || 0) + 1
        const jid = d.jobId
        jobApplyCounts[jid] = (jobApplyCounts[jid] || 0) + 1
      })
    }

    if (Object.keys(jobApplyCounts).length > 0) {
      const [jid, count] = Object.entries(jobApplyCounts).sort((a, b) => b[1] - a[1])[0]
      const job = publishedJobs.find((j) => j.id === jid)
      mostAppliedJob = job ? { id: job.id, title: job.title || null, applicants: count } : { id: jid, title: null, applicants: count }
    }

    // Derive top skills demanded from all jobs (both published and drafts)
    const skillCounts = {}
    allJobs.forEach((j) => {
      const skills = Array.isArray(j.skills) ? j.skills : []
      skills.forEach((s) => {
        const key = String(s || '').trim().toLowerCase()
        if (!key) return
        skillCounts[key] = (skillCounts[key] || 0) + 1
      })
    })
    const topSkillsDemanded = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill, count]) => ({ skill, count }))

    const avgApplicantsPerJob = openJobs > 0 ? Number((totalApplicants / openJobs).toFixed(2)) : 0

    return res.status(200).json({
      totalJobs,
      openJobs,
      draftJobs: draftCount,
      totalApplicants,
      avgApplicantsPerJob,
      statusBreakdown,
      mostAppliedJob,
      topSkillsDemanded,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to compute company insights', error: error.message })
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
  undoApplicant,
  // dashboard
  getDashboard,
  // company
  getCompanyProfile,
  upsertCompanyProfile,
  // insights
  getCompanyInsights,
}
