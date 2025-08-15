const mongoose = require('mongoose');

// -------------------- FILE SCHEMAS --------------------
const FileSchema = new mongoose.Schema({
  fileName: String,
  fileType: String,
  fileSize: Number,
  fileData: Buffer // Store file directly in MongoDB
});

// -------------------- SUB-SCHEMAS --------------------
const AddressSchema = new mongoose.Schema({
  line1: String,
  city: String,
  state: String,
  country: String
});

const DirectorSchema = new mongoose.Schema({
  din: String,
  firstName: String,
  lastName: String
});

// -------------------- MAIN LEAD SCHEMA --------------------
const LeadSchema = new mongoose.Schema({
  // Lead Identification
  lead_id: {
    type: String,
    unique: true
    // default: () => 'LEAD-' + Math.random().toString(36).substring(2, 10).toUpperCase()
  },

  // Company Identification
  cin: String, // CIN Number
  registration_no: String, // Company Registration Number (if different from CIN)
  business_name: { type: String, required: true },
  incorporated_date: String, // Date of Incorporation

  // Contact & Address
  contact_email: String,
  address: AddressSchema, // Structured address
  business_address: String, // Optional full address string

  // Directors
  directors: [DirectorSchema],

  // Contact Person
  contact_person: String,
  contact_phone: String,
  designation: String,

  // Loan Info
  loan_type: { type: String, required: true },
  loan_amount: { type: Number, required: true },

  // AML Statuses
  aml_company_status: {
    type: String,
    enum: ['idle', 'initiated', 'pending', 'done', 'failed'],
    default: 'idle'
  },
  aml_director_status: {
    type: String,
    enum: ['idle', 'initiated', 'pending', 'done', 'failed'],
    default: 'idle'
  },

  // Meta
  last_updated: { type: String, required: true },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'],
    default: 'Draft'
  },
  created_date: { type: Date, default: Date.now },
  notes: String,

  // Files
  financialDocuments: [FileSchema],
  signature: FileSchema
});

module.exports = mongoose.model('Lead', LeadSchema, 'leads');
