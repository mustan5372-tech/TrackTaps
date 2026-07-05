# 🚀 APK & Web Update Flow (Fully Dynamic)

This document contains the exact step-by-step process required to deploy a new version of TrackTaps. 

*Note: The entire system is now **Dynamic**! The build scripts and the Download page automatically read from `version.json`, meaning you never have to manually rename files or update JSX variables ever again!*

---

### Step 1: Bump the Live Version (`public/version.json`)
This file controls the update banner logic, the build script output name, and the Download Page URL. 
Update the version number and changelog.
```json
{
  "version": "3.5.2",
  "min_required_version": "1.0.0",
  "platform": "production",
  "last_updated": "2026-07-04",
  "update_url": "https://www.tracktaps.online/download",
  "changelog": "✨ Version 3.5.2: Bug fixes and performance improvements."
}
```

### Step 2: Bump the Native App Version (`android/app/build.gradle`)
This is **critical** to make the update banner disappear after a user installs the new APK.
Find `defaultConfig` and increment the `versionCode` by 1, and match the `versionName` to Step 1.
```gradle
defaultConfig {
    // ...
    versionCode 15
    versionName "3.5.2"
    // ...
}
```

### Step 3: Run the Universal Automation Script
Run this single PowerShell block in your terminal to automatically sync the web assets, build the new APK, copy it to the root, bundle the web frontend, and push to GitHub (which triggers Vercel). 
Because `package.json` and the React frontend are now dynamic, the script will perfectly name and route your new APK version!

```powershell
# Set Java path (Change if using different JDK)
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

# Sync web assets to Android and Build the Release APK
npx cap sync android
cd android
.\gradlew assembleRelease
cd ..

# Copy the built APK to the root
Copy-Item "android\app\build\outputs\apk\release\app-release.apk" -Destination "TrackTaps.apk" -Force

# Build the Web App (This now dynamically outputs to dist/TrackTaps_v[VERSION].apk)
npm run build

# Commit and Push to GitHub (Triggers Vercel)
git add .
git commit -m "build: Deploy version update"
git push
```
