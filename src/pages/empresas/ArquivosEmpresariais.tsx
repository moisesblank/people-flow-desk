// ============================================
// PÁGINA DE ARQUIVOS EMPRESARIAIS
// Sistema Universal de Anexos - 2GB, qualquer formato
// Organizado por data, com IA ler
// ============================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FolderOpen, Search, Grid3X3, List, Trash2, 
  Download, Eye, Brain, FileText, Image, 
  Video, Music, Archive, FileIcon, MoreVertical, RefreshCw,
  Loader2, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

import { FileUpload } from '@/components/FileUpload';
import { buscarArquivos, deleteFile, toggleIaLer, processarArquivoComIA, formatFileSize, getFileCategory } from '@/lib/fileUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

function FileTypeIcon({ tipo, className }: { tipo: string; className?: string }) {
  const category = getFileCategory(tipo);
  const iconClass = cn('w-5 h-5', className);
  switch (category) {
    case 'image': return <Image className={cn(iconClass, 'text-pink-500')} />;
    case 'video': return <Video className={cn(iconClass, 'text-purple-500')} />;
    case 'audio': return <Music className={cn(iconClass, 'text-blue-500')} />;
    case 'document': return <FileText className={cn(iconClass, 'text-green-500')} />;
    case 'archive': return <Archive className={cn(iconClass, 'text-yellow-500')} />;
    default: return <FileIcon className={cn(iconClass, 'text-muted-foreground')} />;
  }
}

