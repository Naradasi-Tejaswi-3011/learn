import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  Target, 
  BarChart3,
  Play,
  CheckSquare,
  Brain,
  Timer,
  FileText,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SelfPacedMode = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudyTime: 0,
    completedTasks: 0,
    currentStreak: 0,
    focusScore: 85
  });

  useEffect(() => {
    // Load user stats from localStorage or API
    const savedStats = localStorage.getItem('selfPacedStats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  const features = [
    {
      title: "Focus Study",
      description: "Distraction-free study environment with PDF reader, timers, and face detection",
      icon: <Brain className="h-8 w-8" />,
      link: "/self-paced/focus-study",
      color: "bg-violet-100 hover:bg-violet-200 border-violet-300",
      textColor: "text-violet-700",
      stats: `${Math.floor(stats.totalStudyTime / 60)}h studied`
    },
    {
      title: "Task Board",
      description: "Kanban-style task management to organize your study objectives",
      icon: <CheckSquare className="h-8 w-8" />,
      link: "/self-paced/task-board",
      color: "bg-blue-100 hover:bg-blue-200 border-blue-300",
      textColor: "text-blue-700",
      stats: `${stats.completedTasks} tasks completed`
    },
    {
      title: "Study Analytics",
      description: "Track your study habits and progress with real-time insights",
      icon: <BarChart3 className="h-8 w-8" />,
      link: "/self-paced/analytics",
      color: "bg-purple-100 hover:bg-purple-200 border-purple-300",
      textColor: "text-purple-700",
      stats: `${stats.focusScore}% focus score`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Floating decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={`absolute animate-float-slow opacity-20 ${
              index === 1 ? 'top-20 left-10' :
              index === 2 ? 'top-40 right-20' :
              index === 3 ? 'bottom-40 left-20' :
              'bottom-20 right-10'
            }`}
            style={{
              animationDelay: `${index * 0.5}s`,
              animationDuration: `${4 + index}s`
            }}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-lg transform rotate-12 shadow-lg"></div>
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-6">
            <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
              <Timer className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Self-Paced Learning Mode
          </h1>
          
          {user && (
            <p className="text-xl text-gray-600 mb-6">
              Welcome back, {user.name}! Ready to focus and achieve your goals?
            </p>
          )}

          <div className="flex justify-center items-center space-x-8 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-indigo-500" />
              <span>{stats.currentStreak} day streak</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-purple-500" />
              <span>{Math.floor(stats.totalStudyTime / 60)}h total study time</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>{stats.focusScore}% focus score</span>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.link}
              className={`group relative overflow-hidden rounded-2xl border-2 ${feature.color} p-8 transition-all duration-300 hover:scale-105 hover:shadow-xl`}
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white to-transparent"></div>
              </div>

              <div className="relative z-10">
                <div className={`inline-flex p-3 rounded-xl ${feature.textColor} bg-white/50 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>

                <h3 className={`text-2xl font-bold ${feature.textColor} mb-4 group-hover:text-opacity-80 transition-colors`}>
                  {feature.title}
                </h3>

                <p className="text-gray-700 mb-6 leading-relaxed">
                  {feature.description}
                </p>

                <div className={`inline-flex items-center space-x-2 ${feature.textColor} font-semibold`}>
                  <span>{feature.stats}</span>
                  <Play className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -skew-x-12 translate-x-full group-hover:translate-x-[-100%] transition-transform duration-700"></div>
            </Link>
          ))}
        </div>

        {/* Quick Stats Dashboard */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Today's Progress
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {Math.floor(stats.totalStudyTime / 60)}h
              </div>
              <div className="text-sm text-blue-700">Study Time</div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.completedTasks}
              </div>
              <div className="text-sm text-green-700">Tasks Done</div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats.focusScore}%
              </div>
              <div className="text-sm text-purple-700">Focus Score</div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {stats.currentStreak}
              </div>
              <div className="text-sm text-orange-700">Day Streak</div>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center mt-8">
          <Link
            to="/student-dashboard"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <BookOpen className="h-5 w-5" />
            <span>Back to Main Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default SelfPacedMode;
