const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');
const Progress = require('../models/Progress');
const { auth, isInstructor, isStudent } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/courses/test
// @desc    Test database connection and publish all courses
// @access  Public
router.get('/test', async (req, res) => {
  try {
    const count = await Course.countDocuments();

    // Update all courses to be published for testing
    await Course.updateMany({}, { isPublished: true });

    const courses = await Course.find().populate('instructor', 'name email');
    res.json({
      success: true,
      message: 'Database connection working - All courses published',
      totalCourses: count,
      courses: courses.map(c => ({
        id: c._id,
        title: c.title,
        instructor: c.instructor,
        isPublished: c.isPublished
      }))
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// @route   GET /api/courses
// @desc    Get courses (all published for public, instructor's courses for instructors)
// @access  Public/Private
router.get('/', async (req, res) => {
  try {
    const { category, level, search, page = 1, limit = 12, instructor } = req.query;

    console.log('GET /courses query params:', req.query);

    let query = {};

    // If instructor parameter is provided, get instructor's courses (including unpublished)
    if (instructor) {
      // For instructor dashboard, show all their courses regardless of publish status
      query.instructor = instructor;
      console.log('Filtering by instructor:', instructor);
    } else {
      // For public view, only show published courses
      query.isPublished = true;
      console.log('Getting published courses only');
    }

    if (category) query.category = category;
    if (level) query.level = level;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    console.log('Final query:', JSON.stringify(query));

    const courses = await Course.find(query)
      .populate('instructor', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log('Found courses:', courses.length);
    if (courses.length > 0) {
      console.log('First course instructor:', courses[0].instructor);
    }

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      courses,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/courses
// @desc    Create new course
// @access  Private (Instructor only)
router.post('/', [
  auth,
  isInstructor,
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be 10-1000 characters'),
  body('category').isIn(['Programming', 'Design', 'Business', 'Marketing', 'Photography', 'Music', 'Health & Fitness', 'Language', 'Personal Development', 'Academic', 'Other']).withMessage('Invalid category'),
  body('level').isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid level')
], async (req, res) => {
  try {
    console.log('Creating course with user:', req.user._id);
    console.log('Course data received:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const courseData = {
      ...req.body,
      instructor: req.user._id
    };

    console.log('Final course data:', courseData);

    const course = new Course(courseData);
    const savedCourse = await course.save();

    console.log('Course saved successfully:', savedCourse._id);

    await savedCourse.populate('instructor', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course: savedCourse
    });

  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/courses/:id
// @desc    Get course by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name avatar bio');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // If user is authenticated, check enrollment status
    let isEnrolled = false;
    let userProgress = null;

    if (req.user) {
      userProgress = await Progress.findOne({
        user: req.user._id,
        course: course._id
      });
      isEnrolled = !!userProgress;
    }

    res.json({
      success: true,
      course,
      isEnrolled,
      userProgress
    });

  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private (Instructor only - own courses)
router.put('/:id', [
  auth,
  isInstructor,
  body('title').optional().trim().isLength({ min: 3, max: 100 }),
  body('description').optional().trim().isLength({ min: 10, max: 1000 })
], async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course'
      });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('instructor', 'name avatar');

    res.json({
      success: true,
      message: 'Course updated successfully',
      course: updatedCourse
    });

  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private (Instructor only - own courses)
router.delete('/:id', [auth, isInstructor], async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this course'
      });
    }

    await Course.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/courses/:id/enroll
// @desc    Enroll in course
// @access  Private (Student only)
router.post('/:id/enroll', [auth, isStudent], async (req, res) => {
  try {
    console.log('Enrollment attempt:', {
      courseId: req.params.id,
      userId: req.user._id,
      userRole: req.user.role,
      userName: req.user.name
    });

    const course = await Course.findById(req.params.id);

    if (!course) {
      console.log('Course not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!course.isPublished) {
      console.log('Course not published:', course.title);
      return res.status(404).json({
        success: false,
        message: 'Course is not published yet'
      });
    }

    console.log('Course found:', course.title, 'Published:', course.isPublished);

    // Check if already enrolled
    const existingProgress = await Progress.findOne({
      user: req.user._id,
      course: course._id
    });

    if (existingProgress) {
      console.log('User already enrolled in course');
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Create progress record
    const progress = new Progress({
      user: req.user._id,
      course: course._id,
      totalModules: course.modules.length
    });

    await progress.save();
    await course.addStudent();

    console.log('Enrollment successful for user:', req.user.name);

    res.json({
      success: true,
      message: 'Successfully enrolled in course',
      progress
    });

  } catch (error) {
    console.error('Enroll course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/courses/:id/modules
// @desc    Get course modules
// @access  Private (Enrolled students or instructor)
router.get('/:id/modules', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check access
    const isInstructor = course.instructor.toString() === req.user._id.toString();
    const progress = await Progress.findOne({
      user: req.user._id,
      course: course._id
    });

    if (!isInstructor && !progress) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Please enroll in the course first.'
      });
    }

    res.json({
      success: true,
      modules: course.modules,
      userProgress: progress
    });

  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/courses/:id/modules
// @desc    Add module to course
// @access  Private (Instructor only - own courses)
router.post('/:id/modules', [
  auth,
  isInstructor,
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Module title required'),
  body('order').isInt({ min: 1 }).withMessage('Valid order required')
], async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const moduleData = {
      title: req.body.title,
      description: req.body.description || '',
      order: req.body.order,
      content: []
    };

    course.modules.push(moduleData);
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Module added successfully',
      module: course.modules[course.modules.length - 1]
    });

  } catch (error) {
    console.error('Add module error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
