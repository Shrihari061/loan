const express = require('express');
const multer = require('multer');
const Lead = require('../models/Lead');
const router = express.Router();
const { spawn } = require('child_process');

// Multer setup - store files in memory to save directly in MongoDB
const storage = multer.memoryStorage();
const upload = multer({ storage });

// -------------------- GET ALL LEADS --------------------
router.get('/', async (req, res) => {
  try {
    const leads = await Lead.find({}).sort({ created_date: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// -------------------- GET LEAD BY ID --------------------
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

// -------------------- CREATE NEW LEAD --------------------
router.post(
  '/',
  upload.fields([
    { name: 'financialDocuments', maxCount: 10 },
    { name: 'signature', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      let leadData = {};

      // If JSON is sent in body as "data" string (multipart/form-data with files)
      if (req.body.data) {
        try {
          leadData = JSON.parse(req.body.data);
        } catch {
          return res.status(400).json({ error: 'Invalid JSON in data field' });
        }
      } else {
        leadData = req.body;
      }

      // -------------------- Ensure proper structured fields --------------------
      if (leadData.address && typeof leadData.address === 'string') {
        try { leadData.address = JSON.parse(leadData.address); } catch {}
      }
      if (leadData.directors && typeof leadData.directors === 'string') {
        try { leadData.directors = JSON.parse(leadData.directors); } catch { leadData.directors = []; }
      }

      leadData.aml_company_status = leadData.aml_company_status || 'idle';
      leadData.aml_director_status = leadData.aml_director_status || 'idle';
      leadData.last_updated = new Date().toISOString();

      // -------------------- Handle uploaded files --------------------
      if (req.files?.financialDocuments) {
        leadData.financialDocuments = req.files.financialDocuments.map(file => ({
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          fileData: file.buffer
        }));
      }
      if (req.files?.signature?.[0]) {
        leadData.signature = {
          fileName: req.files.signature[0].originalname,
          fileType: req.files.signature[0].mimetype,
          fileSize: req.files.signature[0].size,
          fileData: req.files.signature[0].buffer
        };
      }

      // -------------------- Save to MongoDB --------------------
      const newLead = new Lead(leadData);
      await newLead.save();

      // -------------------- Run Python model --------------------
      console.log("Starting Python model...");

      const pythonProcess = spawn('python', ['./routes/BFSI-LOS-Model_Pdf/run_pipeline.py']);

      pythonProcess.stdout.on('data', (data) => {
        console.log(`[Python stdout]: ${data.toString()}`);
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error(`[Python stderr]: ${data.toString()}`);
      });

      pythonProcess.on('spawn', () => {
        console.log("Python process spawned successfully");
      });

      pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
      });

      pythonProcess.on('error', (err) => {
        console.error('Failed to start Python process:', err);
      });

      // -------------------- Send response --------------------
      res.status(201).json(newLead);

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create lead' });
    }
  }
);

// -------------------- UPDATE LEAD --------------------
router.put('/:id', upload.none(), async (req, res) => {
  try {
    let updateData = req.body;

    // If body contains JSON strings for structured fields, parse them
    if (updateData.address && typeof updateData.address === 'string') {
      try {
        updateData.address = JSON.parse(updateData.address);
      } catch {}
    }

    if (updateData.directors && typeof updateData.directors === 'string') {
      try {
        updateData.directors = JSON.parse(updateData.directors);
      } catch {
        updateData.directors = [];
      }
    }

    // Update last_updated timestamp
    updateData.last_updated = new Date().toISOString();

    const updatedLead = await Lead.findByIdAndUpdate(req.params.id, updateData, {
      new: true
    });

    if (!updatedLead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(updatedLead);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// -------------------- DELETE LEAD --------------------
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
