# Pod.ai Integration - Debugging Guide

## 🔍 Troubleshooting Pod.ai Attendance Fetching

### Issue: "Failed to fetch" After Login

If you see this error after successfully connecting to Pod.ai, follow this debugging guide.

---

## 🛠️ Step 1: Enable Browser Console Logging

1. Open TrackTaps in your browser
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Try connecting to Pod.ai again
5. Look for logs starting with `[Pod.ai]`

---

## 📊 What to Look For in Console Logs

### Successful Login Flow
```
[Pod.ai] Starting login for: your.email@medicaps.ac.in
[Pod.ai] Login response status: 200
[Pod.ai] Login response headers: {contentType: "application/json", setCookie: null}
[Pod.ai] Login response data keys: ["auth_token", "user", ...]
[Pod.ai] Auth token received: eyJhbGciOiJIUzI1NiIs...
[Pod.ai] Credentials stored successfully
```

### Successful Attendance Fetch Flow
```
[Pod.ai] Starting attendance fetch with token: eyJhbGciOiJIUzI1NiIs...
[Pod.ai] Fetching in_progress page 1: https://api.pod.ai/v4/api/classrooms/student-activity/assessments/index-list/?...
[Pod.ai] Response status: 200
[Pod.ai] Response headers: {contentType: "application/json", contentLength: "5234"}
[Pod.ai] Parsed response: {resultsCount: 5, pagination: {current_page_number: 1, last_page_number: 1}}
[Pod.ai] Total activities fetched: 5
[Pod.ai] Unique activities after dedup: 5
```

---

## ❌ Common Error Scenarios

### Error 1: "Received HTML instead of JSON"
**Cause**: Redirected to login page (session not maintained)

**Solution**:
1. Check if cookies are being sent
2. Verify `credentials: 'include'` in fetch
3. Try disconnecting and reconnecting

**Console Log**:
```
[Pod.ai] Response not OK: 200 OK
[Pod.ai] Invalid content type: text/html
[Pod.ai] Response body: <!DOCTYPE html>...
```

### Error 2: "Got 401 - attempting token refresh"
**Cause**: Token expired or invalid

**Solution**:
1. Disconnect from Pod.ai
2. Reconnect with fresh credentials
3. Check if credentials are correct

**Console Log**:
```
[Pod.ai] Response status: 401
[Pod.ai] Got 401 - attempting token refresh
[Pod.ai] Token refreshed, retrying...
```

### Error 3: "Invalid content type"
**Cause**: API returning wrong format

**Solution**:
1. Check network tab in DevTools
2. Verify endpoint URL
3. Check response headers

**Console Log**:
```
[Pod.ai] Invalid content type: text/plain
[Pod.ai] Response body: Error: Invalid request
```

### Error 4: "No auth token in response"
**Cause**: Login endpoint not returning token

**Solution**:
1. Verify credentials are correct
2. Check if Pod.ai API is accessible
3. Try with different email format

**Console Log**:
```
[Pod.ai] Login response data keys: ["error", "message"]
[Pod.ai] No auth token in response
```

---

## 🔧 Network Inspection

### Check Network Requests

1. Open DevTools → **Network** tab
2. Connect to Pod.ai
3. Look for these requests:

#### Login Request
- **URL**: `https://api.pod.ai/v4/api/accounts/login/?subdomain=medicaps`
- **Method**: POST
- **Status**: 200
- **Response**: Should contain `auth_token`

#### Attendance Request
- **URL**: `https://api.pod.ai/v4/api/classrooms/student-activity/assessments/index-list/?...`
- **Method**: GET
- **Status**: 200
- **Headers**: Should include `Authorization: Token <token>`
- **Response**: Should be JSON with `results` array

### Check Request Headers

For attendance request, verify these headers are present:
```
Authorization: Token eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json
X-College-Id: kiNdHC
Origin: https://medicaps.pod.ai
Referer: https://medicaps.pod.ai/
```

### Check Response Headers

Should include:
```
Content-Type: application/json
Content-Length: <number>
```

---

## 🔐 Session & Cookie Issues

### Problem: Cookies Not Being Sent

**Check**:
1. Open DevTools → **Application** tab
2. Go to **Cookies**
3. Look for `medicaps.pod.ai` domain
4. Should have session cookies

**Fix**:
- Ensure `credentials: 'include'` in fetch
- Check browser cookie settings
- Try incognito mode

### Problem: CSRF Token Missing

**Check**:
1. Look for CSRF token in login response
2. Check if it's being sent in subsequent requests

**Fix**:
- Extract CSRF token from login response
- Include in headers for subsequent requests

