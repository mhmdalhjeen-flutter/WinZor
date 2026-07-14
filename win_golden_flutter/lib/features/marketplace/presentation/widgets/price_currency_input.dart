import 'package:flutter/material.dart';

class PriceCurrencyInput extends StatefulWidget {
  final String price;
  final String currency;
  final Function(String) onPriceChange;
  final Function(String) onCurrencyChange;
  final String pricePlaceholder;

  const PriceCurrencyInput({
    super.key,
    required this.price,
    required this.currency,
    required this.onPriceChange,
    required this.onCurrencyChange,
    this.pricePlaceholder = 'السعر',
  });

  static const List<Map<String, String>> currencies = [
    {'code': 'ILS', 'label': '₪ شيكل'},
    {'code': 'JOD', 'label': 'JD دينار'},
    {'code': 'USD', 'label': '\$ دولار'},
  ];

  @override
  State<PriceCurrencyInput> createState() => _PriceCurrencyInputState();
}

class _PriceCurrencyInputState extends State<PriceCurrencyInput> {
  late final TextEditingController _priceCtrl;

  @override
  void initState() {
    super.initState();
    _priceCtrl = TextEditingController(text: widget.price);
  }

  @override
  void dispose() {
    _priceCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: _priceCtrl,
            onChanged: widget.onPriceChange,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(
              hintText: widget.pricePlaceholder,
              fillColor: const Color(0xFFF9FAFB),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            ),
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: const Color(0xFFF9FAFB),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: widget.currency,
              items: PriceCurrencyInput.currencies
                  .map(
                    (c) => DropdownMenuItem(
                      value: c['code'],
                      child: Text(
                        c['label']!,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ),
                  )
                  .toList(),
              onChanged: (val) {
                if (val != null) widget.onCurrencyChange(val);
              },
            ),
          ),
        ),
      ],
    );
  }
}
