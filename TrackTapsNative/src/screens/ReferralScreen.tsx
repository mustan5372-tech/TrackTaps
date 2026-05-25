import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Share } from 'react-native';
import { useAppStore } from '../store/appStore';
import NativeAdCard from '../components/NativeAdCard';

export default function ReferralScreen() {
  const { user } = useAppStore();
  const referralCode = user?.uid ? user.uid.substring(0, 6).toUpperCase() : 'JOINNOW';
  
  const handleShare = async () => {
    try {
      await Share.share({
        message: `🎁 Get premium ad-free academic tracking on TrackTaps! Use my invite code: ${referralCode} to sign up at https://tracktaps.online/`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>Referral Perks</Text>
        <Text style={styles.headerSubtitle}>Invite peers to join TrackTaps and unlock premium benefits.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📢 Growth Initiative</Text>
        <Text style={styles.cardDesc}>
          Share the gift of automated attendance tracking. For every 3 friends who sync their academic portals, you receive a free month of Mega Saver tier tracking!
        </Text>
      </View>

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>YOUR INVITATION CODE</Text>
        <Text style={styles.codeText}>{referralCode}</Text>
        
        <Pressable style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareBtnText}>Share Invitation Link</Text>
        </Pressable>
      </View>

      <View style={styles.metricsBox}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>0</Text>
          <Text style={styles.metricLabel}>Invited</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>0</Text>
          <Text style={styles.metricLabel}>Unlocked Tiers</Text>
        </View>
      </View>

      {/* Native Advanced Ad placement (Referral page bottom) */}
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
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardDesc: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  codeCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    alignItems: 'center',
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#a78bfa',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  codeText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 20,
  },
  shareBtn: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  metricsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.05)',
    padding: 16,
    marginBottom: 20,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
  },
});
