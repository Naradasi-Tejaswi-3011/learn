import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  X, 
  Clock, 
  AlertTriangle, 
  Star, 
  CheckCircle, 
  Calendar,
  Target,
  Filter,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TaskBoard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [inputTask, setInputTask] = useState('');
  const [taskCategory, setTaskCategory] = useState('important');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Load tasks from localStorage on component mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('selfPaced-tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('selfPaced-tasks', JSON.stringify(tasks));
    
    // Update stats in parent component
    const completedTasks = tasks.filter(task => task.category === 'completed').length;
    const savedStats = localStorage.getItem('selfPacedStats');
    if (savedStats) {
      const stats = JSON.parse(savedStats);
      stats.completedTasks = completedTasks;
      localStorage.setItem('selfPacedStats', JSON.stringify(stats));
    }
  }, [tasks]);

  const addTask = () => {
    if (inputTask.trim() === '') return;

    const newTask = {
      id: Date.now().toString(),
      text: inputTask,
      category: taskCategory,
      priority: taskPriority,
      dueDate: taskDueDate,
      createdAt: new Date().toISOString(),
      completedAt: null,
      tags: [],
      description: ''
    };

    setTasks([...tasks, newTask]);
    setInputTask('');
    setTaskDueDate('');
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const updateTaskCategory = (taskId, newCategory) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            category: newCategory,
            completedAt: newCategory === 'completed' ? new Date().toISOString() : null
          }
        : task
    ));
  };

  const updateTaskPriority = (taskId, newPriority) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, priority: newPriority } : task
    ));
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, category) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    updateTaskCategory(taskId, category);
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'urgent': return <AlertTriangle className="h-5 w-5" />;
      case 'important': return <Star className="h-5 w-5" />;
      case 'normal': return <Clock className="h-5 w-5" />;
      case 'completed': return <CheckCircle className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'urgent': return 'bg-red-50 border-red-200';
      case 'important': return 'bg-yellow-50 border-yellow-200';
      case 'normal': return 'bg-blue-50 border-blue-200';
      case 'completed': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getCategoryHeaderColor = (category) => {
    switch(category) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'important': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === 'all' || task.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const getTasksByCategory = (category) => {
    return filteredTasks.filter(task => task.category === category);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const categories = [
    { id: 'urgent', name: 'Urgent', icon: AlertTriangle },
    { id: 'important', name: 'Important', icon: Star },
    { id: 'normal', name: 'Normal', icon: Clock },
    { id: 'completed', name: 'Completed', icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/self-paced"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Self-Paced Mode</span>
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-xl font-semibold text-gray-900">Task Board</h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              />
            </div>

            {/* Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            >
              <option value="all">All Tasks</option>
              <option value="urgent">Urgent</option>
              <option value="important">Important</option>
              <option value="normal">Normal</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Task Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Task</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <input
                type="text"
                value={inputTask}
                onChange={(e) => setInputTask(e.target.value)}
                placeholder="Enter task description..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
              />
            </div>
            
            <div className="md:col-span-2">
              <select
                value={taskCategory}
                onChange={(e) => setTaskCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="urgent">Urgent</option>
                <option value="important">Important</option>
                <option value="normal">Normal</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              />
            </div>
            
            <div className="md:col-span-2">
              <button
                onClick={addTask}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Task</span>
              </button>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {categories.map((category) => {
            const categoryTasks = getTasksByCategory(category.id);
            const IconComponent = category.icon;
            
            return (
              <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
                {/* Column Header */}
                <div className={`p-4 rounded-t-xl border-b ${getCategoryHeaderColor(category.id)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-5 w-5" />
                      <h3 className="font-semibold">{category.name}</h3>
                    </div>
                    <span className="text-sm font-medium bg-white/50 px-2 py-1 rounded-full">
                      {categoryTasks.length}
                    </span>
                  </div>
                </div>

                {/* Drop Zone */}
                <div
                  className={`min-h-[400px] p-4 space-y-3 ${getCategoryColor(category.id)}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, category.id)}
                >
                  {categoryTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow group"
                    >
                      {/* Task Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium mb-1">{task.text}</p>
                          
                          {/* Priority Badge */}
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                              {task.priority} priority
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Task Footer */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3" />
                          <span>Created {formatDate(task.createdAt)}</span>
                        </div>
                        
                        {task.dueDate && (
                          <div className={`flex items-center space-x-1 ${
                            isOverdue(task.dueDate) ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            <Clock className="h-3 w-3" />
                            <span>Due {formatDate(task.dueDate)}</span>
                          </div>
                        )}
                      </div>

                      {task.completedAt && (
                        <div className="mt-2 text-xs text-green-600 flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Completed {formatDate(task.completedAt)}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {categoryTasks.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No {category.name.toLowerCase()} tasks</p>
                      <p className="text-sm">Drag tasks here or create new ones</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Task Statistics */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Statistics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {tasks.length}
              </div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {getTasksByCategory('completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {getTasksByCategory('urgent').length}
              </div>
              <div className="text-sm text-gray-600">Urgent</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {tasks.filter(task => task.dueDate && isOverdue(task.dueDate) && task.category !== 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Overdue</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskBoard;
