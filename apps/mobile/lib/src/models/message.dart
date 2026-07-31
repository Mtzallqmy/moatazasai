class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.role,
    required this.content,
    this.model,
  });
  final String id;
  final String role;
  final String content;
  final String? model;

  bool get isUser => role == 'user';

  factory ChatMessage.fromMap(Map<String, dynamic> m) => ChatMessage(
        id: m['id'] as String? ?? '',
        role: m['role'] as String? ?? 'user',
        content: m['content'] as String? ?? '',
        model: m['model'] as String?,
      );
}
