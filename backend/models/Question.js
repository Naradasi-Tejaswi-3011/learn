const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
    minlength: [10, 'Question must be at least 10 characters'],
    maxlength: [1000, 'Question cannot exceed 1000 characters']
  },
  answer: {
    type: String,
    trim: true,
    maxlength: [2000, 'Answer cannot exceed 2000 characters']
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  },
  answeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  answeredAt: {
    type: Date
  },
  // Denormalized fields for better performance
  studentName: {
    type: String,
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  // Question metadata
  isAnswered: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true // Whether other students can see this Q&A
  },
  upvotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
questionSchema.index({ course: 1, createdAt: -1 });
questionSchema.index({ student: 1, createdAt: -1 });
questionSchema.index({ isAnswered: 1, createdAt: -1 });

// Virtual for upvote count
questionSchema.virtual('upvoteCount').get(function() {
  return this.upvotes.length;
});

// Update isAnswered when answer is provided
questionSchema.pre('save', function(next) {
  if (this.answer && this.answer.trim()) {
    this.isAnswered = true;
  } else {
    this.isAnswered = false;
  }
  next();
});

// Instance method to add upvote
questionSchema.methods.addUpvote = function(userId) {
  const existingUpvote = this.upvotes.find(upvote => 
    upvote.user.toString() === userId.toString()
  );
  
  if (!existingUpvote) {
    this.upvotes.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to remove upvote
questionSchema.methods.removeUpvote = function(userId) {
  this.upvotes = this.upvotes.filter(upvote => 
    upvote.user.toString() !== userId.toString()
  );
  return this.save();
};

// Static method to get questions by course with pagination
questionSchema.statics.findByCourse = function(courseId, options = {}) {
  const { page = 1, limit = 10, answered = null } = options;
  const skip = (page - 1) * limit;
  
  let query = { course: courseId };
  if (answered !== null) {
    query.isAnswered = answered;
  }
  
  return this.find(query)
    .populate('student', 'name avatar')
    .populate('answeredBy', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get instructor's pending questions
questionSchema.statics.findPendingByInstructor = function(instructorId) {
  return this.aggregate([
    {
      $lookup: {
        from: 'courses',
        localField: 'course',
        foreignField: '_id',
        as: 'courseInfo'
      }
    },
    {
      $match: {
        'courseInfo.instructor': mongoose.Types.ObjectId(instructorId),
        isAnswered: false
      }
    },
    {
      $sort: { createdAt: -1 }
    }
  ]);
};

module.exports = mongoose.model('Question', questionSchema);
