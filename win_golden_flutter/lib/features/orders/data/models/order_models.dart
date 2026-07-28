class OrderLineItem {
  final String name;
  final int quantity;
  final double price;

  const OrderLineItem({this.name = '—', this.quantity = 0, this.price = 0});

  factory OrderLineItem.fromJson(Map<String, dynamic> json) {
    return OrderLineItem(
      name: (json['name'] ?? '—').toString(),
      quantity: int.tryParse(json['quantity']?.toString() ?? '') ?? 0,
      price: double.tryParse(json['price']?.toString() ?? '') ?? 0,
    );
  }
}

class OrderTimelineEntry {
  final String status;
  final DateTime? at;
  final String note;

  const OrderTimelineEntry({this.status = '', this.at, this.note = ''});

  factory OrderTimelineEntry.fromJson(Map<String, dynamic> json) {
    return OrderTimelineEntry(
      status: (json['status'] ?? '').toString(),
      at: json['at'] != null ? DateTime.tryParse(json['at'].toString()) : null,
      note: (json['note'] ?? '').toString(),
    );
  }
}

class OrderModel {
  final String id;
  final String status;
  final double total;
  final String currency;
  final String? storeName;
  final String? orderNumber;
  final String? verificationCode;
  final String? customerNotes;
  final String? storeNotes;
  final String? paymentStatus;
  final String? paymentProof;
  final DateTime? createdAt;
  final DateTime? confirmedAt;
  final DateTime? completedAt;
  final List<OrderLineItem> items;
  final List<OrderTimelineEntry> statusTimeline;

  const OrderModel({
    required this.id,
    required this.status,
    this.total = 0,
    this.currency = 'ILS',
    this.storeName,
    this.orderNumber,
    this.verificationCode,
    this.customerNotes,
    this.storeNotes,
    this.paymentStatus,
    this.paymentProof,
    this.createdAt,
    this.confirmedAt,
    this.completedAt,
    this.items = const [],
    this.statusTimeline = const [],
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

    final rawTimeline = json['statusTimeline'];
    final timeline = <OrderTimelineEntry>[];
    if (rawTimeline is List) {
      for (final e in rawTimeline) {
        if (e is Map) {
          timeline.add(OrderTimelineEntry.fromJson(Map<String, dynamic>.from(e)));
        }
      }
    }

    return OrderModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
      total: double.tryParse(json['total']?.toString() ?? '') ?? 0,
      currency: (json['currency'] ?? 'ILS').toString(),
      storeName: store is Map ? store['name']?.toString() : null,
      orderNumber: json['orderNumber']?.toString(),
      verificationCode: json['verificationCode']?.toString(),
      customerNotes: json['customerNotes']?.toString(),
      storeNotes: json['storeNotes']?.toString(),
      paymentStatus: json['paymentStatus']?.toString(),
      paymentProof: json['paymentProof']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      confirmedAt: json['confirmedAt'] != null
          ? DateTime.tryParse(json['confirmedAt'].toString())
          : null,
      completedAt: json['completedAt'] != null
          ? DateTime.tryParse(json['completedAt'].toString())
          : null,
      items: items,
      statusTimeline: timeline,
    );
  }

  String get displayOrderNumber =>
      orderNumber?.isNotEmpty == true ? orderNumber! : id.length > 6 ? id.substring(id.length - 6).toUpperCase() : id;
}

const orderStatusLabels = {
  'pending': 'بانتظار التأكيد',
  'store_accepted': 'تم قبول المتجر',
  'preparing': 'قيد التحضير',
  'delivered_to_driver': 'تم التسليم للسائق',
  'delivered_to_customer': 'تم التسليم للزبون',
  'confirmed': 'مؤكّد',
  'rejected': 'مرفوض',
  'delivered': 'تم التسليم',
  'cancelled': 'ملغى',
  'completed_off_platform': 'اكتمل خارج المنصة',
};
