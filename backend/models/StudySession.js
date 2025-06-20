const mongoose = require('mongoose');

const StudySessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionType: {
    type: String,
    enum: ['focus-study', 'regular-study', 'break'],
    default: 'focus-study'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  plannedDuration: {
    type: Number, // in seconds
    required: true
  },
  breakInterval: {
    type: Number, // in seconds
    default: 1500 // 25 minutes
  },
  breakDuration: {
    type: Number, // in seconds
    default: 300 // 5 minutes
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },
  pauseReason: {
    type: String,
    enum: ['manual', 'face-detection', 'tab-switch', 'fullscreen-exit'],
    default: null
  },
  pdfFile: {
    name: String,
    size: Number,
    type: String
  },
  progress: {
    currentPage: {
      type: Number,
      default: 1
    },
    totalPages: {
      type: Number,
      default: 0
    },
    pagesRead: {
      type: Number,
      default: 0
    },
    studyGoal: {
      type: Number,
      default: 10
    },
    completionPercentage: {
      type: Number,
      default: 0
    }
  },
  faceDetection: {
    enabled: {
      type: Boolean,
      default: true
    },
    awayCount: {
      type: Number,
      default: 0
    },
    totalAwayTime: {
      type: Number, // in seconds
      default: 0
    }
  },
  distractions: {
    tabSwitches: {
      type: Number,
      default: 0
    },
    fullscreenExits: {
      type: Number,
      default: 0
    }
  },
  notes: [{
    text: String,
    page: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    musicEnabled: {
      type: Boolean,
      default: false
    },
    musicType: {
      type: String,
      enum: ['lofi', 'classical', 'nature', 'whitenoise'],
      default: 'lofi'
    },
    focusMode: {
      type: Boolean,
      default: false
    },
    zoomLevel: {
      type: Number,
      default: 1.5
    },
    rotation: {
      type: Number,
      default: 0
    }
  },
  analytics: {
    effectiveStudyTime: {
      type: Number, // in seconds, excluding breaks and away time
      default: 0
    },
    focusScore: {
      type: Number, // percentage based on distractions
      default: 100
    },
    productivityScore: {
      type: Number, // based on pages read vs time spent
      default: 0
    }
  }
}, {
  timestamps: true
});

// Calculate effective study time
StudySessionSchema.methods.calculateEffectiveStudyTime = function() {
  const totalTime = this.duration;
  const awayTime = this.faceDetection.totalAwayTime;
  const breakTime = Math.floor(totalTime / this.breakInterval) * this.breakDuration;
  
  this.analytics.effectiveStudyTime = Math.max(0, totalTime - awayTime - breakTime);
  return this.analytics.effectiveStudyTime;
};

// Calculate focus score
StudySessionSchema.methods.calculateFocusScore = function() {
  const distractionPenalty = (this.distractions.tabSwitches * 5) + 
                            (this.distractions.fullscreenExits * 10) + 
                            (this.faceDetection.awayCount * 3);
  
  this.analytics.focusScore = Math.max(0, 100 - distractionPenalty);
  return this.analytics.focusScore;
};

// Calculate productivity score
StudySessionSchema.methods.calculateProductivityScore = function() {
  if (this.analytics.effectiveStudyTime === 0) {
    this.analytics.productivityScore = 0;
    return 0;
  }
  
  const pagesPerMinute = this.progress.pagesRead / (this.analytics.effectiveStudyTime / 60);
  const goalCompletion = (this.progress.pagesRead / this.progress.studyGoal) * 100;
  
  // Combine reading speed and goal completion
  this.analytics.productivityScore = Math.min(100, (pagesPerMinute * 20) + (goalCompletion * 0.5));
  return this.analytics.productivityScore;
};

// Update completion percentage
StudySessionSchema.methods.updateProgress = function() {
  if (this.progress.totalPages > 0) {
    this.progress.completionPercentage = (this.progress.pagesRead / this.progress.totalPages) * 100;
  }
  if (this.progress.studyGoal > 0) {
    const goalProgress = (this.progress.pagesRead / this.progress.studyGoal) * 100;
    this.progress.completionPercentage = Math.max(this.progress.completionPercentage, goalProgress);
  }
};

// Pre-save middleware to calculate analytics
StudySessionSchema.pre('save', function(next) {
  if (this.isModified('duration') || this.isModified('progress.pagesRead')) {
    this.calculateEffectiveStudyTime();
    this.calculateFocusScore();
    this.calculateProductivityScore();
    this.updateProgress();
  }
  next();
});

module.exports = mongoose.model('StudySession', StudySessionSchema);
