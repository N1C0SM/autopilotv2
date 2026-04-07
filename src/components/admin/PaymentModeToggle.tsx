import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings, Loader2, Link as LinkIcon, Save, Shield } from "lucide-react";

const PaymentModeToggle = () => {
  const [paymentMode, setPaymentMode] = useState<string>("test");
  const [paymentLinkTest, setPaymentLinkTest] = useState("");
  const [paymentLinkLive, setPaymentLinkLive] = useState("");
  const [webhookSecretTest, setWebhookSecretTest] = useState("");
  const [webhookSecretLive, setWebhookSecretLive] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingLinks, setSavingLinks] = useState(false);
  const [savingWebhooks, setSavingWebhooks] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("settings").select("*").limit(1).single();
      if (data) {
        setPaymentMode(data.payment_mode);
        setPaymentLinkTest((data as any).payment_link_test || "");
        setPaymentLinkLive((data as any).payment_link_live || "");
        setWebhookSecretTest((data as any).webhook_secret_test || "");
        setWebhookSecretLive((data as any).webhook_secret_live || "");
        setSettingsId(data.id);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const toggle = async () => {
    const newMode = paymentMode === "test" ? "live" : "test";
    setSaving(true);
    if (!settingsId) { toast.error("Settings not found"); setSaving(false); return; }
    const { error } = await supabase.from("settings").update({ payment_mode: newMode } as any).eq("id", settingsId);
    if (error) {
      toast.error("Failed to update payment mode");
    } else {
      setPaymentMode(newMode);
      toast.success(`Payment mode switched to ${newMode.toUpperCase()}`);
    }
    setSaving(false);
  };

  const saveLinks = async () => {
    if (!settingsId) return;
    setSavingLinks(true);
    const { error } = await supabase.from("settings").update({
      payment_link_test: paymentLinkTest,
      payment_link_live: paymentLinkLive,
    } as any).eq("id", settingsId);
    if (error) {
      toast.error("Error al guardar los links");
    } else {
      toast.success("Payment links actualizados");
    }
    setSavingLinks(false);
  };

  if (loading) return null;

  return (
    <div className="space-y-4">
      {/* Payment mode toggle */}
      <div className="bg-card rounded-xl p-5 border border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-muted-foreground" />
          <div>
            <div className="font-medium text-sm">Payment Mode</div>
            <div className="text-xs text-muted-foreground">
              Currently using <span className={`font-bold ${paymentMode === "live" ? "text-destructive" : "text-primary"}`}>{paymentMode.toUpperCase()}</span> Stripe keys
            </div>
          </div>
        </div>
        <Button
          variant={paymentMode === "live" ? "destructive" : "outline"}
          size="sm"
          onClick={toggle}
          disabled={saving}
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
          Switch to {paymentMode === "test" ? "LIVE" : "TEST"}
        </Button>
      </div>

      {/* Payment links */}
      <div className="bg-card rounded-xl p-5 border border-border space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <LinkIcon className="w-5 h-5 text-muted-foreground" />
          <div>
            <div className="font-medium text-sm">Payment Links</div>
            <div className="text-xs text-muted-foreground">Stripe payment link URLs for each mode</div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Test Payment Link</Label>
            <Input
              value={paymentLinkTest}
              onChange={(e) => setPaymentLinkTest(e.target.value)}
              placeholder="https://buy.stripe.com/test_..."
              className="mt-1 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Live Payment Link</Label>
            <Input
              value={paymentLinkLive}
              onChange={(e) => setPaymentLinkLive(e.target.value)}
              placeholder="https://buy.stripe.com/..."
              className="mt-1 text-sm"
            />
          </div>
        </div>

        <Button size="sm" onClick={saveLinks} disabled={savingLinks} className="w-full">
          {savingLinks ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
          Guardar Payment Links
        </Button>
      </div>

      {/* Webhook Secrets */}
      <div className="bg-card rounded-xl p-5 border border-border space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-5 h-5 text-muted-foreground" />
          <div>
            <div className="font-medium text-sm">Webhook Secrets</div>
            <div className="text-xs text-muted-foreground">Stripe webhook signing secrets (whsec_...)</div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Test Webhook Secret</Label>
            <Input
              value={webhookSecretTest}
              onChange={(e) => setWebhookSecretTest(e.target.value)}
              placeholder="whsec_..."
              className="mt-1 text-sm font-mono"
              type="password"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Live Webhook Secret</Label>
            <Input
              value={webhookSecretLive}
              onChange={(e) => setWebhookSecretLive(e.target.value)}
              placeholder="whsec_..."
              className="mt-1 text-sm font-mono"
              type="password"
            />
          </div>
        </div>

        <Button size="sm" onClick={async () => {
          if (!settingsId) return;
          setSavingWebhooks(true);
          const { error } = await supabase.from("settings").update({
            webhook_secret_test: webhookSecretTest,
            webhook_secret_live: webhookSecretLive,
          } as any).eq("id", settingsId);
          if (error) {
            toast.error("Error al guardar webhook secrets");
          } else {
            toast.success("Webhook secrets actualizados");
          }
          setSavingWebhooks(false);
        }} disabled={savingWebhooks} className="w-full">
          {savingWebhooks ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
          Guardar Webhook Secrets
        </Button>
      </div>
    </div>
  );
};

export default PaymentModeToggle;
