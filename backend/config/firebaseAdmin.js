const admin = require("firebase-admin");

let firebaseApp;

const buildServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const raw = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      if (raw.private_key) {
        raw.private_key = raw.private_key.replace(/\\n/g, "\n");
      }
      return raw;
    } catch (error) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.");
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Provide FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY."
    );
  }

  return {
    projectId,
    clientEmail,
    private_key: privateKey.replace(/\\n/g, "\n"),
  };
};

const getFirebaseAdminApp = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (admin.apps.length > 0) {
    firebaseApp = admin.app();
    return firebaseApp;
  }

  const serviceAccount = buildServiceAccount();

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  return firebaseApp;
};

const getFirebaseAuth = () => getFirebaseAdminApp().auth();

module.exports = {
  getFirebaseAdminApp,
  getFirebaseAuth,
};
