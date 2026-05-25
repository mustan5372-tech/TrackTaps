import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import mobileAds from 'react-native-google-mobile-ads';
import AppNavigation from './src/screens/NavigationContainer';
import { useAppStore } from './src/store/appStore';

export default function App() {
  const { initAuth } = useAppStore();

  useEffect(() => {
    // Initialize Google Mobile Ads SDK natively on start
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
        console.log('[AdMob] Google Mobile Ads SDK initialized successfully');
      })
      .catch(error => {
        console.warn('[AdMob] Google Mobile Ads SDK initialization failed:', error);
      });

    // Proactively initialize Native Google Session tracking when app mounts
    const unsubscribe = initAuth();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigation />
    </SafeAreaProvider>
  );
}
