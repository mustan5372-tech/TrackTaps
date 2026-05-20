import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, Pressable } from 'react-native';
import { useAppStore } from '../store/appStore';
import AttendanceEngine from '../services/attendanceEngine';

export default function DashboardScreen() {
  const { subjects, calendarEvents, attendanceData, attendanceSettings, fullSync } = useAppStore();

  useEffect(() => {
    fullSync();
  }, []);

  const stats = AttendanceEngine.calculateOverallStats(
    subjects,
    calendarEvents,
    attendanceData,
    attendanceSettings
  );

  const streak = AttendanceEngine.calculateAttendanceStreak(attendanceData);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Dynamic Summary Panel */}
      <View style={styles.summaryCard}>
        <View style={styles.glowAura} />
        
        <View style={styles.summaryHeader}>
          <Text style={styles.percentageText}>{stats.overallPercentage}%</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>
              {stats.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.summaryLabel}>Overall Semester Attendance</Text>
        
        {/* Metric Dividers */}
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.gridValue}>{stats.totalPresent}</Text>
            <Text style={styles.gridLabel}>Attended</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridValue}>{stats.totalAbsent}</Text>
            <Text style={styles.gridLabel}>Bunked</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridValue}>{streak} 🔥</Text>
            <Text style={styles.gridLabel}>Streak</Text>
          </View>
        </View>
      </View>

      {/* Verified Premium Diamond Badge Indicator */}
      <View style={styles.premiumBox}>
        <Text style={styles.premiumIcon}>💎</Text>
        <View>
          <Text style={styles.premiumTitle}>VERIFIED ELITE RETENTION</Text>
          <Text style={styles.premiumDesc}>Advanced calculator and prediction insights active.</Text>
        </View>
      </View>

      {/* Subject list */}
      <Text style={styles.sectionTitle}>Tracked Class Load</Text>
      
      {subjects.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No subjects loaded yet. Set up your timetable to start tracking!</Text>
        </View>
      ) : (
        subjects.map((sub, idx) => {
          const subStat = stats.subjectStats.find(s => s.subjectName === sub.name);
          const percent = subStat?.percentage || 0;

          return (
            <View key={sub.name || idx} style={styles.subjectCard}>
              <View style={[styles.colorIndicator, { backgroundColor: sub.color || '#8b5cf6' }]} />
              <View style={styles.subjectDetails}>
                <Text style={styles.subjectName}>{sub.name}</Text>
                <Text style={styles.subjectProgress}>
                  {subStat?.present} of {subStat?.total} classes
                </Text>
              </View>
              <View style={styles.subjectPercentBox}>
                <Text style={[
                  styles.subjectPercent,
                  { color: subStat?.status === 'safe' ? '#10b981' : subStat?.status === 'warning' ? '#f59e0b' : '#ef4444' }
                ]}>
                  {percent}%
                </Text>
                <Text style={styles.subjectTarget}>Target: {sub.criteria || 75}%</Text>
              </View>
            </View>
          );
        })
      )}
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
  summaryCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 24,
  },
  glowAura: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#8b5cf6',
    opacity: 0.25,
    filter: 'blur(20px)',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  percentageText: {
    fontSize: 54,
    fontWeight: '900',
    color: '#ffffff',
  },
  statusBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#a78bfa',
    letterSpacing: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.1)',
    paddingTop: 20,
  },
  gridItem: {
    alignItems: 'center',
    flex: 1,
  },
  gridValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  gridLabel: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  premiumBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    marginBottom: 28,
  },
  premiumIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  premiumTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
    marginBottom: 2,
  },
  premiumDesc: {
    fontSize: 11,
    color: '#a78bfa',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  emptyCard: {
    backgroundColor: '#1e293b80',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#33415550',
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
    marginBottom: 12,
  },
  colorIndicator: {
    width: 6,
    height: 40,
    borderRadius: 3,
    marginRight: 16,
  },
  subjectDetails: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subjectProgress: {
    fontSize: 12,
    color: '#64748b',
  },
  subjectPercentBox: {
    alignItems: 'flex-end',
  },
  subjectPercent: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subjectTarget: {
    fontSize: 10,
    color: '#64748b',
  },
});
