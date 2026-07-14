class ChatParticipant {
  final String id;
  final String? name;
  final String? avatar;

  const ChatParticipant({required this.id, this.name, this.avatar});

  factory ChatParticipant.fromJson(dynamic json) {
    if (json is String) {
      return ChatParticipant(id: json);
    }
    if (json is Map) {
      final map = Map<String, dynamic>.from(json);
      return ChatParticipant(
        id: (map['_id'] ?? map['id'] ?? '').toString(),
        name: map['name']?.toString(),
        avatar: map['avatar']?.toString(),
      );
    }
    return ChatParticipant(id: json?.toString() ?? '');
  }
}

class ChatReferencedItem {
  final String? itemId;
  final String? itemType;
  final String itemName;
  final String? itemImage;
  final String? itemUrl;

  const ChatReferencedItem({
    this.itemId,
    this.itemType,
    this.itemName = '',
    this.itemImage,
    this.itemUrl,
  });

  factory ChatReferencedItem.fromJson(Map<String, dynamic> json) {
    return ChatReferencedItem(
      itemId: json['itemId']?.toString(),
      itemType: json['itemType']?.toString(),
      itemName: (json['itemName'] ?? '').toString(),
      itemImage: json['itemImage']?.toString(),
      itemUrl: json['itemUrl']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        if (itemId != null) 'itemId': itemId,
        if (itemType != null) 'itemType': itemType,
        'itemName': itemName,
        if (itemImage != null) 'itemImage': itemImage,
        if (itemUrl != null) 'itemUrl': itemUrl,
      };
}

class ChatLastMessage {
  final String? text;
  final String? image;
  final bool hasImage;
  final DateTime? createdAt;

  const ChatLastMessage({
    this.text,
    this.image,
    this.hasImage = false,
    this.createdAt,
  });

  factory ChatLastMessage.fromJson(dynamic json) {
    if (json is! Map) return const ChatLastMessage();
    final map = Map<String, dynamic>.from(json);
    return ChatLastMessage(
      text: map['text']?.toString(),
      image: map['image']?.toString(),
      hasImage: map['hasImage'] == true ||
          (map['image'] != null && map['image'].toString().isNotEmpty),
      createdAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'].toString())
          : null,
    );
  }
}

class ChatReplyTo {
  final String? messageId;
  final String? text;
  final String? senderName;

  const ChatReplyTo({this.messageId, this.text, this.senderName});

  factory ChatReplyTo.fromJson(dynamic json) {
    if (json is! Map) return const ChatReplyTo();
    final map = Map<String, dynamic>.from(json);
    return ChatReplyTo(
      messageId: map['messageId']?.toString(),
      text: map['text']?.toString(),
      senderName: map['senderName']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'messageId': messageId,
        'text': text,
        'senderName': senderName,
      };
}

class ChatMessage {
  final String id;
  final String? clientKey;
  final ChatParticipant? sender;
  final String text;
  final String? image;
  final ChatReplyTo? replyTo;
  final bool read;
  final DateTime? createdAt;

  const ChatMessage({
    required this.id,
    this.clientKey,
    this.sender,
    this.text = '',
    this.image,
    this.replyTo,
    this.read = false,
    this.createdAt,
  });

  bool get isOptimistic => id.startsWith('tmp-');

  String? get senderId => sender?.id;

  ChatMessage copyWith({
    String? id,
    String? clientKey,
    ChatParticipant? sender,
    String? text,
    String? image,
    ChatReplyTo? replyTo,
    bool? read,
    DateTime? createdAt,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      clientKey: clientKey ?? this.clientKey,
      sender: sender ?? this.sender,
      text: text ?? this.text,
      image: image ?? this.image,
      replyTo: replyTo ?? this.replyTo,
      read: read ?? this.read,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      clientKey: json['clientKey']?.toString(),
      sender: json['sender'] != null
          ? ChatParticipant.fromJson(json['sender'])
          : null,
      text: (json['text'] ?? '').toString(),
      image: json['image']?.toString(),
      replyTo: json['replyTo'] != null
          ? ChatReplyTo.fromJson(json['replyTo'])
          : null,
      read: json['read'] == true,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }
}

class ConversationModel {
  final String id;
  final List<ChatParticipant> participants;
  final ChatLastMessage? lastMessage;
  final ChatReferencedItem? context;
  final List<ChatReferencedItem> referencedItems;
  final Map<String, int> unreadCount;
  final DateTime? updatedAt;

