import 'package:flutter/material.dart';
import 'package:moataz_ai_mobile/src/core/api_client.dart';

class ErrorState extends StatelessWidget {
  const ErrorState({required this.error, required this.retry, super.key});
  final Object error;
  final VoidCallback retry;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.cloud_off_rounded, size: 42, color: Color(0xFFB85F5F)),
              const SizedBox(height: 14),
              Text(ApiClient.userMessage(error), textAlign: TextAlign.center),
              const SizedBox(height: 16),
              FilledButton.icon(onPressed: retry, icon: const Icon(Icons.refresh), label: const Text('إعادة المحاولة')),
            ],
          ),
        ),
      );
}
