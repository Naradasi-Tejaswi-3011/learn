const express = require('express');
const OpenAI = require('openai');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const { auth, isInstructor } = require('../middleware/auth');

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert educational analyst providing insights on student performance data."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.7
    });

    const report = completion.choices[0].message.content;

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
