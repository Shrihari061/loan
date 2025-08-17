const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Get all leads
router.get('/', async (req, res) => {
  try {
    const leads = await Lead.find({}).sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Get lead by ID
router.get('/:id', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

// Create new lead (with files)
router.post(
  '/',
  upload.fields([
    { name: 'financialFiles', maxCount: 10 }, // multiple financial docs
    { name: 'signature', maxCount: 1 }        // one signature file
  ]),
  async (req, res) => {
    try {
      // Parse JSON part of form
      const leadData = JSON.parse(req.body.data); // "data" key contains JSON

      // Add files into leadData
      if (req.files['financialFiles']) {
        leadData.financialDocuments = req.files['financialFiles'].map(file => ({
          documentType: file.originalname,
          files: [{
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
            fileData: file.buffer
          }]
        }));
      }

      if (req.files['signature']) {
        const sigFile = req.files['signature'][0];
        leadData.signature = {
          fileName: sigFile.originalname,
          fileType: sigFile.mimetype,
          fileSize: sigFile.size,
          fileData: sigFile.buffer
        };
      }

      const newLead = new Lead(leadData);
      await newLead.save();
      res.status(201).json(newLead);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create lead' });
    }
  }
);

// Update lead (similar to create)
router.put(
  '/:id',
  upload.fields([
    { name: 'financialFiles', maxCount: 10 },
    { name: 'signature', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const updateData = JSON.parse(req.body.data);

      if (req.files['financialFiles']) {
        updateData.financialDocuments = req.files['financialFiles'].map(file => ({
          documentType: file.originalname,
          files: [{
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
            fileData: file.buffer
          }]
        }));
      }

      if (req.files['signature']) {
        const sigFile = req.files['signature'][0];
        updateData.signature = {
          fileName: sigFile.originalname,
          fileType: sigFile.mimetype,
          fileSize: sigFile.size,
          fileData: sigFile.buffer
        };
      }

      const updatedLead = await Lead.findByIdAndUpdate(req.params.id, updateData, { new: true });
      if (!updatedLead) {
        return res.status(404).json({ error: 'Lead not found' });
      }
      res.json(updatedLead);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update lead' });
    }
  }
);

// Delete lead
router.delete('/:id', async (req, res) => {
  try {
    const deletedLead = await Lead.findByIdAndDelete(req.params.id);
    if (!deletedLead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json({ message: 'Lead deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

module.exports = router;
