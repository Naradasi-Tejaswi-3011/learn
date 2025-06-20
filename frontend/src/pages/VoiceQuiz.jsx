import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause,
  RotateCcw,
  CheckCircle,
  XCircle,
  Award,
  Brain
} from 'lucide-react';

const VoiceQuiz = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completedCourses, setCompletedCourses] = useState([]);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  useEffect(() => {
    fetchCompletedCourses();
    initializeSpeechRecognition();
    initializeSpeechSynthesis();
  }, []);

  useEffect(() => {
    if (completedCourses.length > 0) {
      generateQuestions();
    }
  }, [completedCourses]);

  const fetchCompletedCourses = async () => {
    try {
      const response = await axios.get('/progress');
      const completed = response.data.progress.filter(p => p.status === 'completed');
      setCompletedCourses(completed);
    } catch (error) {
      console.error('Error fetching completed courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        handleAnswer(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  };

  const initializeSpeechSynthesis = () => {
    synthRef.current = window.speechSynthesis;
  };

  const generateQuestions = () => {
    // Generate questions based on completed courses
    const courseTopics = completedCourses.map(course => course.course.title);
    
    const sampleQuestions = [
      {
        question: `What is the main concept you learned in ${courseTopics[0] || 'your recent course'}?`,
        expectedKeywords: ['concept', 'learn', 'main', 'important'],
        points: 10
      },
      {
        question: "Explain one practical application of what you've studied recently.",
        expectedKeywords: ['application', 'practical', 'use', 'implement'],
        points: 15
      },
      {
        question: "What was the most challenging part of your learning journey?",
        expectedKeywords: ['challenging', 'difficult', 'hard', 'struggle'],
        points: 10
      },
      {
        question: "How would you teach this concept to someone else?",
        expectedKeywords: ['teach', 'explain', 'show', 'demonstrate'],
        points: 20
      },
      {
        question: "What real-world problem can you solve with your new knowledge?",
        expectedKeywords: ['problem', 'solve', 'real-world', 'apply'],
        points: 15
      }
    ];

    setQuestions(sampleQuestions);
    setLoading(false);
  };

  const speak = (text) => {
    if (synthRef.current) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      synthRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleAnswer = (answer) => {
    const question = questions[currentQuestion];
    const answerLower = answer.toLowerCase();
    
    // Simple keyword matching for scoring
    const matchedKeywords = question.expectedKeywords.filter(keyword => 
      answerLower.includes(keyword.toLowerCase())
    );
    
    const answerScore = Math.min(question.points, (matchedKeywords.length / question.expectedKeywords.length) * question.points);
    
    const answerData = {
      question: question.question,
      answer: answer,
      score: answerScore,
      maxScore: question.points,
      matchedKeywords
    };

    setUserAnswers([...userAnswers, answerData]);
    setScore(score + answerScore);

    // Move to next question or complete quiz
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        setTranscript('');
      }, 2000);
    } else {
      completeQuiz(score + answerScore);
    }
  };

  const completeQuiz = async (finalScore) => {
    setQuizCompleted(true);
    
    const percentage = Math.round((finalScore / questions.reduce((sum, q) => sum + q.points, 0)) * 100);
    
    try {
      // Award XP based on performance
      const xpEarned = Math.round(finalScore * 2); // 2 XP per point
      await axios.post('/gamification/xp', {
        points: xpEarned,
        reason: `Voice Quiz Completed - ${percentage}% score`
      });

      // Update user data
      updateUser({ xp: user.xp + xpEarned });

      // Check for badge eligibility
      if (percentage >= 90) {
        // Award perfect quiz badge
        speak(`Excellent! You scored ${percentage}% and earned ${xpEarned} XP points! You might have unlocked a new badge!`);
      } else if (percentage >= 70) {
        speak(`Great job! You scored ${percentage}% and earned ${xpEarned} XP points!`);
      } else {
        speak(`Good effort! You scored ${percentage}% and earned ${xpEarned} XP points. Keep learning to improve!`);
      }
    } catch (error) {
      console.error('Error updating score:', error);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setUserAnswers([]);
    setScore(0);
    setQuizCompleted(false);
    setTranscript('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (completedCourses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete a Course First</h2>
          <p className="text-gray-600 mb-4">You need to complete at least one course to take the voice quiz.</p>
          <button
            onClick={() => navigate('/courses')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    const totalPossible = questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = Math.round((score / totalPossible) * 100);

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Award className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Completed!</h1>
            
            <div className="mb-6">
              <div className="text-4xl font-bold text-primary-600 mb-2">{percentage}%</div>
              <div className="text-gray-600">Final Score: {score} / {totalPossible} points</div>
            </div>

            <div className="space-y-4 mb-8">
              {userAnswers.map((answer, index) => (
                <div key={index} className="text-left border border-gray-200 rounded-lg p-4">
                  <div className="font-medium text-gray-900 mb-2">Q{index + 1}: {answer.question}</div>
                  <div className="text-gray-700 mb-2">Your answer: "{answer.answer}"</div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Keywords matched: {answer.matchedKeywords.join(', ') || 'None'}
                    </div>
                    <div className="font-medium">
                      {answer.score.toFixed(1)} / {answer.maxScore} points
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={restartQuiz}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <RotateCcw className="h-5 w-5" />
                <span>Retake Quiz</span>
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Brain className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Voice Learning Quiz</h1>
            <p className="text-gray-600">Answer questions about your completed courses using your voice</p>
            <div className="mt-4">
              <div className="text-sm text-gray-600">
                Question {currentQuestion + 1} of {questions.length}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <div className="bg-primary-50 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{currentQ?.question}</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => speak(currentQ?.question)}
                  disabled={isSpeaking}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  <span>{isSpeaking ? 'Speaking...' : 'Read Question'}</span>
                </button>
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Stop
                  </button>
                )}
              </div>
            </div>

            {/* Voice Input */}
            <div className="text-center">
              <div className="mb-4">
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-medium transition-all ${
                    isListening 
                      ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                      : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
                  {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                </button>
              </div>
              <p className="text-gray-600 mb-4">
                {isListening ? 'Listening... Speak your answer' : 'Click the microphone to start speaking'}
              </p>
              
              {transcript && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-900 font-medium">Your answer:</p>
                  <p className="text-gray-700">"{transcript}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="text-center">
            <div className="text-sm text-gray-600">
              Current Score: {score} points
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceQuiz;
