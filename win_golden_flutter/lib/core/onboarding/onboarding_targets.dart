import 'package:flutter/material.dart';

/// GlobalKeys for spotlight tour targets.
class OnboardingTargets {
  OnboardingTargets._();

  static final home = GlobalKey(debugLabel: 'onboarding_home');
  static final filters = GlobalKey(debugLabel: 'onboarding_filters');
  static final reelViewer = GlobalKey(debugLabel: 'onboarding_reel_viewer');
  static final headerIcons = GlobalKey(debugLabel: 'onboarding_header_icons');
  static final prizeDraw = GlobalKey(debugLabel: 'onboarding_prize_draw');
  static final bottomNav = GlobalKey(debugLabel: 'onboarding_bottom_nav');
  static final bottomNavHome = GlobalKey(debugLabel: 'onboarding_bottom_nav_home');

  static final marketplaceMain = GlobalKey(debugLabel: 'onboarding_mp_main');
  static final marketplaceSell = GlobalKey(debugLabel: 'onboarding_mp_sell');
  static final marketplaceTabs = GlobalKey(debugLabel: 'onboarding_mp_tabs');
}
