const admin = require('../config/firebase');

const db = admin.firestore();

async function saveQuestionnaire(req, res) {
  try {
    const { uid, email, answers } = req.body || {};
    if ((!uid && !email) || !answers || typeof answers !== 'object') {
      return res.status(400).json({ message: 'Missing identifier or answers' });
    }
    const now = admin.firestore.FieldValue.serverTimestamp();
    const docId = uid || email;

    await db.collection('questionnaireResponses').doc(docId).set(
      {
        uid: uid || null,
        email: email || null,
        answers,
        updatedAt: now,
      },
      { merge: true }
    );

    if (uid) {
      await db.collection('users').doc(uid).set(
        {
          questionnaire: {
            ...answers,
            updatedAt: now,
          },
          updatedAt: now,
        },
        { merge: true }
      );
    }

    return res.status(200).json({ ok: true, storedAs: docId });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to save questionnaire', error: error.message });
  }
}

async function getQuestionnaire(req, res) {
  try {
    const { uid, userId, email } = req.query || {}
    const docId = uid || userId || email
    if (!docId) {
      return res.status(400).json({ message: 'Missing uid, userId or email' })
    }

    const snap = await db.collection('questionnaireResponses').doc(docId).get()
    if (!snap.exists) {
      return res.status(404).json({ message: 'Questionnaire not found' })
    }
    const data = snap.data() || {}
    const answers = data.answers || {}
    const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null
    return res.status(200).json({ answers, updatedAt })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load questionnaire', error: error.message })
  }
}

async function listJobs(req, res) {
  try {
    const snapshot = await db.collection('jobs').orderBy('createdAt', 'desc').get();
    const items = snapshot.docs.map((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null;
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null;
      return {
        id: doc.id,
        ...data,
        createdAt,
        updatedAt,
      };
    });
    return res.status(200).json(items);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load jobs', error: error.message });
  }
}

