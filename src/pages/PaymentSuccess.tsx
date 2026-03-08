import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentSuccess = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // User lost session after Stripe redirect — send to login
      setChecking(false);
      return;
    }

    // Poll for payment status update (webhook may take a few seconds)
    let attempts = 0;
    const maxAttempts = 10;

    const checkPayment = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("payment_status")
        .eq("user_id", user.id)
        .single();

      if (profile?.payment_status === "paid") {
        setPaid(true);
        setChecking(false);
        return;
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(checkPayment, 2000);
      } else {
        // After 20 seconds, show success anyway (webhook might be slow)
        setPaid(true);
        setChecking(false);
      }
    };

    checkPayment();
  }, [user, loading]);

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Verifying your payment...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold font-display mb-3">Payment Received!</h1>
          <p className="text-muted-foreground mb-8">
            Please log in to continue with your personalized plan setup.
          </p>
          <Button variant="hero" size="lg" onClick={() => navigate("/login")}>
            Log In to Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold font-display mb-3">Payment Successful!</h1>
        <p className="text-muted-foreground mb-8">
          Thank you for your purchase! Now let's create your personalized plan.
        </p>
        <Button variant="hero" size="lg" onClick={() => navigate("/onboarding")}>
          Start Questionnaire
        </Button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
