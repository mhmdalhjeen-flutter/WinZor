import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Mirrors React `localStorage.chatContext` for opening / creating chats.
class ChatContextStore {
  static const _key = 'chatContext';
  static const _warnKey = 'chatExpiryWarned';

  static Future<Map<String, dynamic>?> peek() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null || raw.isEmpty) return null;
    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map) return Map<String, dynamic>.from(decoded);
    } catch (_) {}
    return null;
  }

  static Future<String?> peekRaw() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_key);
  }

  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }

  static Future<void> save(Map<String, dynamic> payload) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(payload));
  }

  static Future<bool> shouldShowExpiryWarning() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_warnKey) == null;
  }

  static Future<void> dismissExpiryWarning() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_warnKey, '1');
  }
}
