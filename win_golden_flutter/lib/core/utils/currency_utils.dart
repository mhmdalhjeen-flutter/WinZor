import 'package:intl/intl.dart';

class CurrencyUtils {
  static String formatPrice(num? price, String? currency) {
    if (price == null) return '';
    final symbol = getCurrencySymbol(currency);
    final formatter = NumberFormat.decimalPattern();
    return '${formatter.format(price)} $symbol';
  }

  static String getCurrencySymbol(String? currency) {
    switch (currency) {
      case 'ILS':
        return '₪';
      case 'JOD':
        return 'JD';
      case 'USD':
        return '\$';
      default:
        return '₪';
    }
  }
}
