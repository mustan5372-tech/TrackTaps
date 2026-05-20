import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAppStore } from '../store/appStore';

export default function TimetableScreen() {
  const { timetable, subjects } = useAppStore();
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>Daily Timetable</Text>
        <Text style={styles.headerSubtitle}>View and map scheduled lecture slots throughout the week.</Text>
      </View>

      {days.map((day, dayIdx) => {
        // Collect slots for this day
        const slotsForDay = timeSlots.map((slot, slotIdx) => {
          const cellKey = `${dayIdx}-${slotIdx}`;
          const entry = timetable[cellKey];
          return { slot, entry };
        }).filter(item => item.entry);

        return (
          <View key={day} style={styles.dayGroup}>
            <Text style={styles.dayHeader}>{day}</Text>
            {slotsForDay.length === 0 ? (
              <View style={styles.noClassesCard}>
                <Text style={styles.noClassesText}>No classes scheduled</Text>
              </View>
            ) : (
              slotsForDay.map(({ slot, entry }, idx) => (
                <View key={idx} style={styles.slotCard}>
                  <Text style={styles.slotTime}>{slot}</Text>
                  <View style={styles.slotDetails}>
                    <Text style={styles.subjectName}>{entry?.name}</Text>
                    <View style={[styles.colorPill, { backgroundColor: entry?.color || '#8b5cf6' }]} />
                  </View>
                </View>
              ))
            )}
          </View>
        );
      })}
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
  dayGroup: {
    marginBottom: 24,
  },
  dayHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8b5cf6',
    letterSpacing: 1.5,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.25)',
    paddingBottom: 4,
  },
  noClassesCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.05)',
  },
  noClassesText: {
    color: '#475569',
    fontSize: 13,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.08)',
    marginBottom: 8,
  },
  slotTime: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#94a3b8',
    width: 80,
  },
  slotDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  colorPill: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
