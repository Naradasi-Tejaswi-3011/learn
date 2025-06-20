import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, Brain, Trophy, ArrowLeft } from 'lucide-react';
import VoiceQuiz from '../components/VoiceQuiz';
import QuizResults from '../components/QuizResults';
import GameService from '../services/gameService';
import { quizTopics, categoryToQuizTopic } from '../data/quizData';
import axios from 'axios';

const VoiceQuizPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState('selection'); // selection, quiz, results
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [quizResults, setQuizResults] = useState(null);
  const [gameService] = useState(() => new GameService());
  const [completedCourse, setCompletedCourse] = useState(null);
  const [courseQuiz, setCourseQuiz] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check if user came from course completion
  useEffect(() => {
    if (location.state?.completedCourse) {
      const course = location.state.completedCourse;
      setCompletedCourse(course);

      // Generate AI-powered quiz for the completed course
      generateCourseQuiz(course.id);
    }
  }, [location.state]);

  const generateCourseQuiz = async (courseId) => {
    try {
      setLoading(true);
      console.log('Generating AI quiz for course:', courseId);

      const response = await axios.post(`/quiz/generate/${courseId}`);

      if (response.data.success) {
        const quiz = response.data.quiz;
        setCourseQuiz(quiz);

        // Create a custom topic for this course quiz
        const courseTopicKey = `course_${courseId}`;
        const courseTopic = {
          name: `${quiz.courseTitle} Quiz`,
          icon: '🎓',
          color: '#3B82F6',
          questions: quiz.questions.map((q, index) => ({
            id: index + 1,
            question: q.question,
            options: q.options,
            correct: q.correctAnswer,
            explanation: q.explanation,
            category: q.category,
            difficulty: q.difficulty
          }))
        };

        // Add the course topic to available topics temporarily
        quizTopics[courseTopicKey] = courseTopic;

        setSelectedTopic(courseTopicKey);
        setCurrentView('quiz');

        console.log('Generated course quiz:', courseTopic);
      } else {
        console.error('Failed to generate quiz:', response.data.message);
        // Fallback to category-based quiz
        fallbackToCategoryQuiz();
      }
    } catch (error) {
      console.error('Error generating course quiz:', error);
      // Fallback to category-based quiz
      fallbackToCategoryQuiz();
    } finally {
      setLoading(false);
    }
  };

  const fallbackToCategoryQuiz = () => {
    if (completedCourse) {
      const quizTopic = categoryToQuizTopic[completedCourse.category] || 'general';
      if (quizTopics[quizTopic]) {
        setSelectedTopic(quizTopic);
        setCurrentView('quiz');
      }
    }
  };

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    setCurrentView('quiz');
  };

  const handleQuizComplete = (results) => {
    setQuizResults(results);
    setCurrentView('results');
  };

  const handlePlayAgain = () => {
    setQuizResults(null);
    setCurrentView('quiz');
  };

  const handleBackToSelection = () => {
    setSelectedTopic(null);
    setQuizResults(null);
    setCurrentView('selection');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const renderTopicSelection = () => (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center justify-center mb-6">
            <Mic className="h-16 w-16 text-primary-600 mr-4" />
            <Brain className="h-16 w-16 text-primary-600" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎤 Voice Quiz Bot
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Test your knowledge with voice commands!
          </p>
          
          {completedCourse && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6 max-w-md mx-auto">
              <p className="font-medium">🎉 Congratulations!</p>
              <p className="text-sm">
                You completed "{completedCourse.title}".
                {loading ? ' Generating personalized quiz...' : ' Take a quiz to test your knowledge!'}
              </p>
              {loading && (
                <div className="mt-2 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  <span className="ml-2 text-xs">Creating AI-powered quiz...</span>
                </div>
              )}
            </div>
          )}
          
          <p className="text-gray-500">
            Choose a topic below to start your voice-powered quiz experience
          </p>
        </div>

        {/* Topic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {Object.entries(quizTopics).map(([topicKey, topic]) => (
            <button
              key={topicKey}
              onClick={() => handleTopicSelect(topicKey)}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-6 text-center group hover:scale-105"
              style={{ borderTop: `4px solid ${topic.color}` }}
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                {topic.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {topic.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {topic.questions.length} questions
              </p>
              <div className="flex items-center justify-center text-sm text-gray-500">
                <Mic className="h-4 w-4 mr-1" />
                Voice enabled
              </div>
            </button>
          ))}
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Mic className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Listen & Speak</h3>
              <p className="text-gray-600 text-sm">
                Questions are read aloud. Answer by speaking A, B, C, or D
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Brain className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Smart Recognition</h3>
              <p className="text-gray-600 text-sm">
                Advanced speech recognition understands your answers
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Trophy className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Earn Rewards</h3>
              <p className="text-gray-600 text-sm">
                Gain XP, unlock badges, and track your progress
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 text-center">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Your Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold text-primary-600">
                  Level {gameService.getUserData().level}
                </div>
                <div className="text-sm text-gray-600">Current Level</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {gameService.getStats().quizzesCompleted}
                </div>
                <div className="text-sm text-gray-600">Quizzes Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {gameService.getStats().accuracy}%
                </div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {gameService.getBadges().length}
                </div>
                <div className="text-sm text-gray-600">Badges Earned</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'selection':
        return renderTopicSelection();
      case 'quiz':
        return (
          <VoiceQuiz
            topic={selectedTopic}
            onQuizComplete={handleQuizComplete}
            onBack={handleBackToSelection}
            gameService={gameService}
          />
        );
      case 'results':
        return (
          <QuizResults
            results={quizResults}
            onPlayAgain={handlePlayAgain}
            onBack={handleBackToDashboard}
            newBadges={quizResults?.newBadges || []}
          />
        );
      default:
        return renderTopicSelection();
    }
  };

  return renderCurrentView();
};

export default VoiceQuizPage;
