const express = require('express');
const { saveQuestionnaire, getQuestionnaire, listJobs, listApplications, applyForJob, updateStudentProfile } = require('../controllers/studentController');

const router = express.Router();

router.post('/questionnaire', saveQuestionnaire);
router.get('/questionnaire', getQuestionnaire);
router.get('/jobs', listJobs);
router.get('/applications', listApplications);
router.post('/jobs/:id/apply', applyForJob);
router.put('/profile', updateStudentProfile);

module.exports = router;
