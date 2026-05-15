# TrackTaps Changelog

All notable changes to the TrackTaps platform will be documented in this file.

## [v0.9.5] - 2026-05-15
### 🛡️ Stability & Architecture (Current Phase)
- **Attendance Date Barrier**: Implemented production-grade reconciliation. Manual marks are now filtered against `lastSyncDate` to eliminate the "Double-Counting" bug.
- **CORE_MEMBER Role**: Introduced a new administrative tier for moderated access (assigned to Purandar Yadav).
- **Admin Dashboard Restoration**: Fixed critical JSX syntax and structural errors in the moderation panel.
- **Localhost API Stability**: Resolved port conflicts (moved backend to 3001) and added defensive JSON parsing to prevent "Unexpected end of JSON input" crashes.
- **Safe Dev Workflow**: Added `npm run dev:all` script for synchronized local testing of Frontend + Backend.

### 📱 UI/UX Polishing
- **Calendar Intelligence**: Added smart feedback for dates outside the semester range.
- **Defensive Error Handling**: Replaced brittle `res.json()` calls with "Safe Parse" logic across the Pod.ai dashboard and App Store.

## [v0.9.0] - 2026-05-14
### ✨ Features
- Premium Theme Engine integration.
- Native Android Auth (Capacitor) improvements.
- Pod.ai Auto-Sync (Beta).
