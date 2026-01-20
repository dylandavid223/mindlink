// js/dashboard.js
// Dashboard JavaScript File

class Dashboard {
    constructor() {
        this.moodData = [];
        this.journalEntries = [];
        this.currentMood = 3; // Default: neutral
        
        this.init();
    }
    
    init() {
        this.checkAuth();
        this.loadUserData();
        this.setupEventListeners();
        this.initMoodChart();
        this.updateWelcomeMessage();
        this.loadMoodData();
        this.setupMoodTracking();
        this.setupJournal();
        this.setupEmergencyButton();
    }
    
    checkAuth() {
        const token = localStorage.getItem('mindlink_token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        
        // Check session expiry
        const expiry = localStorage.getItem('mindlink_expiry');
        if (expiry && Date.now() > parseInt(expiry)) {
            window.location.href = 'login.html?session=expired';
            return;
        }
    }
    
    loadUserData() {
        const userData = JSON.parse(localStorage.getItem('mindlink_user') || '{}');
        
        // Update UI with user data
        const userNameElements = document.querySelectorAll('#userName, #welcomeName');
        userNameElements.forEach(el => {
            if (el && userData.name) {
                el.textContent = userData.name;
            }
        });
        
        const userRoleElement = document.getElementById('userRole');
        if (userRoleElement && userData.role) {
            userRoleElement.textContent = this.formatRole(userData.role);
        }
    }
    
    formatRole(role) {
        const roles = {
            'user': 'User',
            'counselor': 'Counselor',
            'admin': 'Administrator',
            'super_admin': 'Super Administrator'
        };
        return roles[role] || role;
    }
    
    setupEventListeners() {
        // Mood emoji buttons
        const moodEmojis = document.querySelectorAll('.mood-emoji');
        moodEmojis.forEach(emoji => {
            emoji.addEventListener('click', (e) => {
                const moodValue = parseInt(e.target.getAttribute('data-mood'));
                this.setCurrentMood(moodValue);
            });
        });
        
        // Journal buttons
        const journalButtons = document.querySelectorAll('[onclick*="openJournal"], [onclick*="saveJournalEntry"]');
        journalButtons.forEach(button => {
            const onclick = button.getAttribute('onclick');
            button.removeAttribute('onclick');
            button.addEventListener('click', () => {
                if (onclick.includes('openJournal')) this.openJournal();
                if (onclick.includes('saveJournalEntry')) this.saveJournalEntry();
            });
        });
        
        // Quick help button
        const helpButton = document.querySelector('.btn-help');
        if (helpButton) {
            helpButton.addEventListener('click', () => {
                this.showQuickHelp();
            });
        }
        
        // Notification button
        const notificationButton = document.querySelector('.btn-notification');
        if (notificationButton) {
            notificationButton.addEventListener('click', () => {
                this.showNotifications();
            });
        }
    }
    
    setupMoodTracking() {
        // Load saved mood data from localStorage
        const savedMoodData = localStorage.getItem('mindlink_mood_data');
        if (savedMoodData) {
            this.moodData = JSON.parse(savedMoodData);
        } else {
            // Generate sample data for the past 7 days
            const today = new Date();
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                
                this.moodData.push({
                    date: date.toISOString().split('T')[0],
                    mood: Math.floor(Math.random() * 5) + 1,
                    note: ''
                });
            }
            this.saveMoodData();
        }
        
        // Update current mood from today's data
        const today = new Date().toISOString().split('T')[0];
        const todayMood = this.moodData.find(entry => entry.date === today);
        if (todayMood) {
            this.currentMood = todayMood.mood;
            this.updateMoodEmojis();
        }
    }
    
    setCurrentMood(moodValue) {
        this.currentMood = moodValue;
        
        // Update UI
        this.updateMoodEmojis();
        
        // Save to today's mood data
        const today = new Date().toISOString().split('T')[0];
        let todayEntry = this.moodData.find(entry => entry.date === today);
        
        if (todayEntry) {
            todayEntry.mood = moodValue;
        } else {
            todayEntry = {
                date: today,
                mood: moodValue,
                note: ''
            };
            this.moodData.push(todayEntry);
        }
        
        this.saveMoodData();
        this.updateMoodChart();
        
        // Show confirmation
        showNotification(`Mood recorded: ${this.getMoodText(moodValue)}`, 'success');
    }
    
