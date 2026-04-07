import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings, Loader2, Save, Shield, CreditCard, Tag } from "lucide-react";

interface SettingsData {
  id: string;
  payment_mode: string;
  payment_link_test: string;
  payment_link_live: string;
  webhook_secret_test: string;
  webhook_secret_live: string;
  price_id_test: string;
  price_id_live: string;
  referral_coupon_id: string;
}

const PaymentModeToggle = () => {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("settings").select("*").limit(1).single();
      if (data) {
        setSettings({
          id: data.id,
          payment_mode: data.payment_mode,
          payment_link_test: (data as any).payment_link_test || "",
          payment_link_live: (data as any).payment_link_live || "",
          webhook_secret_test: (data as any).webhook_secret_test || "",
          webhook_secret_live: (data as any).webhook_secret_live || "",
          price_id_test: (data as any).price_id_test || "",
          price_id_live: (data as any).price_id_live || "",
          referral_coupon_id: (data as any).referral_coupon_id || "",
        });
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const updateField = (field: keyof SettingsData, value: string) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const toggleMode = async () => {
    if (!settings) return;
    const newMode = settings.payment_mode === "test" ? "live" : "test";
    setSaving(true);
    const { error } = await supabase.from("settings").update({ payment_mode: newMode } as any).eq("id", settings.id);
    if (error) {
      toast.error("Error al cambiar modo");
    } else {
      setSettings({ ...settings, payment_mode: newMode });
      toast.success(`Modo cambiado a ${newMode.toUpperCase()}`);
    }
    setSaving(false);
  };

  const saveSection = async (section: string, fields: Partial<SettingsData>) => {
    if (!settings) return;
    setSavingSection(section);
    const { error } = await supabase.from("settings").update(fields as any).eq("id", settings.id);
    if (error) {
      toast.error(`Error al guardar ${section}`);
    } else {
      toast.success(`${section} actualizados`);
    }
    setSavingSection(null);
  };

  if (loading) return null;
  if (!settings) return <div className="text-sm text-muted-foreground">No se encontró configuración</div>;

  const isSaving = (section: string) => savingSection === section;

  return (
    <div className="space-y-4">
      {/* Payment mode toggle */}
      <div className="bg-card rounded-xl p-5 border border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-muted-foreground" />
          <div>
            <div className="font-medium text-sm">Modo de Pago</div>
            <div className="text-xs text-muted-foreground">
              Usando claves <span className={`font-bold ${settings.payment_mode === "live" ? "text-destructive" : "text-primary"}`}>{settings.payment_mode.toUpperCase()}</span>
            </div>
          </div>
        </div>
        <Button
          variant={settings.payment_mode === "live" ? "destructive" : "outline"}
          size="sm"
          onClick={toggleMode}
          disabled={saving}
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
          Cambiar a {settings.payment_mode === "test" ? "LIVE" : "TEST"}
        </Button>
      </div>

      {/* Price IDs */}
      <div className="bg-card rounded-xl p-5 border border-border space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="w-5 h-5 text-muted-foreground" />
          <div>
            <div className="font-medium text-sm">Price IDs de Stripe</div>
            <div className="text-xs text-muted-foreground">IDs de precio para la suscripción (price_...)</div>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Price ID Test</Label>
            <Input value={settings.price_id_test} onChange={(e) => updateField("price_id_test", e.target.value)} placeholder="price_..." className="mt-1 text-sm font-mono" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Price ID Live</Label>
            <Input value={settings.price_id_live} onChange={(e) => updateField("price_id_live", e.target.value)} placeholder="price_..." className="mt-1 text-sm font-mono" />
          </div>
        </div>
        <Button size="sm" onClick={() => saveSection("Price IDs", { price_id_test: settings.price_id_test, price_id_live: settings.price_id_live })} disabled={isSaving("Price IDs")} className="w-full">
          {isSaving("Price IDs") ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
          Guardar Price IDs
        </Button>
      </div>

      {/* Webhook Secrets */}
      <div className="bg-card rounded-xl p-5 border border-border space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-5 h-5 text-muted-foreground" />
          <div>
            <div className="font-medium text-sm">Webhook Secrets</div>
            <div className="text-xs text-muted-foreground">Secrets para verificar firmas de Stripe (whsec_...)</div>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Webhook Secret Test</Label>
            <Input value={settings.webhook_secret_test} onChange={(e) => updateField("webhook_secret_test", e.target.value)} placeholder="whsec_..." className="mt-1 text-sm font-mono" type="password" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Webhook Secret Live</Label>
            <Input value={settings.webhook_secret_live} onChange={(e) => updateField("webhook_secret_live", e.target.value)} placeholder="whsec_..." className="mt-1 text-sm font-mono" type="password" />
          </div>
        </div>
        <Button size="sm" onClick={() => saveSection("Webhook Secrets", { webhook_secret_test: settings.webhook_secret_test, webhook_secret_live: settings.webhook_secret_live })} disabled={isSaving("Webhook Secrets")} className="w-full">
          {isSaving("Webhook Secrets") ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
          Guardar Webhook Secrets
        </Button>
      </div>

      {/* Referral Coupon */}
      <div className="bg-card rounded-xl p-5 border border-border space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Tag className="w-5 h-5 text-muted-foreground" />
          <div>
            <div className="font-medium text-sm">Cupón de Referidos</div>
            <div className="text-xs text-muted-foreground">ID del cupón de Stripe para descuento por referido</div>
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Coupon ID</Label>
          <Input value={settings.referral_coupon_id} onChange={(e) => updateField("referral_coupon_id", e.target.value)} placeholder="coupon_id" className="mt-1 text-sm font-mono" />
        </div>
        <Button size="sm" onClick={() => saveSection("Cupón", { referral_coupon_id: settings.referral_coupon_id })} disabled={isSaving("Cupón")} className="w-full">
          {isSaving("Cupón") ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
          Guardar Cupón
        </Button>
      </div>
    </div>
  );
};

export default PaymentModeToggle;
