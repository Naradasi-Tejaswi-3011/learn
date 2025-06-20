const express = require('express');
const Progress = require('../models/Progress');
const Course = require('../models/Course');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/progress
// @desc    Get user's progress for all courses
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const progress = await Progress.findByUser(req.user._id);

    res.json({
      success: true,
      progress
    });

  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/progress/:courseId
// @desc    Get user's progress for specific course
// @access  Private
router.get('/:courseId', auth, async (req, res) => {
  try {
    const progress = await Progress.findOne({
      user: req.user._id,
      course: req.params.courseId
    }).populate('course', 'title modules');

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found'
      });
    }

    res.json({
      success: true,
      progress
    });

  } catch (error) {
    console.error('Get course progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/progress/:courseId/module/:moduleId
// @desc    Update module progress
// @access  Private
router.put('/:courseId/module/:moduleId', auth, async (req, res) => {
  try {
    const { contentId, contentType, progress: contentProgress, timeSpent, completed, videoProgress } = req.body;

    console.log('Updating progress:', {
      courseId: req.params.courseId,
      moduleId: req.params.moduleId,
      contentId,
      contentType,
      contentProgress,
      timeSpent,
      completed
    });

    let progress = await Progress.findOne({
      user: req.user._id,
      course: req.params.courseId
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found'
      });
    }

    // Update total time spent
    if (timeSpent) {
      progress.totalTimeSpent += timeSpent;
    }

    const updateData = {
      contentId,
      contentType,
      progress: completed ? 100 : (contentProgress || 0),
      timeSpent: timeSpent || 0,
      videoProgress: videoProgress || {},
      status: completed ? 'completed' : 'in_progress'
    };

    await progress.updateModuleProgress(req.params.moduleId, updateData);

    // Check if course is now complete (all modules at 100%)
    const allModulesComplete = progress.moduleProgress.every(module => module.progress === 100);
    const courseCompleted = allModulesComplete && progress.status !== 'completed';

    if (courseCompleted) {
      progress.status = 'completed';
      progress.completedAt = new Date();
      await progress.save();

      console.log('Course completed! Awarding XP...');

      // Award XP for course completion
      try {
        const axios = require('axios');
        await axios.post(`http://localhost:5000/api/gamification/xp`, {
          points: 200,
          reason: 'Course completion'
        }, {
          headers: {
            'Authorization': req.headers.authorization
          }
        });
      } catch (xpError) {
        console.error('Error awarding course completion XP:', xpError);
      }
    }

    res.json({
      success: true,
      message: 'Progress updated successfully',
      progress,
      courseCompleted
    });

  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
