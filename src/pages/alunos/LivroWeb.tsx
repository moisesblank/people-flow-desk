// ============================================
// 🌌🔥 LIVRO WEB — PÁGINA DA BIBLIOTECA NÍVEL NASA 🔥🌌
// ANO 2300 — BIBLIOTECA DIGITAL DO ALUNO BETA
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// 📍 MAPA DE URLs DEFINITIVO:
//   🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ + /comunidade
//   👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos/livro-web
//   👔 FUNCIONÁRIO: gestao.moisesmedeiros.com.br/gestao
//   👑 OWNER: TODAS (moisesblank@gmail.com = MASTER)
//
// ============================================

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  Search,
  Filter,
  Grid3X3,
  List,
  Star,
  Clock,
  Eye,
  ChevronRight,
  Loader2,
  AlertTriangle,
  BookMarked,
  GraduationCap,
  FlaskConical,
  Beaker,
  TestTube,
  Sparkles,
  FileText,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebBookReader } from "@/components/book/WebBookReader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ============================================
// TIPOS
// ============================================
interface BookProgress {
  currentPage: number;
  progressPercent: number;
  isCompleted: boolean;
  lastReadAt?: string;
}

interface Book {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  category: string;
  totalPages: number;
  coverUrl?: string;
  ratingAverage: number;
  ratingCount: number;
  viewCount: number;
  createdAt: string;
  status: string;
  progress?: BookProgress;
}

