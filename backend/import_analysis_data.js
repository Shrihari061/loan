const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import models
const Lead = require('./models/Lead');
const ExtractedValues = require('./models/ExtractedValues');
const Ratios = require('./models/Ratios');
const Risk = require('./models/Risk');
const Summary = require('./models/Summary');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/LOMAS');

async function importAnalysisData(leadId, tempDir) {
  try {
    console.log(`Importing analysis data for lead ${leadId}...`);
    
    // Get lead info
    const lead = await Lead.findById(leadId);
    if (!lead) {
      console.error('Lead not found');
      return;
    }
    
    const customerName = lead.business_name || 'Unknown Company';
    const extractionsPath = path.join(tempDir, 'Extractions');
    
    // 1. Import Extracted Values
    const extractedValuesPath = path.join(extractionsPath, 'extracted_values.json');
    if (fs.existsSync(extractedValuesPath)) {
      const extractedData = JSON.parse(fs.readFileSync(extractedValuesPath, 'utf8'));
      
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
        data: Object.fromEntries(dataMap)
      });
      
      await extractedValuesDoc.save();
      console.log('✅ Extracted values saved');
    }
    
    // 2. Import Ratios
    const ratiosPath = path.join(extractionsPath, 'ratios.json');
    if (fs.existsSync(ratiosPath)) {
      const ratiosData = JSON.parse(fs.readFileSync(ratiosPath, 'utf8'));
      
      const ratiosDoc = new Ratios({
        customer_name: customerName,
        lead_id: leadId,
        data: ratiosData
      });
      
      await ratiosDoc.save();
      console.log('✅ Ratios saved');
    }
    
    // 3. Import Risk Rating
    const riskRatingPath = path.join(extractionsPath, 'risk_rating.json');
    if (fs.existsSync(riskRatingPath)) {
      const riskData = JSON.parse(fs.readFileSync(riskRatingPath, 'utf8'));
      
      const riskDoc = new Risk({
        customer_name: customerName,
        lead_id: leadId,
        data: riskData
      });
      
      await riskDoc.save();
      console.log('✅ Risk rating saved');
    }
    
    // 4. Import Summaries
    const summariesPath = path.join(extractionsPath, 'summaries.json');
    if (fs.existsSync(summariesPath)) {
      const summariesData = JSON.parse(fs.readFileSync(summariesPath, 'utf8'));
      
      const summaryDoc = new Summary({
        customer_name: customerName,
        lead_id: leadId,
        financial_summary_and_ratios: summariesData
      });
      
      await summaryDoc.save();
      console.log('✅ Summaries saved');
    }
    
    // 5. Update lead status
    await Lead.findByIdAndUpdate(leadId, {
      analysis_status: 'completed',
      analysis_date: new Date().toISOString()
    });
    
    console.log('✅ Lead status updated to completed');
    console.log(`🎉 Analysis data import completed for lead ${leadId}`);
    
  } catch (error) {
    console.error('Error importing analysis data:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Get leadId from command line arguments
const leadId = process.argv[2];
const tempDir = process.argv[3];

if (!leadId || !tempDir) {
  console.error('Usage: node import_analysis_data.js <leadId> <tempDir>');
  process.exit(1);
}

importAnalysisData(leadId, tempDir); 