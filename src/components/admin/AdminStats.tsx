import { Users, CreditCard, ClipboardList, CheckCircle2 } from "lucide-react";
import type { Profile } from "@/pages/Dashboard";

interface Props {
  users: Profile[];
}

const AdminStats = ({ users }: Props) => {
  const total = users.length;
  const paid = users.filter((u) => u.payment_status === "paid").length;
  const pending = users.filter((u) => u.plan_status === "plan_pending").length;
  const ready = users.filter((u) => u.plan_status === "plan_ready").length;

  const stats = [
    { label: "Total usuarios", value: total, icon: Users, color: "text-foreground" },
    { label: "Han pagado", value: paid, icon: CreditCard, color: "text-primary" },
    { label: "Plan pendiente", value: pending, icon: ClipboardList, color: "text-muted-foreground" },
    { label: "Plan entregado", value: ready, icon: CheckCircle2, color: "text-primary" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((s) => (
        <div key={s.label} className="bg-card rounded-xl p-5 border border-border card-shadow text-center">
          <s.icon className={`w-6 h-6 mx-auto mb-2 ${s.color}`} />
          <div className="text-2xl font-bold font-display text-gradient">{s.value}</div>
          <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  );
};

export default AdminStats;
