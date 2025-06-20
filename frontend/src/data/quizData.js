export const quizTopics = {
  programming: {
    name: "Programming",
    icon: "💻",
    color: "#3B82F6",
    questions: [
      {
        id: 1,
        question: "What does HTML stand for?",
        options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink and Text Markup Language"],
        correctAnswer: 0,
        difficulty: "easy",
        points: 10
      },
      {
        id: 2,
        question: "Which programming language is known as the 'language of the web'?",
        options: ["Python", "JavaScript", "Java", "C++"],
        correctAnswer: 1,
        difficulty: "easy",
        points: 10
      },
      {
        id: 3,
        question: "What is the time complexity of binary search?",
        options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
        correctAnswer: 1,
        difficulty: "medium",
        points: 20
      },
      {
        id: 4,
        question: "Which of the following is NOT a JavaScript framework?",
        options: ["React", "Angular", "Vue", "Django"],
        correctAnswer: 3,
        difficulty: "medium",
        points: 20
      },
      {
        id: 5,
        question: "What does API stand for?",
        options: ["Application Programming Interface", "Advanced Programming Interface", "Application Process Interface", "Automated Programming Interface"],
        correctAnswer: 0,
        difficulty: "easy",
        points: 10
      }
    ]
  },
  design: {
    name: "Design",
    icon: "🎨",
    color: "#EF4444",
    questions: [
      {
        id: 6,
        question: "What does UX stand for?",
        options: ["User Experience", "User Extension", "Universal Experience", "User Execution"],
        correctAnswer: 0,
        difficulty: "easy",
        points: 10
      },
      {
        id: 7,
        question: "Which color model is primarily used for digital displays?",
        options: ["CMYK", "RGB", "HSV", "LAB"],
        correctAnswer: 1,
        difficulty: "easy",
        points: 10
      },
      {
        id: 8,
        question: "What is the golden ratio approximately equal to?",
        options: ["1.414", "1.618", "1.732", "2.718"],
        correctAnswer: 1,
        difficulty: "medium",
        points: 20
      },
      {
        id: 9,
        question: "Which design principle refers to the visual weight distribution?",
        options: ["Contrast", "Balance", "Emphasis", "Movement"],
        correctAnswer: 1,
        difficulty: "medium",
        points: 20
      },
      {
        id: 10,
        question: "What does CSS stand for?",
        options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style Sheets", "Colorful Style Sheets"],
        correctAnswer: 1,
        difficulty: "easy",
        points: 10
      }
    ]
  },
  business: {
    name: "Business",
    icon: "💼",
    color: "#10B981",
    questions: [
      {
        id: 11,
        question: "What does ROI stand for?",
        options: ["Return on Investment", "Rate of Interest", "Revenue of Income", "Risk of Investment"],
        correctAnswer: 0,
        difficulty: "easy",
        points: 10
      },
      {
        id: 12,
        question: "Which of the following is a key component of a business plan?",
        options: ["Market Analysis", "Financial Projections", "Executive Summary", "All of the above"],
        correctAnswer: 3,
        difficulty: "medium",
        points: 20
      },
      {
        id: 13,
        question: "What is the primary goal of marketing?",
        options: ["Increase sales", "Build brand awareness", "Satisfy customer needs", "All of the above"],
        correctAnswer: 3,
        difficulty: "medium",
        points: 20
      },
      {
        id: 14,
        question: "What does B2B stand for?",
        options: ["Business to Business", "Back to Basics", "Buy to Build", "Brand to Brand"],
        correctAnswer: 0,
        difficulty: "easy",
        points: 10
      },
      {
        id: 15,
        question: "Which financial statement shows a company's profitability?",
        options: ["Balance Sheet", "Income Statement", "Cash Flow Statement", "Statement of Equity"],
        correctAnswer: 1,
        difficulty: "medium",
        points: 20
      }
    ]
  },
  general: {
    name: "General Knowledge",
    icon: "🧠",
    color: "#F59E0B",
    questions: [
      {
        id: 16,
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correctAnswer: 2,
        difficulty: "easy",
        points: 10
      },
      {
        id: 17,
        question: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        correctAnswer: 1,
        difficulty: "easy",
        points: 10
      },
      {
        id: 18,
        question: "Who painted the Mona Lisa?",
        options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
        correctAnswer: 2,
        difficulty: "medium",
        points: 20
      },
      {
        id: 19,
        question: "What is the largest ocean on Earth?",
        options: ["Atlantic", "Indian", "Arctic", "Pacific"],
        correctAnswer: 3,
        difficulty: "easy",
        points: 10
      },
      {
        id: 20,
        question: "In which year did World War II end?",
        options: ["1944", "1945", "1946", "1947"],
        correctAnswer: 1,
        difficulty: "medium",
        points: 20
      }
    ]
  }
};

export const achievements = [
  {
    id: "first_quiz",
    name: "Getting Started",
    description: "Complete your first quiz",
    icon: "🎯",
    condition: (stats) => stats.quizzesCompleted >= 1
  },
  {
    id: "perfect_score",
    name: "Perfect Score",
    description: "Get 100% on any quiz",
    icon: "💯",
    condition: (stats) => stats.perfectScores >= 1
  },
  {
    id: "streak_5",
    name: "On Fire",
    description: "Answer 5 questions correctly in a row",
    icon: "🔥",
    condition: (stats) => stats.maxStreak >= 5
  },
  {
    id: "total_100",
    name: "Century",
    description: "Answer 100 questions correctly",
    icon: "💪",
    condition: (stats) => stats.totalCorrect >= 100
  },
  {
    id: "course_master",
    name: "Course Master",
    description: "Complete 5 courses",
    icon: "🎓",
    condition: (stats) => stats.coursesCompleted >= 5
  },
  {
    id: "quiz_master",
    name: "Quiz Master",
    description: "Complete 10 quizzes",
    icon: "🏆",
    condition: (stats) => stats.quizzesCompleted >= 10
  }
];

export const difficultyMultipliers = {
  easy: 1,
  medium: 2,
  hard: 3
};

// Map course categories to quiz topics
export const categoryToQuizTopic = {
  'Programming': 'programming',
  'Design': 'design',
  'Business': 'business',
  'Marketing': 'business',
  'Photography': 'design',
  'Music': 'general',
  'Health & Fitness': 'general',
  'Language': 'general',
  'Personal Development': 'general',
  'Academic': 'general',
  'Other': 'general'
};
