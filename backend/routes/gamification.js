const express = require('express');
const { Badge, UserBadge } = require('../models/Badge');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/gamification/badges
// @desc    Get user's badges
// @access  Private
router.get('/badges', auth, async (req, res) => {
  try {
    const userBadges = await UserBadge.find({ user: req.user._id })
      .populate('badge')
      .sort({ earnedAt: -1 });

    const availableBadges = await Badge.find({ isActive: true });

    res.json({
      success: true,
      earnedBadges: userBadges,
      availableBadges
    });

  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/gamification/xp
// @desc    Award XP to user
// @access  Private
router.post('/xp', auth, async (req, res) => {
  try {
    const { points, reason } = req.body;

    const user = await User.findById(req.user._id);
    const oldLevel = user.level;

    user.addXP(points);
    await user.save();

    const leveledUp = user.level > oldLevel;

    res.json({
      success: true,
      message: `Earned ${points} XP!`,
      xp: user.xp,
      level: user.level,
      leveledUp,
      reason
    });

  } catch (error) {
    console.error('Award XP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/gamification/leaderboard
// @desc    Get XP leaderboard
// @access  Private
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const topUsers = await User.find({ isActive: true })
      .select('name avatar xp level')
      .sort({ xp: -1 })
      .limit(10);

    const userRank = await User.countDocuments({
      isActive: true,
      xp: { $gt: req.user.xp }
    }) + 1;

    res.json({
      success: true,
      leaderboard: topUsers,
      userRank
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/gamification/init-badges
// @desc    Initialize default badges (admin only)
// @access  Public (for demo purposes)
router.post('/init-badges', async (req, res) => {
  try {
    await Badge.createDefaultBadges();

    res.json({
      success: true,
      message: 'Default badges initialized successfully'
    });

  } catch (error) {
    console.error('Initialize badges error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/gamification/quiz-complete
// @desc    Handle quiz completion and award badges
// @access  Private
router.post('/quiz-complete', auth, async (req, res) => {
  try {
    const { topic, score, totalQuestions, xpGained } = req.body;

    const user = await User.findById(req.user._id);
    const newBadges = [];

    // Check for various badge conditions
    const percentage = Math.round((score / totalQuestions) * 100);

    // Perfect score badge
    if (percentage === 100 && !user.badges.includes('perfect_score')) {
      user.badges.push('perfect_score');
      newBadges.push({
        id: 'perfect_score',
        name: 'Perfect Score',
        description: 'Get 100% on any quiz',
        icon: '💯'
      });
    }

    // First quiz badge
    if (!user.badges.includes('first_quiz')) {
      user.badges.push('first_quiz');
      newBadges.push({
        id: 'first_quiz',
        name: 'Getting Started',
        description: 'Complete your first quiz',
        icon: '🎯'
      });
    }

    // Quiz master badge (10 quizzes)
    const quizCount = (user.stats?.quizzesCompleted || 0) + 1;
    if (quizCount >= 10 && !user.badges.includes('quiz_master')) {
      user.badges.push('quiz_master');
      newBadges.push({
        id: 'quiz_master',
        name: 'Quiz Master',
        description: 'Complete 10 quizzes',
        icon: '🏆'
      });
    }

    // Update user stats
    if (!user.stats) {
      user.stats = {
        quizzesCompleted: 0,
        totalCorrect: 0,
        totalQuestions: 0,
        perfectScores: 0
      };
    }

    user.stats.quizzesCompleted = quizCount;
    user.stats.totalCorrect = (user.stats.totalCorrect || 0) + score;
    user.stats.totalQuestions = (user.stats.totalQuestions || 0) + totalQuestions;

    if (percentage === 100) {
      user.stats.perfectScores = (user.stats.perfectScores || 0) + 1;
    }

    await user.save();

    res.json({
      success: true,
      newBadges,
      userStats: user.stats
    });

  } catch (error) {
    console.error('Quiz completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
