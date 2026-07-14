import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../data/chat_context_store.dart';
import '../../data/models/chat_models.dart';
import '../providers/chat_providers.dart';
import '../widgets/referenced_items_bar.dart';

/// React `Chats.jsx` — conversations list + active thread with 3s HTTP polling.
class ChatsPage extends ConsumerStatefulWidget {
  final String? initialConvId;

  const ChatsPage({super.key, this.initialConvId});

  @override
  ConsumerState<ChatsPage> createState() => _ChatsPageState();
}

class _ChatsPageState extends ConsumerState<ChatsPage> {
  static const _pollMs = 3000;

  ConversationModel? _activeConv;
  List<ChatMessage> _messages = [];
  final _textCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  bool _sending = false;
  bool _showWarning = false;
  String? _bootError;
  ChatMessage? _replyTo;
  String? _imageUrl;
  Timer? _pollTimer;
  String? _contextHandledFingerprint;
  bool _contextBootstrapped = false;
  String? _openedRouteId;

  String get _myId {
    final user = ref.read(authProvider).user;
    return (user?['_id'] ?? user?['id'] ?? '').toString();
  }

  @override
  void initState() {
    super.initState();
    ChatContextStore.shouldShowExpiryWarning().then((show) {
      if (mounted && show) setState(() => _showWarning = true);
    });
  }

