const express = require('express');
const router = express.Router();
const Summary = require('../models/Summary');

// -------------------- GET all summaries --------------------
router.get('/', async (req, res) => {
  try {
    // Check if lead_id query parameter is provided
    const { lead_id } = req.query;
    if (lead_id) {
      const data = await Summary.find({ lead_id: lead_id });
      return res.json(data);
    }
    
    // Otherwise return all summaries
    const summaries = await Summary.find();
    res.json(summaries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// -------------------- GET summary by ID --------------------
router.get('/:id', async (req, res) => {
  try {
    const summary = await Summary.findById(req.params.id);
    if (!summary) {
      return res.status(404).json({ message: 'Summary not found' });
    }
    res.json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 