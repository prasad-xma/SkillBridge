const admin = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

// Reference Firestore
const db = admin.firestore();
const skillsCollection = db.collection('skills');

// ------------------------- ADD SKILL ------------------------- //
async function addSkill(req, res) {
  try {
    const {
      skillName,
      description,
      category,
      difficulty,
      duration,
      prerequisites,
      learningOutcomes,
    } = req.body || {};

    if (!skillName || !description || !category || !difficulty || !duration) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Thumbnail image upload (optional)
    let thumbnailUrl = null;
    if (req.file) {
      const bucket = admin.storage().bucket();
      const fileName = `skill-thumbnails/${uuidv4()}_${req.file.originalname}`;
      const file = bucket.file(fileName);

      await file.save(req.file.buffer, {
        metadata: { contentType: req.file.mimetype },
        resumable: false,
      });

      thumbnailUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    }

    // Safely parse array-like fields whether they arrive as JSON strings or arrays
    const parseArray = (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    };

    const skillId = uuidv4();
    const newSkill = {
      id: skillId,
      skillName,
      description,
      category,
      difficulty,
      duration,
      prerequisites: parseArray(prerequisites),
      learningOutcomes: parseArray(learningOutcomes),
      thumbnailUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await skillsCollection.doc(skillId).set(newSkill);

    return res.status(201).json({
      message: 'Skill added successfully',
      skill: newSkill,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add skill', error: error.message });
  }
}

// ------------------------- UPDATE SKILL ------------------------- //
async function updateSkill(req, res) {
  try {
    const { skillId } = req.params;
    const updates = req.body || {};

    if (!skillId) {
      return res.status(400).json({ message: 'Skill ID is required' });
    }

    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    // If thumbnail update
    if (req.file) {
      const bucket = admin.storage().bucket();
      const fileName = `skill-thumbnails/${uuidv4()}_${req.file.originalname}`;
      const file = bucket.file(fileName);

      await file.save(req.file.buffer, {
        metadata: { contentType: req.file.mimetype },
        resumable: false,
      });

      updates.thumbnailUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    }

    // Parse JSON fields if they exist
    if (updates.prerequisites && typeof updates.prerequisites === 'string') {
      updates.prerequisites = JSON.parse(updates.prerequisites);
    }
    if (updates.learningOutcomes && typeof updates.learningOutcomes === 'string') {
      updates.learningOutcomes = JSON.parse(updates.learningOutcomes);
    }

    await skillsCollection.doc(skillId).update(updates);

    return res.status(200).json({ message: 'Skill updated successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update skill', error: error.message });
  }
}

// ------------------------- DELETE SKILL ------------------------- //
async function deleteSkill(req, res) {
  try {
    const { skillId } = req.params;

    if (!skillId) {
      return res.status(400).json({ message: 'Skill ID is required' });
    }

    await skillsCollection.doc(skillId).delete();

    return res.status(200).json({ message: 'Skill deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete skill', error: error.message });
  }
}

// ------------------------- VIEW SKILL DETAILS ------------------------- //
async function getSkillDetails(req, res) {
  try {
    const { skillId } = req.params;

    if (!skillId) {
      return res.status(400).json({ message: 'Skill ID is required' });
    }

    const skillSnap = await skillsCollection.doc(skillId).get();

    if (!skillSnap.exists) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    const skillData = skillSnap.data();
    return res.status(200).json({
      ...skillData,
      id: skillSnap.id, // Include the document ID
      _id: skillSnap.id, // Also include as _id for compatibility
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch skill details', error: error.message });
  }
}

// ------------------------- LIST ALL SKILLS ------------------------- //
async function listSkills(req, res) {
  try {
    const snapshot = await skillsCollection.orderBy('createdAt', 'desc').get();
    const skills = snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id, // Include the document ID
      _id: doc.id, // Also include as _id for compatibility
    }));

    return res.status(200).json(skills);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch skills', error: error.message });
  }
} 

module.exports = {
  addSkill,
  updateSkill,
  deleteSkill,
  getSkillDetails,
  listSkills,
};
