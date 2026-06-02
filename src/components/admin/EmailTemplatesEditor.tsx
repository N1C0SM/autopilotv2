import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, Save, RotateCcw, FileCode } from "lucide-react";
import { toast } from "sonner";

const TEMPLATES = [
  { name: "scan-diagnosis", label: "Scan Diagnosis (resultado del AI scan)", placeholders: ["name", "headline", "summary", "monthsWithPlan", "monthsWithoutPlan", "cardImageUrl", "photoUrl", "reportUrl"] },
  { name: "mini-plan", label: "Mini Plan (plan gratis post-onboarding)", placeholders: ["name", "planUrl"] },
  { name: "payment-reminder", label: "Payment Reminder (recordatorio de pago)", placeholders: ["name", "amount", "paymentUrl"] },
];

export default function EmailTemplatesEditor() {
  const [selected, setSelected] = useState(TEMPLATES[0].name);
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [hasOverride, setHasOverride] = useState(false);

  const current = TEMPLATES.find(t => t.name === selected)!;

  const load = async () => {
    setLoading(true);
    setPreviewHtml(null);
    try {
      // Try fetch override
      const { data: override } = await supabase
        .from("email_template_overrides" as any)
        .select("subject, html, enabled")
        .eq("template_name", selected)
        .maybeSingle();

      if (override) {
        setSubject((override as any).subject);
        setHtml((override as any).html);
        setEnabled((override as any).enabled);
        setHasOverride(true);
      } else {
        // Load default from edge function
        const { data, error } = await supabase.functions.invoke("render-email-template", {
          body: { templateName: selected },
        });
        if (error) throw error;
        setSubject(data.subject ?? "");
        setHtml(data.html ?? "");
        setEnabled(true);
        setHasOverride(false);
      }
    } catch (e: any) {
      toast.error("No se pudo cargar la plantilla: " + (e?.message ?? "error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [selected]);

  const save = async () => {
    if (!subject.trim() || !html.trim()) {
      toast.error("Asunto y HTML son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("email_template_overrides" as any).upsert({
        template_name: selected,
        subject: subject.trim(),
        html,
        enabled,
      }, { onConflict: "template_name" });
      if (error) throw error;
      toast.success("Plantilla guardada");
      setHasOverride(true);
    } catch (e: any) {
      toast.error("No se pudo guardar: " + (e?.message ?? "error"));
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = async () => {
    if (!confirm("¿Restaurar la plantilla por defecto? Se borrará tu personalización.")) return;
    try {
      const { error } = await supabase.from("email_template_overrides" as any)
        .delete().eq("template_name", selected);
      if (error) throw error;
      toast.success("Restaurada");
      load();
    } catch (e: any) {
      toast.error("Error: " + (e?.message ?? ""));
    }
  };

  const preview = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("render-email-template", {
        body: { templateName: selected, customHtml: html },
      });
      if (error) throw error;
      setPreviewHtml(data.html);
    } catch (e: any) {
      toast.error("No se pudo previsualizar: " + (e?.message ?? ""));
    }
  };

  const loadDefault = async () => {
    if (!confirm("¿Cargar el HTML por defecto en el editor? Se sobrescribirá lo que tengas escrito (no se guardará hasta que pulses Guardar).")) return;
    try {
      const { data, error } = await supabase.functions.invoke("render-email-template", {
        body: { templateName: selected },
      });
      if (error) throw error;
      setHtml(data.html ?? "");
      setSubject(data.subject ?? "");
      toast.success("HTML por defecto cargado");
    } catch (e: any) {
      toast.error("Error: " + (e?.message ?? ""));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold mb-1">Editor de Emails</h1>
        <p className="text-sm text-muted-foreground">
          Personaliza el asunto y el HTML de cada email transaccional. Si está desactivado, se usa el diseño por defecto.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Plantilla</Label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm"
          >
            {TEMPLATES.map(t => <option key={t.name} value={t.name}>{t.label}</option>)}
          </select>
          <p className="text-[11px] text-muted-foreground mt-2">
            Variables disponibles: {current.placeholders.map(p => <code key={p} className="mx-0.5 bg-muted px-1.5 py-0.5 rounded">{`{{${p}}}`}</code>)}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 p-3 bg-muted/40 rounded-lg">
              <div>
                <div className="text-sm font-medium">Personalización activa</div>
                <div className="text-xs text-muted-foreground">{hasOverride ? "Estás usando una versión personalizada" : "Sin personalizar (se usa el diseño por defecto)"}</div>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Asunto</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" placeholder="Asunto del email" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">HTML</Label>
                <Button variant="ghost" size="sm" onClick={loadDefault} className="h-7 text-xs gap-1">
                  <FileCode className="w-3 h-3" /> Cargar HTML por defecto
                </Button>
              </div>
              <Textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                className="font-mono text-xs min-h-[400px]"
                placeholder="<html>...</html>"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button onClick={save} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar
              </Button>
              <Button variant="outline" onClick={preview} className="gap-2">
                <Eye className="w-4 h-4" /> Previsualizar
              </Button>
              {hasOverride && (
                <Button variant="outline" onClick={resetToDefault} className="gap-2 text-destructive">
                  <RotateCcw className="w-4 h-4" /> Restaurar por defecto
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {previewHtml && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <div className="text-sm font-semibold">Vista previa</div>
            <Button variant="ghost" size="sm" onClick={() => setPreviewHtml(null)}>Cerrar</Button>
          </div>
          <iframe srcDoc={previewHtml} className="w-full bg-white" style={{ height: 700, border: 0 }} title="Email preview" />
        </div>
      )}
    </div>
  );
}