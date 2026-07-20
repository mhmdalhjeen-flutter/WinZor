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
    targetKey: OnboardingTargets.bottomNavHome,
    title: 'الرئيسية',
    body:
        'هنا تصفح أحدث العروض المميزة، واستفد من الخصومات، واكتشف أفضل الفرص للفوز.',
    shellBranch: 0,
  ),
  OnboardingStep(
    id: 'reels',
    targetKey: OnboardingTargets.reelViewer,
    title: 'عروض الريلز',
    body:
        'هنا تصفح العروض بطريقة الريلز (السحب للأعلى)، واطلبها وأنت في المنزل.',
    shellBranch: 0,
    scrollToTarget: true,
  ),
  OnboardingStep(
    id: 'filters',
    targetKey: OnboardingTargets.filters,
    title: 'الفلاتر',
    body: 'استعرض العروض حسب منطقتك أو نوع المنتج الذي تبحث عنه.',
    shellBranch: 0,
    scrollToTarget: true,
  ),
  OnboardingStep(
    id: 'header-icons',
    targetKey: OnboardingTargets.headerIcons,
    title: 'أيقونات الشريط العلوي',
    body:
        'تابع نقاطك، وتواصل مع المتاجر، واستكشف المزيد من الخدمات والمتاجر المعتمدة في المنصة.',
    shellBranch: 0,
  ),
  OnboardingStep(
    id: 'prize-draw',
    targetKey: OnboardingTargets.prizeDraw,
    title: 'السحب على الجوائز',
    body: 'عند وصولك للعدد المطلوب، يمكنك الانضمام إلى السحب على الجوائز.',
    shellBranch: 0,
    scrollToTarget: true,
  ),
  OnboardingStep(
    id: 'bottom-nav',
    targetKey: OnboardingTargets.bottomNav,
    title: 'التنقل السفلي',
    body: 'تنقل بسرعة بين المتاجر، والسوق العام، وملفك الشخصي (نقاطك).',
    shellBranch: 0,
  ),
];

final marketplaceOnboardingSteps = <OnboardingStep>[
  OnboardingStep(
    id: 'mp-main',
    targetKey: OnboardingTargets.marketplaceMain,
    title: 'ما هو السوق العام؟',
    body:
        'السوق العام هو مكان يمكنك من خلاله بيع وشراء وتأجير وتبادل المنتجات بسهولة بين مستخدمي المنصة، مع الوصول إلى عروض متنوعة في مكان واحد.',
    shellBranch: 2,
  ),
  OnboardingStep(
    id: 'mp-publish',
    targetKey: OnboardingTargets.marketplaceSell,
    title: 'النشر',
    body:
        'اعرض أغراضك للبيع أو البدل أو الإيجار، أو انشر طلبًا لما تبحث عنه، وتواصل مباشرة مع المهتمين.',
    shellBranch: 2,
  ),
  OnboardingStep(
    id: 'mp-tabs',
    targetKey: OnboardingTargets.marketplaceTabs,
    title: 'أقسام السوق',
    body:
        'اعثر على ما تحتاجه من خلال تصفح المعروضات، والمأجورات، والمطلوبات، مع سهولة الوصول إلى مختلف الإعلانات في مكان واحد.',
    shellBranch: 2,
  ),
];

List<OnboardingStep> filteredMainSteps({required bool showMarketplace}) {
  return mainOnboardingSteps;
}
