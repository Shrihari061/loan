const express = require('express');
const router = express.Router();
const Memo = require('../models/Memo');


// 🔹 Get all memos
router.get('/', async (req, res) => {
  try {
    const memos = await Memo.find();
    res.json(memos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🔹 Get single memo by ID
router.get('/:id', async (req, res) => {
  try {
    const memo = await Memo.findById(req.params.id);
    if (!memo) return res.status(404).json({ message: 'Memo not found' });
    res.json(memo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// 🔹 Create a new memo
router.post('/create', async (req, res) => {
  try {
    const memo = new Memo(req.body);
    await memo.save();
    res.status(201).json(memo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
