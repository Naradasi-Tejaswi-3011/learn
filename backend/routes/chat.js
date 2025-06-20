const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Initialize Gemini AI
let genAI;
let model;
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  console.log('✅ Gemini AI initialized successfully');
} catch (error) {
  console.error('❌ Gemini AI initialization error:', error);
}

// @route   POST /api/chat
// @desc    Chat with SUGAI AI
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (!model) {
      return res.status(503).json({
        message: 'AI service is currently unavailable',
        fallback: "I'm sorry, the AI service is currently unavailable. Please try again later or ask your question in a different way."
      });
    }

    // Create a system prompt for SUGAI AI
    const systemPrompt = context || `You are SUGAI AI, a helpful study assistant designed to help students learn better. You provide clear, educational responses and help with understanding concepts, summarizing information, and answering study-related questions. Keep your responses concise but informative.`;

    // Combine system prompt with user message for Gemini
    const fullPrompt = `${systemPrompt}\n\nUser Question: ${message}\n\nPlease provide a helpful response:`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    res.json({
      response: text,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Chat API error:', error);

    if (error.message?.includes('quota') || error.message?.includes('limit')) {
      return res.status(429).json({
        message: 'AI service temporarily unavailable. Please try again later.',
        fallback: "I'm sorry, I'm currently experiencing high demand. Please try asking your question again in a few moments, or consider breaking down complex questions into smaller parts."
      });
    }

    res.status(500).json({
      message: 'Error processing your request',
      fallback: "I apologize, but I'm having trouble processing your request right now. Please try rephrasing your question or ask something else."
    });
  }
});

// @route   POST /api/chat/summarize
// @desc    Summarize text content
// @access  Private
router.post('/summarize', auth, async (req, res) => {
  try {
    const { text, type = 'general' } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text content is required' });
    }

    if (!model) {
      return res.status(503).json({
        message: 'AI service is currently unavailable',
        fallback: "I'm sorry, the summarization service is currently unavailable. Please try again later."
      });
    }

    // Limit text length to prevent excessive API usage
    const maxLength = 8000; // Gemini can handle longer texts
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

    let prompt;
    switch (type) {
      case 'notes':
        prompt = `You are a helpful AI assistant that creates clear, well-structured summaries for study purposes. Please create a concise summary of these study notes, highlighting the key concepts and important points:\n\n${truncatedText}`;
        break;
      case 'academic':
        prompt = `You are a helpful AI assistant that creates clear, well-structured summaries for academic purposes. Please provide an academic summary of this content, focusing on main arguments, evidence, and conclusions:\n\n${truncatedText}`;
        break;
      case 'bullet':
        prompt = `You are a helpful AI assistant that creates clear, well-structured summaries. Please create a bullet-point summary of this content, organizing the main ideas clearly:\n\n${truncatedText}`;
        break;
      default:
        prompt = `You are a helpful AI assistant that creates clear, well-structured summaries. Please provide a clear and concise summary of this content:\n\n${truncatedText}`;
    }

    const result = await model.generateContent(prompt);
    const response = result.response;
    const summary = response.text();

    res.json({
      summary: summary,
      originalLength: text.length,
      summaryLength: summary.length,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Summarization API error:', error);

    if (error.message?.includes('quota') || error.message?.includes('limit')) {
      return res.status(429).json({
        message: 'AI service temporarily unavailable. Please try again later.',
        fallback: "I'm sorry, the summarization service is currently experiencing high demand. Please try again in a few moments."
      });
    }

    res.status(500).json({
      message: 'Error processing summarization request',
      fallback: "I apologize, but I'm having trouble summarizing this content right now. Please try with a shorter text or try again later."
    });
  }
});

module.exports = router;
