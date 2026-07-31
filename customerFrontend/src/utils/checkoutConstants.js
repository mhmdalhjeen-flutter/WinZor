/** Delivery method options for checkout (frontend-only until backend supports them). */

export const DELIVERY_METHODS = {

  NEARBY: 'nearby',

  PICKUP: 'pickup',

  DELIVERY: 'delivery',

};



export const DELIVERY_METHOD_OPTIONS = [

  {

    id: DELIVERY_METHODS.NEARBY,

    label: 'أنا قريب من المتجر',

    description: 'أضف تفاصيل موقعك ليتمكن المتجر من الوصول إليك',

    requiresLocation: true,

    available: true,

  },

  {

    id: DELIVERY_METHODS.PICKUP,

    label: 'سأستلم الطلب بنفسي',

    description: 'ستستلم طلبك مباشرة من المتجر',

    requiresLocation: false,

    available: true,

  },

  {

    id: DELIVERY_METHODS.DELIVERY,

    label: 'التوصيل عبر الدليفري',

    description: 'ستتوفر الخدمة قريباً',

    requiresLocation: false,

    available: false,

  },

];



/** Payment method identifiers — prepared for future order API. */

export const PAYMENT_METHODS = {

  CASH_ON_DELIVERY: 'cash_on_delivery',

  SELLER_AGREEMENT: 'seller_agreement',

  BANK_PALESTINE: 'bank_palestine',

  PALPAY: 'palpay',

  JAWWAL_PAY: 'jawwal_pay',

};



export const PAYMENT_METHOD_OPTIONS = [

  {

    id: PAYMENT_METHODS.CASH_ON_DELIVERY,

    label: 'الدفع عند التوصيل',

    description: 'ادفع نقداً عند استلام طلبك',

    available: true,

    digital: false,

  },

  {

    id: PAYMENT_METHODS.SELLER_AGREEMENT,

    label: 'التفاهم مع البائع',

    description: 'تنسيق الدفع مباشرة مع المتجر',

    available: true,

    digital: false,

  },

  {

    id: PAYMENT_METHODS.BANK_PALESTINE,

    label: 'بنك فلسطين',

    description: 'حوّل المبلغ ثم أرفق إثبات التحويل',

    available: true,

    digital: true,

  },

  {

    id: PAYMENT_METHODS.PALPAY,

    label: 'PalPay',

    description: 'ادفع عبر PalPay وأرفق إثبات التحويل',

    available: true,

    digital: true,

  },

  {

    id: PAYMENT_METHODS.JAWWAL_PAY,

    label: 'Jawwal Pay',

    description: 'ادفع عبر Jawwal Pay وأرفق إثبات التحويل',

    available: true,

    digital: true,

  },

];



export function createDefaultCheckoutDraft(customerNotes = '') {

  return {

    customerNotes,

    deliveryMethod: DELIVERY_METHODS.NEARBY,

    locationDetails: '',

    paymentMethod: PAYMENT_METHODS.CASH_ON_DELIVERY,

    paymentNotes: '',

    transferProofUrl: '',

    transferProofPreview: '',

    transferSenderName: '',

    transferContactNumber: '',

    transferReferenceNumber: '',

    transferNote: '',

  };

}



export function getPaymentMethodLabel(methodId) {

  return PAYMENT_METHOD_OPTIONS.find((o) => o.id === methodId)?.label || '—';

}



export function getDeliveryMethodLabel(methodId) {

  return DELIVERY_METHOD_OPTIONS.find((o) => o.id === methodId)?.label || '—';

}


