import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/reel_viewer_item.dart';
import '../widgets/reel_slide.dart';
import '../providers/offer_detail_providers.dart';
import '../../../products/presentation/providers/product_providers.dart';

/// TikTok/Reels-style vertical snap physics — snappy spring, full-page steps.
class _ReelScrollPhysics extends PageScrollPhysics {
  const _ReelScrollPhysics({super.parent});

  @override
  _ReelScrollPhysics applyTo(ScrollPhysics? ancestor) {
    return _ReelScrollPhysics(parent: buildParent(ancestor));
  }

  @override
  SpringDescription get spring => const SpringDescription(
        mass: 0.5,
        stiffness: 120,
        damping: 16,
      );

  @override
  double get minFlingVelocity => 50;

  @override
  double get maxFlingVelocity => 4000;
}

class OfferReelPage extends ConsumerStatefulWidget {
  final List<ReelViewerItem> items;
  final int initialIndex;

  const OfferReelPage({
    super.key,
    required this.items,
    this.initialIndex = 0,
  });

  @override
  ConsumerState<OfferReelPage> createState() => _OfferReelPageState();
}

class _OfferReelPageState extends ConsumerState<OfferReelPage> {
  late PageController _pageController;
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex.clamp(0, widget.items.length - 1);
    _pageController = PageController(initialPage: _currentIndex);
    WidgetsBinding.instance.addPostFrameCallback((_) => _trackView(_currentIndex));
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onPageChanged(int index) {
    setState(() => _currentIndex = index);
    _trackView(index);
  }

  Future<void> _trackView(int index) async {
    if (index < 0 || index >= widget.items.length) return;
    final item = widget.items[index];
    if (item.type == ReelItemType.offer) {
      await ref.read(offerRepositoryProvider).recordView(item.id);
    } else if (item.type == ReelItemType.product) {
      try {
        final product = await ref.read(productRepositoryProvider).getProduct(item.id);
        await ref.read(productRepositoryProvider).logView(product);
      } catch (_) {}
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.items.isEmpty) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: IconButton(
            icon: const Icon(LucideIcons.x, color: Colors.white),
            onPressed: () => context.pop(),
          ),
        ),
      );
    }

    final current = widget.items[_currentIndex];

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          PageView.builder(
            scrollDirection: Axis.vertical,
            controller: _pageController,
            onPageChanged: _onPageChanged,
            itemCount: widget.items.length,
            pageSnapping: true,
            allowImplicitScrolling: true,
            physics: const _ReelScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            itemBuilder: (context, index) {
              final item = widget.items[index];
              if (item.type == ReelItemType.category) {
                return _CategoryIntroSlide(item: item);
              }
              return SizedBox.expand(
                child: ReelSlide(
                  item: item,
                  isActive: index == _currentIndex,
                ),
              );
            },
          ),
          if (current.type != ReelItemType.category)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: _buildTopBar(context, current),
            ),
          if (_currentIndex < widget.items.length - 1)
            const Positioned(
              bottom: 20,
              left: 0,
              right: 0,
              child: Center(
                child: Icon(
                  LucideIcons.chevronUp,
                  color: Colors.white38,
                  size: 24,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTopBar(BuildContext context, ReelViewerItem item) {
    final store = item.store;
    final storeName = store?['name']?.toString() ?? 'متجر';
    final storeLogo = store?['logo']?.toString();
    final isVerified = store?['isVerifiedStore'] == true;
    final storeId = item.storeId;

    return Container(
      padding: EdgeInsets.fromLTRB(
        16,
        MediaQuery.of(context).padding.top + 8,
        16,
        16,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.black.withOpacity(0.6),
            Colors.transparent,
          ],
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: () => context.pop(),
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.5),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white24),
              ),
              child: const Icon(LucideIcons.x, color: Colors.white, size: 24),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: GestureDetector(
              onTap: storeId != null && storeId.isNotEmpty
                  ? () => context.push('/store/$storeId')
                  : null,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            storeName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                              fontFamily: 'Cairo',
                            ),
                          ),
                          if (isVerified)
                            const Text(
                              '✔ متجر موثق',
                              style: TextStyle(
                                color: Color(0xFF10B981),
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(width: 10),
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                          image: storeLogo != null && storeLogo.isNotEmpty
                              ? DecorationImage(
                                  image: CachedNetworkImageProvider(storeLogo),
                                  fit: BoxFit.cover,
                                )
                              : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.title,
                    textAlign: TextAlign.right,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      fontFamily: 'Cairo',
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CategoryIntroSlide extends StatelessWidget {
  final ReelViewerItem item;

  const _CategoryIntroSlide({required this.item});

  @override
  Widget build(BuildContext context) {
    final icon = item.categoryIcon;
    return ColoredBox(
      color: Colors.black,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null && icon.isNotEmpty)
              Text(icon, style: const TextStyle(fontSize: 48)),
            const SizedBox(height: 16),
            Text(
              item.categoryName ?? item.title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.w900,
                fontFamily: 'Cairo',
              ),
            ),
          ],
        ),
      ),
    );
  }
}