    updateMoodEmojis() {
        const moodEmojis = document.querySelectorAll('.mood-emoji');
        moodEmojis.forEach(emoji => {
            const moodValue = parseInt(emoji.getAttribute('data-mood'));
            emoji.classList.toggle('active', moodValue === this.currentMood);
        });
    }
    
    getMoodText(moodValue) {
        const moods = {
            1: '😢 Terrible',
            2: '😔 Bad',
            3: '😐 Okay',
            4: '🙂 Good',
            5: '😊 Great'
        };
        return moods[moodValue] || 'Unknown';
    }
    
    saveMoodData() {
        localStorage.setItem('mindlink_mood_data', JSON.stringify(this.moodData));
    }
    
    setupJournal() {
        // Load journal entries
        const savedEntries = localStorage.getItem('mindlink_journal_entries');
        if (savedEntries) {
            this.journalEntries = JSON.parse(savedEntries);
        }
        
        // Set current date in modal
        const currentDateElement = document.getElementById('currentDate');
        if (currentDateElement) {
            currentDateElement.textContent = new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }
    
    openJournal() {
        const modal = document.getElementById('journalModal');
        if (modal) {
            modal.classList.add('active');
            
            // Set today's mood if available
            const today = new Date().toISOString().split('T')[0];
            const todayMood = this.moodData.find(entry => entry.date === today);
            if (todayMood) {
                const moodOptions = modal.querySelectorAll('.mood-option');
                moodOptions.forEach(option => {
                    const moodValue = option.getAttribute('data-mood');
                    option.classList.toggle('active', 
                        this.getMoodText(todayMood.mood).includes(moodValue));
                });
            }
            
            // Load today's journal entry if exists
            const todayEntry = this.journalEntries.find(entry => entry.date === today);
            const textarea = modal.querySelector('.journal-textarea');
            if (textarea && todayEntry) {
                textarea.value = todayEntry.content;
            }
        }
    }
    
    closeJournal() {
        const modal = document.getElementById('journalModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    saveJournalEntry() {
        const modal = document.getElementById('journalModal');
        if (!modal) return;
        
        const textarea = modal.querySelector('.journal-textarea');
        const moodOption = modal.querySelector('.mood-option.active');
        
        if (!textarea) return;
        
        const content = textarea.value.trim();
        const today = new Date().toISOString().split('T')[0];
        
        // Save journal entry
        const existingIndex = this.journalEntries.findIndex(entry => entry.date === today);
        
        if (existingIndex >= 0) {
            this.journalEntries[existingIndex].content = content;
            this.journalEntries[existingIndex].mood = moodOption ? 
                moodOption.getAttribute('data-mood') : null;
        } else {
            this.journalEntries.push({
                date: today,
                content: content,
                mood: moodOption ? moodOption.getAttribute('data-mood') : null,
                timestamp: new Date().toISOString()
            });
        }
        
        // Save to localStorage
        localStorage.setItem('mindlink_journal_entries', JSON.stringify(this.journalEntries));
        
        // Update mood if mood option was selected
        if (moodOption) {
            const moodText = moodOption.textContent;
            const moodValue = this.getMoodValueFromText(moodText);
            if (moodValue) {
                this.setCurrentMood(moodValue);
            }
        }
        
        // Close modal and show confirmation
        this.closeJournal();
        showNotification('Journal entry saved successfully', 'success');
        
        // Clear textarea
        textarea.value = '';
    }
    
    getMoodValueFromText(moodText) {
        const moodMap = {
            'Terrible': 1,
            'Bad': 2,
            'Okay': 3,
            'Good': 4,
            'Great': 5
        };
        
        for (const [text, value] of Object.entries(moodMap)) {
            if (moodText.includes(text)) {
                return value;
            }
        }
        return null;
    }
    
    initMoodChart() {
        const ctx = document.getElementById('moodChart');
        if (!ctx) return;
        
        // Destroy existing chart if any
        if (this.moodChart) {
            this.moodChart.destroy();
        }
        
        this.moodChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.getLast7Days(),
                datasets: [{
                    label: 'Mood Level',
                    data: this.getMoodChartData(),
                    borderColor: '#4A90E2',
                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        ticks: {
                            callback: function(value) {
                                const moods = ['', 'Terrible', 'Bad', 'Okay', 'Good', 'Great'];
                                return moods[value] || '';
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const moods = ['', 'Terrible', 'Bad', 'Okay', 'Good', 'Great'];
                                return `Mood: ${moods[context.parsed.y]}`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    getLast7Days() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        }
        return days;
    }
    
    getMoodChartData() {
        const last7Days = this.getLast7DaysDates();
        return last7Days.map(date => {
            const entry = this.moodData.find(d => d.date === date);
            return entry ? entry.mood : null;
        });
    }
    
    getLast7DaysDates() {
        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
        }
        return dates;
    }
    
    updateMoodChart() {
        if (this.moodChart) {
            this.moodChart.data.datasets[0].data = this.getMoodChartData();
            this.moodChart.update();
        }
    }
    
    loadMoodData() {
        // This would typically load from an API
        // For now, we're using localStorage
        this.updateMoodChart();
    }
    
    updateWelcomeMessage() {
        const hour = new Date().getHours();
        let greeting = 'Hello';
        
        if (hour < 12) greeting = 'Good morning';
        else if (hour < 18) greeting = 'Good afternoon';
        else greeting = 'Good evening';
        
        const welcomeName = document.getElementById('welcomeName');
        if (welcomeName) {
            welcomeName.textContent = welcomeName.textContent + ` - ${greeting}`;
        }
    }
    
    setupEmergencyButton() {
        const emergencyButton = document.querySelector('.emergency-float');
        if (emergencyButton) {
            emergencyButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.showEmergencyOptions();
            });
        }
    }
    
    showEmergencyOptions() {
        const options = `
            <div class="emergency-modal">
                <h3><i class="fas fa-first-aid"></i> Emergency Support</h3>
                <p>If you're in crisis, immediate help is available:</p>
                <div class="emergency-options">
                    <button class="btn-emergency" onclick="window.location.href='crisis.html'">
                        <i class="fas fa-phone-alt"></i>
                        <div>
                            <strong>Call Crisis Line</strong>
                            <small>0724361870 • 0707955695</small>
                        </div>
                    </button>
                    <button class="btn-emergency" onclick="window.location.href='chat.html?emergency=true'">
                        <i class="fas fa-comments"></i>
                        <div>
                            <strong>Emergency Chat</strong>
                            <small>Connect with a counselor now</small>
                        </div>
                    </button>
                    <button class="btn-emergency" onclick="window.location.href='resources.html#crisis'">
                        <i class="fas fa-info-circle"></i>
                        <div>
                            <strong>Crisis Resources</strong>
                            <small>Helpful information and contacts</small>
                        </div>
                    </button>
                </div>
                <p class="emergency-note">
                    <i class="fas fa-exclamation-triangle"></i>
                    If this is a life-threatening emergency, please call 112 (Kenya Emergency Services) immediately.
                </p>
            </div>
        `;
        
        showNotification(options, 'emergency');
    }
    
    showQuickHelp() {
        const helpOptions = [
            {
                icon: 'fas fa-comments',
                title: 'Chat Support',
                description: 'Talk to a licensed counselor',
                action: () => window.location.href = 'chat.html'
            },
            {
                icon: 'fas fa-book',
                title: 'Self-Help Resources',
                description: 'Access coping strategies and exercises',
                action: () => window.location.href = 'resources.html'
            },
            {
                icon: 'fas fa-users',
                title: 'Community Support',
                description: 'Connect with peers in similar situations',
                action: () => window.location.href = 'community.html'
            },
            {
                icon: 'fas fa-tools',
                title: 'Tools & Exercises',
                description: 'Mood tracking and relaxation tools',
                action: () => window.location.href = 'tools.html'
            }
        ];
        
        let helpHTML = '<div class="quick-help-modal"><h3>How can we help?</h3><div class="help-options">';
        
        helpOptions.forEach(option => {
            helpHTML += `
                <button class="help-option" onclick="(${option.action})()">
                    <i class="${option.icon}"></i>
                    <div>
                        <strong>${option.title}</strong>
                        <small>${option.description}</small>
                    </div>
                    <i class="fas fa-chevron-right"></i>
                </button>
            `;
        });
        
        helpHTML += '</div></div>';
        
        // Create a custom notification
        const notification = document.createElement('div');
        notification.className = 'notification help';
        notification.innerHTML = helpHTML;
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.addEventListener('click', () => notification.remove());
        notification.appendChild(closeBtn);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .quick-help-modal {
                max-width: 400px;
            }
            .help-options {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-top: 16px;
            }
            .help-option {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                border: 1px solid #E1E4E8;
                border-radius: 8px;
                background: white;
                cursor: pointer;
                transition: all 0.2s ease;
                width: 100%;
                text-align: left;
            }
            .help-option:hover {
                border-color: #4A90E2;
                background: #F8F9FA;
            }
            .help-option i:first-child {
                font-size: 1.25rem;
                color: #4A90E2;
            }
            .help-option i:last-child {
                margin-left: auto;
                color: #95A5A6;
            }
            .help-option div {
                flex: 1;
            }
            .help-option strong {
                display: block;
                color: #2C3E50;
                margin-bottom: 2px;
            }
            .help-option small {
                color: #6C757D;
                font-size: 0.875rem;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }
    
    showNotifications() {
        // This would typically show actual notifications from the server
        const notifications = [
            {
                id: 1,
                title: 'Counselor Response',
                message: 'Sarah has responded to your message',
                time: '2 hours ago',
                read: false
            },
            {
                id: 2,
                title: 'Community Update',
                message: 'New discussion in Anxiety Support group',
                time: '1 day ago',
                read: true
            },
            {
                id: 3,
                title: 'Resource Added',
                message: 'New breathing exercise available',
                time: '2 days ago',
                read: true
            }
        ];
        
        let notificationsHTML = '<div class="notifications-modal"><h3>Notifications</h3>';
        
        if (notifications.length === 0) {
            notificationsHTML += '<p class="no-notifications">No new notifications</p>';
        } else {
            notificationsHTML += '<div class="notifications-list">';
            
            notifications.forEach(notification => {
                notificationsHTML += `
                    <div class="notification-item ${notification.read ? 'read' : 'unread'}">
                        <div class="notification-icon">
                            <i class="fas fa-bell"></i>
                        </div>
                        <div class="notification-content">
                            <h4>${notification.title}</h4>
                            <p>${notification.message}</p>
                            <span class="notification-time">${notification.time}</span>
                        </div>
                        ${!notification.read ? '<span class="unread-dot"></span>' : ''}
                    </div>
                `;
            });
            
            notificationsHTML += '</div>';
        }
        
        notificationsHTML += '</div>';
        
        // Create a custom notification modal
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.innerHTML = notificationsHTML;
        
        // Add close functionality
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .custom-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            .notifications-modal {
                background: white;
                border-radius: 12px;
                padding: 24px;
                max-width: 400px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            }
            .notifications-modal h3 {
                margin: 0 0 16px 0;
                color: #2C3E50;
            }
            .no-notifications {
                color: #6C757D;
                text-align: center;
                padding: 32px 0;
            }
            .notifications-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .notification-item {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 12px;
                border-radius: 8px;
                border: 1px solid #E1E4E8;
                position: relative;
            }
            .notification-item.unread {
                background: rgba(74, 144, 226, 0.05);
                border-color: #4A90E2;
            }
            .notification-icon {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: #4A90E2;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
            }
            .notification-content {
                flex: 1;
            }
            .notification-content h4 {
                margin: 0 0 4px 0;
                color: #2C3E50;
                font-size: 14px;
            }
            .notification-content p {
                margin: 0 0 4px 0;
                color: #6C757D;
                font-size: 13px;
            }
            .notification-time {
                color: #95A5A6;
                font-size: 12px;
            }
            .unread-dot {
                position: absolute;
                top: 12px;
                right: 12px;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #E74C3C;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
    }
    
    showMoodHistory() {
        // This would show a modal with mood history
        alert('Mood history feature would show detailed mood tracking data here.');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html') || 
        window.location.pathname.includes('admin-dashboard.html')) {
        window.dashboard = new Dashboard();
    }
});