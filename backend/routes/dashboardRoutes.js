const express = require('express');
const router = express.Router();
const Dashboard = require('../models/Dashboard');

// GET all dashboard data (default returns latest year first)
router.get('/', async (req, res) => {
  try {
    const data = await Dashboard.find().sort({ year: -1 });
    if (!data || data.length === 0) {
      console.log('No dashboard data found.');
      return res.status(404).json({ message: 'No data found' });
    }
    console.log('Dashboard data fetched successfully');
    res.json(data);
  } catch (err) {
    console.error('Error fetching dashboard data:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET dashboard data for a specific year
router.get('/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const data = await Dashboard.findOne({ year });

    if (!data) {
      console.log(`No data found for year ${year}`);
      return res.status(404).json({ message: 'Not found' });
    }

    console.log(`Dashboard data found for year ${year}`);
    res.json(data);
  } catch (err) {
    console.error('Error fetching year-specific dashboard data:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
