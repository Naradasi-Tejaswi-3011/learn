const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const StudySession = require('../models/StudySession');

// @route   POST /api/study-sessions
// @desc    Start a new study session
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      sessionType = 'focus-study',
      plannedDuration,
      breakInterval = 1500,
      breakDuration = 300,
      pdfFile,
      studyGoal = 10,
      faceDetectionEnabled = true,
      settings = {}
    } = req.body;

    const studySession = new StudySession({
      user: req.user.id,
      sessionType,
      startTime: new Date(),
      plannedDuration,
      breakInterval,
      breakDuration,
      pdfFile,
      progress: {
        studyGoal,
        currentPage: 1,
        totalPages: pdfFile?.totalPages || 0,
        pagesRead: 0
      },
      faceDetection: {
        enabled: faceDetectionEnabled
      },
      settings: {
        musicEnabled: settings.musicEnabled || false,
        musicType: settings.musicType || 'lofi',
        focusMode: settings.focusMode || false,
        zoomLevel: settings.zoomLevel || 1.5,
        rotation: settings.rotation || 0
      }
    });

    await studySession.save();

    res.status(201).json({
      message: 'Study session started successfully',
      session: studySession
    });

  } catch (error) {
    console.error('Error starting study session:', error);
    res.status(500).json({ message: 'Error starting study session' });
  }
});

// @route   PUT /api/study-sessions/:id
// @desc    Update study session progress
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      duration,
      status,
      pauseReason,
      progress,
      faceDetection,
      distractions,
      settings,
      notes
    } = req.body;

    const studySession = await StudySession.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!studySession) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    // Update fields if provided
    if (duration !== undefined) studySession.duration = duration;
    if (status) studySession.status = status;
    if (pauseReason) studySession.pauseReason = pauseReason;
    
    if (progress) {
      Object.assign(studySession.progress, progress);
    }
    
    if (faceDetection) {
      Object.assign(studySession.faceDetection, faceDetection);
    }
    
    if (distractions) {
      Object.assign(studySession.distractions, distractions);
    }
    
    if (settings) {
      Object.assign(studySession.settings, settings);
    }
    
    if (notes) {
      studySession.notes = notes;
    }

    // Set end time if session is completed or cancelled
    if (status === 'completed' || status === 'cancelled') {
      studySession.endTime = new Date();
    }

    await studySession.save();

    res.json({
      message: 'Study session updated successfully',
      session: studySession
    });

  } catch (error) {
    console.error('Error updating study session:', error);
    res.status(500).json({ message: 'Error updating study session' });
  }
});

// @route   GET /api/study-sessions
// @desc    Get user's study sessions
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, sessionType } = req.query;
    
    const query = { user: req.user.id };
    if (status) query.status = status;
    if (sessionType) query.sessionType = sessionType;

    const studySessions = await StudySession.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await StudySession.countDocuments(query);

    res.json({
      sessions: studySessions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Error fetching study sessions:', error);
    res.status(500).json({ message: 'Error fetching study sessions' });
  }
});

// @route   GET /api/study-sessions/:id
// @desc    Get specific study session
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const studySession = await StudySession.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!studySession) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    res.json({ session: studySession });

  } catch (error) {
    console.error('Error fetching study session:', error);
    res.status(500).json({ message: 'Error fetching study session' });
  }
});

// @route   GET /api/study-sessions/analytics/summary
// @desc    Get study analytics summary
// @access  Private
router.get('/analytics/summary', auth, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '1d':
        dateFilter = { createdAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) } };
        break;
      case '7d':
        dateFilter = { createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30d':
        dateFilter = { createdAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
        break;
      case '90d':
        dateFilter = { createdAt: { $gte: new Date(now - 90 * 24 * 60 * 60 * 1000) } };
        break;
    }

    const sessions = await StudySession.find({
      user: req.user.id,
      ...dateFilter
    });

    const analytics = {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      totalStudyTime: sessions.reduce((sum, s) => sum + s.duration, 0),
      effectiveStudyTime: sessions.reduce((sum, s) => sum + s.analytics.effectiveStudyTime, 0),
      averageFocusScore: sessions.length > 0 
        ? sessions.reduce((sum, s) => sum + s.analytics.focusScore, 0) / sessions.length 
        : 0,
      averageProductivityScore: sessions.length > 0 
        ? sessions.reduce((sum, s) => sum + s.analytics.productivityScore, 0) / sessions.length 
        : 0,
      totalPagesRead: sessions.reduce((sum, s) => sum + s.progress.pagesRead, 0),
      totalDistractions: sessions.reduce((sum, s) => 
        sum + s.distractions.tabSwitches + s.distractions.fullscreenExits, 0),
      faceDetectionStats: {
        totalAwayTime: sessions.reduce((sum, s) => sum + s.faceDetection.totalAwayTime, 0),
        averageAwayCount: sessions.length > 0 
          ? sessions.reduce((sum, s) => sum + s.faceDetection.awayCount, 0) / sessions.length 
          : 0
      }
    };

    res.json({ analytics, period });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
});

// @route   DELETE /api/study-sessions/:id
// @desc    Delete study session
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const studySession = await StudySession.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!studySession) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    res.json({ message: 'Study session deleted successfully' });

  } catch (error) {
    console.error('Error deleting study session:', error);
    res.status(500).json({ message: 'Error deleting study session' });
  }
});

module.exports = router;
