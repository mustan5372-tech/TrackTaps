import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer as RNNavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet } from 'react-native';

// Stub screens to be imported
import DashboardScreen from './DashboardScreen';
import BunkCalculatorScreen from './BunkCalculatorScreen';
import TimetableScreen from './TimetableScreen';
import LeaderboardScreen from './LeaderboardScreen';
import SettingsScreen from './SettingsScreen';
import LoginScreen from './LoginScreen';

import { useAppStore } from '../store/appStore';

export type RootStackParamList = {
  MainTabs: undefined;
  Login: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  BunkCalculator: undefined;
  Timetable: undefined;
  Leaderboard: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#0f172a',
          borderBottomWidth: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        },
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: '#94a3b8',
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>📊</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="BunkCalculator" 
        component={BunkCalculatorScreen} 
        options={{
          tabBarLabel: 'Bunk Calc',
          title: 'Bunk Calculator',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🧮</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Timetable" 
        component={TimetableScreen} 
        options={{
          tabBarLabel: 'Timetable',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>📅</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Leaderboard" 
        component={LeaderboardScreen} 
        options={{
          tabBarLabel: 'Elite',
          title: 'Leaderboard',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🏆</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigation() {
  const { user } = useAppStore();

  return (
    <RNNavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {user ? (
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </RNNavigationContainer>
  );
}
