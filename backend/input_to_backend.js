const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://shriharir:shriharir@cluster0.orh9uhk.mongodb.net/LOMAS?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// CQ schema
const documentSchema = new mongoose.Schema({
  customer_id: String,
  customer_name: String,
  loan_id: String,
  documents: [
    {
      filename: String,
      upload_date: Date,
      file_data: Buffer,
      notes: { type: String, default: '' },
      status: { type: String, enum: ['Pending', 'Approved', 'Declined'], default: 'Pending' }
    }
  ]
});

const CQ = mongoose.model('cq', documentSchema);

// Hardcoded values
const HARDCODED_CUSTOMER = {
  customer_id: "CUST-0011",
  customer_name: "John Doee",
  loan_id: "LOAN/2023/YPL/114"
};

// Upload PDF file with hardcoded metadata
app.post('/api/cq/upload', upload.array('pdfs'), async (req, res) => {
  try {
    const uploadedDocs = req.files.map((file) => ({
      filename: file.originalname,
      upload_date: new Date(),
      file_data: fs.readFileSync(file.path),
      notes: "Initial draft, needs review",
      status: "Pending"
    }));

    let record = await CQ.findOne({ customer_id: HARDCODED_CUSTOMER.customer_id });

    if (record) {
      record.documents.push(...uploadedDocs);
      await record.save();
    } else {
      await CQ.create({
        ...HARDCODED_CUSTOMER,
        documents: uploadedDocs
      });
    }

    // Clean up temp files
    req.files.forEach(file => fs.unlinkSync(file.path));

    res.status(200).json({ message: 'PDF(s) uploaded successfully with hardcoded metadata.' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload PDFs.' });
  }
});

app.listen(5000, () => console.log('Server running on http://localhost:5000'));
