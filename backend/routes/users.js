const express = require('express');
const Note = require('../models/Note');
const Progress = require('../models/Progress');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile with stats
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = req.user;

    // Get user statistics
    const progressCount = await Progress.countDocuments({ user: user._id });
    const completedCourses = await Progress.countDocuments({
      user: user._id,
      status: 'completed'
    });
    const notesCount = await Note.countDocuments({ user: user._id });

    const stats = {
      totalCourses: progressCount,
      completedCourses,
      totalNotes: notesCount,
      xp: user.xp,
      level: user.level,
      streak: user.streak
    };

    res.json({
      success: true,
      user,
      stats
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/notes
// @desc    Get user's notes
// @access  Private
router.get('/notes', auth, async (req, res) => {
  try {
    const { course, category, search } = req.query;

    let query = { user: req.user._id, isArchived: false };

    if (course) query['context.course'] = course;
    if (category) query.category = category;

    let notes;
    if (search) {
      notes = await Note.searchNotes(req.user._id, search, { course });
    } else {
      notes = await Note.findByUser(req.user._id, { course, category });
    }

    res.json({
      success: true,
      notes
    });

  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/users/notes
// @desc    Create new note
// @access  Private
router.post('/notes', [
  auth,
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title required'),
  body('content').trim().isLength({ min: 1, max: 5000 }).withMessage('Content required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const noteData = {
      ...req.body,
      user: req.user._id
    };

    const note = new Note(noteData);
    await note.save();

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      note
    });

  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/notes/:id
// @desc    Update note
// @access  Private
router.put('/notes/:id', [
  auth,
  body('title').optional().trim().isLength({ min: 1, max: 100 }),
  body('content').optional().trim().isLength({ min: 1, max: 5000 })
], async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Note updated successfully',
      note: updatedNote
    });

  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/users/notes/:id
// @desc    Delete note
// @access  Private
router.delete('/notes/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    await Note.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });

  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
