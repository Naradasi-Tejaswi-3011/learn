import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'pdfjs-dist/web/pdf_viewer.css';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Upload,
  Timer,
  Eye,
  EyeOff,
  Music,
  Volume2,
  VolumeX,
  FileText,
  Target,
  Coffee,
  X,
  MessageCircle,
  BookOpen,
  Settings
} from 'lucide-react';

// Import face detection library dynamically
let faceapi;

// Import components
const FaceDetection = React.lazy(() => import('../components/FaceDetection'));
const SugaiAI = React.lazy(() => import('../components/SugaiAI'));
const NoteSummarizer = React.lazy(() => import('../components/NoteSummarizer'));

const FocusStudy = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const pdfDocRef = useRef(null);
  const currentRenderTask = useRef(null);
  const faceTimeoutRef = useRef(null);

  // PDF and viewer states
  const [pdfFile, setPdfFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1.5);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Timer states
  const [sessionDuration, setSessionDuration] = useState(25);
  const [sessionDurationSeconds, setSessionDurationSeconds] = useState(0);
  const [breakInterval, setBreakInterval] = useState(25);
  const [breakIntervalSeconds, setBreakIntervalSeconds] = useState(0);
  const [breakDuration, setBreakDuration] = useState(5);
  const [breakDurationSeconds, setBreakDurationSeconds] = useState(0);
  const [timer, setTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isBreak, setIsBreak] = useState(false);
  const [showBreakNotification, setShowBreakNotification] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Face detection states
  const [facePresent, setFacePresent] = useState(false);
  const [faceDetectionEnabled, setFaceDetectionEnabled] = useState(true);
  const [showFaceAlert, setShowFaceAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("Timer paused - no face detected");

  // Music and focus states
  const [playingMusic, setPlayingMusic] = useState(false);
  const [selectedMusicType, setSelectedMusicType] = useState("lofi");
  const [focusMode, setFocusMode] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);

  // Note-taking states
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showSummarizer, setShowSummarizer] = useState(false);

  // Progress tracking
  const [studyGoal, setStudyGoal] = useState(10);
  const [pagesRead, setPagesRead] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [error, setError] = useState(null);

  // Music options
  const musicOptions = {
    lofi: "https://stream.zeno.fm/0r0xa792kwzuv",
    classical: "https://stream.zeno.fm/d553pahd84zuv",
    nature: "https://stream.zeno.fm/n53wu8h2tc9uv",
    whitenoise: "https://stream.zeno.fm/huwsfsp8yfhvv"
  };

  // File handling functions
  const handleFiles = (files) => {
    const file = files[0];
    if (file?.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }

    console.log("Loading PDF file...");
    const fileReader = new FileReader();
    fileReader.onload = function() {
      // Create a copy of the ArrayBuffer to prevent detachment
      const arrayBuffer = fileReader.result;
      const uint8Array = new Uint8Array(arrayBuffer);
      const copiedBuffer = uint8Array.slice().buffer;

      setPdfFile(copiedBuffer);

      const totalSessionMinutes = sessionDuration + (sessionDurationSeconds / 60);
      setSessionDuration(totalSessionMinutes);

      console.log("PDF loaded successfully, starting timer...");
      startTimer();

      // Enter fullscreen
      setTimeout(() => {
        enterFullscreen();
      }, 500);
    };
    fileReader.readAsArrayBuffer(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add("border-pink-400");
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("border-pink-400");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("border-pink-400");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Timer functions
  const startTimer = () => {
    console.log("Starting new timer...");
    if (timer) {
      clearInterval(timer);
    }

    setElapsedTime(0);
    const totalSessionSeconds = sessionDuration * 60;
    setTimeLeft(totalSessionSeconds);

    const newInterval = setInterval(() => {
      setElapsedTime(prevTime => {
        const newTime = prevTime + 1;
        const totalSessionSeconds = sessionDuration * 60;
        setTimeLeft(Math.max(0, totalSessionSeconds - newTime));

        if (newTime >= totalSessionSeconds) {
          console.log("Session complete");
          clearInterval(newInterval);
          setTimer(null);
          return totalSessionSeconds;
        }

        if (!isBreak && breakInterval > 0 && newTime % (breakInterval * 60) === 0) {
          console.log("Break interval reached");
          clearInterval(newInterval);
          setTimer(null);
          setIsBreak(true);
          setShowBreakNotification(true);
          const breakTimeSeconds = (breakDuration * 60) + parseInt(breakDurationSeconds || 0);
          setTimeLeft(breakTimeSeconds);
        }

        return newTime;
      });
    }, 1000);

    setTimer(newInterval);
    return newInterval;
  };

  // Format time functions
  const formatTimeDisplay = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const formatTimeHMS = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    } else {
      return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }
  };

  // Fullscreen functions
  const enterFullscreen = () => {
    console.log("Attempting to enter fullscreen mode");
    try {
      const docElement = document.documentElement;
      if (docElement.requestFullscreen) {
        docElement.requestFullscreen()
          .then(() => {
            console.log("Fullscreen activated successfully");
            setIsFullscreen(true);
          })
          .catch(err => {
            console.error("Fullscreen permission denied:", err);
            setIsFullscreen(false);
          });
      } else if (docElement.mozRequestFullScreen) {
        docElement.mozRequestFullScreen();
        setIsFullscreen(true);
      } else if (docElement.webkitRequestFullscreen) {
        docElement.webkitRequestFullscreen();
        setIsFullscreen(true);
      } else if (docElement.msRequestFullscreen) {
        docElement.msRequestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.error("Error requesting fullscreen:", err);
      setIsFullscreen(false);
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (document.webkitFullscreenElement) {
      document.webkitExitFullscreen();
    } else if (document.mozFullScreenElement) {
      document.mozCancelFullScreen();
    } else if (document.msFullscreenElement) {
      document.msExitFullscreen();
    }
  };

  // Face detection handler
  const handleFaceStatus = useCallback((isPresent) => {
    console.log(`Face detection: Face ${isPresent ? 'DETECTED' : 'ABSENT'}`);
    setFacePresent(isPresent);

    if (isPaused && !window.__faceAutoDetectionPause) {
      console.log("Timer already manually paused - not changing state");
      return;
    }

    if (faceTimeoutRef.current) {
      clearTimeout(faceTimeoutRef.current);
      faceTimeoutRef.current = null;
    }

    if (!isPresent && !isPaused && isFullscreen) {
      console.log("Face absent - starting 3-second countdown to pause timer");
      faceTimeoutRef.current = setTimeout(() => {
        console.log("Face still absent after 3 seconds - pausing timer");
        if (typeof window !== 'undefined') {
          window.__faceAutoDetectionPause = true;
        }
        setIsPaused(true);
        setShowFaceAlert(true);
        setAlertMessage("Timer paused - no face detected");
        faceTimeoutRef.current = null;
      }, 3000);
    }

    if (isPresent && isPaused && window.__faceAutoDetectionPause && isFullscreen) {
      console.log("Face detected again after auto-pause - showing resume option");
      setShowFaceAlert(true);
      setAlertMessage("Face detected - resume timer?");
    }
  }, [isPaused, isFullscreen, setAlertMessage, setShowFaceAlert, setIsPaused]);

  // Resume timer function
  const handleResumeTimer = () => {
    console.log("▶️ User clicked Resume Timer - continuing timer");
    setShowFaceAlert(false);

    if (typeof window !== 'undefined') {
      window.__faceAutoDetectionPause = false;
    }

    setTimeout(() => {
      if (!timer) {
        console.log("Creating new timer interval");
        const newInterval = setInterval(() => {
          setElapsedTime(prevTime => {
            const newTime = prevTime + 1;
            const totalSessionSeconds = sessionDuration * 60;

            if (newTime >= totalSessionSeconds) {
              console.log("Session complete");
              clearInterval(newInterval);
              setTimer(null);
              return totalSessionSeconds;
            }

            if (!isBreak && breakInterval > 0 && newTime % (breakInterval * 60) === 0) {
              clearInterval(newInterval);
              setTimer(null);
              setIsBreak(true);
              setShowBreakNotification(true);
            }

            return newTime;
          });
        }, 1000);
        setTimer(newInterval);
      }
      setIsPaused(false);
    }, 300);
  };

  // PDF navigation functions
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Music functions
  const toggleMusic = () => {
    if (playingMusic && audioRef.current) {
      setTimeout(() => {
        audioRef.current.pause();
      }, 100);
    } else {
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio(musicOptions[selectedMusicType]);
          audioRef.current.loop = true;
        }
        setTimeout(() => {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                // Audio playback started successfully
              })
              .catch(err => {
                console.error("Error playing audio:", err);
              });
          }
        }, 100);
      } catch (err) {
        console.error("Error playing audio:", err);
      }
    }
    setPlayingMusic(prev => !prev);
  };

  const changeMusic = (type) => {
    setSelectedMusicType(type);
    if (playingMusic && audioRef.current) {
      try {
        audioRef.current.pause();
        setTimeout(() => {
          audioRef.current.src = musicOptions[type];
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                // Audio playback started successfully
              })
              .catch(err => {
                console.error("Error playing new audio:", err);
                setPlayingMusic(false);
              });
          }
        }, 200);
      } catch (err) {
        console.error("Error changing music:", err);
      }
    }
  };

  // Notes functions
  const addNote = () => {
    if (currentNote.trim()) {
      const newNote = {
        id: Date.now(),
        text: currentNote,
        page: currentPage,
        timestamp: new Date().toLocaleString()
      };
      setNotes(prev => [...prev, newNote]);
      setCurrentNote("");
    }
  };

  const deleteNote = (id) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const toggleNotes = () => {
    setShowNotes(prev => !prev);
  };

  const toggleFocusMode = () => {
    setFocusMode(prev => !prev);
    setShowToolbar(!focusMode);
  };

  // Handle exit functions
  const handleExitStudy = () => {
    setShowExitConfirmation(true);
    setIsPaused(true);
  };

  const handleContinueStudying = () => {
    setShowExitConfirmation(false);
    setShowPauseDialog(false);

    if (!isFullscreen) {
      enterFullscreen();
    }

    setTimeout(() => {
      if (isPaused) {
        setIsPaused(false);
      }
      if (!timer) {
        startTimer();
      }
    }, 300);
  };

  const handleExitAnyway = () => {
    setShowExitConfirmation(false);
    exitFullscreen();
    navigate('/self-paced');
  };

  const resumeFromBreak = () => {
    console.log("Resuming from break...");
    setIsBreak(false);
    setShowBreakNotification(false);

    if (!isFullscreen) {
      enterFullscreen();
    }

    setTimeout(() => {
      if (isPaused) {
        setIsPaused(false);
      }
      if (!timer) {
        startTimer();
      }
    }, 300);
  };

  // Get remaining time
  const getRemainingTime = () => {
    const totalSessionSeconds = sessionDuration * 60;
    const remainingSeconds = Math.max(0, totalSessionSeconds - elapsedTime);
    return remainingSeconds;
  };

  // useEffect hooks
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement ||
        !!document.mozFullScreenElement ||
        !!document.webkitFullscreenElement ||
        !!document.msFullscreenElement;

      console.log("Fullscreen changed:", isCurrentlyFullscreen);
      setIsFullscreen(isCurrentlyFullscreen);

      if (!isCurrentlyFullscreen && pdfFile && !showExitConfirmation && !isPaused) {
        console.log("Exited fullscreen - pausing timer");
        setIsPaused(true);
        setShowPauseDialog(true);
        if (timer) {
          clearInterval(timer);
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [pdfFile, showExitConfirmation, isPaused, timer]);

  useEffect(() => {
    if (isPaused) {
      console.log("Timer paused - clearing interval");
      if (timer) {
        clearInterval(timer);
        setTimer(null);
      }
    } else if (!timer && elapsedTime > 0) {
      console.log("Timer unpaused - restarting");
      startTimer();
    }
  }, [isPaused, timer, elapsedTime]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && pdfFile) {
        setTabSwitches(prev => prev + 1);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pdfFile]);

  useEffect(() => {
    return () => {
      if (timer) {
        clearInterval(timer);
      }
      if (faceTimeoutRef.current) {
        clearTimeout(faceTimeoutRef.current);
      }
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
  }, [timer]);

  // PDF loading and rendering
  useEffect(() => {
    if (pdfFile) {
      loadPDF();
    }
  }, [pdfFile, currentPage, zoomLevel, rotation]);

  const loadPDF = async () => {
    try {
      setError(null); // Clear any previous errors
      console.log('Loading PDF...', pdfFile);

      // Load PDF.js dynamically
      const pdfjsLib = await import('pdfjs-dist');

      // Set worker source with multiple fallbacks
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        try {
          // Try to use the version-specific worker
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        } catch (e) {
          // Fallback to a stable version
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
        }
      }

      // Cancel previous render task
      if (currentRenderTask.current) {
        currentRenderTask.current.cancel();
      }

      console.log('Getting PDF document...');
      // Ensure we have a proper Uint8Array for PDF.js
      const uint8Array = new Uint8Array(pdfFile);
      const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
      pdfDocRef.current = pdf;
      setNumPages(pdf.numPages);
      console.log('PDF loaded, pages:', pdf.numPages);

      const page = await pdf.getPage(currentPage);
      const viewport = page.getViewport({ scale: zoomLevel, rotation });
      console.log('Page viewport:', viewport);

      const canvas = canvasRef.current;
      if (!canvas) {
        console.error('Canvas not found');
        return;
      }

      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      console.log('Canvas dimensions set:', canvas.width, 'x', canvas.height);

      // Clear canvas first
      context.clearRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      // Start rendering
      console.log('Starting PDF render...');
      const renderTask = page.render(renderContext);
      currentRenderTask.current = renderTask;

      await renderTask.promise;
      console.log('PDF render completed');

      // Render text layer for selection and search
      const textContent = await page.getTextContent();
      const textLayerDiv = textLayerRef.current;
      if (textLayerDiv) {
        textLayerDiv.innerHTML = '';
        textLayerDiv.style.left = canvas.offsetLeft + 'px';
        textLayerDiv.style.top = canvas.offsetTop + 'px';
        textLayerDiv.style.height = canvas.offsetHeight + 'px';
        textLayerDiv.style.width = canvas.offsetWidth + 'px';

        // Create text layer
        pdfjsLib.renderTextLayer({
          textContent: textContent,
          container: textLayerDiv,
          viewport: viewport,
          textDivs: []
        });
      }

      // Update progress
      if (currentPage > pagesRead) {
        setPagesRead(currentPage);
      }

    } catch (error) {
      if (error.name !== 'RenderingCancelledException') {
        console.error('Error loading PDF:', error);
        setError(`Failed to load PDF: ${error.message}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <Link
            to="/self-paced"
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Self-Paced Mode</span>
          </Link>
          <h1 className="text-xl font-bold">Focus Study</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-blue-600 px-3 py-1 rounded-lg">
            <Timer className="h-4 w-4" />
            <span className="font-mono text-lg">
              {formatTimeDisplay(getRemainingTime())}
            </span>
            <span className="text-sm">Study Time</span>
          </div>

          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${facePresent ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">{facePresent ? 'Focused' : 'Away'}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {!pdfFile ? (
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center max-w-2xl mx-auto p-8">
            <h2 className="text-3xl font-bold mb-6">Focus Study Session</h2>
            <p className="text-gray-300 mb-8">
              Upload your study material and enter a distraction-free environment with AI-powered focus tracking.
            </p>

            {/* File Upload Area */}
            <div
              className="border-2 border-dashed border-gray-600 rounded-lg p-12 mb-8 hover:border-blue-500 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Drag & Drop Your Study Material</h3>
              <p className="text-gray-400 mb-4">Or click to select a PDF file</p>
              <p className="text-sm text-gray-500">
                Screen will go fullscreen & timer will start automatically
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />

            {/* Study Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800 p-4 rounded-lg">
                <label className="block text-sm font-medium mb-2">Session Duration</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-center text-white"
                    min="1"
                    max="720"
                  />
                  <span className="text-sm text-gray-400 self-center">minutes</span>
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <label className="block text-sm font-medium mb-2">Break Interval</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={breakInterval}
                    onChange={(e) => setBreakInterval(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-center text-white"
                    min="0"
                    max="720"
                  />
                  <span className="text-sm text-gray-400 self-center">minutes</span>
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <label className="block text-sm font-medium mb-2">Break Duration</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={breakDuration}
                    onChange={(e) => setBreakDuration(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-center text-white"
                    min="1"
                    max="60"
                  />
                  <span className="text-sm text-gray-400 self-center">minutes</span>
                </div>
              </div>
            </div>

            {/* Face Detection Settings */}
            <div className="bg-gray-800 p-6 rounded-lg mb-8">
              <h3 className="text-lg font-semibold mb-4">Face Detection Settings</h3>
              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  id="faceDetection"
                  checked={faceDetectionEnabled}
                  onChange={(e) => setFaceDetectionEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="faceDetection" className="text-sm">
                  Enable face detection (pauses timer when you're away)
                </label>
              </div>
              <p className="text-sm text-gray-400">
                This feature uses your camera to detect if you're present and automatically pauses your timer when you step away during study.
              </p>
            </div>

            {/* Features List */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Study Room Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-400" />
                  <span>PDF viewer with zoom and rotate controls</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Timer className="h-4 w-4 text-green-400" />
                  <span>Customizable study timers with break reminders</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-purple-400" />
                  <span>Face detection to pause timer when away</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Music className="h-4 w-4 text-yellow-400" />
                  <span>Background music options for focus</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-red-400" />
                  <span>Progress tracking and study goals</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Coffee className="h-4 w-4 text-orange-400" />
                  <span>AI chatbot and note summarizer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Study Interface
        <div className="relative h-screen overflow-hidden">
          {/* Study Timer Display */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-black bg-opacity-75 px-6 py-3 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-gray-300 mb-1">Study Time</div>
                <div className="text-2xl font-mono font-bold">
                  {formatTimeDisplay(getRemainingTime())}
                </div>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          {showToolbar && (
            <div className="absolute top-4 right-4 z-50 flex flex-col space-y-2">
              <button
                onClick={handleExitStudy}
                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                title="Exit Study Session"
              >
                <X className="h-5 w-5" />
              </button>

              <button
                onClick={toggleFocusMode}
                className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors"
                title={focusMode ? "Show Controls" : "Hide Controls"}
              >
                {focusMode ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </button>

              <button
                onClick={() => setShowSummarizer(true)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-lg transition-colors"
                title="Open Notes Summarizer"
              >
                <BookOpen className="h-5 w-5" />
              </button>

              <button
                onClick={() => setShowAI(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                title="Ask SUGAI AI"
              >
                <MessageCircle className="h-5 w-5" />
              </button>

              <button
                onClick={toggleNotes}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                title="Toggle Notes"
              >
                <FileText className="h-5 w-5" />
              </button>

              <button
                onClick={toggleMusic}
                className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors"
                title="Toggle Music"
              >
                {playingMusic ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>
            </div>
          )}

          {/* PDF Viewer */}
          <div className="h-full flex items-center justify-center bg-gray-900">
            {error ? (
              <div className="text-center text-red-400 p-8">
                <h3 className="text-xl font-semibold mb-4">PDF Loading Error</h3>
                <p className="mb-4">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    if (pdfFile) loadPDF();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full shadow-2xl border border-gray-600"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    minWidth: '400px',
                    minHeight: '500px',
                    backgroundColor: 'white'
                  }}
                />
                <div
                  ref={textLayerRef}
                  className="textLayer absolute top-0 left-0 pointer-events-auto"
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
              </div>
            )}
          </div>

          {/* PDF Controls */}
          {showToolbar && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
              <div className="bg-black bg-opacity-75 px-6 py-3 rounded-lg flex items-center space-x-4">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage <= 1}
                  className="text-white hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <span className="text-white text-sm">
                  Page {currentPage} of {numPages || '--'}
                </span>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage >= numPages}
                  className="text-white hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                <div className="w-px h-6 bg-gray-600 mx-2"></div>

                <button
                  onClick={handleZoomOut}
                  className="text-white hover:text-blue-400"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>

                <span className="text-white text-sm">
                  {Math.round(zoomLevel * 100)}%
                </span>

                <button
                  onClick={handleZoomIn}
                  className="text-white hover:text-blue-400"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>

                <button
                  onClick={handleRotate}
                  className="text-white hover:text-blue-400"
                  title="Rotate"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          {showToolbar && (
            <div className="absolute bottom-4 right-4 z-50">
              <div className="bg-black bg-opacity-75 px-4 py-2 rounded-lg text-sm text-white">
                <div className="mb-1">
                  Study Goal: {pagesRead} of {studyGoal} pages
                </div>
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((pagesRead / studyGoal) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Switch Warning */}
          {tabSwitches > 0 && (
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50">
              <div className="bg-red-600 bg-opacity-90 px-4 py-2 rounded-lg text-white text-sm">
                Distraction Alert! Tab switches: {tabSwitches}
              </div>
            </div>
          )}

          {/* Music Panel */}
          {playingMusic && showToolbar && (
            <div className="absolute top-20 right-4 z-40 bg-black bg-opacity-75 rounded-lg p-4">
              <div className="text-white text-sm mb-2">Background Music</div>
              <div className="flex space-x-2">
                {Object.entries(musicOptions).map(([type, url]) => (
                  <button
                    key={type}
                    onClick={() => changeMusic(type)}
                    className={`px-3 py-1 rounded text-xs ${
                      selectedMusicType === type
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals and Dialogs */}
      {/* Face Alert Dialog */}
      {showFaceAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Timer</h3>
            <p className="text-gray-700 mb-6">{alertMessage}</p>
            <div className="flex space-x-3">
              {window.__faceAutoDetectionPause && (
                <button
                  onClick={handleResumeTimer}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Resume Timer
                </button>
              )}
              <button
                onClick={() => setShowFaceAlert(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Dialog */}
      {showExitConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Session in Progress</h3>
            <p className="text-gray-700 mb-2">Your study session is not finished yet.</p>
            <p className="text-gray-700 mb-6">Time remaining: {formatTimeHMS(timeLeft)}</p>
            <div className="flex space-x-3">
              <button
                onClick={handleExitAnyway}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Exit Anyway
              </button>
              <button
                onClick={handleContinueStudying}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Continue Studying
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause Dialog */}
      {showPauseDialog && !showExitConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Session Paused</h3>
            <p className="text-gray-700 mb-6">
              You have {formatTimeDisplay(timeLeft)} remaining in your study session.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleContinueStudying}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Continue Studying
              </button>
              <button
                onClick={handleExitAnyway}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Exit Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Break Notification */}
      {showBreakNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Break Time!</h3>
            <p className="text-gray-700 mb-4">Time to take a short break and refresh your mind.</p>
            <p className="text-gray-700 mb-6">Break time remaining: {formatTimeDisplay(timeLeft)}</p>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${((breakDuration * 60 - timeLeft) / (breakDuration * 60)) * 100}%` }}
              ></div>
            </div>

            <button
              onClick={resumeFromBreak}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors mb-4"
            >
              Continue Studying
            </button>

            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">During your break:</p>
              <ul className="space-y-1">
                <li>• Look away from your screen</li>
                <li>• Stretch your body</li>
                <li>• Drink some water</li>
                <li>• Rest your eyes</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Notes Panel */}
      {showNotes && (
        <div className="fixed right-4 top-20 bottom-20 w-80 bg-white rounded-lg shadow-2xl z-40 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notes</h3>
              <button
                onClick={toggleNotes}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map(note => (
                  <div key={note.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">Page {note.page}</span>
                      <span className="text-xs text-gray-500">{note.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-800">{note.text}</p>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="text-xs text-red-500 hover:text-red-700 mt-2"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notes yet. Add notes about what you're studying!</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200">
            <textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[80px] text-sm text-gray-900"
              placeholder="Take notes here..."
            />
            <button
              onClick={addNote}
              disabled={!currentNote.trim()}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
            >
              Save Note
            </button>
          </div>
        </div>
      )}

      {/* Face Detection Component */}
      {pdfFile && faceDetectionEnabled && (
        <React.Suspense fallback={<div>Loading...</div>}>
          <FaceDetection
            onFaceStatus={handleFaceStatus}
            isFullscreen={isFullscreen}
            isPaused={isPaused}
          />
        </React.Suspense>
      )}

      {/* AI Chatbot */}
      {showAI && (
        <React.Suspense fallback={<div>Loading...</div>}>
          <SugaiAI onClose={() => setShowAI(false)} />
        </React.Suspense>
      )}

      {/* Notes Summarizer */}
      {showSummarizer && (
        <React.Suspense fallback={<div>Loading...</div>}>
          <NoteSummarizer onClose={() => setShowSummarizer(false)} />
        </React.Suspense>
      )}
    </div>
  );
};

export default FocusStudy;
