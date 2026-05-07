import React, { useState } from 'react';
import './index.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [removingTaskId, setRemovingTaskId] = useState(null);

  const addTask = () => {
    if (inputValue.trim() === '') return;
    
    const newTask = {
      id: Date.now(),
      text: inputValue,
      completed: false,
      isNew: true
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
            tasks.map(task => (
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
                <span
                  className={`flex-1 text-gray-700 transition-all duration-200 ${
                    task.completed ? 'line-through text-gray-400' : ''
                  }`}
                >
                  {task.text}
                </span>
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
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              {tasks.filter(task => !task.completed).length} of {tasks.length} active
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
