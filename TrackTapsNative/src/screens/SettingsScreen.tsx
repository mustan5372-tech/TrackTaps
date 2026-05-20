import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useAppStore } from '../store/appStore';

export default function SettingsScreen() {
  const { user, logout, role, attendanceSettings, setAttendanceSettings } = useAppStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn("Logout failed");
    }
  };

  const adjustTarget = (amount: number) => {
    const current = attendanceSettings.defaultTarget || 75;
    const next = Math.min(95, Math.max(50, current + amount));
    setAttendanceSettings({ defaultTarget: next });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>App Configurations</Text>
        <Text style={styles.headerSubtitle}>Customize tracking behaviors, goals and view security profiles.</Text>
      </View>

      {/* User Information */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Student Identity</Text>
        <Text style={styles.profileName}>{user?.displayName || 'Elite Student'}</Text>
        <Text style={styles.profileEmail}>{user?.email || 'guest@tracktaps.online'}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{role}</Text>
          </View>
        </View>
      </View>

      {/* Target Criteria Controls */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Attendance Thresholds</Text>
        <Text style={styles.label}>Default Target Requirement</Text>
        
        <View style={styles.controlRow}>
          <Pressable style={styles.controlBtn} onPress={() => adjustTarget(-5)}>
            <Text style={styles.controlBtnText}>- 5%</Text>
          </Pressable>
          
          <Text style={styles.targetValue}>{attendanceSettings.defaultTarget}%</Text>
          
          <Pressable style={styles.controlBtn} onPress={() => adjustTarget(5)}>
            <Text style={styles.controlBtnText}>+ 5%</Text>
          </Pressable>
        </View>
        <Text style={styles.desc}>
          Most universities require 75% class attendance for exam eligibility.
        </Text>
      </View>

      {/* Logout Pressable Button */}
      <Pressable 
        style={({ pressed }) => [
          styles.logoutBtn,
          pressed && styles.logoutBtnPressed
        ]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutBtnText}>Logout Account</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerBox: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8b5cf6',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  roleBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#a78bfa',
  },
  label: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 12,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
  },
  controlBtn: {
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  controlBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  targetValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  desc: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  logoutBtnPressed: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