export default function ArquivosEmpresariais() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('todos');
  const [ano, setAno] = useState<number | undefined>();
  const [mes, setMes] = useState<number | undefined>();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [processingIA, setProcessingIA] = useState<string | null>(null);

  // Empresas (CNPJ) - filtro obrigatório
  const companies = [
    { id: '53.829.761/0001-17', name: 'MMM CURSO DE QUÍMICA LTDA' },
    { id: '44.979.308/0001-04', name: 'CURSO QUÍMICA MOISÉS MEDEIROS' },
  ];
  const [empresaId, setEmpresaId] = useState<string>(companies[0].id);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['arquivos-empresariais', empresaId, busca, tipo, ano, mes],
    queryFn: () => buscarArquivos({
      busca: busca || undefined,
      pasta: 'empresas',
      empresaId,
      tipo: tipo !== 'todos' ? tipo : undefined,
      ano,
      mes,
      limite: 100,
    }),
    refetchOnWindowFocus: false,
  });

  const arquivos = data?.arquivos || [];
  const total = data?.total || 0;

  const deleteMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      toast.success('Arquivo excluído!');
      queryClient.invalidateQueries({ queryKey: ['arquivos-empresariais'] });
      setDeleteConfirm(null);
    },
    onError: (e: any) => toast.error(e.message)
  });

  const toggleIAMutation = useMutation({
    mutationFn: ({ id, iaLer }: { id: string; iaLer: boolean }) => toggleIaLer(id, iaLer),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['arquivos-empresariais'] })
  });

  const handleProcessarIA = async (id: string) => {
    setProcessingIA(id);
    try {
      await processarArquivoComIA(id);
      toast.success('Processado pela IA!');
      queryClient.invalidateQueries({ queryKey: ['arquivos-empresariais'] });
    } catch (e: any) { toast.error(e.message); }
    finally { setProcessingIA(null); }
  };

  const handleDownload = (a: any) => { window.open(a.url, '_blank'); };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            Arquivos Empresariais
          </h1>
          <p className="text-muted-foreground">Upload até 2GB • Qualquer formato • Organizado por data</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="min-w-[280px]">
              <Select value={empresaId} onValueChange={setEmpresaId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} • {c.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Badge variant="outline" className="text-pink-500">{total} arquivo(s)</Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upload">📤 Upload</TabsTrigger>
          <TabsTrigger value="arquivos">📁 Arquivos ({total})</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FolderOpen className="w-5 h-5 text-pink-500" />Upload de Arquivos</CardTitle></CardHeader>
            <CardContent>
              <FileUpload
                bucket="arquivos"
                folder={`empresas/${empresaId.replace(/\D/g, '')}`}
                categoria="empresa"
                empresaId={empresaId}
                showIaOption
                showDescription
                showTags
                onUploadComplete={() => queryClient.invalidateQueries({ queryKey: ['arquivos-empresariais'] })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="arquivos" className="space-y-4">
          <Card><CardContent className="pt-6 flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]"><Input placeholder="Buscar..." value={busca} onChange={e=>setBusca(e.target.value)} className="pl-3" /></div>
            <Select value={tipo} onValueChange={setTipo}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="image">Imagens</SelectItem><SelectItem value="video">Vídeos</SelectItem><SelectItem value="application/pdf">PDFs</SelectItem></SelectContent></Select>
            <Select value={ano?.toString()||''} onValueChange={v=>setAno(v?parseInt(v):undefined)}><SelectTrigger className="w-24"><SelectValue placeholder="Ano"/></SelectTrigger><SelectContent><SelectItem value="">Todos</SelectItem>{years.map(y=><SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
            <Select value={mes?.toString()||''} onValueChange={v=>setMes(v?parseInt(v):undefined)}><SelectTrigger className="w-24"><SelectValue placeholder="Mês"/></SelectTrigger><SelectContent><SelectItem value="">Todos</SelectItem>{months.map((m,i)=><SelectItem key={i} value={(i+1).toString()}>{m}</SelectItem>)}</SelectContent></Select>
            <div className="flex gap-1"><Button variant={viewMode==='grid'?'default':'outline'} size="icon" onClick={()=>setViewMode('grid')}><Grid3X3 className="w-4 h-4"/></Button><Button variant={viewMode==='list'?'default':'outline'} size="icon" onClick={()=>setViewMode('list')}><List className="w-4 h-4"/></Button></div>
            <Button variant="outline" size="icon" onClick={()=>refetch()}><RefreshCw className="w-4 h-4"/></Button>
            <Badge variant="outline" className="text-muted-foreground">{companies.find(c=>c.id===empresaId)?.id}</Badge>
          </CardContent></Card>

          {isLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pink-500"/></div>
          : arquivos.length===0 ? <Card><CardContent className="py-12 text-center"><FolderOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4"/><p>Nenhum arquivo</p></CardContent></Card>
          : viewMode==='grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {arquivos.map((a:any)=>(
                <Card key={a.id} className="group hover:border-pink-500/50 cursor-pointer" onClick={()=>{setSelectedFile(a);setPreviewOpen(true);}}>
                  <CardContent className="p-4">
                    <div className="aspect-square rounded-lg bg-muted flex items-center justify-center mb-2 overflow-hidden">
                      {a.tipo.startsWith('image/')?<img src={a.url} className="w-full h-full object-cover"/>:<FileTypeIcon tipo={a.tipo} className="w-10 h-10"/>}
                    </div>
                    <p className="text-sm font-medium truncate">{a.nome}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(a.tamanho)}</p>
                    {a.ia_ler && <Brain className="w-4 h-4 text-pink-500 mt-1"/>}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><div className="divide-y">{arquivos.map((a:any)=>(
              <div key={a.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer" onClick={()=>{setSelectedFile(a);setPreviewOpen(true);}}>
                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">{a.tipo.startsWith('image/')?<img src={a.url} className="w-full h-full object-cover rounded"/>:<FileTypeIcon tipo={a.tipo}/>}</div>
                <div className="flex-1 min-w-0"><p className="font-medium truncate">{a.nome}</p><p className="text-xs text-muted-foreground">{formatFileSize(a.tamanho)} • {new Date(a.created_at).toLocaleDateString('pt-BR')}</p></div>
                {a.ia_ler&&<Brain className="w-4 h-4 text-pink-500"/>}
                <DropdownMenu><DropdownMenuTrigger asChild onClick={e=>e.stopPropagation()}><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4"/></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={()=>handleDownload(a)}><Download className="w-4 h-4 mr-2"/>Download</DropdownMenuItem>
                    <DropdownMenuItem onClick={()=>toggleIAMutation.mutate({id:a.id,iaLer:!a.ia_ler})}><Brain className="w-4 h-4 mr-2"/>{a.ia_ler?'Desativar':'Ativar'} IA</DropdownMenuItem>
                    {a.ia_ler&&!a.ia_processado&&<DropdownMenuItem onClick={()=>handleProcessarIA(a.id)} disabled={processingIA===a.id}>{processingIA===a.id?<Loader2 className="w-4 h-4 mr-2 animate-spin"/>:<Brain className="w-4 h-4 mr-2 text-pink-500"/>}Processar IA</DropdownMenuItem>}
                    <DropdownMenuSeparator/>
                    <DropdownMenuItem className="text-destructive" onClick={()=>setDeleteConfirm(a.id)}><Trash2 className="w-4 h-4 mr-2"/>Excluir</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}</div></Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>{selectedFile?.nome}</DialogTitle><DialogDescription>{formatFileSize(selectedFile?.tamanho||0)}</DialogDescription></DialogHeader>
          <div className="rounded-lg bg-muted overflow-hidden max-h-[60vh] flex items-center justify-center">
            {selectedFile?.tipo?.startsWith('image/')?<img src={selectedFile.url} className="max-w-full max-h-[60vh] object-contain"/>
            :selectedFile?.tipo?.startsWith('video/')?<video src={selectedFile.url} controls className="max-w-full"/>
            :selectedFile?.tipo?.startsWith('audio/')?<audio src={selectedFile.url} controls/>
            :selectedFile?.tipo==='application/pdf'?<iframe src={selectedFile.url} className="w-full h-[60vh]"/>
            :<div className="p-12 text-center"><FileTypeIcon tipo={selectedFile?.tipo||''} className="w-20 h-20 mx-auto"/><p className="mt-4 text-muted-foreground">Preview não disponível</p></div>}
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2"><Brain className={selectedFile?.ia_ler?'text-pink-500':'text-muted-foreground'}/><Label>IA deve ler?</Label></div>
            <Switch checked={selectedFile?.ia_ler||false} onCheckedChange={c=>{toggleIAMutation.mutate({id:selectedFile?.id,iaLer:c});setSelectedFile((p:any)=>p?{...p,ia_ler:c}:p);}}/>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setPreviewOpen(false)}>Fechar</Button><Button onClick={()=>handleDownload(selectedFile)}><Download className="w-4 h-4 mr-2"/>Download</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={()=>setDeleteConfirm(null)}>
        <DialogContent><DialogHeader><DialogTitle className="text-destructive"><Trash2 className="w-5 h-5 inline mr-2"/>Confirmar Exclusão</DialogTitle></DialogHeader>
          <p>Tem certeza? Esta ação não pode ser desfeita.</p>
          <DialogFooter><Button variant="outline" onClick={()=>setDeleteConfirm(null)}>Cancelar</Button><Button variant="destructive" onClick={()=>deleteConfirm&&deleteMutation.mutate(deleteConfirm)} disabled={deleteMutation.isPending}>{deleteMutation.isPending?<Loader2 className="w-4 h-4 animate-spin"/>:<Trash2 className="w-4 h-4 mr-2"/>}Excluir</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
