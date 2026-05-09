/**
 * TrackTaps AI Chat API (Node.js/Vercel)
 * Stable rule-based logic for attendance management.
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(200).json({ status: "TrackTaps AI is online" });
    }

    try {
        const { messages, context } = req.body;
        if (!messages || messages.length === 0) {
            return res.status(400).json({ error: "No messages provided" });
        }

        const lastMessage = messages[messages.length - 1].content.toLowerCase();
        const { subjects, attendance, timetable, settings } = context || {};

        let response = "";

        // 1. ATTENDANCE PREDICTION / SKIPPING
        if (lastMessage.includes('skip') || lastMessage.includes('tomorrow') || lastMessage.includes('can i miss')) {
            response = calculateSkipLogic(subjects, timetable);
        }
        
        // 2. CLASSES NEEDED FOR 75% (or custom criteria)
        else if (lastMessage.includes('75') || lastMessage.includes('needed') || lastMessage.includes('how many classes')) {
            response = calculateNeededLogic(subjects, settings?.defaultCriteria || 75);
        }

        // 3. WEAKEST SUBJECT
        else if (lastMessage.includes('weakest') || lastMessage.includes('lowest') || lastMessage.includes('worst')) {
            response = findLowestSubject(subjects);
        }

        // 4. TIMETABLE QUERIES
        else if (lastMessage.includes('schedule') || lastMessage.includes('classes') || lastMessage.includes('today')) {
            response = getScheduleSummary(timetable);
        }

        // 5. ATTENDANCE WARNINGS / SUMMARY
        else if (lastMessage.includes('summary') || lastMessage.includes('status') || lastMessage.includes('how am i doing')) {
            response = getAttendanceSummary(subjects);
        }

        // 6. GREETINGS
        else if (lastMessage.includes('hi') || lastMessage.includes('hello') || lastMessage.includes('hey')) {
            response = "Hello! I'm your TrackTaps AI. I can help you calculate how many classes you can skip, find your weakest subjects, or summarize your schedule. What's on your mind?";
        }

        // 7. FALLBACK
        else {
            response = "I'm not quite sure about that, but I can help with your attendance! Try asking: 'Can I skip tomorrow?', 'How many classes needed for 75%?', or 'What is my lowest subject?'";
        }

        return res.status(200).json({ reply: response });

    } catch (error) {
        console.error("Chat API Error:", error);
        return res.status(500).json({ reply: "My circuits are a bit tangled! Please try again in a moment." });
    }
}

/**
 * Logic to determine if user can skip classes based on current attendance and criteria.
 */
function calculateSkipLogic(subjects, timetable) {
    if (!subjects || subjects.length === 0) return "You haven't added any subjects yet! Add them in the 'Subjects' tab so I can analyze your attendance.";

    const criticalSubjects = subjects.filter(s => {
        const perc = s.total > 0 ? (s.attended / s.total) * 100 : 0;
        return perc < (s.criteria || 75);
    });

    if (criticalSubjects.length > 0) {
        const names = criticalSubjects.map(s => s.name).join(', ');
        return `I wouldn't recommend skipping. Your attendance in ${names} is currently below your goal. Stay consistent to recover!`;
    }

    // Check if they can skip at least 1 class in every subject
    const safeToSkipAll = subjects.every(s => {
        const criteriaPerc = (s.criteria || 75) / 100;
        const newPerc = s.attended / (s.total + 1);
        return newPerc >= criteriaPerc;
    });

    if (safeToSkipAll) {
        return "You're in the green! Based on your current data, skipping a day won't drop you below your criteria. Enjoy your break, but don't make it a habit!";
    } else {
        return "You're doing okay, but some subjects are close to the limit. I'd recommend attending your classes tomorrow to maintain your safety margin.";
    }
}

/**
 * Logic to calculate how many classes are needed to reach the goal.
 */
function calculateNeededLogic(subjects, defaultCriteria) {
    if (!subjects || subjects.length === 0) return "Add your subjects first so I can calculate your targets!";

    const results = subjects
        .filter(s => {
            const perc = s.total > 0 ? (s.attended / s.total) * 100 : 0;
            return perc < (s.criteria || defaultCriteria);
        })
        .map(s => {
            const goal = (s.criteria || defaultCriteria) / 100;
            // Formula: (goal * total - attended) / (1 - goal)
            const needed = Math.ceil((goal * s.total - s.attended) / (1 - goal));
            return `${s.name}: ${needed} classes`;
        });

    if (results.length === 0) {
        return "You've already met your attendance goals for all subjects! Keep it up.";
    }

    return `To reach your goal, you need to attend: ${results.join(', ')}.`;
}

/**
 * Logic to find the subject with the lowest attendance.
 */
function findLowestSubject(subjects) {
    if (!subjects || subjects.length === 0) return "No subjects found.";

    const sorted = [...subjects].sort((a, b) => {
        const aPerc = a.total > 0 ? (a.attended / a.total) * 100 : 0;
        const bPerc = b.total > 0 ? (b.attended / b.total) * 100 : 0;
        return aPerc - bPerc;
    });

    const lowest = sorted[0];
    const perc = lowest.total > 0 ? ((lowest.attended / lowest.total) * 100).toFixed(1) : 0;
    
    return `Your weakest subject is ${lowest.name} with ${perc}% attendance. You've attended ${lowest.attended} out of ${lowest.total} classes.`;
}

/**
 * Logic to summarize the timetable.
 */
function getScheduleSummary(timetable) {
    if (!timetable || timetable.length === 0) return "Your timetable is empty. Add your schedule to get daily class summaries!";

    const today = new Date();
    const dayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1; // 0-6 (Mon-Sun)
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    const todayClasses = timetable.filter(s => s.dayIndex === dayIndex);
    
    if (todayClasses.length === 0) {
        return `You have no classes scheduled for ${days[dayIndex]}. A perfect day to relax or catch up!`;
    }

    const list = todayClasses
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .map(s => `${s.subject} (${s.startTime})`)
        .join(', ');

    return `Today (${days[dayIndex]}), you have ${todayClasses.length} classes: ${list}.`;
}

/**
 * Logic to provide an overall attendance status.
 */
function getAttendanceSummary(subjects) {
    if (!subjects || subjects.length === 0) return "You haven't tracked any attendance yet.";

    let totalA = 0, totalT = 0;
    subjects.forEach(s => { totalA += s.attended; totalT += s.total; });
    const overall = totalT > 0 ? ((totalA / totalT) * 100).toFixed(1) : 0;

    const critical = subjects.filter(s => {
        const p = s.total > 0 ? (s.attended / s.total) * 100 : 0;
        return p < (s.criteria || 75);
    }).length;

    let msg = `Your overall attendance is ${overall}%. `;
    if (critical > 0) {
        msg += `Warning: ${critical} subject(s) are below criteria. You should focus on improving those!`;
    } else {
        msg += "Great job! You're above your target criteria in all subjects.";
    }
    
    return msg;
}
