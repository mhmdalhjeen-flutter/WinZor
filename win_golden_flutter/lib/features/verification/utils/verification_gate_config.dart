/// Prompt copy overrides — mirrors React `verificationGateConfig.js`.
class VerificationPromptConfig {
  final String? feature;
  final String? title;
  final String? message;

  const VerificationPromptConfig({
    this.feature,
    this.title,
    this.message,
  });

  bool get isCart => feature == 'cart';

  static const cart = VerificationPromptConfig(
    feature: 'cart',
    title: 'يجب توثيق الحساب أولاً',
    message: 'يجب توثيق الحساب أولاً لتتمكن من استخدام هذه الميزة',
  );
}

/// Alias matching React `CART_VERIFICATION`.
const cartVerification = VerificationPromptConfig.cart;
