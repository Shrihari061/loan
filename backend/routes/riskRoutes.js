const express = require('express');
const router = express.Router();
const Risk = require('../models/Risk');

// Get all risk assessments
router.get('/', async (req, res) => {
  try {
    const data = await Risk.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a specific risk assessment by ID
router.get('/:id', async (req, res) => {
  try {
    const record = await Risk.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Not found' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
