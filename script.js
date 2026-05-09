// TrackTaps - Logic with Subject-Wise Attendance Management
document.addEventListener('DOMContentLoaded', () => {
    console.log('TrackTaps initialized 🚀');

    // --- State Management ---
    let currentDate = new Date();
    let selectedDateStr = null;
    let selectedDates = [];
    let attendanceData = JSON.parse(localStorage.getItem('tracktaps_attendance')) || {};
    let subjectsData = JSON.parse(localStorage.getItem('tracktaps_subjects')) || [];
    let isMultiSelectMode = false;
    let timetableData = JSON.parse(localStorage.getItem('tracktaps_timetable')) || [];
    let historyData = JSON.parse(localStorage.getItem('tracktaps_history')) || [];
    let editingSlotId = null;
    let settingsData = JSON.parse(localStorage.getItem('tracktaps_settings')) || {
        userName: '',
        collegeName: '',
        acadYear: '',
        semester: '',
        defaultCriteria: 75,
        warningThreshold: 80,
        criticalThreshold: 65,
        theme: 'purple',
        displayMode: 'dark',
        glassEffect: true,
        defaultDuration: 60,
        gridStartHour: 8,
        gridEndHour: 18
    };

    // --- Elements ---
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');
    const calendarGrid = document.getElementById('calendar-grid');
    const subjectsGrid = document.getElementById('subjects-grid');
    const monthYearText = document.getElementById('month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');

    // Attendance Modal Elements
    const modal = document.getElementById('attendance-modal');
    const modalDateText = document.getElementById('modal-date');
    const closeModalBtn = document.querySelector('.close-modal');
    const actionButtons = document.querySelectorAll('.action-btn');

    // Subject Modal Elements
    const subjectModal = document.getElementById('subject-modal');
    const subjectModalTitle = document.getElementById('subject-modal-title');
    const subjectNameInput = document.getElementById('subject-name');
    const subjectCriteriaInput = document.getElementById('subject-criteria');
    const saveSubjectBtn = document.getElementById('save-subject-btn');
    const cancelSubjectBtn = document.getElementById('cancel-subject-btn');
    const addSubjectBtn = document.getElementById('add-subject-btn');

    // Bulk Bar Elements
    const bulkBar = document.getElementById('bulk-action-bar');
    const bulkCountText = document.getElementById('bulk-count');
    const bulkButtons = document.querySelectorAll('.bulk-btn');
    const cancelSelectionBtn = document.getElementById('cancel-selection');

    // Timetable Modal Elements
    const timetableGrid = document.getElementById('timetable-grid');
    const timetableModal = document.getElementById('timetable-modal');
    const timetableModalTitle = document.getElementById('timetable-modal-title');
    const slotSubjectInput = document.getElementById('slot-subject');
    const slotStartTimeInput = document.getElementById('slot-start-time');
    const slotEndTimeInput = document.getElementById('slot-end-time');
    const slotRoomInput = document.getElementById('slot-room');
    const slotTeacherInput = document.getElementById('slot-teacher');
    const saveSlotBtn = document.getElementById('save-slot-btn');
    const deleteSlotBtn = document.getElementById('delete-slot-btn');
    const cancelSlotBtn = document.getElementById('cancel-slot-btn');

    const showToast = (message) => {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(139, 92, 246, 0.9);
            color: white;
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            z-index: 2000;
            backdrop-filter: blur(8px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            pointer-events: none;
            animation: toast-in 0.3s ease forwards, toast-out 0.3s ease 2.7s forwards;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    // Add toast animations to head
    const style = document.createElement('style');
    style.textContent = `
        @keyframes toast-in { from { bottom: 80px; opacity: 0; } to { bottom: 100px; opacity: 1; } }
        @keyframes toast-out { from { bottom: 100px; opacity: 1; } to { bottom: 120px; opacity: 0; } }
    `;
    document.head.appendChild(style);

    // --- Core UI Functions ---
    const renderHomeDashboard = () => {
        const heroGreeting = document.getElementById('hero-greeting');
        const heroSubtitle = document.getElementById('hero-subtitle');
        const heroDate = document.getElementById('hero-date');
        const heroOverallPerc = document.getElementById('hero-overall-perc');
        const overviewPerc = document.getElementById('overview-perc');
        const progressRingBar = document.getElementById('progress-ring-bar');
        const statPresent = document.getElementById('stat-present');
        const statMissed = document.getElementById('stat-missed');
        const statTotal = document.getElementById('stat-total');
        const statTotalSubjects = document.getElementById('stat-total-subjects');
        const statSafeSubjects = document.getElementById('stat-safe-subjects');
        const statWarningSubjects = document.getElementById('stat-warning-subjects');
        const statCriticalSubjects = document.getElementById('stat-critical-subjects');
        const scheduleList = document.getElementById('dashboard-schedule-list');
        const insightPills = document.getElementById('dashboard-insight-pills');
        const todayDayName = document.getElementById('today-day-name');

        if (!heroGreeting) return;

        // 1. Hero Section
        const now = new Date();
        const hours = now.getHours();
        let greeting = "Good Morning";
        if (hours >= 12 && hours < 17) greeting = "Good Afternoon";
        else if (hours >= 17) greeting = "Good Evening";

        const displayGreeting = settingsData.userName ? `${greeting}, ${settingsData.userName.split(' ')[0]}` : `${greeting},`;
        heroGreeting.textContent = displayGreeting;
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        heroDate.textContent = now.toLocaleDateString('en-US', options);

        const subtitles = [
            "Ready to crush your goals today?",
            "Consistency is the key to success.",
            "Stay on track, stay ahead.",
            "Your future self will thank you.",
            "Every class counts towards your dream."
        ];
        heroSubtitle.textContent = subtitles[Math.floor(Math.random() * subtitles.length)];

        // 2. Attendance Overview & Stats
        let totalAttended = 0;
        let totalClasses = 0;
        let safeCount = 0;
        let warningCount = 0;
        let criticalCount = 0;

        subjectsData.forEach(subject => {
            const percentage = subject.total > 0 ? (subject.attended / subject.total) * 100 : 0;
            const criteria = subject.criteria || 75;
            totalAttended += subject.attended;
            totalClasses += subject.total;

            if (percentage >= criteria) safeCount++;
            else if (percentage >= (criteria - 10)) warningCount++;
            else criticalCount++;
        });

        const overallPercentage = totalClasses > 0 ? ((totalAttended / totalClasses) * 100).toFixed(1) : 0;

        if (heroOverallPerc) heroOverallPerc.textContent = `${overallPercentage}%`;
        if (overviewPerc) overviewPerc.textContent = `${overallPercentage}%`;

        if (progressRingBar) {
            const radius = progressRingBar.r.baseVal.value;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (overallPercentage / 100) * circumference;
            progressRingBar.style.strokeDashoffset = offset;
        }

        if (statPresent) statPresent.textContent = totalAttended;
        if (statMissed) statMissed.textContent = totalClasses - totalAttended;
        if (statTotal) statTotal.textContent = totalClasses;

        if (statTotalSubjects) statTotalSubjects.textContent = subjectsData.length;
        if (statSafeSubjects) statSafeSubjects.textContent = safeCount;
        if (statWarningSubjects) statWarningSubjects.textContent = warningCount;
        if (statCriticalSubjects) statCriticalSubjects.textContent = criticalCount;

        // 3. Today's Schedule
        if (scheduleList) {
            const dayIndex = now.getDay();
            const adjustedDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            if (todayDayName) todayDayName.textContent = days[adjustedDayIndex];

            const todaySlots = timetableData
                .filter(s => s.dayIndex === adjustedDayIndex)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));

            if (todaySlots.length === 0) {
                scheduleList.innerHTML = '<p style="color: #64748b; font-size: 13px; text-align: center; padding: 20px;">No classes today. Enjoy your day!</p>';
            } else {
                scheduleList.innerHTML = todaySlots.map(slot => `
                    <div class="schedule-item">
                        <div class="schedule-item-info">
                            <span class="schedule-item-name">${slot.subject}</span>
                            <span class="schedule-item-time">${slot.startTime} - ${slot.endTime}</span>
                        </div>
                        ${slot.room ? `<span class="schedule-item-room">${slot.room}</span>` : ''}
                    </div>
                `).join('');
            }
        }

        // 4. Insights & Alerts
        if (insightPills) {
            let pillsHtml = '';

            if (criticalCount > 0) {
                pillsHtml += `
                    <div class="insight-pill warning">
                        <span>⚠️ ${criticalCount} subject${criticalCount > 1 ? 's are' : ' is'} in critical attendance. Act now!</span>
                    </div>
                `;
            } else if (warningCount > 0) {
                pillsHtml += `
                    <div class="insight-pill info">
                        <span>💡 ${warningCount} subject${warningCount > 1 ? 's' : ''} nearing criteria. Stay consistent.</span>
                    </div>
                `;
            } else if (subjectsData.length > 0) {
                pillsHtml += `
                    <div class="insight-pill success">
                        <span>✅ All subjects are safe. Keep it up!</span>
                    </div>
                `;
            } else {
                pillsHtml += `
                    <div class="insight-pill info">
                        <span>👋 Welcome! Add your subjects to start tracking.</span>
                    </div>
                `;
            }

            // Attendance tip
            const tips = [
                "Tip: Marking attendance daily ensures data accuracy.",
                "Tip: Use the calendar for bulk attendance marking.",
                "Tip: Check 'Insights' for detailed recovery plans.",
                "Tip: Export backups regularly to keep your data safe."
            ];
            pillsHtml += `
                <div class="insight-pill info" style="background: rgba(139, 92, 246, 0.05); border-color: rgba(139, 92, 246, 0.1);">
                    <span>${tips[Math.floor(Math.random() * tips.length)]}</span>
                </div>
            `;

            insightPills.innerHTML = pillsHtml;
        }

        // 5. Lightweight SVG Trend (Static placeholder for now, could be dynamic later)
        const trendContainer = document.getElementById('attendance-trend-svg');
        if (trendContainer) {
            trendContainer.innerHTML = `
                <svg viewBox="0 0 200 60" preserveAspectRatio="none" style="width: 100%; height: 100%;">
                    <path d="M0,50 Q40,45 80,48 T160,35 T200,30" fill="none" stroke="#8b5cf6" stroke-width="2" />
                    <path d="M0,50 Q40,45 80,48 T160,35 T200,30 V60 H0 Z" fill="url(#grad)" opacity="0.1" />
                    <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:0" />
                        </linearGradient>
                    </defs>
                </svg>
            `;
        }
    };

    const updateHeader = () => {
        renderHomeDashboard();
    };

    const switchView = (targetViewId, updateUrl = true) => {
        const routeMap = {
            'home-view': '/',
            'calendar-view': '/calendar',
            'timetable-view': '/timetable',
            'subjects-view': '/subjects',
            'history-view': '/history',
            'insights-view': '/insights',
            'about-view': '/about',
            'settings-view': '/settings'
        };

        views.forEach(view => {
            view.classList.remove('active');
            if (view.id === targetViewId) {
                view.classList.add('active');
            }
        });

        // Update nav buttons active state
        navButtons.forEach(btn => {
            const viewName = btn.innerText.toLowerCase().trim();
            btn.classList.remove('active');
            if (routeMap[targetViewId].substring(1) === viewName || (targetViewId === 'home-view' && viewName === 'home')) {
                btn.classList.add('active');
            }
        });

        // Update mobile nav buttons
        document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === targetViewId) {
                btn.classList.add('active');
            }
        });

        if (updateUrl) {
            const url = routeMap[targetViewId] || '/';
            window.history.pushState({ viewId: targetViewId }, '', url);
        }

        if (targetViewId === 'home-view') renderHomeDashboard();
        if (targetViewId === 'subjects-view') renderSubjects();
        if (targetViewId === 'timetable-view') renderTimetable();
        if (targetViewId === 'insights-view') renderInsights();
        if (targetViewId === 'history-view') renderHistory();
    };

    // Make switchView global for onclick attributes
    window.switchView = switchView;

    const handleRouting = () => {
        const path = window.location.pathname;
        const pathToView = {
            '/': 'home-view',
            '/calendar': 'calendar-view',
            '/timetable': 'timetable-view',
            '/subjects': 'subjects-view',
            '/history': 'history-view',
            '/insights': 'insights-view',
            '/about': 'about-view',
            '/settings': 'settings-view'
        };

        const viewId = pathToView[path] || 'home-view';
        switchView(viewId, false);
    };

    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.viewId) {
            switchView(event.state.viewId, false);
        } else {
            handleRouting();
        }
    });

    // --- Calendar Logic ---
    const renderCalendar = () => {
        if (!calendarGrid) return;
        calendarGrid.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        monthYearText.textContent = `${monthNames[month]} ${year}`;

        let firstDay = new Date(year, month, 1).getDay();
        firstDay = firstDay === 0 ? 6 : firstDay - 1;

        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Helper to check for history on a date
        const hasHistory = (dateStr) => {
            return historyData.some(entry => {
                const d = new Date(entry.date);
                const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                return ds === dateStr;
            });
        };

        for (let i = 0; i < firstDay; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.classList.add('calendar-day', 'empty');
            calendarGrid.appendChild(emptyDiv);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('calendar-day');
            dayDiv.textContent = day;

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            if (attendanceData[dateStr]) {
                const data = attendanceData[dateStr];
                if (typeof data === 'string') {
                    dayDiv.classList.add(`status-${data}`);
                } else {
                    const statuses = Object.values(data);
                    if (statuses.includes('absent')) dayDiv.classList.add('status-absent');
                    else if (statuses.includes('present')) dayDiv.classList.add('status-present');
                    else if (statuses.includes('offday')) dayDiv.classList.add('status-offday');
                }
            }

            if (selectedDates.includes(dateStr)) {
                dayDiv.classList.add('selected');
            }

            if (hasHistory(dateStr)) {
                const dot = document.createElement('div');
                dot.style.width = '4px';
                dot.style.height = '4px';
                dot.style.borderRadius = '50%';
                dot.style.background = '#8b5cf6';
                dot.style.position = 'absolute';
                dot.style.bottom = '6px';
                dot.style.left = '50%';
                dot.style.transform = 'translateX(-50%)';
                dot.style.boxShadow = '0 0 5px rgba(139, 92, 246, 0.5)';
                dayDiv.style.position = 'relative';
                dayDiv.appendChild(dot);
            }

            const today = new Date();
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayDiv.classList.add('today');
            }

            dayDiv.addEventListener('click', (e) => {
                if (e.ctrlKey || e.metaKey || isMultiSelectMode) {
                    toggleDateSelection(dateStr, dayDiv);
                } else {
                    openAttendanceModal(dateStr, day, monthNames[month], year, dayDiv);
                }
            });

            dayDiv.addEventListener('touchstart', (e) => {
                longPressTimer = setTimeout(() => {
                    if (!isMultiSelectMode) {
                        isMultiSelectMode = true;
                        toggleDateSelection(dateStr, dayDiv);
                        if (window.navigator.vibrate) window.navigator.vibrate(50);
                    }
                }, 600);
            }, { passive: true });

            dayDiv.addEventListener('touchend', () => clearTimeout(longPressTimer));

            calendarGrid.appendChild(dayDiv);
        }
    };

    // --- Multi-Select Logic ---
    const toggleDateSelection = (dateStr, el) => {
        const index = selectedDates.indexOf(dateStr);
        if (index > -1) {
            selectedDates.splice(index, 1);
            el.classList.remove('selected');
        } else {
            selectedDates.push(dateStr);
            el.classList.add('selected');
        }
        updateBulkBar();
    };

    const updateBulkBar = () => {
        if (selectedDates.length > 1) {
            isMultiSelectMode = true;
            bulkCountText.textContent = `${selectedDates.length} dates selected`;
            bulkBar.classList.add('active');
        } else {
            isMultiSelectMode = selectedDates.length === 1;
            bulkBar.classList.remove('active');
        }
    };

    const clearSelection = () => {
        selectedDates = [];
        isMultiSelectMode = false;
        document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('selected'));
        bulkBar.classList.remove('active');
    };

    // --- Subjects Logic ---
    const renderSubjects = () => {
        if (!subjectsGrid) return;
        subjectsGrid.innerHTML = '';

        subjectsData.forEach(subject => {
            const percentage = subject.total > 0 ? ((subject.attended / subject.total) * 100).toFixed(1) : 0;
            const criteria = subject.criteria || 75;
            const missed = subject.total - subject.attended;

            let status = 'SAFE';
            let colorClass = 'percentage-safe';
            let message = '';

            if (percentage < (criteria - 10)) {
                status = 'CRITICAL';
                colorClass = 'percentage-danger';
                const recovery = Math.ceil((criteria / 100 * subject.total - subject.attended) / (1 - criteria / 100));
                message = `Attend ${recovery} more classes to recover`;
            } else if (percentage < criteria) {
                status = 'WARNING';
                colorClass = 'percentage-warning';
                const recovery = Math.ceil((criteria / 100 * subject.total - subject.attended) / (1 - criteria / 100));
                message = `Attend ${recovery} more classes to stay safe`;
            } else {
                const missable = Math.floor((subject.attended / (criteria / 100)) - subject.total);
                message = missable > 0 ? `You can miss ${missable} more classes safely` : "Don't miss the next class!";
            }

            const card = document.createElement('div');
            card.classList.add('subject-card');
            card.innerHTML = `
                <div class="subject-info">
                    <div>
                        <span class="subject-name">${subject.name}</span>
                        <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Goal: ${criteria}%</div>
                    </div>
                    <div style="text-align: right;">
                        <span class="subject-percentage ${colorClass}">${percentage}%</span>
                        <div class="status-label ${colorClass.replace('percentage', 'status')}" style="font-size: 9px; margin-top: 4px; padding: 2px 6px;">${status}</div>
                    </div>
                </div>
                <div style="font-size: 11px; color: ${status === 'SAFE' ? '#10b981' : (status === 'WARNING' ? '#f59e0b' : '#ef4444')}; font-weight: 500;">${message}</div>
                <div class="subject-stats">
                    <div class="stat-box">
                        <span class="label">Attended</span>
                        <span class="value">${subject.attended}</span>
                    </div>
                    <div class="stat-box">
                        <span class="label">Missed</span>
                        <span class="value">${missed}</span>
                    </div>
                    <div class="stat-box">
                        <span class="label">Total</span>
                        <span class="value">${subject.total}</span>
                    </div>
                </div>
                <div class="subject-actions">
                    <div class="attendance-controls">
                        <button class="primary-btn present-btn" style="padding: 6px 12px; font-size: 11px; background: #10b981; min-width: 65px;">Present</button>
                        <button class="primary-btn absent-btn" style="padding: 6px 12px; font-size: 11px; background: #ef4444; min-width: 65px;">Absent</button>
                    </div>
                    <div class="edit-delete">
                        <button class="text-btn edit">Edit</button>
                        <button class="text-btn delete">Delete</button>
                    </div>
                </div>
            `;

            // Actions
            card.querySelector('.present-btn').addEventListener('click', () => recordAttendance(subject.id, 'present'));
            card.querySelector('.absent-btn').addEventListener('click', () => recordAttendance(subject.id, 'absent'));
            card.querySelector('.edit').addEventListener('click', () => openSubjectModal(subject));
            card.querySelector('.delete').addEventListener('click', () => deleteSubject(subject.id));

            subjectsGrid.appendChild(card);
        });
        updateShortageAlerts();
    };

    const recordAttendance = (subjectId, status) => {
        const subject = subjectsData.find(s => s.id === subjectId);
        if (!subject) return;

        const entry = {
            id: Date.now(),
            subjectId: subject.id,
            subjectName: subject.name,
            status: status,
            date: new Date().toISOString()
        };

        if (status === 'present') {
            subject.attended++;
            subject.total++;
        } else {
            subject.total++;
        }

        historyData.unshift(entry);
        localStorage.setItem('tracktaps_subjects', JSON.stringify(subjectsData));
        localStorage.setItem('tracktaps_history', JSON.stringify(historyData));

        renderSubjects();
        renderInsights();
        updateShortageAlerts();
    };

    const updateShortageAlerts = () => {
        renderHomeDashboard();
    };

    const renderHistory = () => {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;

        historyList.innerHTML = '';
        if (historyData.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; color: #94a3b8; padding: 20px;">No history records yet.</p>';
            return;
        }

        historyData.forEach(entry => {
            const date = new Date(entry.date);
            const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            const card = document.createElement('div');
            card.classList.add('greeting-card'); // Using existing card style
            card.style.padding = '16px 20px';
            card.style.display = 'flex';
            card.style.justifyContent = 'space-between';
            card.style.alignItems = 'center';
            card.style.marginBottom = '12px';

            card.innerHTML = `
                <div>
                    <h4 style="margin: 0; color: #f8fafc;">${entry.subjectName}</h4>
                    <span style="font-size: 12px; color: #94a3b8;">${dateStr}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="status-label ${entry.status === 'present' ? 'status-safe' : 'status-critical'}" style="padding: 4px 12px; font-size: 11px;">${entry.status.toUpperCase()}</span>
                    <button class="text-btn delete-history" style="color: #ef4444; font-size: 20px; padding: 4px;">&times;</button>
                </div>
            `;

            card.querySelector('.delete-history').addEventListener('click', () => deleteHistoryEntry(entry.id));
            historyList.appendChild(card);
        });
    };

    const deleteHistoryEntry = (entryId) => {
        if (!confirm('Delete this history record?')) return;

        const index = historyData.findIndex(h => h.id === entryId);
        if (index === -1) return;

        const entry = historyData[index];
        const subject = subjectsData.find(s => s.id === entry.subjectId);

        if (subject) {
            if (entry.status === 'present') {
                subject.attended = Math.max(0, subject.attended - 1);
                subject.total = Math.max(0, subject.total - 1);
            } else {
                subject.total = Math.max(0, subject.total - 1);
            }
        }

        historyData.splice(index, 1);
        localStorage.setItem('tracktaps_subjects', JSON.stringify(subjectsData));
        localStorage.setItem('tracktaps_history', JSON.stringify(historyData));

        renderSubjects();
        renderInsights();
        renderHistory();
        renderHomeDashboard();
    };

    const exportData = () => {
        const data = {
            attendance: attendanceData,
            subjects: subjectsData,
            timetable: timetableData,
            history: historyData,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tracktaps_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('Backup exported successfully! 📥');
    };

    const importData = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!data.subjects || !data.attendance) {
                    throw new Error('Invalid backup file format');
                }

                if (confirm('Restoring will overwrite all current data. Continue?')) {
                    localStorage.setItem('tracktaps_attendance', JSON.stringify(data.attendance || {}));
                    localStorage.setItem('tracktaps_subjects', JSON.stringify(data.subjects || []));
                    localStorage.setItem('tracktaps_timetable', JSON.stringify(data.timetable || []));
                    localStorage.setItem('tracktaps_history', JSON.stringify(data.history || []));

                    alert('Data restored successfully! 📤 The app will refresh.');
                    window.location.reload();
                }
            } catch (err) {
                alert('Error importing backup: ' + err.message);
            }
        };
        reader.readAsText(file);
    };

    const resetData = () => {
        if (confirm('⚠️ WARNING: This will permanently delete ALL your subjects, attendance, and timetable data. This cannot be undone. Are you sure?')) {
            localStorage.clear();
            alert('All data has been reset. 🗑️ The app will refresh.');
            window.location.reload();
        }
    };

    const openSubjectModal = (subject = null) => {
        if (subject) {
            editingSubjectId = subject.id;
            subjectModalTitle.textContent = 'Edit Subject';
            subjectNameInput.value = subject.name;
            subjectCriteriaInput.value = subject.criteria || 75;
        } else {
            editingSubjectId = null;
            subjectModalTitle.textContent = 'Add Subject';
            subjectNameInput.value = '';
            subjectCriteriaInput.value = 75;
        }
        subjectModal.classList.add('active');
    };

    const saveSubject = () => {
        const name = subjectNameInput.value.trim();
        const criteria = parseInt(subjectCriteriaInput.value) || 75;

        if (!name) return alert('Please enter subject name');

        if (editingSubjectId) {
            const index = subjectsData.findIndex(s => s.id === editingSubjectId);
            subjectsData[index] = { ...subjectsData[index], name, criteria };
        } else {
            subjectsData.push({
                id: Date.now(),
                name,
                criteria,
                attended: 0,
                total: 0
            });
        }

        localStorage.setItem('tracktaps_subjects', JSON.stringify(subjectsData));
        subjectModal.classList.remove('active');
        renderSubjects();
    };

    const deleteSubject = (id) => {
        if (confirm('Are you sure you want to delete this subject? All linked timetable entries will also be removed.')) {
            // Remove linked timetable entries
            timetableData = timetableData.filter(s => s.subjectId !== id);
            localStorage.setItem('tracktaps_timetable', JSON.stringify(timetableData));

            subjectsData = subjectsData.filter(s => s.id !== id);
            localStorage.setItem('tracktaps_subjects', JSON.stringify(subjectsData));

            renderSubjects();
            renderTimetable();
        }
    };

    const updateSubjectAttendance = (id, attendedInc, totalInc) => {
        const index = subjectsData.findIndex(s => s.id === id);
        subjectsData[index].attended += attendedInc;
        subjectsData[index].total += totalInc;
        localStorage.setItem('tracktaps_subjects', JSON.stringify(subjectsData));
        renderSubjects();
        renderInsights(); // Update insights whenever subjects are updated
    };

    // --- Insights Logic ---
    const renderInsights = () => {
        const insightsGrid = document.getElementById('insights-grid');
        const overallSummaryCard = document.getElementById('overall-summary-card');
        if (!insightsGrid || !overallSummaryCard) return;

        insightsGrid.innerHTML = '';

        let totalAttended = 0;
        let totalClasses = 0;
        let safeCount = 0;
        let criticalCount = 0;

        subjectsData.forEach(subject => {
            const percentage = subject.total > 0 ? (subject.attended / subject.total) * 100 : 0;
            totalAttended += subject.attended;
            totalClasses += subject.total;

            let status = 'Critical';
            let statusClass = 'status-critical';
            let predictionText = '';
            let predictionClass = 'critical';

            if (percentage >= 75) {
                status = 'Safe';
                statusClass = 'status-safe';
                safeCount++;
                const missable = Math.floor((subject.attended / 0.75) - subject.total);
                predictionText = missable > 0 ? `You can miss <strong>${missable}</strong> more class${missable > 1 ? 'es' : ''} while staying safe.` : "Don't miss the next class to stay safe!";
                predictionClass = 'safe';
            } else if (percentage >= 65) {
                status = 'Warning';
                statusClass = 'status-warning';
                const recovery = Math.ceil((0.75 * subject.total - subject.attended) / 0.25);
                predictionText = `Attend <strong>${recovery}</strong> more consecutive class${recovery > 1 ? 'es' : ''} to reach 75%.`;
                predictionClass = 'warning';
            } else {
                status = 'Critical';
                statusClass = 'status-critical';
                criticalCount++;
                const recovery = Math.ceil((0.75 * subject.total - subject.attended) / 0.25);
                predictionText = `Attend <strong>${recovery}</strong> more classes to recover to 75%.`;
                predictionClass = 'critical';
            }

            const card = document.createElement('div');
            card.classList.add('insight-item-card');
            card.innerHTML = `
                <div class="insight-header">
                    <span class="subject-name">${subject.name}</span>
                    <span class="status-label ${statusClass}">${status}</span>
                </div>
                <div class="subject-percentage" style="font-size: 32px; font-weight: 700; color: #f8fafc; margin: 8px 0;">${percentage.toFixed(1)}%</div>
                <div class="prediction-box ${predictionClass}">
                    <p class="prediction-text">${predictionText}</p>
                </div>
            `;
            insightsGrid.appendChild(card);
        });

        const overallPercentage = totalClasses > 0 ? ((totalAttended / totalClasses) * 100).toFixed(1) : 0;

        overallSummaryCard.innerHTML = `
            <div class="summary-item">
                <span class="summary-label">Overall</span>
                <span class="summary-value">${overallPercentage}%</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Subjects</span>
                <span class="summary-value">${subjectsData.length}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Safe</span>
                <span class="summary-value" style="color: #10b981;">${safeCount}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Critical</span>
                <span class="summary-value" style="color: #ef4444;">${criticalCount}</span>
            </div>
        `;
    };

    const updateHomeBadges = (overall, attended, total, criticals) => {
        renderHomeDashboard();
    };

    const updateDynamicMessage = (overall, criticals) => {
        // This is now handled within renderHomeDashboard()
    };

    // --- Timetable Logic ---
    let selectedTimetableDay = new Date().getDay(); // 0-6 (Sun-Sat)
    selectedTimetableDay = selectedTimetableDay === 0 ? 6 : selectedTimetableDay - 1; // Adjust to 0=Mon, 6=Sun

    const renderTimetable = () => {
        const desktopGrid = document.getElementById('timetable-grid');
        const dayView = document.getElementById('timetable-day-view');
        if (!desktopGrid || !dayView) return;

        desktopGrid.innerHTML = '';
        dayView.innerHTML = '';

        // --- Render Day Tabs ---
        const todayIndex = new Date().getDay();
        const adjustedToday = todayIndex === 0 ? 6 : todayIndex - 1;

        document.querySelectorAll('.day-tab').forEach(tab => {
            const dayIdx = parseInt(tab.dataset.day);
            tab.classList.remove('active', 'today-highlight');
            if (dayIdx === selectedTimetableDay) tab.classList.add('active');
            if (dayIdx === adjustedToday) tab.classList.add('today-highlight');

            // Add click listener if not already added
            if (!tab.dataset.listenerAdded) {
                tab.addEventListener('click', () => {
                    selectedTimetableDay = dayIdx;
                    renderTimetable();
                });
                tab.dataset.listenerAdded = 'true';
            }
        });

        // --- Render Desktop Grid ---
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const startHour = 8;
        const startMin = 30;

        // Generate 9 rows (9 hours) starting from 8:30 AM to 5:30 PM
        const rowTimes = Array.from({ length: 9 }, (_, i) => {
            const totalMin = (startHour * 60 + startMin) + (i * 60);
            const h = Math.floor(totalMin / 60);
            const m = totalMin % 60;
            const displayH = h > 12 ? h - 12 : h;
            const ampm = h >= 12 ? 'PM' : 'AM';
            return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
        });

        const corner = document.createElement('div');
        corner.classList.add('timetable-header-cell', 'corner');
        desktopGrid.appendChild(corner);

        days.forEach((day, index) => {
            const cell = document.createElement('div');
            cell.classList.add('timetable-header-cell');
            if (index === adjustedToday) cell.classList.add('today');
            cell.textContent = day;
            desktopGrid.appendChild(cell);
        });

        rowTimes.forEach((timeStr, i) => {
            const timeLabel = document.createElement('div');
            timeLabel.classList.add('time-cell');
            timeLabel.textContent = timeStr;
            desktopGrid.appendChild(timeLabel);

            const rowHour = startHour + i; // Approximate for click handler
            for (let d = 0; d < 7; d++) {
                const cell = document.createElement('div');
                cell.classList.add('timetable-cell');
                if (d === adjustedToday) cell.classList.add('today');
                cell.addEventListener('click', () => openTimetableModal(null, d, rowHour));
                desktopGrid.appendChild(cell);
            }
        });

        // --- Render Mobile Day View ---
        const daySlots = timetableData
            .filter(s => s.dayIndex === selectedTimetableDay)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

        if (daySlots.length === 0) {
            dayView.innerHTML = '<p style="text-align: center; color: #64748b; padding: 40px; background: rgba(15, 23, 42, 0.2); border-radius: 18px; border: 1px dashed rgba(255,255,255,0.05);">No classes scheduled for this day.</p>';
        } else {
            daySlots.forEach(slot => {
                const subColor = getSubjectColor(slot.subject);
                const block = document.createElement('div');
                block.classList.add('schedule-block');
                block.style.borderLeft = `4px solid ${subColor.replace('0.25', '1')}`;
                block.innerHTML = `
                    <div class="block-time">${slot.startTime} - ${slot.endTime}</div>
                    <div class="block-details">
                        <div class="block-subject">${slot.subject}</div>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            ${slot.room ? `<div class="block-room">📍 ${slot.room}</div>` : ''}
                            ${slot.teacher ? `<div class="block-room" style="color: #a855f7;">👤 ${slot.teacher}</div>` : ''}
                        </div>
                    </div>
                    <div class="quick-actions" style="display: flex; gap: 6px;">
                        <button class="quick-btn p" title="Present" style="width: 32px; height: 32px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.1); color: #10b981; font-weight: 700; font-size: 12px;">P</button>
                        <button class="quick-btn a" title="Absent" style="width: 32px; height: 32px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1); color: #ef4444; font-weight: 700; font-size: 12px;">A</button>
                    </div>
                `;

                block.querySelector('.block-details').addEventListener('click', () => openTimetableModal(slot));
                block.querySelector('.block-time').addEventListener('click', () => openTimetableModal(slot));

                block.querySelector('.quick-btn.p').addEventListener('click', (e) => {
                    e.stopPropagation();
                    recordAttendance(slot.subjectId, 'present');
                    showToast(`Marked ${slot.subject} as Present`);
                });

                block.querySelector('.quick-btn.a').addEventListener('click', (e) => {
                    e.stopPropagation();
                    recordAttendance(slot.subjectId, 'absent');
                    showToast(`Marked ${slot.subject} as Absent`);
                });

                dayView.appendChild(block);
            });
        }

        const addBtn = document.createElement('div');
        addBtn.classList.add('add-block-btn');
        addBtn.textContent = '+ Add Class';
        addBtn.addEventListener('click', () => openTimetableModal(null, selectedTimetableDay, 9));
        dayView.appendChild(addBtn);

        // Render slots for desktop grid
        timetableData.forEach(slot => {
            renderSlot(slot);
        });

        highlightOngoingClass();
    };

    const getSubjectColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = Math.abs(hash % 360);
        return `hsla(${h}, 70%, 60%, 0.25)`;
    };

    const renderSlot = (slot) => {
        const slotEl = document.createElement('div');
        slotEl.classList.add('slot-card');
        slotEl.dataset.id = slot.id;

        const subColor = getSubjectColor(slot.subject);
        slotEl.style.borderLeft = `4px solid ${subColor.replace('0.25', '1')}`;
        slotEl.style.background = `linear-gradient(135deg, ${subColor} 0%, rgba(15, 23, 42, 0.4) 100%)`;

        slotEl.innerHTML = `
            <div class="slot-info">
                <div class="slot-subject" style="font-weight: 700; color: #f8fafc;">${slot.subject}</div>
                <div class="slot-time" style="font-size: 11px; color: #94a3b8; margin-top: 4px;">${slot.startTime} - ${slot.endTime}</div>
                ${slot.room ? `<div class="slot-room" style="font-size: 10px; color: #64748b; margin-top: 2px;">📍 ${slot.room}</div>` : ''}
            </div>
        `;

        // Calculate position
        const startParts = slot.startTime.split(':');
        const endParts = slot.endTime.split(':');
        const startHour = parseInt(startParts[0]);
        const startMin = parseInt(startParts[1]);
        const endHour = parseInt(endParts[0]);
        const endMin = parseInt(endParts[1]);

        const startTotalMin = (startHour * 60 + startMin) - (8 * 60 + 30); // Offset from 8:30 AM
        const endTotalMin = (endHour * 60 + endMin) - (8 * 60 + 30);
        const durationMin = endTotalMin - startTotalMin;

        if (startTotalMin < 0 || startTotalMin > 9 * 60) return; // Out of bounds (9 hours from 8:30 to 17:30)

        const rowHeight = 100; // Match CSS height of .time-cell
        const headerHeight = 58; // Approx height of .timetable-header-cell
        const top = (startTotalMin / 60) * rowHeight + headerHeight;
        const height = (durationMin / 60) * rowHeight - 4; // Slight padding for visual gap

        slotEl.style.top = `${top}px`;
        slotEl.style.height = `${height}px`;
        slotEl.style.gridColumnStart = slot.dayIndex + 2;
        slotEl.style.gridColumnEnd = slot.dayIndex + 3;

        slotEl.addEventListener('click', (e) => {
            e.stopPropagation();
            openTimetableModal(slot);
        });

        timetableGrid.appendChild(slotEl);
    };

    const openTimetableModal = (slot = null, dayIndex = null, hour = null) => {
        // Populate subject dropdown
        slotSubjectInput.innerHTML = '';
        if (subjectsData.length === 0) {
            slotSubjectInput.innerHTML = '<option value="">Add subjects first...</option>';
        } else {
            subjectsData.forEach(sub => {
                const option = document.createElement('option');
                option.value = sub.id;
                option.textContent = sub.name;
                slotSubjectInput.appendChild(option);
            });
        }

        if (slot) {
            editingSlotId = slot.id;
            timetableModalTitle.textContent = 'Edit Class Slot';
            slotSubjectInput.value = slot.subjectId || '';
            slotStartTimeInput.value = slot.startTime;
            slotEndTimeInput.value = slot.endTime;
            slotRoomInput.value = slot.room || '';
            slotTeacherInput.value = slot.teacher || '';
            deleteSlotBtn.style.display = 'block';
        } else {
            editingSlotId = null;
            timetableModalTitle.textContent = 'Add Class Slot';
            slotSubjectInput.value = subjectsData.length > 0 ? subjectsData[0].id : '';
            const formattedHour = String(hour).padStart(2, '0');
            slotStartTimeInput.value = `${formattedHour}:00`;
            slotEndTimeInput.value = `${String(hour + 1).padStart(2, '0')}:00`;
            slotRoomInput.value = '';
            slotTeacherInput.value = '';
            deleteSlotBtn.style.display = 'none';
            // Store dayIndex for saving
            timetableModal.dataset.dayIndex = dayIndex;
        }

        if (subjectsData.length === 0) {
            alert('Please add at least one subject first!');
            return;
        }

        timetableModal.classList.add('active');
    };

    const saveTimetableSlot = () => {
        const subjectId = slotSubjectInput.value;
        const selectedSubject = subjectsData.find(s => s.id == subjectId);
        const subjectName = selectedSubject ? selectedSubject.name : 'Unknown';
        const startTime = slotStartTimeInput.value;
        const endTime = slotEndTimeInput.value;
        const room = slotRoomInput.value.trim();
        const teacher = slotTeacherInput.value.trim();

        if (!subjectId || !startTime || !endTime) return alert('Please fill in all required fields');

        if (editingSlotId) {
            const index = timetableData.findIndex(s => s.id === editingSlotId);
            timetableData[index] = { ...timetableData[index], subjectId, subject: subjectName, startTime, endTime, room, teacher };
        } else {
            timetableData.push({
                id: Date.now(),
                dayIndex: parseInt(timetableModal.dataset.dayIndex),
                subjectId,
                subject: subjectName,
                startTime,
                endTime,
                room,
                teacher
            });
        }

        localStorage.setItem('tracktaps_timetable', JSON.stringify(timetableData));
        timetableModal.classList.remove('active');
        renderTimetable();
    };

    const deleteTimetableSlot = () => {
        if (confirm('Delete this class slot?')) {
            timetableData = timetableData.filter(s => s.id !== editingSlotId);
            localStorage.setItem('tracktaps_timetable', JSON.stringify(timetableData));
            timetableModal.classList.remove('active');
            renderTimetable();
        }
    };

    const highlightOngoingClass = () => {
        const now = new Date();
        const dayIndex = now.getDay();
        const adjustedDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        const currentMin = now.getHours() * 60 + now.getMinutes();

        document.querySelectorAll('.slot-card').forEach(el => {
            el.classList.remove('ongoing');
            const slotId = el.dataset.id;
            const slot = timetableData.find(s => s.id == slotId);

            if (slot && slot.dayIndex === adjustedDayIndex) {
                const start = slot.startTime.split(':').map(Number);
                const end = slot.endTime.split(':').map(Number);
                const startMin = start[0] * 60 + start[1];
                const endMin = end[0] * 60 + end[1];

                if (currentMin >= startMin && currentMin <= endMin) {
                    el.classList.add('ongoing');
                }
            }
        });
    };

    // Update renderSlot to include data-id
    // (Actually I'll just update it in the next pass if needed, let's refine highlightOngoingClass)

    // --- Modal Logic ---
    const openAttendanceModal = (dateStr, day, monthName, year, targetEl) => {
        selectedDateStr = dateStr;
        if (!isMultiSelectMode) {
            document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('selected'));
            targetEl.classList.add('selected');
        }

        modalDateText.textContent = `${monthName} ${day}, ${year}`;
        const subjectList = document.getElementById('modal-subject-list');
        subjectList.innerHTML = '';

        if (subjectsData.length === 0) {
            subjectList.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">No subjects found. Add subjects to mark attendance.</p>';
        } else {
            const dailyData = attendanceData[dateStr] || {};

            subjectsData.forEach(subject => {
                const status = typeof dailyData === 'string' ? (dailyData === 'present' ? 'present' : (dailyData === 'absent' ? 'absent' : '')) : dailyData[subject.id] || '';
                const row = document.createElement('div');
                row.classList.add('modal-subject-row');
                row.innerHTML = `
                    <div class="subject-info-compact">
                        <div class="subject-name-compact">${subject.name}</div>
                        <div class="subject-stats-compact">${subject.attended}/${subject.total} classes</div>
                    </div>
                    <div class="attendance-options">
                        <button class="opt-btn present ${status === 'present' ? 'active' : ''}" title="Present">P</button>
                        <button class="opt-btn absent ${status === 'absent' ? 'active' : ''}" title="Absent">A</button>
                        <button class="opt-btn offday ${status === 'offday' ? 'active' : ''}" title="Off">O</button>
                        <button class="opt-btn clear" title="Clear">&times;</button>
                    </div>
                `;

                row.querySelector('.present').addEventListener('click', () => markSubjectAttendance(dateStr, subject.id, 'present'));
                row.querySelector('.absent').addEventListener('click', () => markSubjectAttendance(dateStr, subject.id, 'absent'));
                row.querySelector('.offday').addEventListener('click', () => markSubjectAttendance(dateStr, subject.id, 'offday'));
                row.querySelector('.clear').addEventListener('click', () => markSubjectAttendance(dateStr, subject.id, 'clear'));

                subjectList.appendChild(row);
            });
        }

        modal.classList.add('active');
    };

    const markSubjectAttendance = (dateStr, subjectId, status) => {
        if (!attendanceData[dateStr] || typeof attendanceData[dateStr] === 'string') {
            attendanceData[dateStr] = {};
        }

        const oldStatus = attendanceData[dateStr][subjectId] || '';
        if (oldStatus === status) return;

        // Revert old status from subjectsData and historyData
        updateSubjectStatsAndHistory(dateStr, subjectId, oldStatus, 'remove');

        // Apply new status
        if (status === 'clear') {
            delete attendanceData[dateStr][subjectId];
            if (Object.keys(attendanceData[dateStr]).length === 0) delete attendanceData[dateStr];
        } else {
            attendanceData[dateStr][subjectId] = status;
            updateSubjectStatsAndHistory(dateStr, subjectId, status, 'add');
        }

        saveAndSync();

        // Refresh modal
        const day = new Date(dateStr).getDate();
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthName = monthNames[new Date(dateStr).getMonth()];
        const year = new Date(dateStr).getFullYear();
        openAttendanceModal(dateStr, day, monthName, year, document.querySelector(`.calendar-day:not(.empty)`)); // Target is handled by dateStr
    };

    const updateSubjectStatsAndHistory = (dateStr, subjectId, status, action) => {
        const subject = subjectsData.find(s => s.id == subjectId);
        if (!subject || !status || status === 'clear' || status === 'offday') return;

        const multiplier = action === 'add' ? 1 : -1;

        if (status === 'present') {
            subject.attended += (1 * multiplier);
            subject.total += (1 * multiplier);
        } else if (status === 'absent') {
            subject.total += (1 * multiplier);
        }

        if (action === 'add') {
            const entry = {
                id: Date.now() + Math.random(),
                subjectId: subject.id,
                subjectName: subject.name,
                status: status,
                date: new Date(dateStr).toISOString()
            };
            historyData.unshift(entry);
        } else {
            // Remove entry from history for this date and subject
            const historyIndex = historyData.findIndex(h => {
                const hDate = new Date(h.date).toISOString().split('T')[0];
                return hDate === dateStr && h.subjectId == subjectId && h.status === status;
            });
            if (historyIndex > -1) historyData.splice(historyIndex, 1);
        }
    };

    const saveAndSync = () => {
        localStorage.setItem('tracktaps_attendance', JSON.stringify(attendanceData));
        localStorage.setItem('tracktaps_subjects', JSON.stringify(subjectsData));
        localStorage.setItem('tracktaps_history', JSON.stringify(historyData));

        renderCalendar();
        renderSubjects();
        renderInsights();
        renderHomeDashboard();
        renderHistory();
    };

    const closeAttendanceModal = () => {
        modal.classList.remove('active');
        selectedDateStr = null;
        if (!isMultiSelectMode) {
            document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('selected'));
        }
    };

    const applyBulkAttendance = (status) => {
        if (!selectedDateStr && selectedDates.length === 0) return;

        const dates = selectedDates.length > 0 ? selectedDates : [selectedDateStr];

        dates.forEach(date => {
            subjectsData.forEach(subject => {
                // If status is 'clear', we clear everything for that day/subjects
                // If status is present/absent/offday, we mark it
                if (status === 'clear') {
                    const oldStatus = (attendanceData[date] && typeof attendanceData[date] !== 'string') ? attendanceData[date][subject.id] : '';
                    if (oldStatus) {
                        updateSubjectStatsAndHistory(date, subject.id, oldStatus, 'remove');
                        if (attendanceData[date]) delete attendanceData[date][subject.id];
                    }
                } else {
                    const oldStatus = (attendanceData[date] && typeof attendanceData[date] !== 'string') ? attendanceData[date][subject.id] : '';
                    if (oldStatus !== status) {
                        if (oldStatus) updateSubjectStatsAndHistory(date, subject.id, oldStatus, 'remove');

                        if (!attendanceData[date] || typeof attendanceData[date] === 'string') attendanceData[date] = {};
                        attendanceData[date][subject.id] = status;
                        updateSubjectStatsAndHistory(date, subject.id, status, 'add');
                    }
                }
            });
            if (attendanceData[date] && Object.keys(attendanceData[date]).length === 0) delete attendanceData[date];
        });

        saveAndSync();
        if (selectedDateStr) {
            const d = new Date(selectedDateStr);
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            openAttendanceModal(selectedDateStr, d.getDate(), monthNames[d.getMonth()], d.getFullYear(), null);
        } else {
            closeAttendanceModal();
        }
    };

    // --- Event Listeners ---
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = button.innerText.toLowerCase().trim();
            const nameToView = {
                'home': 'home-view',
                'calendar': 'calendar-view',
                'timetable': 'timetable-view',
                'subjects': 'subjects-view',
                'insights': 'insights-view',
                'history': 'history-view',
                'about': 'about-view',
                'settings': 'settings-view'
            };
            const viewId = nameToView[viewName] || 'home-view';
            switchView(viewId);
        });
    });

    if (prevMonthBtn) prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    if (nextMonthBtn) nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeAttendanceModal);
    if (cancelSelectionBtn) cancelSelectionBtn.addEventListener('click', clearSelection);
    if (addSubjectBtn) addSubjectBtn.addEventListener('click', () => openSubjectModal());
    if (cancelSubjectBtn && subjectModal) cancelSubjectBtn.addEventListener('click', () => subjectModal.classList.remove('active'));
    if (saveSubjectBtn) saveSubjectBtn.addEventListener('click', saveSubject);

    // Timetable Event Listeners
    if (saveSlotBtn) saveSlotBtn.addEventListener('click', saveTimetableSlot);
    if (deleteSlotBtn) deleteSlotBtn.addEventListener('click', deleteTimetableSlot);
    if (cancelSlotBtn && timetableModal) cancelSlotBtn.addEventListener('click', () => timetableModal.classList.remove('active'));
    if (timetableModal) timetableModal.addEventListener('click', (e) => { if (e.target === timetableModal) timetableModal.classList.remove('active'); });

    // Attendance Modal Bulk Actions
    document.querySelectorAll('.bulk-action-btn').forEach(btn => {
        btn.addEventListener('click', () => applyBulkAttendance(btn.dataset.status));
    });

    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeAttendanceModal(); });
    if (subjectModal) subjectModal.addEventListener('click', (e) => { if (e.target === subjectModal) subjectModal.classList.remove('active'); });

    // --- Reveal Animations Logic ---
    const initRevealAnimations = () => {
        const revealOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('element-revealed');
                    // Once revealed, no need to observe anymore
                    revealObserver.unobserve(entry.target);
                }
            });
        }, revealOptions);

        const revealElements = document.querySelectorAll('.reveal-element, .reveal-avatar');
        revealElements.forEach(el => {
            // Remove the revealed class in case it was there from a previous session/refresh
            el.classList.remove('element-revealed');
            revealObserver.observe(el);
        });
    };

    // --- TrackTaps AI Assistant Logic ---
    const aiFab = document.getElementById('ai-fab');
    const aiChatWindow = document.getElementById('ai-chat-window');
    const closeAiChat = document.getElementById('close-ai-chat');
    const aiInput = document.getElementById('ai-input');
    const aiSendBtn = document.getElementById('ai-send-btn');
    const aiMessages = document.getElementById('ai-chat-messages');
    const suggestionChips = document.querySelectorAll('.suggestion-chip');

    let chatHistory = [];

    const toggleAiChat = () => {
        aiChatWindow.classList.toggle('active');
        if (aiChatWindow.classList.contains('active')) {
            aiInput.focus();
        }
    };

    const addMessage = (role, content) => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${role}`;
        messageDiv.innerHTML = `
            <div class="message-content">${content}</div>
            <span class="message-time">${time}</span>
        `;
        aiMessages.appendChild(messageDiv);
        aiMessages.scrollTop = aiMessages.scrollHeight;
        
        chatHistory.push({ role, content });
    };

    const showTypingIndicator = () => {
        const indicator = document.createElement('div');
        indicator.className = 'ai-message assistant typing-container';
        indicator.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        aiMessages.appendChild(indicator);
        aiMessages.scrollTop = aiMessages.scrollHeight;
        return indicator;
    };

    const sendToAi = async (text) => {
        if (!text.trim()) return;

        console.log('TrackTaps AI: Sending message...', text);
        addMessage('user', text);
        aiInput.value = '';

        const typingIndicator = showTypingIndicator();

        try {
            // Prepare context from current app state
            const context = {
                subjects: subjectsData,
                attendance: attendanceData,
                timetable: timetableData,
                settings: settingsData
            };

            console.log('TrackTaps AI: Context prepared', { subjectsCount: subjectsData.length });

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: chatHistory,
                    context: context
                })
            });

            console.log('TrackTaps AI: Response status', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('TrackTaps AI: API Error response', errorText);
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            console.log('TrackTaps AI: Data received', data);

            typingIndicator.remove();
            
            // Handle both 'reply' and 'content' keys for robustness
            const replyContent = data.reply || data.content || "I received an empty response. Please try again.";
            addMessage('assistant', replyContent);

        } catch (error) {
            console.error('TrackTaps AI: Fetch Error:', error);
            typingIndicator.remove();
            addMessage('assistant', "I'm having trouble connecting to my brain right now. Please check your internet or try again in a moment! 🧠🔌");
        }
    };

    if (aiFab) aiFab.addEventListener('click', toggleAiChat);
    if (closeAiChat) closeAiChat.addEventListener('click', toggleAiChat);

    if (aiSendBtn) {
        aiSendBtn.addEventListener('click', () => sendToAi(aiInput.value));
    }

    if (aiInput) {
        aiInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendToAi(aiInput.value);
        });
    }

    suggestionChips.forEach(chip => {
        chip.addEventListener('click', () => sendToAi(chip.textContent));
    });

    // --- Initialization ---
    updateHeader();
    handleRouting(); 
    renderCalendar();
    renderSubjects();
    renderTimetable();
    renderInsights();
    renderHistory();
    renderHomeDashboard();
    initRevealAnimations();

    // Settings Listeners
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    const resetBtn = document.getElementById('reset-btn');

    if (exportBtn) exportBtn.addEventListener('click', exportData);
    if (importBtn) importBtn.addEventListener('click', () => importFile.click());
    if (importFile) importFile.addEventListener('change', importData);
    if (resetBtn) resetBtn.addEventListener('click', resetData);

    // Mobile Nav Listeners
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const viewId = btn.dataset.view;
            if (viewId) switchView(viewId);
        });
    });

    // Home Shortcut Listeners
    document.querySelectorAll('.shortcut-card').forEach(card => {
        card.addEventListener('click', () => {
            const route = card.dataset.route;
            const routeToView = {
                'calendar': 'calendar-view',
                'timetable': 'timetable-view',
                'subjects': 'subjects-view',
                'history': 'history-view',
                'insights': 'insights-view',
                'settings': 'settings-view'
            };
            const viewId = routeToView[route];
            if (viewId) switchView(viewId);
        });
    });

    // Settings Logic
    const initSettings = () => {
        // Populate inputs
        document.getElementById('setting-user-name').value = settingsData.userName || '';
        document.getElementById('setting-college-name').value = settingsData.collegeName || '';
        document.getElementById('setting-acad-year').value = settingsData.acadYear || '';
        document.getElementById('setting-semester').value = settingsData.semester || '';
        document.getElementById('setting-default-criteria').value = settingsData.defaultCriteria || 75;
        document.getElementById('setting-warning-threshold').value = settingsData.warningThreshold || 80;
        document.getElementById('setting-critical-threshold').value = settingsData.criticalThreshold || 65;
        document.getElementById('setting-default-duration').value = settingsData.defaultDuration || 60;
        document.getElementById('setting-start-hour').value = settingsData.gridStartHour || 8;
        document.getElementById('setting-end-hour').value = settingsData.gridEndHour || 18;
        document.getElementById('setting-glass-effect').checked = settingsData.glassEffect;

        // Apply theme and effects
        applyTheme(settingsData.theme);
        applyGlassEffect(settingsData.glassEffect);
        applyMode(settingsData.displayMode || 'dark');
    };

    const applyMode = (mode) => {
        document.body.classList.toggle('light-mode', mode === 'light');
        settingsData.displayMode = mode;

        const knob = document.getElementById('mode-knob');
        const container = document.getElementById('mode-toggle-container');
        if (knob && container) {
            knob.style.left = mode === 'light' ? '36px' : '4px';
            knob.style.background = mode === 'light' ? '#f59e0b' : '#8b5cf6';
            knob.textContent = mode === 'light' ? '☀️' : '🌙';
            container.style.background = mode === 'light' ? '#e2e8f0' : '#1e293b';
        }
        saveSettings();
    };

    const applyTheme = (theme) => {
        // Remove old theme classes
        const themeClasses = ['theme-purple', 'theme-midnight', 'theme-neon', 'theme-ocean', 'theme-sunset', 'theme-emerald'];
        themeClasses.forEach(cls => document.body.classList.remove(cls));

        document.body.classList.add(`theme-${theme}`);
        document.querySelectorAll('.theme-btn').forEach(btn => {
            const isActive = btn.dataset.theme === theme;
            btn.classList.toggle('active', isActive);

            // Dynamic styling based on theme
            if (isActive) {
                btn.style.borderColor = 'var(--primary)';
                btn.style.boxShadow = '0 0 10px var(--primary)';
            } else {
                btn.style.borderColor = 'rgba(255,255,255,0.1)';
                btn.style.boxShadow = 'none';
            }
        });
        settingsData.theme = theme;
        saveSettings();
    };

    const applyGlassEffect = (enabled) => {
        document.body.classList.toggle('no-glass', !enabled);
        settingsData.glassEffect = enabled;
        saveSettings();
    };

    const saveSettings = () => {
        localStorage.setItem('tracktaps_settings', JSON.stringify(settingsData));
    };

    // Event Listeners for Settings
    const saveProfileBtn = document.getElementById('save-profile-btn');
    if (saveProfileBtn) saveProfileBtn.addEventListener('click', () => {
        settingsData.userName = document.getElementById('setting-user-name').value;
        settingsData.collegeName = document.getElementById('setting-college-name').value;
        settingsData.acadYear = document.getElementById('setting-acad-year').value;
        settingsData.semester = document.getElementById('setting-semester').value;
        saveSettings();
        showToast('Profile updated successfully!');
        renderHomeDashboard();
    });

    const saveThresholdsBtn = document.getElementById('save-thresholds-btn');
    if (saveThresholdsBtn) saveThresholdsBtn.addEventListener('click', () => {
        settingsData.defaultCriteria = parseInt(document.getElementById('setting-default-criteria').value);
        settingsData.warningThreshold = parseInt(document.getElementById('setting-warning-threshold').value);
        settingsData.criticalThreshold = parseInt(document.getElementById('setting-critical-threshold').value);
        saveSettings();
        showToast('Attendance thresholds saved!');
        renderInsights();
        renderHomeDashboard();
    });

    const saveTimetableSettingsBtn = document.getElementById('save-timetable-settings-btn');
    if (saveTimetableSettingsBtn) saveTimetableSettingsBtn.addEventListener('click', () => {
        settingsData.defaultDuration = parseInt(document.getElementById('setting-default-duration').value);
        settingsData.gridStartHour = parseInt(document.getElementById('setting-start-hour').value);
        settingsData.gridEndHour = parseInt(document.getElementById('setting-end-hour').value);
        saveSettings();
        showToast('Timetable settings updated! Reloading grid...');
        renderTimetable();
    });

    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
    });

    const modeToggle = document.getElementById('mode-toggle-container');
    if (modeToggle) modeToggle.addEventListener('click', () => {
        const newMode = settingsData.displayMode === 'dark' ? 'light' : 'dark';
        applyMode(newMode);
    });

    const glassToggle = document.getElementById('setting-glass-effect');
    if (glassToggle) glassToggle.addEventListener('change', (e) => applyGlassEffect(e.target.checked));

    // --- Pod.ai Integration Logic ---
    let podAIState = JSON.parse(localStorage.getItem('tracktaps_podai_state')) || {
        connected: false,
        lastSync: null,
        email: ''
    };

    const savePodAIState = () => localStorage.setItem('tracktaps_podai_state', JSON.stringify(podAIState));

    // Real Pod.ai (Calyxpod) API Service - Backend Powered
    const PodAIService = {
        authenticate: async (username, password) => {
            console.log(`[Pod.ai Client] Authenticating user: ${username}`);
            try {
                const response = await fetch('/api/pod/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                console.log(`[Pod.ai Client] Login Status: ${response.status}`);
                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Authentication failed');
                }

                return { success: true, user: result.user };
            } catch (error) {
                console.error('[Pod.ai Client] Login Exception:', error);
                throw error;
            }
        },

        syncData: async () => {
            console.log('[Pod.ai Client] Requesting full sync...');
            try {
                const response = await fetch('/api/pod/sync', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });

                const contentType = response.headers.get('content-type') || '';
                console.log(`[Pod.ai Client] Sync Status: ${response.status}, Type: ${contentType}`);

                let result;
                if (contentType.includes('application/json')) {
                    result = await response.json();
                } else {
                    const text = await response.text();
                    console.error('[Pod.ai Client] Received Non-JSON:', text.substring(0, 500));
                    throw new Error('Server returned invalid response format');
                }

                if (!response.ok) {
                    if (response.status === 401 || result.error === 'SESSION_EXPIRED') {
                        throw new Error('SESSION_EXPIRED');
                    }
                    throw new Error(result.error || 'Failed to sync data');
                }

                return result.data;
            } catch (error) {
                console.error('[Pod.ai Client] Sync Exception:', error);
                throw error;
            }
        },

        logout: async () => {
            console.log('[Pod.ai Client] Logging out...');
            try {
                await fetch('/api/pod/logout', { method: 'POST' });
            } catch (e) {
                console.error('[Pod.ai Client] Logout error:', e);
            }
        }
    };

    const updatePodAIUI = () => {
        const indicator = document.getElementById('podai-indicator');
        const statusText = document.getElementById('podai-status-text');
        const syncNowBtn = document.getElementById('sync-podai-now-btn');
        const loginForm = document.getElementById('podai-login-form');
        const connectedView = document.getElementById('podai-connected-view');
        const linkedEmail = document.getElementById('podai-linked-email');

        if (podAIState.connected) {
            indicator.style.background = '#10b981';
            statusText.textContent = 'Live Sync Active';
            statusText.style.color = '#10b981';
            if (syncNowBtn) syncNowBtn.style.display = 'block';
            if (loginForm) loginForm.style.display = 'none';
            if (connectedView) connectedView.style.display = 'block';
            if (linkedEmail) linkedEmail.textContent = podAIState.email;
        } else {
            indicator.style.background = '#64748b';
            statusText.textContent = 'Disconnected';
            statusText.style.color = '#94a3b8';
            if (syncNowBtn) syncNowBtn.style.display = 'none';
            if (loginForm) loginForm.style.display = 'block';
            if (connectedView) connectedView.style.display = 'none';
        }
    };

    const openPodAIModal = () => {
        document.getElementById('podai-modal').classList.add('active');
        updatePodAIUI();
    };

    const handlePodAIConnect = async () => {
        const username = document.getElementById('podai-email').value;
        const password = document.getElementById('podai-password').value;
        const btn = document.getElementById('podai-connect-btn');

        if (!username || !password) {
            showToast('Please enter your Pod.ai credentials.');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span> Authenticating...';

        try {
            const response = await PodAIService.authenticate(username, password);
            if (response.success) {
                podAIState.connected = true;
                podAIState.email = username;
                podAIState.lastSync = new Date().toISOString();
                savePodAIState();
                updatePodAIUI();

                showToast('Authenticating with Pod.ai... 🕒');

                setTimeout(() => {
                    handlePodAISync(true); 
                }, 1000);
            }
        } catch (error) {
            showToast('Pod.ai Error: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Connect Account';
        }
    };

    const handlePodAISync = async (isInitial = false) => {
        const btn = document.getElementById('podai-fetch-btn');
        const syncBtnSettings = document.getElementById('sync-podai-now-btn');

        if (!podAIState.connected) {
            showToast('Pod.ai is not connected.');
            return;
        }

        const buttons = [btn, syncBtnSettings].filter(b => b);
        buttons.forEach(b => {
            b.disabled = true;
            b.innerHTML = '<span class="loading-spinner"></span> Syncing Live Data...';
        });

        try {
            const syncResult = await PodAIService.syncData();
            // Data mapping from backend: { stats, attendance, subjects, timetable, debug }
            const { attendance = [], subjects = [], stats = {}, timetable = [], debug = {} } = syncResult;

            const attCount = attendance.length;
            const subCount = subjects.length;
            const timeCount = timetable.length;

            console.log(`[Pod.ai Sync] Result: ${attCount} attendance, ${subCount} subjects, ${timeCount} timetable.`);
            if (debug.endpoints) {
                console.log('[Pod.ai Sync] Backend Discovery Debug:', debug.endpoints);
            }

            if (attCount === 0 && subCount === 0) {
                showToast('No live data found. Check your Pod.ai dashboard or try again later.');
                return;
            }

            // 1. Sync Subjects and Attendance (Combine sources)
            const combinedSources = [...attendance];
            // If subjects endpoint had items that attendance didn't, add them
            subjects.forEach(s => {
                if (!combinedSources.find(c => c.name.toLowerCase() === s.name.toLowerCase())) {
                    combinedSources.push(s);
                }
            });

            combinedSources.forEach(ext => {
                // Improved matching: try exact then try stripping common suffixes like (L), (P), (T)
                const cleanExtName = ext.name.replace(/\s*\(.*?\)\s*$/, '').trim().toLowerCase();
                
                let subject = subjectsData.find(s => {
                    const cleanSubName = s.name.replace(/\s*\(.*?\)\s*$/, '').trim().toLowerCase();
                    return cleanSubName === cleanExtName || s.name.toLowerCase() === ext.name.toLowerCase();
                });

                if (subject) {
                    console.log(`[Pod.ai Sync] Updating: ${subject.name}`);
                    subject.attended = ext.attended ?? subject.attended;
                    subject.total = ext.total ?? subject.total;
                    if (ext.code) subject.code = ext.code;
                    if (ext.faculty) subject.teacher = ext.faculty;
                } else {
                    console.log(`[Pod.ai Sync] Importing New: ${ext.name}`);
                    subjectsData.push({
                        id: ext.id || (Date.now() + Math.random()),
                        name: ext.name,
                        code: ext.code || '',
                        teacher: ext.faculty || '',
                        criteria: settingsData.defaultCriteria || 75,
                        attended: ext.attended || 0,
                        total: ext.total || 0
                    });
                }
            });

            // 2. Sync Timetable
            if (timeCount > 0) {
                console.log(`[Pod.ai Sync] Importing ${timeCount} timetable slots.`);
                timetableData = timetable.map(slot => {
                    const matchedSub = subjectsData.find(s => s.name.toLowerCase() === slot.subject.toLowerCase());
                    return { ...slot, subjectId: matchedSub ? matchedSub.id : null };
                });
                localStorage.setItem('tracktaps_timetable', JSON.stringify(timetableData));
            }

            // 3. Update Institutional Info
            if (stats && stats.community_name) {
                settingsData.collegeName = stats.community_name;
                saveSettings();
            }

            localStorage.setItem('tracktaps_subjects', JSON.stringify(subjectsData));
            podAIState.lastSync = new Date().toISOString();
            savePodAIState();

            // 4. Force UI Refresh
            renderSubjects();
            renderTimetable();
            renderHomeDashboard();
            renderInsights();
            renderHistory();

            showToast(`Import Success! 📊 ${attCount} subjects & ${timeCount} classes synced.`);

            const statsDiv = document.getElementById('podai-import-stats');
            if (statsDiv) {
                statsDiv.innerHTML = `
                    <div style="background: rgba(16, 185, 129, 0.05); padding: 12px; border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2); text-align: center;">
                        <span style="display: block; font-size: 18px; font-weight: 700; color: #10b981;">${attCount}</span>
                        <span style="font-size: 10px; color: #10b981; text-transform: uppercase;">Attendance</span>
                    </div>
                    <div style="background: rgba(139, 92, 246, 0.05); padding: 12px; border-radius: 12px; border: 1px solid rgba(139, 92, 246, 0.2); text-align: center;">
                        <span style="display: block; font-size: 18px; font-weight: 700; color: #a78bfa;">${timeCount}</span>
                        <span style="font-size: 10px; color: #a78bfa; text-transform: uppercase;">Timetable</span>
                    </div>
                `;
            }

        } catch (error) {
            if (error.message === 'SESSION_EXPIRED') {
                showToast('Pod.ai session expired. Please reconnect.');
                podAIState.connected = false;
                savePodAIState();
                updatePodAIUI();
            } else {
                showToast('Sync Failed: ' + error.message);
                console.error('[Pod.ai Sync] UI Error:', error);
            }
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Sync Data Now';
            }
            if (syncBtnSettings) {
                syncBtnSettings.disabled = false;
                syncBtnSettings.textContent = 'Sync Latest Attendance';
            }
        }
    };

    const handlePodAIDisconnect = async () => {
        if (confirm('Are you sure you want to disconnect your Pod.ai account? Your local data will be preserved.')) {
            await PodAIService.logout();
            podAIState = { connected: false, lastSync: null, email: '' };
            savePodAIState();
            updatePodAIUI();
            showToast('Pod.ai account disconnected.');
        }
    };

    // Pod.ai Event Listeners
    const openModalBtn = document.getElementById('open-podai-modal-btn');
    if (openModalBtn) openModalBtn.addEventListener('click', openPodAIModal);

    const connectBtn = document.getElementById('podai-connect-btn');
    if (connectBtn) connectBtn.addEventListener('click', handlePodAIConnect);

    const syncBtn = document.getElementById('podai-fetch-btn');
    if (syncBtn) syncBtn.addEventListener('click', handlePodAISync);

    const syncBtnSettings = document.getElementById('sync-podai-now-btn');
    if (syncBtnSettings) syncBtnSettings.addEventListener('click', handlePodAISync);

    const disconnectBtn = document.getElementById('podai-disconnect-btn');
    if (disconnectBtn) disconnectBtn.addEventListener('click', handlePodAIDisconnect);

    const passwordToggle = document.getElementById('podai-password-toggle');
    const passwordInput = document.getElementById('podai-password');
    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            passwordToggle.querySelector('.toggle-icon').textContent = type === 'password' ? '👁️' : '🔒';
        });
    }

    // Initial UI Sync
    updatePodAIUI();

    const podAIModal = document.getElementById('podai-modal');
    if (podAIModal) {
        podAIModal.addEventListener('click', (e) => {
            if (e.target === podAIModal || e.target.classList.contains('close-modal')) {
                podAIModal.classList.remove('active');
            }
        });
    }

    initSettings();

    // Ongoing class check every minute
    setInterval(highlightOngoingClass, 60000);
});
