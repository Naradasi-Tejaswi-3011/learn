import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  BookOpen, 
  Award,
  CheckCircle,
  Clock,
  FileText
} from 'lucide-react';

const CoursePlayer = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [currentModule, setCurrentModule] = useState(0);
  const [currentContent, setCurrentContent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [contentStartTime, setContentStartTime] = useState(null);
  const [videoWatchTime, setVideoWatchTime] = useState(0);
  const [isContentCompleted, setIsContentCompleted] = useState(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const [courseRes, progressRes] = await Promise.all([
          axios.get(`/courses/${courseId}/modules`),
          axios.get(`/progress/${courseId}`)
        ]);

        setCourse(courseRes.data);
        setProgress(progressRes.data.progress);

        // Set content start time when content loads
        setContentStartTime(Date.now());
      } catch (error) {
        console.error('Error fetching course data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  // Track content start time when content changes
  useEffect(() => {
    setContentStartTime(Date.now());
    setIsContentCompleted(false);
    setVideoWatchTime(0);
  }, [currentModule, currentContent]);

  const updateProgress = async (moduleId, contentId, progressData) => {
    try {
      const response = await axios.put(`/progress/${courseId}/module/${moduleId}`, {
        contentId,
        ...progressData
      });

      // Update local progress state
      if (response.data.progress) {
        setProgress(response.data.progress);
      }

      // Check if course was completed
      if (response.data.courseCompleted) {
        setTimeout(() => {
          const takeQuiz = window.confirm(
            '🎉 Congratulations! You have completed the entire course!\n\n' +
            'Would you like to take a voice quiz to test your knowledge and earn badges?'
          );

          if (takeQuiz) {
            navigate('/quiz', {
              state: {
                completedCourse: {
                  id: course.course?._id || courseId,
                  title: course.course?.title || 'Course',
                  category: course.course?.category || 'General',
                  description: course.course?.description || '',
                  modules: course.modules || []
                }
              }
            });
          }
        }, 1000);
      }

      return response.data;
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  // Check if content can be marked complete
  const canMarkComplete = () => {
    const module = course?.modules[currentModule];
    const content = module?.content[currentContent];

    if (!content) return false;

    // For video content, require at least 90% watched
    if (content.type === 'video') {
      // If we can't determine duration, allow after 30 seconds of watching
      return videoWatchTime >= 30;
    }

    // For text content, require at least 10 seconds of reading time
    if (content.type === 'text') {
      const timeSpent = contentStartTime ? (Date.now() - contentStartTime) / 1000 : 0;
      return timeSpent >= 10;
    }

    // For other content types, allow immediate completion
    return true;
  };

  const markContentComplete = async () => {
    if (isContentCompleted || !canMarkComplete()) return;

    const module = course.modules[currentModule];
    const content = module.content[currentContent];

    // Calculate time spent
    const timeSpent = contentStartTime ? Math.floor((Date.now() - contentStartTime) / 1000) : 0;

    setIsContentCompleted(true);

    const result = await updateProgress(module._id, content._id, {
      contentType: content.type,
      progress: 100,
      timeSpent: timeSpent,
      completed: true,
      videoProgress: content.type === 'video' ? {
        watchedDuration: videoWatchTime,
        watchedPercentage: 100
      } : undefined
    });

    // Award XP
    try {
      await axios.post('/gamification/xp', {
        points: content.xpReward || 10,
        reason: `Completed ${content.title}`
      });
    } catch (error) {
      console.error('Error awarding XP:', error);
    }

    // Auto-navigate to next content after a short delay
    setTimeout(() => {
      navigateContent('next');
    }, 1500);
  };

  const navigateContent = (direction) => {
    const module = course.modules[currentModule];
    
    if (direction === 'next') {
      if (currentContent < module.content.length - 1) {
        setCurrentContent(currentContent + 1);
      } else if (currentModule < course.modules.length - 1) {
        setCurrentModule(currentModule + 1);
        setCurrentContent(0);
      }
    } else {
      if (currentContent > 0) {
        setCurrentContent(currentContent - 1);
      } else if (currentModule > 0) {
        setCurrentModule(currentModule - 1);
        setCurrentContent(course.modules[currentModule - 1].content.length - 1);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!course || !course.modules.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No content available</h2>
          <p className="text-gray-600">This course doesn't have any modules yet.</p>
        </div>
      </div>
    );
  }

  const currentModuleData = course.modules[currentModule];
  const currentContentData = currentModuleData.content[currentContent];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex">
        {/* Sidebar - Course Navigation */}
        <div className="w-80 bg-gray-800 h-screen overflow-y-auto">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-bold truncate">{course.course?.title || 'Course'}</h2>
            <p className="text-sm text-gray-400">
              Module {currentModule + 1} of {course.modules.length}
            </p>
          </div>

          <div className="p-4">
            {course.modules.map((module, moduleIndex) => (
              <div key={module._id} className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">{module.title}</h3>
                  <span className="text-xs text-gray-400">
                    {module.content.length} lessons
                  </span>
                </div>
                
                <div className="space-y-1">
                  {module.content.map((content, contentIndex) => (
                    <button
                      key={contentIndex}
                      onClick={() => {
                        setCurrentModule(moduleIndex);
                        setCurrentContent(contentIndex);
                      }}
                      className={`w-full text-left p-2 rounded text-sm transition-colors ${
                        moduleIndex === currentModule && contentIndex === currentContent
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {content.type === 'video' && <Play className="h-4 w-4" />}
                        {content.type === 'text' && <FileText className="h-4 w-4" />}
                        {content.type === 'quiz' && <Award className="h-4 w-4" />}
                        <span className="truncate">{content.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-gray-800 p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">{currentContentData.title}</h1>
                <p className="text-gray-400 text-sm">
                  {currentModuleData.title} • Lesson {currentContent + 1} of {currentModuleData.content.length}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigateContent('prev')}
                  disabled={currentModule === 0 && currentContent === 0}
                  className="p-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SkipBack className="h-5 w-5" />
                </button>
                
                <button
                  onClick={markContentComplete}
                  disabled={isContentCompleted || !canMarkComplete()}
                  className={`px-4 py-2 rounded font-medium transition-colors ${
                    isContentCompleted || !canMarkComplete()
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  <CheckCircle className="h-5 w-5 inline mr-2" />
                  {isContentCompleted ? 'Completed' : canMarkComplete() ? 'Mark Complete' : 'Watch to Complete'}
                </button>
                
                <button
                  onClick={() => navigateContent('next')}
                  disabled={
                    currentModule === course.modules.length - 1 && 
                    currentContent === currentModuleData.content.length - 1
                  }
                  className="p-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SkipForward className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content Display */}
          <div className="flex-1 p-8">
            {currentContentData.type === 'video' && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-black rounded-lg aspect-video mb-6">
                  {currentContentData.videoUrl ? (
                    (() => {
                      const url = currentContentData.videoUrl;

                      // YouTube video detection and embedding
                      if (url.includes('youtube.com') || url.includes('youtu.be')) {
                        let videoId = '';
                        if (url.includes('youtube.com/watch?v=')) {
                          videoId = url.split('v=')[1]?.split('&')[0];
                        } else if (url.includes('youtu.be/')) {
                          videoId = url.split('youtu.be/')[1]?.split('?')[0];
                        }

                        if (videoId) {
                          return (
                            <iframe
                              src={`https://www.youtube.com/embed/${videoId}`}
                              className="w-full h-full rounded-lg"
                              allowFullScreen
                              title={currentContentData.title}
                            />
                          );
                        }
                      }

                      // Vimeo video detection
                      if (url.includes('vimeo.com')) {
                        const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
                        if (videoId) {
                          return (
                            <iframe
                              src={`https://player.vimeo.com/video/${videoId}`}
                              className="w-full h-full rounded-lg"
                              allowFullScreen
                              title={currentContentData.title}
                            />
                          );
                        }
                      }

                      // Direct video file (mp4, webm, etc.)
                      if (url.match(/\.(mp4|webm|ogg|mov)$/i)) {
                        return (
                          <video
                            className="w-full h-full rounded-lg"
                            controls
                            preload="metadata"
                            onTimeUpdate={(e) => {
                              setVideoWatchTime(e.target.currentTime);
                            }}
                            onEnded={() => {
                              if (!isContentCompleted) {
                                markContentComplete();
                              }
                            }}
                          >
                            <source src={url} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        );
                      }

                      // Fallback for other URLs
                      return (
                        <div className="flex items-center justify-center h-full text-center">
                          <div>
                            <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-400 mb-2">Video Content</p>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 underline text-sm"
                            >
                              Open Video Link
                            </a>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex items-center justify-center h-full text-center">
                      <div>
                        <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">No video URL provided</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentContentData.type === 'text' && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white text-gray-900 rounded-lg p-8">
                  <div className="prose max-w-none">
                    {currentContentData.textContent.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-4">{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentContentData.type === 'quiz' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white text-gray-900 rounded-lg p-8">
                  <div className="text-center">
                    <Award className="h-16 w-16 text-primary-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-4">Interactive Quiz</h3>
                    <p className="text-gray-600 mb-6">
                      Test your knowledge with this interactive quiz.
                    </p>
                    <button className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                      Start Quiz
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentContentData.type === 'flashcard' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white text-gray-900 rounded-lg p-8">
                  <div className="text-center">
                    <BookOpen className="h-16 w-16 text-primary-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-4">Flashcards</h3>
                    <p className="text-gray-600 mb-6">
                      Review key concepts with interactive flashcards.
                    </p>
                    
                    {currentContentData.flashcards && currentContentData.flashcards.length > 0 && (
                      <div className="space-y-4">
                        {currentContentData.flashcards.map((card, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="font-semibold text-lg mb-2">{card.term}</div>
                            <div className="text-gray-600">{card.definition}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-800 p-4 border-t border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Course Progress</span>
              <span className="text-sm text-gray-400">
                {progress?.overallProgress || 0}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress?.overallProgress || 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;
