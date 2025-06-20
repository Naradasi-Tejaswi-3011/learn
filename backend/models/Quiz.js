const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'fill-blank'],
    default: 'multiple-choice'
  },
  options: [{
    text: {
      type: String,
      required: true,
      trim: true
    },
    isCorrect: {
      type: Boolean,
      default: false
    }
  }],
  correctAnswer: {
    type: String, // For fill-in-the-blank questions
    trim: true
  },
  explanation: {
    type: String,
    trim: true
  },
  points: {
    type: Number,
    default: 1,
    min: [1, 'Points must be at least 1']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  order: {
    type: Number,
    required: true
  }
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true,
    maxlength: [100, 'Quiz title cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Quiz description cannot be more than 500 characters']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course reference is required']
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Module reference is required']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Instructor reference is required']
  },
  questions: [questionSchema],
  // Quiz settings
  timeLimit: {
    type: Number, // in minutes
    default: 0 // 0 means no time limit
  },
  passingScore: {
    type: Number,
    default: 60, // percentage
    min: [0, 'Passing score cannot be negative'],
    max: [100, 'Passing score cannot exceed 100']
  },
  maxAttempts: {
    type: Number,
    default: 3,
    min: [1, 'Maximum attempts must be at least 1']
  },
  shuffleQuestions: {
    type: Boolean,
    default: false
  },
  shuffleOptions: {
    type: Boolean,
    default: false
  },
  showCorrectAnswers: {
    type: Boolean,
    default: true
  },
  showExplanations: {
    type: Boolean,
    default: true
  },
  // Adaptive learning
  adaptiveSettings: {
    enabled: {
      type: Boolean,
      default: true
    },
    easyThreshold: {
      type: Number,
      default: 80 // If score >= 80%, recommend harder content
    },
    hardThreshold: {
      type: Number,
      default: 60 // If score < 60%, recommend easier content or review
    }
  },
  // Quiz statistics
  totalAttempts: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  // XP and gamification
  xpReward: {
    type: Number,
    default: 50
  },
  bonusXpThreshold: {
    type: Number,
    default: 90 // Bonus XP if score >= 90%
  },
  bonusXp: {
    type: Number,
    default: 25
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
quizSchema.index({ course: 1 });
quizSchema.index({ instructor: 1 });
quizSchema.index({ isActive: 1 });

// Virtual for total questions count
quizSchema.virtual('questionsCount').get(function() {
  return this.questions.length;
});

// Virtual for total points
quizSchema.virtual('totalPoints').get(function() {
  return this.questions.reduce((total, question) => total + question.points, 0);
});

// Method to calculate score percentage
quizSchema.methods.calculateScore = function(answers) {
  let correctAnswers = 0;
  let totalPoints = 0;
  let earnedPoints = 0;

  this.questions.forEach((question, index) => {
    totalPoints += question.points;
    const userAnswer = answers[index];

    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      const correctOption = question.options.find(option => option.isCorrect);
      if (correctOption && userAnswer === correctOption.text) {
        correctAnswers++;
        earnedPoints += question.points;
      }
    } else if (question.type === 'fill-blank') {
      if (userAnswer && userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
        correctAnswers++;
        earnedPoints += question.points;
      }
    }
  });

  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  
  return {
    correctAnswers,
    totalQuestions: this.questions.length,
    earnedPoints,
    totalPoints,
    percentage,
    passed: percentage >= this.passingScore
  };
};

// Method to get adaptive learning recommendation
quizSchema.methods.getAdaptiveRecommendation = function(score) {
  if (!this.adaptiveSettings.enabled) {
    return { type: 'continue', message: 'Continue to next lesson' };
  }

  if (score >= this.adaptiveSettings.easyThreshold) {
    return {
      type: 'advance',
      message: 'Great job! You can advance to more challenging content.',
      difficulty: 'hard'
    };
  } else if (score < this.adaptiveSettings.hardThreshold) {
    return {
      type: 'review',
      message: 'Consider reviewing the material before proceeding.',
      difficulty: 'easy',
      reviewTopics: this.getWeakTopics(score)
    };
  } else {
    return {
      type: 'continue',
      message: 'Good work! Continue to the next lesson.',
      difficulty: 'medium'
    };
  }
};

// Method to get weak topics (simplified)
quizSchema.methods.getWeakTopics = function(score) {
  // This is a simplified implementation
  // In a real application, you'd track which questions were answered incorrectly
  return ['Review the key concepts', 'Practice more examples'];
};

// Method to shuffle questions
quizSchema.methods.getShuffledQuestions = function() {
  if (!this.shuffleQuestions) {
    return this.questions;
  }

  const shuffled = [...this.questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.map(question => {
    if (this.shuffleOptions && question.options.length > 0) {
      const shuffledOptions = [...question.options];
      for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
      }
      return { ...question.toObject(), options: shuffledOptions };
    }
    return question;
  });
};

// Method to update quiz statistics
quizSchema.methods.updateStatistics = function(score) {
  this.totalAttempts += 1;
  
  // Calculate new average score
  const totalScore = (this.averageScore * (this.totalAttempts - 1)) + score;
  this.averageScore = Math.round(totalScore / this.totalAttempts);
  
  return this.save();
};

// Static method to find quizzes by course
quizSchema.statics.findByCourse = function(courseId) {
  return this.find({ course: courseId, isActive: true })
    .sort({ createdAt: 1 });
};

// Static method to find quizzes by instructor
quizSchema.statics.findByInstructor = function(instructorId) {
  return this.find({ instructor: instructorId })
    .populate('course', 'title')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Quiz', quizSchema);
