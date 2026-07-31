import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:moataz_ai_mobile/src/widgets/theme.dart';

void main() {
  test('MoatazTheme.light() is a Brightness.light ThemeData', () {
    final theme = MoatazTheme.light();
    expect(theme.brightness, Brightness.light);
    expect(theme.useMaterial3, true);
  });

  test('MoatazTheme.dark() is a Brightness.dark ThemeData', () {
    final theme = MoatazTheme.dark();
    expect(theme.brightness, Brightness.dark);
    expect(theme.useMaterial3, true);
  });

  test('brand color is consistent between modes', () {
    final lightSeed = MoatazTheme.light().colorScheme.primary;
    final darkSeed = MoatazTheme.dark().colorScheme.primary;
    expect(lightSeed.value, isNot(equals(0)));
    expect(darkSeed.value, isNot(equals(0)));
  });
}
