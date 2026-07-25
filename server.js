const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');

const app = express();
const PORT = 1232;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
const serviceAccount = require('./service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// API Endpoints
// 1. Get all reservations (sorted by createdAt desc)
app.get('/api/reservations', async (req, res) => {
  try {
    const snapshot = await db.collection('reservations').orderBy('createdAt', 'desc').get();
    const reservations = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Format timestamps for the client
      let createdAtStr = '';
      if (data.createdAt) {
        createdAtStr = data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;
      }
      reservations.push({
        id: doc.id,
        ...data,
        createdAt: createdAtStr
      });
    });
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

// 2. Add a new reservation
app.post('/api/reservations', async (req, res) => {
  try {
    const { name, phone, date, time, guests, preOrderedItems, preOrderTotal } = req.body;
    
    if (!name || !phone || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const docRef = await db.collection('reservations').add({
      name,
      phone,
      date,
      time,
      guests: guests || '1 Guest',
      preOrderedItems: preOrderedItems || 'None',
      preOrderTotal: Number(preOrderTotal) || 0,
      status: 'Pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({ id: docRef.id, message: 'Reservation created successfully' });
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ error: 'Failed to create reservation' });
  }
});

// 3. Update reservation status
app.put('/api/reservations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    await db.collection('reservations').doc(id).update({
      status
    });

    res.json({ message: 'Reservation status updated successfully' });
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({ error: 'Failed to update reservation' });
  }
});

// 4. Delete/Cancel reservation permanently
app.delete('/api/reservations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('reservations').doc(id).delete();
    res.json({ message: 'Reservation deleted successfully' });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    res.status(500).json({ error: 'Failed to delete reservation' });
  }
});

// Serve static files from the admin directory
app.use(express.static(path.join(__dirname, 'admin')));

// Fallback all other routes to the admin index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

module.exports = app;
