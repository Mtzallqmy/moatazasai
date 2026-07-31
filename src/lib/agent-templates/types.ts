/**
 * عقد قالب الوكيل الجاهز — لا يحتوي كود منسوخ من منتجات أخرى.
 * القوالب أنماط عامة فقط: تخطيط/تنفيذ/تحقق، بناء تطبيقات، بحث مصادر، إلخ.
 */
export interface AgentTemplate {
  /** معرف فريد ثابت. لا يتغير بعد النشر. */
  readonly id: string;
  /** اسم العرض عربي. */
  readonly name: string;
  /** وصف قصير للمستخدم. */
  readonly description: string;
  /** التصنيف للمجموعة في الواجهة. */
  readonly category: AgentTemplateCategory;
  /** أيقونة Marterial Icons اسم. */
  readonly icon: string;
  /** System prompt يُحقن في الوكيل عند الإنشاء. بالعربية. */
  readonly systemPrompt: string;
  /** درجة الحرارة المقترحة 0..1. */
  readonly defaultTemperature: number;
  /** الحد الأقصى للـ tokens المقترح للمزود. */
  readonly defaultMaxTokens?: number;
  /** مهارات موصى بها (نص حر للمستخدم). */
  readonly suggestedSkills?: string[];
  /** علامات للميزات المتوافقة (مثل أدوات، ذاكرة، RAG). */
  readonly supports?: { tools?: boolean; memory?: boolean; rag?: boolean; vision?: boolean; streaming?: boolean };
}

export type AgentTemplateCategory =
  | "planning"
  | "app-building"
  | "research"
  | "software-engineering"
  | "github"
  | "data"
  | "documents"
  | "operations";

export const CATEGORIES: Record<AgentTemplateCategory, string> = {
  planning: "تخطيط وتنفيذ",
  "app-building": "بناء التطبيقات",
  research: "البحث المعتمد على المصادر",
  "software-engineering": "هندسة البرمجيات",
  github: "مراجعة GitHub",
  data: "تحليل البيانات",
  documents: "تحليل المستندات",
  operations: "تنسيق العمليات",
};
