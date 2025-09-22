const admin = require('firebase-admin');
const serviceAccount = require('./skill-bridge-a30e3-firebase-adminsdk-fbsvc-731ca4048b.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'firebase-adminsdk-fbsvc@skill-bridge-a30e3.iam.gserviceaccount.com',
});

module.exports = admin;