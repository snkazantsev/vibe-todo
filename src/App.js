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
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [subtaskInputs, setSubtaskInputs] = useState({});
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [editingTimeId, setEditingTimeId] = useState(null);
  const [editingTimeValue, setEditingTimeValue] = useState('');

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState(null);
  const [chatInputValue, setChatInputValue] = useState('');

  // Load tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('vibe-todo-tasks');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        // Ensure subtasks exist for backward compatibility
        const tasksWithSubtasks = parsedTasks.map(task => ({
          ...task,
          subtasks: task.subtasks || [],
          // Add timer fields for backward compatibility
          totalElapsed: task.totalElapsed || 0,
          lastStartTime: task.lastStartTime || null,
          isRunning: task.isRunning || false
        }));
        setTasks(tasksWithSubtasks);
        
        // Restore active task if any
        const runningTask = tasksWithSubtasks.find(task => task.isRunning);
        if (runningTask) {
          setActiveTaskId(runningTask.id);
        }
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    }
    
    // Load timer state from localStorage
    const savedActiveTaskId = localStorage.getItem('vibe-todo-active-task');
    if (savedActiveTaskId) {
      setActiveTaskId(savedActiveTaskId);
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('vibe-todo-tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  // Save active task to localStorage
  useEffect(() => {
    if (activeTaskId) {
      localStorage.setItem('vibe-todo-active-task', activeTaskId);
    } else {
      localStorage.removeItem('vibe-todo-active-task');
    }
  }, [activeTaskId]);

  // Update current time for timer display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 100); // Update every 100ms for smooth display
    
    return () => clearInterval(interval);
  }, []);

  // Voice recording toggle logic
  const toggleVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Распознавание речи не поддерживается вашим браузером. Попробуйте Google Chrome.");
      return;
    }

    if (isRecording) {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setChatInputValue(prev => {
        const newVal = prev.trim() ? prev.trim() + ' ' + transcript : transcript;
        setTimeout(() => {
          const chatInput = document.getElementById('chatInput');
          if (chatInput) {
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 80) + 'px';
          }
        }, 10);
        return newVal;
      });
    };

    recognition.onerror = (e) => {
      console.error('Speech recognition error:', e.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    setRecognitionInstance(recognition);
    recognition.start();
  };

  // Safe and centralized chat message submission helper
  const handleSendChatMessage = (message) => {
    if (!message) return;

    // Add user message to UI
    const messagesContainer = document.getElementById('chatMessages');
    const userMessage = document.createElement('div');
    userMessage.className = 'flex items-start space-x-3 fade-in';
    userMessage.innerHTML = `
      <div class="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
      </div>
      <div class="flex-1">
        <div class="bg-blue-500 text-white rounded-lg p-2 ml-auto max-w-xs">
          <p class="text-sm">${message}</p>
        </div>
      </div>
    `;
    messagesContainer.appendChild(userMessage);
    
    // Show typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.id = 'typingIndicator';
    typingIndicator.className = 'flex items-start space-x-3 fade-in';
    typingIndicator.innerHTML = `
      <div class="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
      </div>
      <div class="flex-1">
        <div class="bg-gray-100 rounded-lg p-2 max-w-xs">
          <div class="flex space-x-1">
            <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
            <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
            <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          </div>
        </div>
      </div>
    `;
    messagesContainer.appendChild(typingIndicator);
    
    setChatInputValue('');
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
      chatInput.style.height = 'auto';
    }

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Call Gemini API
    callGeminiAPI(message);
  };

  // Helper to format current tasks as context for Gemini
  const getTasksContext = () => {
    if (tasks.length === 0) return 'The list is currently empty.';
    return tasks.map(t => {
      const status = t.completed ? 'Completed' : 'Active';
      return `- [${t.priority.toUpperCase()}] ${t.text} (${status})`;
    }).join('\n');
  };

  // Gemini API function
  const callGeminiAPI = async (message) => {
    let apiKey = localStorage.getItem('gemini_api_key');
    
    // Try to load from config.yml first
    if (!apiKey) {
      try {
        const response = await fetch('/config.yml');
        const configText = await response.text();
        const match = configText.match(/api_key:\s*"([^"]+)"/);
        if (match && match[1] && match[1] !== 'YOUR_GEMINI_API_KEY_HERE') {
          apiKey = match[1];
          localStorage.setItem('gemini_api_key', apiKey);
        }
      } catch (error) {
        console.log('Could not load config.yml:', error);
      }
    }
    
    if (!apiKey) {
      const newKey = prompt('Please enter your Gemini API key:');
      if (newKey) {
        localStorage.setItem('gemini_api_key', newKey);
      } else {
        // Remove typing indicator and show error
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) typingIndicator.remove();
        
        const messagesContainer = document.getElementById('chatMessages');
        const errorMessage = document.createElement('div');
        errorMessage.className = 'flex items-start space-x-3 fade-in';
        errorMessage.innerHTML = `
          <div class="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div class="flex-1">
            <div class="bg-red-50 border border-red-200 text-red-800 rounded-lg p-2 max-w-xs">
              <p class="text-sm">API key is required to use the chat.</p>
            </div>
          </div>
        `;
        messagesContainer.appendChild(errorMessage);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return;
      }
    }

    try {
      const systemPrompt = `You are a helpful task management assistant for Vibe Todo. Your job is to help users manage their To-Do list.
You must always reply in JSON format with this exact schema:
{
  "action": "addTask" or "none",
  "task": {
    "text": "string (the task title)",
    "priority": "high", "medium", or "low"
  },
  "reply": "string (friendly confirmation or chat response in the language the user used)"
}

If the user wants to add a task, set "action" to "addTask", parse the task content into "task.text" (translate if necessary, keep it clear and concise in the user's language), and classify the priority into "task.priority" (default to "medium" if unspecified).
If the user is just chatting or asking a general question, set "action" to "none" and formulate a helpful response in "reply".
Always match the language of the user in your "reply".`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Current task list:\n${getTasksContext()}\n\nUser message: ${message}`
            }]
          }],
          systemInstruction: {
            parts: [{
              text: systemPrompt
            }]
          },
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        })
      });

      // Remove typing indicator
      const typingIndicator = document.getElementById('typingIndicator');
      if (typingIndicator) typingIndicator.remove();

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.candidates[0]?.content?.parts[0]?.text || 'No response received';

      let action = 'none';
      let task = null;
      let chatReply = aiResponse;

      try {
        const parsed = JSON.parse(aiResponse);
        action = parsed.action || 'none';
        task = parsed.task || null;
        chatReply = parsed.reply || aiResponse;
      } catch (e) {
        console.log('Gemini did not return valid JSON, falling back to raw text:', e);
      }

      if (action === 'addTask' && task && task.text) {
        const newTask = {
          id: Date.now(),
          text: task.text,
          completed: false,
          isNew: true,
          priority: task.priority || 'medium',
          createdAt: Date.now(),
          subtasks: [],
          totalElapsed: 0,
          lastStartTime: null,
          isRunning: false
        };
        
        setTasks(prevTasks => [...prevTasks, newTask]);
        
        // Remove animation class after 300ms
        setTimeout(() => {
          setTasks(prev => prev.map(t => 
            t.id === newTask.id ? { ...t, isNew: false } : t
          ));
        }, 300);
      }

      // Add AI response
      const messagesContainer = document.getElementById('chatMessages');
      const aiMessage = document.createElement('div');
      aiMessage.className = 'flex items-start space-x-3 fade-in';
      aiMessage.innerHTML = `
        <div class="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        </div>
        <div class="flex-1">
          <div class="bg-gray-100 rounded-lg p-2 max-w-xs">
            <p class="text-sm text-gray-800">${chatReply.replace(/\n/g, '<br>')}</p>
          </div>
        </div>
      `;
      messagesContainer.appendChild(aiMessage);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

    } catch (error) {
      // Remove typing indicator
      const typingIndicator = document.getElementById('typingIndicator');
      if (typingIndicator) typingIndicator.remove();

      // Show error message
      const messagesContainer = document.getElementById('chatMessages');
      const errorMessage = document.createElement('div');
      errorMessage.className = 'flex items-start space-x-3 fade-in';
      errorMessage.innerHTML = `
        <div class="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div class="flex-1">
          <div class="bg-red-50 border border-red-200 text-red-800 rounded-lg p-2 max-w-xs">
            <p class="text-sm">Error: ${error.message}</p>
          </div>
        </div>
      `;
      messagesContainer.appendChild(errorMessage);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  };

  const generateId = () => Date.now() + Math.random().toString(36).slice(2, 9);

  const addTask = () => {
    if (inputValue.trim() === '') return;
    
    const newTask = {
      id: Date.now(),
      text: inputValue,
      completed: false,
      isNew: true,
      priority: selectedPriority,
      createdAt: Date.now(),
      subtasks: [],
      totalElapsed: 0,
      lastStartTime: null,
      isRunning: false
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
    setTasks(tasks.map(task => {
      if (task.id === id) {
        const newCompleted = !task.completed;
        
        // If marking as completed, stop timer and save current time
        if (newCompleted && task.isRunning) {
          const elapsed = getElapsedTime(task);
          return {
            ...task,
            completed: newCompleted,
            isRunning: false,
            lastStartTime: null,
            totalElapsed: elapsed
          };
        }
        
        return { ...task, completed: newCompleted };
      }
      return task;
    }));
    
    // If task was running and we marked it as completed, clear active task
    const task = tasks.find(t => t.id === id);
    if (task && task.isRunning) {
      setActiveTaskId(null);
    }
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

  const toggleTaskExpansion = (taskId) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const addSubtask = (taskId) => {
    const inputText = subtaskInputs[taskId] || '';
    if (inputText.trim() === '') return;

    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            subtasks: [...task.subtasks, {
              id: generateId(),
              text: inputText.trim(),
              completed: false
            }]
          }
        : task
    ));

    setSubtaskInputs(prev => ({ ...prev, [taskId]: '' }));
  };

  const toggleSubtask = (taskId, subtaskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? {
            ...task,
            subtasks: task.subtasks.map(subtask =>
              subtask.id === subtaskId 
                ? { ...subtask, completed: !subtask.completed }
                : subtask
            )
          }
        : task
    ));
  };

  const deleteSubtask = (taskId, subtaskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? {
            ...task,
            subtasks: task.subtasks.filter(subtask => subtask.id !== subtaskId)
          }
        : task
    ));
  };

  const handleSubtaskInputChange = (taskId, value) => {
    setSubtaskInputs(prev => ({ ...prev, [taskId]: value }));
  };

  const handleSubtaskKeyPress = (e, taskId) => {
    if (e.key === 'Enter') {
      addSubtask(taskId);
    }
  };

  // Timer functions
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getElapsedTime = (task) => {
    if (!task.isRunning || !task.lastStartTime) {
      return task.totalElapsed || 0;
    }
    return task.totalElapsed + (currentTime - task.lastStartTime);
  };

  const startTimer = (taskId) => {
    // Stop any other running task
    if (activeTaskId && activeTaskId !== taskId) {
      pauseTimer(activeTaskId);
    }
    
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            isRunning: true, 
            lastStartTime: currentTime 
          }
        : task
    ));
    setActiveTaskId(taskId);
  };

  const pauseTimer = (taskId) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId && task.isRunning) {
        const elapsed = getElapsedTime(task);
        return {
          ...task,
          isRunning: false,
          lastStartTime: null,
          totalElapsed: elapsed
        };
      }
      return task;
    }));
    
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
    }
  };

  const startEditingTime = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    const elapsed = getElapsedTime(task);
    setEditingTimeId(taskId);
    setEditingTimeValue(formatTime(elapsed));
  };

  const saveTimeEdit = () => {
    if (editingTimeId && editingTimeValue) {
      editTime(editingTimeId, editingTimeValue);
    }
    setEditingTimeId(null);
    setEditingTimeValue('');
  };

  const cancelTimeEdit = () => {
    setEditingTimeId(null);
    setEditingTimeValue('');
  };

  const handleTimeEditKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveTimeEdit();
    } else if (e.key === 'Escape') {
      cancelTimeEdit();
    }
  };

  const editTime = (taskId, timeString) => {
    // Parse time string in format HH:MM:SS
    const parts = timeString.split(':');
    if (parts.length !== 3) return;
    
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseInt(parts[2]) || 0;
    
    const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
    
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        // If task is running, pause it first
        if (task.isRunning) {
          return {
            ...task,
            isRunning: false,
            lastStartTime: null,
            totalElapsed: totalMs
          };
        }
        return {
          ...task,
          totalElapsed: totalMs
        };
      }
      return task;
    }));
    
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
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
    <div className="min-h-screen p-6">
      <div className="flex gap-6 max-w-7xl mx-auto">
        {/* Gemini Chat - Left Side */}
        <div className="w-96 bg-white rounded-2xl shadow-xl flex flex-col" style={{ height: 'calc(100vh - 3rem)' }}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Gemini Chat</h2>
                  <p className="text-xs text-gray-500">AI Assistant</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  const messages = document.getElementById('chatMessages');
                  if (messages) {
                    messages.innerHTML = `
                      <div class="flex items-start space-x-3 fade-in">
                        <div class="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                          </svg>
                        </div>
                        <div class="flex-1">
                          <div class="bg-gray-100 rounded-lg p-2">
                            <p class="text-sm text-gray-800">Chat cleared. How can I help you today?</p>
                          </div>
                        </div>
                      </div>
                    `;
                  }
                }}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div id="chatMessages" className="flex-1 p-4 overflow-y-auto space-y-3">
            <div className="flex items-start space-x-3 fade-in">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <div className="flex-1">
                <div className="bg-gray-100 rounded-lg p-2">
                  <p className="text-sm text-gray-800">Hello! I'm Gemini Flash. How can I help you with your tasks today?</p>
                </div>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-end space-x-2">
              <textarea 
                id="chatInput"
                placeholder="Ask me anything..."
                className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="1"
                style={{ minHeight: '36px', maxHeight: '80px' }}
                value={chatInputValue}
                onChange={(e) => setChatInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const message = chatInputValue.trim();
                    if (message) {
                      handleSendChatMessage(message);
                    }
                  }
                  
                  // Auto-resize
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
                }}
              />
              <button
                onClick={toggleVoiceRecognition}
                className={`p-2 rounded-lg transition-all duration-200 text-sm flex items-center justify-center flex-shrink-0 ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-md shadow-red-200' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                }`}
                title={isRecording ? 'Остановить запись' : 'Голосовой ввод'}
                style={{ height: '36px', width: '36px' }}
              >
                {isRecording ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H10a1 1 0 01-1-1v-4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
              <button 
                onClick={() => {
                  const message = chatInputValue.trim();
                  if (message) {
                    handleSendChatMessage(message);
                  }
                }}
                className="px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-sm font-medium"
              >
                Send
            </button>
          </div>
          </div>
        </div>

        {/* To-Do List - Right Side */}
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <h1 className="text-3xl font-light text-gray-800 mb-8 text-center">To-Do List</h1>
            
            <div className="flex gap-2 mb-8">
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
                className="px-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white min-w-[120px]"
              >
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
              <button
                onClick={addTask}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg whitespace-nowrap"
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
                    className={`group transition-all duration-300 ${
                      task.isRemoving ? 'task-exit opacity-0 transform translate-x-4' : 
                      task.isNew ? 'task-enter' : 
                      ''
                    }`}
                  >
                    <div className={`flex items-center gap-3 p-4 bg-gray-50 rounded-lg transition-all duration-300 ${
                      !task.isRemoving && !task.isNew ? 'hover:bg-gray-100 hover:shadow-md hover:translate-x-1' : ''
                    }`}>
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
                      
                      {/* Timer display and controls */}
                      <div className="flex items-center gap-2 ml-2">
                        {editingTimeId === task.id ? (
                          <input
                            type="text"
                            value={editingTimeValue}
                            onChange={(e) => setEditingTimeValue(e.target.value)}
                            onKeyDown={handleTimeEditKeyPress}
                            onBlur={saveTimeEdit}
                            className="w-20 px-1 py-0.5 text-xs font-mono border border-purple-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                            placeholder="00:00:00"
                            autoFocus
                          />
                        ) : (
                          <span
                            className="text-xs font-mono text-gray-600 min-w-[60px] cursor-pointer hover:text-purple-600 transition-colors"
                            onClick={() => startEditingTime(task.id)}
                            title="Click to edit time"
                          >
                            {formatTime(getElapsedTime(task))}
                          </span>
                        )}
                        <div className="flex gap-1">
                          {!task.completed && !task.isRunning ? (
                            <button
                              onClick={() => startTimer(task.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Start"
                            >
                              ▶️
                            </button>
                          ) : null}
                          {task.isRunning ? (
                            <button
                              onClick={() => pauseTimer(task.id)}
                              className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                              title="Pause"
                            >
                              ⏸️
                            </button>
                          ) : null}
                        </div>
                      </div>
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
                        onClick={() => toggleTaskExpansion(task.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-all duration-200 p-1 hover:bg-gray-50 rounded"
                      >
                        <svg
                          className={`w-4 h-4 transition-transform duration-200 ${
                            expandedTasks.has(task.id) ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
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
                    
                    {/* Subtasks section */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        expandedTasks.has(task.id) ? 'max-h-96' : 'max-h-0'
                      }`}
                    >
                      <div className="pl-6 pt-3 border-t border-gray-100/50 w-full">
                        {/* Add subtask input */}
                        <div className="flex items-center gap-2 mb-3 w-full">
                          <input
                            type="text"
                            value={subtaskInputs[task.id] || ''}
                            onChange={(e) => handleSubtaskInputChange(task.id, e.target.value)}
                            onKeyDown={(e) => handleSubtaskKeyPress(e, task.id)}
                            placeholder="Add subtask..."
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                          />
                          <button
                            onClick={() => addSubtask(task.id)}
                            className="px-3 py-2 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                          >
                            +
                          </button>
                        </div>
                        
                        {/* Subtasks list */}
                        {task.subtasks.length > 0 && (
                          <div className="space-y-2">
                            {task.subtasks.map(subtask => (
                              <div
                                key={subtask.id}
                                className="group flex items-center gap-2 p-2 text-sm bg-gray-50/50 rounded hover:bg-gray-100/50 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={subtask.completed}
                                  onChange={() => toggleSubtask(task.id, subtask.id)}
                                  className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500 focus:ring-1 cursor-pointer"
                                />
                                <span
                                  className={`flex-1 text-gray-600 ${
                                    subtask.completed ? 'line-through text-gray-400' : ''
                                  }`}
                                >
                                  {subtask.text}
                                </span>
                                <button
                                  onClick={() => deleteSubtask(task.id, subtask.id)}
                                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all duration-200 p-1 hover:bg-red-50 rounded"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
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
      </div>
    </div>
  );
}

export default App;
