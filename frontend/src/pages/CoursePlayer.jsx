import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CourseQA from '../components/CourseQA';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  BookOpen,
  Award,
  CheckCircle,
  Clock,
  FileText,
  MessageSquare
} from 'lucide-react';

const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [currentModule, setCurrentModule] = useState(0);
  const [currentContent, setCurrentContent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [contentStartTime, setContentStartTime] = useState(null);
  const [videoWatchTime, setVideoWatchTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isContentCompleted, setIsContentCompleted] = useState(false);
  const [lastProgressUpdate, setLastProgressUpdate] = useState(0);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const [courseRes, progressRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/courses/${courseId}/modules`),
          axios.get(`${import.meta.env.VITE_API_URL}/progress/${courseId}`)
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
    setVideoDuration(0);
    setLastProgressUpdate(0);
  }, [currentModule, currentContent]);

  // Auto-track progress for YouTube videos based on time spent
  useEffect(() => {
    if (!course || !course.modules?.[currentModule]) return;

    const currentContentData = course.modules?.[currentModule]?.content?.[currentContent];
    if (currentContentData?.type !== 'video') return;

    // Check if it's a YouTube video
    const url = currentContentData.videoUrl;
    const isYouTube = url && (url.includes('youtube.com') || url.includes('youtu.be'));

    if (isYouTube) {
      // Set a default duration for YouTube videos (can be adjusted)
      const defaultDuration = 600; // 10 minutes default
      setVideoDuration(defaultDuration);

      // Start tracking progress every 5 seconds
      const interval = setInterval(() => {
        if (isContentCompleted) {
          clearInterval(interval);
          return;
        }

        const timeSpent = contentStartTime ? (Date.now() - contentStartTime) / 1000 : 0;
        const estimatedProgress = Math.min(timeSpent, defaultDuration);

        setVideoWatchTime(estimatedProgress);

        // Update progress every 30 seconds
        if (timeSpent > 0 && Math.floor(timeSpent) % 30 === 0) {
          updateVideoProgress(estimatedProgress, defaultDuration);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [currentModule, currentContent, course, contentStartTime, isContentCompleted]);

  const updateProgress = async (moduleId, contentId, progressData) => {
    try {
      console.log('Sending progress update:', {
        courseId,
        moduleId,
        contentId,
        progressData
      });

      const response = await axios.put(`${import.meta.env.VITE_API_URL}/progress/${courseId}/module/${moduleId}`, {
        contentId,
        ...progressData
      });

      console.log('Progress update successful:', response.data);

      // Update local progress state
      if (response.data.progress) {
        setProgress(response.data.progress);
        console.log('Updated local progress state:', response.data.progress);
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

  // Update video progress continuously while watching
  const updateVideoProgress = async (currentTime, duration) => {
    if (!currentTime || !duration || isUpdatingProgress) return;

    const watchedPercentage = Math.min(100, (currentTime / duration) * 100);

    // Update progress every 5% or every 30 seconds to get more frequent updates
    const progressThreshold = Math.floor(watchedPercentage / 5) * 5;
    const timeThreshold = Math.floor(currentTime / 30) * 30;

    if (progressThreshold > lastProgressUpdate || timeThreshold > lastProgressUpdate) {
      setIsUpdatingProgress(true);
      setLastProgressUpdate(Math.max(progressThreshold, timeThreshold));

      try {
        const module = course.modules?.[currentModule];
        const content = module?.content?.[currentContent];
        const timeSpent = contentStartTime ? Math.floor((Date.now() - contentStartTime) / 1000) : 0;

        console.log('Updating progress:', {
          watchedPercentage: watchedPercentage.toFixed(1),
          currentTime: currentTime.toFixed(1),
          duration: duration.toFixed(1),
          timeSpent,
          moduleId: module._id,
          contentId: content._id
        });

        const progressResponse = await updateProgress(module._id, content._id, {
          contentType: content.type,
          progress: watchedPercentage,
          timeSpent: timeSpent,
          completed: watchedPercentage >= 90, // Mark as completed when 90% watched
          videoProgress: {
            watchedDuration: currentTime,
            totalDuration: duration,
            watchedPercentage: watchedPercentage
          }
        });

        console.log('Progress update response:', progressResponse);

        // Auto-complete when 90% watched
        if (watchedPercentage >= 90 && !isContentCompleted) {
          setIsContentCompleted(true);

          // Award XP for completion
          try {
            await axios.post(`${import.meta.env.VITE_API_URL}/gamification/xp`, {
              points: content.xpReward || 10,
              reason: `Completed ${content.title}`
            });
          } catch (error) {
            console.error('Error awarding XP:', error);
          }
        }
      } catch (error) {
        console.error('Error updating video progress:', error);
      } finally {
        setIsUpdatingProgress(false);
      }
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

    const module = course.modules?.[currentModule];
    const content = module?.content?.[currentContent];

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
      await axios.post(`${import.meta.env.VITE_API_URL}/gamification/xp`, {
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
    const module = course.modules?.[currentModule];
    
    if (direction === 'next') {
      if (currentContent < (module?.content?.length || 0) - 1) {
        setCurrentContent(currentContent + 1);
      } else if (currentModule < (course.modules?.length || 0) - 1) {
        setCurrentModule(currentModule + 1);
        setCurrentContent(0);
      }
    } else {
      if (currentContent > 0) {
        setCurrentContent(currentContent - 1);
      } else if (currentModule > 0) {
        setCurrentModule(currentModule - 1);
        setCurrentContent((course.modules?.[currentModule - 1]?.content?.length || 1) - 1);
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

  if (!course || !course.modules?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No content available</h2>
          <p className="text-gray-600">This course doesn't have any modules yet.</p>
        </div>
      </div>
    );
  }

  const currentModuleData = course.modules?.[currentModule];
  const currentContentData = currentModuleData?.content?.[currentContent];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex">
        {/* Sidebar - Course Navigation */}
        <div className="w-80 bg-white h-screen overflow-y-auto border-r border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold truncate text-gray-900">{course.course?.title || 'Course'}</h2>
            <p className="text-sm text-gray-600">
              Module {currentModule + 1} of {course.modules?.length || 0}
            </p>
          </div>

          <div className="p-4">
            {course.modules?.map((module, moduleIndex) => (
              <div key={module._id} className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">{module?.title || 'Module'}</h3>
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
                        <span className="truncate">{content?.title || 'Content'}</span>
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
                <h1 className="text-xl font-bold">{currentContentData?.title || 'Content'}</h1>
                <p className="text-gray-400 text-sm">
                  {currentModuleData?.title || 'Module'} • Lesson {currentContent + 1} of {currentModuleData?.content?.length || 0}
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
                    currentModule === (course.modules?.length || 0) - 1 &&
                    currentContent === (currentModuleData?.content?.length || 0) - 1
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
                              src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`}
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
                            onLoadedMetadata={(e) => {
                              setVideoDuration(e.target.duration);
                            }}
                            onTimeUpdate={(e) => {
                              const currentTime = e.target.currentTime;
                              const duration = e.target.duration;
                              setVideoWatchTime(currentTime);
                              updateVideoProgress(currentTime, duration);
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
            {/* Current Video Progress */}
            {currentContentData?.type === 'video' && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Current Video</span>
                    {isUpdatingProgress && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-400">Saving progress...</span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-400">
                    {Math.round((videoWatchTime / (videoDuration || 1)) * 100)}% watched
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1 mb-3">
                  <div
                    className="bg-green-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${(videoWatchTime / (videoDuration || 1)) * 100}%` }}
                  ></div>
                </div>

                {/* Test buttons for YouTube progress */}
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => {
                      // Set to 50% progress immediately
                      const duration = videoDuration || 600; // Default 10 minutes
                      const halfTime = duration * 0.5;
                      setVideoWatchTime(halfTime);
                      setVideoDuration(duration);
                      updateVideoProgress(halfTime, duration);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                  >
                    Set 50%
                  </button>
                  <button
                    onClick={() => {
                      // Mark as 90% complete for testing
                      const duration = videoDuration || 600;
                      const newTime = duration * 0.9;
                      setVideoWatchTime(newTime);
                      setVideoDuration(duration);
                      updateVideoProgress(newTime, duration);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                  >
                    Set 90%
                  </button>
                  <button
                    onClick={() => {
                      // Refresh course data to sync with dashboard
                      window.location.reload();
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            )}

            {/* Overall Course Progress */}
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

          {/* Q&A Section */}
          <div className="mt-8 max-w-4xl mx-auto">
            <CourseQA
              courseId={courseId}
              courseName={course.course?.title || 'Course'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;
