import React, { useState } from 'react';
import { X, Send, Bot, User } from 'lucide-react';

const SugaiAI = ({ onClose }) => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: "Hello! I'm SUGAI AI, your study assistant. I'm powered by Google's Gemini AI and ready to help you with your studies! Ask me anything about concepts, homework, exam preparation, or any academic topic you need help with. 🤖✨"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!query.trim()) return;

    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      const errorMessage = {
        type: 'bot',
        content: "Please log in to use SUGAI AI. You need to be authenticated to access the AI assistant."
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Add user message
    const userMessage = { type: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);

    const currentQuery = query;
    setQuery("");
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: currentQuery,
          context: "You are SUGAI AI, a helpful study assistant. Provide clear, educational responses to help students learn better."
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 503) {
          throw new Error(errorData.fallback || 'AI service is currently unavailable. Please try again later.');
        } else if (response.status === 429) {
          throw new Error(errorData.fallback || 'AI service is experiencing high demand. Please try again in a few moments.');
        }
        throw new Error(errorData.message || 'Failed to get response from AI');
      }

      const data = await response.json();
      const botMessage = {
        type: 'bot',
        content: data.response || "I'm sorry, I couldn't process that request. Please try again."
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('SUGAI AI Error:', error);
      const errorMessage = {
        type: 'bot',
        content: error.message || "Sorry, I'm having trouble connecting right now. Please try again later."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessage = (content) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">SUGAI AI</h2>
              <p className="text-sm text-blue-100">Your Study Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex items-start space-x-2 max-w-[80%] ${
                  message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.type === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: formatMessage(message.content)
                    }}
                  />
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2 max-w-[80%]">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Bot className="h-4 w-4 text-gray-600" />
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask SUGAI anything about your studies..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>{isLoading ? "Thinking..." : "Ask"}</span>
            </button>
          </form>
          
          <div className="mt-2 text-xs text-gray-500 text-center">
            💡 Try asking: "Explain this concept", "Help me understand", "Summarize this topic"
          </div>
        </div>
      </div>
    </div>
  );
};

export default SugaiAI;
