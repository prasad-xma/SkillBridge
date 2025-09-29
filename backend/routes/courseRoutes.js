const express = require('express');
const multer = require('multer');
const courseController = require('../controllers/courseController');

const router = express.Router();

// Multer setup for handling image uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ------------------------- COURSE ROUTES ------------------------- //

// Add new course (with thumbnail upload)
router.post(
  '/add',
  upload.single('thumbnail'),
  courseController.addCourse
); 

// Update existing course
router.put(
  '/update/:courseId',
  upload.single('thumbnail'),
  courseController.updateCourse
);

// Delete course (confirmation handled on frontend)
router.delete(
  '/delete/:courseId',
  courseController.deleteCourse
);

// Get single course details
router.get(
  '/:courseId',
  courseController.getCourseDetails
);

// List all courses
router.get(
  '/',
  courseController.listCourses
);

module.exports = router;
// ------------------------- END OF COURSE ROUTES ------------------------- //