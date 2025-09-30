const admin = require('../config/firebase');

// Expected body: { email, password, fullName, role, profile }
// role: 'student' | 'institute' | 'professional'
// profile: role-specific fields
async function registerUser(req, res) {
  try {
    const { email, password, fullName, role, profile } = req.body || {};

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const allowedRoles = ['student', 'institute', 'professional'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: fullName,
    });

    // Set custom claims for role-based access control
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });

    // Persist profile in Firestore under users collection
    const db = admin.firestore();
    const userDoc = {
      uid: userRecord.uid,
      email,
      fullName,
      role,
      profile: profile || {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('users').doc(userRecord.uid).set(userDoc);

    return res.status(201).json({
      uid: userRecord.uid,
      email,
      fullName,
      role,
    });
  } catch (error) {
    // Handle email already exists or other Firebase errors
    const code = error?.code || '';
    if (code.includes('email-already-exists')) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
}

module.exports = { registerUser };

// ------------------------- LOGIN ------------------------- //

async function loginUser(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing email or password' });
    }

    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Server missing Firebase API key' });
    }

    const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    const signInResp = await fetch(signInUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const signInData = await signInResp.json();
    if (!signInResp.ok) {
      const errorMessage = signInData?.error?.message || 'Invalid credentials';
      return res.status(401).json({ message: errorMessage });
    }

    const uid = signInData.localId;
    const idToken = signInData.idToken;

    // Get role from custom claims
    const userRecord = await admin.auth().getUser(uid);
    const role = userRecord.customClaims?.role || null;

    // Get profile from Firestore
    const db = admin.firestore();
    const userDocSnap = await db.collection('users').doc(uid).get();
    const userDoc = userDocSnap.exists ? userDocSnap.data() : null;

    return res.status(200).json({
      uid,
      email: userRecord.email,
      fullName: userDoc?.fullName || userRecord.displayName || '',
      role,
      profile: userDoc?.profile || {},
      idToken,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
}

module.exports.loginUser = loginUser;


