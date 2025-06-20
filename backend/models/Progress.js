const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    answer: {
      type: mongoose.Schema.Types.Mixed, // Can be string, number, or array
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0
    }
  }],
  score: {
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    earnedPoints: {
      type: Number,
      required: true,
      default: 0
    },
    totalPoints: {
      type: Number,
      required: true,
      default: 0
    }
  },
  passed: {
    type: Boolean,
    required: true
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  xpEarned: {
    type: Number,
    default: 0
  }
});

const contentProgressSchema = new mongoose.Schema({
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  contentType: {
    type: String,
    enum: ['video', 'text', 'quiz', 'flashcard'],
    required: true
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  progress: {
    type: Number, // percentage (0-100)
    default: 0,
    min: 0,
    max: 100
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  // Video-specific progress
  videoProgress: {
    watchedDuration: {
      type: Number, // in seconds
      default: 0
    },
    totalDuration: {
      type: Number, // in seconds
      default: 0
    },
    watchedPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  // Quiz-specific progress
  quizAttempts: [quizAttemptSchema],
  bestQuizScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Flashcard-specific progress
  flashcardProgress: {
    totalCards: {
      type: Number,
      default: 0
    },
    masteredCards: {
      type: Number,
      default: 0
    },
    reviewCount: {
      type: Number,
      default: 0
    }
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
});

const moduleProgressSchema = new mongoose.Schema({
  module: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  progress: {
    type: Number, // percentage (0-100)
    default: 0,
    min: 0,
    max: 100
  },
  contentProgress: [contentProgressSchema],
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
});

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course reference is required']
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'dropped'],
    default: 'not_started'
  },
  overallProgress: {
    type: Number, // percentage (0-100)
    default: 0,
    min: 0,
    max: 100
  },
  moduleProgress: [moduleProgressSchema],
  // Performance metrics
  totalTimeSpent: {
    type: Number, // in seconds
    default: 0
  },
  totalXpEarned: {
    type: Number,
    default: 0
  },
  averageQuizScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completedModules: {
    type: Number,
    default: 0
  },
  totalModules: {
    type: Number,
    default: 0
  },
  // Adaptive learning data
  learningPath: {
    currentDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    recommendedContent: [{
      contentId: {
        type: mongoose.Schema.Types.ObjectId
      },
      contentType: {
        type: String,
        enum: ['video', 'text', 'quiz', 'flashcard']
      },
      reason: {
        type: String,
        enum: ['next_lesson', 'review', 'challenge', 'prerequisite']
      },
      priority: {
        type: Number,
        default: 1
      }
    }],
    weakAreas: [{
      topic: String,
      score: Number,
      lastReviewed: Date
    }],
    strongAreas: [{
      topic: String,
      score: Number
    }]
  },
  // Completion tracking
  completedAt: {
    type: Date
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateIssuedAt: {
    type: Date
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
progressSchema.index({ user: 1, course: 1 }, { unique: true });
progressSchema.index({ user: 1, status: 1 });
progressSchema.index({ course: 1, status: 1 });
progressSchema.index({ lastAccessedAt: -1 });

// Method to calculate overall progress
progressSchema.methods.calculateOverallProgress = function() {
  if (this.moduleProgress.length === 0) {
    this.overallProgress = 0;
    return 0;
  }

  const totalProgress = this.moduleProgress.reduce((sum, module) => sum + module.progress, 0);
  this.overallProgress = Math.round(totalProgress / this.moduleProgress.length);
  
  // Update status based on progress
  if (this.overallProgress === 100) {
    this.status = 'completed';
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  } else if (this.overallProgress > 0) {
    this.status = 'in_progress';
  }

  return this.overallProgress;
};

// Method to update module progress
progressSchema.methods.updateModuleProgress = function(moduleId, contentProgress) {
  let moduleProgressItem = this.moduleProgress.find(mp => mp.module.toString() === moduleId.toString());
  
  if (!moduleProgressItem) {
    moduleProgressItem = {
      module: moduleId,
      status: 'in_progress',
      progress: 0,
      contentProgress: [],
      startedAt: new Date(),
      lastAccessedAt: new Date()
    };
    this.moduleProgress.push(moduleProgressItem);
  }

  // Update content progress
  if (contentProgress) {
    let contentProgressItem = moduleProgressItem.contentProgress.find(
      cp => cp.contentId.toString() === contentProgress.contentId.toString()
    );

    if (!contentProgressItem) {
      contentProgressItem = {
        contentId: contentProgress.contentId,
        contentType: contentProgress.contentType,
        status: 'in_progress',
        progress: 0,
        startedAt: new Date()
      };
      moduleProgressItem.contentProgress.push(contentProgressItem);
    }

    // Update content progress data
    Object.assign(contentProgressItem, contentProgress, {
      lastAccessedAt: new Date()
    });

    if (contentProgressItem.progress === 100) {
      contentProgressItem.status = 'completed';
      contentProgressItem.completedAt = new Date();
    }
  }

  // Calculate module progress based on content progress
  if (moduleProgressItem.contentProgress.length > 0) {
    const totalContentProgress = moduleProgressItem.contentProgress.reduce(
      (sum, cp) => sum + cp.progress, 0
    );
    moduleProgressItem.progress = Math.round(totalContentProgress / moduleProgressItem.contentProgress.length);
  }

  if (moduleProgressItem.progress === 100) {
    moduleProgressItem.status = 'completed';
    moduleProgressItem.completedAt = new Date();
  }

  moduleProgressItem.lastAccessedAt = new Date();
  this.lastAccessedAt = new Date();

  // Recalculate overall progress
  this.calculateOverallProgress();

  return this.save();
};

// Method to add quiz attempt
progressSchema.methods.addQuizAttempt = function(moduleId, contentId, quizAttempt) {
  const moduleProgressItem = this.moduleProgress.find(mp => mp.module.toString() === moduleId.toString());
  if (!moduleProgressItem) return;

  const contentProgressItem = moduleProgressItem.contentProgress.find(
    cp => cp.contentId.toString() === contentId.toString()
  );
  if (!contentProgressItem) return;

  contentProgressItem.quizAttempts.push(quizAttempt);
  
  // Update best score
  if (quizAttempt.score.percentage > contentProgressItem.bestQuizScore) {
    contentProgressItem.bestQuizScore = quizAttempt.score.percentage;
  }

  // Update content progress based on quiz performance
  if (quizAttempt.passed) {
    contentProgressItem.progress = 100;
    contentProgressItem.status = 'completed';
    contentProgressItem.completedAt = new Date();
  }

  return this.save();
};

// Static method to find progress by user
progressSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId })
    .populate('course', 'title description thumbnail instructor')
    .sort({ lastAccessedAt: -1 });
};

// Static method to find progress by course
progressSchema.statics.findByCourse = function(courseId) {
  return this.find({ course: courseId })
    .populate('user', 'name email avatar')
    .sort({ overallProgress: -1 });
};

module.exports = mongoose.model('Progress', progressSchema);
