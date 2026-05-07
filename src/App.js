import React, { useState, useEffect } from 'react';
import './index.css';

const PRIORITIES = {
  high: { label: 'High', emoji: '🔴', order: 1 },
  medium: { label: 'Medium', emoji: '🟡', order: 2 },
  low: { label: 'Low', emoji: '🟢', order: 3 }
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [removingTaskId, setRemovingTaskId] = useState(null);
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  // Load tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('vibe-todo-tasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('vibe-todo-tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  const addTask = () => {
    if (inputValue.trim() === '') return;
    
    const newTask = {
      id: Date.now(),
      text: inputValue,
      completed: false,
      isNew: true,
      priority: selectedPriority,
      createdAt: Date.now()
    };
    
    setTasks([...tasks, newTask]);
    setInputValue('');
    
    // Remove the animation flag after animation completes
    setTimeout(() => {
      setTasks(prev => prev.map(task => 
        task.id === newTask.id ? { ...task, isNew: false } : task
      ));
    }, 300);
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    setRemovingTaskId(id);
    
    // Add exit animation
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, isRemoving: true } : task
    ));
    
    // Remove after animation
    setTimeout(() => {
      setTasks(prev => prev.filter(task => task.id !== id));
      setRemovingTaskId(null);
    }, 300);
  };

  const changePriority = (id, newPriority) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, priority: newPriority } : task
    ));
  };

  const startEditing = (id, text) => {
    setEditingTaskId(id);
    setEditingText(text);
  };

  const saveEdit = () => {
    if (editingText.trim() === '') return;
    
    setTasks(tasks.map(task =>
      task.id === editingTaskId ? { ...task, text: editingText.trim() } : task
    ));
    
    setEditingTaskId(null);
    setEditingText('');
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditingText('');
  };

  const handleEditKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // Sort and filter tasks before rendering
  const sortedTasks = [...tasks].sort((a, b) => {
    // First, separate completed and incomplete tasks
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    
    // For incomplete tasks, sort by priority (high to low)
    if (!a.completed && !b.completed) {
      return PRIORITIES[a.priority].order - PRIORITIES[b.priority].order;
    }
    
    // For completed tasks, sort by creation date (newest first)
    return b.createdAt - a.createdAt;
  });

  // Filter tasks based on showCompleted state
  const filteredTasks = showCompleted ? sortedTasks : sortedTasks.filter(task => !task.completed);

  // Count completed tasks
  const completedCount = tasks.filter(task => task.completed).length;
  const activeCount = tasks.filter(task => !task.completed).length;

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-light text-gray-800 mb-8 text-center">To-Do List</h1>
        
        <div className="flex gap-3 mb-8">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="New task..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
          />
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white"
          >
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
          <button
            onClick={addTask}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
          >
            Add
          </button>
        </div>

        <div className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-gray-400 text-center py-12">No tasks</p>
          ) : (
            filteredTasks.map(task => (
              <div
                key={task.id}
                className={`group flex items-center gap-3 p-4 bg-gray-50 rounded-lg transition-all duration-300 ${
                  task.isRemoving ? 'task-exit opacity-0 transform translate-x-4' : 
                  task.isNew ? 'task-enter' : 
                  'hover:bg-gray-100 hover:shadow-md hover:translate-x-1'
                }`}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  className="w-5 h-5 text-purple-500 rounded focus:ring-purple-500 focus:ring-2 cursor-pointer transition-all duration-200"
                />
                <span className="text-lg mr-2">{PRIORITIES[task.priority].emoji}</span>
                {editingTaskId === task.id ? (
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={handleEditKeyPress}
                    onBlur={saveEdit}
                    className="flex-1 px-2 py-1 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    autoFocus
                  />
                ) : (
                  <span
                    className={`flex-1 text-gray-700 transition-all duration-200 cursor-pointer hover:text-purple-600 ${
                      task.completed ? 'line-through text-gray-400' : ''
                    }`}
                    onClick={() => startEditing(task.id, task.text)}
                  >
                    {task.text}
                  </span>
                )}
                <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-all duration-200">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name={`priority-${task.id}`}
                      value="high"
                      checked={task.priority === 'high'}
                      onChange={(e) => changePriority(task.id, e.target.value)}
                      className="sr-only"
                    />
                    <span className={`text-xs px-2 py-1 rounded transition-colors ${
                      task.priority === 'high' 
                        ? 'bg-red-100 text-red-600 border border-red-300' 
                        : 'bg-gray-100 text-gray-400 border border-gray-200 hover:bg-red-50 hover:text-red-500'
                    }`}>
                      🔴
                    </span>
                  </label>
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name={`priority-${task.id}`}
                      value="medium"
                      checked={task.priority === 'medium'}
                      onChange={(e) => changePriority(task.id, e.target.value)}
                      className="sr-only"
                    />
                    <span className={`text-xs px-2 py-1 rounded transition-colors ${
                      task.priority === 'medium' 
                        ? 'bg-yellow-100 text-yellow-600 border border-yellow-300' 
                        : 'bg-gray-100 text-gray-400 border border-gray-200 hover:bg-yellow-50 hover:text-yellow-500'
                    }`}>
                      🟡
                    </span>
                  </label>
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name={`priority-${task.id}`}
                      value="low"
                      checked={task.priority === 'low'}
                      onChange={(e) => changePriority(task.id, e.target.value)}
                      className="sr-only"
                    />
                    <span className={`text-xs px-2 py-1 rounded transition-colors ${
                      task.priority === 'low' 
                        ? 'bg-green-100 text-green-600 border border-green-300' 
                        : 'bg-gray-100 text-gray-400 border border-gray-200 hover:bg-green-50 hover:text-green-500'
                    }`}>
                      🟢
                    </span>
                  </label>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all duration-200 p-2 hover:bg-red-50 rounded-md"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {tasks.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {activeCount} of {tasks.length} active
              </p>
              {completedCount > 0 && (
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="text-sm text-purple-600 hover:text-purple-700 transition-colors"
                >
                  {showCompleted ? 'Hide' : 'Show'} completed ({completedCount})
                </button>
              )}
            </div>
            
            {!showCompleted && completedCount > 0 && (
              <div className="text-center">
                <button
                  onClick={() => setShowCompleted(true)}
                  className="text-xs text-gray-400 hover:text-gray-500 transition-colors"
                >
                  View {completedCount} completed {completedCount === 1 ? 'task' : 'tasks'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
