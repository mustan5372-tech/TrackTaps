import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAppStore } from '../store/appStore';
import AttendanceEngine from '../services/attendanceEngine';
import NativeAdCard from '../components/NativeAdCard';

export default function InsightsScreen() {
  const { subjects, calendarEvents, attendanceData, attendanceSettings } = useAppStore();

  const insights = AttendanceEngine.generateInsights(
    subjects,
    calendarEvents,
    attendanceData,
    attendanceSettings
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>Attendance Insights</Text>
        <Text style={styles.headerSubtitle}>Algorithmic analysis of your classroom trends and warning signs.</Text>
      </View>

      {insights.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No insights available yet. Track more classes or customize settings to see analysis!</Text>
        </View>
      ) : (
        insights.map((item, idx) => (
          <View key={idx} style={[
            styles.insightCard,
            item.type === 'critical' ? styles.cardCritical : item.type === 'warning' ? styles.cardWarning : styles.cardInfo
          ]}>
            <View style={styles.cardHeader}>
              <Text style={styles.insightIcon}>
                {item.type === 'critical' ? '🚨' : item.type === 'warning' ? '⚠️' : '💡'}
              </Text>
              <Text style={[
                styles.insightTitle,
                item.type === 'critical' ? styles.textCritical : item.type === 'warning' ? styles.textWarning : styles.textInfo
              ]}>
                {item.title}
              </Text>
            </View>
            <Text style={styles.insightMessage}>{item.message}</Text>
          </View>
        ))
      )}

      {/* Native Advanced Ad placement (Insights page bottom) */}
      <NativeAdCard />
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
    marginBottom: 20,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  insightCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardCritical: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  cardWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  cardInfo: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  textCritical: {
    color: '#f87171',
  },
  textWarning: {
    color: '#fbbf24',
  },
  textInfo: {
    color: '#60a5fa',
  },
  insightMessage: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 20,
    paddingLeft: 30,
  },
});
