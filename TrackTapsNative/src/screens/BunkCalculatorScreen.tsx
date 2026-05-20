import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAppStore } from '../store/appStore';
import AttendanceEngine from '../services/attendanceEngine';

export default function BunkCalculatorScreen() {
  const { subjects, calendarEvents, attendanceData, timetable, semesterSettings, attendanceSettings } = useAppStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>Bunk Projections</Text>
        <Text style={styles.headerSubtitle}>Analyze exactly how many classes you can afford to skip.</Text>
      </View>

      {subjects.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Set up your subjects to enable the bunk calculator insights!</Text>
        </View>
      ) : (
        subjects.map((sub, idx) => {
          const metrics = AttendanceEngine.calculateSemesterSubjectMetrics(
            sub.name,
            semesterSettings,
            timetable,
            calendarEvents,
            attendanceData,
            subjects,
            attendanceSettings
          );

          const isCritical = metrics.status === 'critical';

          return (
            <View key={sub.name || idx} style={styles.calcCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.subjectName}>{sub.name}</Text>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: metrics.status === 'safe' ? '#10b981' : metrics.status === 'warning' ? '#f59e0b' : '#ef4444' }
                ]} />
              </View>

              {/* Bunk vs Attend Stats */}
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Text style={[
                    styles.metricValue,
                    { color: metrics.bunkableNow > 0 ? '#10b981' : '#64748b' }
                  ]}>
                    {metrics.bunkableNow}
                  </Text>
                  <Text style={styles.metricLabel}>Safe Skips</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.metricItem}>
                  <Text style={[
                    styles.metricValue,
                    { color: metrics.mustAttend > 0 ? '#ef4444' : '#64748b' }
                  ]}>
                    {metrics.mustAttend}
                  </Text>
                  <Text style={styles.metricLabel}>Must Attend</Text>
                </View>
              </View>

              {/* Recommendation message */}
              <View style={styles.adviceBox}>
                <Text style={styles.adviceText}>
                  {metrics.bunkableNow > 0 
                    ? `🎉 You are safe to bunk the next ${metrics.bunkableNow} classes of this subject while maintaining your target.` 
                    : metrics.mustAttend > 0 
                      ? `🚨 Alert! You need to attend ${metrics.mustAttend} consecutive classes to recover your ${metrics.target}% attendance.`
                      : `🏖️ You are exactly at your target. Do not miss the next class!`
                  }
                </Text>
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
  calcCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
    paddingBottom: 12,
    marginBottom: 16,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
  },
  adviceBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: 12,
    padding: 12,
  },
  adviceText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
    textAlign: 'center',
  },
});
