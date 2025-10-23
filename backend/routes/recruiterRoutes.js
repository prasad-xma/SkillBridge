const express = require('express')
const recruiter = require('../controllers/recruiter')

const router = express.Router()

// ---------------- Jobs ----------------
router.post('/jobs', recruiter.createJob)
router.get('/jobs', recruiter.listJobs)
router.get('/jobs/:id', recruiter.getJob)
router.put('/jobs/:id', recruiter.updateJob)
router.delete('/jobs/:id', recruiter.deleteJob)

// --------------- Applicants ------------
router.get('/jobs/:id/applicants', recruiter.listApplicants)
router.put('/jobs/:id/applicants/:applicantId/shortlist', recruiter.shortlistApplicant)
router.put('/jobs/:id/applicants/:applicantId/reject', recruiter.rejectApplicant)
router.put('/jobs/:id/applicants/:applicantId/hire', recruiter.hireApplicant)
router.put('/jobs/:id/applicants/:applicantId/undo', recruiter.undoApplicant)

// --------------- Dashboard -------------
router.get('/recruiter/:id/dashboard', recruiter.getDashboard)

module.exports = router
