class Conversation {
  const Conversation({
    required this.id,
    required this.agentId,
    this.title,
    this.updatedAt,
    this.archivedAt,
  });
  final String id;
  final String agentId;
  final String? title;
  final DateTime? updatedAt;
  final DateTime? archivedAt;

  bool get isArchived => archivedAt != null;

  factory Conversation.fromMap(Map<String, dynamic> m) => Conversation(
        id: m['id'] as String,
        agentId: m['agentId'] as String,
        title: m['title'] as String?,
        updatedAt: m['updatedAt'] != null ? DateTime.tryParse(m['updatedAt'].toString()) : null,
        archivedAt: m['archivedAt'] != null ? DateTime.tryParse(m['archivedAt'].toString()) : null,
      );
}
