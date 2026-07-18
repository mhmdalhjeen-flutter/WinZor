import 'package:flutter/material.dart';

import 'onboarding_targets.dart';

class OnboardingStep {
  final String id;
  final GlobalKey targetKey;
  final String title;
  final String body;
  final int? shellBranch;
  final bool scrollToTarget;

  const OnboardingStep({
    required this.id,
    required this.targetKey,
    required this.title,
    required this.body,
    this.shellBranch,
    this.scrollToTarget = false,
  });
}

final mainOnboardingSteps = <OnboardingStep>[
  OnboardingStep(
    id: 'home',
    targetKey: OnboardingTargets.home,
    title: 'الرئيسية',
    body:
        'تصفّح العروض والمنتجات والمسابقات من مكان واحد — اسحب أفقياً بين البطاقات واكتشف ما يناسبك.',
    shellBranch: 0,
    scrollToTarget: true,
  ),
  OnboardingStep(
    id: 'search',
    targetKey: OnboardingTargets.search,
    title: 'البحث',
    body:
        'ابحث عن متاجر وعروض ومنتجات، أو فلتر حسب المنطقة والتصنيف للوصول السريع لما تريد.',
    shellBranch: 0,
    scrollToTarget: true,
  ),
  OnboardingStep(
    id: 'points',
    targetKey: OnboardingTargets.points,
    title: 'النقاط',
    body:
        'اجمع نقاطك من المتاجر المشاركة في البرنامج، واستبدلها بجوائز ومزايا حصرية.',
    shellBranch: 0,
  ),
  OnboardingStep(
    id: 'marketplace',
    targetKey: OnboardingTargets.marketplaceNav,
    title: 'السوق المفتوح',
    body:
        'اشترِ، بِع، استأجر، أو انشر طلباتك عبر السوق المفتوح — كل ذلك من تبويب واحد.',
    shellBranch: 2,
  ),
  OnboardingStep(
    id: 'reels',
    targetKey: OnboardingTargets.reelViewer,
    title: 'عارض الريلز',
    body:
        'اضغط على أي بطاقة عرض لفتح تجربة ريلز عمودية — تصفح العروض والمنتجات بسلاسة مثل TikTok.',
    shellBranch: 0,
    scrollToTarget: true,
  ),
  OnboardingStep(
    id: 'cart',
    targetKey: OnboardingTargets.cart,
    title: 'سلة التسوق',
    body: 'راجع منتجاتك وعروضك قبل إتمام الطلب — كل مشترياتك في مكان واحد.',
    shellBranch: 0,
  ),
  OnboardingStep(
    id: 'chat',
    targetKey: OnboardingTargets.chat,
    title: 'المحادثات',
    body: 'تواصل مباشرة مع المتاجر للاستفسار عن العروض والمنتجات.',
    shellBranch: 0,
  ),
  OnboardingStep(
    id: 'notifications',
    targetKey: OnboardingTargets.notifications,
    title: 'الإشعارات',
    body: 'تابع تحديثات المتاجر التي تتابعها، المسابقات، الطلبات، والرسائل.',
    shellBranch: 0,
  ),
  OnboardingStep(
    id: 'profile',
    targetKey: OnboardingTargets.profileNav,
    title: 'حسابي',
    body: 'أدر حسابك، طلباتك، مكافآتك، وإعداداتك الشخصية من هنا.',
    shellBranch: 4,
  ),
  OnboardingStep(
    id: 'more',
    targetKey: OnboardingTargets.more,
    title: 'المزيد',
    body:
        'الوصول إلى المفضلة، متاجر النقاط، المسابقات، وعجلة الحظ وميزات إضافية.',
    shellBranch: 0,
  ),
];

final marketplaceOnboardingSteps = <OnboardingStep>[
  OnboardingStep(
    id: 'mp-buy',
    targetKey: OnboardingTargets.marketplaceBuy,
    title: 'شراء',
    body: 'تصفّح إعلانات البيع والبدل — اشترِ منتجات من مستخدمين آخرين بسهولة.',
    shellBranch: 2,
  ),
  OnboardingStep(
    id: 'mp-sell',
    targetKey: OnboardingTargets.marketplaceSell,
    title: 'بيع',
    body: 'انشر إعلانك للبيع أو البدل — حوّل أغراضك إلى فرصة للبيع.',
    shellBranch: 2,
  ),
  OnboardingStep(
    id: 'mp-rent',
    targetKey: OnboardingTargets.marketplaceRent,
    title: 'إيجار',
    body:
        'اعرض أو استأجر عقارات ومركبات وأصول — كل ما تحتاجه للإيجار في مكان واحد.',
    shellBranch: 2,
  ),
  OnboardingStep(
    id: 'mp-wanted',
    targetKey: OnboardingTargets.marketplaceWanted,
    title: 'مطلوب',
    body: 'انشر طلباً لما تبحث عنه — دع البائعين يتواصلون معك مباشرة.',
    shellBranch: 2,
  ),
];

List<OnboardingStep> filteredMainSteps({required bool showMarketplace}) {
  if (showMarketplace) return mainOnboardingSteps;
  return mainOnboardingSteps.where((s) => s.id != 'marketplace').toList();
}
