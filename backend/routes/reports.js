const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const { auth, isInstructor } = require('../middleware/auth');

const router = express.Router();

// Initialize Gemini AI
let genAI;
let model;
try {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  console.log('✅ Reports - Gemini AI initialized successfully');
} catch (error) {
  console.error('❌ Reports - Gemini AI initialization error:', error);
}

// @route   POST /api/reports/generate
// @desc    Generate AI performance report
// @access  Private (Instructor only)
router.post('/generate', [auth, isInstructor], async (req, res) => {
  try {
    const { courseId, studentId } = req.body;

    // Verify instructor owns the course
    const course = await Course.findById(courseId);
    if (!course || course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to generate report for this course'
      });
    }

    let progressData;
    if (studentId) {
      // Individual student report
      progressData = await Progress.findOne({
        user: studentId,
        course: courseId
      }).populate('user', 'name email');
    } else {
      // Class report
      progressData = await Progress.find({
        course: courseId
      }).populate('user', 'name email');
    }

    if (!progressData || (Array.isArray(progressData) && progressData.length === 0)) {
      return res.status(404).json({
        success: false,
        message: 'No progress data found'
      });
    }

    // Prepare data for AI analysis
    const analysisData = Array.isArray(progressData)
      ? progressData.map(p => ({
          student: p.user.name,
          progress: p.overallProgress,
          timeSpent: p.totalTimeSpent,
          averageQuizScore: p.averageQuizScore,
          completedModules: p.completedModules,
          totalModules: p.totalModules
        }))
      : [{
          student: progressData.user.name,
          progress: progressData.overallProgress,
          timeSpent: progressData.totalTimeSpent,
          averageQuizScore: progressData.averageQuizScore,
          completedModules: progressData.completedModules,
          totalModules: progressData.totalModules
        }];

    const prompt = `
    As an educational AI assistant, analyze the following student performance data for the course "${course.title}":

    ${JSON.stringify(analysisData, null, 2)}

    Please provide:
    1. Overall performance summary
    2. Key strengths and areas for improvement
    3. Personalized recommendations for each student
    4. Suggested interventions or support strategies
    5. Engagement insights based on time spent and completion rates

    Format the response as a comprehensive educational report.
    `;

    if (!model) {
      return res.status(503).json({
        success: false,
        message: 'AI service is currently unavailable',
        fallback: 'Please try again later or generate a basic report manually.'
      });
    }

    const fullPrompt = `You are an expert educational analyst providing insights on student performance data.

${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const report = response.text();

    res.json({
      success: true,
      report,
      courseTitle: course.title,
      generatedAt: new Date(),
      dataAnalyzed: analysisData
    });

  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message
    });
  }
});

module.exports = router;
