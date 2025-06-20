import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Award, 
  Trophy, 
  Star, 
  Target,
  Calendar,
  Lock,
  CheckCircle
} from 'lucide-react';

const Badges = () => {
  const { user } = useAuth();
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [availableBadges, setAvailableBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { value: 'all', label: 'All Badges' },
    { value: 'achievement', label: 'Achievements' },
    { value: 'streak', label: 'Streaks' },
    { value: 'completion', label: 'Completion' },
    { value: 'performance', label: 'Performance' },
    { value: 'milestone', label: 'Milestones' }
  ];

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const response = await axios.get('/gamification/badges');
      setEarnedBadges(response.data.earnedBadges);
      setAvailableBadges(response.data.availableBadges);
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeTypeColor = (type) => {
    const colors = {
      bronze: 'from-amber-600 to-amber-800',
      silver: 'from-gray-400 to-gray-600',
      gold: 'from-yellow-400 to-yellow-600',
      platinum: 'from-purple-400 to-purple-600',
      diamond: 'from-blue-400 to-blue-600'
    };
    return colors[type] || colors.bronze;
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'border-gray-300',
      uncommon: 'border-green-400',
      rare: 'border-blue-400',
      epic: 'border-purple-400',
      legendary: 'border-yellow-400'
    };
    return colors[rarity] || colors.common;
  };

  const filteredEarnedBadges = selectedCategory === 'all' 
    ? earnedBadges 
    : earnedBadges.filter(userBadge => userBadge.badge.category === selectedCategory);

  const filteredAvailableBadges = selectedCategory === 'all'
    ? availableBadges
    : availableBadges.filter(badge => badge.category === selectedCategory);

  const earnedBadgeIds = earnedBadges.map(userBadge => userBadge.badge._id);
  const unearnedBadges = filteredAvailableBadges.filter(badge => !earnedBadgeIds.includes(badge._id));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Badge Collection</h1>
          <p className="text-gray-600">Track your achievements and unlock new badges</p>
          <div className="mt-4 flex items-center justify-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{earnedBadges.length}</div>
              <div className="text-sm text-gray-600">Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">{availableBadges.length}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{user.xp}</div>
              <div className="text-sm text-gray-600">XP Points</div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Earned Badges */}
        {filteredEarnedBadges.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Trophy className="h-6 w-6 text-yellow-500 mr-2" />
              Earned Badges
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredEarnedBadges.map((userBadge) => (
                <div 
                  key={userBadge._id} 
                  className={`bg-white rounded-lg shadow-md p-6 text-center border-2 ${getRarityColor(userBadge.badge.rarity)} hover:shadow-lg transition-shadow`}
                >
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${getBadgeTypeColor(userBadge.badge.type)} flex items-center justify-center text-white text-2xl`}>
                    {userBadge.badge.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{userBadge.badge.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{userBadge.badge.description}</p>
                  <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>Earned {new Date(userBadge.earnedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      userBadge.badge.type === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                      userBadge.badge.type === 'silver' ? 'bg-gray-100 text-gray-800' :
                      userBadge.badge.type === 'bronze' ? 'bg-amber-100 text-amber-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {userBadge.badge.type.charAt(0).toUpperCase() + userBadge.badge.type.slice(1)}
                    </span>
                  </div>
                  {userBadge.badge.rewards.xpBonus > 0 && (
                    <div className="mt-2 text-xs text-green-600 font-medium">
                      +{userBadge.badge.rewards.xpBonus} XP Bonus
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Badges */}
        {unearnedBadges.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Target className="h-6 w-6 text-gray-500 mr-2" />
              Available Badges
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {unearnedBadges.map((badge) => (
                <div 
                  key={badge._id} 
                  className={`bg-white rounded-lg shadow-md p-6 text-center border-2 ${getRarityColor(badge.rarity)} opacity-75 hover:opacity-90 transition-opacity`}
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-2xl relative">
                    <Lock className="h-6 w-6 absolute" />
                    <span className="opacity-30">{badge.icon}</span>
                  </div>
                  <h3 className="font-bold text-gray-700 mb-2">{badge.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{badge.description}</p>
                  
                  {/* Requirements */}
                  <div className="text-xs text-gray-500 space-y-1">
                    {badge.requirements.xpThreshold > 0 && (
                      <div className="flex items-center justify-center space-x-1">
                        <Star className="h-3 w-3" />
                        <span>{badge.requirements.xpThreshold} XP required</span>
                      </div>
                    )}
                    {badge.requirements.coursesCompleted > 0 && (
                      <div className="flex items-center justify-center space-x-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>{badge.requirements.coursesCompleted} courses completed</span>
                      </div>
                    )}
                    {badge.requirements.streakDays > 0 && (
                      <div className="flex items-center justify-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{badge.requirements.streakDays} day streak</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      badge.type === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                      badge.type === 'silver' ? 'bg-gray-100 text-gray-800' :
                      badge.type === 'bronze' ? 'bg-amber-100 text-amber-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {badge.type.charAt(0).toUpperCase() + badge.type.slice(1)}
                    </span>
                  </div>
                  
                  {badge.rewards.xpBonus > 0 && (
                    <div className="mt-2 text-xs text-green-600 font-medium">
                      Reward: +{badge.rewards.xpBonus} XP
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No badges message */}
        {filteredEarnedBadges.length === 0 && unearnedBadges.length === 0 && (
          <div className="text-center py-12">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No badges in this category</h3>
            <p className="text-gray-600">Try selecting a different category or start learning to earn badges!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Badges;
