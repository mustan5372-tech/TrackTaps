@echo off
title 🚀 TrackTaps Native Dev Server Launcher
color 0b
echo ====================================================================
echo             ⚡ TRACKTAPS NATIVE MOBILE APP LAUNCHER ⚡
echo ====================================================================
echo.
echo [Step 1 of 2] Locating native hybrid mobile code workspace...
cd /d "%~dp0TrackTapsNative"
echo.
echo [Step 2 of 2] Launching Expo Dev Server / Metro Bundler...
echo.
echo ====================================================================
echo 💡 HOW TO VIEW THE APP ON YOUR PHONE:
echo 1. Download the "Expo Go" application from the Apple App Store or
echo    Google Play Store on your smartphone.
echo 2. Ensure your phone and this computer are connected to the SAME Wi-Fi.
echo 3. Scan the QR code that will appear below:
echo    - iPhone: Open your normal camera app and scan the QR code.
echo    - Android: Open the Expo Go app and select "Scan QR Code".
echo ====================================================================
echo.
npx expo start
pause
