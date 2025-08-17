const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user_id: { type: String, required: true }, // RM/BM ID
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['lead_reminder', 'system', 'approval', 'rejection'],
    default: 'system'
  },
  lead_id: { type: String }, // Reference to the lead if notification is lead-related
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  scheduled_for: { type: Date }, // For scheduled notifications like monthly reminders
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
});

module.exports = mongoose.model('Notification', NotificationSchema, 'notifications'); 