async function getRecommendedJobs(req, res) {
  try {
    const { uid } = req.query;
    if (!uid) {
      return res.status(400).json({ message: 'Missing uid' });
    }

    // Get user profile to extract course
    const userSnap = await db.collection('users').doc(uid).get();
    if (!userSnap.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = userSnap.data();
    const userCourse = userData?.course || userData?.profile?.course;
    
    if (!userCourse) {
      return res.status(400).json({ message: 'User course not found in profile' });
    }

    // Course to job keywords mapping
    const courseToJobKeywords = {
      'software engineering': [
        'software', 'developer', 'engineer', 'frontend', 'backend', 'full stack', 
        'fullstack', 'web', 'mobile', 'ui/ux', 'programmer', 'coding', 'react', 
        'angular', 'vue', 'node', 'java', 'python', 'javascript', 'typescript',
        'ios', 'android', 'devops', 'api', 'microservices', '.net', 'c#', 'c++'
      ],
      'data science': [
        'data', 'scientist', 'machine learning', 'ml', 'ai', 'artificial intelligence', 
        'analytics', 'analyst', 'data engineer', 'big data', 'python', 'r', 
        'tensorflow', 'pytorch', 'neural', 'deep learning', 'nlp', 'computer vision'
      ],
      'computer science': [
        'software', 'developer', 'programmer', 'engineer', 'computer', 'systems', 
        'coding', 'backend', 'frontend', 'full stack', 'fullstack', 'architect',
        'technical', 'it', 'technology'
      ],
      'cybersecurity': [
        'security', 'cyber', 'penetration', 'ethical hacking', 'security analyst', 
        'security engineer', 'infosec', 'threat', 'vulnerability', 'soc', 'incident'
      ],
      'information technology': [
        'it', 'technology', 'support', 'systems', 'network', 'infrastructure',
        'helpdesk', 'technical', 'administrator', 'devops', 'cloud'
      ],
      'business': [
        'business', 'analyst', 'manager', 'project manager', 'product manager', 
        'consultant', 'management', 'strategy', 'operations', 'administrative'
      ],
      'marketing': [
        'marketing', 'digital marketing', 'social media', 'content', 'brand',
        'seo', 'sem', 'campaign', 'communication', 'pr', 'public relations'
      ],
      'design': [
        'designer', 'ui/ux', 'graphic', 'product design', 'ux', 'ui', 'visual',
        'creative', 'figma', 'sketch', 'adobe', 'illustrator', 'photoshop'
      ],
    };

    // Normalize course name (trim and lowercase)
    const courseLower = userCourse.trim().toLowerCase();
    
    // Get keywords for the user's course
    let keywords = courseToJobKeywords[courseLower];
    
    // If no exact match, try partial matching
    if (!keywords || keywords.length === 0) {
      const courseKeys = Object.keys(courseToJobKeywords);
      for (const key of courseKeys) {
        if (courseLower.includes(key) || key.includes(courseLower)) {
          keywords = courseToJobKeywords[key];
          break;
        }
      }
    }
    
    // If still no match, return empty array
    if (!keywords || keywords.length === 0) {
      return res.status(200).json([]);
    }

    // Fetch all jobs
    const snapshot = await db.collection('jobs').orderBy('createdAt', 'desc').get();
    const allJobs = snapshot.docs.map((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null;
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null;
      return {
        id: doc.id,
        ...data,
        createdAt,
        updatedAt,
      };
    });

    // Filter jobs based on keywords (case-insensitive partial match)
    const recommendedJobs = allJobs.filter((job) => {
      if (!job.title) return false;
      
      const titleLower = job.title.toLowerCase();
      const descLower = (job.description || '').toLowerCase();
      const categoryLower = (job.category || '').toLowerCase();
      
      // Check if any keyword matches in title, description, or category
      return keywords.some((keyword) =>
        titleLower.includes(keyword.toLowerCase()) ||
        descLower.includes(keyword.toLowerCase()) ||
        categoryLower.includes(keyword.toLowerCase())
      );
    });

    return res.status(200).json(recommendedJobs);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load recommended jobs', error: error.message });
  }
}

async function listApplications(req, res) {
  try {
    const uid = req.query?.uid;
    if (!uid) {
      return res.status(400).json({ message: 'Missing uid' });
    }

    const snapshot = await db.collection('applicants').where('studentId', '==', uid).get();
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json(items);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load applications', error: error.message });
  }
}

async function updateStudentProfile(req, res) {
  try {
    const { uid, fullName, profile } = req.body || {};
    if (!uid) {
      return res.status(400).json({ message: 'Missing uid' });
    }

    const nameProvided = typeof fullName === 'string';
    const profileProvided = profile && typeof profile === 'object' && !Array.isArray(profile);
    if (!nameProvided && !profileProvided) {
      return res.status(400).json({ message: 'No updates provided' });
    }

    const updates = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (nameProvided) {
      const trimmedName = fullName.trim();
      if (!trimmedName) {
        return res.status(400).json({ message: 'Full name cannot be empty' });
      }
      updates.fullName = trimmedName;
    }

    if (profileProvided) {
      updates.profile = profile;
    }

    await db.collection('users').doc(uid).set(updates, { merge: true });
    const snap = await db.collection('users').doc(uid).get();
    const data = snap.exists ? snap.data() : null;

    return res.status(200).json({ ok: true, user: data ? { uid: snap.id, ...data } : null });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
}

async function applyForJob(req, res) {
  try {
    const { id: jobId } = req.params;
    const { uid, name, email, resumeUrl, coverLetter, skills } = req.body || {};

    if (!jobId || !uid || !name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const jobRef = db.collection('jobs').doc(jobId);
    const jobSnap = await jobRef.get();
    if (!jobSnap.exists) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const duplicateSnap = await db
      .collection('applicants')
      .where('jobId', '==', jobId)
      .where('studentId', '==', uid)
      .limit(1)
      .get();

    if (!duplicateSnap.empty) {
      return res.status(409).json({ message: 'Already applied for this job' });
    }

    const formattedSkills = Array.isArray(skills)
      ? skills
      : typeof skills === 'string'
      ? skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const payload = {
      jobId,
      studentId: uid,
      name,
      email: email || null,
      resumeUrl: resumeUrl || null,
      coverLetter: coverLetter || null,
      skills: formattedSkills,
      status: 'applied',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const applicantRef = await db.collection('applicants').add(payload);
    await jobRef.update({
      applicantsCount: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const snapshotAfter = await applicantRef.get();
    return res.status(201).json({ id: applicantRef.id, ...snapshotAfter.data() });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to apply for job', error: error.message });
  }
}

module.exports = { saveQuestionnaire, getQuestionnaire, listJobs, getRecommendedJobs, listApplications, applyForJob, updateStudentProfile };
