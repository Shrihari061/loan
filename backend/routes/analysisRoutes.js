const express = require('express');
const router = express.Router();
const Analysis = require('../models/Analysis');

// 🔹 Get ALL analysis documents
router.get('/', async (req, res) => {
  try {
    const data = await Analysis.find();
    res.json(data);
  } catch (err) {
    console.error('Error fetching analysis:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 🔹 Get a SINGLE analysis document by MongoDB _id
router.get('/:id', async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);
    if (!analysis) return res.status(404).json({ message: 'Analysis not found' });
    res.json(analysis);
  } catch (err) {
    console.error('Error fetching document:', err);
    res.status(500).json({ error: 'Invalid ID or server error' });
  }
});

module.exports = router;
