const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');

const app = express();
const port = 3001;

app.use(cors({origin: true}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Firebase Admin SDK
let serviceAccount;
if (process.env.FIREBASE_ADMIN_CONFIG) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CONFIG);
  } catch (error) {
    console.error('Error parsing FIREBASE_ADMIN_CONFIG:', error);
    // อาจจะ throw error หรือจัดการตามที่เหมาะสม
  }
} else {
  console.error('FIREBASE_ADMIN_CONFIG is not set');
  // จัดการกรณีที่ไม่มีค่า config
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  // จัดการกรณีที่ไม่สามารถ initialize Firebase Admin SDK ได้
}

const db = admin.firestore();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/documents', async (req, res) => {
  try {
    console.log('Received POST request:', req.body);
    const { topic, writer, content } = req.body;
    const docRef = await db.collection('documents').add({ topic, writer, content });
    console.log('Document saved successfully:', docRef.id);
    res.status(201).json({ id: docRef.id, topic, writer, content });
  } catch (err) {
    console.error('Error saving document:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/documents', async (req, res) => {
  try {
    const snapshot = await db.collection('documents').get();
    const documents = [];
    snapshot.forEach(doc => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    console.log('Successfully fetched documents, count:', documents.length);
    res.status(200).json(documents);
  } catch (err) {
    console.error('Error fetching documents:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/documents/:id', async (req, res) => {
  try {
    const { topic, writer, content } = req.body;
    await db.collection('documents').doc(req.params.id).update({ topic, writer, content });
    res.status(200).json({ id: req.params.id, topic, writer, content });
  } catch (err) {
    console.error('Error updating document:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/documents/:id', async (req, res) => {
  try {
    await db.collection('documents').doc(req.params.id).delete();
    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Error deleting document:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;