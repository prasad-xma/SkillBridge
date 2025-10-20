const admin = require('../config/firebase');

async function saveQuestionnaire(req, res) {
  try {
    const { uid, answers } = req.body || {};
    if (!uid || !answers || typeof answers !== 'object') {
      return res.status(400).json({ message: 'Missing uid or answers' });
    }

    const db = admin.firestore();
    const now = admin.firestore.FieldValue.serverTimestamp();

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

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to save questionnaire', error: error.message });
  }
}

module.exports = { saveQuestionnaire };
