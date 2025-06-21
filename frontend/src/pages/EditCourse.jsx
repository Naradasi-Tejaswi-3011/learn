import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Save,
  ArrowLeft,
  Loader
} from 'lucide-react';

const EditCourse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    category: 'Programming',
    level: 'Beginner',
    tags: [],
    requirements: [],
    learningOutcomes: [],
    isPublished: false
  });

  const [modules, setModules] = useState([]);
  const [newTag, setNewTag] = useState('');

  const categories = [
    'Programming', 'Design', 'Business', 'Marketing', 'Photography', 
    'Music', 'Health & Fitness', 'Language', 'Personal Development', 
    'Academic', 'Other'
  ];

  const levels = ['Beginner', 'Intermediate', 'Advanced'];

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/courses/${id}`);
      const course = response.data.course;
      
      // Verify instructor ownership
      if (course.instructor?._id !== user?._id) {
        alert('You can only edit your own courses.');
        navigate('/instructor');
        return;
      }

      setCourseData({
        title: course.title,
        description: course.description,
        shortDescription: course.shortDescription || '',
        category: course.category,
        level: course.level,
        tags: course.tags || [],
        requirements: course.requirements || [],
        learningOutcomes: course.learningOutcomes || [],
        isPublished: course.isPublished
      });

      setModules(course.modules || []);
    } catch (error) {
      console.error('Error fetching course:', error);
      alert('Failed to load course. Please try again.');
      navigate('/instructor');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCourseData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !courseData.tags.includes(newTag.trim())) {
      setCourseData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setCourseData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addModule = () => {
    setModules(prev => [...prev, {
      title: '',
      description: '',
      order: prev.length + 1,
      content: []
    }]);
  };

  const updateModule = (index, field, value) => {
    setModules(prev => prev.map((module, i) => 
      i === index ? { ...module, [field]: value } : module
    ));
  };

  const removeModule = (index) => {
    setModules(prev => prev.filter((_, i) => i !== index));
  };

  const addContentToModule = (moduleIndex) => {
    setModules(prev => prev.map((module, i) =>
      i === moduleIndex ? {
        ...module,
        content: [...module.content, {
          type: 'video',
          title: '',
          order: module.content.length + 1,
          videoUrl: '',
          textContent: '',
          xpReward: 10
        }]
      } : module
    ));
  };

  const updateModuleContent = (moduleIndex, contentIndex, field, value) => {
    setModules(prev => prev.map((module, i) => 
      i === moduleIndex ? {
        ...module,
        content: module.content.map((content, j) => 
          j === contentIndex ? { ...content, [field]: value } : content
        )
      } : module
    ));
  };

  const removeContentFromModule = (moduleIndex, contentIndex) => {
    setModules(prev => prev.map((module, i) => 
      i === moduleIndex ? {
        ...module,
        content: module.content.filter((_, j) => j !== contentIndex)
      } : module
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Client-side validation
    const errors = [];
    
    if (!courseData.title || courseData.title.trim().length < 3) {
      errors.push('Course title must be at least 3 characters long');
    }
    
    if (!courseData.description || courseData.description.trim().length < 10) {
      errors.push('Course description must be at least 10 characters long');
    }
    
    if (errors.length > 0) {
      alert('Please fix the following errors:\n\n' + errors.join('\n'));
      setSaving(false);
      return;
    }

    try {
      console.log('Updating course with data:', { ...courseData, modules });

      const response = await axios.put(`${import.meta.env.VITE_API_URL}/courses/${id}`, {
        ...courseData,
        modules
      });

      console.log('Course update response:', response.data);

      if (response.data.success) {
        alert('🎉 Course updated successfully!');
        navigate('/instructor');
      }
    } catch (error) {
      console.error('Error updating course:', error);
      console.error('Error details:', error.response?.data);
      
      let errorMessage = 'Failed to update course. ';
      
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors = error.response.data.errors.map(err => err.msg).join('\n');
        errorMessage += 'Validation errors:\n' + validationErrors;
      } else {
        errorMessage += error.response?.data?.message || error.message;
      }
      
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/instructor')}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Course</h1>
              <p className="text-gray-600 mt-2">Update your course content and settings.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Title * <span className="text-xs text-gray-500">(minimum 3 characters)</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  minLength={3}
                  value={courseData.title}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    courseData.title && courseData.title.length < 3 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter course title"
                />
                {courseData.title && courseData.title.length < 3 && (
                  <p className="text-red-500 text-xs mt-1">Title must be at least 3 characters long</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  required
                  value={courseData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level *
                </label>
                <select
                  name="level"
                  required
                  value={courseData.level}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {levels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description
                </label>
                <input
                  type="text"
                  name="shortDescription"
                  value={courseData.shortDescription}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Brief description for course cards"
                  maxLength={200}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description * <span className="text-xs text-gray-500">(minimum 10 characters)</span>
                </label>
                <textarea
                  name="description"
                  required
                  minLength={10}
                  value={courseData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    courseData.description && courseData.description.length < 10 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Provide a detailed description of what students will learn in this course..."
                />
                {courseData.description && courseData.description.length < 10 && (
                  <p className="text-red-500 text-xs mt-1">Description must be at least 10 characters long</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {courseData.description.length}/1000 characters
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isPublished"
                checked={courseData.isPublished}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Course is published</span>
            </label>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => navigate('/instructor')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <Save className="h-5 w-5" />
                <span>{saving ? 'Updating...' : 'Update Course'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCourse;
