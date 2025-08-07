const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const memoRoutes = require('./routes/memoRoutes'); // Adjust if in a different folder
const analysisRoutes = require('./routes/analysisRoutes'); // Adjust if in a different folder
const riskRoutes = require("./routes/riskRoutes")
const dashboardRoutes = require('./routes/dashboardRoutes');
const qcRoutes = require('./routes/qcRoutes'); // ⬅️ Add this at the top with other routes


dotenv.config();

const app = express();
app.use(cors()); // Enable CORS for all origins (for development)
app.use(express.json());

// 🔹 MongoDB connection
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// 🔹 Test route to check if backend is running
app.get('/', (req, res) => {
  res.send('Backend is running');
});

// 🔹 Routes
app.use('/memos', memoRoutes); // All memo-related routes prefixed with /memos
app.use('/analysis', analysisRoutes);
app.use('/risk', riskRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/cq', qcRoutes); // ⬅️ Add this with other route usages

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
