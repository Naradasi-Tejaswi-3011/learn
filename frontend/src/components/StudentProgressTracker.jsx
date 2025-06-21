import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Award, 
  BookOpen,
  CheckCircle,
  XCircle,
  BarChart3,
  User,
  Calendar,
  Target,
  Activity
} from 'lucide-react';

const StudentProgressTracker = ({ courseId, courseName }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [progressStats, setProgressStats] = useState({
    totalEnrolled: 0,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    averageProgress: 0
  });

  useEffect(() => {
    fetchStudentProgress();
  }, [courseId]);

  const fetchStudentProgress = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/progress/course/${courseId}/students`);
      const progressData = response.data.students || [];
      
      setStudents(progressData);
      
      // Calculate stats
      const totalEnrolled = progressData.length;
      const completed = progressData.filter(s => s.completionPercentage >= 100).length;
      const inProgress = progressData.filter(s => s.completionPercentage > 0 && s.completionPercentage < 100).length;
      const notStarted = progressData.filter(s => s.completionPercentage === 0).length;
      const averageProgress = totalEnrolled > 0 
        ? progressData.reduce((sum, s) => sum + s.completionPercentage, 0) / totalEnrolled 
        : 0;

      setProgressStats({
        totalEnrolled,
        completed,
        inProgress,
        notStarted,
        averageProgress: Math.round(averageProgress)
      });

    } catch (error) {
      console.error('Error fetching student progress:', error);
      // For demo purposes, create some mock data
      const mockStudents = [
        {
          _id: '1',
          student: { name: 'John Doe', email: 'john@example.com' },
          completionPercentage: 85,
          completedModules: 8,
          totalModules: 10,
          lastAccessed: new Date(),
          timeSpent: 120,
          xpEarned: 450
        },
        {
          _id: '2',
          student: { name: 'Jane Smith', email: 'jane@example.com' },
          completionPercentage: 100,
          completedModules: 10,
          totalModules: 10,
          lastAccessed: new Date(),
          timeSpent: 180,
          xpEarned: 600
        },
        {
          _id: '3',
          student: { name: 'Mike Johnson', email: 'mike@example.com' },
          completionPercentage: 45,
          completedModules: 4,
          totalModules: 10,
          lastAccessed: new Date(),
          timeSpent: 60,
          xpEarned: 200
        }
      ];
      
      setStudents(mockStudents);
      setProgressStats({
        totalEnrolled: 3,
        completed: 1,
        inProgress: 2,
        notStarted: 0,
        averageProgress: 77
      });
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'text-green-600 bg-green-100';
    if (percentage >= 70) return 'text-blue-600 bg-blue-100';
    if (percentage >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Enrolled</p>
              <p className="text-2xl font-bold text-gray-900">{progressStats.totalEnrolled}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{progressStats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <Activity className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{progressStats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Progress</p>
              <p className="text-2xl font-bold text-gray-900">{progressStats.averageProgress}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Progress List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Student Progress Details</h3>
          <p className="text-sm text-gray-600">Track individual student progress and engagement</p>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No students enrolled</h4>
            <p className="text-gray-600">Students will appear here once they enroll in your course.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modules
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    XP Earned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((studentProgress) => (
                  <tr key={studentProgress._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {studentProgress.student?.name || 'Unknown Student'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {studentProgress.student?.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className={`h-2 rounded-full ${getProgressBarColor(studentProgress.completionPercentage)}`}
                            style={{ width: `${studentProgress.completionPercentage}%` }}
                          ></div>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getProgressColor(studentProgress.completionPercentage)}`}>
                          {studentProgress.completionPercentage}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {studentProgress.completedModules || 0}/{studentProgress.totalModules || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {Math.round((studentProgress.timeSpent || 0) / 60)} hours
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Award className="h-4 w-4 text-yellow-500 mr-1" />
                        {studentProgress.xpEarned || 0} XP
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {studentProgress.lastAccessed 
                        ? new Date(studentProgress.lastAccessed).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProgressTracker;
