import useAppStore from '../store/appStore';
import AttendanceEngine from './attendanceEngine';
import notificationService from './notificationService';

// Parse latitude string (e.g. "19.1234 N" or "-19.1234") to numeric value
export function parseLatitude(valStr) {
  if (typeof valStr === 'number') return valStr;
  if (!valStr) return 0;
  const clean = valStr.toString().trim().toUpperCase();
  const num = parseFloat(clean.replace(/[^0-9.-]/g, ''));
  if (isNaN(num)) return 0;
  if (clean.endsWith('S')) {
    return -Math.abs(num);
  }
  return num;
}

// Parse longitude string (e.g. "72.9876 W" or "-72.9876") to numeric value
export function parseLongitude(valStr) {
  if (typeof valStr === 'number') return valStr;
  if (!valStr) return 0;
  const clean = valStr.toString().trim().toUpperCase();
  const num = parseFloat(clean.replace(/[^0-9.-]/g, ''));
  if (isNaN(num)) return 0;
  if (clean.endsWith('W')) {
    return -Math.abs(num);
  }
  return num;
}

// Format latitude numeric to display string (e.g. 19.123456 -> "19.123456° N")
export function formatLatitudeDisplay(lat) {
  if (lat === undefined || lat === null || isNaN(lat)) return '0.000000° N';
  const val = Math.abs(lat).toFixed(6);
  const suffix = lat >= 0 ? 'N' : 'S';
  return `${val}° ${suffix}`;
}

// Format longitude numeric to display string (e.g. 72.987654 -> "72.987654° E")
export function formatLongitudeDisplay(lng) {
  if (lng === undefined || lng === null || isNaN(lng)) return '0.000000° E';
  const val = Math.abs(lng).toFixed(6);
  const suffix = lng >= 0 ? 'E' : 'W';
  return `${val}° ${suffix}`;
}

// Haversine formula to calculate distance in meters between two lat/lng points
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

// Helper to parse class times from strings like "09:00 - 10:00" or "9.30 - 11:00"
export function parseTimeSlot(timeSlotStr) {
  if (!timeSlotStr) return null;
  // Match hours and minutes for start and end times
  const regex = /(\d{1,2})[.:](\d{2})\s*(?:-|to)\s*(\d{1,2})[.:](\d{2})/i;
  const match = timeSlotStr.match(regex);
  if (match) {
    return {
      startHour: parseInt(match[1]),
      startMinute: parseInt(match[2]),
      endHour: parseInt(match[3]),
      endMinute: parseInt(match[4]),
    };
  }
  return null;
}

