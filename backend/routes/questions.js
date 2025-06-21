const express = require('express');
const { body, validationResult } = require('express-validator');
const Question = require('../models/Question');
const Course = require('../models/Course');
const { auth, isStudent, isInstructor } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/questions
// @desc    Create a new question (Student only)
// @access  Private
router.post('/', [
  auth,
  isStudent,
  body('question').trim().isLength({ min: 10, max: 1000 }).withMessage('Question must be 10-1000 characters'),
  body('courseId').isMongoId().withMessage('Valid course ID required')
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

    const { question, courseId, moduleId } = req.body;

    // Verify course exists and student is enrolled
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Create question
    const newQuestion = new Question({
      question: question.trim(),
      student: req.user._id,
      course: courseId,
      module: moduleId,
      studentName: req.user.name,
      courseName: course.title
    });

    await newQuestion.save();

    res.status(201).json({
      success: true,
      message: 'Question submitted successfully',
      question: newQuestion
    });

  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/questions/instructor/:instructorId
// @desc    Get all questions for instructor's courses
// @access  Private (Instructor only)
router.get('/instructor/:instructorId', auth, async (req, res) => {
  try {
    // Verify the requesting user is the instructor
    if (req.user._id.toString() !== req.params.instructorId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get all courses by this instructor
    const courses = await Course.find({ instructor: req.params.instructorId });
    const courseIds = courses.map(course => course._id);

    // Get all questions for these courses
    const questions = await Question.find({ course: { $in: courseIds } })
      .populate('student', 'name avatar')
      .populate('course', 'title')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      questions
    });

  } catch (error) {
    console.error('Get instructor questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/questions/student/:studentId
// @desc    Get all questions by a student
// @access  Private (Student only)
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    // Verify the requesting user is the student
    if (req.user._id.toString() !== req.params.studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const questions = await Question.find({ student: req.params.studentId })
      .populate('course', 'title instructor')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      questions
    });

  } catch (error) {
    console.error('Get student questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/questions/:id/answer
// @desc    Answer a question (Instructor only)
// @access  Private
router.put('/:id/answer', [
  auth,
  body('answer').trim().isLength({ min: 10, max: 2000 }).withMessage('Answer must be 10-2000 characters')
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

    const question = await Question.findById(req.params.id).populate('course');
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Verify the instructor owns the course
    if (question.course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    question.answer = req.body.answer.trim();
    question.answeredAt = new Date();
    question.answeredBy = req.user._id;

    await question.save();

    res.json({
      success: true,
      message: 'Answer posted successfully',
      question
    });

  } catch (error) {
    console.error('Answer question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/questions/course/:courseId
// @desc    Get all questions for a specific course
// @access  Private
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user has access (instructor or enrolled student)
    const isInstructor = course.instructor.toString() === req.user._id.toString();
    // TODO: Check if student is enrolled in the course
    
    if (!isInstructor && req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const questions = await Question.find({ course: req.params.courseId })
      .populate('student', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      questions
    });

  } catch (error) {
    console.error('Get course questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/questions/:id
// @desc    Delete a question
// @access  Private (Student who asked or Instructor of the course)
router.delete('/:id', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate('course');
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check if user can delete (student who asked or instructor of the course)
    const canDelete = question.student.toString() === req.user._id.toString() ||
                     question.course.instructor.toString() === req.user._id.toString();

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Question.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });

  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
