import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigation from './src/screens/NavigationContainer';
import { useAppStore } from './src/store/appStore';

export default function App() {
  const { initAuth } = useAppStore();

  useEffect(() => {
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
