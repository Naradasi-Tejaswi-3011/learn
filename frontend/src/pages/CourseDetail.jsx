import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import CourseQA from '../components/CourseQA';
import {
  Play,
  Clock,
  Users,
  Star,
  BookOpen,
  Award,
  CheckCircle,
  Lock
} from 'lucide-react';

const CourseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        console.log('Fetching course with ID:', id);
        console.log('Current user:', user);

        const response = await axios.get(`${import.meta.env.VITE_API_URL}/courses/${id}`);

        console.log('Course fetch response:', response.data);

        setCourse(response.data.course);
        setIsEnrolled(response.data.isEnrolled);
      } catch (error) {
        console.error('Error fetching course:', error);
        console.error('Error response:', error.response?.data);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, user]);

  const handleEnroll = async () => {
    if (!user) {
      alert('Please log in to enroll in courses.');
      return;
    }

    if (user.role !== 'student') {
      alert('Only students can enroll in courses. Please switch to a student account.');
      return;
    }

    setEnrolling(true);
    try {
      console.log('Attempting to enroll user:', user);
      console.log('Course ID:', id);

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/courses/${id}/enroll`);

      console.log('Enrollment response:', response.data);

      if (response.data.success) {
        setIsEnrolled(true);
        alert('🎉 Successfully enrolled in the course! You can now start learning.');

        // Optionally redirect to the course player
        setTimeout(() => {
          window.location.href = `/learn/${id}`;
        }, 1500);
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      console.error('Error response:', error.response?.data);

      const errorMessage = error.response?.data?.message || 'Failed to enroll. Please try again.';
      alert(`Enrollment failed: ${errorMessage}`);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Course not found</h2>
          <Link to="/" className="text-primary-600 hover:text-primary-700">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {course.category}
                </span>
                <span className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {course.level}
                </span>
              </div>
              
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-xl text-primary-100 mb-6">{course.description}</p>
              
              <div className="flex items-center space-x-6 mb-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>{course.studentsCount} students</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>{course.totalDuration} minutes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <span>{course.rating?.average?.toFixed(1) || '0.0'} ({course.rating?.count || 0} reviews)</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-6">
                <img 
                  src={course.instructor?.avatar || `https://ui-avatars.com/api/?name=${course.instructor?.name || 'Instructor'}&background=3b82f6&color=fff`}
                  alt={course.instructor?.name || 'Instructor'}
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <p className="font-medium">Instructor: {course.instructor?.name || 'Unknown'}</p>
                  {course.instructor?.bio && (
                    <p className="text-sm text-primary-100">{course.instructor.bio}</p>
                  )}
                </div>
              </div>

              {user ? (
                isEnrolled ? (
                  <Link 
                    to={`/learn/${course._id}`}
                    className="bg-white text-primary-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold text-lg transition-colors inline-flex items-center"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Continue Learning
                  </Link>
                ) : user.role === 'student' ? (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="bg-white text-primary-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                ) : (
                  <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg">
                    Switch to student account to enroll
                  </div>
                )
              ) : (
                <Link 
                  to="/login"
                  className="bg-white text-primary-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold text-lg transition-colors inline-block"
                >
                  Sign in to Enroll
                </Link>
              )}
            </div>

            <div className="lg:flex justify-center hidden">
              <div className="bg-white bg-opacity-10 rounded-lg p-8 backdrop-blur-sm max-w-md">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center mb-4">
                    <Play className="h-16 w-16 text-white opacity-80" />
                  </div>
                )}
                <p className="text-center text-primary-100">Course Preview</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* What You'll Learn */}
            {course.learningOutcomes && course.learningOutcomes.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">What You'll Learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {course.learningOutcomes.map((outcome, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Modules */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Content</h2>
              <div className="space-y-4">
                {course.modules?.map((module, index) => (
                  <div key={module._id} className="border border-gray-200 rounded-lg">
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">
                          Module {index + 1}: {module?.title || 'Module'}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <BookOpen className="h-4 w-4" />
                          <span>{module.content.length} lessons</span>
                        </div>
                      </div>
                      {module.description && (
                        <p className="text-gray-600 mt-2">{module.description}</p>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="space-y-2">
                        {module.content.map((content, contentIndex) => (
                          <div key={contentIndex} className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-3">
                              {content.type === 'video' && <Play className="h-4 w-4 text-gray-400" />}
                              {content.type === 'text' && <BookOpen className="h-4 w-4 text-gray-400" />}
                              {content.type === 'quiz' && <Award className="h-4 w-4 text-gray-400" />}
                              <span className="text-gray-700">{content.title}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {content.type === 'video' && content.videoDuration && (
                                <span className="text-sm text-gray-500">
                                  {Math.ceil(content.videoDuration / 60)}min
                                </span>
                              )}
                              {!isEnrolled && <Lock className="h-4 w-4 text-gray-400" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements */}
            {course.requirements && course.requirements.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Requirements</h2>
                <ul className="space-y-2">
                  {course.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="h-2 w-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Q&A Section */}
            <CourseQA courseId={course._id} courseName={course.title} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Course Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Students Enrolled</span>
                  <span className="font-semibold">{course.studentsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Modules</span>
                  <span className="font-semibold">{course.modules?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Duration</span>
                  <span className="font-semibold">{course.totalDuration}min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Average Rating</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="font-semibold">{course.rating?.average?.toFixed(1) || '0.0'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {course.tags && course.tags.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {course.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
