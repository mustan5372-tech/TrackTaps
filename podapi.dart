import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/activity.dart';

class ApiService {
  static const String _baseUrl =
      'https://api.pod.ai/v4/api/classrooms/student-activity/assessments';
  static const String _loginUrl =
      'https://api.pod.ai/v4/api/accounts/login/?subdomain=medicaps';
  static const _storage = FlutterSecureStorage();
  static const String _authKey = 'auth_token';
  static const String _usernameKey = 'username';
  static const String _passwordKey = 'password';

  // ── AUTH ──────────────────────────────────────────────────────────────────

  Future<bool> login(String username, String password) async {
    try {
      final authToken = await _fetchAuthToken(username, password);
      if (authToken == null) return false;

      // Store credentials securely for auto-refresh
      await _storage.write(key: _authKey, value: authToken);
      await _storage.write(key: _usernameKey, value: username);
      await _storage.write(key: _passwordKey, value: password);
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<String?> _fetchAuthToken(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse(_loginUrl),
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://medicaps.pod.ai',
          'Referer': 'https://medicaps.pod.ai/',
          'X-College-Id': 'kiNdHC',
        },
        body: jsonEncode({
          'username': username,
          'password': password,
        }),
      );
      if (response.statusCode != 200) return null;
      final data = jsonDecode(response.body);
      return data['auth_token'] as String?;
    } catch (e) {
      return null;
    }
  }

  // Silently refresh token using stored credentials
  Future<bool> _refreshToken() async {
    try {
      final username = await _storage.read(key: _usernameKey);
      final password = await _storage.read(key: _passwordKey);
      if (username == null || password == null) return false;

      final authToken = await _fetchAuthToken(username, password);
      if (authToken == null) return false;

      await _storage.write(key: _authKey, value: authToken);
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: _authKey);
    return token != null && token.isNotEmpty;
  }

  Future<void> logout() async {
    await _storage.delete(key: _authKey);
    await _storage.delete(key: _usernameKey);
    await _storage.delete(key: _passwordKey);
  }

  Future<String?> _getAuthToken() async {
    return await _storage.read(key: _authKey);
  }

  // ── DATA ──────────────────────────────────────────────────────────────────

  Future<List<Activity>> fetchActivities() async {
    final result = await _fetchActivitiesWithToken();

    // If 401, try refreshing token once and retry
    if (result == null) {
      final refreshed = await _refreshToken();
      if (!refreshed) return [];
      return await _fetchActivitiesWithToken() ?? [];
    }

    return result;
  }

  // Returns null on 401, empty list on other errors, list on success
  Future<List<Activity>?> _fetchActivitiesWithToken() async {
    final token = await _getAuthToken();
    if (token == null) return null;

    final headers = {
      'Authorization': 'Token $token',
      'Content-Type': 'application/json',
      'X-College-Id': 'kiNdHC',
    };

    final List<Activity> allActivities = [];
    bool got401 = false;

    for (final status in ['in_progress', 'upcoming']) {
      if (got401) break;
      try {
        var page = 1;
        bool hasMore = true;

        while (hasMore) {
          final uri = Uri.parse(
            '$_baseUrl/index-list/'
            '?activity_status=$status'
            '&class_group_type=1'
            '&include_status_stats=true'
            '&page=$page',
          );

          final response = await http.get(uri, headers: headers);

          if (response.statusCode == 401) {
            got401 = true;
            break;
          }

          if (response.statusCode != 200) break;

          final data = jsonDecode(response.body);
          final results = data['results'] as List<dynamic>? ?? [];
          final pagination =
              data['pagination'] as Map<String, dynamic>? ?? {};

          for (final item in results) {
            try {
              allActivities.add(Activity.fromJson(item));
            } catch (_) {}
          }

          final currentPage = pagination['current_page_number'] ?? 1;
          final lastPage = pagination['last_page_number'] ?? 1;
          hasMore = currentPage < lastPage;
          page++;
        }
      } catch (_) {}
    }

    if (got401) return null;

    // Sort by end date ascending
    allActivities.sort((a, b) => a.endDateTime.compareTo(b.endDateTime));

    // Remove duplicates by token
    final seen = <String>{};
    return allActivities.where((a) => seen.add(a.token)).toList();
  }
}