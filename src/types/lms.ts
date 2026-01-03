// ============================================
// TIPOS DO LMS (LEARNING MANAGEMENT SYSTEM)
// Centralizados por domínio
// ============================================

// Curso
export interface Course {
  id: string;
  name: string;
  slug: string;
  description?: string;
  thumbnail_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Área/Módulo do curso
export interface Area {
  id: string;
  course_id: string;
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
  position: number;
  is_active: boolean;
  parent_id?: string;
  thumbnail_url?: string; // Imagem do módulo (752x940 px) - OBRIGATÓRIA
  created_at: string;
  updated_at: string;
}

// Aula/Lição
export interface Lesson {
  id: string;
  area_id: string;
  title: string;
  slug?: string;
  description?: string;
  video_url?: string;
  video_provider?: 'panda' | 'youtube' | 'vimeo';
  duration_minutes?: number;
  position: number;
  is_active: boolean;
  is_free: boolean;
  created_at: string;
  updated_at: string;
}

// Progresso da aula
export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  progress_percent: number;
  completed: boolean;
  last_position_seconds?: number;
  started_at?: string;
  completed_at?: string;
  updated_at: string;
}

// Material complementar
export interface Material {
  id: string;
  lesson_id?: string;
  area_id?: string;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  is_downloadable: boolean;
  created_at: string;
}

// Flashcard
export interface Flashcard {
  id: string;
  user_id: string;
  lesson_id?: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  next_review?: string;
  review_count: number;
  ease_factor: number;
  interval_days: number;
  created_at: string;
  updated_at: string;
}

// Questão de quiz
export interface QuizQuestion {
  id: string;
  lesson_id?: string;
  area_id?: string;
  question: string;
  options: { id: string; text: string; image_url?: string }[];
  correct_answer: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
}

// Resposta de quiz
export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  answers: Record<string, number>;
  started_at: string;
  completed_at?: string;
}

// Certificado
export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  certificate_number: string;
  nome_aluno: string;
  nome_curso: string;
  carga_horaria?: number;
  issued_at: string;
  pdf_url?: string;
  validado: boolean;
}

// Anotação de aula
export interface LessonNote {
  id: string;
  user_id: string;
  lesson_id: string;
  content: string;
  timestamp_seconds?: number;
  color?: string;
  created_at: string;
  updated_at: string;
}

// Estatísticas do aluno
export interface StudentStats {
  totalLessonsCompleted: number;
  totalTimeMinutes: number;
  currentStreak: number;
  longestStreak: number;
  totalXp: number;
  level: number;
  rank: number;
  accuracy: number;
}

// Metas diárias
export interface DailyGoals {
  questionsTarget: number;
  questionsCompleted: number;
  lessonsTarget: number;
  lessonsCompleted: number;
  reviewsTarget: number;
  reviewsCompleted: number;
  timeTarget: number;
  timeCompleted: number;
  lastUpdated: string;
}

// Livro web
export interface WebBook {
  id: string;
  title: string;
  author?: string;
  description?: string;
  cover_url?: string;
  total_pages: number;
  is_active: boolean;
  requires_beta: boolean;
  created_at: string;
  updated_at: string;
}

// Página de livro
export interface BookPage {
  id: string;
  book_id: string;
  page_number: number;
  content?: string;
  image_url?: string;
  chapter_title?: string;
  created_at: string;
}

// Progresso de leitura
export interface BookProgress {
  id: string;
  user_id: string;
  book_id: string;
  current_page: number;
  total_time_seconds: number;
  last_read_at: string;
  completed: boolean;
}
