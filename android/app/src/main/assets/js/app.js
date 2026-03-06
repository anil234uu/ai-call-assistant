// Main App Logic

const App = {
    currentUser: null,
    mediaRecorder: null,
    audioChunks: [],
    recordingTimer: null,
    recordingSeconds: 0,
    currentCallId: null,
    currentTranscript: '',
    currentSummary: null,
    currentEvents: [],

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.updateDateDisplay();
    },

    checkAuth() {
        const user = Storage.getUser();
        if (user) {
            this.currentUser = user;
            this.showMainScreen();
        } else {
            this.showLoginScreen();
        }
    },

    showLoginScreen() {
        document.getElementById('login-screen').classList.add('active');
        document.getElementById('main-screen').classList.remove('active');
    },

    showMainScreen() {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('main-screen').classList.add('active');
        document.getElementById('user-name').textContent = this.currentUser.name;
        this.loadDashboard();
    },

    setupEventListeners() {
        // Login
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('username').value;
            this.login(name);
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                this.navigateTo(item.dataset.page);
            });
        });

        // Record button
        document.getElementById('record-btn').addEventListener('click', () => {
            this.startRecording();
        });

        // Recording controls
        document.getElementById('cancel-recording').addEventListener('click', () => {
            this.cancelRecording();
        });

        document.getElementById('stop-recording').addEventListener('click', () => {
            this.stopRecording();
        });

        // Modal close buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });

        // View events button
        document.getElementById('view-events-btn').addEventListener('click', () => {
            document.getElementById('summary-modal').classList.remove('active');
            this.showEventsModal();
        });

        // Add all events
        document.getElementById('add-all-events').addEventListener('click', () => {
            this.addAllEvents();
        });

        // Settings
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettings();
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Calendar navigation
        document.getElementById('prev-month').addEventListener('click', () => {
            this.changeMonth(-1);
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.changeMonth(1);
        });

        // Settings actions
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('clear-data').addEventListener('click', () => {
            this.clearAllData();
        });

        document.getElementById('ai-model').addEventListener('change', (e) => {
            const settings = Storage.getSettings();
            settings.aiModel = e.target.value;
            Storage.setSettings(settings);
        });

        document.getElementById('hf-token').addEventListener('change', (e) => {
            const settings = Storage.getSettings();
            settings.hfToken = e.target.value;
            Storage.setSettings(settings);
        });

        // Search
        document.getElementById('search-calls').addEventListener('input', (e) => {
            this.searchCalls(e.target.value);
        });
    },

    login(name) {
        const user = { name, id: Storage.generateId() };
        Storage.setUser(user);
        this.currentUser = user;
        this.showMainScreen();
    },

    logout() {
        this.currentUser = null;
        Storage.setUser(null);
        this.showLoginScreen();
    },

    navigateTo(page) {
        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Update pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        document.getElementById(`${page}-page`).classList.add('active');

        // Load page data
        if (page === 'dashboard') this.loadDashboard();
        if (page === 'calendar') this.loadCalendar();
        if (page === 'history') this.loadHistory();
    },

    updateDateDisplay() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', options);
    },

    loadDashboard() {
        // Load tasks
        const tasks = Storage.getTodaysTasks();
        const tasksList = document.getElementById('tasks-list');
        if (tasks.length > 0) {
            tasksList.innerHTML = tasks.map(task => `
                <div class="card task-card">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                           onchange="App.completeTask('${task.id}')">
                    <span>${task.title}</span>
                </div>
            `).join('');
        }

        // Load events
        const events = Storage.getUpcomingEvents(3);
        const eventsList = document.getElementById('events-list');
        if (events.length > 0) {
            eventsList.innerHTML = events.map(event => `
                <div class="card event-card">
                    <div class="event-type">
                        <i class="fas fa-${event.type === 'meeting' ? 'users' : event.type === 'call' ? 'phone' : 'flag'}"></i>
                        ${event.type}
                    </div>
                    <h4>${event.title}</h4>
                    <p>${new Date(event.startTime).toLocaleString()}</p>
                </div>
            `).join('');
        }

        // Load recent calls
        const calls = Storage.getRecentCalls(3);
        const callsList = document.getElementById('calls-list');
        if (calls.length > 0) {
            callsList.innerHTML = calls.map(call => `
                <div class="card call-card" onclick="App.viewCall('${call.id}')">
                    <div class="call-icon">
                        <i class="fas fa-phone"></i>
                    </div>
                    <div class="call-info">
                        <h4>Call recorded</h4>
                        <p>${new Date(call.callTime).toLocaleString()}</p>
                        ${call.summary ? `<p>${call.summary.summary.substring(0, 60)}...</p>` : ''}
                    </div>
                </div>
            `).join('');
        }
    },

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (e) => {
                this.audioChunks.push(e.data);
            };

            this.mediaRecorder.start();
            this.showRecordingModal();
            this.startRecordingTimer();
        } catch (err) {
            alert('Please allow microphone access to record voice notes.');
        }
    },

    showRecordingModal() {
        document.getElementById('recording-modal').classList.add('active');
        this.recordingSeconds = 0;
        this.updateRecordingTimer();
    },

    startRecordingTimer() {
        this.recordingTimer = setInterval(() => {
            this.recordingSeconds++;
            this.updateRecordingTimer();
        }, 1000);
    },

    updateRecordingTimer() {
        const mins = Math.floor(this.recordingSeconds / 60).toString().padStart(2, '0');
        const secs = (this.recordingSeconds % 60).toString().padStart(2, '0');
        document.querySelector('.recording-timer').textContent = `${mins}:${secs}`;
    },

    cancelRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        clearInterval(this.recordingTimer);
        document.getElementById('recording-modal').classList.remove('active');
    },

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        clearInterval(this.recordingTimer);
        document.getElementById('recording-modal').classList.remove('active');

        this.mediaRecorder.onstop = () => {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            this.processRecording(audioBlob);
        };
    },

    async processRecording(audioBlob) {
        this.showProcessingModal();
        
        this.currentCallId = Storage.generateId();

        try {
            // Step 1: Transcribe
            document.getElementById('processing-status').textContent = 'Transcribing audio...';
            this.currentTranscript = await AIService.transcribeAudio(audioBlob);

            // Step 2: Generate summary
            document.getElementById('processing-status').textContent = 'Generating AI summary...';
            this.currentSummary = await AIService.generateSummary(this.currentTranscript);

            // Step 3: Extract events
            document.getElementById('processing-status').textContent = 'Extracting calendar events...';
            this.currentEvents = await AIService.extractEvents(this.currentTranscript, this.currentCallId);

            // Save call
            const call = {
                id: this.currentCallId,
                phoneNumber: 'Manual Entry',
                callTime: new Date().toISOString(),
                transcript: this.currentTranscript,
                summary: this.currentSummary,
                events: this.currentEvents,
                createdAt: new Date().toISOString()
            };
            Storage.addCall(call);

            // Save tasks from action items
            this.currentSummary.actionItems.forEach(item => {
                Storage.addTask({
                    id: Storage.generateId(),
                    callLogId: this.currentCallId,
                    title: item.task,
                    completed: item.completed,
                    dueDate: item.deadline,
                    createdAt: new Date().toISOString()
                });
            });

            document.getElementById('processing-modal').classList.remove('active');
            this.showSummaryModal();

        } catch (error) {
            console.error('Processing error:', error);
            document.getElementById('processing-modal').classList.remove('active');
            alert('Error processing recording. Please try again.');
        }
    },

    showProcessingModal() {
        document.getElementById('processing-modal').classList.add('active');
    },

    showSummaryModal() {
        const modal = document.getElementById('summary-modal');
        
        // Summary text
        document.getElementById('summary-text').textContent = this.currentSummary.summary;
        
        // Sentiment badge
        const sentimentBadge = document.getElementById('sentiment-badge');
        sentimentBadge.textContent = this.currentSummary.sentiment.toUpperCase();
        sentimentBadge.className = `sentiment-badge sentiment-${this.currentSummary.sentiment}`;
        
        // Key points
        const keyPointsHtml = this.currentSummary.keyPoints.map(point => 
            `<li>${point}</li>`
        ).join('');
        document.getElementById('key-points').innerHTML = `<h4><i class="fas fa-key"></i> Key Points</h4><ul>${keyPointsHtml}</ul>`;
        
        // Action items
        const actionItemsHtml = this.currentSummary.actionItems.map((item, index) => `
            <div class="action-item">
                <input type="checkbox" id="task-${index}" ${item.completed ? 'checked' : ''}>
                <label for="task-${index}">${item.task}</label>
                ${item.deadline ? `<span class="badge badge-warning">Due: ${item.deadline}</span>` : ''}
            </div>
        `).join('');
        document.getElementById('action-items').innerHTML = `<h4><i class="fas fa-tasks"></i> Action Items</h4>${actionItemsHtml}`;
        
        // Transcript
        document.getElementById('transcript-text').textContent = this.currentTranscript;
        
        modal.classList.add('active');
    },

    showEventsModal() {
        const modal = document.getElementById('events-modal');
        const container = document.getElementById('detected-events');
        
        if (this.currentEvents.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <p>No calendar events detected</p>
                </div>
            `;
        } else {
            container.innerHTML = this.currentEvents.map(event => `
                <div class="event-card" data-event-id="${event.id}">
                    <div class="event-card-header">
                        <span class="event-type">
                            <i class="fas fa-${event.type === 'meeting' ? 'users' : event.type === 'call' ? 'phone' : 'flag'}"></i>
                            ${event.type}
                        </span>
                        <span class="confidence-badge" style="background: ${event.confidenceScore > 0.8 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)'}; color: ${event.confidenceScore > 0.8 ? '#4CAF50' : '#FF9800'}">
                            ${Math.round(event.confidenceScore * 100)}% confidence
                        </span>
                    </div>
                    <h4>${event.title}</h4>
                    <div class="event-details">
                        <div class="event-detail">
                            <i class="fas fa-calendar"></i>
                            ${new Date(event.startTime).toLocaleDateString()}
                        </div>
                        <div class="event-detail">
                            <i class="fas fa-clock"></i>
                            ${new Date(event.startTime).toLocaleTimeString()} - ${new Date(event.endTime).toLocaleTimeString()}
                        </div>
                        ${event.location ? `
                            <div class="event-detail">
                                <i class="fas fa-location-arrow"></i>
                                ${event.location}
                            </div>
                        ` : ''}
                    </div>
                    <div class="event-actions">
                        <button class="btn-secondary" onclick="App.skipEvent('${event.id}')">
                            <i class="fas fa-times"></i> Skip
                        </button>
                        <button class="btn-primary" onclick="App.addEvent('${event.id}')">
                            <i class="fas fa-plus"></i> Add
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        modal.classList.add('active');
    },

    addEvent(eventId) {
        const event = this.currentEvents.find(e => e.id === eventId);
        if (event) {
            event.userConfirmed = true;
            Storage.addEvent(event);
            
            // Remove from modal
            const card = document.querySelector(`[data-event-id="${eventId}"]`);
            if (card) {
                card.style.opacity = '0.5';
                card.querySelector('.event-actions').innerHTML = '<span class="badge badge-success"><i class="fas fa-check"></i> Added</span>';
            }
        }
    },

    skipEvent(eventId) {
        const card = document.querySelector(`[data-event-id="${eventId}"]`);
        if (card) {
            card.remove();
        }
    },

    addAllEvents() {
        this.currentEvents.forEach(event => {
            event.userConfirmed = true;
            Storage.addEvent(event);
        });
        document.getElementById('events-modal').classList.remove('active');
        this.loadDashboard();
    },

    completeTask(taskId) {
        Storage.completeTask(taskId);
        this.loadDashboard();
    },

    viewCall(callId) {
        const call = Storage.getCalls().find(c => c.id === callId);
        if (call) {
            this.currentCallId = call.id;
            this.currentTranscript = call.transcript;
            this.currentSummary = call.summary;
            this.currentEvents = call.events || [];
            this.showSummaryModal();
        }
    },

    loadCalendar() {
        this.currentCalendarDate = this.currentCalendarDate || new Date();
        this.renderCalendar();
    },

    renderCalendar() {
        const year = this.currentCalendarDate.getFullYear();
        const month = this.currentCalendarDate.getMonth();
        
        document.getElementById('calendar-month').textContent = 
            new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const events = Storage.getEvents();
        
        let html = '';
        
        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="day other-month"></div>';
        }
        
        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = date.toDateString() === new Date().toDateString();
            const hasEvent = events.some(e => new Date(e.startTime).toDateString() === date.toDateString());
            
            html += `<div class="day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}" data-date="${date.toISOString()}">${day}</div>`;
        }
        
        document.getElementById('calendar-days').innerHTML = html;
        
        // Add click handlers
        document.querySelectorAll('.day[data-date]').forEach(day => {
            day.addEventListener('click', () => {
                this.showDateEvents(new Date(day.dataset.date));
            });
        });
    },

    changeMonth(delta) {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + delta);
        this.renderCalendar();
    },

    showDateEvents(date) {
        const events = Storage.getEvents().filter(e => 
            new Date(e.startTime).toDateString() === date.toDateString()
        );
        
        const container = document.getElementById('selected-date-events');
        if (events.length > 0) {
            container.innerHTML = events.map(event => `
                <div class="card">
                    <h4>${event.title}</h4>
                    <p>${new Date(event.startTime).toLocaleTimeString()}</p>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>No events for this date</p>';
        }
    },

    loadHistory() {
        const calls = Storage.getCalls();
        const container = document.getElementById('history-list');
        
        if (calls.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-phone-slash"></i>
                    <p>No calls recorded yet</p>
                </div>
            `;
        } else {
            container.innerHTML = calls.map(call => `
                <div class="card call-card" onclick="App.viewCall('${call.id}')">
                    <div class="call-icon">
                        <i class="fas fa-phone"></i>
                    </div>
                    <div class="call-info">
                        <h4>Call on ${new Date(call.callTime).toLocaleDateString()}</h4>
                        <p>${new Date(call.callTime).toLocaleTimeString()}</p>
                        ${call.summary ? `<p>${call.summary.summary.substring(0, 100)}...</p>` : ''}
                    </div>
                    ${call.events?.length ? `<span class="badge badge-success">${call.events.length} events</span>` : ''}
                </div>
            `).join('');
        }
    },

    searchCalls(query) {
        const calls = Storage.getCalls().filter(call => 
            call.transcript?.toLowerCase().includes(query.toLowerCase()) ||
            call.summary?.summary.toLowerCase().includes(query.toLowerCase())
        );
        
        const container = document.getElementById('history-list');
        container.innerHTML = calls.map(call => `
            <div class="card call-card" onclick="App.viewCall('${call.id}')">
                <div class="call-icon">
                    <i class="fas fa-phone"></i>
                </div>
                <div class="call-info">
                    <h4>Call on ${new Date(call.callTime).toLocaleDateString()}</h4>
                    <p>${call.summary?.summary.substring(0, 100)}...</p>
                </div>
            </div>
        `).join('');
    },

    showSettings() {
        const settings = Storage.getSettings();
        document.getElementById('ai-model').value = settings.aiModel;
        document.getElementById('hf-token').value = settings.hfToken;
        document.getElementById('settings-modal').classList.add('active');
    },

    exportData() {
        const data = Storage.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-call-assistant-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    clearAllData() {
        if (confirm('Are you sure? This will delete ALL your data permanently.')) {
            Storage.clearAll();
            this.logout();
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
