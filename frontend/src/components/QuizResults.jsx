import React from 'react';
import { Trophy, Star, Clock, Target, Award, RotateCcw, ArrowLeft } from 'lucide-react';

const QuizResults = ({ results, onPlayAgain, onBack, newBadges = [] }) => {
  const { score, details, xpGained, levelUp } = results;
  const percentage = score.percentage;
  
  const getScoreColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (percentage) => {
    if (percentage === 100) return 'Perfect! Outstanding work! 🎉';
    if (percentage >= 90) return 'Excellent! You\'re doing great! 🌟';
    if (percentage >= 70) return 'Good job! Keep it up! 👍';
    if (percentage >= 50) return 'Not bad! Room for improvement! 📚';
    return 'Keep practicing! You\'ll get better! 💪';
  };

  const averageTime = details.reduce((sum, detail) => sum + detail.timeSpent, 0) / details.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Trophy className={`h-16 w-16 ${getScoreColor(percentage)}`} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
          <p className="text-xl text-gray-600">{getScoreMessage(percentage)}</p>
        </div>

        {/* Score Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <div className={`text-6xl font-bold ${getScoreColor(percentage)} mb-2`}>
              {percentage}%
            </div>
            <p className="text-gray-600 text-lg">
              {score.correctCount} out of {score.totalQuestions} correct
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{score.totalPoints}</div>
              <div className="text-sm text-gray-600">Points Earned</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{averageTime.toFixed(1)}s</div>
              <div className="text-sm text-gray-600">Avg. Time</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Star className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">+{xpGained}</div>
              <div className="text-sm text-gray-600">XP Gained</div>
            </div>
          </div>

          {/* Level Up Notification */}
          {levelUp && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-lg mb-6 text-center">
              <Award className="h-8 w-8 mx-auto mb-2" />
              <h3 className="text-xl font-bold">Level Up!</h3>
              <p>Congratulations! You've reached a new level!</p>
            </div>
          )}

          {/* New Badges */}
          {newBadges.length > 0 && (
            <div className="bg-gradient-to-r from-purple-400 to-pink-500 text-white p-6 rounded-lg mb-6">
              <div className="text-center">
                <Award className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">New Badge{newBadges.length > 1 ? 's' : ''} Earned!</h3>
                <div className="flex flex-wrap justify-center gap-4">
                  {newBadges.map((badge, index) => (
                    <div key={index} className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                      <div className="text-3xl mb-2">{badge.icon}</div>
                      <div className="font-bold">{badge.name}</div>
                      <div className="text-sm opacity-90">{badge.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Question Breakdown */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Question Breakdown</h2>
          <div className="space-y-4">
            {details.map((detail, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border-l-4 ${
                  detail.isCorrect 
                    ? 'bg-green-50 border-green-500' 
                    : 'bg-red-50 border-red-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Question {index + 1}
                    </h3>
                    <p className="text-gray-700 mb-2">{detail.question}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className={`font-medium ${
                        detail.isCorrect ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {detail.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                      <span className="text-gray-500">
                        {detail.timeSpent.toFixed(1)}s
                      </span>
                      <span className="text-gray-500">
                        {detail.points} pts
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        detail.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        detail.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {detail.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl ${
                      detail.isCorrect ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {detail.isCorrect ? '✓' : '✗'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onBack}
            className="flex items-center justify-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          
          <button
            onClick={onPlayAgain}
            className="flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Take Quiz Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
