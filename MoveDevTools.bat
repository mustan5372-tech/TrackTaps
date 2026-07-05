@echo off
echo Moving Heavy Developer Folders (Android SDK, Gradle, VSCode) to D: Drive...
echo Please ensure Android Studio and VS Code are COMPLETELY CLOSED.
echo.
pause

:: Create target directories
mkdir "D:\DevData_Backup" 2>nul
mkdir "D:\DevData_Backup\AndroidSdk" 2>nul
mkdir "D:\DevData_Backup\.gradle" 2>nul
mkdir "D:\DevData_Backup\.vscode" 2>nul

echo.
echo [1/3] Moving Android SDK (This may take several minutes)...
robocopy "C:\Users\sanaw\AppData\Local\Android\Sdk" "D:\DevData_Backup\AndroidSdk" /E /MOVE
if exist "C:\Users\sanaw\AppData\Local\Android\Sdk" rmdir /s /q "C:\Users\sanaw\AppData\Local\Android\Sdk"
mklink /J "C:\Users\sanaw\AppData\Local\Android\Sdk" "D:\DevData_Backup\AndroidSdk"

echo.
echo [2/3] Moving Gradle Cache...
robocopy "C:\Users\sanaw\.gradle" "D:\DevData_Backup\.gradle" /E /MOVE
if exist "C:\Users\sanaw\.gradle" rmdir /s /q "C:\Users\sanaw\.gradle"
mklink /J "C:\Users\sanaw\.gradle" "D:\DevData_Backup\.gradle"

echo.
echo [3/3] Moving VSCode Extensions...
robocopy "C:\Users\sanaw\.vscode" "D:\DevData_Backup\.vscode" /E /MOVE
if exist "C:\Users\sanaw\.vscode" rmdir /s /q "C:\Users\sanaw\.vscode"
mklink /J "C:\Users\sanaw\.vscode" "D:\DevData_Backup\.vscode"

echo.
echo All done! You have successfully freed up massive amounts of space on your C: drive!
echo You can now delete this script.
pause
