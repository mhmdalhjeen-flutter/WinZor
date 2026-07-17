import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/phone_validation.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../auth/presentation/widgets/palestinian_phone_input.dart';
import '../../../home/presentation/providers/home_providers.dart';
import '../../../verification/presentation/providers/verification_gate_provider.dart';
import '../../data/models/bazaar_listing_model.dart';
import '../providers/marketplace_providers.dart';
import '../widgets/bazaar_constants.dart';
import '../widgets/marketplace_image_picker.dart';
import '../widgets/price_currency_input.dart';
import '../widgets/region_picker_box.dart';

class MarketplacePublishPage extends ConsumerStatefulWidget {
  final String transactionType;
  final BazaarListingModel? editingListing;

  const MarketplacePublishPage({
    super.key,
    required this.transactionType,
    this.editingListing,
  });

  @override
  ConsumerState<MarketplacePublishPage> createState() =>
      _MarketplacePublishPageState();
}

class _MarketplacePublishPageState extends ConsumerState<MarketplacePublishPage> {
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

  String get _type =>
      widget.editingListing?.transactionType ?? widget.transactionType;

  @override
  void initState() {
    super.initState();
    if (widget.editingListing != null) {
      final l = widget.editingListing!;
      _title = l.title;
      _price = l.price == 0 ? '' : l.price.toString();
      _currency = l.currency;
      _category = l.category;
      _condition = l.condition.isEmpty ? 'used' : l.condition;
      _description = l.description ?? '';
      _keywords = l.keywords.join(', ');
      _contactPhone = l.contactPhone ?? '';
      _freeDelivery = l.freeDelivery;
      _images = List.from(l.images);
      _mainImageIndex = l.mainImageIndex;

      _regionPath = [];
      if (l.regionId != null) {
        final rid = l.regionId is Map ? l.regionId['_id'] : l.regionId;
        if (rid != null && rid.toString().isNotEmpty) {
          _regionPath.add(rid.toString());
        }
        if (l.subRegionId != null) {
          final sid =
              l.subRegionId is Map ? l.subRegionId['_id'] : l.subRegionId;
          if (sid != null && sid.toString().isNotEmpty) {
            _regionPath.add(sid.toString());
          }
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

  void _toast(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  Future<void> _submit() async {
    final isRequest = _type == 'custom';
    final isEditing = widget.editingListing != null;

    if (_title.trim().isEmpty) {
      _toast(_type == 'rent' ? 'أدخل عنوان العقار أو الأصل' : 'أدخل اسم العنصر');
      return;
    }
    if (!isRequest && _images.isEmpty) {
      _toast('أضف صورة واحدة على الأقل');
      return;
    }
    if (_contactPhone.trim().isNotEmpty) {
      final phoneErr = PhoneValidation.getLocalPhoneError(_contactPhone);
      if (phoneErr != null) {
        _toast(phoneErr);
        return;
      }
    }
    if (!isRequest && _price.trim().isEmpty) {
      _toast('أدخل السعر');
      return;
    }
    if (!isRequest && _category.isEmpty) {
      _toast('اختر الفئة');
      return;
    }
    if (!isRequest && _keywords.trim().isEmpty) {
      _toast('أدخل الكلمات المفتاحية');
      return;
    }

    final meta = ref.read(bazaarMetaProvider).valueOrNull ?? {};
    final cost = (meta['pointsCost'] as num?)?.toInt() ?? 3;
    final available = (meta['pointsAvailable'] as num?)?.toInt() ??
        (ref.read(authProvider).user?['points'] as num?)?.toInt() ??
        0;

    if (!isEditing && available < cost) {
      _toast('تحتاج $cost نقاط لنشر الإعلان');
      return;
    }

    if (!isEditing) {
      ref.read(verificationGateProvider.notifier).runWithVerification(_performSubmit);
      return;
    }
    await _performSubmit();
  }

  Future<void> _performSubmit() async {
    final isRequest = _type == 'custom';
    final isEditing = widget.editingListing != null;
    setState(() => _submitting = true);

    try {
      final repo = ref.read(marketplaceRepositoryProvider);

      final uploadedUrls = <String>[];
      for (final path in _images) {
        if (path.startsWith('http')) {
          uploadedUrls.add(path);
        } else {
          uploadedUrls.add(await repo.uploadImage(path));
        }
      }

      final payload = <String, dynamic>{
        'title': _title.trim(),
        'transactionType': _type,
        'price': _price.trim().isEmpty ? 0 : (num.tryParse(_price) ?? 0),
        'currency': _currency.isEmpty ? 'ILS' : _currency,
        'description': _description,
        'images': uploadedUrls,
        'mainImageIndex': _mainImageIndex,
        'contactPhone': _contactPhone.trim().isEmpty
            ? ''
            : PhoneValidation.normalizeLocalPhone(_contactPhone),
        'freeDelivery': _freeDelivery,
      };

      if (_regionPath.isNotEmpty) {
        payload['regionId'] = _regionPath[0];
        if (_regionPath.length > 1) {
          payload['subRegionId'] = _regionPath[1];
        }
      }

      if (!isRequest) {
        payload['condition'] = _condition;
        payload['category'] = _category;
        payload['keywords'] = _keywords;
      } else if (_category.isNotEmpty) {
        payload['category'] = _category;
      }

      if (isEditing) {
        await repo.updateListing(widget.editingListing!.id, payload);
        _toast('تم حفظ التعديل');
      } else {
        final data = await repo.createListing(payload);
        _toast(data['message']?.toString() ?? 'تم إرسال الإعلان');
        final remaining = data['pointsRemaining'];
        if (remaining != null) {
          ref.read(authProvider.notifier).updateUser({'points': remaining});
        }
      }

      ref.read(marketplaceActiveTabProvider.notifier).state = 'mine';
      invalidateMarketplaceLists(ref);
      if (mounted) context.pop();
    } catch (e) {
      final gate = ref.read(verificationGateProvider.notifier);
      if (!isEditing &&
          gate.handleApiVerificationError(e, _performSubmit)) {
        return;
      }
      _toast(_errMsg(e, 'فشل النشر'));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  String _errMsg(Object e, String fallback) {
    if (e is DioException) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        return data['message'].toString();
      }
    }
    return fallback;
  }

  @override
  Widget build(BuildContext context) {
    final isRequest = _type == 'custom';
    final metaAsync = ref.watch(bazaarMetaProvider);
    final regionsAsync = ref.watch(regionsProvider);
    final isEditing = widget.editingListing != null;

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        leading: TextButton(
          onPressed: () => context.pop(),
          child: const Text(
            'إلغاء',
            style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold),
          ),
        ),
        title: Text(
          isEditing ? 'تعديل الإعلان' : BazaarConstants.getPublishTitle(_type),
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w900,
            fontFamily: 'Cairo',
          ),
        ),
        actions: [
          if (!_submitting)
            TextButton(
              onPressed: _submit,
              child: Text(
                isEditing ? 'حفظ' : 'نشر',
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w900,
                  fontFamily: 'Cairo',
                ),
              ),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            metaAsync.when(
              data: _buildPointsAlert,
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
            _buildLabel(_type == 'rent' ? 'عنوان العقار أو الأصل' : 'اسم العنصر'),
            TextFormField(
              initialValue: _title,
              onChanged: (val) => _title = val,
              decoration: InputDecoration(
                hintText: isRequest
                    ? 'ما الذي تبحث عنه؟'
                    : (_type == 'rent' ? 'عنوان العقار أو الأصل' : 'اسم العنصر'),
                filled: true,
                fillColor: const Color(0xFFF9FAFB),
              ),
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
              _buildLabel('الفئة'),
              DropdownButtonFormField<String>(
                value: _category.isEmpty ? null : _category,
                items: BazaarConstants.categories
                    .map(
                      (c) => DropdownMenuItem(
                        value: c['value'],
                        child: Text(
                          c['label']!,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    )
                    .toList(),
                onChanged: (val) => setState(() => _category = val ?? ''),
                decoration: const InputDecoration(
                  hintText: 'اختر الفئة',
                  filled: true,
                  fillColor: Color(0xFFF9FAFB),
                ),
              ),
              const SizedBox(height: 16),
              _buildLabel('الحالة'),
              DropdownButtonFormField<String>(
                value: _condition,
                items: BazaarConstants.conditions
                    .map(
                      (c) => DropdownMenuItem(
                        value: c['value'],
                        child: Text(
                          c['label']!,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    )
                    .toList(),
                onChanged: (val) => setState(() => _condition = val ?? 'used'),
                decoration: const InputDecoration(
                  filled: true,
                  fillColor: Color(0xFFF9FAFB),
                ),
              ),
              const SizedBox(height: 16),
            ],
            _buildLabel('الوصف'),
            TextFormField(
              initialValue: _description,
              onChanged: (val) => _description = val,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'وصف مختصر للعنصر...',
                filled: true,
                fillColor: Color(0xFFF9FAFB),
              ),
            ),
            const SizedBox(height: 16),
            if (!isRequest) ...[
              _buildLabel('الكلمات المفتاحية'),
              TextFormField(
                initialValue: _keywords,
                onChanged: (val) => _keywords = val,
                decoration: const InputDecoration(
                  hintText: '2–5 كلمات مفصولة بفاصلة — تساعد في البحث',
                  filled: true,
                  fillColor: Color(0xFFF9FAFB),
                ),
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
            PalestinianPhoneInput(
              value: _contactPhone,
              onChanged: (v) => setState(() => _contactPhone = v),
              showHint: _contactPhone.isNotEmpty,
            ),
            const SizedBox(height: 16),
            if (!isRequest)
              CheckboxListTile(
                value: _freeDelivery,
                onChanged: (val) =>
                    setState(() => _freeDelivery = val ?? false),
                title: const Text(
                  'التوصيل مجاني',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cairo',
                  ),
                ),
                contentPadding: EdgeInsets.zero,
                controlAffinity: ListTileControlAffinity.leading,
                activeColor: AppColors.primary,
              ),
            const SizedBox(height: 24),
            if (_submitting)
              const Center(child: CircularProgressIndicator())
            else
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: Text(
                    isEditing ? 'حفظ التعديل' : 'نشر الإعلان',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'Cairo',
                    ),
                  ),
                ),
              ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w900,
          color: Color(0xFF4B5563),
          fontFamily: 'Cairo',
        ),
      ),
    );
  }

  Widget _buildPointsAlert(Map<String, dynamic> meta) {
    final int cost = (meta['pointsCost'] as num?)?.toInt() ?? 3;
    final int available = (meta['pointsAvailable'] as num?)?.toInt() ?? 0;
    final bool canAfford = available >= cost;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: canAfford ? const Color(0xFFDCFCE7) : const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: canAfford ? const Color(0xFFBBF7D0) : const Color(0xFFFEF3C7),
        ),
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
                    color: canAfford
                        ? const Color(0xFF15803D)
                        : const Color(0xFFB45309),
                    fontFamily: 'Cairo',
                  ),
                ),
                if (!canAfford)
                  const Padding(
                    padding: EdgeInsets.only(top: 4.0),
                    child: Text(
                      'احصل على نقاط عبر مشاركة رابط الإحالة أو دعوة صديق.',
                      style: TextStyle(
                        fontSize: 11,
                        color: Color(0xFF92400E),
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Cairo',
                      ),
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
