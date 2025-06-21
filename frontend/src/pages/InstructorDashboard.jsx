import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import StudentProgressTracker from '../components/StudentProgressTracker';
import {
  BookOpen,
  Users,
  TrendingUp,
  PlusCircle,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  Star,
  Clock,
  MessageSquare,
  Settings,
  Activity,
  Award,
  Calendar,
  FileText,
  HelpCircle,
  ChevronRight,
  RefreshCw,
  Target,
  Play,
  CheckCircle
} from 'lucide-react';

const InstructorDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false); // Start with false for immediate UI
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [studentQuestions, setStudentQuestions] = useState([]);
  const [selectedCourseForProgress, setSelectedCourseForProgress] = useState(null);
  const [selectedCourseForDetails, setSelectedCourseForDetails] = useState(null);
  const [selectedCourseForAnalytics, setSelectedCourseForAnalytics] = useState(null);
  const [courseAnalytics, setCourseAnalytics] = useState(null);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalQuestions: 0,
    pendingQuestions: 0
  });

  const fetchDashboardData = async (forceRefresh = false) => {
    try {
      setRefreshing(true);
      console.log('=== INSTRUCTOR DASHBOARD API CALL ===');
      console.log('Fetching dashboard data for instructor:', user?._id);
      console.log('User object:', user);
      console.log('User role:', user?.role);
      console.log('Force refresh:', forceRefresh);

      // Clear existing data if force refresh
      if (forceRefresh) {
        console.log('🧹 Clearing existing data for force refresh');
        setCourses([]);
        setStudentQuestions([]);
        setStats({
          totalCourses: 0,
          totalStudents: 0,
          totalRevenue: 0,
          averageRating: 0,
          totalQuestions: 0,
          pendingQuestions: 0
        });
      }

      // Show interface immediately with loading states
      setLoading(false);

      // Fetch courses with shorter timeout and better error handling
      if (user?._id) {
        console.log('Fetching courses for instructor:', user._id);
        console.log('API URL:', `${import.meta.env.VITE_API_URL}/courses`);
        console.log('Params being sent:', { instructor: user._id });

        const apiUrl = `${import.meta.env.VITE_API_URL}/courses`;
        const params = { instructor: user._id };

        console.log('Making API call to:', apiUrl);
        console.log('With params:', params);
        console.log('Full URL will be:', `${apiUrl}?instructor=${user._id}`);
        console.log('Axios defaults:', axios.defaults);
        console.log('Authorization header:', axios.defaults.headers.common['Authorization']);

        const coursesRes = await axios.get(apiUrl, {
          params: params,
          timeout: 1000 // Ultra-fast timeout for immediate response
        });

        console.log('✅ API call successful!');

        console.log('Courses API response:', coursesRes.data);
        console.log('Number of courses found:', coursesRes.data.courses?.length || 0);
        const courses = coursesRes.data.courses || [];
        setCourses(courses);

        // Calculate basic stats immediately
        const totalStudents = courses.reduce((sum, course) => sum + (course.studentsCount || 0), 0);
        const totalRatings = courses.reduce((sum, course) => sum + (course.rating?.count || 0), 0);
        const averageRating = totalRatings > 0
          ? courses.reduce((sum, course) => sum + ((course.rating?.average || 0) * (course.rating?.count || 0)), 0) / totalRatings
          : 0;

        // Set initial stats
        setStats({
          totalCourses: courses.length,
          totalStudents,
          totalRevenue: 0,
          averageRating: averageRating.toFixed(1),
          totalQuestions: 0,
          pendingQuestions: 0
        });

        // Fetch questions in background (non-blocking)
        fetchQuestionsInBackground();
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Still show interface even on error
      setLoading(false);
      setCourses([]);
      setStats({
        totalCourses: 0,
        totalStudents: 0,
        totalRevenue: 0,
        averageRating: 0,
        totalQuestions: 0,
        pendingQuestions: 0
      });
    } finally {
      setRefreshing(false);
    }
  };

  const fetchQuestionsInBackground = async () => {
    try {
      if (!user?._id) return;

      const questionsRes = await axios.get(`${import.meta.env.VITE_API_URL}/questions/instructor/${user._id}`, {
        timeout: 1500 // Faster timeout for questions
      });
      const questions = questionsRes.data.questions || [];
      setStudentQuestions(questions);

      // Update stats with questions data
      const pendingQuestions = questions.filter(q => !q.answer || q.answer.trim() === '').length;
      setStats(prev => ({
        ...prev,
        totalQuestions: questions.length,
        pendingQuestions
      }));

      console.log('Questions loaded in background:', questions.length);
    } catch (error) {
      console.log('Questions not available, continuing without them');
      setStudentQuestions([]);
    }
  };

  useEffect(() => {
    console.log('=== INSTRUCTOR DASHBOARD useEffect ===');
    console.log('User available:', !!user);
    console.log('User ID:', user?._id);
    console.log('User role:', user?.role);

    if (user?._id && user?.role === 'instructor') {
      console.log('✅ Instructor user available, calling fetchDashboardData');
      // Load data immediately without blocking UI
      fetchDashboardData();

      // Set up real-time updates every 5 seconds for instructor dashboard
      const interval = setInterval(fetchDashboardData, 5000);

      return () => clearInterval(interval);
    } else {
      console.log('❌ User not available or not instructor, showing interface without data');
      // Reset data when user changes or logs out
      setCourses([]);
      setStats({
        totalCourses: 0,
        totalStudents: 0,
        totalRevenue: 0,
        averageRating: 0,
        totalQuestions: 0,
        pendingQuestions: 0
      });
      setStudentQuestions([]);
      setLoading(false);
    }
  }, [user?._id, user?.role]);

  // Ensure UI shows immediately and force refresh on mount
  useEffect(() => {
    console.log('=== COMPONENT MOUNTED ===');
    // Force show interface after 100ms regardless of API status
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);

    // Force refresh data when component mounts (for login/logout scenarios)
    if (user?._id && user?.role === 'instructor') {
      console.log('🔄 Force refreshing data on component mount');
      fetchDashboardData(true);
    }

    return () => clearTimeout(timer);
  }, []);

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/courses/${courseId}`);
        fetchDashboardData(); // Refresh data after deletion
      } catch (error) {
        console.error('Error deleting course:', error);
      }
    }
  };

  const generateReport = async (courseId) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/reports/generate`, { courseId });
      console.log('Report generated:', response.data);
      alert('Report generated successfully! Check console for details.');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report.');
    }
  };

  const answerQuestion = async (questionId, answer) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/questions/${questionId}/answer`, {
        answer: answer.trim()
      });

      // Update local state
      setStudentQuestions(prev =>
        prev.map(q =>
          q._id === questionId
            ? { ...q, answer: answer.trim(), answeredAt: new Date() }
            : q
        )
      );

      // Update stats
      setStats(prev => ({
        ...prev,
        pendingQuestions: prev.pendingQuestions - 1
      }));

      alert('Answer posted successfully! The student will be notified.');

      // Immediately refresh questions data for real-time updates
      fetchQuestionsInBackground();
    } catch (error) {
      console.error('Error answering question:', error);
      alert('Failed to post answer. Please try again.');
    }
  };

  const getCourseAnalytics = async (courseId) => {
    try {
      console.log('Getting analytics for course:', courseId);

      // Find the course
      const course = courses.find(c => c._id === courseId);
      if (!course) {
        alert('Course not found');
        return;
      }

      // Set selected course and switch to analytics tab
      setSelectedCourseForAnalytics(course);
      setActiveTab('analytics');

      // Fetch detailed analytics
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/courses/${courseId}/analytics`);
        setCourseAnalytics(response.data);
      } catch (error) {
        console.log('Analytics API not available yet, using mock data');
        // Generate mock analytics data
        const mockAnalytics = {
          enrollmentTrend: [
            { month: 'Jan', enrollments: Math.floor(Math.random() * 50) + 10 },
            { month: 'Feb', enrollments: Math.floor(Math.random() * 50) + 15 },
            { month: 'Mar', enrollments: Math.floor(Math.random() * 50) + 20 },
            { month: 'Apr', enrollments: Math.floor(Math.random() * 50) + 25 },
            { month: 'May', enrollments: Math.floor(Math.random() * 50) + 30 },
            { month: 'Jun', enrollments: Math.floor(Math.random() * 50) + 35 }
          ],
          completionRate: Math.floor(Math.random() * 40) + 60,
          averageTimeSpent: Math.floor(Math.random() * 120) + 60,
          studentSatisfaction: (Math.random() * 2 + 3).toFixed(1),
          topPerformingModules: course.modules?.slice(0, 3).map((module, index) => ({
            name: module?.title || 'Module',
            completionRate: Math.floor(Math.random() * 30) + 70,
            avgRating: (Math.random() * 1.5 + 3.5).toFixed(1)
          })) || [],
          recentActivity: [
            { type: 'enrollment', student: 'John Doe', time: '2 hours ago' },
            { type: 'completion', student: 'Jane Smith', time: '5 hours ago' },
            { type: 'question', student: 'Mike Johnson', time: '1 day ago' }
          ]
        };
        setCourseAnalytics(mockAnalytics);
      }
    } catch (error) {
      console.error('Error getting course analytics:', error);
      alert('Failed to load analytics. Please try again.');
    }
  };

  // Remove the blocking loading screen - show interface immediately
  const SkeletonCard = () => (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-gray-200 w-12 h-12"></div>
        <div className="ml-4 flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'courses', name: 'My Courses', icon: BookOpen },
    { id: 'progress', name: 'Student Progress', icon: Target },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp },
    { id: 'questions', name: 'Q&A', icon: MessageSquare, badge: stats.pendingQuestions }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Instructor Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Welcome back, {user?.name}! Manage your courses and engage with students.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Force Refresh'}
            </button>
            <Link
              to="/instructor/create-course"
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Create Course
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                    {tab.badge > 0 && (
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {refreshing ? (
                // Show skeleton loading when refreshing
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : (
                <>
                  <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-primary-100 text-primary-600">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Courses</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-green-100 text-green-600">
                        <Users className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Students</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                        <Star className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Average Rating</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-red-100 text-red-600">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Pending Q&A</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.pendingQuestions}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                  <Settings className="h-5 w-5 text-gray-400" />
                </div>
                <div className="space-y-3">
                  <Link
                    to="/instructor/create-course"
                    className="flex items-center justify-between p-3 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <PlusCircle className="h-5 w-5 text-primary-600 mr-3" />
                      <span className="text-primary-700 font-medium">Create New Course</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-primary-600" />
                  </Link>
                  <button
                    onClick={() => setActiveTab('questions')}
                    className="w-full flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <MessageSquare className="h-5 w-5 text-orange-600 mr-3" />
                      <span className="text-orange-700 font-medium">Answer Student Questions</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-orange-600" />
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="w-full flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <BarChart3 className="h-5 w-5 text-green-600 mr-3" />
                      <span className="text-green-700 font-medium">View Analytics</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-green-600" />
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  <Activity className="h-5 w-5 text-gray-400" />
                </div>
                <div className="space-y-3">
                  {courses.slice(0, 3).map((course) => (
                    <div key={course._id} className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {course.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {course.studentsCount} students enrolled
                        </p>
                      </div>
                    </div>
                  ))}
                  {courses.length === 0 && (
                    <p className="text-sm text-gray-500">No courses created yet</p>
                  )}
                </div>
              </div>

              {/* Performance Summary */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Performance Summary</h3>
                  <Award className="h-5 w-5 text-gray-400" />
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Course Completion Rate</span>
                      <span className="font-medium">{stats.totalCourses > 0 ? Math.round((courses.filter(c => c.studentsCount > 0).length / stats.totalCourses) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${stats.totalCourses > 0 ? Math.round((courses.filter(c => c.studentsCount > 0).length / stats.totalCourses) * 100) : 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Student Satisfaction</span>
                      <span className="font-medium">{stats.averageRating}/5.0</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(stats.averageRating / 5) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Course Engagement</span>
                      <span className="font-medium">{stats.totalStudents > 0 ? Math.round((stats.totalStudents / Math.max(stats.totalCourses, 1)) * 20) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${stats.totalStudents > 0 ? Math.round((stats.totalStudents / Math.max(stats.totalCourses, 1)) * 20) : 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Response Rate (Q&A)</span>
                      <span className="font-medium">{stats.pendingQuestions === 0 ? '100%' : Math.max(0, 100 - (stats.pendingQuestions / stats.totalQuestions) * 100).toFixed(0) + '%'}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{
                        width: `${stats.pendingQuestions === 0 ? 100 : Math.max(0, 100 - (stats.pendingQuestions / Math.max(stats.totalQuestions, 1)) * 100)}%`
                      }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructor Insights & Recommendations */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Instructor Insights</h2>
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Top Performing Course */}
                <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                  <h3 className="font-semibold text-gray-900 mb-2">🏆 Top Performing Course</h3>
                  {courses.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {courses.reduce((prev, current) =>
                          (prev.rating?.average || 0) > (current.rating?.average || 0) ? prev : current
                        ).title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        ⭐ {courses.reduce((prev, current) =>
                          (prev.rating?.average || 0) > (current.rating?.average || 0) ? prev : current
                        ).rating?.average?.toFixed(1) || '0.0'} rating
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">Create your first course!</p>
                  )}
                </div>

                {/* Most Popular Course */}
                <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                  <h3 className="font-semibold text-gray-900 mb-2">🔥 Most Popular Course</h3>
                  {courses.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {courses.reduce((prev, current) =>
                          prev.studentsCount > current.studentsCount ? prev : current
                        ).title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        👥 {courses.reduce((prev, current) =>
                          prev.studentsCount > current.studentsCount ? prev : current
                        ).studentsCount} students enrolled
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No enrollments yet</p>
                  )}
                </div>

                {/* Growth Opportunity */}
                <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
                  <h3 className="font-semibold text-gray-900 mb-2">📈 Growth Opportunity</h3>
                  {stats.pendingQuestions > 0 ? (
                    <div>
                      <p className="text-sm font-medium text-gray-800">Answer Pending Questions</p>
                      <p className="text-xs text-gray-600 mt-1">
                        💬 {stats.pendingQuestions} questions waiting for response
                      </p>
                    </div>
                  ) : courses.length < 3 ? (
                    <div>
                      <p className="text-sm font-medium text-gray-800">Create More Courses</p>
                      <p className="text-xs text-gray-600 mt-1">
                        🎯 Expand your teaching portfolio
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-gray-800">Excellent Progress!</p>
                      <p className="text-xs text-gray-600 mt-1">
                        ✨ Keep up the great work
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Tips */}
              <div className="mt-6 bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">💡 Quick Tips for Success</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start space-x-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700">Respond to student questions within 24 hours</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700">Add engaging video content to boost completion rates</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700">Monitor student progress regularly</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700">Update course content based on feedback</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">My Courses</h2>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>{courses.length} courses</span>
                    <span>•</span>
                    <span>{courses.filter(c => c.isPublished).length} published</span>
                    <span>•</span>
                    <span>{stats.totalStudents} total students</span>
                  </div>
                  <Link
                    to="/instructor/create-course"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center text-sm"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Course
                  </Link>
                </div>
              </div>

              {/* Course Filters */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Filter:</span>
                  <button className="px-3 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                    All Courses
                  </button>
                  <button className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-full">
                    Published
                  </button>
                  <button className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-full">
                    Drafts
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Sort:</span>
                  <select className="text-xs border border-gray-300 rounded px-2 py-1">
                    <option>Recent</option>
                    <option>Most Students</option>
                    <option>Highest Rated</option>
                    <option>A-Z</option>
                  </select>
                </div>
              </div>
            </div>

            {refreshing ? (
              // Show skeleton loading for courses
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-6 animate-pulse">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                      <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                <p className="text-gray-600 mb-4">Create your first course to start teaching.</p>
                <Link
                  to="/instructor/create-course"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center"
                >
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Create Course
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {courses.map((course) => (
                  <div key={course._id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-primary-600" />
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        course.isPublished
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {course.title}
                    </h3>

                    <p className="text-sm text-gray-600 mb-4">
                      {course.category} • {course.level}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-1" />
                        {course.studentsCount} students
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Star className="h-4 w-4 mr-1 text-yellow-400" />
                        {course.rating?.average?.toFixed(1) || '0.0'}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div className="flex items-center">
                          <BookOpen className="h-3 w-3 mr-1" />
                          {course.modules?.length || 0} modules
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {course.totalDuration || 0}min
                        </div>
                        <div className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {course.studentsCount} enrolled
                        </div>
                        <div className="flex items-center">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {studentQuestions.filter(q => q.courseId === course._id).length} questions
                        </div>
                      </div>
                      {course.modules && course.modules.length > 0 && (
                        <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-100 rounded">
                          <strong>Latest:</strong> {course.modules[course.modules.length - 1]?.title || 'No modules'}
                        </div>
                      )}

                      {/* Course Progress Indicator */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Course Completion</span>
                          <span>{course.studentsCount > 0 ? Math.round((course.studentsCount / Math.max(course.studentsCount + 5, 1)) * 100) : 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-green-500 h-1 rounded-full"
                            style={{ width: `${course.studentsCount > 0 ? Math.round((course.studentsCount / Math.max(course.studentsCount + 5, 1)) * 100) : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/course/${course._id}`}
                          className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors text-center"
                        >
                          View
                        </Link>
                        <Link
                          to={`/instructor/edit-course/${course._id}`}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors text-center"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setSelectedCourseForDetails(course)}
                          className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                          title="View Course Content"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedCourseForProgress(course);
                            setActiveTab('progress');
                          }}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          title="View Student Progress"
                        >
                          <Target className="h-4 w-4 mr-1" />
                          Progress
                        </button>
                        <button
                          onClick={() => getCourseAnalytics(course._id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          title="View Analytics"
                        >
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Analytics
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course._id)}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          title="Delete Course"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Student Progress Tab */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Student Progress Tracking</h2>

              {selectedCourseForProgress ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedCourseForProgress.title}
                      </h3>
                      <p className="text-gray-600">
                        Track student progress and engagement for this course
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedCourseForProgress(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ← Back to course selection
                    </button>
                  </div>
                  <StudentProgressTracker
                    courseId={selectedCourseForProgress._id}
                    courseName={selectedCourseForProgress.title}
                  />
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-6">
                    Select a course to view detailed student progress and analytics.
                  </p>

                  {courses.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available</h3>
                      <p className="text-gray-600 mb-4">Create a course first to track student progress.</p>
                      <Link
                        to="/instructor/create-course"
                        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center"
                      >
                        <PlusCircle className="h-5 w-5 mr-2" />
                        Create Course
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {courses.map((course) => (
                        <div
                          key={course._id}
                          onClick={() => setSelectedCourseForProgress(course)}
                          className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 cursor-pointer transition-colors border-2 border-transparent hover:border-primary-200"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                              <BookOpen className="h-6 w-6 text-primary-600" />
                            </div>
                            <span className="text-sm text-gray-500">
                              {course.studentsCount} students
                            </span>
                          </div>

                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                            {course.title}
                          </h3>

                          <p className="text-sm text-gray-600 mb-4">
                            {course.category} • {course.level}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-600">
                              <Users className="h-4 w-4 mr-1" />
                              <span>View Progress</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {selectedCourseForAnalytics ? (
              /* Detailed Course Analytics */
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedCourseForAnalytics.title} - Analytics
                      </h2>
                      <p className="text-gray-600">Detailed performance insights for this course</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCourseForAnalytics(null);
                        setCourseAnalytics(null);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ← Back to overview
                    </button>
                  </div>

                  {courseAnalytics && (
                    <div className="space-y-6">
                      {/* Key Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-blue-600">Total Students</p>
                              <p className="text-xl font-bold text-blue-900">{selectedCourseForAnalytics.studentsCount}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <Target className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-green-600">Completion Rate</p>
                              <p className="text-xl font-bold text-green-900">{courseAnalytics.completionRate}%</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Clock className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-purple-600">Avg. Time Spent</p>
                              <p className="text-xl font-bold text-purple-900">{courseAnalytics.averageTimeSpent}min</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-yellow-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                              <Star className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-yellow-600">Satisfaction</p>
                              <p className="text-xl font-bold text-yellow-900">{courseAnalytics.studentSatisfaction}/5.0</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Charts Row */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Enrollment Trend */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Trend</h3>
                          <div className="space-y-3">
                            {courseAnalytics.enrollmentTrend.map((data, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{data.month}</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-32 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full"
                                      style={{ width: `${(data.enrollments / 60) * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium text-gray-900 w-8">{data.enrollments}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Top Performing Modules */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Modules</h3>
                          <div className="space-y-4">
                            {courseAnalytics.topPerformingModules.map((module, index) => (
                              <div key={index} className="border-l-4 border-green-500 pl-4">
                                <h4 className="font-medium text-gray-900">{module.name}</h4>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-sm text-gray-600">Completion: {module.completionRate}%</span>
                                  <span className="text-sm text-gray-600">Rating: {module.avgRating}/5.0</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                                  <div
                                    className="bg-green-500 h-1 rounded-full"
                                    style={{ width: `${module.completionRate}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                        <div className="space-y-3">
                          {courseAnalytics.recentActivity.map((activity, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              <div className={`p-2 rounded-full ${
                                activity.type === 'enrollment' ? 'bg-blue-100' :
                                activity.type === 'completion' ? 'bg-green-100' : 'bg-orange-100'
                              }`}>
                                {activity.type === 'enrollment' && <Users className="h-4 w-4 text-blue-600" />}
                                {activity.type === 'completion' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                {activity.type === 'question' && <MessageSquare className="h-4 w-4 text-orange-600" />}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-900">
                                  <span className="font-medium">{activity.student}</span>
                                  {activity.type === 'enrollment' && ' enrolled in the course'}
                                  {activity.type === 'completion' && ' completed the course'}
                                  {activity.type === 'question' && ' asked a question'}
                                </p>
                                <p className="text-xs text-gray-500">{activity.time}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Analytics Overview */
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Course Performance Analytics</h2>

                {courses.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data</h3>
                    <p className="text-gray-600">Create courses to see performance analytics.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-gray-600">
                      Select a course to view detailed analytics and performance insights.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {courses.map((course) => (
                        <div
                          key={course._id}
                          onClick={() => getCourseAnalytics(course._id)}
                          className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 cursor-pointer transition-colors border-2 border-transparent hover:border-primary-200"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                              <BarChart3 className="h-6 w-6 text-primary-600" />
                            </div>
                            <span className="text-sm text-gray-500">
                              {course.studentsCount} students
                            </span>
                          </div>

                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                            {course.title}
                          </h3>

                          <p className="text-sm text-gray-600 mb-4">
                            {course.category} • {course.level}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-600">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              <span>View Analytics</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Overall Analytics Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                      {/* Course Enrollment Chart */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Enrollment Overview</h3>
                        <div className="space-y-4">
                          {courses.map((course, index) => (
                            <div key={course._id}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600 truncate">{course.title}</span>
                                <span className="font-medium">{course.studentsCount} students</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    index % 4 === 0 ? 'bg-blue-600' :
                                    index % 4 === 1 ? 'bg-green-600' :
                                    index % 4 === 2 ? 'bg-yellow-600' : 'bg-purple-600'
                                  }`}
                                  style={{
                                    width: `${Math.max((course.studentsCount / Math.max(...courses.map(c => c.studentsCount))) * 100, 5)}%`
                                  }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Rating Distribution */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
                        <div className="space-y-4">
                          {courses.map((course, index) => (
                            <div key={course._id}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600 truncate">{course.title}</span>
                                <span className="font-medium flex items-center">
                                  <Star className="h-3 w-3 text-yellow-400 mr-1" />
                                  {course.rating?.average?.toFixed(1) || '0.0'}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-yellow-500 h-2 rounded-full"
                                  style={{ width: `${((course.rating?.average || 0) / 5) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Q&A Tab */}
        {activeTab === 'questions' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Student Questions & Answers</h2>
              <p className="text-gray-600 mt-1">Respond to student questions to help them learn better.</p>
            </div>

            {studentQuestions.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
                <p className="text-gray-600">Students haven't asked any questions yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {studentQuestions.map((question) => (
                  <QuestionCard
                    key={question._id}
                    question={question}
                    onAnswer={answerQuestion}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Course Details Modal */}
        {selectedCourseForDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Course Content Details</h2>
                <button
                  onClick={() => setSelectedCourseForDetails(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {selectedCourseForDetails.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {selectedCourseForDetails.description}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{selectedCourseForDetails.category}</span>
                    <span>•</span>
                    <span>{selectedCourseForDetails.level}</span>
                    <span>•</span>
                    <span>{selectedCourseForDetails.studentsCount} students</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Course Modules</h4>
                  {selectedCourseForDetails.modules && selectedCourseForDetails.modules.length > 0 ? (
                    selectedCourseForDetails.modules.map((module, index) => (
                      <div key={module._id || index} className="border border-gray-200 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 mb-2">
                          Module {index + 1}: {module.title}
                        </h5>
                        {module.description && (
                          <p className="text-gray-600 mb-3">{module.description}</p>
                        )}

                        {module.content && module.content.length > 0 && (
                          <div className="space-y-2">
                            <h6 className="text-sm font-medium text-gray-700">Content:</h6>
                            {module.content.map((content, contentIndex) => (
                              <div key={contentIndex} className="flex items-center space-x-2 text-sm text-gray-600 ml-4">
                                {content.type === 'video' && <Play className="h-4 w-4" />}
                                {content.type === 'text' && <FileText className="h-4 w-4" />}
                                {content.type === 'quiz' && <Award className="h-4 w-4" />}
                                <span>{content.title}</span>
                                {content.type === 'video' && content.videoUrl && (
                                  <span className="text-xs text-blue-600">(Video)</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No modules added yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Question Card Component
const QuestionCard = ({ question, onAnswer }) => {
  const [answer, setAnswer] = useState(question.answer || '');
  const [isAnswering, setIsAnswering] = useState(false);

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;

    setIsAnswering(true);
    try {
      await onAnswer(question._id, answer);
    } finally {
      setIsAnswering(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-start space-x-4">
        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
          <HelpCircle className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-sm font-medium text-gray-900">
              {question.studentName || 'Anonymous Student'}
            </h3>
            <span className="text-xs text-gray-500">
              {question.courseName}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(question.createdAt).toLocaleDateString()}
            </span>
          </div>

          <p className="text-gray-700 mb-4">{question.question}</p>

          {question.answer ? (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                  <MessageSquare className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-sm font-medium text-green-800">Your Answer</span>
                <span className="text-xs text-green-600 ml-2">
                  {new Date(question.answeredAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-green-700">{question.answer}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleSubmitAnswer}
                disabled={!answer.trim() || isAnswering}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {isAnswering ? 'Posting...' : 'Post Answer'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;
