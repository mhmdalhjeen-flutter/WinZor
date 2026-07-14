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
}
