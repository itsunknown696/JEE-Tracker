// JEE Progress Tracker Application - Enhanced
class JEEProgressTracker {
    constructor() {
        this.chartInstances = {};
        this.currentToast = null;
        this.isMobile = window.innerWidth <= 768;
        this.isMenuOpen = false;
        this.init();
    }

    init() {
        this.setupDefaultData();
        this.loadData();
        this.setupEventListeners();
        this.setupMobileDetection();
        this.setupWeekStartDate();
        this.updateCurrentDate();
        this.renderDashboard();
        
        // Show welcome message
        setTimeout(() => {
            this.showToast('Welcome to JEE Progress Tracker!', 'success');
        }, 1000);
    }

    setupMobileDetection() {
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 768;
            if (!this.isMobile && this.isMenuOpen) {
                this.toggleMobileMenu(false);
            }
        });
    }

    setupDefaultData() {
        this.defaultData = {
            subjects: {
                'Physics': [
                    { name: 'Kinematics', status: 'remaining' },
                    { name: 'Laws of Motion', status: 'remaining' }
                ],
                'Chemistry': [
                    { name: 'Basic Concepts', status: 'remaining' },
                    { name: 'Atomic Structure', status: 'remaining' }
                ],
                'Mathematics': [
                    { name: 'Sets & Relations', status: 'remaining' },
                    { name: 'Complex Numbers', status: 'remaining' }
                ]
            },
            mockTests: [],
            weeklyPlanner: {},
            currentWeekStart: '',
            settings: {
                darkMode: false,
                notifications: true,
                weeklyGoal: 85
            },
            stats: {
                lastUpdated: new Date().toISOString(),
                streak: 0
            }
        };

        this.data = JSON.parse(JSON.stringify(this.defaultData));
    }

    loadData() {
        const savedData = localStorage.getItem('jeeProgressTrackerV2');
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                this.data = {
                    ...this.defaultData,
                    ...parsedData,
                    subjects: parsedData.subjects || this.defaultData.subjects,
                    mockTests: parsedData.mockTests || [],
                    weeklyPlanner: parsedData.weeklyPlanner || {},
                    settings: {
                        ...this.defaultData.settings,
                        ...(parsedData.settings || {})
                    }
                };
                
                // Apply dark mode if saved
                if (this.data.settings.darkMode) {
                    document.body.classList.add('dark-mode');
                    document.querySelector('#themeToggle i').className = 'fas fa-sun';
                }
            } catch (e) {
                console.error('Error loading data:', e);
                this.data = JSON.parse(JSON.stringify(this.defaultData));
                this.showToast('Error loading saved data. Using defaults.', 'error');
            }
        }
    }

    saveData() {
        try {
            this.data.stats.lastUpdated = new Date().toISOString();
            localStorage.setItem('jeeProgressTrackerV2', JSON.stringify(this.data));
        } catch (e) {
            console.error('Error saving data:', e);
            this.showToast('Error saving data!', 'error');
        }
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
        }
        
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
                if (this.isMobile && this.isMenuOpen) {
                    this.toggleMobileMenu(false);
                }
            });
        });
        
        // Export buttons
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('exportPDFBtn').addEventListener('click', () => this.exportAsPDF());
        
        // Import button
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });

        document.getElementById('importFileInput').addEventListener('change', (e) => {
            this.importData(e);
        });
        
        // Chapter management
        document.getElementById('addSubjectBtn').addEventListener('click', () => this.showAddChapterModal());
        document.getElementById('addNewSubjectBtn').addEventListener('click', () => this.showAddChapterModal());
        
        // Mock tests
        document.getElementById('addTestBtn').addEventListener('click', () => this.showModal('testModal'));
        document.getElementById('saveTestBtn').addEventListener('click', () => this.saveMockTest());
        
        // Weekly planner
        document.getElementById('savePlannerBtn').addEventListener('click', () => this.saveWeeklyPlanner());
        document.getElementById('clearPlannerBtn').addEventListener('click', () => this.clearWeeklyPlanner());
        document.getElementById('weekStartDate').addEventListener('change', (e) => {
            this.data.currentWeekStart = e.target.value;
            this.saveData();
            this.renderWeeklyPlanner();
            this.renderDashboard();
            this.showToast('Week updated!', 'success');
        });
        
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeAllModals();
            });
        });
        
        // Close modal on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            });
        });
        
        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
                if (this.isMobile && this.isMenuOpen) {
                    this.toggleMobileMenu(false);
                }
            }
        });
        
        // Set today's date as default for test date
        const testDateInput = document.getElementById('testDate');
        if (testDateInput) {
            const today = new Date();
            testDateInput.value = today.toISOString().split('T')[0];
            testDateInput.max = today.toISOString().split('T')[0];
        }
        
        // Auto-save for planner textareas
        document.addEventListener('blur', (e) => {
            if (e.target.matches('.day-content textarea')) {
                const date = e.target.dataset.date;
                this.updateDayTopics(date, e.target.value);
                this.showToast('Planner saved!', 'success');
            }
        }, true);
    }

    toggleMobileMenu(forceState) {
        this.isMenuOpen = forceState !== undefined ? forceState : !this.isMenuOpen;
        const mobileNav = document.querySelector('.mobile-nav');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        
        if (mobileNav) {
            mobileNav.classList.toggle('active', this.isMenuOpen);
        }
        
        if (mobileMenuBtn) {
            const icon = mobileMenuBtn.querySelector('i');
            icon.className = this.isMenuOpen ? 'fas fa-times' : 'fas fa-bars';
        }
        
        // Close menu when clicking outside
        if (this.isMenuOpen) {
            setTimeout(() => {
                document.addEventListener('click', this.handleOutsideClick);
            }, 10);
        } else {
            document.removeEventListener('click', this.handleOutsideClick);
        }
    }

    handleOutsideClick = (e) => {
        const mobileNav = document.querySelector('.mobile-nav');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        
        if (!mobileNav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            this.toggleMobileMenu(false);
        }
    }

    showToast(message, type = 'info', duration = 3000) {
        if (this.currentToast) {
            this.currentToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        this.currentToast = toast;
        
        // Animate in
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
                if (this.currentToast === toast) {
                    this.currentToast = null;
                }
            }, 300);
        }, duration);
    }

    showAddChapterModal() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add Chapter</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="chapterSubject">Select Subject</label>
                        <select id="chapterSubject" class="form-select">
                            <option value="Physics">Physics</option>
                            <option value="Chemistry">Chemistry</option>
                            <option value="Mathematics">Mathematics</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="chapterName">Chapter Name</label>
                        <input type="text" id="chapterName" placeholder="Enter chapter name" autofocus>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-close">Cancel</button>
                    <button class="btn" id="saveChapterBtn">
                        <i class="fas fa-plus"></i> Add Chapter
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners for this modal
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });
        
        const saveBtn = modal.querySelector('#saveChapterBtn');
        saveBtn.addEventListener('click', () => {
            this.saveChapter();
            modal.remove();
        });
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Close on escape
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
            }
        });
    }

    saveChapter() {
        const subject = document.getElementById('chapterSubject').value;
        const chapterName = document.getElementById('chapterName').value.trim();
        
        if (!chapterName) {
            this.showToast('Please enter a chapter name', 'error');
            return;
        }
        
        if (chapterName.length > 50) {
            this.showToast('Chapter name too long (max 50 chars)', 'error');
            return;
        }
        
        // Check if chapter already exists in this subject
        const existingChapter = this.data.subjects[subject].find(
            ch => ch.name.toLowerCase() === chapterName.toLowerCase()
        );
        
        if (existingChapter) {
            this.showToast(`"${chapterName}" already exists in ${subject}!`, 'error');
            return;
        }
        
        // Add new chapter
        this.data.subjects[subject].push({
            name: chapterName,
            status: 'remaining'
        });
        
        this.saveData();
        this.renderSubjects();
        this.renderDashboard();
        this.renderAnalysis();
        
        this.showToast(`Chapter "${chapterName}" added to ${subject}`, 'success');
    }

    deleteChapter(subject, chapterIndex) {
        if (confirm(`Are you sure you want to delete this chapter?`)) {
            const chapterName = this.data.subjects[subject][chapterIndex].name;
            this.data.subjects[subject].splice(chapterIndex, 1);
            this.saveData();
            this.renderSubjects();
            this.renderDashboard();
            this.renderAnalysis();
            this.showToast(`Chapter "${chapterName}" deleted`, 'success');
        }
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validate the imported data structure
                if (!this.validateImportedData(importedData)) {
                    this.showToast('Invalid data format. Please use a valid JSON file.', 'error');
                    return;
                }
                
                // Show confirmation modal
                this.showImportConfirmationModal(importedData);
                
            } catch (error) {
                console.error('Error parsing JSON:', error);
                this.showToast('Error reading file. Please check the format.', 'error');
            }
        };
        
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }

    validateImportedData(data) {
        // Basic validation for required fields
        return data && 
               typeof data === 'object' &&
               (data.subjects || data.mockTests || data.weeklyPlanner);
    }

    showImportConfirmationModal(importedData) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        
        // Count imported items
        const subjectCount = Object.keys(importedData.subjects || {}).length;
        const chapterCount = Object.values(importedData.subjects || {}).flat().length;
        const testCount = (importedData.mockTests || []).length;
        const plannerDays = Object.keys(importedData.weeklyPlanner || {}).length;
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>Import Data</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <i class="fas fa-file-import" style="font-size: 48px; color: var(--primary); margin-bottom: 16px;"></i>
                        <h4 style="margin-bottom: 16px;">Confirm Data Import</h4>
                    </div>
                    
                    <div style="background: var(--bg-tertiary); padding: 16px; border-radius: var(--radius-lg); margin-bottom: 20px;">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                            <div class="import-stat">
                                <div style="font-size: 20px; font-weight: 700; color: var(--primary);">${subjectCount}</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">Subjects</div>
                            </div>
                            <div class="import-stat">
                                <div style="font-size: 20px; font-weight: 700; color: var(--primary);">${chapterCount}</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">Chapters</div>
                            </div>
                            <div class="import-stat">
                                <div style="font-size: 20px; font-weight: 700; color: var(--primary);">${testCount}</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">Mock Tests</div>
                            </div>
                            <div class="import-stat">
                                <div style="font-size: 20px; font-weight: 700; color: var(--primary);">${plannerDays}</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">Planner Days</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="color: var(--text-secondary); font-size: 14px; margin-bottom: 20px;">
                        <i class="fas fa-exclamation-triangle" style="color: var(--warning); margin-right: 8px;"></i>
                        This will replace your current data. This action cannot be undone.
                    </div>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="backupCurrent" checked>
                            Create backup of current data before importing
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-close">Cancel</button>
                    <button class="btn btn-danger" id="confirmImportBtn">
                        <i class="fas fa-file-import"></i> Import Data
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#confirmImportBtn').addEventListener('click', () => {
            const backupCurrent = modal.querySelector('#backupCurrent').checked;
            
            if (backupCurrent) {
                // Create backup of current data
                const backupData = JSON.parse(JSON.stringify(this.data));
                const backupStr = JSON.stringify(backupData, null, 2);
                const backupDate = new Date().toISOString().split('T')[0];
                
                // Optionally save backup to localStorage
                localStorage.setItem(`jeeProgressBackup_${backupDate}`, backupStr);
            }
            
            // Import the data
            this.data = {
                ...this.data, // Keep current settings
                ...importedData,
                // Preserve important settings
                settings: {
                    ...this.data.settings,
                    ...importedData.settings
                }
            };
            
            this.saveData();
            modal.remove();
            
            // Refresh all views
            this.renderDashboard();
            this.renderSubjects();
            this.renderAnalysis();
            this.renderMockTests();
            this.renderWeeklyPlanner();
            
            this.showToast('Data imported successfully!', 'success');
        });
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const icon = document.querySelector('#themeToggle i');
        icon.className = document.body.classList.contains('dark-mode') ? 'fas fa-sun' : 'fas fa-moon';
        this.data.settings.darkMode = document.body.classList.contains('dark-mode');
        this.saveData();
        
        // Update charts for theme change
        this.updateChartsForTheme();
        
        this.showToast(
            document.body.classList.contains('dark-mode') ? 'Dark mode enabled' : 'Light mode enabled',
            'success'
        );
    }

    updateChartsForTheme() {
        Object.values(this.chartInstances).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
        this.chartInstances = {};
        
        if (document.querySelector('#analysis').classList.contains('active')) {
            setTimeout(() => this.renderAnalysis(), 100);
        }
    }

    switchTab(tabName) {
        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Show selected tab
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.toggle('active', tab.id === tabName);
        });
        
        // Update mobile menu button text
        const tabNames = {
            home: 'Dashboard',
            subjects: 'Subjects',
            analysis: 'Analysis',
            tests: 'Mock Tests',
            planner: 'Weekly Planner'
        };
        
        if (this.isMobile) {
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            if (mobileMenuBtn) {
                const icon = mobileMenuBtn.querySelector('i');
                icon.className = 'fas fa-chevron-down';
            }
        }
        
        // Render content if needed
        switch(tabName) {
            case 'subjects':
                this.renderSubjects();
                break;
            case 'analysis':
                setTimeout(() => this.renderAnalysis(), 100);
                break;
            case 'tests':
                this.renderMockTests();
                break;
            case 'planner':
                this.renderWeeklyPlanner();
                break;
        }
        
        // Scroll to top on mobile
        if (this.isMobile) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
        document.body.style.overflow = 'hidden';
        
        if (modalId === 'testModal') {
            document.getElementById('testTitle').focus();
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
        
        // Clear form inputs for test modal
        const testModal = document.getElementById('testModal');
        if (testModal) {
            document.getElementById('testTitle').value = '';
            document.getElementById('physicsScore').value = '';
            document.getElementById('chemistryScore').value = '';
            document.getElementById('mathScore').value = '';
            document.getElementById('testNotes').value = '';
        }
    }

    updateCurrentDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateElement = document.getElementById('currentDate');
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('en-US', options);
        }
        
        // Update streak
        const lastUpdated = new Date(this.data.stats.lastUpdated);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        lastUpdated.setHours(0, 0, 0, 0);
        
        const diffTime = Math.abs(today - lastUpdated);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            this.data.stats.streak++;
        } else if (diffDays > 1) {
            this.data.stats.streak = 1;
        }
        
        this.data.stats.lastUpdated = new Date().toISOString();
        
        // Update streak display
        const streakElement = document.getElementById('streakCount');
        if (streakElement) {
            streakElement.textContent = this.data.stats.streak;
        }
    }

    setupWeekStartDate() {
        if (!this.data.currentWeekStart) {
            const today = new Date();
            const dayOfWeek = today.getDay();
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const monday = new Date(today);
            monday.setDate(today.getDate() + diffToMonday);
            this.data.currentWeekStart = monday.toISOString().split('T')[0];
        }
        
        const weekStartInput = document.getElementById('weekStartDate');
        if (weekStartInput) {
            weekStartInput.value = this.data.currentWeekStart;
            const today = new Date().toISOString().split('T')[0];
            weekStartInput.max = today;
        }
    }

    getWeekDates() {
        if (!this.data.currentWeekStart) return [];
        
        const startDate = new Date(this.data.currentWeekStart);
        const dates = [];
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            dates.push({
                day: days[i],
                date: date.toISOString().split('T')[0],
                formattedDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            });
        }
        
        return dates;
    }

    calculateProgress() {
        let totalChapters = 0;
        let completed = 0;
        let revised = 0;
        let remaining = 0;
        
        for (const subject in this.data.subjects) {
            const chapters = this.data.subjects[subject];
            totalChapters += chapters.length;
            
            chapters.forEach(chapter => {
                if (chapter.status === 'completed') completed++;
                else if (chapter.status === 'revised') revised++;
                else if (chapter.status === 'remaining') remaining++;
            });
        }
        
        const overallProgress = totalChapters > 0 ? ((completed + revised) / totalChapters) * 100 : 0;
        
        return {
            totalChapters,
            completed,
            revised,
            remaining,
            overallProgress: Math.round(overallProgress * 10) / 10
        };
    }

    calculateTestStats() {
        if (this.data.mockTests.length === 0) {
            return {
                averageScore: 0,
                highestScore: 0,
                totalTests: 0,
                improvement: 0
            };
        }
        
        const percentages = this.data.mockTests.map(test => test.percentage);
        const averageScore = percentages.reduce((a, b) => a + b, 0) / percentages.length;
        const highestScore = Math.max(...percentages);
        
        // Calculate improvement (last 3 tests)
        let improvement = 0;
        if (this.data.mockTests.length >= 3) {
            const recentTests = [...this.data.mockTests]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 3);
            const recentAvg = recentTests.reduce((sum, test) => sum + test.percentage, 0) / 3;
            improvement = recentAvg - averageScore;
        }
        
        return {
            averageScore: Math.round(averageScore * 10) / 10,
            highestScore: Math.round(highestScore * 10) / 10,
            totalTests: this.data.mockTests.length,
            improvement: Math.round(improvement * 10) / 10
        };
    }

    calculateWeekProgress() {
        const weekDates = this.getWeekDates();
        let doneDays = 0;
        let partialDays = 0;
        let notDoneDays = 0;
        
        weekDates.forEach(day => {
            const dayData = this.data.weeklyPlanner[day.date];
            if (dayData) {
                if (dayData.status === 'done') doneDays++;
                else if (dayData.status === 'partial') partialDays++;
                else if (dayData.status === 'not-done') notDoneDays++;
            } else {
                notDoneDays++;
            }
        });
        
        const totalDays = weekDates.length;
        const completionRate = ((doneDays + (partialDays * 0.5)) / totalDays) * 100;
        
        return {
            doneDays,
            partialDays,
            notDoneDays,
            completionRate: Math.round(completionRate * 10) / 10
        };
    }

    renderDashboard() {
        const progress = this.calculateProgress();
        const testStats = this.calculateTestStats();
        const weekProgress = this.calculateWeekProgress();
        
        // FIXED: Update progress circle - Fixed rotation calculation
        const circle = document.getElementById('overallCircle');
        if (circle) {
            // Convert percentage to degrees (0% = 0deg, 100% = 360deg)
            // We start at 45deg (top-right) and need to calculate the rotation
            const degrees = (progress.overallProgress * 3.6); // 3.6 = 360/100
            circle.style.transform = `rotate(${degrees}deg)`;
        }
        
        // Update text displays
        document.getElementById('overallPercent').textContent = `${progress.overallProgress}%`;
        document.getElementById('completedCount').textContent = progress.completed;
        document.getElementById('revisedCount').textContent = progress.revised;
        document.getElementById('remainingCount').textContent = progress.remaining;
        
        document.getElementById('avgScore').textContent = `${testStats.averageScore}%`;
        document.getElementById('testsCount').textContent = testStats.totalTests;
        document.getElementById('highScore').textContent = `${testStats.highestScore}%`;
        
        document.getElementById('weekPercent').textContent = `${weekProgress.completionRate}%`;
        const weekProgressBar = document.getElementById('weekProgress');
        if (weekProgressBar) {
            weekProgressBar.style.width = `${weekProgress.completionRate}%`;
        }
        document.getElementById('doneDays').textContent = weekProgress.doneDays;
        document.getElementById('halfDays').textContent = weekProgress.partialDays;
        document.getElementById('notDoneDays').textContent = weekProgress.notDoneDays;
        
        // Update planner progress
        const plannerProgress = document.getElementById('plannerProgress');
        if (plannerProgress) {
            plannerProgress.style.width = `${weekProgress.completionRate}%`;
        }
        document.getElementById('weekCompletion').textContent = `${weekProgress.completionRate}%`;
        document.getElementById('tasksCompleted').textContent = weekProgress.doneDays;
        
        // Update streak display
        const streakElement = document.getElementById('streakCount');
        if (streakElement) {
            streakElement.textContent = this.data.stats.streak;
        }
        
        // Render subjects overview
        this.renderSubjectsOverview();
    }

    renderSubjectsOverview() {
        const container = document.getElementById('subjectsOverview');
        if (!container) return;
        
        container.innerHTML = '';
        
        for (const subject in this.data.subjects) {
            const chapters = this.data.subjects[subject];
            const completedChapters = chapters.filter(ch => ch.status === 'completed' || ch.status === 'revised').length;
            const progressPercent = chapters.length > 0 ? (completedChapters / chapters.length) * 100 : 0;
            
            const subjectCard = document.createElement('div');
            subjectCard.className = 'subject-card';
            subjectCard.innerHTML = `
                <div class="subject-name">${subject}</div>
                <div class="subject-stats">
                    <span>${completedChapters}/${chapters.length} chapters</span>
                    <span>${Math.round(progressPercent)}%</span>
                </div>
                <div class="subject-progress">
                    <div class="subject-progress-fill" style="width: ${progressPercent}%"></div>
                </div>
            `;
            
            subjectCard.addEventListener('click', () => {
                this.switchTab('subjects');
                setTimeout(() => {
                    const element = document.querySelector(`[data-subject="${subject}"]`);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 100);
            });
            
            container.appendChild(subjectCard);
        }
    }

    renderSubjects() {
        const container = document.getElementById('subjectsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        for (const subject in this.data.subjects) {
            const chapters = this.data.subjects[subject];
            const completedChapters = chapters.filter(ch => ch.status === 'completed' || ch.status === 'revised').length;
            const progressPercent = chapters.length > 0 ? (completedChapters / chapters.length) * 100 : 0;
            
            const subjectCard = document.createElement('div');
            subjectCard.className = 'subject-detail-card';
            subjectCard.dataset.subject = subject;
            subjectCard.innerHTML = `
                <div class="card-header">
                    <div>
                        <h3>${subject}</h3>
                        <span style="color: var(--text-secondary); font-size: 14px;">
                            ${completedChapters}/${chapters.length} chapters · ${Math.round(progressPercent)}% complete
                        </span>
                    </div>
                    <button class="btn btn-sm" onclick="jeeTracker.showAddChapterModal()">
                        <i class="fas fa-plus"></i> Add Chapter
                    </button>
                </div>
                <div class="chapters-list" id="chapters-${subject.replace(/\s+/g, '-')}"></div>
            `;
            
            container.appendChild(subjectCard);
            
            // Render chapters for this subject
            this.renderSubjectChapters(subject, chapters);
        }
    }

    renderSubjectChapters(subjectName, chapters) {
        const containerId = `chapters-${subjectName.replace(/\s+/g, '-')}`;
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        if (chapters.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 40px 20px;">
                    <i class="fas fa-book-open" style="font-size: 48px; color: var(--text-muted); opacity: 0.5;"></i>
                    <p style="color: var(--text-secondary); margin-top: 16px;">No chapters added yet. Click "Add Chapter" to start.</p>
                </div>
            `;
            return;
        }
        
        chapters.forEach((chapter, index) => {
            const statusColors = {
                completed: 'var(--status-completed)',
                remaining: 'var(--status-remaining)',
                revised: 'var(--status-revised)'
            };
            
            const statusIcons = {
                completed: 'fa-check-circle',
                remaining: 'fa-clock',
                revised: 'fa-sync-alt'
            };
            
            const chapterItem = document.createElement('div');
            chapterItem.className = 'chapter-item';
            chapterItem.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                    <i class="fas ${statusIcons[chapter.status]}" 
                       style="color: ${statusColors[chapter.status]}; font-size: 20px;"></i>
                    <div style="flex: 1;">
                        <div class="chapter-name">${chapter.name}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">
                            ${chapter.status.charAt(0).toUpperCase() + chapter.status.slice(1)}
                        </div>
                    </div>
                </div>
                <div class="chapter-status">
                    <button class="status-btn completed ${chapter.status === 'completed' ? 'active' : ''}"
                            data-subject="${subjectName}" data-index="${index}" data-status="completed">
                        <i class="fas fa-check"></i> Completed
                    </button>
                    <button class="status-btn remaining ${chapter.status === 'remaining' ? 'active' : ''}"
                            data-subject="${subjectName}" data-index="${index}" data-status="remaining">
                        <i class="fas fa-clock"></i> Remaining
                    </button>
                    <button class="status-btn revised ${chapter.status === 'revised' ? 'active' : ''}"
                            data-subject="${subjectName}" data-index="${index}" data-status="revised">
                        <i class="fas fa-sync-alt"></i> Revised
                    </button>
                </div>
                <button class="btn-icon btn-sm delete-chapter" 
                        data-subject="${subjectName}" data-index="${index}"
                        title="Delete Chapter" style="margin-left: 12px;">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            container.appendChild(chapterItem);
        });
        
        // Add event listeners to status buttons
        container.querySelectorAll('.status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const subject = e.target.closest('.status-btn').dataset.subject;
                const index = parseInt(e.target.closest('.status-btn').dataset.index);
                const status = e.target.closest('.status-btn').dataset.status;
                
                this.updateChapterStatus(subject, index, status);
            });
        });
        
        // Add event listeners to delete buttons
        container.querySelectorAll('.delete-chapter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const subject = e.target.closest('.delete-chapter').dataset.subject;
                const index = parseInt(e.target.closest('.delete-chapter').dataset.index);
                
                this.deleteChapter(subject, index);
            });
        });
    }

    updateChapterStatus(subject, index, status) {
        if (this.data.subjects[subject] && this.data.subjects[subject][index]) {
            this.data.subjects[subject][index].status = status;
            this.saveData();
            this.renderSubjects();
            this.renderDashboard();
            this.renderAnalysis();
            this.showToast('Chapter status updated!', 'success');
        }
    }

    renderAnalysis() {
        // Destroy existing charts if they exist
        Object.values(this.chartInstances).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.chartInstances = {};
        
        const progress = this.calculateProgress();
        const testStats = this.calculateTestStats();
        
        // Get theme colors
        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#f1f5f9' : '#1e293b';
        const gridColor = isDark ? '#334155' : '#e2e8f0';
        
        // Mobile chart options
        const mobileChartOptions = {
            responsive: true,
            maintainAspectRatio: true,
            layout: {
                padding: this.isMobile ? 10 : 20
            },
            plugins: {
                legend: {
                    position: this.isMobile ? 'bottom' : 'right',
                    labels: {
                        boxWidth: this.isMobile ? 12 : 16,
                        padding: this.isMobile ? 10 : 20,
                        font: {
                            size: this.isMobile ? 11 : 12
                        }
                    }
                }
            }
        };
        
        // Progress Chart (Doughnut)
        const progressCtx = document.getElementById('progressChart');
        if (progressCtx) {
            this.chartInstances.progressChart = new Chart(progressCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Completed', 'Revised', 'Remaining'],
                    datasets: [{
                        data: [progress.completed, progress.revised, progress.remaining],
                        backgroundColor: ['#3b82f6', '#8b5cf6', '#64748b'],
                        borderColor: isDark ? '#1e293b' : '#ffffff',
                        borderWidth: 2,
                        hoverOffset: 15
                    }]
                },
                options: {
                    ...mobileChartOptions,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        ...mobileChartOptions.plugins,
                        tooltip: {
                            backgroundColor: isDark ? '#1e293b' : '#ffffff',
                            titleColor: textColor,
                            bodyColor: textColor,
                            borderColor: gridColor,
                            borderWidth: 1,
                            cornerRadius: 8
                        }
                    },
                    animation: {
                        animateScale: true,
                        animateRotate: true
                    }
                }
            });
        }
        
        // Subject Progress Chart (Bar)
        const subjectCtx = document.getElementById('subjectChart');
        if (subjectCtx) {
            const subjects = Object.keys(this.data.subjects);
            const percentages = subjects.map(subject => {
                const chapters = this.data.subjects[subject];
                const completed = chapters.filter(ch => ch.status === 'completed' || ch.status === 'revised').length;
                return chapters.length > 0 ? Math.round((completed / chapters.length) * 100) : 0;
            });
            
            this.chartInstances.subjectChart = new Chart(subjectCtx, {
                type: 'bar',
                data: {
                    labels: subjects,
                    datasets: [{
                        label: 'Completion %',
                        data: percentages,
                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                        borderColor: '#3b82f6',
                        borderWidth: 2,
                        borderRadius: 8,
                        hoverBackgroundColor: '#3b82f6'
                    }]
                },
                options: {
                    ...mobileChartOptions,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                color: textColor,
                                callback: function(value) {
                                    return value + '%';
                                },
                                font: {
                                    size: this.isMobile ? 10 : 11,
                                    weight: '600'
                                }
                            },
                            grid: {
                                color: gridColor,
                                drawBorder: false
                            }
                        },
                        x: {
                            ticks: {
                                color: textColor,
                                font: {
                                    size: this.isMobile ? 10 : 11,
                                    weight: '600'
                                }
                            },
                            grid: {
                                color: gridColor,
                                drawBorder: false
                            }
                        }
                    },
                    plugins: {
                        ...mobileChartOptions.plugins,
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: isDark ? '#1e293b' : '#ffffff',
                            titleColor: textColor,
                            bodyColor: textColor,
                            borderColor: gridColor,
                            borderWidth: 1,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    return `Completion: ${context.parsed.y}%`;
                                }
                            }
                        }
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeOutQuart'
                    }
                }
            });
        }
        
        // Test Trend Chart (Line)
        const testCtx = document.getElementById('testChart');
        if (testCtx) {
            const testChartContainer = testCtx.parentElement;
            
            if (this.data.mockTests.length > 1) {
                const tests = [...this.data.mockTests]
                    .sort((a, b) => new Date(a.date) - new Date(b.date));
                
                const labels = tests.map((test, index) => `Test ${index + 1}`);
                const data = tests.map(test => test.percentage);
                
                testCtx.style.display = 'block';
                testChartContainer.querySelector('.empty-state')?.remove();
                
                this.chartInstances.testChart = new Chart(testCtx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Score %',
                            data: data,
                            borderColor: '#3b82f6',
                            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '#3b82f6',
                            pointBorderColor: isDark ? '#1e293b' : '#ffffff',
                            pointBorderWidth: 2,
                            pointRadius: this.isMobile ? 4 : 5,
                            pointHoverRadius: this.isMobile ? 6 : 7
                        }]
                    },
                    options: {
                        ...mobileChartOptions,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 100,
                                ticks: {
                                    color: textColor,
                                    callback: function(value) {
                                        return value + '%';
                                    },
                                    font: {
                                        size: this.isMobile ? 10 : 11,
                                        weight: '600'
                                    }
                                },
                                grid: {
                                    color: gridColor,
                                    drawBorder: false
                                }
                            },
                            x: {
                                ticks: {
                                    color: textColor,
                                    font: {
                                        size: this.isMobile ? 10 : 11,
                                        weight: '600'
                                    }
                                },
                                grid: {
                                    color: gridColor,
                                    drawBorder: false
                                }
                            }
                        },
                        plugins: {
                            ...mobileChartOptions.plugins,
                            legend: {
                                labels: {
                                    color: textColor,
                                    font: {
                                        size: this.isMobile ? 11 : 12,
                                        weight: '600'
                                    }
                                }
                            },
                            tooltip: {
                                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                titleColor: textColor,
                                bodyColor: textColor,
                                borderColor: gridColor,
                                borderWidth: 1,
                                cornerRadius: 8
                            }
                        },
                        interaction: {
                            intersect: false,
                            mode: 'index'
                        },
                        animation: {
                            duration: 1000,
                            easing: 'easeOutQuart'
                        }
                    }
                });
            } else {
                // Show empty state
                testCtx.style.display = 'none';
                if (!testChartContainer.querySelector('.empty-state')) {
                    testChartContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-chart-line"></i>
                            <h3>No Test Data</h3>
                            <p>Add at least 2 mock tests to see trends</p>
                            <button class="btn" onclick="jeeTracker.showModal('testModal')" style="margin-top: 16px;">
                                <i class="fas fa-plus"></i> Add Test
                            </button>
                        </div>
                    `;
                }
            }
        }
    }

    renderMockTests() {
        const container = document.getElementById('testsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.data.mockTests.length === 0) {
            container.innerHTML = `
                <div class="card" style="text-align: center; padding: 60px 20px;">
                    <i class="fas fa-clipboard-list" style="font-size: 64px; color: var(--text-muted); opacity: 0.5; margin-bottom: 24px;"></i>
                    <h3 style="color: var(--text-secondary); margin-bottom: 12px;">No Mock Tests Recorded</h3>
                    <p style="color: var(--text-muted); margin-bottom: 32px; max-width: 400px; margin-left: auto; margin-right: auto;">
                        Track your mock test scores to analyze your performance over time
                    </p>
                    <button class="btn" id="addFirstTestBtn" style="min-width: 200px;">
                        <i class="fas fa-plus"></i> Add First Test
                    </button>
                </div>
            `;
            
            document.getElementById('addFirstTestBtn')?.addEventListener('click', () => {
                this.showModal('testModal');
            });
            
            return;
        }
        
        // Sort tests by date (newest first)
        const sortedTests = [...this.data.mockTests].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedTests.forEach((test, index) => {
            const originalIndex = this.data.mockTests.findIndex(t => t === test);
            const testDate = new Date(test.date);
            const today = new Date();
            const daysDiff = Math.floor((today - testDate) / (1000 * 60 * 60 * 24));
            let recencyBadge = '';
            
            if (daysDiff === 0) recencyBadge = '<span style="background: var(--status-done); color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; margin-left: 8px;">Today</span>';
            else if (daysDiff === 1) recencyBadge = '<span style="background: var(--status-partial); color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; margin-left: 8px;">Yesterday</span>';
            else if (daysDiff <= 7) recencyBadge = '<span style="background: var(--primary); color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; margin-left: 8px;">Recent</span>';
            
            const testCard = document.createElement('div');
            testCard.className = 'test-card';
            testCard.innerHTML = `
                <div class="test-header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="test-title">${test.title}</span>
                        ${recencyBadge}
                    </div>
                    <span class="test-date">${testDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                    })}</span>
                </div>
                <div class="test-scores">
                    <div class="score-item">
                        <div class="score-subject">Physics</div>
                        <div class="score-value">${test.physics}</div>
                    </div>
                    <div class="score-item">
                        <div class="score-subject">Chemistry</div>
                        <div class="score-value">${test.chemistry}</div>
                    </div>
                    <div class="score-item">
                        <div class="score-subject">Math</div>
                        <div class="score-value">${test.math}</div>
                    </div>
                </div>
                <div class="test-total">
                    Total: ${test.total}/300 · ${test.percentage}%
                </div>
                ${test.notes ? `
                    <div style="margin-top: 16px; padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-lg); font-size: 14px; color: var(--text-secondary); border-left: 3px solid var(--primary);">
                        <strong>Notes:</strong> ${test.notes}
                    </div>
                ` : ''}
                <button class="delete-test" data-index="${originalIndex}">
                    <i class="fas fa-trash"></i> Delete Test
                </button>
            `;
            
            container.appendChild(testCard);
        });
        
        // Add delete event listeners
        container.querySelectorAll('.delete-test').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.delete-test').dataset.index);
                this.deleteMockTest(index);
            });
        });
    }

    renderWeeklyPlanner() {
        const container = document.getElementById('weekGrid');
        if (!container) return;
        
        const weekDates = this.getWeekDates();
        const weekProgress = this.calculateWeekProgress();
        
        // Update week stats
        document.getElementById('weekCompletion').textContent = `${weekProgress.completionRate}%`;
        document.getElementById('tasksCompleted').textContent = weekProgress.doneDays;
        const plannerProgress = document.getElementById('plannerProgress');
        if (plannerProgress) {
            plannerProgress.style.width = `${weekProgress.completionRate}%`;
        }
        
        container.innerHTML = '';
        
        weekDates.forEach(day => {
            const dayData = this.data.weeklyPlanner[day.date] || { 
                status: 'not-done', 
                topics: '' 
            };
            
            const statusIcons = {
                'done': 'fa-check-circle',
                'partial': 'fa-minus-circle',
                'not-done': 'fa-times-circle'
            };
            
            const statusColors = {
                'done': 'var(--status-done)',
                'partial': 'var(--status-partial)',
                'not-done': 'var(--status-not-done)'
            };
            
            const dayCard = document.createElement('div');
            dayCard.className = 'day-card';
            dayCard.innerHTML = `
                <div class="day-header">
                    <div>
                        <div class="day-name">${day.day}</div>
                        <div class="day-date">${day.formattedDate}</div>
                    </div>
                    <i class="fas ${statusIcons[dayData.status]}" 
                       style="color: ${statusColors[dayData.status]}; font-size: 24px;"></i>
                </div>
                <div class="day-status">
                    <button class="day-status-btn done ${dayData.status === 'done' ? 'active' : ''}"
                            data-date="${day.date}" data-status="done">
                        <i class="fas fa-check"></i> Done
                    </button>
                    <button class="day-status-btn partial ${dayData.status === 'partial' ? 'active' : ''}"
                            data-date="${day.date}" data-status="partial">
                        <i class="fas fa-minus"></i> Half Done
                    </button>
                    <button class="day-status-btn not-done ${dayData.status === 'not-done' ? 'active' : ''}"
                            data-date="${day.date}" data-status="not-done">
                        <i class="fas fa-times"></i> Not Done
                    </button>
                </div>
                <div class="day-content">
                    <textarea data-date="${day.date}" 
                              placeholder="Enter topics to study for ${day.day}..." 
                              rows="4">${dayData.topics}</textarea>
                </div>
            `;
            
            container.appendChild(dayCard);
        });
        
        // Add event listeners
        container.querySelectorAll('.day-status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const btnElement = e.target.closest('.day-status-btn');
                const date = btnElement.dataset.date;
                const status = btnElement.dataset.status;
                this.updateDayStatus(date, status);
            });
        });
        
        container.querySelectorAll('textarea').forEach(textarea => {
            textarea.addEventListener('input', (e) => {
                const date = e.target.dataset.date;
                this.updateDayTopics(date, e.target.value);
            });
        });
    }

    updateDayStatus(date, status) {
        if (!this.data.weeklyPlanner[date]) {
            this.data.weeklyPlanner[date] = { status: status, topics: '' };
        } else {
            this.data.weeklyPlanner[date].status = status;
        }
        
        this.saveData();
        this.renderWeeklyPlanner();
        this.renderDashboard();
        this.showToast('Day status updated!', 'success');
    }

    updateDayTopics(date, topics) {
        if (!this.data.weeklyPlanner[date]) {
            this.data.weeklyPlanner[date] = { status: 'not-done', topics: topics };
        } else {
            this.data.weeklyPlanner[date].topics = topics;
        }
        
        // Auto-save is handled by blur event
    }

    saveMockTest() {
        const title = document.getElementById('testTitle').value.trim();
        const date = document.getElementById('testDate').value;
        const physics = parseInt(document.getElementById('physicsScore').value) || 0;
        const chemistry = parseInt(document.getElementById('chemistryScore').value) || 0;
        const math = parseInt(document.getElementById('mathScore').value) || 0;
        const notes = document.getElementById('testNotes').value.trim();
        
        if (!title) {
            this.showToast('Please enter test name', 'error');
            return;
        }
        
        if (!date) {
            this.showToast('Please select test date', 'error');
            return;
        }
        
        if (physics < 0 || physics > 100 || chemistry < 0 || chemistry > 100 || math < 0 || math > 100) {
            this.showToast('Please enter valid scores between 0 and 100', 'error');
            return;
        }
        
        const total = physics + chemistry + math;
        const percentage = Math.round((total / 300) * 100 * 10) / 10;
        
        const test = {
            title,
            date,
            physics,
            chemistry,
            math,
            total,
            percentage,
            notes
        };
        
        this.data.mockTests.push(test);
        this.saveData();
        this.closeAllModals();
        this.renderMockTests();
        this.renderDashboard();
        this.renderAnalysis();
        this.showToast('Mock test saved successfully!', 'success');
    }

    deleteMockTest(index) {
        if (confirm('Are you sure you want to delete this mock test?')) {
            const test = this.data.mockTests[index];
            this.data.mockTests.splice(index, 1);
            this.saveData();
            this.renderMockTests();
            this.renderDashboard();
            this.renderAnalysis();
            this.showToast(`Test "${test.title}" deleted`, 'success');
        }
    }

    saveWeeklyPlanner() {
        this.saveData();
        this.showToast('Weekly planner saved!', 'success');
    }

    clearWeeklyPlanner() {
        if (confirm('Are you sure you want to clear all weekly planner data?')) {
            this.data.weeklyPlanner = {};
            this.saveData();
            this.renderWeeklyPlanner();
            this.renderDashboard();
            this.showToast('Weekly planner cleared!', 'success');
        }
    }

    exportData() {
        const data = {
            subjects: this.data.subjects,
            mockTests: this.data.mockTests,
            weeklyPlanner: this.data.weeklyPlanner,
            exportDate: new Date().toISOString(),
            summary: {
                progress: this.calculateProgress(),
                testStats: this.calculateTestStats(),
                weekProgress: this.calculateWeekProgress()
            }
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', `jee-progress-${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('Data exported successfully!', 'success');
    }

    exportAsPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Add gradient-like effect for title
        doc.setFillColor(59, 130, 246);
        doc.rect(0, 0, 210, 30, 'F');
        
        // Add title with white color
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('JEE Progress Tracker Report', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setTextColor(240, 240, 240);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
        
        let yPos = 40;
        
        // Overall Progress
        doc.setFontSize(18);
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.text('Overall Progress', 20, yPos);
        yPos += 10;
        
        const progress = this.calculateProgress();
        doc.setFontSize(11);
        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'normal');
        doc.text(`Completion: ${progress.overallProgress}%`, 20, yPos);
        yPos += 7;
        doc.text(`Completed Chapters: ${progress.completed}`, 20, yPos);
        yPos += 7;
        doc.text(`Revised Chapters: ${progress.revised}`, 20, yPos);
        yPos += 7;
        doc.text(`Remaining Chapters: ${progress.remaining}`, 20, yPos);
        yPos += 15;
        
        // Subject-wise Progress
        doc.setFontSize(18);
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.text('Subject-wise Progress', 20, yPos);
        yPos += 10;
        
        doc.setFontSize(11);
        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'normal');
        for (const subject in this.data.subjects) {
            const chapters = this.data.subjects[subject];
            const completed = chapters.filter(ch => ch.status === 'completed' || ch.status === 'revised').length;
            const percentage = chapters.length > 0 ? Math.round((completed / chapters.length) * 100) : 0;
            
            doc.text(`${subject}: ${completed}/${chapters.length} chapters (${percentage}%)`, 20, yPos);
            yPos += 7;
            
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
        }
        yPos += 8;
        
        // Mock Test Performance
        const testStats = this.calculateTestStats();
        doc.setFontSize(18);
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.text('Mock Test Performance', 20, yPos);
        yPos += 10;
        
        doc.setFontSize(11);
        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'normal');
        doc.text(`Tests Taken: ${testStats.totalTests}`, 20, yPos);
        yPos += 7;
        doc.text(`Average Score: ${testStats.averageScore}%`, 20, yPos);
        yPos += 7;
        doc.text(`Highest Score: ${testStats.highestScore}%`, 20, yPos);
        yPos += 15;
        
        // Weekly Planner Summary
        const weekProgress = this.calculateWeekProgress();
        doc.setFontSize(18);
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.text('Weekly Planner Summary', 20, yPos);
        yPos += 10;
        
        doc.setFontSize(11);
        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'normal');
        doc.text(`Week Completion: ${weekProgress.completionRate}%`, 20, yPos);
        yPos += 7;
        doc.text(`Days Completed: ${weekProgress.doneDays}`, 20, yPos);
        yPos += 7;
        doc.text(`Days Half Done: ${weekProgress.partialDays}`, 20, yPos);
        yPos += 7;
        doc.text(`Days Not Done: ${weekProgress.notDoneDays}`, 20, yPos);
        
        // Add footer
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184);
        doc.text('JEE Progress Tracker - Generated Report', 105, 285, { align: 'center' });
        
        // Save the PDF
        doc.save(`jee-progress-report-${new Date().toISOString().split('T')[0]}.pdf`);
        
        this.showToast('PDF exported successfully!', 'success');
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.jeeTracker = new JEEProgressTracker();
    
    // Add loading animation to buttons on click
    document.addEventListener('click', (e) => {
        if (e.target.matches('.btn:not(.modal-close)')) {
            const btn = e.target.closest('.btn');
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<span class="loading"></span> Loading...';
            btn.disabled = true;
            
            setTimeout(() => {
                btn.innerHTML = originalContent;
                btn.disabled = false;
            }, 1000);
        }
    });
});