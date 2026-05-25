import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Platform, Pressable, Animated } from 'react-native';
import { 
  NativeAdView, 
  NativeAsset, 
  NativeAssetType, 
  NativeAd, 
  TestIds 
} from 'react-native-google-mobile-ads';
import { useAppStore } from '../store/appStore';
import { shouldShowAds } from './AdBanner';

// Native Advanced Ad Unit Configuration
const AD_UNIT_ID = __DEV__ 
  ? TestIds.NATIVE 
  : 'ca-app-pub-2979111018616024/3122110099';

export default function NativeAdCard() {
  const { user, role } = useAppStore();
  const [nativeAd, setNativeAd] = useState<any>(null);
  const [adFailed, setAdFailed] = useState(false);
  const displayAds = shouldShowAds(user, role);

  // Animated glow opacity for Premium Ad-Free Experience
  const pulseAnim = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    if (!displayAds) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.95,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.45,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [displayAds]);

  // Async loader for Native Advanced Ads (Free / Guest users only)
  useEffect(() => {
    if (displayAds) {
      let isMounted = true;
      NativeAd.createForAdRequest(AD_UNIT_ID)
        .then((ad) => {
          if (isMounted) {
            setNativeAd(ad);
            console.log('[AdMob Native] Native Advanced Ad loaded successfully');
          }
        })
        .catch((error) => {
          if (isMounted) {
            setAdFailed(true);
            console.log('[AdMob Native] Failed to load native ad, silently hiding:', error.message);
          }
        });

      return () => {
        isMounted = false;
      };
    }
  }, [displayAds]);

  // PREMIUM AD-FREE COMPONENT RENDER (Glassmorphic Pulsating UI)
  if (!displayAds) {
    return (
      <View style={styles.premiumContainer}>
        <Animated.View style={[styles.premiumCard, { opacity: pulseAnim }]}>
          <Text style={styles.glowIndicator}>✨</Text>
          <Text style={styles.premiumText}>Premium Ad-Free Experience</Text>
          <Text style={styles.glowIndicator}>✨</Text>
        </Animated.View>
      </View>
    );
  }

  // SILENT HIDE COMPONENT RENDER
  if (adFailed || !nativeAd) {
    return null;
  }

  // Resolve native ad elements
  const advertiserName = nativeAd.advertiser || 'Sponsored';
  const iconSource = typeof nativeAd.icon === 'string' 
    ? { uri: nativeAd.icon } 
    : nativeAd.icon?.url 
      ? { uri: nativeAd.icon.url } 
      : nativeAd.icon?.uri 
        ? { uri: nativeAd.icon.uri } 
        : null;

  return (
    <View style={styles.adOuterWrapper}>
      <NativeAdView nativeAd={nativeAd} style={styles.adContainer}>
        <View style={styles.headerRow}>
          {iconSource && (
            <NativeAsset assetType={NativeAssetType.ICON}>
              <Image source={iconSource} style={styles.adIcon} resizeMode="cover" />
            </NativeAsset>
          )}
          <View style={styles.headerText}>
            <View style={styles.badgeRow}>
              <Text style={styles.adLabel}>AD</Text>
              <NativeAsset assetType={NativeAssetType.ADVERTISER}>
                <Text style={styles.advertiserText} numberOfLines={1}>
                  {advertiserName}
                </Text>
              </NativeAsset>
            </View>
            <NativeAsset assetType={NativeAssetType.HEADLINE}>
              <Text style={styles.headlineText} numberOfLines={1}>
                {nativeAd.headline || 'Sponsored Link'}
              </Text>
            </NativeAsset>
          </View>
        </View>

        <NativeAsset assetType={NativeAssetType.BODY}>
          <Text style={styles.bodyText} numberOfLines={2}>
            {nativeAd.body || 'Tap to learn more and explore options from this sponsor.'}
          </Text>
        </NativeAsset>

        {nativeAd.callToAction && (
          <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
            <View style={styles.ctaButton}>
              <Text style={styles.ctaText}>{nativeAd.callToAction.toUpperCase()}</Text>
            </View>
          </NativeAsset>
        )}
      </NativeAdView>
    </View>
  );
}

const styles = StyleSheet.create({
  premiumContainer: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
        shadowColor: '#8b5cf6',
      },
    }),
  },
  premiumText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginHorizontal: 8,
    textShadowColor: 'rgba(139, 92, 246, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  glowIndicator: {
    fontSize: 14,
  },
  adOuterWrapper: {
    width: '100%',
    marginVertical: 14,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(30, 41, 59, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    ...Platform.select({
      ios: {
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
        shadowColor: '#8b5cf6',
      },
    }),
  },
  adContainer: {
    padding: 16,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  adIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  adLabel: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderWidth: 0.5,
    borderRadius: 4,
    color: '#fbbf24',
    fontSize: 8,
    fontWeight: 'bold',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    marginRight: 6,
    letterSpacing: 0.5,
  },
  advertiserText: {
    color: '#c084fc',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    maxWidth: 120,
  },
  headlineText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  bodyText: {
    color: '#94a3b8',
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 12,
  },
  ctaButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