  const ConversationModel({
    required this.id,
    this.participants = const [],
    this.lastMessage,
    this.context,
    this.referencedItems = const [],
    this.unreadCount = const {},
    this.updatedAt,
  });

  List<ChatReferencedItem> get effectiveReferencedItems {
    if (referencedItems.isNotEmpty) return referencedItems;
    if (context?.itemId != null && context?.itemType != null) {
      return [context!];
    }
    return const [];
  }

  int unreadFor(String userId) {
    if (userId.isEmpty) return 0;
    return unreadCount[userId] ?? 0;
  }

  ChatParticipant? otherParticipant(String myId) {
    for (final p in participants) {
      if (p.id.isNotEmpty && p.id != myId) return p;
    }
    return participants.isNotEmpty ? participants.first : null;
  }

  ConversationModel copyWith({
    List<ChatParticipant>? participants,
    ChatLastMessage? lastMessage,
    ChatReferencedItem? context,
    List<ChatReferencedItem>? referencedItems,
    Map<String, int>? unreadCount,
    DateTime? updatedAt,
  }) {
    return ConversationModel(
      id: id,
      participants: participants ?? this.participants,
      lastMessage: lastMessage ?? this.lastMessage,
      context: context ?? this.context,
      referencedItems: referencedItems ?? this.referencedItems,
      unreadCount: unreadCount ?? this.unreadCount,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    final unreadRaw = json['unreadCount'];
    final unread = <String, int>{};
    if (unreadRaw is Map) {
      unreadRaw.forEach((k, v) {
        unread[k.toString()] = int.tryParse(v?.toString() ?? '') ?? 0;
      });
    }

    final refs = <ChatReferencedItem>[];
    final rawRefs = json['referencedItems'];
    if (rawRefs is List) {
      for (final e in rawRefs) {
        if (e is Map) {
          refs.add(ChatReferencedItem.fromJson(Map<String, dynamic>.from(e)));
        }
      }
    }

    ChatReferencedItem? ctx;
    if (json['context'] is Map) {
      ctx = ChatReferencedItem.fromJson(
        Map<String, dynamic>.from(json['context'] as Map),
      );
    }

    return ConversationModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      participants: (json['participants'] as List? ?? [])
          .map(ChatParticipant.fromJson)
          .where((p) => p.id.isNotEmpty)
          .toList(),
      lastMessage: json['lastMessage'] != null
          ? ChatLastMessage.fromJson(json['lastMessage'])
          : null,
      context: ctx,
      referencedItems: refs,
      unreadCount: unread,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'].toString())
          : null,
    );
  }
}

/// Merge server messages with optimistic locals — React `chatMessages.js`
List<ChatMessage> mergeChatMessages(
  List<ChatMessage> serverList,
  List<ChatMessage> localList,
) {
  final serverIds = serverList.map((m) => m.id).toSet();
  final extras = <ChatMessage>[];
  final now = DateTime.now();

  for (final m in localList) {
    if (serverIds.contains(m.id)) continue;
    if (m.id.startsWith('tmp-')) {
      extras.add(m);
      continue;
    }
    final created = m.createdAt;
    if (created != null && now.difference(created).inMilliseconds < 20000) {
      extras.add(m);
    }
  }

  final merged = [...serverList, ...extras];
  merged.sort((a, b) {
    final at = a.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
    final bt = b.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
    return at.compareTo(bt);
  });
  return merged;
}

bool messagesShallowEqual(List<ChatMessage> a, List<ChatMessage> b) {
  if (identical(a, b)) return true;
  if (a.length != b.length) return false;
  for (var i = 0; i < a.length; i++) {
    if (a[i].id != b[i].id) return false;
    if (a[i].read != b[i].read) return false;
    if (a[i].text != b[i].text) return false;
    if ((a[i].image != null) != (b[i].image != null)) return false;
  }
  return true;
}

String? chatItemPath(ChatReferencedItem item) {
  final id = item.itemId;
  if (id == null || id.isEmpty) return null;
  switch (item.itemType) {
    case 'Offer':
      return '/offer/$id';
    case 'BazaarListing':
      return '/marketplace/$id';
    case 'Product':
      return '/product/$id';
    default:
      return null;
  }
}

String itemTypeIcon(String? type) {
  switch (type) {
    case 'Offer':
      return '🎁';
    case 'BazaarListing':
      return '🏷️';
    case 'Product':
      return '📦';
    default:
      return '📦';
  }
}
