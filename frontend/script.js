document.addEventListener('DOMContentLoaded', () => {

    // --- Navigation Routing ---
    const landingPage = document.getElementById('landing-page');
    const dashboardPage = document.getElementById('dashboard-page');
    const goToDashboardBtns = document.querySelectorAll('.go-to-dashboard');
    const backToHomeBtn = document.getElementById('back-to-home');

    // Switch to Dashboard
    goToDashboardBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            landingPage.style.opacity = '0';
            landingPage.style.transition = 'opacity 0.4s ease';
            
            setTimeout(() => {
                landingPage.classList.add('hidden');
                dashboardPage.classList.remove('hidden');
                dashboardPage.style.opacity = '0';
                setTimeout(() => {
                    dashboardPage.style.transition = 'opacity 0.4s ease';
                    dashboardPage.style.opacity = '1';
                }, 50);
                window.scrollTo(0, 0);
            }, 400);
        });
    });

    // Go Back to Home
    backToHomeBtn.addEventListener('click', () => {
        dashboardPage.style.opacity = '0';
        setTimeout(() => {
            dashboardPage.classList.add('hidden');
            landingPage.classList.remove('hidden');
            landingPage.style.opacity = '1';
            window.scrollTo(0, 0);
        }, 400);
    });

    // --- State & Local Storage Initialization ---
    let tasks = JSON.parse(localStorage.getItem('studySphere_tasks')) || [];
    let notes = JSON.parse(localStorage.getItem('studySphere_notes')) || [];
    let focusMinutes = parseInt(localStorage.getItem('studySphere_focus')) || 0;

    // --- Time, Date & Greetings ---
    function updateDateAndGreeting() {
        const now = new Date();
        const dateOptions = { weekday: 'long', month: 'short', day: 'numeric' };
        document.getElementById('date-display').textContent = now.toLocaleDateString('en-US', dateOptions);

        const hour = now.getHours();
        let greeting = 'Good Evening';
        if (hour < 12) greeting = 'Good Morning';
        else if (hour < 18) greeting = 'Good Afternoon';
        
        document.getElementById('greeting-msg').textContent = `👋 ${greeting}!`;
    }
    updateDateAndGreeting();

    // --- Task Management ---
    const taskInput = document.getElementById('new-task-input');
    const taskList = document.getElementById('task-list');
    
    function saveTasks() {
        localStorage.setItem('studySphere_tasks', JSON.stringify(tasks));
        updateStats();
    }

    function renderTasks() {
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

    document.getElementById('add-task-btn').addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });

    function addTask() {
        const text = taskInput.value.trim();
        if (text) {
            tasks.push({ text, completed: false });
            taskInput.value = '';
            saveTasks();
            renderTasks();
        }
    }

    window.toggleTask = function(index) {
        tasks[index].completed = !tasks[index].completed;
        saveTasks();
        renderTasks();
    }

    window.deleteTask = function(index) {
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
    }

    // --- Notes Management ---
    const noteTitle = document.getElementById('note-title');
    const noteContent = document.getElementById('note-content');
    const notesContainer = document.getElementById('notes-container');

    function saveNotes() {
        localStorage.setItem('studySphere_notes', JSON.stringify(notes));
    }

    function renderNotes() {
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

    document.getElementById('add-note-btn').addEventListener('click', () => {
        const title = noteTitle.value.trim();
        const content = noteContent.value.trim();
        if (content) {
            notes.unshift({ title, content }); 
            noteTitle.value = '';
            noteContent.value = '';
            saveNotes();
            renderNotes();
        }
    });

    window.deleteNote = function(index) {
        notes.splice(index, 1);
        saveNotes();
        renderNotes();
    }

    // --- Dashboard Stats ---
    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

        document.getElementById('stat-tasks').textContent = completed;
        document.getElementById('stat-total-tasks').textContent = total;
        document.getElementById('main-progress-bar').style.width = `${percentage}%`;
        document.getElementById('main-progress-text').textContent = `${percentage}%`;
        document.getElementById('stat-focus').textContent = `${focusMinutes}m`;
    }

    // --- Pomodoro Timer ---
    let timerInterval;
    let currentMode = 25; 
    let timeLeft = currentMode * 60;
    let isRunning = false;

    const timerDisplay = document.getElementById('timer');
    const modeBtns = document.querySelectorAll('.mode-btn');

    function updateTimerDisplay() {
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${m}:${s}`;
        
        // Update document title only if on dashboard page
        if(!document.getElementById('dashboard-page').classList.contains('hidden')){
            document.title = `${m}:${s} - Focus Mode`;
        } else {
            document.title = "StudySphere - Your Hub";
        }
    }

    modeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (isRunning) return; 
            modeBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentMode = parseInt(e.target.getAttribute('data-time'));
            timeLeft = currentMode * 60;
            updateTimerDisplay();
        });
    });

    document.getElementById('start-timer').addEventListener('click', () => {
        if (!isRunning) {
            isRunning = true;
            timerInterval = setInterval(() => {
                if (timeLeft > 0) {
                    timeLeft--;
                    updateTimerDisplay();
                } else {
                    clearInterval(timerInterval);
                    isRunning = false;
                    
                    if (currentMode === 25) {
                        focusMinutes += 25;
                        localStorage.setItem('studySphere_focus', focusMinutes);
                        updateStats();
                        alert("Focus session complete! Great job. Take a short break.");
                    } else {
                        alert("Break is over! Ready to focus again?");
                    }
                    timeLeft = currentMode * 60;
                    updateTimerDisplay();
                }
            }, 1000);
        }
    });

    document.getElementById('pause-timer').addEventListener('click', () => {
        clearInterval(timerInterval);
        isRunning = false;
    });

    document.getElementById('reset-timer').addEventListener('click', () => {
        clearInterval(timerInterval);
        isRunning = false;
        timeLeft = currentMode * 60;
        updateTimerDisplay();
    });

    // --- Dynamic Quotes ---
    const quotes = [
        { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
        { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
        { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
        { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
        { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
        { text: "There are no shortcuts to any place worth going.", author: "Beverly Sills" }
    ];

    function updateQuote() {
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        document.getElementById('quote-text').textContent = `"${randomQuote.text}"`;
        document.getElementById('quote-author').textContent = `- ${randomQuote.author}`;
    }
    
    document.getElementById('refresh-quote').addEventListener('click', () => {
        const icon = document.getElementById('refresh-quote');
        icon.style.transform = 'rotate(180deg)';
        setTimeout(() => icon.style.transform = 'none', 300);
        updateQuote();
    });

    // --- Initialization Calls ---
    renderTasks();
    renderNotes();
    updateTimerDisplay();
    updateQuote();
});