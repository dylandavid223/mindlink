// js/admin.js
// Admin JavaScript File

class AdminDashboard {
    constructor() {
        this.stats = {
            totalUsers: 1247,
            activeUsers: 843,
            totalSessions: 2156,
            crisisInterventions: 47,
            counselors: {
                total: 20,
                available: 8,
                busy: 4,
                offline: 8
            }
        };
        
        this.recentRegistrations = [];
        this.counselors = [];
        this.systemAlerts = [];
        
        this.init();
    }
    
    init() {
        this.checkAdminAuth();
        this.loadAdminData();
        this.setupEventListeners();
        this.initCharts();
        this.loadRecentRegistrations();
        this.loadCounselors();
        this.loadSystemAlerts();
        this.updateStats();
    }
    
    checkAdminAuth() {
        const userData = JSON.parse(localStorage.getItem('mindlink_user') || '{}');
        const isAdmin = userData.role === 'admin' || userData.role === 'super_admin';
        
        if (!isAdmin) {
            window.location.href = 'dashboard.html';
            return;
        }
    }
    
    loadAdminData() {
        // Load admin-specific data
        this.loadStatsFromStorage();
    }
    
    setupEventListeners() {
        // Quick action buttons
        const quickButtons = document.querySelectorAll('.btn-quick');
        quickButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const text = e.target.textContent || e.target.innerText;
                if (text.includes('Add Counselor')) this.addNewCounselor();
                if (text.includes('Export Report')) this.generateReport();
                if (text.includes('Audit Logs')) this.viewAuditLogs();
            });
        });
        
        // Tool cards
        const toolCards = document.querySelectorAll('.tool-card');
        toolCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const text = e.currentTarget.querySelector('span').textContent;
                if (text.includes('User Management')) this.manageUsers();
                if (text.includes('Content Management')) this.manageContent();
                if (text.includes('Analytics Reports')) this.viewReports();
                if (text.includes('System Settings')) this.systemSettings();
                if (text.includes('Crisis Management')) this.crisisManagement();
                if (text.includes('Audit Logs')) this.auditLogs();
            });
        });
        
        // Chart period selector
        const chartPeriod = document.querySelector('.chart-period');
        if (chartPeriod) {
            chartPeriod.addEventListener('change', (e) => {
                this.updateUserGrowthChart(e.target.value);
            });
        }
        
        // System status indicators
        this.setupSystemStatus();
    }
    
    loadStatsFromStorage() {
        // Load stats from localStorage or API
        const savedStats = localStorage.getItem('mindlink_admin_stats');
        if (savedStats) {
            this.stats = JSON.parse(savedStats);
        }
    }
    
    saveStatsToStorage() {
        localStorage.setItem('mindlink_admin_stats', JSON.stringify(this.stats));
    }
    
    updateStats() {
        // Update stat cards
        const statIds = ['totalUsers', 'activeUsers', 'totalSessions', 'crisisInterventions'];
        statIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = this.formatNumber(this.stats[id]);
            }
        });
        
        // Update counselor stats
        const counselorStats = document.querySelector('.availability-stats');
        if (counselorStats) {
            const { available, busy, offline } = this.stats.counselors;
            counselorStats.innerHTML = `
                <span class="available">${available} Available</span>
                <span class="busy">${busy} In Session</span>
                <span class="offline">${offline} Offline</span>
            `;
        }
    }
    
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    initCharts() {
        this.initUserGrowthChart();
        this.initSessionTypesChart();
    }
    
    initUserGrowthChart() {
        const ctx = document.getElementById('userGrowthChart');
        if (!ctx) return;
        
        // Generate data for last 7 days
        const labels = this.getLast7Days();
        const data = this.generateUserGrowthData();
        
        this.userGrowthChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'New Users',
                    data: data,
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
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value;
                            }
                        }
                    }
                }
            }
        });
    }
    
    initSessionTypesChart() {
        const ctx = document.getElementById('sessionTypesChart');
        if (!ctx) return;
        
        this.sessionTypesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Chat Sessions', 'Crisis Sessions', 'Group Sessions', 'Resource Views'],
                datasets: [{
                    data: [1256, 47, 432, 3215],
                    backgroundColor: [
                        '#4A90E2',
                        '#E74C3C',
                        '#2ECC71',
                        '#F39C12'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
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
    
    generateUserGrowthData() {
        // Generate realistic user growth data
        const base = 100;
        const data = [];
        
        for (let i = 0; i < 7; i++) {
            // Simulate growth with some randomness
            const growth = Math.floor(Math.random() * 30) + 15;
            data.push(base + (growth * (i + 1)));
        }
        
        return data;
    }
    
    updateUserGrowthChart(period) {
        if (!this.userGrowthChart) return;
        
        // Update chart based on selected period
        let labels, data;
        
        switch(period) {
            case 'Last 30 days':
                labels = this.getLastNDays(30, 'short');
                data = this.generateDataForNDays(30);
                break;
            case 'Last 90 days':
                labels = this.getLastNDays(90, 'month');
                data = this.generateDataForNDays(90);
                break;
            default: // Last 7 days
                labels = this.getLast7Days();
                data = this.generateUserGrowthData();
        }
        
        this.userGrowthChart.data.labels = labels;
        this.userGrowthChart.data.datasets[0].data = data;
        this.userGrowthChart.update();
    }
    
    getLastNDays(n, format = 'short') {
        const days = [];
        for (let i = n - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            if (format === 'month') {
                days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            } else {
                days.push(date.toLocaleDateString('en-US', { weekday: format }));
            }
        }
        return days;
    }
    
    generateDataForNDays(n) {
        const data = [];
        const base = 100;
        
        for (let i = 0; i < n; i++) {
            const growth = Math.floor(Math.random() * 20) + 10;
            data.push(base + (growth * (i + 1)));
        }
        
        return data;
    }
    
    loadRecentRegistrations() {
        // Generate mock recent registrations
        this.recentRegistrations = [
            {
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                age: 22,
                location: 'Nairobi',
                time: '2 hours ago'
            },
            {
                id: 2,
                name: 'Jane Smith',
                email: 'jane@example.com',
                age: 19,
                location: 'Mombasa',
                time: '4 hours ago'
            },
            {
                id: 3,
                name: 'David Kimani',
                email: 'david@example.com',
                age: 25,
                location: 'Eldoret',
                time: '6 hours ago'
            },
            {
                id: 4,
                name: 'Sarah Omondi',
                email: 'sarah@example.com',
                age: 17,
                location: 'Kisumu',
                time: '1 day ago'
            },
            {
                id: 5,
                name: 'Michael Otieno',
                email: 'michael@example.com',
                age: 28,
                location: 'Nakuru',
                time: '1 day ago'
            }
        ];
        
        this.renderRecentRegistrations();
    }
    
    renderRecentRegistrations() {
        const container = document.querySelector('.registrations-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.recentRegistrations.forEach(user => {
            const div = document.createElement('div');
            div.className = 'registration-item';
            div.innerHTML = `
                <div class="registration-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="registration-info">
                    <h4>${user.name}</h4>
                    <p>${user.age} years • ${user.location}</p>
                </div>
                <div class="registration-time">${user.time}</div>
            `;
            
            container.appendChild(div);
        });
    }
    
    loadCounselors() {
        // Generate mock counselor data
        this.counselors = [
            {
                id: 1,
                name: 'Sarah Mwangi',
                role: 'Clinical Psychologist',
                status: 'available',
                sessions: 45
            },
            {
                id: 2,
                name: 'David Ochieng',
                role: 'Counselor',
                status: 'busy',
                sessions: 32
            },
            {
                id: 3,
                name: 'Grace Akinyi',
                role: 'Psychiatrist',
                status: 'offline',
                sessions: 28
            },
            {
                id: 4,
                name: 'James Kariuki',
                role: 'Social Worker',
                status: 'available',
                sessions: 51
            },
            {
                id: 5,
                name: 'Linda Chebet',
                role: 'Counselor',
                status: 'available',
                sessions: 39
            },
            {
                id: 6,
                name: 'Peter Maina',
                role: 'Psychologist',
                status: 'busy',
                sessions: 47
            }
        ];
        
        this.renderCounselors();
    }
    
    renderCounselors() {
        const container = document.querySelector('.counselors-grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.counselors.forEach(counselor => {
            const div = document.createElement('div');
            div.className = 'counselor-card';
            div.innerHTML = `
                <div class="counselor-avatar">
                    <i class="fas fa-user-md"></i>
                </div>
                <h4>${counselor.name}</h4>
                <p>${counselor.role}</p>
                <span class="counselor-status-badge status-${counselor.status}">
                    ${counselor.status.charAt(0).toUpperCase() + counselor.status.slice(1)}
                </span>
                <div class="counselor-stats">
                    <small>${counselor.sessions} sessions this month</small>
                </div>
            `;
            
            container.appendChild(div);
        });
    }
    
    loadSystemAlerts() {
        // This would typically come from an API
        this.systemAlerts = [
            {
                id: 1,
                type: 'high',
                title: 'High Server Load',
                message: 'Server CPU at 85% - Peak hours detected',
                time: '10 minutes ago',
                action: 'configure'
            },
            {
                id: 2,
                type: 'medium',
                title: 'Counselor Availability Low',
                message: 'Only 2 counselors available for next hour',
                time: '1 hour ago',
                action: 'assign'
            },
            {
                id: 3,
                type: 'low',
                title: 'Backup Completed',
                message: 'Daily database backup successful',
                time: '2 hours ago',
                action: null
            }
        ];
        
        this.renderSystemAlerts();
    }
    
    renderSystemAlerts() {
        // Already rendered in HTML, this would update dynamically
    }
    
    setupSystemStatus() {
        // Simulate real-time system status updates
        setInterval(() => {
            this.updateSystemStatus();
        }, 30000); // Every 30 seconds
    }
    
    updateSystemStatus() {
        // Simulate status changes
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.system-status span:last-child');
        
        if (Math.random() > 0.95) { // 5% chance of status change
            statusIndicator.classList.remove('active', 'warning', 'error');
            
            if (Math.random() > 0.7) {
                statusIndicator.classList.add('warning');
                statusText.textContent = 'System: Warning';
            } else {
                statusIndicator.classList.add('error');
                statusText.textContent = 'System: Error';
                
                // Add an alert
                this.addSystemAlert(
                    'System Error Detected',
                    'Unexpected system behavior detected',
                    'high'
                );
            }
            
            // Revert after 10 seconds
            setTimeout(() => {
                statusIndicator.classList.remove('warning', 'error');
                statusIndicator.classList.add('active');
                statusText.textContent = 'System: Online';
            }, 10000);
        }
    }
    
    addSystemAlert(title, message, type = 'medium') {
        const alert = {
            id: Date.now(),
            type,
            title,
            message,
            time: 'Just now',
            action: 'view'
        };
        
        this.systemAlerts.unshift(alert);
        
        // Update alert count
        const alertCount = document.querySelector('.alert-count');
        if (alertCount) {
            const currentCount = parseInt(alertCount.textContent) || 0;
            alertCount.textContent = `${currentCount + 1} New`;
        }
        
        // Show notification
        showNotification(`System Alert: ${title}`, 'warning');
    }
    
    // Admin Actions
    addNewCounselor() {
        const modalHTML = `
            <div class="admin-modal active" id="addCounselorModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Add New Counselor</h2>
                        <button class="modal-close" onclick="this.closest('.admin-modal').classList.remove('active')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="addCounselorForm">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>First Name</label>
                                    <input type="text" required>
                                </div>
                                <div class="form-group">
                                    <label>Last Name</label>
                                    <input type="text" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Email Address</label>
                                <input type="email" required>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Professional License</label>
                                    <input type="text" placeholder="e.g., KCPA-12345" required>
                                </div>
                                <div class="form-group">
                                    <label>Specialization</label>
                                    <select required>
                                        <option value="">Select</option>
                                        <option>Clinical Psychology</option>
                                        <option>Counseling Psychology</option>
                                        <option>Psychiatry</option>
                                        <option>Social Work</option>
                                        <option>Psychiatric Nursing</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Years of Experience</label>
                                <input type="number" min="1" max="50" required>
                            </div>
                            <div class="form-group">
                                <label>Availability Schedule</label>
                                <div class="schedule-selector">
                                    <label class="checkbox"><input type="checkbox" checked> Monday</label>
                                    <label class="checkbox"><input type="checkbox" checked> Tuesday</label>
                                    <label class="checkbox"><input type="checkbox" checked> Wednesday</label>
                                    <label class="checkbox"><input type="checkbox" checked> Thursday</label>
                                    <label class="checkbox"><input type="checkbox" checked> Friday</label>
                                    <label class="checkbox"><input type="checkbox"> Saturday</label>
                                    <label class="checkbox"><input type="checkbox"> Sunday</label>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Notes</label>
                                <textarea rows="3" placeholder="Additional information..."></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="this.closest('.admin-modal').classList.remove('active')">
                            Cancel
                        </button>
                        <button class="btn btn-primary" onclick="admin.submitNewCounselor()">
                            Add Counselor
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    submitNewCounselor() {
        const form = document.getElementById('addCounselorForm');
        if (!form) return;
        
        // In real app, would submit to API
        showNotification('Counselor added successfully', 'success');
        
        // Close modal
        const modal = document.getElementById('addCounselorModal');
        if (modal) modal.remove();
        
        // Update stats
        this.stats.counselors.total += 1;
        this.stats.counselors.available += 1;
        this.updateStats();
        this.loadCounselors();
    }
    
    generateReport() {
        // Simulate report generation
        showNotification('Generating report...', 'info');
        
        setTimeout(() => {
            const reportData = {
                timestamp: new Date().toISOString(),
                stats: this.stats,
                period: 'Last 30 days',
                generatedBy: JSON.parse(localStorage.getItem('mindlink_user') || '{}').name || 'Admin'
            };
            
            // Create download link
            const dataStr = JSON.stringify(reportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `mindlink-report-${new Date().toISOString().split('T')[0]}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            showNotification('Report downloaded successfully', 'success');
        }, 2000);
    }
    
    viewAuditLogs() {
        showNotification('Opening audit logs...', 'info');
        // In real app, would open audit logs page/modal
    }
    
    manageUsers() {
        window.location.href = 'admin-users.html';
    }
    
    manageContent() {
        window.location.href = 'admin-content.html';
    }
    
    viewReports() {
        window.location.href = 'admin-reports.html';
    }
    
    systemSettings() {
        window.location.href = 'admin-settings.html';
    }
    
    crisisManagement() {
        window.location.href = 'admin-crisis.html';
    }
    
    auditLogs() {
        this.viewAuditLogs();
    }
    
    showSystemAlerts() {
        // Toggle alerts panel
        const alertsPanel = document.querySelector('.system-alerts');
        if (alertsPanel) {
            alertsPanel.classList.toggle('expanded');
        }
    }
    
    openSupportTickets() {
        showNotification('Opening support tickets...', 'info');
        // In real app, would open tickets page/modal
    }
}

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('admin-dashboard.html')) {
        window.admin = new AdminDashboard();
    }
});