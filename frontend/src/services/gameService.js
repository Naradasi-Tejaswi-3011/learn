import { achievements, difficultyMultipliers } from '../data/quizData';
import axios from 'axios';

class GameService {
  constructor() {
    this.storageKey = 'voiceQuizGameData';
    this.userData = this.loadUserData();
  }

  loadUserData() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    }

    // Default user data
    return {
      level: 1,
      xp: 0,
      totalScore: 0,
      quizzesCompleted: 0,
      coursesCompleted: 0,
      perfectScores: 0,
      totalCorrect: 0,
      totalQuestions: 0,
      currentStreak: 0,
      maxStreak: 0,
      badges: [],
      quizHistory: [],
      courseHistory: [],
      topicStats: {},
      lastPlayed: null
    };
  }

  saveUserData() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  getUserData() {
    return { ...this.userData };
  }

  getStats() {
    return {
      level: this.userData.level,
      xp: this.userData.xp,
      quizzesCompleted: this.userData.quizzesCompleted,
      coursesCompleted: this.userData.coursesCompleted,
      perfectScores: this.userData.perfectScores,
      totalCorrect: this.userData.totalCorrect,
      totalQuestions: this.userData.totalQuestions,
      accuracy: this.userData.totalQuestions > 0 
        ? Math.round((this.userData.totalCorrect / this.userData.totalQuestions) * 100) 
        : 0,
      currentStreak: this.userData.currentStreak,
      maxStreak: this.userData.maxStreak,
      badges: this.userData.badges.length,
      topicStats: this.userData.topicStats
    };
  }

  async submitQuizResults(topic, questions, answers, timeSpent) {
    const results = this.calculateResults(questions, answers, timeSpent);

    // Update user stats
    this.userData.quizzesCompleted++;
    this.userData.totalCorrect += results.score.correctCount;
    this.userData.totalQuestions += results.score.totalQuestions;
    this.userData.totalScore += results.score.totalPoints;
    this.userData.lastPlayed = new Date().toISOString();

    // Update streak
    if (results.score.correctCount === results.score.totalQuestions) {
      this.userData.currentStreak++;
      this.userData.perfectScores++;
      if (this.userData.currentStreak > this.userData.maxStreak) {
        this.userData.maxStreak = this.userData.currentStreak;
      }
    } else {
      this.userData.currentStreak = 0;
    }

    // Update topic stats
    if (!this.userData.topicStats[topic]) {
      this.userData.topicStats[topic] = {
        quizzesCompleted: 0,
        totalCorrect: 0,
        totalQuestions: 0,
        bestScore: 0,
        averageTime: 0
      };
    }

    const topicStat = this.userData.topicStats[topic];
    topicStat.quizzesCompleted++;
    topicStat.totalCorrect += results.score.correctCount;
    topicStat.totalQuestions += results.score.totalQuestions;
    topicStat.bestScore = Math.max(topicStat.bestScore, results.score.percentage);

    // Calculate average time
    const avgTime = results.details.reduce((sum, detail) => sum + detail.timeSpent, 0) / results.details.length;
    topicStat.averageTime = (topicStat.averageTime * (topicStat.quizzesCompleted - 1) + avgTime) / topicStat.quizzesCompleted;

    // Add XP and check for level up
    const xpGained = this.calculateXP(results);
    this.userData.xp += xpGained;
    const levelUp = this.checkLevelUp();

    // Add to quiz history
    this.userData.quizHistory.unshift({
      topic,
      date: new Date().toISOString(),
      score: results.score,
      xpGained,
      timeSpent: results.details.reduce((sum, detail) => sum + detail.timeSpent, 0)
    });

    // Keep only last 50 quiz records
    if (this.userData.quizHistory.length > 50) {
      this.userData.quizHistory = this.userData.quizHistory.slice(0, 50);
    }

    // Check for new achievements locally
    const localNewBadges = this.checkAchievements();

    // Save data locally
    this.saveUserData();

    // Try to sync with backend for badge awards
    let backendBadges = [];
    try {
      const response = await axios.post('/gamification/quiz-complete', {
        topic,
        score: results.score.correctCount,
        totalQuestions: results.score.totalQuestions,
        xpGained
      });

      if (response.data.success) {
        backendBadges = response.data.newBadges || [];
      }
    } catch (error) {
      console.error('Error syncing with backend:', error);
      // Continue with local badges if backend fails
    }

    // Combine local and backend badges (prefer backend)
    const newBadges = backendBadges.length > 0 ? backendBadges : localNewBadges;

    return {
      ...results,
      xpGained,
      newBadges,
      levelUp
    };
  }

  calculateResults(questions, answers, timeSpent) {
    const details = questions.map((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      const points = isCorrect ? question.points * difficultyMultipliers[question.difficulty] : 0;
      
      return {
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        points,
        timeSpent: timeSpent[index] || 30,
        difficulty: question.difficulty
      };
    });

    const correctCount = details.filter(d => d.isCorrect).length;
    const totalPoints = details.reduce((sum, d) => sum + d.points, 0);
    const maxPoints = questions.reduce((sum, q) => sum + (q.points * difficultyMultipliers[q.difficulty]), 0);
    const percentage = Math.round((correctCount / questions.length) * 100);

    return {
      score: {
        correctCount,
        totalQuestions: questions.length,
        totalPoints,
        maxPoints,
        percentage
      },
      details
    };
  }

  calculateXP(results) {
    let xp = 0;
    
    // Base XP for each correct answer
    xp += results.score.correctCount * 10;
    
    // Bonus XP for difficulty
    results.details.forEach(detail => {
      if (detail.isCorrect) {
        xp += detail.points;
      }
    });

    // Perfect score bonus
    if (results.score.percentage === 100) {
      xp += 50;
    }

    // Speed bonus (if answered quickly)
    const avgTime = results.details.reduce((sum, d) => sum + d.timeSpent, 0) / results.details.length;
    if (avgTime < 10) {
      xp += 25;
    }

    return xp;
  }

  checkLevelUp() {
    const newLevel = Math.floor(this.userData.xp / 100) + 1;
    if (newLevel > this.userData.level) {
      this.userData.level = newLevel;
      return true;
    }
    return false;
  }

  checkAchievements() {
    const currentStats = this.getStats();
    const newBadges = [];

    achievements.forEach(achievement => {
      if (!this.userData.badges.includes(achievement.id) && achievement.condition(currentStats)) {
        this.userData.badges.push(achievement.id);
        newBadges.push(achievement);
      }
    });

    return newBadges;
  }

  markCourseCompleted(courseId, courseName, category) {
    // Add to course history
    this.userData.courseHistory.unshift({
      courseId,
      courseName,
      category,
      completedAt: new Date().toISOString()
    });

    this.userData.coursesCompleted++;

    // Award XP for course completion
    const xpGained = 100;
    this.userData.xp += xpGained;
    this.checkLevelUp();

    // Check for new achievements
    const newBadges = this.checkAchievements();

    this.saveUserData();

    return {
      xpGained,
      newBadges
    };
  }

  getBadges() {
    return achievements.filter(achievement => 
      this.userData.badges.includes(achievement.id)
    );
  }

  getAvailableBadges() {
    return achievements.filter(achievement => 
      !this.userData.badges.includes(achievement.id)
    );
  }

  resetProgress() {
    localStorage.removeItem(this.storageKey);
    this.userData = {
      level: 1,
      xp: 0,
      totalScore: 0,
      quizzesCompleted: 0,
      coursesCompleted: 0,
      perfectScores: 0,
      totalCorrect: 0,
      totalQuestions: 0,
      currentStreak: 0,
      maxStreak: 0,
      badges: [],
      quizHistory: [],
      courseHistory: [],
      topicStats: {},
      lastPlayed: null
    };
    this.saveUserData();
  }
}

export default GameService;
