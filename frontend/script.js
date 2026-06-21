// --- GLOBAL ROUTING ---
window.switchView = function(viewId) {
    const activeView = document.querySelector('.view.active');
    const targetView = document.getElementById(viewId);
    
    if (!targetView || activeView === targetView) return;

    if (activeView) {
        activeView.style.opacity = '0';
        setTimeout(() => {
            activeView.classList.remove('active');
            activeView.classList.add('hidden');
            
            targetView.classList.remove('hidden');
            targetView.classList.add('active');
            
            setTimeout(() => {
                targetView.style.opacity = '1';
                window.scrollTo(0, 0);
            }, 50);
        }, 300);
    }

    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.getAttribute('data-view') === viewId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    if(viewId === 'dashboard-page') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#3B82F6', '#8B5CF6', '#06B6D4'] });
    }
};

document.addEventListener('DOMContentLoaded', () => {

    function initWorkspace() {
        const dateEl = document.getElementById('mockup-date');
        if(dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

        const hour = new Date().getHours();
        let greeting = 'Good Evening';
        if (hour < 12) greeting = 'Good Morning';
        else if (hour < 18) greeting = 'Good Afternoon';
        
        const msg = document.getElementById('greeting-msg');
        if(msg) msg.textContent = `👋 ${greeting}!`;
        
        renderTasks();
        renderNotes();
        renderChart();
        updateTimerDisplay();
    }

    // ==========================================
    // 1. TASK MANAGER
    // ==========================================
    let tasks = JSON.parse(localStorage.getItem('studySphere_tasks')) || [];
    const taskInput = document.getElementById('new-task-input');
    const taskList = document.getElementById('task-list');

    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

        const tDone = document.getElementById('stat-tasks');
        const tTotal = document.getElementById('stat-total-tasks');
        const pBar = document.getElementById('main-progress-bar');
        const pText = document.getElementById('main-progress-text');
        
        if(tDone) tDone.textContent = completed;
        if(tTotal) tTotal.textContent = total;
        if(pBar) pBar.style.width = `${percentage}%`;
        if(pText) pText.textContent = `${percentage}%`;
        
        const fStat = document.getElementById('stat-focus');
        if(fStat) fStat.textContent = `${parseInt(localStorage.getItem('studySphere_focus')) || 0}m`;
    }

    function renderTasks() {
        if(!taskList) return;
        taskList.innerHTML = '';
        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            if (task.completed) li.classList.add('task-completed');
            li.innerHTML = `
                <div class="task-left" onclick="toggleTask(${index})">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} onclick="event.stopPropagation(); toggleTask(${index})">
                    <span class="task-text">${task.text}</span>
                </div>
                <button class="delete-btn" onclick="deleteTask(${index})"><i class="fa-solid fa-trash"></i></button>
            `;
            taskList.appendChild(li);
        });
        updateStats();
    }

    const addTaskBtn = document.getElementById('add-task-btn');
    if(addTaskBtn) {
        addTaskBtn.addEventListener('click', addTask);
        taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
    }

    function addTask() {
        const text = taskInput.value.trim();
        if (text) {
            tasks.push({ text, completed: false });
            localStorage.setItem('studySphere_tasks', JSON.stringify(tasks));
            taskInput.value = '';
            renderTasks();
        }
    }

    window.toggleTask = function(index) {
        tasks[index].completed = !tasks[index].completed;
        localStorage.setItem('studySphere_tasks', JSON.stringify(tasks));
        renderTasks();
    };

    window.deleteTask = function(index) {
        tasks.splice(index, 1);
        localStorage.setItem('studySphere_tasks', JSON.stringify(tasks));
        renderTasks();
    };

    // ==========================================
    // 2. QUICK NOTES
    // ==========================================
    let notes = JSON.parse(localStorage.getItem('studySphere_notes')) || [];
    const notesContainer = document.getElementById('notes-container');

    function renderNotes() {
        if(!notesContainer) return;
        notesContainer.innerHTML = '';
        notes.forEach((note, index) => {
            const div = document.createElement('div');
            div.className = 'note-item';
            div.innerHTML = `
                <h4>${note.title || 'Untitled Note'}</h4>
                <p>${note.content}</p>
                <button class="delete-note" onclick="deleteNote(${index})"><i class="fa-solid fa-xmark"></i></button>
            `;
            notesContainer.appendChild(div);
        });
    }

    const addNoteBtn = document.getElementById('add-note-btn');
    if(addNoteBtn) {
        addNoteBtn.addEventListener('click', () => {
            const title = document.getElementById('note-title').value.trim();
            const content = document.getElementById('note-content').value.trim();
            if (content) {
                notes.unshift({ title, content }); 
                localStorage.setItem('studySphere_notes', JSON.stringify(notes));
                document.getElementById('note-title').value = '';
                document.getElementById('note-content').value = '';
                renderNotes();
            }
        });
    }

    window.deleteNote = function(index) {
        notes.splice(index, 1);
        localStorage.setItem('studySphere_notes', JSON.stringify(notes));
        renderNotes();
    };

    // ==========================================
    // 3. LIVE FOCUS TRACKER & POMODORO
    // ==========================================
    let weeklyStudyData = JSON.parse(localStorage.getItem('studySphere_weekly')) || [0, 0, 0, 0, 0, 0, 0];
    
    function renderChart() {
        const chartArea = document.getElementById('study-chart');
        if (!chartArea) return;
        chartArea.innerHTML = '';
        const MAX_MINUTES = 480;

        weeklyStudyData.forEach(minutes => {
            const heightPercent = Math.min((minutes / MAX_MINUTES) * 100, 100);
            const hours = (minutes / 60).toFixed(1);
            const barContainer = document.createElement('div');
            barContainer.className = 'bar-container';
            barContainer.innerHTML = `<div class="bar" style="height: ${heightPercent}%" title="${hours} hrs"></div>`;
            chartArea.appendChild(barContainer);
        });
    }

    let timerInterval;
    let currentMode = 25; 
    let timeLeft = currentMode * 60;
    let isRunning = false;
    let focusMinutes = parseInt(localStorage.getItem('studySphere_focus')) || 0;
    let sessionElapsedSeconds = 0; 

    const timerDisplay = document.getElementById('timer');
    const modeBtns = document.querySelectorAll('.mode-btn');

    function updateTimerDisplay() {
        if(!timerDisplay) return;
        const min = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const sec = (timeLeft % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${min}:${sec}`;
    }

    modeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (isRunning) return; 
            modeBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentMode = parseInt(e.target.getAttribute('data-time'));
            timeLeft = currentMode * 60;
            sessionElapsedSeconds = 0;
            updateTimerDisplay();
        });
    });

    const startTimerBtn = document.getElementById('start-timer');
    if(startTimerBtn) {
        startTimerBtn.addEventListener('click', () => {
            if (!isRunning) {
                isRunning = true;
                timerInterval = setInterval(() => {
                    if (timeLeft > 0) {
                        timeLeft--;
                        
                        // LIVE UPDATE GRAPH: Every 60 seconds, add a minute to the graph
                        if (currentMode === 25) {
                            sessionElapsedSeconds++;
                            if (sessionElapsedSeconds >= 60) {
                                focusMinutes += 1;
                                localStorage.setItem('studySphere_focus', focusMinutes);
                                
                                const dayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; 
                                weeklyStudyData[dayIndex] += 1;
                                localStorage.setItem('studySphere_weekly', JSON.stringify(weeklyStudyData));
                                
                                sessionElapsedSeconds = 0;
                                updateStats();
                                renderChart();
                            }
                        }

                        updateTimerDisplay();
                    } else {
                        clearInterval(timerInterval);
                        isRunning = false;
                        sessionElapsedSeconds = 0;
                        
                        if (currentMode === 25) {
                            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }});
                            alert("Focus session complete! Take a break.");
                        } else {
                            alert("Break is over! Time to focus.");
                        }
                        timeLeft = currentMode * 60;
                        updateTimerDisplay();
                    }
                }, 1000);
            }
        });
    }

    const pauseTimerBtn = document.getElementById('pause-timer');
    if(pauseTimerBtn) pauseTimerBtn.addEventListener('click', () => { 
        clearInterval(timerInterval); 
        isRunning = false; 
    });
    
    const resetTimerBtn = document.getElementById('reset-timer');
    if(resetTimerBtn) {
        resetTimerBtn.addEventListener('click', () => {
            clearInterval(timerInterval);
            isRunning = false;
            timeLeft = currentMode * 60;
            sessionElapsedSeconds = 0; 
            updateTimerDisplay();
        });
    }

    // ==========================================
    // 4. DAILY MOTIVATION
    // ==========================================
    const refreshQuoteBtn = document.getElementById('refresh-quote');
    if(refreshQuoteBtn) {
        const quotes = [
            { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
            { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
            { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
            { text: "Success is the sum of small efforts, repeated day-in and day-out.", author: "Robert Collier" }
        ];
        refreshQuoteBtn.addEventListener('click', () => {
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            document.getElementById('quote-text').textContent = `"${randomQuote.text}"`;
            document.getElementById('quote-author').textContent = `- ${randomQuote.author}`;
        });
    }

    initWorkspace();
});