interface CategoryInfo {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

// ============================================
// CATEGORIAS
// ============================================
const CATEGORIES: CategoryInfo[] = [
  {
    key: "quimica_geral",
    label: "Química Geral",
    icon: FlaskConical,
    color: "bg-blue-500",
    description: "Fundamentos e conceitos básicos",
  },
  {
    key: "quimica_organica",
    label: "Química Orgânica",
    icon: Beaker,
    color: "bg-green-500",
    description: "Compostos de carbono e reações",
  },
  {
    key: "fisico_quimica",
    label: "Físico-Química",
    icon: TestTube,
    color: "bg-purple-500",
    description: "Termodinâmica e cinética",
  },
  {
    key: "revisao_ciclica",
    label: "Revisão Cíclica",
    icon: Sparkles,
    color: "bg-amber-500",
    description: "Revisões periódicas",
  },
  {
    key: "previsao_final",
    label: "Previsão Final",
    icon: GraduationCap,
    color: "bg-red-500",
    description: "Preparação para provas",
  },
  {
    key: "exercicios",
    label: "Exercícios",
    icon: FileText,
    color: "bg-cyan-500",
    description: "Listas de exercícios",
  },
  {
    key: "mapas_mentais",
    label: "Mapas Mentais",
    icon: Brain,
    color: "bg-pink-500",
    description: "Resumos visuais",
  },
];

// ============================================
// COMPONENTE: BookCard
// ============================================
const BookCard = ({
  book,
  onOpen,
  viewMode,
}: {
  book: Book;
  onOpen: (id: string) => void;
  viewMode: "grid" | "list";
}) => {
  const categoryInfo = CATEGORIES.find((c) => c.key === book.category);
  const CategoryIcon = categoryInfo?.icon || BookOpen;

  if (viewMode === "list") {
    return (
      <Card
        className="flex flex-row overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
        onClick={() => onOpen(book.id)}
      >
        {/* Cover */}
        <div className="w-24 h-32 shrink-0 bg-muted relative">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CategoryIcon className={cn("w-8 h-8", categoryInfo?.color.replace("bg-", "text-"))} />
            </div>
          )}
          {book.progress?.isCompleted && (
            <Badge className="absolute top-1 left-1 bg-green-500 text-[10px]">
              Concluído
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
              {book.title}
            </h3>
            <p className="text-xs text-muted-foreground">{book.author}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px]">
                {categoryInfo?.label || book.category}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {book.totalPages} páginas
              </span>
            </div>
          </div>

          {/* Progress */}
          {book.progress && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Progresso</span>
                <span>{book.progress.progressPercent.toFixed(0)}%</span>
              </div>
              <Progress value={book.progress.progressPercent} className="h-1" />
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="flex items-center pr-3">
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={() => onOpen(book.id)}
    >
      {/* Cover */}
      <div className="aspect-[3/4] bg-muted relative">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
            <CategoryIcon className={cn("w-16 h-16 opacity-50", categoryInfo?.color.replace("bg-", "text-"))} />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 right-2 flex justify-between">
          {book.progress?.isCompleted && (
            <Badge className="bg-green-500">Concluído</Badge>
          )}
          {book.ratingAverage > 0 && (
            <Badge variant="secondary" className="ml-auto flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {book.ratingAverage.toFixed(1)}
            </Badge>
          )}
        </div>

        {/* Progress overlay */}
        {book.progress && book.progress.progressPercent > 0 && !book.progress.isCompleted && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div
              className="h-full bg-primary"
              style={{ width: `${book.progress.progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
          {book.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">{book.author}</p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-[10px]">
            {categoryInfo?.label || book.category}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0 flex justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <BookOpen className="w-3 h-3" />
          {book.totalPages} pág
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {book.viewCount}
        </span>
      </CardFooter>
    </Card>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function LivroWeb() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useAuth();

  // Estados
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [totalBooks, setTotalBooks] = useState(0);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Leitor
  const [selectedBookId, setSelectedBookId] = useState<string | null>(
    searchParams.get("book")
  );

  // ============================================
  // BUSCAR LIVROS
  // ============================================
  const fetchBooks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc(
        "fn_list_books_for_category",
        {
          p_category: selectedCategory === "all" ? null : selectedCategory,
          p_search: searchQuery || null,
          p_limit: 50,
          p_offset: 0,
        }
      );

      if (rpcError) throw rpcError;

      if (data?.success) {
        setBooks(data.books || []);
        setTotalBooks(data.total || 0);
      } else {
        throw new Error(data?.error || "Erro ao carregar livros");
      }
    } catch (err) {
      console.error("[LivroWeb] Erro ao carregar:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  // ============================================
  // EFEITOS
  // ============================================
  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleOpenBook = useCallback(
    (bookId: string) => {
      setSelectedBookId(bookId);
      setSearchParams({ book: bookId });
    },
    [setSearchParams]
  );

  const handleCloseBook = useCallback(() => {
    setSelectedBookId(null);
    setSearchParams({});
  }, [setSearchParams]);

  // ============================================
  // LIVROS FILTRADOS
  // ============================================
  const filteredBooks = useMemo(() => {
    let result = books;

    // Filtro de busca local (adicional ao do backend)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query)
      );
    }

    return result;
  }, [books, searchQuery]);

  // Livros em progresso
  const inProgressBooks = useMemo(
    () =>
      filteredBooks.filter(
        (b) => b.progress && b.progress.progressPercent > 0 && !b.progress.isCompleted
      ),
    [filteredBooks]
  );

  // Livros concluídos
  const completedBooks = useMemo(
    () => filteredBooks.filter((b) => b.progress?.isCompleted),
    [filteredBooks]
  );

  // ============================================
  // RENDER - LEITOR
  // ============================================
  if (selectedBookId) {
    return <WebBookReader bookId={selectedBookId} onClose={handleCloseBook} />;
  }

  // ============================================
  // RENDER - BIBLIOTECA
  // ============================================
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Livro Web</h1>
                <p className="text-sm text-muted-foreground">
                  Sua biblioteca digital de química
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Busca */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar livros..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Categoria */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.key} value={cat.key}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View mode */}
              <div className="hidden sm:flex items-center border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-r-none"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-l-none"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando biblioteca...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertTriangle className="w-10 h-10 text-destructive mb-4" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchBooks}>Tentar novamente</Button>
          </div>
        )}

        {/* Books */}
        {!isLoading && !error && (
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Todos ({filteredBooks.length})
              </TabsTrigger>
              {inProgressBooks.length > 0 && (
                <TabsTrigger value="reading" className="gap-2">
                  <Clock className="w-4 h-4" />
                  Lendo ({inProgressBooks.length})
                </TabsTrigger>
              )}
              {completedBooks.length > 0 && (
                <TabsTrigger value="completed" className="gap-2">
                  <BookMarked className="w-4 h-4" />
                  Concluídos ({completedBooks.length})
                </TabsTrigger>
              )}
            </TabsList>

            {/* Todos os livros */}
            <TabsContent value="all">
              {filteredBooks.length === 0 ? (
                <div className="text-center py-20">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum livro encontrado</p>
                </div>
              ) : (
                <div
                  className={cn(
                    viewMode === "grid"
                      ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                      : "flex flex-col gap-3"
                  )}
                >
                  {filteredBooks.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onOpen={handleOpenBook}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Em leitura */}
            <TabsContent value="reading">
              <div
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                    : "flex flex-col gap-3"
                )}
              >
                {inProgressBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onOpen={handleOpenBook}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </TabsContent>

            {/* Concluídos */}
            <TabsContent value="completed">
              <div
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                    : "flex flex-col gap-3"
                )}
              >
                {completedBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onOpen={handleOpenBook}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Categories Section */}
        {!isLoading && !error && selectedCategory === "all" && (
          <section className="mt-12">
            <h2 className="text-lg font-semibold mb-4">Categorias</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {CATEGORIES.map((cat) => (
                <Card
                  key={cat.key}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedCategory(cat.key)}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div
                      className={cn(
                        "p-3 rounded-lg mb-2",
                        cat.color.replace("bg-", "bg-") + "/10"
                      )}
                    >
                      <cat.icon
                        className={cn("w-6 h-6", cat.color.replace("bg-", "text-"))}
                      />
                    </div>
                    <h3 className="font-medium text-sm">{cat.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {cat.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
