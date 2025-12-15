import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";

export function LogoUploader() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogo();
  }, []);

  const fetchLogo = async () => {
    try {
      const { data, error } = await supabase
        .from('branding_settings')
        .select('logo_url')
        .limit(1)
        .single();

      if (!error && data?.logo_url) {
        setLogoUrl(data.logo_url);
      }
    } catch (err) {
      console.error('Error fetching logo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 2MB");
      return;
    }

    setUploading(true);

    try {
      const fileName = `logo-${Date.now()}.${file.name.split('.').pop()}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const newLogoUrl = urlData.publicUrl;

      // Update branding settings
      const { error: updateError } = await supabase
        .from('branding_settings')
        .update({ logo_url: newLogoUrl })
        .eq('id', (await supabase.from('branding_settings').select('id').limit(1).single()).data?.id);

      if (updateError) throw updateError;

      setLogoUrl(newLogoUrl);
      toast.success("Logo atualizado com sucesso!");
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error("Erro ao fazer upload: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      const { error } = await supabase
        .from('branding_settings')
        .update({ logo_url: null })
        .eq('id', (await supabase.from('branding_settings').select('id').limit(1).single()).data?.id);

      if (error) throw error;

      setLogoUrl(null);
      toast.success("Logo removido!");
    } catch (error: any) {
      toast.error("Erro ao remover logo: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-secondary/30 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-secondary/30">
      <div className="flex items-center gap-3 mb-4">
        <ImageIcon className="h-5 w-5 text-muted-foreground" />
        <div>
          <Label>Logo da Empresa</Label>
          <p className="text-xs text-muted-foreground">Faça upload do seu logotipo (PNG, JPG - max 2MB)</p>
        </div>
      </div>

      {logoUrl ? (
        <div className="space-y-3">
          <div className="flex items-center justify-center p-4 bg-background rounded-lg border border-border/50">
            <img 
              src={logoUrl} 
              alt="Logo da empresa" 
              className="max-h-20 object-contain"
            />
          </div>
          <div className="flex gap-2">
            <label className="flex-1">
              <Button variant="outline" className="w-full cursor-pointer" disabled={uploading} asChild>
                <span>
                  {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  Trocar Logo
                </span>
              </Button>
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
            <Button variant="outline" onClick={handleRemove}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <label>
          <Button variant="outline" className="w-full cursor-pointer" disabled={uploading} asChild>
            <span>
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Fazer Upload
            </span>
          </Button>
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      )}
    </div>
  );
}
