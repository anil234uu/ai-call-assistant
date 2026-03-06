// Local Storage Service - No Firebase needed!

const Storage = {
    // User
    getUser() {
        const user = localStorage.getItem('ai_call_user');
        return user ? JSON.parse(user) : null;
    },

    setUser(user) {
        localStorage.setItem('ai_call_user', JSON.stringify(user));
    },

    // Calls
    getCalls() {
        const calls = localStorage.getItem('ai_call_calls');
        return calls ? JSON.parse(calls) : [];
    },

    addCall(call) {
        const calls = this.getCalls();
        calls.unshift(call);
        localStorage.setItem('ai_call_calls', JSON.stringify(calls));
        return call;
    },

    updateCall(id, updates) {
        const calls = this.getCalls();
        const index = calls.findIndex(c => c.id === id);
        if (index !== -1) {
            calls[index] = { ...calls[index], ...updates };
            localStorage.setItem('ai_call_calls', JSON.stringify(calls));
        }
    },

    deleteCall(id) {
        const calls = this.getCalls().filter(c => c.id !== id);
        localStorage.setItem('ai_call_calls', JSON.stringify(calls));
    },

    // Events
    getEvents() {
        const events = localStorage.getItem('ai_call_events');
        return events ? JSON.parse(events) : [];
    },

    addEvent(event) {
        const events = this.getEvents();
        events.push(event);
        localStorage.setItem('ai_call_events', JSON.stringify(events));
        return event;
    },

    updateEvent(id, updates) {
        const events = this.getEvents();
        const index = events.findIndex(e => e.id === id);
        if (index !== -1) {
            events[index] = { ...events[index], ...updates };
            localStorage.setItem('ai_call_events', JSON.stringify(events));
        }
    },

    deleteEvent(id) {
        const events = this.getEvents().filter(e => e.id !== id);
        localStorage.setItem('ai_call_events', JSON.stringify(events));
    },

    // Tasks
    getTasks() {
        const tasks = localStorage.getItem('ai_call_tasks');
        return tasks ? JSON.parse(tasks) : [];
    },

    addTask(task) {
        const tasks = this.getTasks();
        tasks.push(task);
        localStorage.setItem('ai_call_tasks', JSON.stringify(tasks));
        return task;
    },

    updateTask(id, updates) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...updates };
            localStorage.setItem('ai_call_tasks', JSON.stringify(tasks));
        }
    },

    completeTask(id) {
        this.updateTask(id, { completed: true, completedAt: new Date().toISOString() });
    },

    // Settings
    getSettings() {
        const settings = localStorage.getItem('ai_call_settings');
        return settings ? JSON.parse(settings) : {
            aiModel: 'hf',
            hfToken: ''
        };
    },

    setSettings(settings) {
        localStorage.setItem('ai_call_settings', JSON.stringify(settings));
    },

    // Export/Import
    exportData() {
        return {
            user: this.getUser(),
            calls: this.getCalls(),
            events: this.getEvents(),
            tasks: this.getTasks(),
            settings: this.getSettings(),
            exportedAt: new Date().toISOString()
        };
    },

    importData(data) {
        if (data.user) localStorage.setItem('ai_call_user', JSON.stringify(data.user));
        if (data.calls) localStorage.setItem('ai_call_calls', JSON.stringify(data.calls));
        if (data.events) localStorage.setItem('ai_call_events', JSON.stringify(data.events));
        if (data.tasks) localStorage.setItem('ai_call_tasks', JSON.stringify(data.tasks));
        if (data.settings) localStorage.setItem('ai_call_settings', JSON.stringify(data.settings));
    },

    clearAll() {
        localStorage.removeItem('ai_call_user');
        localStorage.removeItem('ai_call_calls');
        localStorage.removeItem('ai_call_events');
        localStorage.removeItem('ai_call_tasks');
        localStorage.removeItem('ai_call_settings');
    },

    // Helpers
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    getTodaysTasks() {
        const today = new Date().toDateString();
        return this.getTasks().filter(task => {
            if (task.completed) return false;
            if (!task.dueDate) return false;
            return new Date(task.dueDate).toDateString() === today;
        });
    },

    getUpcomingEvents(limit = 5) {
        const now = new Date();
        return this.getEvents()
            .filter(e => new Date(e.startTime) >= now)
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
            .slice(0, limit);
    },

    getRecentCalls(limit = 5) {
        return this.getCalls().slice(0, limit);
    }
};
