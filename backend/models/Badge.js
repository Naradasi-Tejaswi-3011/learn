const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Badge name is required'],
    trim: true,
    maxlength: [50, 'Badge name cannot be more than 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Badge description is required'],
    maxlength: [200, 'Badge description cannot be more than 200 characters']
  },
  icon: {
    type: String,
    required: [true, 'Badge icon is required'],
    default: '🏆'
  },
  color: {
    type: String,
    default: '#FFD700' // Gold color
  },
  category: {
    type: String,
    enum: [
      'achievement',    // General achievements
      'streak',        // Login streaks
      'completion',    // Course/module completion
      'performance',   // High scores, perfect quizzes
      'participation', // Active participation
      'milestone',     // XP milestones
      'special'        // Special events, challenges
    ],
    required: [true, 'Badge category is required']
  },
  type: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze'
  },
  // Badge requirements
  requirements: {
    // XP-based requirements
    xpThreshold: {
      type: Number,
      default: 0
    },
    // Streak-based requirements
    streakDays: {
      type: Number,
      default: 0
    },
    // Course completion requirements
    coursesCompleted: {
      type: Number,
      default: 0
    },
    // Quiz performance requirements
    quizzesPassed: {
      type: Number,
      default: 0
    },
    perfectQuizzes: {
      type: Number,
      default: 0
    },
    averageQuizScore: {
      type: Number,
      default: 0
    },
    // Time-based requirements
    totalStudyTime: {
      type: Number, // in hours
      default: 0
    },
    // Module completion requirements
    modulesCompleted: {
      type: Number,
      default: 0
    },
    // Specific course requirements
    specificCourse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    // Custom requirements (for special badges)
    customRequirement: {
      type: String,
      trim: true
    }
  },
  // Badge rewards
  rewards: {
    xpBonus: {
      type: Number,
      default: 0
    },
    unlockContent: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    }],
    specialPrivileges: [{
      type: String,
      enum: ['early_access', 'exclusive_content', 'priority_support', 'custom_avatar']
    }]
  },
  // Badge metadata
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isHidden: {
    type: Boolean,
    default: false // Hidden badges are not shown until earned
  },
  // Statistics
  totalEarned: {
    type: Number,
    default: 0
  },
  // Badge series (for progressive badges)
  series: {
    name: {
      type: String,
      trim: true
    },
    order: {
      type: Number,
      default: 1
    },
    nextBadge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge'
    }
  }
}, {
  timestamps: true
});

// User Badge Schema (for tracking user's earned badges)
const userBadgeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  badge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge',
    required: true
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    type: Number,
    default: 100, // Percentage progress towards earning the badge
    min: 0,
    max: 100
  },
  // Context of earning the badge
  earnedFor: {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz'
    },
    achievement: {
      type: String,
      trim: true
    }
  },
  // Badge display settings
  isDisplayed: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
badgeSchema.index({ category: 1 });
badgeSchema.index({ type: 1 });
badgeSchema.index({ rarity: 1 });
badgeSchema.index({ isActive: 1 });
badgeSchema.index({ 'series.name': 1, 'series.order': 1 });

userBadgeSchema.index({ user: 1 });
userBadgeSchema.index({ badge: 1 });
userBadgeSchema.index({ user: 1, badge: 1 }, { unique: true });
userBadgeSchema.index({ earnedAt: -1 });

// Method to check if user meets badge requirements
badgeSchema.methods.checkRequirements = function(userStats) {
  const req = this.requirements;
  
  // Check XP threshold
  if (req.xpThreshold > 0 && userStats.xp < req.xpThreshold) {
    return false;
  }
  
  // Check streak days
  if (req.streakDays > 0 && userStats.streak.longest < req.streakDays) {
    return false;
  }
  
  // Check courses completed
  if (req.coursesCompleted > 0 && userStats.coursesCompleted < req.coursesCompleted) {
    return false;
  }
  
  // Check quizzes passed
  if (req.quizzesPassed > 0 && userStats.quizzesPassed < req.quizzesPassed) {
    return false;
  }
  
  // Check perfect quizzes
  if (req.perfectQuizzes > 0 && userStats.perfectQuizzes < req.perfectQuizzes) {
    return false;
  }
  
  // Check average quiz score
  if (req.averageQuizScore > 0 && userStats.averageQuizScore < req.averageQuizScore) {
    return false;
  }
  
  // Check total study time
  if (req.totalStudyTime > 0 && userStats.totalStudyTime < req.totalStudyTime) {
    return false;
  }
  
  // Check modules completed
  if (req.modulesCompleted > 0 && userStats.modulesCompleted < req.modulesCompleted) {
    return false;
  }
  
  // Check specific course completion
  if (req.specificCourse && !userStats.completedCourses.includes(req.specificCourse.toString())) {
    return false;
  }
  
  return true;
};

