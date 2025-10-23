const express = require('express');
const multer = require('multer');
const skillController = require('../controllers/skillController');

const router = express.Router();

// Multer setup for handling image uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ------------------------- SKILL ROUTES ------------------------- //

// Add new skill (with thumbnail upload)
router.post(
  '/add',
  upload.single('thumbnail'),
  skillController.addSkill
); 

// Update existing skill
router.put(
  '/update/:skillId',
  upload.single('thumbnail'),
  skillController.updateSkill
);

// Delete skill (confirmation handled on frontend)
router.delete(
  '/delete/:skillId',
  skillController.deleteSkill
);

// Get single skill details
router.get(
  '/:skillId',
  skillController.getSkillDetails
);

// List all skills
router.get(
  '/',
  skillController.listSkills
);

module.exports = router;
// ------------------------- END OF SKILL ROUTES ------------------------- //
