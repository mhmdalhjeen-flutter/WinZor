import 'package:flutter/material.dart';

/// GlobalKeys for spotlight tour targets.
class OnboardingTargets {
  OnboardingTargets._();

  static final home = GlobalKey(debugLabel: 'onboarding_home');
  static final search = GlobalKey(debugLabel: 'onboarding_search');
  static final points = GlobalKey(debugLabel: 'onboarding_points');
  static final marketplaceNav = GlobalKey(debugLabel: 'onboarding_marketplace_nav');
  static final reelViewer = GlobalKey(debugLabel: 'onboarding_reel_viewer');
  static final cart = GlobalKey(debugLabel: 'onboarding_cart');
  static final chat = GlobalKey(debugLabel: 'onboarding_chat');
  static final notifications = GlobalKey(debugLabel: 'onboarding_notifications');
  static final profileNav = GlobalKey(debugLabel: 'onboarding_profile_nav');
  static final more = GlobalKey(debugLabel: 'onboarding_more');

  static final marketplaceBuy = GlobalKey(debugLabel: 'onboarding_mp_buy');
  static final marketplaceSell = GlobalKey(debugLabel: 'onboarding_mp_sell');
  static final marketplaceRent = GlobalKey(debugLabel: 'onboarding_mp_rent');
  static final marketplaceWanted = GlobalKey(debugLabel: 'onboarding_mp_wanted');
}
