import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';
import geofenceService, {
  parseLatitude,
  parseLongitude,
  formatLatitudeDisplay,
  formatLongitudeDisplay
} from '../services/geofenceService';
import AttendanceEngine from '../services/attendanceEngine';

export default function GeofenceTracker() {
  const navigate = useNavigate();
  const { calendarEvents, attendanceData, setAttendanceData, pushToCloud, subscription, role } = useAppStore();
  
  const isMegaSaver = subscription && subscription.status === 'active' && subscription.planType === 'yearly';
  const isAdmin = role === 'owner' || role === 'core_admin';
  const hasAccess = isMegaSaver || isAdmin;
  
  // Local states for configuration
  const [enabled, setEnabled] = useState(false);
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [radius, setRadius] = useState(100);
  const [wifiSsid, setWifiSsid] = useState('');
  const [logs, setLogs] = useState([]);

  // Coordinate string inputs supporting decimal degrees and suffix N/S/E/W
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  
  // Simulation states
  const [simulatedInside, setSimulatedInside] = useState(false);
  const [simulatedWifi, setSimulatedWifi] = useState('');
  const [activePromptClass, setActivePromptClass] = useState(null);
  
  // Geolocation watch ID & Leaflet Map instances
  const watchIdRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  // Load configuration on mount
  useEffect(() => {
    const config = geofenceService.getConfig();
    setEnabled(config.enabled);
    setLat(config.lat);
    setLng(config.lng);
    setRadius(config.radius);
    setWifiSsid(config.wifiSsid);
    setLogs(config.logs);

    setLatInput(formatLatitudeDisplay(config.lat));
    setLngInput(formatLongitudeDisplay(config.lng));

    // Listen for log updates in real-time
    const handleLogsUpdate = (e) => {
      setLogs(e.detail);
    };
    window.addEventListener('tt_geofence_logs_updated', handleLogsUpdate);

    // Listen for geofence class match detections
    const handleGeofenceMatch = (e) => {
      setActivePromptClass(e.detail);
    };
    window.addEventListener('tt_geofence_match_detected', handleGeofenceMatch);

    return () => {
      window.removeEventListener('tt_geofence_logs_updated', handleLogsUpdate);
      window.removeEventListener('tt_geofence_match_detected', handleGeofenceMatch);
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Initialize and Sync Leaflet Map
  useEffect(() => {
    let isMounted = true;
    
    const initLeafletMap = () => {
      if (!window.L) return;
      const container = document.getElementById('geofence-map');
      if (!container) return;
      
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      
      const mapLat = lat || 19.123000;
      const mapLng = lng || 72.877000;
      
      const map = window.L.map('geofence-map', {
        zoomControl: true,
        attributionControl: false
      }).setView([mapLat, mapLng], 15);
      
      mapRef.current = map;
      
      // Load dark-themed CartoDB tiles
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(map);
      
      // Custom neon pin marker HTML style
      const pinStyle = `
        background-color: #8b5cf6;
        width: 18px;
        height: 18px;
        display: block;
        left: -9px;
        top: -9px;
        position: relative;
        border-radius: 50%;
        border: 2.5px solid #ffffff;
        box-shadow: 0 0 15px #8b5cf6, 0 0 5px rgba(255,255,255,0.5);
      `;
      
      const pinIcon = window.L.divIcon({
        className: 'custom-leaflet-marker',
        iconAnchor: [0, 0],
        html: `<span style="${pinStyle}" />`
      });

      // Add marker at specified coordinates
      const marker = window.L.marker([mapLat, mapLng], {
        draggable: true,
        icon: pinIcon
      }).addTo(map);
      markerRef.current = marker;
      
      // Add circle representing geofence radius
      const circle = window.L.circle([mapLat, mapLng], {
        color: '#8b5cf6',
        fillColor: '#8b5cf6',
        fillOpacity: 0.15,
        weight: 1.5,
        radius: radius
      }).addTo(map);
      circleRef.current = circle;
      
      // Listen to marker drag events to update values
      marker.on('drag', (e) => {
        const pos = marker.getLatLng();
        circle.setLatLng(pos);
        if (isMounted) {
          const newLat = parseFloat(pos.lat.toFixed(6));
          const newLng = parseFloat(pos.lng.toFixed(6));
          setLat(newLat);
          setLng(newLng);
          setLatInput(formatLatitudeDisplay(newLat));
          setLngInput(formatLongitudeDisplay(newLng));
        }
      });

      // Listen to map clicks to re-center target location
      map.on('click', (e) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        const newLat = parseFloat(clickLat.toFixed(6));
        const newLng = parseFloat(clickLng.toFixed(6));
        
        marker.setLatLng([newLat, newLng]);
        circle.setLatLng([newLat, newLng]);
        
        if (isMounted) {
          setLat(newLat);
          setLng(newLng);
          setLatInput(formatLatitudeDisplay(newLat));
          setLngInput(formatLongitudeDisplay(newLng));
        }
        geofenceService.logEvent('Marker positioned via map click.', 'info');
      });
    };

    // Load Leaflet CDN script/css dynamically
    if (typeof window !== 'undefined') {
      if (!window.L) {
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }
        if (!document.getElementById('leaflet-js')) {
          const script = document.createElement('script');
          script.id = 'leaflet-js';
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => {
            if (isMounted) initLeafletMap();
          };
          document.body.appendChild(script);
        }
      } else {
        initLeafletMap();
      }
    }

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Synchronize Leaflet marker & circle with state updates (typed coordinate changes or captured location)
  useEffect(() => {
    if (mapRef.current && markerRef.current && circleRef.current) {
      const mapLat = lat || 19.123000;
      const mapLng = lng || 72.877000;
      
      const currentPos = markerRef.current.getLatLng();
      if (currentPos.lat !== mapLat || currentPos.lng !== mapLng) {
        markerRef.current.setLatLng([mapLat, mapLng]);
        circleRef.current.setLatLng([mapLat, mapLng]);
        mapRef.current.panTo([mapLat, mapLng]);
      }
      circleRef.current.setRadius(radius);
    }
  }, [lat, lng, radius]);

  // Set up geolocation tracking when enabled
  useEffect(() => {
    if (enabled && hasAccess) {
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        geofenceService.logEvent('Initializing GPS listener...', 'info');
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const currentLat = position.coords.latitude;
            const currentLng = position.coords.longitude;
            geofenceService.checkLocation(currentLat, currentLng);
          },
          (error) => {
            geofenceService.logEvent(`GPS error: ${error.message}`, 'warning');
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } else {
        geofenceService.logEvent('GPS is not supported by this device.', 'warning');
      }
    } else {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        geofenceService.logEvent('GPS listener stopped.', 'info');
      }
    }
  }, [enabled, hasAccess]);

  // Fetch current GPS coordinates from device sensors
  const handleFetchCurrentLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      geofenceService.logEvent('Fetching current GPS coordinates...', 'info');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLat = parseFloat(position.coords.latitude.toFixed(6));
          const currentLng = parseFloat(position.coords.longitude.toFixed(6));
          setLat(currentLat);
          setLng(currentLng);
          setLatInput(formatLatitudeDisplay(currentLat));
          setLngInput(formatLongitudeDisplay(currentLng));
          geofenceService.logEvent('Successfully captured current location!', 'success');
        },
        (error) => {
          geofenceService.logEvent(`GPS capture failed: ${error.message}`, 'warning');
          alert(`Failed to get location: ${error.message}`);
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert('Geolocation not supported by this browser/device.');
    }
  };

  // Coordinate string input handlers
  const handleLatChange = (value) => {
    setLatInput(value);
    const parsed = parseLatitude(value);
    if (!isNaN(parsed) && parsed >= -90 && parsed <= 90) {
      setLat(parsed);
    }
  };

  const handleLatBlur = () => {
    const parsed = parseLatitude(latInput);
    setLatInput(formatLatitudeDisplay(parsed));
  };

  const handleLngChange = (value) => {
    setLngInput(value);
    const parsed = parseLongitude(value);
    if (!isNaN(parsed) && parsed >= -180 && parsed <= 180) {
      setLng(parsed);
    }
  };

  const handleLngBlur = () => {
    const parsed = parseLongitude(lngInput);
    setLngInput(formatLongitudeDisplay(parsed));
  };

  // Save config
  const handleSaveConfig = () => {
    const finalLat = parseLatitude(latInput);
    const finalLng = parseLongitude(lngInput);

    geofenceService.saveConfig({
      enabled,
      lat: finalLat,
      lng: finalLng,
      radius,
      wifiSsid
    });
    
    setLat(finalLat);
    setLng(finalLng);
    setLatInput(formatLatitudeDisplay(finalLat));
    setLngInput(formatLongitudeDisplay(finalLng));
    
    geofenceService.logEvent('Geofence configuration saved.', 'success');
    alert('Configurations saved successfully!');
  };

  // Mock Simulations
  const handleSimulateArrival = () => {
    setSimulatedInside(true);
    sessionStorage.setItem('tt_is_inside_geofence', 'true');
    geofenceService.handleCampusArrival('Simulated Coordinates Match');
  };

  const handleSimulateDeparture = () => {
    setSimulatedInside(false);
    sessionStorage.setItem('tt_is_inside_geofence', 'false');
    geofenceService.logEvent('Simulated GPS Departure from campus.', 'info');
  };

  const handleSimulateWifi = () => {
    const inputSsid = prompt('Enter Wi-Fi SSID to simulate:', wifiSsid || 'College_WiFi');
    if (inputSsid === null) return; // Cancelled
    setSimulatedWifi(inputSsid);
    geofenceService.simulateWifiConnection(inputSsid);
  };

  const handleSimulateWifiDisconnect = () => {
    setSimulatedWifi('');
    geofenceService.logEvent('Disconnected from simulated Wi-Fi.', 'info');
  };

  const handleClearLogs = () => {
    geofenceService.clearLogs();
  };

  // Respond to Geofence Attendance Prompt
  const handleLogAttendance = (state) => {
    if (!activePromptClass) return;
    
    // Mark attendance
    const updatedData = AttendanceEngine.markAttendance(activePromptClass.id, state, attendanceData);
    setAttendanceData(updatedData);
    
    // Trigger Sync to Firebase
    pushToCloud();

    geofenceService.logEvent(
      `Attendance logged: Marked [${activePromptClass.subjectName}] as ${state.toUpperCase()}.`,
      'success'
    );
    
    // Clear prompt modal
    setActivePromptClass(null);
  };

  const todayClasses = geofenceService.getCurrentOrUpcomingClasses();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: 'var(--text-main)' }}>
      
      {/* 🔔 Real-time Attendance Log Overlay Alert */}
      <AnimatePresence>
        {activePromptClass && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(5, 5, 10, 0.7)',
              backdropFilter: 'blur(10px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div style={{
              background: 'linear-gradient(135deg, rgba(20, 20, 35, 0.95) 0%, rgba(10, 10, 20, 0.95) 100%)',
              border: '1.5px solid rgba(139, 92, 246, 0.6)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(139, 92, 246, 0.3)',
              borderRadius: '24px',
              maxWidth: '420px',
              width: '100%',
              padding: '28px',
              textAlign: 'center',
              boxSizing: 'border-box'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📍</div>
              <h3 style={{ fontSize: '20px', fontWeight: '850', color: 'white', margin: '0 0 8px 0' }}>
                Campus Match Found!
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-dim)', margin: '0 0 20px 0', lineHeight: '1.5' }}>
                You have arrived at college. We detected an unmarked class scheduled right now:
              </p>
              
              <div style={{
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '24px',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '11px', color: '#c084fc', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Active Subject
                </div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>
                  {activePromptClass.subjectName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🕒</span> {activePromptClass.timeSlot}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleLogAttendance('present')}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '14px',
                      borderRadius: '12px',
                      fontWeight: '800',
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)'
                    }}
                  >
                    Yes, Attended
                  </button>
                  <button
                    onClick={() => handleLogAttendance('absent')}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '14px',
                      borderRadius: '12px',
                      fontWeight: '800',
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: '0 8px 20px rgba(239, 68, 68, 0.25)'
                    }}
                  >
                    Bunked
                  </button>
                </div>
                <button
                  onClick={() => setActivePromptClass(null)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-dim)',
                    padding: '12px',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Dismiss / Decide Later
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ⚙️ Toggle Section */}
      <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px' }}>
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800' }}>Enable Geotrack Engine</h4>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dim)' }}>
            Automatically detect arrivals at college campus coordinates and Wi-Fi networks.
          </p>
        </div>
        <div 
          onClick={() => {
            if (!hasAccess) {
              navigate('/premium');
              return;
            }
            setEnabled(!enabled);
          }}
          style={{
            width: '56px',
            height: '32px',
            background: !hasAccess ? 'rgba(255,255,255,0.04)' : enabled ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)' : 'rgba(255,255,255,0.08)',
            borderRadius: '100px',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: !hasAccess ? 'center' : enabled ? 'flex-end' : 'flex-start',
            transition: 'background 0.3s',
            boxShadow: (hasAccess && enabled) ? '0 0 15px var(--primary-glow)' : 'none',
            boxSizing: 'border-box'
          }}
        >
          {!hasAccess ? (
            <span style={{ fontSize: '12px' }}>🔒</span>
          ) : (
            <motion.div 
              layout 
              style={{ width: '24px', height: '24px', background: 'white', borderRadius: '50%', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }} 
            />
          )}
        </div>
      </div>

      {/* 📍 Settings Cards & Simulator Wrapper */}
      <div style={{ position: 'relative', minHeight: '300px' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr', 
          gap: '20px',
          filter: !hasAccess ? 'blur(6px)' : 'none',
          pointerEvents: !hasAccess ? 'none' : 'auto',
          userSelect: !hasAccess ? 'none' : 'auto',
          transition: 'filter 0.3s ease'
        }}>
        
        {/* Coordinates Form */}
        <div className="dashboard-card" style={{ padding: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📍</span> College Coordinates Setup
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            {/* Interactive Leaflet Map Selector */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>
                <span>Interactive Map Selector</span>
                <span style={{ color: '#8b5cf6' }}>Tap Map or Drag Pin to Set</span>
              </div>
              <div 
                id="geofence-map" 
                style={{ 
                  height: '240px', 
                  width: '100%', 
                  borderRadius: '16px', 
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  zIndex: 10,
                  overflow: 'hidden',
                  background: '#0a0a14'
                }} 
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>
                  College Latitude
                </label>
                <input
                  type="text"
                  value={latInput}
                  onChange={(e) => handleLatChange(e.target.value)}
                  onBlur={() => handleLatBlur()}
                  placeholder="e.g. 19.123456 N"
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px',
                    color: 'white',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>
                  College Longitude
                </label>
                <input
                  type="text"
                  value={lngInput}
                  onChange={(e) => handleLngChange(e.target.value)}
                  onBlur={() => handleLngBlur()}
                  placeholder="e.g. 72.987654 E"
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px',
                    color: 'white',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
            
            <button
              onClick={handleFetchCurrentLocation}
              style={{
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                color: '#c084fc',
                padding: '10px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              🎯 Capture My Current Location
            </button>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>
                <span>Geofence Radius</span>
                <span style={{ color: '#8b5cf6' }}>{radius} meters</span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                step="25"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary-light)', cursor: 'pointer' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>
                Campus Wi-Fi SSID
              </label>
              <input
                type="text"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                placeholder="e.g. Campus_WiFi_HighSpeed"
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '12px',
                  color: 'white',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <button
            onClick={handleSaveConfig}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
              color: 'white',
              border: 'none',
              padding: '14px',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 6px 20px var(--primary-glow)'
            }}
          >
            Save Configuration
          </button>
        </div>

        {/* 🛠️ Mock Field Tester / Simulator */}
        <div className="dashboard-card" style={{ padding: '24px', border: '1px dashed rgba(139, 92, 246, 0.4)' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🛠️</span> GeoTrack Field Simulator / Tester
          </h4>
          <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--text-dim)' }}>
            Simulate location and Wi-Fi networks in real-time to test triggers without leaving your home.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '12px', alignItems: 'center', justifyContent: 'space-around' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>GPS Location</span>
                <span style={{ fontSize: '12px', fontWeight: '800', color: simulatedInside ? '#10b981' : '#ef4444' }}>
                  {simulatedInside ? '📍 Inside College' : '🚲 Outside College'}
                </span>
              </div>
              <div style={{ width: '1px', height: '30px', background: 'var(--border)' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Wi-Fi Link</span>
                <span style={{ fontSize: '12px', fontWeight: '800', color: simulatedWifi ? '#10b981' : 'var(--text-dim)' }}>
                  {simulatedWifi ? `📶 ${simulatedWifi}` : '❌ Not Linked'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={handleSimulateArrival}
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Mock GPS Entrance
              </button>
              <button
                onClick={handleSimulateDeparture}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Mock GPS Departure
              </button>
              <button
                onClick={handleSimulateWifi}
                style={{
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  color: '#c084fc',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Link mock Wi-Fi
              </button>
              <button
                onClick={handleSimulateWifiDisconnect}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-dim)',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Unlink mock Wi-Fi
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 📅 Today's Schedule status */}
      <div className="dashboard-card" style={{ padding: '24px' }}>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📅</span> Today's Class Schedule
        </h4>
        <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--text-dim)' }}>
          Real-time parser analysis of your timetable classes.
        </p>

        {todayClasses.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', color: 'var(--text-dim)', fontSize: '12px' }}>
            No classes scheduled for today.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {todayClasses.map(cls => (
              <div 
                key={cls.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '12px 16px'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cls.color }}></span>
                    {cls.subjectName}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                    🕒 {cls.timeSlot}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {cls.markedState ? (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      textTransform: 'uppercase',
                      background: cls.markedState === 'present' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: cls.markedState === 'present' ? '#10b981' : '#ef4444'
                    }}>
                      {cls.markedState}
                    </span>
                  ) : (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '800',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      textTransform: 'uppercase',
                      background: cls.status === 'active' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                      color: cls.status === 'active' ? '#c084fc' : 'var(--text-dim)',
                      animation: cls.status === 'active' ? 'pulse 2s infinite' : 'none'
                    }}>
                      {cls.status === 'active' ? 'Active Now' : cls.status === 'upcoming' ? `Starts in ${cls.minutesUntilStart}m` : cls.status === 'past' ? 'Past' : 'Today'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 💻 Diagnostics log Terminal */}
      <div className="dashboard-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💻</span> Diagnostic Logs
          </h4>
          <button
            onClick={handleClearLogs}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#f87171',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Clear Console
          </button>
        </div>

        <div style={{
          background: '#040711',
          border: '1.5px solid rgba(255,255,255,0.04)',
          borderRadius: '12px',
          padding: '16px',
          height: '180px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontFamily: 'monospace',
          fontSize: '11px',
          lineHeight: '1.4',
          boxSizing: 'border-box'
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#4b5563', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
              No log messages received yet. Enable engine and click simulation actions above to generate logs.
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: '#4b5563', flexShrink: 0 }}>[{log.timestamp.split(', ')[1] || log.timestamp}]</span>
                <span style={{
                  color: log.type === 'success' ? '#34d399' : log.type === 'warning' ? '#fbbf24' : '#9ca3af',
                  whiteSpace: 'pre-wrap'
                }}>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 🔒 Paywall Lock Overlay */}
      {!hasAccess && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          boxSizing: 'border-box'
        }}>
          <div className="dashboard-card" style={{
            maxWidth: '460px',
            width: '100%',
            padding: '40px 32px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1.5px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '24px',
            boxShadow: '0 30px 60px rgba(0,0,0,0.6), 0 0 40px rgba(245, 158, 11, 0.15)',
            boxSizing: 'border-box'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px', filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.4))' }}>🔒</div>
            <h3 style={{ fontSize: '22px', fontWeight: '850', marginBottom: '14px', color: '#f59e0b', letterSpacing: '-0.01em' }}>
              Mega Saver Exclusive Feature
            </h3>
            <p style={{
              color: 'var(--text-dim)',
              fontSize: '13.5px',
              lineHeight: 1.6,
              marginBottom: '30px',
              padding: '0 8px'
            }}>
              GeoTrack Auto-Attendance automatically monitors your campus arrivals using college coordinates and Wi-Fi SSID connections, and logs attendance instantly.
            </p>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/premium')}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                border: 'none',
                padding: '16px',
                borderRadius: '16px',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)'
              }}
            >
              {subscription && subscription.status === 'active' && subscription.planType === 'half_yearly' 
                ? 'Upgrade to Mega Saver for ₹8' 
                : 'Unlock Mega Saver for ₹15/year'}
            </motion.button>
          </div>
        </div>
      )}
    </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
