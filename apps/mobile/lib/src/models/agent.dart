import 'package:flutter/material.dart';

/// نموذج الوكيل — بديل type-safe لـ Map<String, dynamic> في الأصل.
class Agent {
  const Agent({
    required this.id,
    required this.name,
    this.description,
    this.status = 'draft',
    this.runtimeStatus = 'ready',
  });
  final String id;
  final String name;
  final String? description;
  final String status;
  final String runtimeStatus;

  bool get isPublished => status == 'published';
  bool get isReady => isPublished && runtimeStatus == 'ready';

  factory Agent.fromMap(Map<String, dynamic> map) => Agent(
        id: map['id'] as String,
        name: map['name'] as String,
        description: map['description'] as String?,
        status: map['status'] as String? ?? 'draft',
        runtimeStatus: map['runtimeStatus'] as String? ?? 'ready',
      );
}
