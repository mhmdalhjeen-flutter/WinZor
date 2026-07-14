import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../home/data/models/offer_model.dart';
import '../widgets/reel_slide.dart';
import '../providers/offer_detail_providers.dart';

class OfferReelPage extends ConsumerStatefulWidget {
  final List<OfferModel> offers;
  final int initialIndex;

  const OfferReelPage({
    super.key,
    required this.offers,
    this.initialIndex = 0,
  });

  @override
  ConsumerState<OfferReelPage> createState() => _OfferReelPageState();
}

class _OfferReelPageState extends ConsumerState<OfferReelPage> {
  late PageController _pageController;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onPageChanged(int index) {
    setState(() {
      _currentIndex = index;
    });
    // In React, recordOfferView is called after 1.2s delay if still on page
    final offer = widget.offers[index];
    ref.read(offerRepositoryProvider).recordView(offer.id);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // The vertical scroller
          PageView.builder(
            scrollDirection: Axis.vertical,
            controller: _pageController,
            onPageChanged: _onPageChanged,
            itemCount: widget.offers.length,
            itemBuilder: (context, index) {
              return ReelSlide(
                offer: widget.offers[index],
                isActive: index == _currentIndex,
              );
            },
          ),

          // Top Bar (Close and Store Info)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: _buildTopBar(context),
          ),

          // Navigation Hint (Up Arrow at bottom)
          if (_currentIndex < widget.offers.length - 1)
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

  Widget _buildTopBar(BuildContext context) {
    final offer = widget.offers[_currentIndex];
    final store = offer.storeObject;

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
          // Close Button
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
          
          // Store Info
          if (store != null)
            Expanded(
              child: GestureDetector(
                onTap: () => context.push('/store/${store.id}'),
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
                              store.name,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                fontFamily: 'Cairo',
                              ),
                            ),
                            if (store.isVerifiedStore)
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
                            image: store.logo != null
                                ? DecorationImage(
                                    image: CachedNetworkImageProvider(store.logo!),
                                    fit: BoxFit.cover,
                                  )
                                : null,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      offer.title,
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
