import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/cache/cache_keys.dart';
import '../../../../core/cache/local_cache_service.dart';
import '../../../home/presentation/providers/home_providers.dart';

class AuthState {
  final Map<String, dynamic>? user;
  final String? token;
  final bool isLoading;

  AuthState({this.user, this.token, this.isLoading = false});

  bool get isAuth => token != null && token!.isNotEmpty;

  AuthState copyWith({
    Map<String, dynamic>? user,
    String? token,
    bool? isLoading,
  }) {
    return AuthState(
      user: user ?? this.user,
      token: token ?? this.token,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  final ApiClient _apiClient;

  AuthNotifier(this._apiClient) : super(AuthState(isLoading: true)) {
    _loadAuth();
  }

  Future<void> _loadAuth() async {
    final token = await _storage.read(key: 'token');
    final userJson = await _storage.read(key: 'user');
    
    if (token != null && userJson != null) {
      final user = jsonDecode(userJson) as Map<String, dynamic>;
      state = AuthState(
        token: token,
        user: user,
        isLoading: false,
      );
      await LocalCacheService.save(CacheKeys.userProfile, user);
      _verifyStatus();
    } else {
      state = AuthState(isLoading: false);
    }
  }

  Future<void> _verifyStatus() async {
    try {
      final response = await _apiClient.dio.get('/auth/verify/status');
      if (response.statusCode == 200) {
        final data = response.data;
        if (state.user != null) {
          final updatedUser = {
            ...state.user!,
            'emailVerified': data['emailVerified'],
            'phoneVerified': data['phoneVerified'],
            'isVerified': data['isVerified'],
            'points': data['points'] ?? state.user!['points'],
          };
          updateUser(updatedUser);
          await LocalCacheService.save(CacheKeys.userProfile, updatedUser);
        }
      }
    } catch (e) {
      final cached = LocalCacheService.getData(CacheKeys.userProfile);
      if (cached is Map && state.user != null) {
        updateUser(Map<String, dynamic>.from(cached));
      }
    }
  }

  Future<void> login(Map<String, dynamic> userData, String token, {String? refreshToken}) async {
    await _storage.write(key: 'token', value: token);
    await _storage.write(key: 'user', value: jsonEncode(userData));
    if (refreshToken != null) {
      await _storage.write(key: 'refreshToken', value: refreshToken);
    }
    
    state = state.copyWith(user: userData, token: token);
    await LocalCacheService.save(CacheKeys.userProfile, userData);
  }

  Future<void> logout() async {
    try {
      await _apiClient.dio.post('/auth/logout');
    } catch (_) {
      // Ignore server failure on logout
    }
    // Keep deviceId so re-login on this device upserts the same session slot
    // (multi-device stays independent — each install has its own deviceId).
    await _storage.delete(key: 'token');
    await _storage.delete(key: 'user');
    await _storage.delete(key: 'refreshToken');
    state = AuthState(user: null, token: null);
  }

  /// Clears in-memory auth only (storage already cleared by ApiClient on 401).
  void clearLocalSession() {
    state = AuthState(user: null, token: null);
  }

  void updateUser(Map<String, dynamic> patch) {
    if (state.user == null) return;
    final nextUser = {...state.user!, ...patch};
    _storage.write(key: 'user', value: jsonEncode(nextUser));
    LocalCacheService.save(CacheKeys.userProfile, nextUser);
    state = state.copyWith(user: nextUser);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AuthNotifier(apiClient);
});
