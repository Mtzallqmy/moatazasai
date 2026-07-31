import 'package:flutter_test/flutter_test.dart';
import 'package:moataz_ai_mobile/src/models/agent.dart';

void main() {
  group('Agent model', () {
    test('fromMap parses required fields', () {
      final a = Agent.fromMap({'id': 'x', 'name': 'وكيل الاختبار'});
      expect(a.id, 'x');
      expect(a.name, 'وكيل الاختبار');
      expect(a.isPublished, false);
      expect(a.isReady, false);
    });

    test('fromMap respects published + ready runtime status', () {
      final a = Agent.fromMap({
        'id': 'x', 'name': 'n',
        'status': 'published', 'runtimeStatus': 'ready',
      });
      expect(a.isReady, true);
      expect(a.isPublished, true);
    });

    test('isReady is false when runtimeStatus is unavailable', () {
      final a = Agent.fromMap({
        'id': 'x', 'name': 'n',
        'status': 'published', 'runtimeStatus': 'unavailable',
      });
      expect(a.isReady, false);
    });
  });
}
