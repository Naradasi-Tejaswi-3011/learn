# 🎓 LearnHub - AI-Powered Online Learning Platform

A comprehensive full-stack learning management system with AI-powered quiz generation, voice recognition, and real-time progress tracking.

## 🌟 Features

### 🔐 **Authentication & User Management**
- **Real-world user registration** - No demo dependencies
- **JWT-based authentication** with bcrypt password hashing
- **Role-based access control** (Students & Instructors)
- **Secure session management**

### 🤖 **AI-Powered Quiz System**
- **Course-specific quiz generation** using OpenAI GPT
- **Voice recognition** for answering questions
- **Text-to-speech** question reading
- **Performance-based badge system**
- **Intelligent fallback** to category-based questions

### 📚 **Course Management**
- **Rich course creation** with modules and content
- **Video integration** (YouTube, Vimeo, direct files)
- **Text content** with rich formatting
- **Progress tracking** with real-time updates
- **Auto-completion** detection for videos

### 📊 **Progress & Analytics**
- **Real-time progress tracking** with accurate timestamps
- **Course completion detection** at 100%
- **Time spent tracking** per content piece
- **Performance analytics** and reporting

### 📝 **Notes System**
- **Create, edit, and organize** notes by category
- **Search and filter** functionality
- **Persistent storage** with MongoDB
- **Category-based organization** (General, Important, Questions, etc.)

### 🎮 **Gamification**
- **XP and leveling system**
- **Badge achievements** based on performance
- **Streak tracking** for daily learning
- **Leaderboards** and progress visualization

## 🛠️ Tech Stack

### **Frontend**
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Axios** for API communication
- **React Router** for navigation
- **Lucide React** for icons
- **React Hot Toast** for notifications

### **Backend**
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcrypt** for password hashing
- **OpenAI API** for quiz generation
- **Express Validator** for input validation

### **Database**
- **MongoDB Atlas** cloud database
- **Mongoose** schemas and models
- **Indexed queries** for performance

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- MongoDB Atlas account
- Gemini API key (optional, for AI quiz generation and chat functionality)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/learnhub-platform.git
cd learnhub-platform
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

4. **Environment Setup**

Create `backend/.env`:
```env
NODE_ENV=development
PORT=5000
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
OPENAI_API_KEY=your_openai_api_key
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

5. **Start the Application**

Backend:
```bash
cd backend
npm run dev
```

Frontend (in new terminal):
```bash
cd frontend
npm run dev
```

6. **Access the Application**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`

## 📖 Usage

### **For Students:**
1. **Register** with your email and password
2. **Browse courses** and enroll in interesting ones
3. **Learn** by watching videos and reading content
4. **Take notes** and organize them by category
5. **Complete courses** and take AI-generated quizzes
6. **Earn XP and badges** based on performance

### **For Instructors:**
1. **Create courses** with structured modules
2. **Add content** (videos, text, quizzes)
3. **Track student progress** and analytics
4. **Generate reports** on course performance
5. **Manage course enrollment** and settings

## 🎯 Key Features Explained

### **AI Quiz Generation**
- Analyzes completed course content
- Generates relevant multiple-choice questions
- Adapts difficulty based on course complexity
- Provides explanations for correct answers

### **Voice Recognition Quiz**
- Students answer questions using voice commands
- Supports natural language ("A", "Option A", "First", etc.)
- Real-time speech-to-text processing
- Immediate feedback and scoring

### **Smart Progress Tracking**
- Tracks actual time spent on each content piece
- Auto-detects video completion
- Requires minimum engagement time for text content
- Real-time progress updates across the platform

### **Notes Management**
- Create notes with categories and tags
- Search through note content
- Filter by category or date
- Edit and update notes in real-time

## 🔧 API Endpoints

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### **Courses**
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create new course
- `GET /api/courses/:id` - Get course details
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### **Progress**
- `GET /api/progress` - Get user progress
- `PUT /api/progress/:courseId/module/:moduleId` - Update progress
- `POST /api/progress/enroll/:courseId` - Enroll in course

### **Quiz**
- `POST /api/quiz/generate/:courseId` - Generate AI quiz
- `POST /api/quiz/submit` - Submit quiz answers

## 🌐 Deployment

### **Frontend (Vercel)**
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### **Backend (Railway/Render)**
1. Connect repository to Railway or Render
2. Set environment variables in platform dashboard
3. Configure MongoDB Atlas connection
4. Deploy with automatic builds

### **Database (MongoDB Atlas)**
1. Create cluster in MongoDB Atlas
2. Configure network access and database users
3. Get connection string for environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT API integration
- MongoDB for database services
- Vercel for frontend hosting
- Railway/Render for backend hosting

## 📞 Support

For support, email support@learnhub.com or join our Discord community.

---

**Built with ❤️ for the future of online education**
