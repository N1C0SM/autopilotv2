import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Settings, Loader2 } from "lucide-react";

const PaymentModeToggle = () => {
  const [paymentMode, setPaymentMode] = useState<string>("test");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("settings").select("payment_mode").limit(1).single();
      if (data) setPaymentMode(data.payment_mode);
      setLoading(false);
    };
    fetch();
  }, []);

  const toggle = async () => {
    const newMode = paymentMode === "test" ? "live" : "test";
    setSaving(true);
    const { error } = await supabase.from("settings").update({ payment_mode: newMode } as any).neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      toast.error("Failed to update payment mode");
    } else {
      setPaymentMode(newMode);
      toast.success(`Payment mode switched to ${newMode.toUpperCase()}`);
    }
    setSaving(false);
  };

  if (loading) return null;

  return (
    <div className="bg-card rounded-xl p-5 border border-border mb-8 flex items-center justify-between">
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
  );
};

export default PaymentModeToggle;
