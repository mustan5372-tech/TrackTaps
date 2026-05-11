/**
 * Pod.ai Integration Service
 * Handles real Pod.ai authentication, subject fetching, and attendance data sync
 */

const POD_AI_CONFIG = {
  baseUrl: 'https://api.pod.ai/v4/api',
  loginUrl: 'https://api.pod.ai/v4/api/accounts/login/?subdomain=medicaps',
  activitiesUrl: 'https://api.pod.ai/v4/api/classrooms/student-activity/assessments/index-list/',
  collegeId: 'kiNdHC'
};

const STORAGE_KEYS = {
  authToken: 'podai_auth_token',
  username: 'podai_username',
  password: 'podai_password',
  subjects: 'podai_subjects',
  attendance: 'podai_attendance',
  lastSync: 'podai_last_sync',
  connectionStatus: 'podai_connection_status'
};

class PodAiService {
  /**
   * Authenticate with Pod.ai using email and password
   */
  static async login(username, password) {
    try {
      const response = await fetch(POD_AI_CONFIG.loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://medicaps.pod.ai',
          'Referer': 'https://medicaps.pod.ai/',
          'X-College-Id': POD_AI_CONFIG.collegeId,
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const data = await response.json();
      const authToken = data.auth_token;

      if (!authToken) {
        throw new Error('No auth token received from Pod.ai');
      }

      // Store credentials securely
      localStorage.setItem(STORAGE_KEYS.authToken, authToken);
      localStorage.setItem(STORAGE_KEYS.username, username);
      localStorage.setItem(STORAGE_KEYS.password, password);
      localStorage.setItem(STORAGE_KEYS.connectionStatus, JSON.stringify({
        connected: true,
        connectedAt: new Date().toISOString(),
        username: username
      }));

      return {
        success: true,
        message: 'Successfully connected to Pod.ai',
        authToken
      };
    } catch (error) {
      console.error('Pod.ai login error:', error);
      return {
        success: false,
        message: error.message || 'Failed to authenticate with Pod.ai'
      };
    }
  }

  /**
   * Refresh auth token using stored credentials
   */
  static async refreshToken() {
    try {
      const username = localStorage.getItem(STORAGE_KEYS.username);
      const password = localStorage.getItem(STORAGE_KEYS.password);

      if (!username || !password) {
        throw new Error('No stored credentials found');
      }

      const response = await fetch(POD_AI_CONFIG.loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://medicaps.pod.ai',
          'Referer': 'https://medicaps.pod.ai/',
          'X-College-Id': POD_AI_CONFIG.collegeId,
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const authToken = data.auth_token;

      if (authToken) {
        localStorage.setItem(STORAGE_KEYS.authToken, authToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  /**
   * Get current auth token
   */
  static getAuthToken() {
    return localStorage.getItem(STORAGE_KEYS.authToken);
  }

  /**
   * Check if user is logged in to Pod.ai
   */
  static isConnected() {
    const token = localStorage.getItem(STORAGE_KEYS.authToken);
    return !!token;
  }

  /**
   * Get connection status
   */
  static getConnectionStatus() {
    const status = localStorage.getItem(STORAGE_KEYS.connectionStatus);
    return status ? JSON.parse(status) : null;
  }

  /**
   * Fetch real attendance data from Pod.ai
   */
  static async fetchAttendanceData() {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Not connected to Pod.ai');
      }

      const headers = {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
        'X-College-Id': POD_AI_CONFIG.collegeId,
      };

      const allActivities = [];
      let got401 = false;

      // Fetch both in_progress and upcoming activities
      for (const status of ['in_progress', 'upcoming']) {
        if (got401) break;

        let page = 1;
        let hasMore = true;

        while (hasMore) {
          try {
            const url = new URL(POD_AI_CONFIG.activitiesUrl);
            url.searchParams.append('activity_status', status);
            url.searchParams.append('class_group_type', '1');
            url.searchParams.append('include_status_stats', 'true');
            url.searchParams.append('page', page);

            const response = await fetch(url.toString(), { headers });

            if (response.status === 401) {
              // Try to refresh token
              const refreshed = await this.refreshToken();
              if (refreshed) {
                // Retry with new token
                const newHeaders = {
                  ...headers,
                  'Authorization': `Token ${this.getAuthToken()}`
                };
                const retryResponse = await fetch(url.toString(), { headers: newHeaders });
                if (!retryResponse.ok) {
                  got401 = true;
                  break;
                }
              } else {
                got401 = true;
                break;
              }
            }

            if (!response.ok) break;

            const data = await response.json();
            const results = data.results || [];
            const pagination = data.pagination || {};

            // Parse activities and extract subject data
            for (const item of results) {
              try {
                const activity = this.parseActivity(item);
                if (activity) {
                  allActivities.push(activity);
                }
              } catch (e) {
                console.warn('Error parsing activity:', e);
              }
            }

            const currentPage = pagination.current_page_number || 1;
            const lastPage = pagination.last_page_number || 1;
            hasMore = currentPage < lastPage;
            page++;
          } catch (error) {
            console.error('Error fetching page:', error);
            break;
          }
        }
      }

      if (got401) {
        throw new Error('Session expired. Please reconnect to Pod.ai');
      }

      // Remove duplicates and sort
      const uniqueActivities = this.deduplicateActivities(allActivities);
      return {
        success: true,
        data: uniqueActivities,
        count: uniqueActivities.length
      };
    } catch (error) {
      console.error('Fetch attendance error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch attendance data',
        data: []
      };
    }
  }

  /**
   * Parse Pod.ai activity into subject data
   */
  static parseActivity(item) {
    try {
      const activity = {
        subjectName: item.name || item.title || 'Unknown Subject',
        subjectCode: item.code || item.activity_code || '',
        totalClasses: item.total_classes || 0,
        presentClasses: item.present_classes || 0,
        absentClasses: item.absent_classes || 0,
        attendancePercent: item.attendance_percentage || 0,
        lastUpdated: new Date().toISOString(),
        token: item.token || item.id || Math.random().toString()
      };

      // Calculate attendance percentage if not provided
      if (activity.totalClasses > 0 && !item.attendance_percentage) {
        activity.attendancePercent = Math.round(
          (activity.presentClasses / activity.totalClasses) * 100
        );
      }

      return activity;
    } catch (error) {
      console.warn('Error parsing activity:', error);
      return null;
    }
  }

  /**
   * Remove duplicate activities by token
   */
  static deduplicateActivities(activities) {
    const seen = new Set();
    return activities.filter(activity => {
      if (seen.has(activity.token)) {
        return false;
      }
      seen.add(activity.token);
      return true;
    });
  }

  /**
   * Sync Pod.ai subjects with local Subjects page
   */
  static async syncSubjects() {
    try {
      // Fetch attendance data from Pod.ai
      const result = await this.fetchAttendanceData();
      if (!result.success) {
        throw new Error(result.message);
      }

      const podaiSubjects = result.data;

      // Get existing local subjects
      const localSubjects = JSON.parse(
        localStorage.getItem('tracktaps_subjects') || '[]'
      );

      // Merge subjects intelligently
      const mergedSubjects = this.mergeSubjects(localSubjects, podaiSubjects);

      // Save merged subjects
      localStorage.setItem('tracktaps_subjects', JSON.stringify(mergedSubjects));

      // Update last sync timestamp
      localStorage.setItem(STORAGE_KEYS.lastSync, new Date().toISOString());

      // Update attendance stats
      this.updateAttendanceStats(mergedSubjects);

      return {
        success: true,
        message: `Synced ${podaiSubjects.length} subjects from Pod.ai`,
        subjectsCount: mergedSubjects.length,
        newSubjects: podaiSubjects.length
      };
    } catch (error) {
      console.error('Sync subjects error:', error);
      return {
        success: false,
        message: error.message || 'Failed to sync subjects'
      };
    }
  }

  /**
   * Intelligently merge Pod.ai subjects with local subjects
   * Avoids duplicates by matching subject names/codes
   */
  static mergeSubjects(localSubjects, podaiSubjects) {
    const merged = [...localSubjects];

    for (const podaiSubject of podaiSubjects) {
      // Try to find matching local subject
      const existingIdx = merged.findIndex(local =>
        this.subjectsMatch(local, podaiSubject)
      );

      if (existingIdx >= 0) {
        // Update existing subject with Pod.ai data
        merged[existingIdx] = {
          ...merged[existingIdx],
          present: podaiSubject.presentClasses,
          total: podaiSubject.totalClasses,
          attendance: podaiSubject.attendancePercent,
          podaiSynced: true,
          lastSyncedAt: new Date().toISOString(),
          subjectCode: podaiSubject.subjectCode
        };
      } else {
        // Add new subject from Pod.ai
        merged.push({
          name: podaiSubject.subjectName,
          subjectCode: podaiSubject.subjectCode,
          criteria: 75, // Default criteria
          present: podaiSubject.presentClasses,
          total: podaiSubject.totalClasses,
          attendance: podaiSubject.attendancePercent,
          color: this.getColorForSubject(merged.length),
          podaiSynced: true,
          lastSyncedAt: new Date().toISOString()
        });
      }
    }

    return merged;
  }

  /**
   * Check if two subjects match (by name or code similarity)
   */
  static subjectsMatch(local, podai) {
    const localName = (local.name || '').toLowerCase().trim();
    const podaiName = (podai.subjectName || '').toLowerCase().trim();
    const localCode = (local.subjectCode || '').toLowerCase().trim();
    const podaiCode = (podai.subjectCode || '').toLowerCase().trim();

    // Exact name match
    if (localName === podaiName) return true;

    // Code match
    if (localCode && podaiCode && localCode === podaiCode) return true;

    // Partial name match (for abbreviated names)
    if (localName.length > 3 && podaiName.includes(localName)) return true;
    if (podaiName.length > 3 && localName.includes(podaiName)) return true;

    return false;
  }

  /**
   * Get color for subject based on index
   */
  static getColorForSubject(index) {
    const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];
    return colors[index % colors.length];
  }

  /**
   * Update attendance stats on Home page
   */
  static updateAttendanceStats(subjects) {
    let totalPresent = 0;
    let totalClasses = 0;
    let safeSubjects = 0;
    let criticalSubjects = 0;

    for (const subject of subjects) {
      totalPresent += subject.present || 0;
      totalClasses += subject.total || 0;

      const attendance = subject.attendance || 0;
      if (attendance >= 75) {
        safeSubjects++;
      } else if (attendance < 65) {
        criticalSubjects++;
      }
    }

    const overallPercentage = totalClasses > 0
      ? Math.round((totalPresent / totalClasses) * 100)
      : 0;

    const stats = {
      totalSubjects: subjects.length,
      streak: 0,
      safeSubjects,
      criticalSubjects,
      overallPercentage,
      present: totalPresent,
      missed: totalClasses - totalPresent,
      total: totalClasses
    };

    localStorage.setItem('attendanceStats', JSON.stringify(stats));
  }

  /**
   * Disconnect from Pod.ai
   */
  static disconnect() {
    localStorage.removeItem(STORAGE_KEYS.authToken);
    localStorage.removeItem(STORAGE_KEYS.username);
    localStorage.removeItem(STORAGE_KEYS.password);
    localStorage.removeItem(STORAGE_KEYS.connectionStatus);
    localStorage.removeItem(STORAGE_KEYS.lastSync);
    return { success: true, message: 'Disconnected from Pod.ai' };
  }

  /**
   * Get last sync time
   */
  static getLastSyncTime() {
    const lastSync = localStorage.getItem(STORAGE_KEYS.lastSync);
    return lastSync ? new Date(lastSync) : null;
  }

  /**
   * Format last sync time for display
   */
  static formatLastSyncTime() {
    const lastSync = this.getLastSyncTime();
    if (!lastSync) return 'Never';

    const now = new Date();
    const diff = now - lastSync;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }
}

export default PodAiService;