---

## 🧪 Manual Testing

### Test 1: Login Only
```javascript
// In browser console:
const result = await PodAiService.login('your.email@medicaps.ac.in', 'your.password');
console.log(result);
```

Expected output:
```javascript
{
  success: true,
  message: "Successfully connected to Pod.ai",
  authToken: "eyJhbGciOiJIUzI1NiIs..."
}
```

### Test 2: Fetch Attendance
```javascript
// In browser console:
const result = await PodAiService.fetchAttendanceData();
console.log(result);
```

Expected output:
```javascript
{
  success: true,
  data: [
    {
      subjectName: "Mathematics",
      subjectCode: "MATH101",
      totalClasses: 20,
      presentClasses: 18,
      absentClasses: 2,
      attendancePercent: 90,
      ...
    },
    ...
  ],
  count: 5
}
```

### Test 3: Full Sync
```javascript
// In browser console:
const result = await PodAiService.syncSubjects();
console.log(result);
```

Expected output:
```javascript
{
  success: true,
  message: "Synced 5 subjects from Pod.ai",
  subjectsCount: 5,
  newSubjects: 5
}
```

---

## 📋 Checklist for Debugging

- [ ] Browser console shows `[Pod.ai]` logs
- [ ] Login response status is 200
- [ ] Auth token is received and stored
- [ ] Attendance request includes Authorization header
- [ ] Attendance response is JSON (not HTML)
- [ ] Response contains `results` array
- [ ] Activities are being parsed correctly
- [ ] Subjects are synced to localStorage
- [ ] Dashboard updates with new data

---

## 🚀 If Still Not Working

### Step 1: Clear Everything
```javascript
// In browser console:
localStorage.clear();
location.reload();
```

### Step 2: Try Fresh Login
1. Go to Settings
2. Click "Disconnect"
3. Clear browser cache (Ctrl+Shift+Delete)
4. Try connecting again

### Step 3: Check Pod.ai Status
1. Visit https://medicaps.pod.ai directly
2. Try logging in manually
3. If manual login fails, Pod.ai may be down

### Step 4: Verify Credentials
- Email should be your Pod.ai email
- Password should be your Pod.ai password
- Not your college email/password

### Step 5: Check Network
1. Ensure you have internet connection
2. Try from different network
3. Check if Pod.ai API is accessible

---

## 📝 Logs to Share

If you need help, share these logs:

1. **Console logs** (F12 → Console)
2. **Network requests** (F12 → Network)
3. **Error message** shown in UI
4. **Browser** and **OS** information
5. **Pod.ai email** (without password)

---

## 🔗 API Endpoints Reference

### Login Endpoint
```
POST https://api.pod.ai/v4/api/accounts/login/?subdomain=medicaps
Headers:
  Content-Type: application/json
  Origin: https://medicaps.pod.ai
  Referer: https://medicaps.pod.ai/
  X-College-Id: kiNdHC
Body:
  {
    "username": "email@medicaps.ac.in",
    "password": "password"
  }
Response:
  {
    "auth_token": "token_string",
    "user": {...},
    ...
  }
```

### Attendance Endpoint
```
GET https://api.pod.ai/v4/api/classrooms/student-activity/assessments/index-list/
Query Parameters:
  activity_status: in_progress|upcoming
  class_group_type: 1
  include_status_stats: true
  page: 1
Headers:
  Authorization: Token <auth_token>
  Content-Type: application/json
  X-College-Id: kiNdHC
  Origin: https://medicaps.pod.ai
  Referer: https://medicaps.pod.ai/
Response:
  {
    "results": [
      {
        "name": "Subject Name",
        "code": "SUBJ101",
        "total_classes": 20,
        "present_classes": 18,
        "absent_classes": 2,
        "attendance_percentage": 90,
        ...
      },
      ...
    ],
    "pagination": {
      "current_page_number": 1,
      "last_page_number": 1
    }
  }
```

---

## 💡 Tips

1. **Always check console logs first** - They tell you exactly what's happening
2. **Network tab is your friend** - See actual requests and responses
3. **Test in incognito mode** - Eliminates cache issues
4. **Verify credentials** - Most common issue
5. **Check Pod.ai status** - API might be down
6. **Try disconnecting/reconnecting** - Refreshes session

---

## 🎯 Success Indicators

When everything is working:
- ✅ Login succeeds with auth token
- ✅ Attendance fetch returns subjects
- ✅ Subjects page auto-populates
- ✅ Dashboard shows real data
- ✅ No error messages in console

---

**Need Help?** Check the console logs first - they contain detailed information about what's happening at each step!
