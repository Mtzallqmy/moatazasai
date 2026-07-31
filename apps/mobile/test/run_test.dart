import 'package:flutter_test/flutter_test.dart';
import 'package:moataz_ai_mobile/src/models/run.dart';

void main() {
  group('Run model', () {
    test('parses "waiting_approval" status to RunStatus.waitingApproval', () {
      final r = Run.fromMap({'id': 'a', 'status': 'waiting_approval'});
      expect(r.status, RunStatus.waitingApproval);
    });
    test('defaults to queued when status is null', () {
      final r = Run.fromMap({'id': 'a'});
      expect(r.status, RunStatus.queued);
    });
  });
}
