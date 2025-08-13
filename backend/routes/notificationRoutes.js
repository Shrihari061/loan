const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Lead = require('../models/Lead');

// Get all notifications for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      user_id: req.params.userId 
    }).sort({ created_at: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread notifications count
router.get('/unread/:userId', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      user_id: req.params.userId,
      is_read: false 
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.put('/read/:id', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { is_read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all notifications as read for a user
router.put('/read-all/:userId', async (req, res) => {
  try {
    await Notification.updateMany(
      { user_id: req.params.userId, is_read: false },
      { is_read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Create a new notification
router.post('/', async (req, res) => {
  try {
    const newNotification = new Notification(req.body);
    await newNotification.save();
    res.status(201).json(newNotification);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Create lead reminder notification (for leads not submitted after a month)
router.post('/lead-reminder', async (req, res) => {
  try {
    const { lead_id, user_id, business_name } = req.body;
    
    const notification = new Notification({
      user_id,
      title: 'Lead Submission Reminder',
      message: `Saved item "${business_name}" needs to be Submitted.`,
      type: 'lead_reminder',
      lead_id,
      priority: 'high'
    });
    
    await notification.save();
    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create lead reminder' });
  }
});

// Check for leads that need reminders (to be called by a scheduler)
router.post('/check-lead-reminders', async (req, res) => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    // Find leads that are in draft status and were created more than a month ago
    const leadsNeedingReminders = await Lead.find({
      status: 'Draft',
      created_date: { $lt: oneMonthAgo }
    });
    
    const notifications = [];
    
    for (const lead of leadsNeedingReminders) {
      // Check if notification already exists for this lead
      const existingNotification = await Notification.findOne({
        lead_id: lead._id.toString(),
        type: 'lead_reminder'
      });
      
      if (!existingNotification) {
        // Create notification for the assigned RM/BM
        const notification = new Notification({
          user_id: lead.user_id || 'default_rm', // Use the actual RM/BM ID assigned to the lead
          title: 'Lead Submission Reminder',
          message: `Saved item "${lead.business_name}" needs to be Submitted.`,
          type: 'lead_reminder',
          lead_id: lead._id.toString(),
          priority: 'high'
        });
        
        await notification.save();
        notifications.push(notification);
      }
    }
    
    res.json({ 
      message: `Created ${notifications.length} lead reminder notifications`,
      notifications 
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check lead reminders' });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const deletedNotification = await Notification.findByIdAndDelete(req.params.id);
    if (!deletedNotification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

module.exports = router; 