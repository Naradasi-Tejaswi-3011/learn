import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  MessageSquare, 
  Send, 
  ThumbsUp, 
  Clock,
  CheckCircle,
  HelpCircle,
  User
} from 'lucide-react';

const CourseQA = ({ courseId, courseName }) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [courseId]);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/questions/course/${courseId}`);
      setQuestions(response.data.questions || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || newQuestion.length < 10) {
      alert('Question must be at least 10 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/questions`, {
        question: newQuestion.trim(),
        courseId
      });

      if (response.data.success) {
        setNewQuestion('');
        fetchQuestions(); // Refresh questions
        alert('Question submitted successfully! The instructor will answer soon.');
      }
    } catch (error) {
      console.error('Error submitting question:', error);
      alert('Failed to submit question. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const upvoteQuestion = async (questionId) => {
    try {
      // For now, just show a message since upvote endpoint might not be implemented yet
      console.log('Upvote functionality - coming soon!');
      // await axios.post(`${import.meta.env.VITE_API_URL}/questions/${questionId}/upvote`);
      // fetchQuestions(); // Refresh to show updated upvotes
    } catch (error) {
      console.error('Error upvoting question:', error);
    }
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
    <div className="bg-white rounded-lg shadow-md">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Questions & Answers</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Ask questions about this course and get answers from the instructor.
        </p>
      </div>

      {/* Ask Question Form */}
      {user?.role === 'student' && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <form onSubmit={submitQuestion} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ask a Question
              </label>
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Type your question here... (minimum 10 characters)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                minLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">
                {newQuestion.length}/1000 characters
              </p>
            </div>
            <button
              type="submit"
              disabled={submitting || newQuestion.length < 10}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>{submitting ? 'Submitting...' : 'Ask Question'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Questions List */}
      <div className="divide-y divide-gray-200">
        {questions.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h4>
            <p className="text-gray-600">
              {user?.role === 'student' 
                ? 'Be the first to ask a question about this course!'
                : 'Students haven\'t asked any questions yet.'
              }
            </p>
          </div>
        ) : (
          questions.map((question) => (
            <QuestionItem 
              key={question._id} 
              question={question} 
              onUpvote={upvoteQuestion}
              currentUser={user}
            />
          ))
        )}
      </div>
    </div>
  );
};

const QuestionItem = ({ question, onUpvote, currentUser }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-start space-x-4">
        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="text-sm font-medium text-gray-900">
              {question.studentName || 'Anonymous Student'}
            </h4>
            <span className="text-xs text-gray-500">
              {formatDate(question.createdAt)}
            </span>
            {question.isAnswered && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Answered
              </span>
            )}
          </div>
          
          <p className="text-gray-700 mb-4">{question.question}</p>
          
          {/* Answer */}
          {question.answer && (
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <div className="flex items-center mb-2">
                <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                  <MessageSquare className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-sm font-medium text-green-800">Instructor's Answer</span>
                {question.answeredAt && (
                  <span className="text-xs text-green-600 ml-2">
                    {formatDate(question.answeredAt)}
                  </span>
                )}
              </div>
              <p className="text-green-700">{question.answer}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onUpvote(question._id)}
              className="flex items-center space-x-1 text-gray-500 hover:text-primary-600 transition-colors"
            >
              <ThumbsUp className="h-4 w-4" />
              <span className="text-sm">{question.upvoteCount || 0}</span>
            </button>
            
            {!question.isAnswered && (
              <div className="flex items-center space-x-1 text-orange-500">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Waiting for answer</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseQA;
