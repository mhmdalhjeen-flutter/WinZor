import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/utils/phone_validation.dart';

class PalestinianPhoneInput extends StatelessWidget {
  final String value;
  final Function(String) onChanged;
  final bool disabled;
  final bool showHint;

  const PalestinianPhoneInput({
    super.key,
    required this.value,
    required this.onChanged,
    this.disabled = false,
    this.showHint = true,
  });

  @override
  Widget build(BuildContext context) {
    final carrier = PhoneValidation.getPhoneCarrier(value);
    final isValid = PhoneValidation.isValidLocalPhone(value);

    Color carrierColor;
    String? carrierLabel;

    if (carrier == 'jawwal') {
      carrierColor = Colors.green;
      carrierLabel = 'جوال';
    } else if (carrier == 'wataniya') {
      carrierColor = Colors.red;
      carrierLabel = 'وطنية';
    } else {
      carrierColor = Colors.white.withOpacity(0.35);
      carrierLabel = null;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Stack(
          alignment: Alignment.centerRight,
          children: [
            TextField(
              onChanged: (val) => onChanged(PhoneValidation.sanitizeLocalPhoneInput(val)),
              keyboardType: TextInputType.phone,
              enabled: !disabled,
              textAlign: TextAlign.left,
              textDirection: TextDirection.ltr,
              maxLength: 10,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Color(0xFF111827),
              ),
              decoration: InputDecoration(
                counterText: "",
                hintText: PhoneValidation.localPhonePlaceholder,
                hintStyle: TextStyle(color: Colors.grey.shade400),
                prefixIcon: const Icon(LucideIcons.phone, size: 18),
                prefixIconColor: carrierColor,
                contentPadding: const EdgeInsets.fromLTRB(16, 16, 48, 16),
              ),
            ),
            if (carrierLabel != null)
              Positioned(
                left: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: carrierColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: Text(
                    carrierLabel,
                    style: TextStyle(
                      color: carrierColor,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'Cairo',
                    ),
                  ),
                ),
              ),
          ],
        ),
        if (showHint)
          Padding(
            padding: const EdgeInsets.only(top: 6.0, right: 4.0),
            child: Text(
              isValid
                  ? '✓ رقم صالح — 10 أرقام'
                  : PhoneValidation.localPhoneMessage,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: isValid ? Colors.green : Colors.grey.shade500,
                fontFamily: 'Cairo',
              ),
            ),
          ),
      ],
    );
  }
}
