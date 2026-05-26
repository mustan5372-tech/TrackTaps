import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useAppStore } from '../store/appStore';

// Ad Unit configuration: Use official test banner ID in development, production ID in release
const AD_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : 'ca-app-pub-2979111018616024/3848868406';

export function shouldShowAds(user: any, role: string): boolean {
  if (!user) {
    // Guest users get ads
    return true;
  }

  const userRole = (role || 'user').toLowerCase();
  if (
    userRole === 'admin' ||
    userRole === 'core' ||
    userRole === 'owner' ||
    userRole === 'core_admin' ||
    userRole === 'core_member'
  ) {
    // Admins, Core team, and Owners are ad-free
    return false;
  }

  const plan = (user.plan || 'free').toLowerCase();
  if (
    plan === 'monthly' ||
    plan === 'megasaver' ||
    plan === 'supersaver' ||
    plan === 'plus' ||
    plan === 'premium'
  ) {
    // Premium subscriptions are ad-free
    return false;
  }

  return true;
}

export default function AdBanner() {
  const { user, role } = useAppStore();
  const [adFailed, setAdFailed] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);

  const displayAds = shouldShowAds(user, role);

  // PREMIUM AD-FREE LUXURY UX
  if (!displayAds) {
    return (
      <View style={styles.premiumContainer}>
        <View style={styles.premiumCard}>
          <Text style={styles.glowIndicator}>✨</Text>
          <Text style={styles.premiumText}>Premium Ad-Free Experience Enabled</Text>
          <Text style={styles.glowIndicator}>✨</Text>
        </View>
      </View>
    );
  }

  // SILENT HIDE ERROR HANDLING
  if (adFailed) {
    return null;
  }

  return (
    <View style={[styles.adContainer, !adLoaded && styles.adPlaceholderCollapsed]}>
      <BannerAd
        unitId={AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          setAdLoaded(true);
          console.log('[AdMob] Banner ad loaded successfully');
        }}
        onAdFailedToLoad={(error) => {
          setAdFailed(true);
          console.log('[AdMob] Banner ad failed to load, silently hiding:', error.message);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  premiumContainer: {
    width: '100%',
    paddingHorizontal: 4,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
        shadowColor: '#8b5cf6',
      },
    }),
  },
  premiumText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginHorizontal: 8,
    textShadowColor: 'rgba(139, 92, 246, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  glowIndicator: {
    fontSize: 12,
  },
  adContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    minHeight: 50,
  },
  adPlaceholderCollapsed: {
    minHeight: 0,
    marginVertical: 0,
  },
});
