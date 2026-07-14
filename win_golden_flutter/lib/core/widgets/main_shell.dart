import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'app_header.dart';
import 'bottom_nav_bar.dart';

class MainShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const MainShell({
    super.key,
    required this.navigationShell,
  });

  @override
  Widget build(BuildContext context) {
    // In a real app, we would check auth state here.
    // For now, we assume authenticated to show the UI structure.
    const bool isAuth = true; 

    return Scaffold(
      appBar: const AppHeader(isAuth: isAuth),
      body: navigationShell,
      bottomNavigationBar: isAuth 
          ? BottomNavBar(navigationShell: navigationShell)
          : null,
    );
  }
}
