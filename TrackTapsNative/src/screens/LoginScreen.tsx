import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Image } from 'react-native';
import { useAppStore } from '../store/appStore';

export default function LoginScreen() {
  const { login, isAuthLoading } = useAppStore();

  const handleGoogleLogin = async () => {
    try {
      await login();
    } catch (e) {
      console.warn("Authentication failed or cancelled by user");
    }
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Background Glows */}
      <View style={styles.glowPurple} />
      <View style={styles.glowBlue} />

      <View style={styles.contentContainer}>
        {/* Brand/Logo Header */}
        <Text style={styles.brandTitle}>TRACKTAPS</Text>
        <Text style={styles.brandSubtitle}>STAY ELITE • BE PRODUCTIVE</Text>

        {/* Motivational Card Box */}
        <View style={styles.card}>
          <Text style={styles.quoteTitle}>Academic Control Center</Text>
          <Text style={styles.quoteText}>
            "The best way to bunk a class is to know exactly when you're safe."
          </Text>
        </View>

        {/* Google Sign-in Interactive Pressable */}
        {isAuthLoading ? (
          <ActivityIndicator size="large" color="#8b5cf6" style={styles.loader} />
        ) : (
          <Pressable 
            style={({ pressed }) => [
              styles.googleBtn,
              pressed && styles.googleBtnPressed
            ]}
            onPress={handleGoogleLogin}
          >
            <Text style={styles.googleIcon}>🔑</Text>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </Pressable>
        )}

        <Text style={styles.footerText}>
          By signing in, you accept our Terms of Service & Academic Privacy Code.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  glowPurple: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#8b5cf6',
    opacity: 0.15,
  },
  glowBlue: {
    position: 'absolute',
    bottom: '25%',
    right: '5%',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#3b82f6',
    opacity: 0.15,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    zIndex: 1,
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8b5cf6',
    letterSpacing: 4,
    marginBottom: 48,
  },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    width: '100%',
    marginBottom: 48,
  },
  quoteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  quoteText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 28,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  googleBtnPressed: {
    backgroundColor: '#e2e8f0',
    opacity: 0.9,
  },
  googleIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  googleBtnText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loader: {
    marginVertical: 20,
  },
  footerText: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 16,
  },
});
