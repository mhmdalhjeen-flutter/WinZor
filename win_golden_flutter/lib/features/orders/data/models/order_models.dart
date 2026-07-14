class OrderLineItem {
  final String name;
  final int quantity;

  const OrderLineItem({this.name = '—', this.quantity = 0});

  factory OrderLineItem.fromJson(Map<String, dynamic> json) {
    return OrderLineItem(
      name: (json['name'] ?? '—').toString(),
      quantity: int.tryParse(json['quantity']?.toString() ?? '') ?? 0,
    );
  }
}

class OrderModel {
  final String id;
  final String status;
  final double total;
  final String currency;
  final String? storeName;
  final DateTime? createdAt;
  final List<OrderLineItem> items;

  const OrderModel({
    required this.id,
    required this.status,
    this.total = 0,
    this.currency = 'ILS',
    this.storeName,
    this.createdAt,
    this.items = const [],
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    final store = json['store'];
    final rawItems = json['items'];
    final items = <OrderLineItem>[];
    if (rawItems is List) {
      for (final e in rawItems) {
        if (e is Map) {
          items.add(OrderLineItem.fromJson(Map<String, dynamic>.from(e)));
        }
      }
    }
    return OrderModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
      total: double.tryParse(json['total']?.toString() ?? '') ?? 0,
      currency: (json['currency'] ?? 'ILS').toString(),
      storeName: store is Map ? store['name']?.toString() : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      items: items,
    );
  }
}

const orderStatusLabels = {
  'pending': 'بانتظار التأكيد',
  'confirmed': 'مؤكّد',
  'rejected': 'مرفوض',
  'delivered': 'تم التسليم',
  'cancelled': 'ملغى',
  'completed_off_platform': 'اكتمل خارج المنصة',
};
