import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Save,
  ArrowLeft
} from 'lucide-react';

const CreateCourse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    category: 'Programming',
    level: 'Beginner',
    tags: [],
    requirements: [],
    learningOutcomes: [],
    isPublished: true // Auto-publish courses for easier testing
  });

  const [modules, setModules] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [newOutcome, setNewOutcome] = useState('');

  const categories = [
    'Programming', 'Design', 'Business', 'Marketing', 'Photography', 
    'Music', 'Health & Fitness', 'Language', 'Personal Development', 
    'Academic', 'Other'
  ];

  const levels = ['Beginner', 'Intermediate', 'Advanced'];

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

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setCourseData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (index) => {
    setCourseData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const addOutcome = () => {
    if (newOutcome.trim()) {
      setCourseData(prev => ({
        ...prev,
        learningOutcomes: [...prev.learningOutcomes, newOutcome.trim()]
      }));
      setNewOutcome('');
    }
  };

  const removeOutcome = (index) => {
    setCourseData(prev => ({
      ...prev,
      learningOutcomes: prev.learningOutcomes.filter((_, i) => i !== index)
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
    setLoading(true);

    // Client-side validation
    const errors = [];

    if (!courseData.title || courseData.title.trim().length < 3) {
      errors.push('Course title must be at least 3 characters long');
    }

    if (!courseData.description || courseData.description.trim().length < 10) {
      errors.push('Course description must be at least 10 characters long');
    }

    if (modules.length === 0) {
      errors.push('Please add at least one module to your course');
    }

    // Check if modules have content
    const modulesWithoutContent = modules.filter(module => module.content.length === 0);
    if (modulesWithoutContent.length > 0) {
      errors.push('All modules must have at least one piece of content');
    }

    // Check if module titles are filled
    const modulesWithoutTitle = modules.filter(module => !module.title || module.title.trim().length < 3);
    if (modulesWithoutTitle.length > 0) {
      errors.push('All modules must have a title (at least 3 characters)');
    }

    if (errors.length > 0) {
      alert('Please fix the following errors:\n\n' + errors.join('\n'));
      setLoading(false);
      return;
    }

    try {
      console.log('Creating course with data:', { ...courseData, modules });

      const response = await axios.post('/courses', {
        ...courseData,
        modules
      });

      console.log('Course creation response:', response.data);

      if (response.data.success) {
        alert('🎉 Course created successfully! Students can now enroll in your course.');
        // Add a small delay to ensure the course is saved before navigating
        setTimeout(() => {
          navigate('/instructor');
        }, 1000);
      }
    } catch (error) {
      console.error('Error creating course:', error);
      console.error('Error details:', error.response?.data);

      let errorMessage = 'Failed to create course. ';

      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors = error.response.data.errors.map(err => err.msg).join('\n');
        errorMessage += 'Validation errors:\n' + validationErrors;
      } else {
        errorMessage += error.response?.data?.message || error.message;
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
              <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
              <p className="text-gray-600 mt-2">Build an engaging learning experience for your students.</p>
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
                  placeholder="Enter course title (e.g., Complete Web Development Bootcamp)"
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

          {/* Tags */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Tags</h2>
            
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Add a tag"
              />
              <button
                type="button"
                onClick={addTag}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {courseData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-primary-600 hover:text-primary-800"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Course Modules */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Course Modules</h2>
              <button
                type="button"
                onClick={addModule}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add Module</span>
              </button>
            </div>

            <div className="space-y-6">
              {modules.map((module, moduleIndex) => (
                <div key={moduleIndex} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Module {moduleIndex + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeModule(moduleIndex)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <input
                        type="text"
                        value={module.title}
                        onChange={(e) => updateModule(moduleIndex, 'title', e.target.value)}
                        className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-full ${
                          module.title && module.title.length < 3
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300'
                        }`}
                        placeholder="Module title (minimum 3 characters)"
                        required
                      />
                      {module.title && module.title.length < 3 && (
                        <p className="text-red-500 text-xs mt-1">Module title must be at least 3 characters</p>
                      )}
                    </div>
                    <input
                      type="text"
                      value={module.description}
                      onChange={(e) => updateModule(moduleIndex, 'description', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Module description (optional)"
                    />
                  </div>

                  <div className="space-y-3">
                    {module.content.map((content, contentIndex) => (
                      <div key={contentIndex} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <select
                            value={content.type}
                            onChange={(e) => updateModuleContent(moduleIndex, contentIndex, 'type', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="video">Video</option>
                            <option value="text">Text</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => removeContentFromModule(moduleIndex, contentIndex)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={content.title}
                          onChange={(e) => updateModuleContent(moduleIndex, contentIndex, 'title', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm mb-2"
                          placeholder="Content title"
                        />

                        {content.type === 'video' && (
                          <input
                            type="url"
                            value={content.videoUrl}
                            onChange={(e) => updateModuleContent(moduleIndex, contentIndex, 'videoUrl', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Video URL (YouTube, Vimeo, or direct link)"
                          />
                        )}

                        {content.type === 'text' && (
                          <textarea
                            value={content.textContent}
                            onChange={(e) => updateModuleContent(moduleIndex, contentIndex, 'textContent', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            rows={3}
                            placeholder="Text content"
                          />
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addContentToModule(moduleIndex)}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-colors"
                    >
                      <Plus className="h-5 w-5 mx-auto mb-1" />
                      Add Content
                    </button>
                  </div>
                </div>
              ))}
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
              <span className="text-sm text-gray-700">Publish course immediately</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="h-5 w-5" />
              <span>{loading ? 'Creating...' : 'Create Course'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourse;
