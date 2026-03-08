import { Users, CreditCard, ClipboardList, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import type { Profile } from "@/pages/Admin";

interface Props {
  users: Profile[];
}

const AdminStats = ({ users }: Props) => {
  const total = users.length;
  const paid = users.filter((u) => u.payment_status === "paid").length;
  const pending = users.filter((u) => u.plan_status === "plan_pending").length;
  const ready = users.filter((u) => u.plan_status === "plan_ready").length;

  const stats = [
    { label: "Total usuarios", value: total, icon: Users, accent: false },
    { label: "Han pagado", value: paid, icon: CreditCard, accent: true },
    { label: "Plan pendiente", value: pending, icon: ClipboardList, accent: false },
    { label: "Plan entregado", value: ready, icon: CheckCircle2, accent: true },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-card rounded-xl p-4 border border-border hover:border-primary/30 transition-colors group"
        >
          <div className="flex items-center gap-2 mb-2">
            <s.icon className={`w-4 h-4 ${s.accent ? "text-primary" : "text-muted-foreground"}`} />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
          </div>
          <div className="text-3xl font-bold font-display text-gradient">{s.value}</div>
        </motion.div>
      ))}
    </div>
  );
};

export default AdminStats;
