import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../home/presentation/providers/home_providers.dart';
import '../../data/models/chat_models.dart';
import '../../data/repositories/chat_repository.dart';
import '../../../../core/utils/image_upload.dart';

final chatRepositoryProvider = Provider((ref) {
  return ChatRepository(ref.watch(apiClientProvider));
});

final chatImageUploadProvider = Provider((ref) {
  return ImageUploadService(ref.watch(apiClientProvider));
});

/// Header badge — React `GET /chats/unread-count`
final unreadChatCountProvider = FutureProvider.autoDispose<int>((ref) async {
  final auth = ref.watch(authProvider);
  if (!auth.isAuth) return 0;
  return ref.watch(chatRepositoryProvider).getUnreadCount();
});

final conversationsProvider =
    FutureProvider.autoDispose<List<ConversationModel>>((ref) async {
  final auth = ref.watch(authProvider);
  if (!auth.isAuth) return [];
  return ref.watch(chatRepositoryProvider).getConversations();
});
