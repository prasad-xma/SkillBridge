const admin = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

// Reference Firestore
const db = admin.firestore();
const coursesCollection = db.collection('courses');

// ------------------------- ADD COURSE ------------------------- //
async function addCourse(req, res) {
  try {
    const {
      courseName,
      description,
      duration,
      chapters,
      fees,
    } = req.body || {};

    if (!courseName || !description || !duration || !chapters || !fees) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Thumbnail image upload (optional)
    let thumbnailUrl = null;
    if (req.file) {
      const bucket = admin.storage().bucket();
      const fileName = `course-thumbnails/${uuidv4()}_${req.file.originalname}`;
      const file = bucket.file(fileName);

      await file.save(req.file.buffer, {
        metadata: { contentType: req.file.mimetype },
        resumable: false,
      });

      thumbnailUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    }

    const courseId = uuidv4();
    const newCourse = {
      id: courseId,
      courseName,
      description,
      duration,
      chapters,
      fees,
      thumbnailUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await coursesCollection.doc(courseId).set(newCourse);

    return res.status(201).json({
      message: 'Course added successfully',
      course: newCourse,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add course', error: error.message });
  }
}

// ------------------------- UPDATE COURSE ------------------------- //
async function updateCourse(req, res) {
  try {
    const { courseId } = req.params;
    const updates = req.body || {};

    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    // If thumbnail update
    if (req.file) {
      const bucket = admin.storage().bucket();
      const fileName = `course-thumbnails/${uuidv4()}_${req.file.originalname}`;
      const file = bucket.file(fileName);

      await file.save(req.file.buffer, {
        metadata: { contentType: req.file.mimetype },
        resumable: false,
      });

      updates.thumbnailUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    }

    await coursesCollection.doc(courseId).update(updates);

    return res.status(200).json({ message: 'Course updated successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update course', error: error.message });
  }
}

// ------------------------- DELETE COURSE ------------------------- //
// (Frontend should show a confirmation popup before calling this API)
async function deleteCourse(req, res) {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    await coursesCollection.doc(courseId).delete();

    return res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete course', error: error.message });
  }
}

// ------------------------- VIEW COURSE DETAILS ------------------------- //
async function getCourseDetails(req, res) {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    const courseSnap = await coursesCollection.doc(courseId).get();

    if (!courseSnap.exists) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.status(200).json(courseSnap.data());
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch course details', error: error.message });
  }
}

// ------------------------- LIST ALL COURSES ------------------------- //
async function listCourses(req, res) {
  try {
    const snapshot = await coursesCollection.orderBy('createdAt', 'desc').get();
    const courses = snapshot.docs.map((doc) => doc.data());

    return res.status(200).json(courses);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch courses', error: error.message });
  }
} 

module.exports = {
  addCourse,
  updateCourse,
  deleteCourse,
  getCourseDetails,
  listCourses,
};
