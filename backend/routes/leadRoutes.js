const express = require('express');
const multer = require('multer');
const Lead = require('../models/Lead');
const ExtractedValues = require('../models/ExtractedValues');
const Ratios = require('../models/Ratios');
const Risk = require('../models/Risk');
const Summary = require('../models/Summary');
const fs = require('fs');
const path = require('path');
const { PythonShell } = require('python-shell');
const router = express.Router();

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

// -------------------- TRIGGER BFSI-LOS PIPELINE --------------------
router.post('/:id/analyze', async (req, res) => {
  try {
    const leadId = req.params.id;
    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    if (!lead.financialDocuments || lead.financialDocuments.length === 0) {
      return res.status(400).json({ error: 'No financial documents found for analysis' });
    }

    // Create temporary directory for BFSI-LOS processing
    const tempDir = path.join(__dirname, '../temp_uploads', leadId);
    const standaloneDir = path.join(tempDir, 'Standalone');
    const year2024Dir = path.join(standaloneDir, '2024-25');
    const year2023Dir = path.join(standaloneDir, '2023-24');

    // Create directory structure
    fs.mkdirSync(year2024Dir, { recursive: true });
    fs.mkdirSync(year2023Dir, { recursive: true });

    // Save uploaded files to appropriate directories
    let filesProcessed = 0;
    const processedFiles = new Map(); // Track what files we've already saved

    for (const doc of lead.financialDocuments) {
      const fileName = doc.fileName;
      const fileBuffer = doc.fileData;

      // Determine document type and year from filename
      let docType = '';
      let year = '';

      if (fileName.includes('Balance Sheet') || fileName.includes('BS')) {
        docType = 'BS.pdf';
      } else if (fileName.includes('Profit') || fileName.includes('PL')) {
        docType = 'PL.pdf';
      } else if (fileName.includes('Cash Flow') || fileName.includes('CF')) {
        docType = 'CF.pdf';
      }

      if (fileName.includes('2024') || fileName.includes('2025')) {
        year = '2024-25';
      } else if (fileName.includes('2023')) {
        year = '2023-24';
      }

      if (docType && year) {
        const targetDir = year === '2024-25' ? year2024Dir : year2023Dir;
        const filePath = path.join(targetDir, docType);
        const fileKey = `${year}-${docType}`;
        
        // Check if we already processed this year-docType combination
        if (!processedFiles.has(fileKey)) {
          // For 2024-25, prioritize files with '2025' in name, then '2024'
          if (year === '2024-25') {
            if (fileName.includes('2025')) {
              fs.writeFileSync(filePath, fileBuffer);
              processedFiles.set(fileKey, fileName);
              filesProcessed++;
              console.log(`Saved ${fileName} as ${fileKey} (prioritized 2025)`);
            } else if (fileName.includes('2024') && !processedFiles.has(fileKey)) {
              fs.writeFileSync(filePath, fileBuffer);
              processedFiles.set(fileKey, fileName);
              filesProcessed++;
              console.log(`Saved ${fileName} as ${fileKey} (2024 fallback)`);
            }
          } else {
            // For 2023-24, save directly
            fs.writeFileSync(filePath, fileBuffer);
            processedFiles.set(fileKey, fileName);
            filesProcessed++;
            console.log(`Saved ${fileName} as ${fileKey}`);
          }
        } else if (year === '2024-25' && fileName.includes('2025')) {
          // Override with 2025 file if we previously saved 2024
          const previousFile = processedFiles.get(fileKey);
          if (previousFile && previousFile.includes('2024')) {
            fs.writeFileSync(filePath, fileBuffer);
            processedFiles.set(fileKey, fileName);
            console.log(`Overrode ${previousFile} with ${fileName} (2025 priority)`);
          }
        }
      }
    }

    if (filesProcessed === 0) {
      return res.status(400).json({ error: 'No valid financial documents found for processing' });
    }

    // Run BFSI-LOS pipeline
    const bfsiLosPath = path.join(__dirname, '../bfsi_pipeline');

    const options = {
      mode: 'text',
      pythonPath: 'python3',
      pythonOptions: ['-u'],
      scriptPath: bfsiLosPath,
      args: [tempDir]
    };

    console.log(`🚀 Starting BFSI-LOS pipeline for lead ${leadId}...`);
    console.log(`📁 Files saved to: ${tempDir}`);
    console.log(`📊 Processing ${filesProcessed} financial documents...`);

    // Add timeout wrapper - increased to 20 minutes for OpenAI API calls
    let timeoutFired = false;
    const timeout = setTimeout(() => {
      if (!timeoutFired) {
        timeoutFired = true;
        console.error('⏰ BFSI-LOS pipeline timeout after 20 minutes');
        try {
          // Update lead status to failed
          Lead.findByIdAndUpdate(leadId, { 
            analysis_status: 'failed',
            analysis_date: new Date().toISOString()
          }).catch(err => console.error('Failed to update lead status on timeout:', err));
        } catch (updateErr) {
          console.error('Failed to update lead status on timeout:', updateErr);
        }
        if (!res.headersSent) {
          res.status(500).json({ error: 'Pipeline execution timeout - analysis is taking longer than expected. Please try again later.' });
        }
      }
    }, 1200000); // 20 minute timeout

    // Create a new PythonShell with real-time output logging
    const { PythonShell } = require('python-shell');
    
    // Configure Python shell with real-time output
    const pythonShell = new PythonShell('run_pipeline.py', {
      mode: 'text',
      pythonPath: 'python3',
      pythonOptions: ['-u'],
      scriptPath: bfsiLosPath,
      args: [tempDir]
    });

    // Listen for Python output in real-time
    pythonShell.on('message', function (message) {
      console.log(`🐍 Pipeline: ${message}`);
    });

    // Handle completion
    pythonShell.end(async function (err, code, signal) {
      if (timeoutFired) {
        console.log('Pipeline completed after timeout was fired, ignoring results');
        return;
      }
      
      clearTimeout(timeout);
      
      if (err) {
        console.error('❌ BFSI-LOS pipeline error:', err);
        try {
          // Update lead status to failed
          await Lead.findByIdAndUpdate(leadId, { 
            analysis_status: 'failed',
            analysis_date: new Date().toISOString()
          });
        } catch (updateErr) {
          console.error('Failed to update lead status:', updateErr);
        }
        return res.status(500).json({ error: 'Pipeline execution failed', details: err.message });
      }

      console.log('🎯 Python pipeline completed successfully!');
      console.log(`📊 Exit code: ${code}, Signal: ${signal}`);

      try {
        // Read the generated analysis files
        const extractionsPath = path.join(tempDir, 'Extractions');
        const extractedValuesPath = path.join(extractionsPath, 'extracted_values.json');
        const ratiosPath = path.join(extractionsPath, 'ratios.json');
        const riskRatingPath = path.join(extractionsPath, 'risk_rating.json');
        const summariesPath = path.join(extractionsPath, 'summaries.json');

        // Save to existing MongoDB collections
        const customerName = lead.business_name || 'Unknown Company';

        // 1. Save Extracted Values
        if (fs.existsSync(extractedValuesPath)) {
          const extractedData = JSON.parse(fs.readFileSync(extractedValuesPath, 'utf8'));
          
          // Convert to the format expected by ExtractedValues model
          const dataMap = new Map();
          Object.entries(extractedData).forEach(([key, value]) => {
            dataMap.set(key, {
              value_2025: value.value_2025,
              value_2024: value.value_2024,
              value_2023: value.value_2023,
              source: value.source,
              unit: value.unit
            });
          });

          const extractedValuesDoc = new ExtractedValues({
            customer_name: customerName,
            lead_id: leadId,
            data: dataMap
          });
          await extractedValuesDoc.save();
          console.log('Extracted values saved to MongoDB');
        }

        // 2. Save Ratios
        if (fs.existsSync(ratiosPath)) {
          const ratiosData = JSON.parse(fs.readFileSync(ratiosPath, 'utf8'));
          
          const ratiosDoc = new Ratios({
            customer_name: customerName,
            lead_id: leadId,
            ...ratiosData
          });
          await ratiosDoc.save();
          console.log('Ratios saved to MongoDB');
        }

        // 3. Save Risk Rating
        if (fs.existsSync(riskRatingPath)) {
          const riskData = JSON.parse(fs.readFileSync(riskRatingPath, 'utf8'));
          
          const riskDoc = new Risk({
            customer_name: customerName,
            lead_id: leadId,
            weights: riskData.weights,
            financial_strength: riskData.financial_strength,
            management_quality: riskData.management_quality,
            industry_risk: riskData.industry_risk,
            total_score: riskData.total_score,
            risk_bucket: riskData.risk_bucket,
            red_flags: riskData.red_flags
          });
          await riskDoc.save();
          console.log('Risk rating saved to MongoDB');
        }

        // 4. Save Summary
        if (fs.existsSync(summariesPath)) {
          const summaryData = JSON.parse(fs.readFileSync(summariesPath, 'utf8'));
          
          // Parse the summary data to match the model structure
          const summaryDoc = new Summary({
            customer_name: customerName,
            lead_id: leadId,
            financial_summary: summaryData['financial_summary_&_ratios'],
            executive_summary: summaryData.executive_summary,
            financial_summary_and_ratios: summaryData['financial_summary_&_ratios'] ? {
              "Revenue and Profitability": summaryData['financial_summary_&_ratios'].split('Revenue and Profitability:')[1]?.split('Operational efficiency:')[0]?.trim() || '',
              "Operational Efficiency": summaryData['financial_summary_&_ratios'].split('Operational efficiency:')[1]?.split('Leverage and liquidity:')[0]?.trim() || '',
              "Leverage and Liquidity": summaryData['financial_summary_&_ratios'].split('Leverage and liquidity:')[1]?.trim() || ''
            } : {},
            loan_purpose: summaryData.loan_purpose ? [summaryData.loan_purpose] : [],
            swot_analysis: summaryData.swot_analysis ? {
              Strengths: summaryData.swot_analysis.split('Strengths:')[1]?.split('Weaknesses:')[0]?.split(';').map(s => s.trim()).filter(s => s) || [],
              Weaknesses: summaryData.swot_analysis.split('Weaknesses:')[1]?.split('Opportunities:')[0]?.split(';').map(s => s.trim()).filter(s => s) || [],
              Opportunities: summaryData.swot_analysis.split('Opportunities:')[1]?.split('Threats:')[0]?.split(';').map(s => s.trim()).filter(s => s) || [],
              Threats: summaryData.swot_analysis.split('Threats:')[1]?.split(';').map(s => s.trim()).filter(s => s) || []
            } : {},
            security_offered: summaryData.security_offered ? {
              primary_security: summaryData.security_offered.split('Primary Security:')[1]?.split('Collateral Security:')[0]?.split(';').map(s => s.trim()).filter(s => s) || [],
              collateral_security: summaryData.security_offered.split('Collateral Security:')[1]?.split('Personal Guarantees:')[0]?.split(';').map(s => s.trim()).filter(s => s) || [],
              personal_guarantees: summaryData.security_offered.split('Personal Guarantees:')[1]?.split(';').map(s => s.trim()).filter(s => s) || []
            } : {},
            recommendation: summaryData.recommendation ? [summaryData.recommendation] : []
          });
          await summaryDoc.save();
          console.log('Summary saved to MongoDB');
        }

        // Update lead with analysis status
        lead.analysis_status = 'completed';
        lead.analysis_date = new Date().toISOString();
        await lead.save();

        // Clean up temporary files
        fs.rmSync(tempDir, { recursive: true, force: true });

        console.log(`BFSI-LOS pipeline completed for lead ${leadId}`);
        res.json({
          success: true,
          message: 'Financial analysis completed successfully',
          leadId: leadId,
          customerName: customerName
        });

      } catch (readError) {
        console.error('Error reading analysis results:', readError);
        res.status(500).json({ error: 'Failed to read analysis results', details: readError.message });
      }
    });

  } catch (error) {
    console.error('Error in BFSI-LOS pipeline:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

module.exports = router;
