const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Note title is required'],
    trim: true,
    maxlength: [100, 'Note title cannot be more than 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Note content is required'],
    maxlength: [5000, 'Note content cannot be more than 5000 characters']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  // Context - what the note is related to
  context: {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    module: {
      type: mongoose.Schema.Types.ObjectId
    },
    content: {
      type: mongoose.Schema.Types.ObjectId
    },
    contentType: {
      type: String,
      enum: ['video', 'text', 'quiz', 'flashcard']
    },
    // Timestamp in video (for video notes)
    videoTimestamp: {
      type: Number, // in seconds
      default: 0
    }
  },
  // Note organization
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  category: {
    type: String,
    enum: ['general', 'important', 'question', 'summary', 'todo', 'review'],
    default: 'general'
  },
  color: {
    type: String,
    enum: ['yellow', 'blue', 'green', 'red', 'purple', 'orange', 'pink'],
    default: 'yellow'
  },
  // Note properties
  isPrivate: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  // Rich text formatting
  format: {
    type: String,
    enum: ['plain', 'markdown', 'html'],
    default: 'plain'
  },
  // Collaboration (for future use)
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Note metadata
  wordCount: {
    type: Number,
    default: 0
  },
  readingTime: {
    type: Number, // in minutes
    default: 0
  },
  lastViewedAt: {
    type: Date,
    default: Date.now
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
noteSchema.index({ user: 1 });
noteSchema.index({ 'context.course': 1 });
noteSchema.index({ category: 1 });
noteSchema.index({ tags: 1 });
noteSchema.index({ isPinned: -1, updatedAt: -1 });
noteSchema.index({ isArchived: 1 });
noteSchema.index({ createdAt: -1 });

// Text index for search functionality
noteSchema.index({
  title: 'text',
  content: 'text',
  tags: 'text'
});

// Virtual for excerpt (first 150 characters of content)
noteSchema.virtual('excerpt').get(function() {
  if (this.content.length <= 150) {
    return this.content;
  }
  return this.content.substring(0, 150) + '...';
});

// Method to calculate word count and reading time
noteSchema.methods.calculateMetrics = function() {
  const words = this.content.trim().split(/\s+/).filter(word => word.length > 0);
  this.wordCount = words.length;
  
  // Average reading speed: 200 words per minute
  this.readingTime = Math.ceil(this.wordCount / 200);
  
  return {
    wordCount: this.wordCount,
    readingTime: this.readingTime
  };
};

// Method to increment view count
noteSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  this.lastViewedAt = new Date();
  return this.save();
};

// Method to add tag
noteSchema.methods.addTag = function(tag) {
  const normalizedTag = tag.toLowerCase().trim();
  if (!this.tags.includes(normalizedTag)) {
    this.tags.push(normalizedTag);
  }
  return this.save();
};

// Method to remove tag
noteSchema.methods.removeTag = function(tag) {
  const normalizedTag = tag.toLowerCase().trim();
  this.tags = this.tags.filter(t => t !== normalizedTag);
  return this.save();
};

// Method to share note with another user
noteSchema.methods.shareWith = function(userId, permission = 'view') {
  const existingShare = this.sharedWith.find(share => share.user.toString() === userId.toString());
  
  if (existingShare) {
    existingShare.permission = permission;
    existingShare.sharedAt = new Date();
  } else {
    this.sharedWith.push({
      user: userId,
      permission,
      sharedAt: new Date()
    });
  }
  
  return this.save();
};

// Method to unshare note
noteSchema.methods.unshareWith = function(userId) {
  this.sharedWith = this.sharedWith.filter(share => share.user.toString() !== userId.toString());
  return this.save();
};

// Static method to find notes by user
noteSchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId, isArchived: false };
  
  if (options.course) {
    query['context.course'] = options.course;
  }
  
  if (options.category) {
    query.category = options.category;
  }
  
  if (options.tags && options.tags.length > 0) {
    query.tags = { $in: options.tags };
  }
  
  return this.find(query)
    .populate('context.course', 'title')
    .sort({ isPinned: -1, updatedAt: -1 });
};

// Static method to search notes
noteSchema.statics.searchNotes = function(userId, searchTerm, options = {}) {
  const query = {
    user: userId,
    isArchived: false,
    $text: { $search: searchTerm }
  };
  
  if (options.course) {
    query['context.course'] = options.course;
  }
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .populate('context.course', 'title')
    .sort({ score: { $meta: 'textScore' }, updatedAt: -1 });
};

// Static method to find notes by course
noteSchema.statics.findByCourse = function(userId, courseId) {
  return this.find({
    user: userId,
    'context.course': courseId,
    isArchived: false
  })
    .sort({ 'context.videoTimestamp': 1, createdAt: 1 });
};

// Static method to find pinned notes
noteSchema.statics.findPinned = function(userId) {
  return this.find({
    user: userId,
    isPinned: true,
    isArchived: false
  })
    .populate('context.course', 'title')
    .sort({ updatedAt: -1 });
};

// Static method to find notes by category
noteSchema.statics.findByCategory = function(userId, category) {
  return this.find({
    user: userId,
    category,
    isArchived: false
  })
    .populate('context.course', 'title')
    .sort({ updatedAt: -1 });
};

// Static method to find archived notes
noteSchema.statics.findArchived = function(userId) {
  return this.find({
    user: userId,
    isArchived: true
  })
    .populate('context.course', 'title')
    .sort({ updatedAt: -1 });
};

// Static method to get note statistics for user
noteSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalNotes: { $sum: 1 },
        archivedNotes: {
          $sum: { $cond: [{ $eq: ['$isArchived', true] }, 1, 0] }
        },
        pinnedNotes: {
          $sum: { $cond: [{ $eq: ['$isPinned', true] }, 1, 0] }
        },
        totalWords: { $sum: '$wordCount' },
        averageWordsPerNote: { $avg: '$wordCount' },
        totalReadingTime: { $sum: '$readingTime' },
        notesByCategory: {
          $push: {
            category: '$category',
            count: 1
          }
        }
      }
    }
  ]);
};

// Pre-save middleware to calculate metrics
noteSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.calculateMetrics();
  }
  next();
});

// Transform output to include virtual fields
noteSchema.set('toJSON', { virtuals: true });
noteSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Note', noteSchema);
