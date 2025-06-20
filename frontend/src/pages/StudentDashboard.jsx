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
  Brain
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState([]);
  const [badges, setBadges] = useState([]);
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
          axios.get('/progress'),
          axios.get('/gamification/badges'),
          axios.get('/users/profile')
        ]);

        setProgress(progressRes.data.progress);
        setBadges(badgesRes.data.earnedBadges);
        setStats({
          totalCourses: profileRes.data.stats.totalCourses,
          completedCourses: profileRes.data.stats.completedCourses,
          totalXP: profileRes.data.stats.xp,
          currentStreak: profileRes.data.stats.streak.current
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
            Welcome back, {user.name}! 👋
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
                  {progress.slice(0, 3).map((courseProgress) => (
                    <div key={courseProgress._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {courseProgress.course.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {courseProgress.completedModules} of {courseProgress.totalModules} modules completed
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${courseProgress.overallProgress}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-600">
                              {courseProgress.overallProgress}% complete
                            </span>
                            <span className="text-sm text-gray-600">
                              {formatTimeSpent(courseProgress.totalTimeSpent || 0)}
                            </span>
                          </div>
                        </div>
                        <Link 
                          to={`/learn/${courseProgress.course._id}`}
                          className="ml-4 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Continue
                        </Link>
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
                  {badges.slice(0, 3).map((userBadge) => (
                    <div key={userBadge._id} className="flex items-center space-x-3">
                      <div className="text-2xl">{userBadge.badge.icon}</div>
                      <div>
                        <p className="font-medium text-gray-900">{userBadge.badge.name}</p>
                        <p className="text-sm text-gray-600">{userBadge.badge.description}</p>
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
                
                <div className="border border-gray-200 bg-gray-50 rounded-lg p-4 opacity-60">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Self-Paced Mode</h4>
                      <p className="text-sm text-gray-600">Coming soon...</p>
                    </div>
                  </div>
                </div>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
