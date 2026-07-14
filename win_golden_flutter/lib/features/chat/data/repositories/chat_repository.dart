import '../../../../core/api/api_client.dart';
import '../models/chat_models.dart';

class ChatRepository {
  final ApiClient _apiClient;

  ChatRepository(this._apiClient);

  Future<List<ConversationModel>> getConversations() async {
    final response = await _apiClient.dio.get('/chats');
    final data = response.data;
    final list = data is Map ? data['conversations'] as List? : null;
    return (list ?? [])
        .whereType<Map>()
        .map((e) => ConversationModel.fromJson(Map<String, dynamic>.from(e)))
        .where((c) => c.id.isNotEmpty)
        .toList();
  }

  Future<int> getUnreadCount() async {
    final response = await _apiClient.dio.get('/chats/unread-count');
    final data = response.data;
    if (data is Map) {
      final count = data['count'];
      if (count is int) return count;
      return int.tryParse(count?.toString() ?? '') ?? 0;
    }
    return 0;
  }

  Future<List<ChatMessage>> getMessages(String convId) async {
    final response = await _apiClient.dio.get('/chats/$convId');
    final data = response.data;
    final list = data is Map ? data['messages'] as List? : null;
    return (list ?? [])
        .whereType<Map>()
        .map((e) => ChatMessage.fromJson(Map<String, dynamic>.from(e)))
        .where((m) => m.id.isNotEmpty)
        .toList();
  }

  Future<ConversationModel> getOrCreateConversation({
    required String recipientId,
    Map<String, dynamic>? context,
  }) async {
    final response = await _apiClient.dio.post(
      '/chats',
      data: {
        'recipientId': recipientId,
        if (context != null) 'context': context,
      },
    );
    final data = response.data;
    final conv = data is Map ? data['conversation'] : null;
    if (conv is! Map) {
      throw StateError('تعذّر فتح المحادثة');
    }
    return ConversationModel.fromJson(Map<String, dynamic>.from(conv));
  }

  Future<ChatMessage> sendMessage(
    String convId, {
    required String text,
    String? image,
    ChatReplyTo? replyTo,
  }) async {
    final response = await _apiClient.dio.post(
      '/chats/$convId',
      data: {
        'text': text,
        if (image != null) 'image': image,
        'replyTo': replyTo != null
            ? {
                'messageId': replyTo.messageId,
                'text': replyTo.text,
                'senderName': replyTo.senderName ?? 'مستخدم',
              }
            : null,
      },
    );
    final data = response.data;
    final msg = data is Map ? data['message'] : null;
    if (msg is! Map) {
      throw StateError('تعذّر الإرسال');
    }
    return ChatMessage.fromJson(Map<String, dynamic>.from(msg));
  }
}
