@echo off
title 🚀 TrackTaps Native Dev Client Server Launcher
color 0b
echo ====================================================================
echo         ⚡ TRACKTAPS NATIVE CUSTOM DEV CLIENT LAUNCHER ⚡
echo ====================================================================
echo.
echo [Step 1 of 2] Locating native hybrid mobile code workspace...
cd /d "%~dp0TrackTapsNative"
echo.
echo [Step 2 of 2] Launching Dev Client Server...
echo.
echo ====================================================================
echo 💡 HOW TO RUN YOUR DEVELOPMENT BUILD:
echo 1. Install your custom compiled Android APK (Development Build)
echo    on your phone.
echo 2. Ensure your phone and this computer are connected to the SAME Wi-Fi.
echo 3. The Metro bundler will start below. Point your custom dev build
echo    app to this local server address, or scan the QR code!
echo.
echo ⚙️ NOTE: To compile a new local development build onto a connected
echo    USB device/emulator, you can run: npx expo run:android
echo ====================================================================
echo.
npx expo start --dev-client
pause
