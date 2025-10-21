const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');

// Get all jobs
router.get('/', jobController.getAllJobs);

// Get job by ID
router.get('/:id', jobController.getJobById);

// Submit job application
router.post('/apply', jobController.submitApplication);

// Toggle save/unsave job
router.post('/save', jobController.toggleSaveJob);

// Get saved jobs for a user
router.get('/saved/:userId', jobController.getSavedJobs);

// Check if job is saved
router.get('/check-saved', jobController.checkIfJobSaved);

module.exports = router;