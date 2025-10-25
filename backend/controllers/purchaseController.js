const admin = require('../config/firebase');

const db = admin.firestore();
const purchasesCollection = db.collection('purchasedCourses');
const coursesCollection = db.collection('courses');

async function createPurchase(req, res) {
  try {
    const { studentId, courseId, completed } = req.body || {};

    if (!studentId || !courseId) {
      return res.status(400).json({ message: 'studentId and courseId are required' });
    }

    const existing = await purchasesCollection
      .where('studentId', '==', studentId)
      .where('courseId', '==', courseId)
      .limit(1)
      .get();

    if (!existing.empty) {
      const doc = existing.docs[0];
      return res.status(200).json({ message: 'Already purchased', purchase: { id: doc.id, ...doc.data() } });
    }

    const data = {
      studentId,
      courseId,
      completed: typeof completed === 'boolean' ? completed : false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const ref = await purchasesCollection.add(data);
    const saved = await ref.get();

    return res.status(201).json({ message: 'Purchase saved', purchase: { id: ref.id, ...saved.data() } });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to save purchase', error: error.message });
  }
}

async function listPurchasesByStudent(req, res) {
  try {
    const { studentId } = req.params || {};

    if (!studentId) {
      return res.status(400).json({ message: 'studentId is required' });
    }

    const snap = await purchasesCollection.where('studentId', '==', studentId).get();

    const purchases = [];
    for (const doc of snap.docs) {
      const data = doc.data();
      let course = null;
      if (data.courseId) {
        const cDoc = await coursesCollection.doc(data.courseId).get();
        if (cDoc.exists) {
          course = { id: cDoc.id, ...cDoc.data() };
        }
      }
      purchases.push({ id: doc.id, ...data, course });
    }

    return res.status(200).json(purchases);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch purchases', error: error.message });
  }
}

module.exports = {
  createPurchase,
  listPurchasesByStudent,
};
