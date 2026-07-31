enum RunStatus { queued, running, completed, failed, cancelled, waitingApproval }

class Run {
  const Run({
    required this.id,
    required this.status,
    this.model,
    this.createdAt,
  });
  final String id;
  final RunStatus status;
  final String? model;
  final DateTime? createdAt;

  factory Run.fromMap(Map<String, dynamic> m) {
    final raw = m['status'] as String? ?? 'queued';
    final status = switch (raw) {
      'running' => RunStatus.running,
      'completed' => RunStatus.completed,
      'failed' => RunStatus.failed,
      'cancelled' => RunStatus.cancelled,
      'waiting_approval' => RunStatus.waitingApproval,
      _ => RunStatus.queued,
    };
    return Run(
      id: m['id'] as String,
      status: status,
      model: m['model'] as String?,
      createdAt: m['createdAt'] != null ? DateTime.tryParse(m['createdAt'].toString()) : null,
    );
  }
}
