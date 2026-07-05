# 🚀 APK & Web Update Flow

This scratchpad contains the exact step-by-step process required to deploy a new version of TrackTaps to both the Android APK and the live Vercel web server. 

By following this flow, the in-app **Update Banner** will correctly trigger for users on older versions, and will properly disappear once they install the new version.

---

### Step 1: Bump the Live Version (`public/version.json`)
This file controls the update banner logic. Update the version number and changelog.
```json
{
  "version": "3.5.1",
  "min_required_version": "1.0.0",
  "platform": "production",
  "last_updated": "2026-07-03",
  "update_url": "https://www.tracktaps.online/download",
  "changelog": "✨ Version 3.5.1: Added Liquid Glass micro-animations, page transitions, hover pulses, and fluid UI elements."
}
```

### Step 2: Bump the Native App Version (`android/app/build.gradle`)
This is **critical**. If you don't update this, the newly built APK will still think it is the old version, and the update banner will *never disappear*.
Find `defaultConfig` and increment the `versionCode` by 1, and match the `versionName` to Step 1.
```gradle
defaultConfig {
    // ...
    versionCode 14
    versionName "3.5.1"
    // ...
}
```

### Step 3: Sync Capacitor & Build the APK
Set the correct Java path (if using command line) and run the gradle build.
```powershell
# Sync web assets to Android
npx cap sync android

# Set Java path (Change if using different JDK)
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

# Build the Release APK
cd android
.\gradlew assembleRelease
cd ..
```

### Step 4: Copy the APK to the Root Folder
The build script in `package.json` expects the new APK to be in the root directory named `TrackTaps.apk`.
```powershell
Copy-Item "android\app\build\outputs\apk\release\app-release.apk" -Destination "TrackTaps.apk" -Force
```

### Step 5: Build the Web App
This will bundle the React frontend and automatically copy `TrackTaps.apk` into `dist/TrackTaps_v3.5.1.apk`.
```powershell
# (Make sure package.json build script has the correct output version name)
npm run build
```

### Step 6: Commit and Push to GitHub (Triggers Vercel)
This makes the new `version.json` live, triggering the update banner for all users on older versions.
```powershell
git add .
git commit -m "build: Deploy version 3.5.1 APK and Web"
git push
```

---
### 🛠️ One-Click Automation Script
If you want to run steps 3-6 automatically in PowerShell, you can use this block:
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
npx cap sync android
cd android
.\gradlew assembleRelease
cd ..
Copy-Item "android\app\build\outputs\apk\release\app-release.apk" -Destination "TrackTaps.apk" -Force
npm run build
git add .
git commit -m "chore: Update APK and deploy"
git push
```
