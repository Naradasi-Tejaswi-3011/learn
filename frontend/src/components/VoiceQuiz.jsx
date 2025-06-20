import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Play, RotateCcw, ArrowLeft } from 'lucide-react';
import VoiceService from '../services/voiceService';
import { quizTopics } from '../data/quizData';

const VoiceQuiz = ({ topic, onQuizComplete, onBack, gameService }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeSpent, setTimeSpent] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [quizState, setQuizState] = useState('intro'); // intro, question, waiting, complete
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [feedback, setFeedback] = useState('');

  const voiceService = useRef(new VoiceService());
  const questions = quizTopics[topic]?.questions || [];

  useEffect(() => {
    if (voiceEnabled && quizState === 'intro') {
      startQuiz();
    }
  }, [voiceEnabled, quizState]);

  useEffect(() => {
    if (quizState === 'question' && voiceEnabled) {
      speakQuestion();
    }
  }, [currentQuestion, quizState, voiceEnabled]);

  const startQuiz = async () => {
    if (!voiceEnabled) return;
    
    try {
      setIsSpeaking(true);
      await voiceService.current.speak(
        `Welcome to the ${quizTopics[topic].name} quiz! I'll ask you ${questions.length} questions. After each question, I'll give you the options. Just say the letter of your answer: A, B, C, or D. Let's begin!`
      );
      setIsSpeaking(false);
      setQuizState('question');
      setQuestionStartTime(Date.now());
    } catch (error) {
      console.error('Error starting quiz:', error);
      setIsSpeaking(false);
      setQuizState('question');
    }
  };

  const speakQuestion = async () => {
    if (!voiceEnabled || currentQuestion >= questions.length) return;
    
    const question = questions[currentQuestion];
    try {
      setIsSpeaking(true);
      const questionText = `Question ${currentQuestion + 1}: ${question.question}`;
      const optionsText = question.options
        .map((option, index) => `${String.fromCharCode(65 + index)}: ${option}`)
        .join('. ');
      
      await voiceService.current.speak(`${questionText}. Your options are: ${optionsText}`);
      setIsSpeaking(false);
      
      // Start listening for answer if voice is enabled
      if (voiceEnabled) {
        setTimeout(() => startListening(), 1000);
      }
    } catch (error) {
      console.error('Error speaking question:', error);
      setIsSpeaking(false);
    }
  };

  const startListening = async () => {
    if (!voiceService.current.isSupported || isListening) return;
    
    try {
      setIsListening(true);
      setTranscript('');
      const result = await voiceService.current.listen();
      setTranscript(result.transcript);
      processAnswer(result.transcript);
    } catch (error) {
      console.error('Error listening:', error);
      setIsListening(false);
      if (voiceEnabled) {
        setFeedback("I didn't catch that. Please try again or click an answer.");
      }
    }
  };

  const processAnswer = (transcript) => {
    setIsListening(false);
    
    // Extract answer from transcript
    const answer = extractAnswerFromTranscript(transcript);
    if (answer !== null) {
      recordAnswer(answer);
    } else {
      // Ask for clarification
      if (voiceEnabled) {
        setFeedback("I didn't understand. Please say A, B, C, or D, or click an answer.");
        voiceService.current.speak("I didn't catch that. Please say A, B, C, or D.");
        setTimeout(() => startListening(), 2000);
      }
    }
  };

  const extractAnswerFromTranscript = (transcript) => {
    const text = transcript.toLowerCase().trim();
    
    // Look for letter answers
    if (text.includes('a') || text.includes('option a')) return 0;
    if (text.includes('b') || text.includes('option b')) return 1;
    if (text.includes('c') || text.includes('option c')) return 2;
    if (text.includes('d') || text.includes('option d')) return 3;
    
    // Look for numbers
    if (text.includes('1') || text.includes('one') || text.includes('first')) return 0;
    if (text.includes('2') || text.includes('two') || text.includes('second')) return 1;
    if (text.includes('3') || text.includes('three') || text.includes('third')) return 2;
    if (text.includes('4') || text.includes('four') || text.includes('fourth')) return 3;
    
    return null;
  };

  const recordAnswer = (answerIndex) => {
    const timeTaken = questionStartTime ? (Date.now() - questionStartTime) / 1000 : 30;
    setAnswers(prev => [...prev, answerIndex]);
    setTimeSpent(prev => [...prev, timeTaken]);
    
    const question = questions[currentQuestion];
    const isCorrect = answerIndex === question.correctAnswer;
    
    // Provide feedback
    const feedbackText = isCorrect 
      ? "Correct!" 
      : `Incorrect. The correct answer was ${String.fromCharCode(65 + question.correctAnswer)}.`;
    
    setFeedback(feedbackText);
    
    if (voiceEnabled) {
      voiceService.current.speak(feedbackText);
    }
    
    // Move to next question or complete quiz
    setTimeout(() => {
      if (currentQuestion + 1 < questions.length) {
        setCurrentQuestion(prev => prev + 1);
        setQuestionStartTime(Date.now());
        setTranscript('');
        setFeedback('');
      } else {
        completeQuiz();
      }
    }, voiceEnabled ? 3000 : 1500);
  };

  const completeQuiz = async () => {
    setQuizState('complete');

    try {
      const results = await gameService.submitQuizResults(topic, questions, answers, timeSpent);
      onQuizComplete(results);

      if (voiceEnabled) {
        const score = Math.round((results.score.correctCount / results.score.totalQuestions) * 100);
        voiceService.current.speak(`Quiz complete! You scored ${score} percent. Great job!`);
      }
    } catch (error) {
      console.error('Error completing quiz:', error);
      // Fallback to local results
      const results = {
        score: {
          correctCount: answers.filter((answer, index) => answer === questions[index].correctAnswer).length,
          totalQuestions: questions.length,
          percentage: Math.round((answers.filter((answer, index) => answer === questions[index].correctAnswer).length / questions.length) * 100)
        },
        newBadges: [],
        xpGained: 0
      };
      onQuizComplete(results);
    }
  };

  const handleManualAnswer = (answerIndex) => {
    if (quizState === 'question' && !isListening && !isSpeaking) {
      recordAnswer(answerIndex);
    }
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (voiceEnabled) {
      voiceService.current.stopListening();
      voiceService.current.stopSpeaking();
      setIsListening(false);
      setIsSpeaking(false);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setTimeSpent([]);
    setTranscript('');
    setFeedback('');
    setQuizState('intro');
    setQuestionStartTime(null);
  };

  if (currentQuestion >= questions.length && quizState !== 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
            
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                {quizTopics[topic].icon} {quizTopics[topic].name} Quiz
              </h1>
              
              <button
                onClick={toggleVoice}
                className={`p-2 rounded-lg transition-colors ${
                  voiceEnabled 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={voiceEnabled ? 'Disable Voice' : 'Enable Voice'}
              >
                {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>

        {/* Question */}
        {quizState === 'question' && question && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-primary-600 bg-primary-100 px-3 py-1 rounded-full">
                  {question.difficulty} • {question.points} pts
                </span>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {question.question}
              </h2>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleManualAnswer(index)}
                  disabled={isListening || isSpeaking}
                  className="p-4 text-left border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="font-semibold text-primary-600 mr-3">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </button>
              ))}
            </div>

            {/* Voice Controls */}
            {voiceEnabled && (
              <div className="text-center mb-6">
                {isSpeaking && (
                  <div className="flex items-center justify-center text-blue-600 mb-4">
                    <Volume2 className="h-5 w-5 mr-2 animate-pulse" />
                    <span>Speaking question...</span>
                  </div>
                )}
                
                {isListening && (
                  <div className="flex items-center justify-center text-red-600 mb-4">
                    <Mic className="h-5 w-5 mr-2 animate-pulse" />
                    <span>Listening for your answer...</span>
                  </div>
                )}
                
                {!isSpeaking && !isListening && (
                  <button
                    onClick={startListening}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center mx-auto"
                  >
                    <Mic className="h-5 w-5 mr-2" />
                    Start Voice Answer
                  </button>
                )}
              </div>
            )}

            {/* Transcript and Feedback */}
            {transcript && (
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600">
                  <strong>You said:</strong> {transcript}
                </p>
              </div>
            )}
            
            {feedback && (
              <div className="bg-blue-100 rounded-lg p-4">
                <p className="text-blue-800 font-medium">{feedback}</p>
              </div>
            )}
          </div>
        )}

        {/* Loading states */}
        {quizState === 'intro' && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Preparing your quiz...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceQuiz;
