import React, { useEffect, useRef, useState } from 'react';

const FaceDetection = ({ onFaceStatus, isFullscreen, isPaused }) => {
  // References
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const busyRef = useRef(false);

  // State
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Face detection counters
  const faceCountRef = useRef(0);
  const noFaceCountRef = useRef(0);

  // Load face-api.js models
  useEffect(() => {
    async function loadModels() {
      try {
        console.log("Loading face detection models...");
        
        // Load face-api.js from CDN
        if (!window.faceapi) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.min.js';
          script.onload = async () => {
            const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
            await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
            console.log("Face detection models loaded successfully!");
            setModelLoaded(true);
          };
          document.head.appendChild(script);
        } else {
          const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
          await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
          console.log("Face detection models loaded successfully!");
          setModelLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load face detection models:", error);
      }
    }

    loadModels();
    
    // Show debug initially
    setShowDebug(true);
    const debugTimer = setTimeout(() => setShowDebug(false), 10000);
    return () => clearTimeout(debugTimer);
  }, []);

  // Camera initialization
  useEffect(() => {
    async function setupCamera() {
      if (!modelLoaded) return;

      try {
        // Stop any existing stream first
        if (videoRef.current && videoRef.current.srcObject) {
          const tracks = videoRef.current.srcObject.getTracks();
          tracks.forEach(track => track.stop());
        }

        console.log("Starting camera...");

        if (!navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.error("Camera access is not supported in this browser or context");
          setTimeout(() => {
            console.log("Retrying camera setup after delay...");
            setupCamera();
          }, 1000);
          return;
        }

        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 320 },
              height: { ideal: 240 }
            }
          });

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play().catch(e => console.error("Video play error:", e));
            };
            console.log("Camera started successfully");
            
            // Show debug view initially
            setShowDebug(true);
            setTimeout(() => setShowDebug(false), 8000);

            if (typeof window !== 'undefined') {
              window.__cameraPermissionGranted = true;
            }
          }
        } catch (permissionError) {
          console.error("Camera permission denied:", permissionError);
          console.warn("Face detection requires camera permissions.");
          if (typeof window !== 'undefined') {
            window.__cameraPermissionGranted = false;
          }
        }
      } catch (error) {
        console.error("Error starting camera:", error);
      }
    }

    setupCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [modelLoaded, isFullscreen]);

  // Detection loop
  useEffect(() => {
    if (!modelLoaded) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (isPaused && !window.__faceAutoDetectionPause) {
      console.log("Timer manually paused - stopping face detection");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (!isPaused || window.__faceAutoDetectionPause) {
      faceCountRef.current = 0;
      noFaceCountRef.current = 0;

      if (!intervalRef.current) {
        console.log("Starting face detection interval...");
        intervalRef.current = setInterval(detectFace, 400);
        detectFace();
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [modelLoaded, isPaused, faceDetected, showDebug]);

  useEffect(() => {
    if (!isPaused) {
      window.__faceAutoDetectionPause = false;
    }
  }, [isPaused]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window) {
      window.__faceAutoDetectionPause = window.__faceAutoDetectionPause || false;
    }
    return () => {
      if (typeof window !== 'undefined' && window) {
        window.__faceAutoDetectionPause = false;
      }
    };
  }, []);

  // Detection function
  async function detectFace() {
    if (busyRef.current || !videoRef.current || !videoRef.current.readyState || !canvasRef.current || !window.faceapi) return;

    busyRef.current = true;

    try {
      const options = new window.faceapi.TinyFaceDetectorOptions({
        minConfidence: 0.5,
        inputSize: 160
      });

      const detection = await window.faceapi.detectSingleFace(videoRef.current, options);
      const isFaceVisible = !!detection;
      const confidenceScore = detection ? detection.score : 0;

      console.log(`Face detection: ${isFaceVisible ? 'FOUND' : 'NOT FOUND'}, Confidence: ${confidenceScore.toFixed(2)}`);

      // Draw detection result on canvas for debugging
      if (showDebug && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        if (detection) {
          const displaySize = {
            width: videoRef.current.videoWidth || 320,
            height: videoRef.current.videoHeight || 240
          };
          window.faceapi.matchDimensions(canvasRef.current, displaySize);

          const resizedDetections = window.faceapi.resizeResults(detection, displaySize);
          window.faceapi.draw.drawDetections(canvasRef.current, resizedDetections);

          ctx.font = '14px Arial';
          ctx.fillStyle = 'green';
          ctx.fillText(`Confidence: ${confidenceScore.toFixed(2)}`, 10, 20);
        } else {
          ctx.font = '18px Arial';
          ctx.fillStyle = 'red';
          ctx.fillText('No Face Detected', 10, 30);
        }
      }

      // Update face detection state
      if (isFaceVisible && confidenceScore > 0.5) {
        faceCountRef.current++;
        noFaceCountRef.current = 0;

        if (!faceDetected && faceCountRef.current >= 2) {
          console.log("✅ FACE CONFIRMED: Updating state to FACE DETECTED");
          setFaceDetected(true);
          console.log("🔄 Calling onFaceStatus(true)");
          onFaceStatus(true);
        }
      } else {
        noFaceCountRef.current++;
        faceCountRef.current = 0;

        if (faceDetected && noFaceCountRef.current >= 2) {
          console.log("❌ NO FACE CONFIRMED: Updating state to FACE NOT DETECTED");
          setFaceDetected(false);
          console.log("🔄 Calling onFaceStatus(false)");
          onFaceStatus(false);
        }
      }
    } catch (error) {
      console.error("Error in face detection:", error);
    } finally {
      busyRef.current = false;
    }
  }

  const toggleDebug = () => {
    setShowDebug(prev => !prev);
  };

  return (
    <div>
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onLoadedMetadata={() => console.log("Video loaded and ready")}
        style={{
          position: 'fixed',
          bottom: 10,
          right: 10,
          width: showDebug ? '240px' : '2px',
          height: showDebug ? '180px' : '2px',
          borderRadius: '8px',
          border: faceDetected ? '3px solid #4ade80' : '3px solid #ef4444',
          opacity: showDebug ? 0.9 : 0.01,
          zIndex: 999,
          transition: 'all 0.3s ease',
          transform: 'scaleX(-1)' // Mirror the video
        }}
      />

      {/* Canvas for drawing face detection */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          bottom: 10,
          right: 10,
          width: showDebug ? '240px' : '2px',
          height: showDebug ? '180px' : '2px',
          borderRadius: '8px',
          opacity: showDebug ? 0.8 : 0,
          zIndex: 1000,
          pointerEvents: 'none',
          transition: 'all 0.3s ease',
          transform: 'scaleX(-1)' // Mirror the canvas
        }}
      />

      {/* Debug toggle button */}
      <button
        onClick={toggleDebug}
        style={{
          position: 'fixed',
          bottom: showDebug ? 200 : 20,
          right: 10,
          padding: '8px 12px',
          backgroundColor: faceDetected ? '#4ade80' : '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '12px',
          cursor: 'pointer',
          zIndex: 1001,
          transition: 'all 0.3s ease'
        }}
      >
        {faceDetected ? (
          <>👤 Face Detected {showDebug && '(Debug Mode)'}</>
        ) : (
          <>❌ No Face Detected {showDebug && '(Debug Mode)'}</>
        )}
      </button>
    </div>
  );
};

export default FaceDetection;
