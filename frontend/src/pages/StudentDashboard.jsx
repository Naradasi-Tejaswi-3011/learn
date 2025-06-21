import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Play,
  Award,
  TrendingUp,
  Clock,
  Target,
  Star,
  ChevronRight,
  Calendar,
  Flame,
  Mic,
  Brain,
  MessageSquare,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState([]);
  const [badges, setBadges] = useState([]);
  const [myQuestions, setMyQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalXP: 0,
    currentStreak: 0
  });

  // Helper function to format time spent
  const formatTimeSpent = (seconds) => {
    if (!seconds || seconds === 0) return '0m studied';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m studied`;
    } else {
      return `${minutes}m studied`;
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [progressRes, badgesRes, profileRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/progress`),
          axios.get(`${import.meta.env.VITE_API_URL}/gamification/badges`),
          axios.get(`${import.meta.env.VITE_API_URL}/users/profile`)
        ]);

        setProgress(progressRes.data.progress || []);
        setBadges(badgesRes.data.earnedBadges || []);
        setStats({
          totalCourses: profileRes.data.stats?.totalCourses || 0,
          completedCourses: profileRes.data.stats?.completedCourses || 0,
          totalXP: profileRes.data.stats?.xp || 0,
          currentStreak: profileRes.data.stats?.streak?.current || 0
        });

        // Fetch student's questions
        try {
          if (user && user._id) {
            const questionsRes = await axios.get(`${import.meta.env.VITE_API_URL}/questions/student/${user._id}`);
            setMyQuestions(questionsRes.data.questions || []);
          }
        } catch (questionError) {
          console.log('Questions not available yet');
          setMyQuestions([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Refresh progress data every 30 seconds to show real-time updates
    const interval = setInterval(fetchDashboardData, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || 'Student'}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Continue your learning journey and reach new milestones.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-primary-100 text-primary-600">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <Target className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedCourses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <Award className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total XP</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalXP}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <Flame className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">{stats.currentStreak} days</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Continue Learning */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Continue Learning</h2>
                <Link 
                  to="/courses" 
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Browse all courses
                </Link>
              </div>

              {progress.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                  <p className="text-gray-600 mb-4">Start your learning journey by enrolling in a course.</p>
                  <Link 
                    to="/courses" 
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Browse Courses
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {progress.slice(0, 3).filter(courseProgress => courseProgress && courseProgress.course).map((courseProgress) => (
                    <div key={courseProgress._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {courseProgress.course?.title || 'Course Title'}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              (courseProgress.overallProgress || 0) === 100
                                ? 'bg-green-100 text-green-800'
                                : (courseProgress.overallProgress || 0) > 0
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {(courseProgress.overallProgress || 0) === 100 ? 'Completed' : 'In Progress'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            {courseProgress.completedModules || 0} of {courseProgress.totalModules || 0} modules completed
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                            <div
                              className={`h-3 rounded-full transition-all duration-500 ${
                                (courseProgress.overallProgress || 0) === 100
                                  ? 'bg-green-500'
                                  : 'bg-primary-600'
                              }`}
                              style={{ width: `${courseProgress.overallProgress || 0}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">
                              {Math.round(courseProgress.overallProgress || 0)}% complete
                            </span>
                            <span className="text-sm text-gray-600">
                              {formatTimeSpent(courseProgress.totalTimeSpent || 0)}
                            </span>
                          </div>
                        </div>
                        {courseProgress.course?._id && (
                          <Link
                            to={`/learn/${courseProgress.course._id}`}
                            className="ml-4 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            {(courseProgress.overallProgress || 0) === 100 ? 'Review' : 'Continue'}
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Badges */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Badges</h3>
              {badges.length === 0 ? (
                <div className="text-center py-6">
                  <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No badges earned yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {badges.slice(0, 3).filter(userBadge => userBadge && userBadge.badge).map((userBadge) => (
                    <div key={userBadge._id} className="flex items-center space-x-3">
                      <div className="text-2xl">{userBadge.badge?.icon || '🏆'}</div>
                      <div>
                        <p className="font-medium text-gray-900">{userBadge.badge?.name || 'Badge'}</p>
                        <p className="text-sm text-gray-600">{userBadge.badge?.description || 'Achievement unlocked'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Learning Mode Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Learning Mode</h3>
              <div className="space-y-3">
                <div className="border-2 border-primary-600 bg-primary-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Interactive Mode</h4>
                      <p className="text-sm text-gray-600">Engage with quizzes and activities</p>
                    </div>
                    <div className="text-primary-600">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>
                </div>
                
                <Link
                  to="/self-paced"
                  className="block border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 group-hover:text-indigo-700">Self-Paced Mode</h4>
                      <p className="text-sm text-gray-600">Focus study with AI tools & analytics</p>
                    </div>
                    <div className="text-indigo-600 group-hover:text-indigo-700">
                      <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  to="/courses"
                  className="flex items-center space-x-3 text-gray-700 hover:text-primary-600 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <BookOpen className="h-5 w-5" />
                  <span>Browse Courses</span>
                </Link>
                <Link
                  to="/voice-quiz"
                  className="flex items-center space-x-3 text-gray-700 hover:text-primary-600 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Brain className="h-5 w-5" />
                  <span>Voice Quiz Bot</span>
                </Link>
                <Link
                  to="/notes"
                  className="flex items-center space-x-3 text-gray-700 hover:text-primary-600 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Calendar className="h-5 w-5" />
                  <span>My Notes</span>
                </Link>
                <Link
                  to="/badges"
                  className="flex items-center space-x-3 text-gray-700 hover:text-primary-600 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Award className="h-5 w-5" />
                  <span>View All Badges</span>
                </Link>
              </div>
            </div>

            {/* My Questions & Answers */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">My Questions & Answers</h3>
                <Link
                  to="/courses"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Ask a question
                </Link>
              </div>

              {myQuestions.length === 0 ? (
                <div className="text-center py-6">
                  <HelpCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">No questions asked yet</p>
                  <p className="text-xs text-gray-500">Ask questions on course pages to get help from instructors</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myQuestions.slice(0, 3).filter(question => question && question._id).map((question) => (
                    <div key={question._id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                          {question.question || 'Question'}
                        </h4>
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                          question.answer
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {question.answer ? (
                            <><CheckCircle className="h-3 w-3 inline mr-1" />Answered</>
                          ) : (
                            <><Clock className="h-3 w-3 inline mr-1" />Pending</>
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        {question.courseName || 'Course'} • {question.createdAt ? new Date(question.createdAt).toLocaleDateString() : 'Recently'}
                      </p>
                      {question.answer && (
                        <div className="bg-green-50 rounded p-2 mt-2">
                          <p className="text-sm text-green-800 line-clamp-2">
                            <strong>Answer:</strong> {question.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  {myQuestions.length > 3 && (
                    <div className="text-center pt-2">
                      <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                        View all {myQuestions.length} questions
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
