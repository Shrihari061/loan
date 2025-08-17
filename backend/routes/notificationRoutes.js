const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Lead = require('../models/Lead');

// Get all notifications for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.params.userId })
      .sort({ created_at: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new notification
router.post('/', async (req, res) => {
  try {
    const notification = new Notification(req.body);
    const savedNotification = await notification.save();
    res.status(201).json(savedNotification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create lead reminder notification (for leads not submitted after a month)
router.post('/lead-reminder', async (req, res) => {
  try {
    const { lead_id, user_id, business_name } = req.body;
    
    // Check if notification already exists for this lead
    const existingNotification = await Notification.findOne({
      lead_id: lead_id,
      type: 'lead_reminder',
      is_read: false
    });

    if (existingNotification) {
      return res.status(400).json({ message: 'Reminder already exists for this lead' });
    }

    const notification = new Notification({
      user_id: user_id,
      title: 'Lead Submission Reminder',
      message: `Saved item "${business_name}" needs to be Submitted.`,
      type: 'lead_reminder',
      lead_id: lead_id,
      priority: 'high'
    });

    const savedNotification = await notification.save();
    res.status(201).json(savedNotification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Check for leads that need reminders (to be called by a scheduler)
router.post('/check-lead-reminders', async (req, res) => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const leadsNeedingReminders = await Lead.find({
      status: 'Draft',
      created_date: { $lt: oneMonthAgo }
    });

    const createdNotifications = [];

    for (const lead of leadsNeedingReminders) {
      // Check if notification already exists
      const existingNotification = await Notification.findOne({
        lead_id: lead._id.toString(),
        type: 'lead_reminder',
        is_read: false
      });

      if (!existingNotification) {
        const notification = new Notification({
          user_id: lead.user_id || 'default_rm',
          title: 'Lead Submission Reminder',
          message: `Saved item "${lead.business_name}" needs to be Submitted.`,
          type: 'lead_reminder',
          lead_id: lead._id.toString(),
          priority: 'high'
        });

        const savedNotification = await notification.save();
        createdNotifications.push(savedNotification);
      }
    }

    res.json({ 
      message: `${createdNotifications.length} reminders created`,
      notifications: createdNotifications 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 