class PhoneValidation {
  static const String localPhonePlaceholder = '0592222222';
  static const String localPhoneMessage =
      'رقم فلسطيني فقط: 059 (جوال) أو 056 (وطنية) ثم 7 أرقام — 10 أرقام بالمجموع';

  static final RegExp _localPhoneRegex = RegExp(r'^05(9|6)\d{7}$');

  static String strip(String? value) {
    return (value ?? '').trim().replaceAll(RegExp(r'[\s\-()]'), '');
  }

  static String normalizeLocalPhone(String value) {
    String p = strip(value);
    if (p.isEmpty) return '';

    if (p.startsWith('+')) {
      if (RegExp(r'^\+9705[69]\d{7}$').hasMatch(p)) return '0${p.substring(4)}';
      if (RegExp(r'^\+9725[69]\d{7}$').hasMatch(p)) return '0${p.substring(4)}';
      return p;
    }

    if (RegExp(r'^009705[69]\d{7}$').hasMatch(p)) return '0${p.substring(5)}';
    if (RegExp(r'^009725[69]\d{7}$').hasMatch(p)) return '0${p.substring(5)}';
    if (RegExp(r'^9705[69]\d{7}$').hasMatch(p)) return '0${p.substring(3)}';
    if (RegExp(r'^9725[69]\d{7}$').hasMatch(p)) return '0${p.substring(3)}';
    if (RegExp(r'^5[69]\d{7}$').hasMatch(p)) return '0$p';

    return p;
  }

  static bool isValidLocalPhone(String value) {
    return _localPhoneRegex.hasMatch(normalizeLocalPhone(value));
  }

  static String? getPhoneCarrier(String value) {
    final p = normalizeLocalPhone(value);
    if (p.startsWith('059')) return 'jawwal';
    if (p.startsWith('056')) return 'wataniya';
    if (p.length >= 3) {
      if (p[2] == '9') return 'jawwal';
      if (p[2] == '6') return 'wataniya';
    }
    return null;
  }

  static String sanitizeLocalPhoneInput(String value) {
    String digits = value.replaceAll(RegExp(r'\D'), '');
    if (digits.isEmpty) return '';

    if (digits.startsWith('009705') || digits.startsWith('009725')) {
      digits = '0${digits.substring(5)}';
    } else if (digits.startsWith('9705') || digits.startsWith('9725')) {
      digits = '0${digits.substring(3)}';
    }

    if (digits[0] != '0') return '';
    if (digits.length >= 2 && digits[1] != '5') return '0';
    if (digits.length >= 3 && digits[2] != '6' && digits[2] != '9') {
      return digits.substring(0, 2);
    }

    return digits.length > 10 ? digits.substring(0, 10) : digits;
  }

  static String? getLocalPhoneError(String value) {
    if (strip(value).isEmpty) return 'أدخل رقم الهاتف';
    if (!isValidLocalPhone(value)) return localPhoneMessage;
    return null;
  }
}
