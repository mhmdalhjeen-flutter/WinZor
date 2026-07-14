import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/models/hierarchy_node.dart';
import '../widgets/marketplace_image_picker.dart';
import '../widgets/price_currency_input.dart';
import '../widgets/region_picker_box.dart';
import '../widgets/bazaar_constants.dart';
import '../providers/marketplace_providers.dart';
import '../models/bazaar_listing_model.dart';
import '../../../home/presentation/providers/home_providers.dart';

class MarketplacePublishPage extends ConsumerStatefulWidget {
  final String transactionType;
  final BazaarListingModel? editingListing;

  const MarketplacePublishPage({
    super.key,
    required this.transactionType,
    this.editingListing,
  });

  @override
  ConsumerState<MarketplacePublishPage> createState() => _MarketplacePublishPageState();
}

class _MarketplacePublishPageState extends ConsumerState<MarketplacePublishPage> {
  final _formKey = GlobalKey<FormState>();
  
  late String _title;
  late String _price;
  late String _currency;
  late String _category;
  late String _condition;
  late String _description;
  late String _keywords;
  late String _contactPhone;
  late bool _freeDelivery;
  late List<String> _images;
  late int _mainImageIndex;
  List<String> _regionPath = [];

  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    if (widget.editingListing != null) {
      final l = widget.editingListing!;
      _title = l.title;
      _price = l.price.toString();
      _currency = l.currency;
      _category = l.category;
      _condition = l.condition;
      _description = l.description ?? '';
      _keywords = l.keywords.join(', ');
      _contactPhone = l.contactPhone ?? '';
      _freeDelivery = l.freeDelivery;
      _images = List.from(l.images);
      _mainImageIndex = l.mainImageIndex;
      
      if (l.regionId != null) {
        _regionPath = [l.regionId is Map ? l.regionId['_id'] : l.regionId];
        if (l.subRegionId != null) {
          _regionPath.add(l.subRegionId is Map ? l.subRegionId['_id'] : l.subRegionId);
        }
      }
    } else {
      _title = '';
      _price = '';
      _currency = 'ILS';
      _category = '';
      _condition = 'used';
      _description = '';
      _keywords = '';
      _contactPhone = '';
      _freeDelivery = false;
      _images = [];
      _mainImageIndex = 0;
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();

    final isRequest = widget.transactionType == 'custom';
    if (!isRequest && _images.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('أضف صورة واحدة على الأقل')),
      );
      return;
    }

    setState(() => _submitting = true);

    try {
      final repo = ref.read(marketplaceRepositoryProvider);
      
      // 1. Upload local images first
      List<String> uploadedUrls = [];
      for (var path in _images) {
        if (path.startsWith('http')) {
          uploadedUrls.add(path); // Already uploaded
        } else {
          final url = await repo.uploadImage(path);
          uploadedUrls.add(url);
        }
      }

      // 2. Prepare payload
      final Map<String, dynamic> payload = {
        'title': _title,
        'transactionType': widget.transactionType,
        'price': double.tryParse(_price) ?? 0,
        'currency': _currency,
        'description': _description,
        'images': uploadedUrls,
        'mainImageIndex': _mainImageIndex,
        'contactPhone': _contactPhone,
        'freeDelivery': _freeDelivery,
        'category': _category,
        'condition': _condition,
        'keywords': _keywords.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList(),
      };

      if (_regionPath.isNotEmpty) {
        payload['regionId'] = _regionPath[0];
        if (_regionPath.length > 1) {
          payload['subRegionId'] = _regionPath[1];
        }
      }

      // 3. Create or update
      if (widget.editingListing != null) {
        await repo.updateListing(widget.editingListing!.id, payload);
      } else {
        await repo.createListing(payload);
      }

      ref.invalidate(myBazaarListingsProvider);
      ref.invalidate(bazaarBrowseProvider);
      if (mounted) context.pop();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('فشل النشر: $e')),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isRequest = widget.transactionType == 'custom';
    final metaAsync = ref.watch(bazaarMetaProvider);
    final regionsAsync = ref.watch(regionsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        leading: TextButton(
          onPressed: () => context.pop(),
          child: const Text('إلغاء', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
        ),
        title: Text(
          widget.editingListing != null ? 'تعديل الإعلان' : BazaarConstants.getTransactionTypeLabel(widget.transactionType),
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, fontFamily: 'Cairo'),
        ),
        actions: [
          if (!_submitting)
            TextButton(
              onPressed: _submit,
              child: Text(
                widget.editingListing != null ? 'حفظ' : 'نشر',
                style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w900, fontFamily: 'Cairo'),
              ),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              metaAsync.when(
                data: (meta) => _buildPointsAlert(meta),
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
              const SizedBox(height: 16),

              MarketplaceImagePicker(
                images: _images,
                mainImageIndex: _mainImageIndex,
                onImagePicked: (path) => setState(() => _images.add(path)),
                onRemoveImage: (idx) => setState(() {
                  _images.removeAt(idx);
                  if (_mainImageIndex >= _images.length) _mainImageIndex = 0;
                }),
                onMainImageChange: (idx) => setState(() => _mainImageIndex = idx),
                optional: isRequest,
                wantedMode: isRequest,
              ),
              const SizedBox(height: 24),

              _buildLabel(widget.transactionType == 'rent' ? 'عنوان العقار أو الأصل' : 'اسم العنصر'),
              TextFormField(
                initialValue: _title,
                onSaved: (val) => _title = val ?? '',
                decoration: InputDecoration(
                  hintText: isRequest ? 'ما الذي تبحث عنه؟' : 'اسم العنصر',
                ),
                validator: (val) => val == null || val.isEmpty ? 'هذا الحقل مطلوب' : null,
              ),
              const SizedBox(height: 16),

              if (!isRequest) ...[
                _buildLabel('السعر'),
                PriceCurrencyInput(
                  price: _price,
                  currency: _currency,
                  onPriceChange: (val) => _price = val,
                  onCurrencyChange: (val) => setState(() => _currency = val),
                ),
                const SizedBox(height: 16),
              ],

              if (!isRequest) ...[
                _buildLabel('الفئة'),
                DropdownButtonFormField<String>(
                  value: _category.isEmpty ? null : _category,
                  items: BazaarConstants.categories.map((c) => DropdownMenuItem(
                    value: c['value'],
                    child: Text(c['label']!, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  )).toList(),
                  onChanged: (val) => setState(() => _category = val ?? ''),
                  decoration: const InputDecoration(hintText: 'اختر الفئة'),
                  validator: (val) => val == null ? 'اختر الفئة' : null,
                ),
                const SizedBox(height: 16),
              ],

              if (!isRequest) ...[
                _buildLabel('الحالة'),
                DropdownButtonFormField<String>(
                  value: _condition,
                  items: BazaarConstants.conditions.map((c) => DropdownMenuItem(
                    value: c['value'],
                    child: Text(c['label']!, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  )).toList(),
                  onChanged: (val) => setState(() => _condition = val ?? 'used'),
                  decoration: const InputDecoration(),
                ),
                const SizedBox(height: 16),
              ],

              _buildLabel('الوصف'),
              TextFormField(
                initialValue: _description,
                onSaved: (val) => _description = val ?? '',
                maxLines: 3,
                decoration: const InputDecoration(hintText: 'وصف مختصر للعنصر...'),
              ),
              const SizedBox(height: 16),

              if (!isRequest) ...[
                _buildLabel('الكلمات المفتاحية'),
                TextFormField(
                  initialValue: _keywords,
                  onSaved: (val) => _keywords = val ?? '',
                  decoration: const InputDecoration(hintText: '2–5 كلمات مفصولة بفاصلة'),
                ),
                const SizedBox(height: 16),
              ],

              RegionPickerBox(
                tree: regionsAsync.value ?? [],
                pathIds: _regionPath,
                onPathChange: (path) => setState(() => _regionPath = path),
                loading: regionsAsync.isLoading,
              ),
              const SizedBox(height: 16),

              _buildLabel('رقم الهاتف (اختياري)'),
              TextFormField(
                initialValue: _contactPhone,
                onSaved: (val) => _contactPhone = val ?? '',
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(hintText: '059xxxxxxx'),
              ),
              const SizedBox(height: 16),

              if (!isRequest)
                CheckboxListTile(
                  value: _freeDelivery,
                  onChanged: (val) => setState(() => _freeDelivery = val ?? false),
                  title: const Text('التوصيل مجاني', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
                  contentPadding: EdgeInsets.zero,
                  controlAffinity: ListTileControlAffinity.leading,
                  activeColor: AppColors.primary,
                ),

              const SizedBox(height: 40),
              
              if (_submitting)
                const Center(child: CircularProgressIndicator())
              else
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _submit,
                    child: Text(widget.editingListing != null ? 'حفظ التعديل' : 'نشر الإعلان', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
                  ),
                ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(
        text,
        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF4B5563), fontFamily: 'Cairo'),
      ),
    );
  }

  Widget _buildPointsAlert(Map<String, dynamic> meta) {
    final int cost = meta['pointsCost'] ?? 3;
    final int available = meta['pointsAvailable'] ?? 0;
    final bool canAfford = available >= cost;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: canAfford ? const Color(0xFFDCFCE7) : const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: canAfford ? const Color(0xFFBBF7D0) : const Color(0xFFFEF3C7)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            canAfford ? LucideIcons.checkCircle2 : LucideIcons.alertCircle,
            color: canAfford ? const Color(0xFF15803D) : const Color(0xFFB45309),
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'رصيدك: $available نقطة — النشر يكلف $cost نقاط',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    color: canAfford ? const Color(0xFF15803D) : const Color(0xFFB45309),
                    fontFamily: 'Cairo',
                  ),
                ),
                if (!canAfford)
                  const Padding(
                    padding: EdgeInsets.only(top: 4.0),
                    child: Text(
                      'احصل على نقاط عبر مشاركة رابط الإحالة أو دعوة صديق.',
                      style: TextStyle(fontSize: 11, color: Color(0xFF92400E), fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
