import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function LeaderboardScreen() {
  const eliteUsers = [
    { rank: 1, name: 'Purandar Yadav', attendance: '98.5%', points: '2,450 XP', tag: 'GOLD GLOW' },
    { rank: 2, name: 'Sana Shaikh', attendance: '96.2%', points: '2,100 XP', tag: 'SILVER' },
    { rank: 3, name: 'Mustafa N.', attendance: '95.8%', points: '1,980 XP', tag: 'BRONZE' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>Elite Leaderboard</Text>
        <Text style={styles.headerSubtitle}>Compare stats and claim your rank in the TrackTaps elite circle.</Text>
      </View>

      {/* Top 3 ranks summary */}
      <View style={styles.topThreeCard}>
        <Text style={styles.premiumGateTitle}>💎 PREMIUM ACCESS ACTIVE</Text>
        <Text style={styles.premiumGateDesc}>Showing top elite cohort based on weekly consistency streaks.</Text>
      </View>

      {eliteUsers.map((item, idx) => (
        <View key={idx} style={[
          styles.rankCard,
          item.rank === 1 && styles.rankCardGold
        ]}>
          <View style={styles.rankLeft}>
            <View style={[
              styles.rankBadge,
              item.rank === 1 ? styles.badgeGold : item.rank === 2 ? styles.badgeSilver : styles.badgeBronze
            ]}>
              <Text style={styles.rankNumberText}>{item.rank}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userTag}>{item.tag}</Text>
            </View>
          </View>
          <View style={styles.rankRight}>
            <Text style={styles.attendanceText}>{item.attendance}</Text>
            <Text style={styles.pointsText}>{item.points}</Text>
          </View>
        </View>
      ))}
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
  topThreeCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    marginBottom: 24,
  },
  premiumGateTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#a78bfa',
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  premiumGateDesc: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.08)',
    marginBottom: 12,
  },
  rankCardGold: {
    borderColor: 'rgba(234, 179, 8, 0.3)',
    backgroundColor: 'rgba(234, 179, 8, 0.05)',
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  badgeGold: {
    backgroundColor: '#eab308',
  },
  badgeSilver: {
    backgroundColor: '#94a3b8',
  },
  badgeBronze: {
    backgroundColor: '#b45309',
  },
  rankNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  userTag: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  rankRight: {
    alignItems: 'flex-end',
  },
  attendanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 2,
  },
  pointsText: {
    fontSize: 11,
    color: '#64748b',
  },
});