const geofenceService = {
  // Load configuration from local storage
  getConfig: () => {
    try {
      const enabled = localStorage.getItem('tt_geofence_enabled') === 'true';
      const lat = parseFloat(localStorage.getItem('tt_geofence_lat') || '0');
      const lng = parseFloat(localStorage.getItem('tt_geofence_lng') || '0');
      const radius = parseInt(localStorage.getItem('tt_geofence_radius') || '100');
      const wifiSsid = localStorage.getItem('tt_geofence_wifi_ssid') || '';
      const logs = JSON.parse(localStorage.getItem('tt_geofence_logs') || '[]');
      return { enabled, lat, lng, radius, wifiSsid, logs };
    } catch (e) {
      console.error('Failed to load geofence configuration:', e);
      return { enabled: false, lat: 0, lng: 0, radius: 100, wifiSsid: '', logs: [] };
    }
  },

  // Save configuration
  saveConfig: (config) => {
    try {
      if (config.enabled !== undefined) localStorage.setItem('tt_geofence_enabled', String(config.enabled));
      if (config.lat !== undefined) localStorage.setItem('tt_geofence_lat', String(config.lat));
      if (config.lng !== undefined) localStorage.setItem('tt_geofence_lng', String(config.lng));
      if (config.radius !== undefined) localStorage.setItem('tt_geofence_radius', String(config.radius));
      if (config.wifiSsid !== undefined) localStorage.setItem('tt_geofence_wifi_ssid', config.wifiSsid);
      if (config.logs !== undefined) localStorage.setItem('tt_geofence_logs', JSON.stringify(config.logs));
    } catch (e) {
      console.error('Failed to save geofence configuration:', e);
    }
  },

  // Log a geofence event
  logEvent: (message, type = 'info') => {
    const config = geofenceService.getConfig();
    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toLocaleString(),
      message,
      type
    };
    const updatedLogs = [newLog, ...config.logs].slice(0, 50); // Keep last 50 logs
    geofenceService.saveConfig({ logs: updatedLogs });
    
    // Dispatch event to update UI in real-time
    window.dispatchEvent(new CustomEvent('tt_geofence_logs_updated', { detail: updatedLogs }));
  },

  // Clear log history
  clearLogs: () => {
    geofenceService.saveConfig({ logs: [] });
    window.dispatchEvent(new CustomEvent('tt_geofence_logs_updated', { detail: [] }));
  },

  // Fetch all calendar events scheduled for today and see if any class is active or upcoming
  getCurrentOrUpcomingClasses: () => {
    const state = useAppStore.getState();
    const calendarEvents = state.calendarEvents || [];
    const todayStr = AttendanceEngine.formatDate(new Date());
    const todayEvents = AttendanceEngine.getEventsForDate(todayStr, calendarEvents);

    if (todayEvents.length === 0) return [];

    const now = new Date();
    const currentMinutesSinceMidnight = now.getHours() * 60 + now.getMinutes();

    return todayEvents.map(event => {
      const parsedTime = parseTimeSlot(event.timeSlot);
      let status = 'today'; // 'active', 'upcoming', 'past', 'today'
      let minutesUntilStart = 9999;

      if (parsedTime) {
        const startMin = parsedTime.startHour * 60 + parsedTime.startMinute;
        const endMin = parsedTime.endHour * 60 + parsedTime.endMinute;

        if (currentMinutesSinceMidnight >= startMin && currentMinutesSinceMidnight <= endMin) {
          status = 'active';
        } else if (startMin > currentMinutesSinceMidnight) {
          status = 'upcoming';
          minutesUntilStart = startMin - currentMinutesSinceMidnight;
        } else {
          status = 'past';
        }
      }

      // Check if attendance is already marked for this class
      const markedState = AttendanceEngine.getAttendanceState(event.id, state.attendanceData);

      return {
        ...event,
        status,
        minutesUntilStart,
        markedState
      };
    });
  },

  // Perform geofence location evaluation
  checkLocation: (lat, lng) => {
    const config = geofenceService.getConfig();
    if (!config.enabled) return;

    if (config.lat === 0 && config.lng === 0) {
      geofenceService.logEvent('Geofence skipped: College location is not set.', 'warning');
      return;
    }

    const distance = calculateDistance(lat, lng, config.lat, config.lng);
    const isInside = distance <= config.radius;
    const wasInside = sessionStorage.getItem('tt_is_inside_geofence') === 'true';

    geofenceService.logEvent(`GPS update received. Distance to college: ${Math.round(distance)}m.`, 'info');

    // Trigger transition events
    if (isInside && !wasInside) {
      // Transition: Outside -> Inside (User arrived at college!)
      sessionStorage.setItem('tt_is_inside_geofence', 'true');
      geofenceService.handleCampusArrival('GPS Geolocation');
    } else if (!isInside && wasInside) {
      // Transition: Inside -> Outside (User left college)
      sessionStorage.setItem('tt_is_inside_geofence', 'false');
      geofenceService.logEvent('Departed from college campus.', 'info');
    }
  },

  // Trigger campus arrival workflow
  handleCampusArrival: (triggerSource) => {
    geofenceService.logEvent(`Arrived on campus campus via ${triggerSource}! Checking schedule...`, 'success');
    
    // Look for classes happening now or starting in the next 30 minutes
    const todayClasses = geofenceService.getCurrentOrUpcomingClasses();
    const candidateClasses = todayClasses.filter(c => 
      c.markedState === null && 
      (c.status === 'active' || (c.status === 'upcoming' && c.minutesUntilStart <= 30))
    );

    if (candidateClasses.length > 0) {
      const targetClass = candidateClasses[0]; // Choose first class
      geofenceService.logEvent(`Schedule Match: Found [${targetClass.subjectName}] at ${targetClass.timeSlot}.`, 'success');

      // Trigger standard Web notification
      notificationService.notify(
        `📍 Campus Match: You've arrived for [${targetClass.subjectName}]. Click to log attendance!`,
        'info',
        'TrackTaps Geofencing'
      );

      // Trigger custom UI event to display log modal immediately
      window.dispatchEvent(new CustomEvent('tt_geofence_match_detected', { detail: targetClass }));
    } else {
      geofenceService.logEvent('Schedule check complete. No active or upcoming unmarked classes found at this hour.', 'info');
    }
  },

  // Simulate Wi-Fi connection trigger
  simulateWifiConnection: (ssid) => {
    const config = geofenceService.getConfig();
    if (!config.enabled) {
      alert('Please enable Geotrack features first.');
      return;
    }

    if (!config.wifiSsid) {
      geofenceService.logEvent('Wi-Fi check skipped: No target campus Wi-Fi SSID configured.', 'warning');
      alert('Please save a campus Wi-Fi SSID in configurations first.');
      return;
    }

    geofenceService.logEvent(`Checking Wi-Fi network connection...`, 'info');

    if (ssid.trim().toLowerCase() === config.wifiSsid.trim().toLowerCase()) {
      geofenceService.logEvent(`Connected to target campus Wi-Fi: "${ssid}".`, 'success');
      geofenceService.handleCampusArrival(`Campus Wi-Fi SSID (${ssid})`);
    } else {
      geofenceService.logEvent(`Connected to non-campus network: "${ssid}". Ignored.`, 'info');
    }
  }
};

export default geofenceService;