  @override
  void dispose() {
    _stopPolling();
    _textCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _stopPolling() {
    _pollTimer?.cancel();
    _pollTimer = null;
  }

  void _startPolling(String id) {
    _stopPolling();
    _pollTimer = Timer.periodic(const Duration(milliseconds: _pollMs), (_) {
      if (!mounted || _activeConv?.id != id) return;
      _fetchMessages(id, silent: true);
      ref.invalidate(conversationsProvider);
      ref.invalidate(unreadChatCountProvider);
    });
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollCtrl.hasClients) return;
      _scrollCtrl.animateTo(
        _scrollCtrl.position.maxScrollExtent,
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
      );
    });
  }

  Future<void> _fetchMessages(String id, {bool silent = false}) async {
    try {
      final server = await ref.read(chatRepositoryProvider).getMessages(id);
      if (!mounted || _activeConv?.id != id) return;
      setState(() {
        final merged = mergeChatMessages(server, _messages);
        if (!messagesShallowEqual(_messages, merged)) {
          _messages = merged;
          if (!silent) _scrollToBottom();
        }
        if (!silent) _bootError = null;
      });
      if (!silent) {
        ref.invalidate(unreadChatCountProvider);
      }
    } on DioException catch (e) {
      if (!silent && mounted) {
        setState(() {
          _bootError = e.response?.data is Map
              ? (e.response?.data['message']?.toString() ?? 'تعذّر تحميل الرسائل')
              : 'تعذّر تحميل الرسائل';
        });
      }
    } catch (_) {
      if (!silent && mounted) {
        setState(() => _bootError = 'تعذّر تحميل الرسائل');
      }
    }
  }

  Future<void> _openConversation(
    ConversationModel conv, {
    bool pushRoute = true,
    bool resetMessages = true,
  }) async {
    if (conv.id.isEmpty) return;
    setState(() {
      _activeConv = conv;
      _bootError = null;
      if (resetMessages) {
        _messages = [];
        _replyTo = null;
        _imageUrl = null;
      }
    });
    await _fetchMessages(conv.id);
    _startPolling(conv.id);
    if (pushRoute && mounted) {
      final current = GoRouterState.of(context).pathParameters['convId'];
      if (current != conv.id) {
        context.go('/chat/${conv.id}');
      }
    }
  }

  Future<void> _bootstrapFromContext() async {
    final raw = await ChatContextStore.peekRaw();
    if (raw == null || raw.isEmpty || !mounted) {
      _contextBootstrapped = true;
      return;
    }
    if (_contextHandledFingerprint == raw) return;
    _contextHandledFingerprint = raw;
    _contextBootstrapped = true;

    final pending = await ChatContextStore.peek();
    if (pending == null || !mounted) return;

    try {
      final recipientId =
          (pending['recipientId'] ?? pending['storeOwnerId'])?.toString() ?? '';
      if (recipientId.isEmpty) {
        await ChatContextStore.clear();
        return;
      }

      Map<String, dynamic>? contextMap;
      if (pending['context'] is Map) {
        contextMap = Map<String, dynamic>.from(pending['context'] as Map);
      } else {
        contextMap = {
          if (pending['productId'] != null || pending['offerId'] != null)
            'itemId': pending['productId'] ?? pending['offerId'],
          'itemType': pending['itemType'] ?? 'Offer',
          'itemName': pending['productName'] ?? pending['offerTitle'],
          'itemImage': pending['productImg'] ?? pending['offerImage'],
        };
      }

      final conv = await ref.read(chatRepositoryProvider).getOrCreateConversation(
            recipientId: recipientId,
            context: contextMap,
          );
      await ChatContextStore.clear();
      if (!mounted) return;
      ref.invalidate(conversationsProvider);
      await _openConversation(conv, pushRoute: true);
      final prefill = pending['prefillText']?.toString();
      if (prefill != null && prefill.isNotEmpty) {
        Future.delayed(const Duration(milliseconds: 400), () {
          if (mounted) _textCtrl.text = prefill;
        });
      }
    } on DioException catch (e) {
      await ChatContextStore.clear();
      _contextHandledFingerprint = null;
      if (!mounted) return;
      setState(() {
        _bootError = e.response?.data is Map
            ? (e.response?.data['message']?.toString() ?? 'تعذّر فتح المحادثة')
            : 'تعذّر فتح المحادثة';
      });
    } catch (_) {
      await ChatContextStore.clear();
      _contextHandledFingerprint = null;
      if (mounted) setState(() => _bootError = 'تعذّر فتح المحادثة');
    }
  }

  void _syncActiveFromList(List<ConversationModel> conversations) {
    final active = _activeConv;
    if (active == null) return;
    ConversationModel? fresh;
    for (final c in conversations) {
      if (c.id == active.id) {
        fresh = c;
        break;
      }
    }
    if (fresh == null) return;
    final prevItems = active.effectiveReferencedItems.length;
    final nextItems = fresh.effectiveReferencedItems.length;
    if (prevItems != nextItems || fresh.updatedAt != active.updatedAt) {
      setState(() => _activeConv = active.copyWith(
            participants: fresh!.participants,
            lastMessage: fresh.lastMessage,
            context: fresh.context,
            referencedItems: fresh.referencedItems,
            unreadCount: fresh.unreadCount,
            updatedAt: fresh.updatedAt,
          ));
    }
  }

  Future<void> _handleRouteConv(
    String? routeConvId,
    List<ConversationModel> conversations,
    bool loading,
  ) async {
    if (loading || routeConvId == null || routeConvId.isEmpty) return;
    if (_activeConv?.id == routeConvId) return;
    if (_openedRouteId == routeConvId && _activeConv?.id == routeConvId) return;

    ConversationModel? found;
    for (final c in conversations) {
      if (c.id == routeConvId) {
        found = c;
        break;
      }
    }
    if (found != null) {
      _openedRouteId = routeConvId;
      await _openConversation(found, pushRoute: false);
      return;
    }

    _openedRouteId = routeConvId;
    setState(() {
      _activeConv = ConversationModel(id: routeConvId);
      _messages = [];
    });
    await _fetchMessages(routeConvId);
    _startPolling(routeConvId);
  }

  Future<void> _pickImage() async {
    try {
      final picker = ImagePicker();
      final file = await picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1600,
        imageQuality: 85,
      );
      if (file == null) return;
      final bytes = await file.readAsBytes();
      if (bytes.length > 5 * 1024 * 1024) {
        _toast('الصورة أكبر من 5MB');
        return;
      }
      final url = await ref.read(chatImageUploadProvider).uploadImageBytes(
            bytes,
            filename: file.name,
          );
      if (!mounted) return;
      setState(() => _imageUrl = url);
    } catch (e) {
      _toast(e.toString().replaceFirst('Exception: ', '').replaceFirst('StateError: ', ''));
    }
  }

  Future<void> _sendMessage() async {
    final text = _textCtrl.text.trim();
    final image = _imageUrl;
    final active = _activeConv;
    if (active == null || _sending) return;
    if (text.isEmpty && (image == null || image.isEmpty)) return;

    setState(() => _sending = true);
    final optimisticId = 'tmp-${DateTime.now().millisecondsSinceEpoch}';
    final clientKey = 'c-${DateTime.now().millisecondsSinceEpoch}';
    final reply = _replyTo;
    final optimistic = ChatMessage(
      id: optimisticId,
      clientKey: clientKey,
      sender: ChatParticipant(id: _myId),
      text: text,
      image: image,
      replyTo: reply != null
          ? ChatReplyTo(
              messageId: reply.id,
              text: reply.text,
              senderName: reply.sender?.name ?? 'مستخدم',
            )
          : null,
      createdAt: DateTime.now(),
    );

    setState(() {
      _messages = [..._messages, optimistic];
      _textCtrl.clear();
      _imageUrl = null;
      _replyTo = null;
    });
    _scrollToBottom();

    try {
      final sent = await ref.read(chatRepositoryProvider).sendMessage(
            active.id,
            text: text,
            image: image,
            replyTo: optimistic.replyTo,
          );
      if (!mounted) return;
      setState(() {
        _messages = _messages
            .map((m) => m.id == optimisticId
                ? sent.copyWith(clientKey: clientKey)
                : m)
            .toList();
      });
      ref.invalidate(conversationsProvider);
      ref.invalidate(unreadChatCountProvider);
    } on DioException catch (e) {
      if (!mounted) return;
      setState(() {
        _messages = _messages.where((m) => m.id != optimisticId).toList();
        _textCtrl.text = text;
        _imageUrl = image;
        _replyTo = reply;
      });
      _toast(e.response?.data is Map
          ? (e.response?.data['message']?.toString() ?? 'تعذّر الإرسال')
          : 'تعذّر الإرسال');
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _messages = _messages.where((m) => m.id != optimisticId).toList();
        _textCtrl.text = text;
        _imageUrl = image;
        _replyTo = reply;
      });
      _toast('تعذّر الإرسال');
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  void _backToList() {
    _stopPolling();
    setState(() {
      _activeConv = null;
      _messages = [];
      _replyTo = null;
      _imageUrl = null;
      _openedRouteId = null;
    });
    context.go('/chat');
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg, style: const TextStyle(fontFamily: 'Cairo'))),
    );
  }

  String _formatTime(DateTime? date) {
    if (date == null) return '';
    final d = date.toLocal();
    final diff = DateTime.now().difference(d);
    if (diff.inHours < 24) {
      return DateFormat('HH:mm').format(d);
    }
    if (diff.inHours < 48) return 'أمس';
    return DateFormat('yyyy/MM/dd').format(d);
  }

  String _replyPreview(String text) {
    if (text.length <= 40) return text;
    return text.substring(0, 40);
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    if (!auth.isAuth) {
      return Scaffold(
        backgroundColor: const Color(0xFFF9FAFB),
        body: SafeArea(
          child: Center(
            child: ElevatedButton(
              onPressed: () => context.push('/login'),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
              child: const Text(
                'تسجيل الدخول',
                style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900),
              ),
            ),
          ),
        ),
      );
    }

    final convAsync = ref.watch(conversationsProvider);
    final routeConvId =
        widget.initialConvId ?? GoRouterState.of(context).pathParameters['convId'];

    ref.listen<AsyncValue<List<ConversationModel>>>(conversationsProvider, (prev, next) {
      next.whenData((list) {
        _syncActiveFromList(list);
        _handleRouteConv(routeConvId, list, false);
      });
      if (next.hasError && _bootError == null) {
        final err = next.error;
        final msg = err is DioException && err.response?.data is Map
            ? err.response?.data['message']?.toString()
            : null;
        setState(() => _bootError = msg ?? 'تعذّر تحميل المحادثات');
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _bootstrapFromContext();
      final list = convAsync.asData?.value;
      if (list != null) {
        _handleRouteConv(routeConvId, list, convAsync.isLoading);
      }
    });

    if (convAsync.isLoading && !convAsync.hasValue) {
      return const Scaffold(
        backgroundColor: Color(0xFFF9FAFB),
        body: Center(
          child: Text(
            'جاري التحميل...',
            style: TextStyle(
              fontFamily: 'Cairo',
              fontWeight: FontWeight.w800,
              color: Color(0xFF6B7280),
            ),
          ),
        ),
      );
    }

    final conversations = convAsync.asData?.value ?? const <ConversationModel>[];
    final showWindow = _activeConv != null;

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                if (_bootError != null)
                  Container(
                    width: double.infinity,
                    margin: const EdgeInsets.fromLTRB(12, 8, 12, 0),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFFECACA)),
                    ),
                    child: Text(
                      _bootError!,
                      style: const TextStyle(
                        color: Color(0xFFB91C1C),
                        fontWeight: FontWeight.w800,
                        fontFamily: 'Cairo',
                        fontSize: 13,
                      ),
                    ),
                  ),
                Expanded(
                  child: showWindow
                      ? _buildChatWindow()
                      : _buildConversationsList(conversations),
                ),
              ],
            ),
            if (_showWarning) _buildExpiryWarning(),
          ],
        ),
      ),
    );
  }

  Widget _buildExpiryWarning() {
    return Positioned(
      top: 24,
      left: 16,
      right: 16,
      child: Material(
        elevation: 8,
        borderRadius: BorderRadius.circular(12),
        color: const Color(0xFF1E293B),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'الرسائل تُحذف بعد 4 أيام',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontFamily: 'Cairo',
                ),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () async {
                  await ChatContextStore.dismissExpiryWarning();
                  if (mounted) setState(() => _showWarning = false);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6366F1),
                ),
                child: const Text(
                  'فهمت ✓',
                  style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w800),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildConversationsList(List<ConversationModel> conversations) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Row(
            children: [
              IconButton(
                onPressed: () {
                  if (context.canPop()) {
                    context.pop();
                  } else {
                    context.go('/');
                  }
                },
                style: IconButton.styleFrom(
                  backgroundColor: Colors.white,
                  side: const BorderSide(color: Color(0xFFF3F4F6)),
                ),
                icon: const Icon(LucideIcons.chevronRight, size: 20),
              ),
              const SizedBox(width: 8),
              const Icon(LucideIcons.messageCircle, color: AppColors.primary),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'الرسائل',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Cairo',
                  ),
                ),
              ),
              Text(
                '${conversations.length} محادثة',
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF9CA3AF),
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: conversations.isEmpty
              ? const Center(
                  child: Text(
                    'لا توجد محادثات بعد',
                    style: TextStyle(
                      color: Color(0xFF9CA3AF),
                      fontWeight: FontWeight.w800,
                      fontFamily: 'Cairo',
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(conversationsProvider);
                    ref.invalidate(unreadChatCountProvider);
                    await ref.read(conversationsProvider.future);
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(12, 0, 12, 24),
                    itemCount: conversations.length,
                    itemBuilder: (_, i) {
                      final conv = conversations[i];
                      final other = conv.otherParticipant(_myId);
                      final unread = conv.unreadFor(_myId);
                      final last = conv.lastMessage?.hasImage == true ||
                              (conv.lastMessage?.image != null &&
                                  conv.lastMessage!.image!.isNotEmpty)
                          ? '📷 صورة'
                          : (conv.lastMessage?.text?.isNotEmpty == true
                              ? conv.lastMessage!.text!
                              : (conv.context != null &&
                                      conv.context!.itemName.isNotEmpty
                                  ? conv.context!.itemName
                                  : 'ابدأ المحادثة'));
                      final refCount = conv.effectiveReferencedItems.length;
                      final initial =
                          (other?.name?.isNotEmpty == true) ? other!.name![0] : '؟';

                      return InkWell(
                        onTap: () => _openConversation(conv),
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFF3F4F6)),
                          ),
                          child: Row(
                            children: [
                              CircleAvatar(
                                radius: 24,
                                backgroundColor: AppColors.primary.withOpacity(0.1),
                                child: Text(
                                  initial,
                                  style: const TextStyle(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w900,
                                    fontFamily: 'Cairo',
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      other?.name ?? 'مستخدم',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w900,
                                        fontFamily: 'Cairo',
                                        fontSize: 14,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      last,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Color(0xFF9CA3AF),
                                        fontFamily: 'Cairo',
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    if (refCount > 0)
                                      Text(
                                        '$refCount عنصر مرتبط',
                                        style: const TextStyle(
                                          fontSize: 10,
                                          color: Color(0xFF4F46E5),
                                          fontWeight: FontWeight.w800,
                                          fontFamily: 'Cairo',
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    _formatTime(conv.updatedAt),
                                    style: const TextStyle(
                                      fontSize: 10,
                                      color: Color(0xFF9CA3AF),
                                      fontFamily: 'Cairo',
                                    ),
                                  ),
                                  if (unread > 0) ...[
                                    const SizedBox(height: 6),
                                    Container(
                                      width: 20,
                                      height: 20,
                                      alignment: Alignment.center,
                                      decoration: const BoxDecoration(
                                        color: AppColors.primary,
                                        shape: BoxShape.circle,
                                      ),
                                      child: Text(
                                        unread > 99 ? '99+' : '$unread',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w900,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildChatWindow() {
    final active = _activeConv!;
    final other = active.otherParticipant(_myId);
    final initial = (other?.name?.isNotEmpty == true) ? other!.name![0] : '؟';
    final refs = active.effectiveReferencedItems;

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
          ),
          child: Row(
            children: [
              IconButton(
                onPressed: _backToList,
                icon: const Icon(LucideIcons.chevronRight),
              ),
              CircleAvatar(
                backgroundColor: AppColors.primary.withOpacity(0.1),
                child: Text(
                  initial,
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Cairo',
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      other?.name ?? 'مستخدم',
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontFamily: 'Cairo',
                        fontSize: 14,
                      ),
                    ),
                    const Text(
                      'تُحذف بعد 4 أيام',
                      style: TextStyle(
                        fontSize: 10,
                        color: Color(0xFF9CA3AF),
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        ReferencedItemsBar(items: refs),
        Expanded(
          child: _messages.isEmpty
              ? const Center(
                  child: Text(
                    'ابدأ المحادثة الآن',
                    style: TextStyle(
                      color: Color(0xFF9CA3AF),
                      fontWeight: FontWeight.w800,
                      fontFamily: 'Cairo',
                    ),
                  ),
                )
              : ListView.builder(
                  controller: _scrollCtrl,
                  padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
                  itemCount: _messages.length,
                  itemBuilder: (_, i) {
                    final msg = _messages[i];
                    final isMine =
                        msg.senderId != null && msg.senderId == _myId && _myId.isNotEmpty;
                    return _MessageBubble(
                      message: msg,
                      isMine: isMine,
                      timeLabel: _formatTime(msg.createdAt),
                      onReply: () => setState(() => _replyTo = msg),
                      onOpenImage: (url) async {
                        final uri = Uri.tryParse(url);
                        if (uri != null) {
                          await launchUrl(uri, mode: LaunchMode.externalApplication);
                        }
                      },
                    );
                  },
                ),
        ),
        if (_replyTo != null)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: const Color(0xFFEEF2FF),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'رداً على: ${_replyPreview(_replyTo!.text)}',
                    style: const TextStyle(fontFamily: 'Cairo', fontSize: 13),
                  ),
                ),
                IconButton(
                  onPressed: () => setState(() => _replyTo = null),
                  icon: const Icon(Icons.close, size: 18),
                ),
              ],
            ),
          ),
        if (_imageUrl != null)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: Color(0xFFF3F4F6))),
            ),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: CachedNetworkImage(
                    imageUrl: _imageUrl!,
                    width: 48,
                    height: 48,
                    fit: BoxFit.cover,
                  ),
                ),
                IconButton(
                  onPressed: () => setState(() => _imageUrl = null),
                  icon: const Icon(Icons.close, color: Colors.red),
                ),
              ],
            ),
          ),
        Container(
          padding: const EdgeInsets.fromLTRB(8, 8, 8, 10),
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: Color(0xFFF1F5F9))),
          ),
          child: Row(
            children: [
              IconButton(
                onPressed: _sending ? null : _pickImage,
                icon: const Icon(LucideIcons.image, color: Color(0xFF6366F1)),
              ),
              Expanded(
                child: TextField(
                  controller: _textCtrl,
                  enabled: !_sending,
                  minLines: 1,
                  maxLines: 4,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => _sendMessage(),
                  decoration: InputDecoration(
                    hintText: 'اكتب رسالتك...',
                    hintStyle: const TextStyle(fontFamily: 'Cairo', fontSize: 13),
                    filled: true,
                    fillColor: const Color(0xFFF3F4F6),
                    contentPadding:
                        const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  style: const TextStyle(fontFamily: 'Cairo', fontSize: 14),
                ),
              ),
              const SizedBox(width: 6),
              ElevatedButton(
                onPressed: _sending ? null : _sendMessage,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: Text(
                  _sending ? '...' : 'إرسال',
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontWeight: FontWeight.w900,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isMine;
  final String timeLabel;
  final VoidCallback onReply;
  final ValueChanged<String> onOpenImage;

  const _MessageBubble({
    required this.message,
    required this.isMine,
    required this.timeLabel,
    required this.onReply,
    required this.onOpenImage,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment: isMine ? MainAxisAlignment.start : MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (isMine)
            IconButton(
              onPressed: onReply,
              icon: const Icon(LucideIcons.cornerUpLeft, size: 16),
              visualDensity: VisualDensity.compact,
            ),
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isMine ? AppColors.primary : const Color(0xFFF3F4F6),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isMine ? 4 : 16),
                  bottomRight: Radius.circular(isMine ? 16 : 4),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (message.replyTo?.text != null &&
                      message.replyTo!.text!.isNotEmpty)
                    Container(
                      margin: const EdgeInsets.only(bottom: 6),
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${message.replyTo!.senderName ?? ''}: ${message.replyTo!.text}',
                        style: TextStyle(
                          fontSize: 11,
                          fontFamily: 'Cairo',
                          color: isMine ? Colors.white70 : const Color(0xFF4B5563),
                        ),
                      ),
                    ),
                  if (message.image != null && message.image!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: GestureDetector(
                        onTap: () => onOpenImage(message.image!),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: CachedNetworkImage(
                            imageUrl: message.image!,
                            width: 200,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                    ),
                  if (message.text.isNotEmpty)
                    Text(
                      message.text,
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 14,
                        color: isMine ? Colors.white : const Color(0xFF1F2937),
                      ),
                    ),
                  const SizedBox(height: 4),
                  Text(
                    timeLabel,
                    style: TextStyle(
                      fontSize: 10,
                      fontFamily: 'Cairo',
                      color: isMine ? Colors.white70 : const Color(0xFF9CA3AF),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (!isMine)
            IconButton(
              onPressed: onReply,
              icon: const Icon(LucideIcons.cornerUpLeft, size: 16),
              visualDensity: VisualDensity.compact,
            ),
        ],
      ),
    );
  }
}