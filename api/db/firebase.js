const admin = require("firebase-admin");

const serviceAccount = require('./serviceAccountKey.json');

// Corrige o formato da chave privada
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

// Use o objeto corrigido
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.firestore();
module.exports = { db };
