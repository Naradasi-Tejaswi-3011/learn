const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const generateQuizQuestions = async (courseData) => {
  try {
    console.log('Generating quiz for course:', courseData.title);
    
    // Extract course content for context
    const courseContent = extractCourseContent(courseData);
    
    const prompt = `
Based on the following course content, generate 5 multiple-choice questions that test the student's understanding of the key concepts:

Course Title: ${courseData.title}
Course Description: ${courseData.description}
Course Category: ${courseData.category}

Course Content:
${courseContent}

Please generate exactly 5 questions in the following JSON format:
{
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

Requirements:
- Questions should be relevant to the course content
- Mix of difficulty levels (easy, medium, hard)
- Clear, unambiguous questions
- Plausible distractors for incorrect options
- Brief explanations for correct answers
- Focus on practical application and understanding, not just memorization
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator who specializes in creating high-quality quiz questions that test deep understanding of course material."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    const quizData = JSON.parse(response.choices[0].message.content);
    
    // Add metadata to each question
    const questionsWithMetadata = quizData.questions.map((q, index) => ({
      ...q,
      id: `q_${Date.now()}_${index}`,
      courseId: courseData._id,
      courseTitle: courseData.title,
      category: courseData.category,
      difficulty: getDifficultyLevel(index),
      timeLimit: 30, // 30 seconds per question
      points: 10
    }));

    return {
      success: true,
      questions: questionsWithMetadata,
      metadata: {
        courseId: courseData._id,
        courseTitle: courseData.title,
        category: courseData.category,
        totalQuestions: questionsWithMetadata.length,
        totalPoints: questionsWithMetadata.length * 10,
        estimatedTime: questionsWithMetadata.length * 30 // seconds
      }
    };

  } catch (error) {
    console.error('Error generating quiz questions:', error);
    
    // Fallback to predefined questions if AI fails
    return generateFallbackQuiz(courseData);
  }
};

const extractCourseContent = (courseData) => {
  let content = '';
  
  if (courseData.modules && courseData.modules.length > 0) {
    courseData.modules.forEach((module, moduleIndex) => {
      content += `\nModule ${moduleIndex + 1}: ${module.title}\n`;
      content += `Description: ${module.description || 'No description'}\n`;
      
      if (module.content && module.content.length > 0) {
        module.content.forEach((item, itemIndex) => {
          content += `\nLesson ${itemIndex + 1}: ${item.title}\n`;
          content += `Type: ${item.type}\n`;
          
          if (item.type === 'text' && item.textContent) {
            // Limit text content to avoid token limits
            const truncatedText = item.textContent.substring(0, 500);
            content += `Content: ${truncatedText}${item.textContent.length > 500 ? '...' : ''}\n`;
          }
          
          if (item.description) {
            content += `Description: ${item.description}\n`;
          }
        });
      }
    });
  }
  
  return content || `Course about ${courseData.category} - ${courseData.description}`;
};

const getDifficultyLevel = (index) => {
  // Distribute difficulty levels
  if (index < 2) return 'easy';
  if (index < 4) return 'medium';
  return 'hard';
};

const generateFallbackQuiz = (courseData) => {
  console.log('Using fallback quiz generation for:', courseData.title);
  
  const categoryQuestions = {
    'Programming': [
      {
        question: "What is the primary purpose of version control systems like Git?",
        options: ["To compile code", "To track changes in code over time", "To run tests", "To deploy applications"],
        correctAnswer: 1,
        explanation: "Version control systems track changes in code, allowing developers to collaborate and maintain history."
      },
      {
        question: "Which programming concept allows code reusability?",
        options: ["Variables", "Functions", "Comments", "Syntax"],
        correctAnswer: 1,
        explanation: "Functions allow code to be written once and reused multiple times throughout a program."
      }
    ],
    'Design': [
      {
        question: "What is the primary principle of good user interface design?",
        options: ["Complexity", "User-friendliness", "Bright colors", "Small fonts"],
        correctAnswer: 1,
        explanation: "User-friendliness ensures that interfaces are intuitive and easy to use."
      },
      {
        question: "What does UX stand for in design?",
        options: ["User Experience", "User Extension", "Unique Experience", "Universal Extension"],
        correctAnswer: 0,
        explanation: "UX stands for User Experience, focusing on how users interact with products."
      }
    ],
    'Business': [
      {
        question: "What is the main goal of market research?",
        options: ["To increase costs", "To understand customer needs", "To reduce quality", "To limit competition"],
        correctAnswer: 1,
        explanation: "Market research helps businesses understand their customers' needs and preferences."
      },
      {
        question: "What does ROI stand for in business?",
        options: ["Return on Investment", "Rate of Interest", "Risk of Investment", "Revenue of Income"],
        correctAnswer: 0,
        explanation: "ROI measures the efficiency of an investment by comparing gain to cost."
      }
    ]
  };

  const questions = categoryQuestions[courseData.category] || categoryQuestions['Programming'];
  
  // Add more generic questions to reach 5 total
  const genericQuestions = [
    {
      question: `What is the most important aspect of learning ${courseData.category.toLowerCase()}?`,
      options: ["Memorizing facts", "Practical application", "Reading only", "Avoiding practice"],
      correctAnswer: 1,
      explanation: "Practical application helps reinforce learning and build real skills."
    },
    {
      question: `How can you best improve your skills in ${courseData.category.toLowerCase()}?`,
      options: ["Practice regularly", "Study once", "Avoid challenges", "Skip fundamentals"],
      correctAnswer: 0,
      explanation: "Regular practice is key to developing and maintaining skills in any field."
    },
    {
      question: `What should you do when facing a difficult concept in ${courseData.category.toLowerCase()}?`,
      options: ["Give up immediately", "Break it into smaller parts", "Ignore it", "Memorize without understanding"],
      correctAnswer: 1,
      explanation: "Breaking complex concepts into smaller, manageable parts makes them easier to understand."
    }
  ];

  const allQuestions = [...questions, ...genericQuestions].slice(0, 5);
  
  const questionsWithMetadata = allQuestions.map((q, index) => ({
    ...q,
    id: `fallback_${Date.now()}_${index}`,
    courseId: courseData._id,
    courseTitle: courseData.title,
    category: courseData.category,
    difficulty: getDifficultyLevel(index),
    timeLimit: 30,
    points: 10
  }));

  return {
    success: true,
    questions: questionsWithMetadata,
    metadata: {
      courseId: courseData._id,
      courseTitle: courseData.title,
      category: courseData.category,
      totalQuestions: questionsWithMetadata.length,
      totalPoints: questionsWithMetadata.length * 10,
      estimatedTime: questionsWithMetadata.length * 30,
      fallback: true
    }
  };
};

module.exports = {
  generateQuizQuestions
};
