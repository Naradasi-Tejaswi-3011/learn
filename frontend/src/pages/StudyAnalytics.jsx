import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  TrendingUp, 
  Clock, 
  Target, 
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Flame,
  BookOpen,
  CheckCircle,
  Eye,
  Timer
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StudyAnalytics = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState({
    weeklyStudyTime: [],
    dailyFocusScore: [],
    subjectDistribution: [],
    studyStreaks: { current: 0, longest: 0 },
    totalStats: {
      totalStudyTime: 0,
      totalSessions: 0,
      averageFocusScore: 0,
      completedTasks: 0,
      pagesRead: 0
    }
  });

  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = () => {
    // Load data from localStorage
    const savedStats = localStorage.getItem('selfPacedStats');
    const savedSessions = localStorage.getItem('studySessions');
    const savedTasks = localStorage.getItem('selfPaced-tasks');

    let stats = {
      totalStudyTime: 0,
      completedTasks: 0,
      currentStreak: 0,
      focusScore: 85
    };

    if (savedStats) {
      stats = { ...stats, ...JSON.parse(savedStats) };
    }

    // Generate sample weekly data based on real stats
    const weeklyData = generateWeeklyData(stats);
    const dailyFocus = generateDailyFocusData();
    const subjectData = generateSubjectDistribution();

    setAnalyticsData({
      weeklyStudyTime: weeklyData,
      dailyFocusScore: dailyFocus,
      subjectDistribution: subjectData,
      studyStreaks: {
        current: stats.currentStreak || 0,
        longest: Math.max(stats.currentStreak || 0, 7)
      },
      totalStats: {
        totalStudyTime: stats.totalStudyTime || 0,
        totalSessions: weeklyData.reduce((sum, day) => sum + day.sessions, 0),
        averageFocusScore: stats.focusScore || 85,
        completedTasks: stats.completedTasks || 0,
        pagesRead: stats.pagesRead || 0
      }
    });
  };

  const generateWeeklyData = (stats) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const baseTime = Math.floor((stats.totalStudyTime || 0) / 7);
    
    return days.map((day, index) => ({
      day,
      minutes: Math.max(0, baseTime + Math.floor(Math.random() * 60) - 30),
      sessions: Math.floor(Math.random() * 4) + 1,
      focusScore: Math.floor(Math.random() * 20) + 75
    }));
  };

  const generateDailyFocusData = () => {
    const hours = [];
    for (let i = 6; i <= 23; i++) {
      hours.push({
        hour: i,
        focusScore: Math.floor(Math.random() * 40) + 60,
        studyTime: Math.floor(Math.random() * 30)
      });
    }
    return hours;
  };

  const generateSubjectDistribution = () => {
    return [
      { subject: 'Mathematics', hours: 25, color: 'bg-blue-500', percentage: 30 },
      { subject: 'Science', hours: 20, color: 'bg-green-500', percentage: 24 },
      { subject: 'Literature', hours: 15, color: 'bg-purple-500', percentage: 18 },
      { subject: 'History', hours: 12, color: 'bg-yellow-500', percentage: 14 },
      { subject: 'Languages', hours: 11, color: 'bg-pink-500', percentage: 14 }
    ];
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatHour = (hour) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  const maxWeeklyTime = Math.max(...analyticsData.weeklyStudyTime.map(d => d.minutes));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/self-paced"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Self-Paced Mode</span>
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-xl font-semibold text-gray-900">Study Analytics</h1>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Study Time</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatTime(analyticsData.totalStats.totalStudyTime)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Study Sessions</p>
                <p className="text-2xl font-bold text-green-600">
                  {analyticsData.totalStats.totalSessions}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Focus Score</p>
                <p className="text-2xl font-bold text-purple-600">
                  {analyticsData.totalStats.averageFocusScore}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tasks Completed</p>
                <p className="text-2xl font-bold text-orange-600">
                  {analyticsData.totalStats.completedTasks}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Streak</p>
                <p className="text-2xl font-bold text-red-600">
                  {analyticsData.studyStreaks.current} days
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <Flame className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Weekly Study Time Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Weekly Study Time</h2>
              <BarChart3 className="h-5 w-5 text-gray-500" />
            </div>

            {isClient && (
              <div className="space-y-4">
                {analyticsData.weeklyStudyTime.map((day, index) => (
                  <div key={day.day} className="flex items-center space-x-4">
                    <div className="w-12 text-sm text-gray-600 font-medium">
                      {day.day}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                        style={{ width: `${(day.minutes / maxWeeklyTime) * 100}%` }}
                      >
                        {day.minutes > 0 && (
                          <span className="text-white text-xs font-medium">
                            {formatTime(day.minutes)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-16 text-sm text-gray-500">
                      {day.sessions} sessions
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subject Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Subject Distribution</h2>
              <PieChart className="h-5 w-5 text-gray-500" />
            </div>

            <div className="space-y-4">
              {analyticsData.subjectDistribution.map((subject, index) => (
                <div key={subject.subject} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${subject.color}`}></div>
                    <span className="text-sm font-medium text-gray-900">
                      {subject.subject}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {formatTime(subject.hours * 60)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({subject.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Visual pie chart representation */}
            {isClient && (
              <div className="mt-6 flex justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                    {analyticsData.subjectDistribution.map((subject, index) => {
                      let cumulativePercentage = 0;
                      for (let i = 0; i < index; i++) {
                        cumulativePercentage += analyticsData.subjectDistribution[i].percentage;
                      }
                      
                      const startAngle = (cumulativePercentage / 100) * 360;
                      const endAngle = ((cumulativePercentage + subject.percentage) / 100) * 360;
                      const startRadians = (startAngle - 90) * (Math.PI / 180);
                      const endRadians = (endAngle - 90) * (Math.PI / 180);
                      
                      const startX = 50 + 40 * Math.cos(startRadians);
                      const startY = 50 + 40 * Math.sin(startRadians);
                      const endX = 50 + 40 * Math.cos(endRadians);
                      const endY = 50 + 40 * Math.sin(endRadians);
                      
                      const largeArcFlag = subject.percentage > 50 ? 1 : 0;
                      const pathData = `M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
                      
                      return (
                        <path
                          key={subject.subject}
                          d={pathData}
                          className={subject.color.replace('bg-', 'fill-')}
                          opacity="0.8"
                        />
                      );
                    })}
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Daily Focus Pattern */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Daily Focus Pattern</h2>
            <Activity className="h-5 w-5 text-gray-500" />
          </div>

          {isClient && (
            <div className="grid grid-cols-6 md:grid-cols-9 lg:grid-cols-18 gap-1">
              {analyticsData.dailyFocusScore.map((hour, index) => (
                <div
                  key={hour.hour}
                  className="group relative"
                  title={`${formatHour(hour.hour)}: ${hour.focusScore}% focus, ${hour.studyTime}m study`}
                >
                  <div
                    className={`w-full h-8 rounded transition-all duration-200 hover:scale-110 ${
                      hour.focusScore >= 80 ? 'bg-green-500' :
                      hour.focusScore >= 60 ? 'bg-yellow-500' :
                      hour.focusScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ opacity: hour.studyTime > 0 ? 0.8 : 0.2 }}
                  />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {formatHour(hour.hour)}<br />
                    {hour.focusScore}% focus<br />
                    {hour.studyTime}m study
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <span>6 AM</span>
            <span>12 PM</span>
            <span>6 PM</span>
            <span>11 PM</span>
          </div>

          <div className="mt-4 flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-600">High Focus (80%+)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-gray-600">Good Focus (60-79%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-gray-600">Fair Focus (40-59%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-600">Low Focus (&lt;40%)</span>
            </div>
          </div>
        </div>

        {/* Study Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Study Streaks */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Study Streaks</h2>
              <Flame className="h-5 w-5 text-orange-500" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Current Streak</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {analyticsData.studyStreaks.current} days
                  </p>
                </div>
                <Flame className="h-8 w-8 text-orange-500" />
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Longest Streak</p>
                  <p className="text-2xl font-bold text-red-600">
                    {analyticsData.studyStreaks.longest} days
                  </p>
                </div>
                <Award className="h-8 w-8 text-red-500" />
              </div>
            </div>
          </div>

          {/* Study Recommendations */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recommendations</h2>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm font-medium text-blue-800 mb-1">
                  Peak Performance Time
                </p>
                <p className="text-sm text-blue-700">
                  Your focus is highest between 9-11 AM. Schedule important tasks during this time.
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <p className="text-sm font-medium text-green-800 mb-1">
                  Study Consistency
                </p>
                <p className="text-sm text-green-700">
                  Great job maintaining your {analyticsData.studyStreaks.current}-day streak! Keep it up.
                </p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                <p className="text-sm font-medium text-yellow-800 mb-1">
                  Subject Balance
                </p>
                <p className="text-sm text-yellow-700">
                  Consider spending more time on weaker subjects to improve overall performance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyAnalytics;
