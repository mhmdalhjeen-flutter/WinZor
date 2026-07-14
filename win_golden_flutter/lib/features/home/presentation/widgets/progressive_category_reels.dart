import 'package:flutter/material.dart';
import 'category_carousel.dart';

class ProgressiveCategoryReels extends StatefulWidget {
  final List<dynamic> reels;

  const ProgressiveCategoryReels({
    super.key,
    required this.reels,
  });

  @override
  State<ProgressiveCategoryReels> createState() => _ProgressiveCategoryReelsState();
}

class _ProgressiveCategoryReelsState extends State<ProgressiveCategoryReels> {
  int _visibleCategoryCount = 1;
  static const int _initialOffers = 3;
  static const int _offersBatch = 4;
  
  final Map<int, int> _visibleOffersByCategory = {0: _initialOffers};
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      _revealMore();
    }
  }

  void _revealMore() {
    if (widget.reels.isEmpty) return;

    setState(() {
      final int lastIdx = _visibleCategoryCount - 1;
      final dynamic lastReel = widget.reels[lastIdx];
      final List offers = lastReel['offers'] ?? [];
      final int totalOffers = offers.length;
      final int currentlyVisibleOffers = _visibleOffersByCategory[lastIdx] ?? _initialOffers;

      if (currentlyVisibleOffers < totalOffers) {
        _visibleOffersByCategory[lastIdx] = (currentlyVisibleOffers + _offersBatch).clamp(0, totalOffers);
      } else if (_visibleCategoryCount < widget.reels.length) {
        _visibleCategoryCount++;
        _visibleOffersByCategory[_visibleCategoryCount - 1] = _initialOffers;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (widget.reels.isEmpty) return const SizedBox.shrink();

    return Column(
      children: [
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _visibleCategoryCount,
          separatorBuilder: (context, index) => const Divider(height: 32, color: Colors.transparent),
          itemBuilder: (context, index) {
            final reel = widget.reels[index];
            final int offerLimit = _visibleOffersByCategory[index] ?? _initialOffers;
            
            // Slice offers based on visibility limit
            final List allOffers = reel['offers'] ?? [];
            final List visibleOffers = allOffers.take(offerLimit).toList();
            final List allProducts = reel['products'] ?? [];
            
            // Create a copy of the reel with limited offers for the carousel
            final Map<String, dynamic> displayReel = Map.from(reel);
            displayReel['offers'] = visibleOffers;

            return CategoryCarousel(
              reel: displayReel,
              totalOffersCount: allOffers.length,
              totalProductsCount: allProducts.length,
            );
          },
        ),
        if (_visibleCategoryCount < widget.reels.length || 
            (_visibleOffersByCategory[_visibleCategoryCount - 1] ?? _initialOffers) < (widget.reels[_visibleCategoryCount - 1]['offers']?.length ?? 0))
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 20),
            child: Text(
              'جاري تحميل المزيد...',
              style: TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
            ),
          )
        else
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 20),
            child: Text(
              '— انتهت العروض —',
              style: TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
            ),
          ),
      ],
    );
  }
}
