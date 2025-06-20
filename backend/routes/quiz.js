const express = require('express');
const { auth } = require('../middleware/auth');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const { generateQuizQuestions } = require('../services/quizGenerator');

const router = express.Router();

// @route   POST /api/quiz/generate/:courseId
// @desc    Generate AI-powered quiz for completed course
// @access  Private
router.post('/generate/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    console.log(`Generating quiz for course ${courseId} for user ${userId}`);

    // Check if user has completed the course
    const progress = await Progress.findOne({
      user: userId,
      course: courseId
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Course progress not found'
      });
    }

    if (progress.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Course must be completed before taking the quiz'
      });
    }

    // Get course data with modules and content
    const course = await Course.findById(courseId)
      .populate('instructor', 'name')
      .populate('modules.content');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Generate quiz questions based on course content
    const quizResult = await generateQuizQuestions(course);

    if (!quizResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate quiz questions'
      });
    }

    // Store quiz session info (optional - for tracking)
    const quizSession = {
      userId,
      courseId,
      questions: quizResult.questions,
      metadata: quizResult.metadata,
      startedAt: new Date(),
      status: 'active'
    };

    res.json({
      success: true,
      message: 'Quiz generated successfully',
      quiz: {
        id: `quiz_${courseId}_${Date.now()}`,
        courseTitle: course.title,
        courseCategory: course.category,
        instructor: course.instructor.name,
        questions: quizResult.questions,
        metadata: quizResult.metadata
      }
    });

  } catch (error) {
    console.error('Generate quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating quiz'
    });
  }
});

// @route   POST /api/quiz/submit
// @desc    Submit quiz answers and get results
// @access  Private
router.post('/submit', auth, async (req, res) => {
  try {
    const { quizId, courseId, answers, timeSpent } = req.body;
    const userId = req.user._id;

    console.log(`Submitting quiz ${quizId} for course ${courseId}`);

    // Get course data to regenerate questions for validation
    const course = await Course.findById(courseId)
      .populate('instructor', 'name')
      .populate('modules.content');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Generate the same quiz to validate answers
    const quizResult = await generateQuizQuestions(course);
    const questions = quizResult.questions;

    // Calculate score
    let correctAnswers = 0;
    const results = answers.map((userAnswer, index) => {
      const question = questions[index];
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) {
        correctAnswers++;
      }

      return {
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
        options: question.options
      };
    });

    const totalQuestions = questions.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = percentage >= 60; // 60% passing grade

    // Calculate XP based on performance
    let xpEarned = 0;
    if (percentage >= 90) xpEarned = 100;
    else if (percentage >= 80) xpEarned = 80;
    else if (percentage >= 70) xpEarned = 60;
    else if (percentage >= 60) xpEarned = 40;
    else xpEarned = 20;

    // Award XP to user
    try {
      const User = require('../models/User');
      const user = await User.findById(userId);
      user.addXP(xpEarned);
      await user.save();
    } catch (xpError) {
      console.error('Error awarding XP:', xpError);
    }

    // Update progress with quiz results
    try {
      const progress = await Progress.findOne({
        user: userId,
        course: courseId
      });

      if (progress) {
        // Add quiz attempt to progress
        const quizAttempt = {
          quiz: courseId, // Using courseId as quiz reference
          answers: answers.map((answer, index) => ({
            questionId: questions[index].id,
            answer,
            isCorrect: answer === questions[index].correctAnswer,
            timeSpent: Math.floor(timeSpent / totalQuestions) // Average time per question
          })),
          score: {
            percentage,
            earnedPoints: correctAnswers * 10,
            totalPoints: totalQuestions * 10
          },
          passed,
          timeSpent,
          completedAt: new Date(),
          xpEarned
        };

        // Find or create a quiz content entry in progress
        let quizContentProgress = null;
        for (let moduleProgress of progress.moduleProgress) {
          quizContentProgress = moduleProgress.contentProgress.find(
            cp => cp.contentType === 'quiz'
          );
          if (quizContentProgress) break;
        }

        if (quizContentProgress) {
          quizContentProgress.quizAttempts.push(quizAttempt);
          if (percentage > quizContentProgress.bestQuizScore) {
            quizContentProgress.bestQuizScore = percentage;
          }
        }

        await progress.save();
      }
    } catch (progressError) {
      console.error('Error updating progress:', progressError);
    }

    // Determine badge eligibility
    const badges = [];
    if (percentage === 100) {
      badges.push({
        name: 'Perfect Score',
        description: 'Scored 100% on a quiz',
        icon: '🏆'
      });
    }
    if (percentage >= 90) {
      badges.push({
        name: 'Quiz Master',
        description: 'Scored 90% or higher on a quiz',
        icon: '🎯'
      });
    }
    if (timeSpent < (totalQuestions * 20)) { // Less than 20 seconds per question
      badges.push({
        name: 'Speed Demon',
        description: 'Completed quiz quickly with good accuracy',
        icon: '⚡'
      });
    }

    res.json({
      success: true,
      message: 'Quiz submitted successfully',
      results: {
        quizId,
        courseTitle: course.title,
        totalQuestions,
        correctAnswers,
        percentage,
        passed,
        timeSpent,
        xpEarned,
        badges,
        questions: results,
        feedback: generateFeedback(percentage, timeSpent, totalQuestions)
      }
    });

  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting quiz'
    });
  }
});

// Helper function to generate feedback
const generateFeedback = (percentage, timeSpent, totalQuestions) => {
  const avgTimePerQuestion = timeSpent / totalQuestions;
  
  let performanceFeedback = '';
  if (percentage >= 90) {
    performanceFeedback = 'Excellent work! You have a strong understanding of the material.';
  } else if (percentage >= 80) {
    performanceFeedback = 'Great job! You understand most of the concepts well.';
  } else if (percentage >= 70) {
    performanceFeedback = 'Good effort! Consider reviewing some topics for better understanding.';
  } else if (percentage >= 60) {
    performanceFeedback = 'You passed, but there\'s room for improvement. Review the course material.';
  } else {
    performanceFeedback = 'Consider reviewing the course material and retaking the quiz.';
  }

  let timeFeedback = '';
  if (avgTimePerQuestion < 15) {
    timeFeedback = 'You completed the quiz very quickly!';
  } else if (avgTimePerQuestion < 25) {
    timeFeedback = 'Good pacing on the quiz.';
  } else {
    timeFeedback = 'Take your time to read questions carefully.';
  }

  return {
    performance: performanceFeedback,
    timing: timeFeedback,
    overall: `You scored ${percentage}% in ${Math.floor(timeSpent / 60)} minutes and ${timeSpent % 60} seconds.`
  };
};

module.exports = router;
