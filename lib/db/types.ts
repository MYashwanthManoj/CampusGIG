export type Role = "student" | "client" | "admin";
export interface Task {
  id: string;
  client_id: string;
  title: string;
  description: string;
  fixed_price: number;
  deadline: string;
  status: string;
  difficulty: string | null;
  ai_analysis: unknown;
  ai_source: string | null;
  created_at: string;
  task_skills?: { skills: { slug: string; name: string } | null }[];
}
export interface Application {
  id: string;
  task_id: string;
  student_id: string;
  cover_note: string;
  match_score: number;
  match_breakdown: Record<string, number>;
  match_explanation: string | null;
  status: string;
  created_at: string;
}
export interface Contract {
  id: string;
  task_id: string;
  client_id: string;
  student_id: string;
  agreed_amount: number;
  status: string;
  due_at: string;
  revision_count: number;
  revision_feedback: string | null;
  completed_at: string | null;
}
export interface Submission {
  id: string;
  contract_id: string;
  attempt_number: number;
  work_url: string;
  summary: string | null;
  submitted_at: string;
}
export interface Review {
  id: string;
  rating: number;
  comment: string;
}
export interface CareerProof {
  completedCount: number;
  onTimeRate: number;
  averageRating: number | null;
  earnedAmount: number;
  skills: { name: string; evidenceScore: number }[];
  recentWork: { id: string; title: string; completedAt: string }[];
}