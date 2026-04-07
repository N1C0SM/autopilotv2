import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings, Loader2, Save, Shield, CreditCard, Tag, Key, Link } from "lucide-react";

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

  const saveSecrets = async (section: string, secrets: Record<string, string>) => {
    setSavingSection(section);
    try {
      const response = await supabase.functions.invoke("update-secrets", {
        body: secrets,
      });
      if (response.error) {
        toast.error(`Error al guardar ${section}`);
      } else {
        toast.success(`${section} actualizados. Se aplicarán en la próxima ejecución.`);
      }
    } catch {
      toast.error(`Error al guardar ${section}`);
    }
    setSavingSection(null);
  };

  if (loading) return null;
  if (!settings) return <div className="text-sm text-muted-foreground">No se encontró configuración</div>;

  const isSaving = (section: string) => savingSection === section;

  const sections = [
    {
      icon: CreditCard,
      title: "Price IDs de Stripe",
      description: "IDs de precio para la suscripción (price_...)",
      fields: [
        { key: "price_id_test" as keyof SettingsData, label: "Price ID Test", placeholder: "price_..." },
        { key: "price_id_live" as keyof SettingsData, label: "Price ID Live", placeholder: "price_..." },
      ],
      saveKey: "Price IDs",
      saveFields: () => ({ price_id_test: settings.price_id_test, price_id_live: settings.price_id_live }),
    },
    {
      icon: Link,
      title: "Payment Links",
      description: "Links de pago de Stripe (fallback si falla el checkout session)",
      fields: [
        { key: "payment_link_test" as keyof SettingsData, label: "Payment Link Test", placeholder: "https://buy.stripe.com/test_..." },
        { key: "payment_link_live" as keyof SettingsData, label: "Payment Link Live", placeholder: "https://buy.stripe.com/..." },
      ],
      saveKey: "Payment Links",
      saveFields: () => ({ payment_link_test: settings.payment_link_test, payment_link_live: settings.payment_link_live }),
    },
    {
      icon: Shield,
      title: "Webhook Secrets",
      description: "Secrets para verificar firmas de Stripe (whsec_...)",
      fields: [
        { key: "webhook_secret_test" as keyof SettingsData, label: "Webhook Secret Test", placeholder: "whsec_..." },
        { key: "webhook_secret_live" as keyof SettingsData, label: "Webhook Secret Live", placeholder: "whsec_..." },
      ],
      saveKey: "Webhook Secrets",
      saveFields: () => ({ webhook_secret_test: settings.webhook_secret_test, webhook_secret_live: settings.webhook_secret_live }),
    },
    {
      icon: Tag,
      title: "Cupón de Referidos",
      description: "ID del cupón de Stripe para descuento por referido",
      fields: [
        { key: "referral_coupon_id" as keyof SettingsData, label: "Coupon ID", placeholder: "coupon_id" },
      ],
      saveKey: "Cupón",
      saveFields: () => ({ referral_coupon_id: settings.referral_coupon_id }),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Resumen rápido */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="text-xs font-medium text-muted-foreground mb-2">Resumen de configuración</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${settings.price_id_test ? "bg-green-500" : "bg-destructive"}`} />
            <span>Price ID Test</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${settings.price_id_live ? "bg-green-500" : "bg-destructive"}`} />
            <span>Price ID Live</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${settings.webhook_secret_test ? "bg-green-500" : "bg-destructive"}`} />
            <span>Webhook Test</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${settings.webhook_secret_live ? "bg-green-500" : "bg-destructive"}`} />
            <span>Webhook Live</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${settings.payment_link_test ? "bg-green-500" : "bg-yellow-500"}`} />
            <span>Link Test</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${settings.payment_link_live ? "bg-green-500" : "bg-yellow-500"}`} />
            <span>Link Live</span>
          </div>
        </div>
      </div>

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

      {/* Dynamic sections */}
      {sections.filter(s => s.type !== "toggle").map((section) => {
        const Icon = section.icon;
        return (
          <div key={section.saveKey} className="bg-card rounded-xl p-5 border border-border space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Icon className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-medium text-sm">{section.title}</div>
                <div className="text-xs text-muted-foreground">{section.description}</div>
              </div>
            </div>
            <div className="space-y-3">
              {section.fields!.map((field) => (
                <div key={field.key}>
                  <Label className="text-xs text-muted-foreground">{field.label}</Label>
                  <Input
                    value={settings[field.key]}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="mt-1 text-sm font-mono"
                    type="text"
                  />
                </div>
              ))}
            </div>
            <Button
              size="sm"
              onClick={() => saveSection(section.saveKey!, section.saveFields!())}
              disabled={isSaving(section.saveKey!)}
              className="w-full"
            >
              {isSaving(section.saveKey!) ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
              Guardar {section.saveKey}
            </Button>
          </div>
        );
      })}

      {/* Info box */}
      <div className="bg-muted/50 rounded-xl p-4 border border-border">
        <div className="text-xs font-medium mb-2 flex items-center gap-1.5">
          <Key className="w-3.5 h-3.5" />
          API Keys (sk_test / sk_live)
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Las Secret Keys de Stripe (sk_test_... / sk_live_...) se configuran como secretos del servidor y no se muestran aquí por seguridad. Para actualizarlas, pídelo en el chat.
        </p>
      </div>
    </div>
  );
};

export default PaymentModeToggle;
