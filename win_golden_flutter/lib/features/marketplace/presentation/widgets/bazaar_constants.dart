import 'package:flutter/material.dart';

class BazaarConstants {
  static const List<Map<String, String>> categories = [
    {'value': 'cars', 'label': 'سيارات'},
    {'value': 'bikes', 'label': 'دراجات'},
    {'value': 'phones', 'label': 'هواتف'},
    {'value': 'tablets', 'label': 'أجهزة لوحية'},
    {'value': 'computers', 'label': 'حاسوب'},
    {'value': 'electronics', 'label': 'إلكترونيات'},
    {'value': 'home_appliances', 'label': 'أجهزة منزلية'},
    {'value': 'furniture', 'label': 'أثاث'},
    {'value': 'furnishings', 'label': 'مفروشات'},
    {'value': 'real_estate', 'label': 'عقارات'},
    {'value': 'land', 'label': 'أراضٍ'},
    {'value': 'clothing', 'label': 'ملابس'},
    {'value': 'shoes', 'label': 'أحذية'},
    {'value': 'bags', 'label': 'حقائب'},
    {'value': 'watches', 'label': 'ساعات'},
    {'value': 'jewelry', 'label': 'ذهب ومجوهرات'},
    {'value': 'kids_toys', 'label': 'ألعاب أطفال'},
    {'value': 'kids_supplies', 'label': 'مستلزمات أطفال'},
    {'value': 'sports', 'label': 'معدات رياضية'},
    {'value': 'professional', 'label': 'معدات مهنية'},
    {'value': 'animals', 'label': 'حيوانات'},
    {'value': 'books', 'label': 'كتب'},
    {'value': 'collectibles', 'label': 'مقتنيات'},
    {'value': 'building_materials', 'label': 'مواد بناء'},
    {'value': 'garden', 'label': 'حدائق وزراعة'},
    {'value': 'other', 'label': 'أخرى'},
  ];

  static const List<Map<String, String>> conditions = [
    {'value': 'new', 'label': 'جديد'},
    {'value': 'like_new', 'label': 'مستعمل كالجديد'},
    {'value': 'good', 'label': 'مستعمل بحالة جيدة'},
    {'value': 'used', 'label': 'مستعمل'},
  ];

  static String getCategoryLabel(String value) {
    return categories.firstWhere((c) => c['value'] == value, orElse: () => {'label': value})['label']!;
  }

  static String getConditionLabel(String value) {
    return conditions.firstWhere((c) => c['value'] == value, orElse: () => {'label': value})['label']!;
  }

  static Color getConditionColor(String condition) {
    switch (condition) {
      case 'new': return const Color(0xFF10B981);
      case 'like_new': return const Color(0xFF14B8A6);
      case 'good': return const Color(0xFFF59E0B);
      default: return const Color(0xFFF97316);
    }
  }

  static Color getTransactionTypeColor(String type) {
    switch (type) {
      case 'sell': return const Color(0xFF059669);
      case 'exchange': return const Color(0xFF0D9488);
      case 'custom': return const Color(0xFFEA580C);
      case 'rent': return const Color(0xFF2563EB);
      default: return const Color(0xFF4B5563);
    }
  }

  static String getTransactionTypeLabel(String type) {
    switch (type) {
      case 'sell': return 'بيع';
      case 'exchange': return 'بدل';
      case 'custom': return 'مطلوب';
      case 'rent': return 'إيجار';
      case 'buy': return 'شراء';
      default: return type;
    }
  }

  static String getPublishTitle(String type) {
    switch (type) {
      case 'sell':
        return 'نشر عنصر للبيع';
      case 'exchange':
        return 'نشر للبيع أو البدل';
      case 'rent':
        return 'نشر للإيجار';
      case 'custom':
        return 'نشر طلب (مطلوب)';
      default:
        return 'بيع / نشر';
    }
  }

  static const Map<String, ({String text, Color bg, Color fg})> statusLabels = {
    'pending': (text: 'بانتظار الموافقة', bg: Color(0xFFFFFBEB), fg: Color(0xFFD97706)),
    'approved': (text: 'نشط', bg: Color(0xFFF0FDF4), fg: Color(0xFF16A34A)),
    'rejected': (text: 'مرفوض', bg: Color(0xFFFEF2F2), fg: Color(0xFFDC2626)),
    'expired': (text: 'منتهٍ', bg: Color(0xFFF3F4F6), fg: Color(0xFF6B7280)),
  };

  static String formatPublishAge(DateTime? date) {
    if (date == null) return '';
    final days = DateTime.now().difference(date).inDays;
    if (days <= 0) return 'اليوم';
    if (days == 1) return 'منذ يوم';
    return 'منذ $days يوماً';
  }

  static String regionLabel(dynamic regionId, dynamic subRegionId) {
    final parts = <String>[];
    if (regionId is Map && regionId['name'] != null) {
      parts.add(regionId['name'].toString());
    }
    if (subRegionId is Map && subRegionId['name'] != null) {
      parts.add(subRegionId['name'].toString());
    }
    return parts.isEmpty ? '—' : parts.join('، ');
  }
}
