const express = require('express');
const mentorController = require('../controllers/mentorController');

const router = express.Router();

router.get('/:mentorId/dashboard', mentorController.getDashboard);
router.get('/:mentorId/streak', mentorController.getStreak);
router.put('/:mentorId/streak', mentorController.updateStreak);
router.get('/:mentorId/badges', mentorController.getBadges);
router.post('/:mentorId/badge', mentorController.addBadge);
router.get('/:mentorId/progress', mentorController.getProgress);
router.put('/:mentorId/progress', mentorController.updateProgress);
router.get('/:mentorId/certificates', mentorController.getCertificates);
router.post('/:mentorId/certificate', mentorController.addCertificate);
router.get('/:mentorId/profile', mentorController.getProfile);
router.put('/:mentorId/profile', mentorController.updateProfile);
router.get('/:mentorId/reminders', mentorController.getReminders);
router.post('/:mentorId/reminder', mentorController.addReminder);

module.exports = router;