// Method to calculate progress towards badge
badgeSchema.methods.calculateProgress = function(userStats) {
  const req = this.requirements;
  let progressFactors = [];
  
  // Calculate progress for each requirement
  if (req.xpThreshold > 0) {
    progressFactors.push(Math.min(100, (userStats.xp / req.xpThreshold) * 100));
  }
  
  if (req.streakDays > 0) {
    progressFactors.push(Math.min(100, (userStats.streak.longest / req.streakDays) * 100));
  }
  
  if (req.coursesCompleted > 0) {
    progressFactors.push(Math.min(100, (userStats.coursesCompleted / req.coursesCompleted) * 100));
  }
  
  if (req.quizzesPassed > 0) {
    progressFactors.push(Math.min(100, (userStats.quizzesPassed / req.quizzesPassed) * 100));
  }
  
  if (req.perfectQuizzes > 0) {
    progressFactors.push(Math.min(100, (userStats.perfectQuizzes / req.perfectQuizzes) * 100));
  }
  
  if (req.modulesCompleted > 0) {
    progressFactors.push(Math.min(100, (userStats.modulesCompleted / req.modulesCompleted) * 100));
  }
  
  // Return minimum progress (all requirements must be met)
  return progressFactors.length > 0 ? Math.min(...progressFactors) : 100;
};

// Static method to create default badges
badgeSchema.statics.createDefaultBadges = async function() {
  const defaultBadges = [
    {
      name: 'First Steps',
      description: 'Complete your first lesson',
      icon: '👶',
      category: 'achievement',
      type: 'bronze',
      requirements: { modulesCompleted: 1 },
      rewards: { xpBonus: 10 }
    },
    {
      name: 'Quiz Master',
      description: 'Pass 10 quizzes',
      icon: '🧠',
      category: 'performance',
      type: 'silver',
      requirements: { quizzesPassed: 10 },
      rewards: { xpBonus: 50 }
    },
    {
      name: 'Perfect Score',
      description: 'Get 100% on a quiz',
      icon: '💯',
      category: 'performance',
      type: 'gold',
      requirements: { perfectQuizzes: 1 },
      rewards: { xpBonus: 25 }
    },
    {
      name: 'Streak Warrior',
      description: 'Maintain a 7-day login streak',
      icon: '🔥',
      category: 'streak',
      type: 'silver',
      requirements: { streakDays: 7 },
      rewards: { xpBonus: 30 }
    },
    {
      name: 'Knowledge Seeker',
      description: 'Earn 1000 XP',
      icon: '📚',
      category: 'milestone',
      type: 'gold',
      requirements: { xpThreshold: 1000 },
      rewards: { xpBonus: 100 }
    },
    {
      name: 'Course Conqueror',
      description: 'Complete your first course',
      icon: '🏆',
      category: 'completion',
      type: 'gold',
      requirements: { coursesCompleted: 1 },
      rewards: { xpBonus: 200 }
    }
  ];

  for (const badgeData of defaultBadges) {
    const existingBadge = await this.findOne({ name: badgeData.name });
    if (!existingBadge) {
      await this.create(badgeData);
    }
  }
};

// Static method to find badges by category
badgeSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true }).sort({ 'series.order': 1, createdAt: 1 });
};

// Static method to find available badges for user
badgeSchema.statics.findAvailableForUser = function(userStats) {
  return this.find({ isActive: true }).then(badges => {
    return badges.filter(badge => !badge.isHidden || badge.checkRequirements(userStats));
  });
};

const Badge = mongoose.model('Badge', badgeSchema);
const UserBadge = mongoose.model('UserBadge', userBadgeSchema);

module.exports = { Badge, UserBadge };
