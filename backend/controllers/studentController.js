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

module.exports = { saveQuestionnaire, listJobs, listApplications, applyForJob };
