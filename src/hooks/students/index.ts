// ============================================
// 🎓 HOOKS DE ALUNOS — CENTRALIZADOS
// ============================================

export { useAlunosData } from '../useAlunosData';
export { useAlunosPaginados } from '../useAlunosPaginados';
export { useStudentDailyGoals } from '../useStudentDailyGoals';
export { 
  useDueFlashcards, 
  useAllFlashcards, 
  usePendingFlashcardsCount, 
  useRescheduleFlashcard,
  useCreateFlashcard,
  useDeleteFlashcard,
  useFlashcardStats
} from '../useFlashcards';
export { 
  usePracticeQuestions, 
  useQuestionAttempt, 
  usePracticeSession, 
  usePracticeHistory 
} from '../useQuestionPractice';
export { useSimuladoRanking } from '../useSimuladoRanking';
export { useWeeklyRanking } from '../useWeeklyRanking';
export { 
  useCourses, 
  useCourse, 
  useEnrollments, 
  useEnroll, 
  useLessonProgress, 
  useCourseProgress,
  useUpdateLessonProgress,
  useCreateCourse,
  useUpdateCourse,
  useCreateModule,
  useCreateLesson
} from '../useLMS';
export { useLessonNotes } from '../useLessonNotes';
export { useLessonAI } from '../useLessonAI';
