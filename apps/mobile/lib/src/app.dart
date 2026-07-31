import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:moataz_ai_mobile/src/features/auth/auth_repository.dart';
import 'package:moataz_ai_mobile/src/features/auth/login_screen.dart';
import 'package:moataz_ai_mobile/src/features/dashboard/dashboard_screen.dart';
import 'package:moataz_ai_mobile/src/widgets/theme.dart';

class MoatazAiApp extends ConsumerWidget {
  const MoatazAiApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authStateProvider);
    final router = GoRouter(
      initialLocation: '/dashboard',
      redirect: (_, state) {
        final signedIn = auth.valueOrNull == true;
        final loggingIn = state.matchedLocation == '/login';
        if (!signedIn && !loggingIn) return '/login';
        if (signedIn && loggingIn) return '/dashboard';
        return null;
      },
      routes: [
        GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
        GoRoute(path: '/dashboard', builder: (_, _) => const DashboardScreen()),
      ],
    );

    // دعم الوضع الداكن عبر إعدادات النظام
    final platformBrightness = MediaQuery.platformBrightnessOf(context);
    final isDark = platformBrightness == Brightness.dark;

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'معتز AI',
      locale: const Locale('ar'),
      supportedLocales: const [Locale('ar'), Locale('en')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      theme: MoatazTheme.light(),
      darkTheme: MoatazTheme.dark(),
      themeMode: isDark ? ThemeMode.dark : ThemeMode.system,
      routerConfig: router,
    );
  }
}
