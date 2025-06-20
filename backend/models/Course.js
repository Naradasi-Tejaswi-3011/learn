const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Module title is required'],
    trim: true,
    maxlength: [100, 'Module title cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Module description cannot be more than 500 characters']
  },
  order: {
    type: Number,
    required: true
  },
  content: [{
    type: {
      type: String,
      enum: ['video', 'text', 'quiz', 'flashcard'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    order: {
      type: Number,
      required: true
    },
    // Video content
    videoUrl: {
      type: String,
      validate: {
        validator: function(v) {
          return this.type !== 'video' || (v && v.length > 0);
        },
        message: 'Video URL is required for video content'
      }
    },
    videoDuration: {
      type: Number, // in seconds
      default: 0
    },
    videoType: {
      type: String,
      enum: ['upload', 'youtube', 'vimeo'],
      default: 'upload'
    },
    // Text content
    textContent: {
      type: String,
      validate: {
        validator: function(v) {
          return this.type !== 'text' || (v && v.length > 0);
        },
        message: 'Text content is required for text content type'
      }
    },
    // Quiz reference
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      validate: {
        validator: function(v) {
          return this.type !== 'quiz' || v;
        },
        message: 'Quiz reference is required for quiz content'
      }
    },
    // Flashcard content
    flashcards: [{
      term: {
        type: String,
        required: function() {
          return this.parent().type === 'flashcard';
        }
      },
      definition: {
        type: String,
        required: function() {
          return this.parent().type === 'flashcard';
        }
      }
    }],
    // Common fields
    isRequired: {
      type: Boolean,
      default: true
    },
    xpReward: {
      type: Number,
      default: 10
    }
  }],
  isLocked: {
    type: Boolean,
    default: false
  },
  unlockRequirements: {
    previousModules: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module'
    }],
    minimumScore: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [100, 'Course title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: [1000, 'Course description cannot be more than 1000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot be more than 200 characters']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Instructor is required']
  },
  thumbnail: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Programming',
      'Design',
      'Business',
      'Marketing',
      'Photography',
      'Music',
      'Health & Fitness',
      'Language',
      'Personal Development',
      'Academic',
      'Other'
    ]
  },
  level: {
    type: String,
    required: [true, 'Course level is required'],
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  tags: [{
    type: String,
    trim: true
  }],
  modules: [moduleSchema],
  // Course settings
  isPublished: {
    type: Boolean,
    default: false
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    default: 0,
    min: [0, 'Price cannot be negative']
  },
  // Course statistics
  studentsCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  totalDuration: {
    type: Number, // in minutes
    default: 0
  },
  // Course requirements and outcomes
  requirements: [{
    type: String,
    trim: true
  }],
  learningOutcomes: [{
    type: String,
    trim: true
  }],
  // Adaptive learning settings
  adaptiveLearning: {
    enabled: {
      type: Boolean,
      default: true
    },
    passThreshold: {
      type: Number,
      default: 60 // percentage
    },
    retryLimit: {
      type: Number,
      default: 3
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
courseSchema.index({ instructor: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ 'rating.average': -1 });
courseSchema.index({ studentsCount: -1 });
courseSchema.index({ createdAt: -1 });

// Virtual for total modules count
courseSchema.virtual('modulesCount').get(function() {
  return this.modules.length;
});

// Virtual for total content items count
courseSchema.virtual('contentItemsCount').get(function() {
  return this.modules.reduce((total, module) => total + module.content.length, 0);
});

// Method to calculate total duration
courseSchema.methods.calculateTotalDuration = function() {
  let totalDuration = 0;
  
  this.modules.forEach(module => {
    module.content.forEach(content => {
      if (content.type === 'video' && content.videoDuration) {
        totalDuration += content.videoDuration;
      }
    });
  });
  
  this.totalDuration = Math.ceil(totalDuration / 60); // Convert to minutes
  return this.totalDuration;
};

// Method to add a student to the course
courseSchema.methods.addStudent = function() {
  this.studentsCount += 1;
  return this.save();
};

// Method to remove a student from the course
courseSchema.methods.removeStudent = function() {
  if (this.studentsCount > 0) {
    this.studentsCount -= 1;
  }
  return this.save();
};

// Method to update rating
courseSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Static method to find published courses
courseSchema.statics.findPublished = function(filters = {}) {
  return this.find({ isPublished: true, ...filters })
    .populate('instructor', 'name avatar')
    .sort({ createdAt: -1 });
};

// Static method to find courses by instructor
courseSchema.statics.findByInstructor = function(instructorId) {
  return this.find({ instructor: instructorId })
    .sort({ createdAt: -1 });
};

// Pre-save middleware to calculate total duration
courseSchema.pre('save', function(next) {
  if (this.isModified('modules')) {
    this.calculateTotalDuration();
  }
  next();
});

module.exports = mongoose.model('Course', courseSchema);
