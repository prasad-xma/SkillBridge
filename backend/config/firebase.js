const admin = require('firebase-admin');
const serviceAccount = require('./skill-bridge-a30e3-firebase-adminsdk-fbsvc-731ca4048b.json');

// initialize firbase admin sdk
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// export admin
module.exports = admin;