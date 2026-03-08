import { useState } from "react";
import { Users, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/pages/Dashboard";

interface Props {
  users: Profile[];
  onSelectUser: (user: Profile) => void;
}

const STATUS_FILTERS = [
  { label: "Todos", value: "all" },
  { label: "Pagados", value: "paid" },
  { label: "Sin pagar", value: "unpaid" },
  { label: "Plan pendiente", value: "plan_pending" },
  { label: "Plan listo", value: "plan_ready" },
] as const;

const UserList = ({ users, onSelectUser }: Props) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = users.filter((u) => {
    const matchesSearch = u.email.toLowerCase().includes(search.toLowerCase());
    if (filter === "all") return matchesSearch;
    if (filter === "paid") return matchesSearch && u.payment_status === "paid";
    if (filter === "unpaid") return matchesSearch && u.payment_status === "unpaid";
    return matchesSearch && u.plan_status === filter;
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold font-display">Usuarios</h1>
        <span className="text-sm text-muted-foreground ml-2">({users.length})</span>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filter === f.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* User Cards */}
      <div className="space-y-2">
        {filtered.map((u) => (
          <div
            key={u.user_id}
            className="bg-card rounded-xl p-4 border border-border flex items-center gap-4 cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 group"
            onClick={() => onSelectUser(u)}
          >
            {/* Avatar circle */}
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-muted-foreground">
                {u.email.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">{u.email}</div>
              <div className="text-xs text-muted-foreground">
                Registrado {new Date(u.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </div>

            {/* Status badges */}
            <div className="flex gap-2 shrink-0">
              <Badge variant={u.payment_status === "paid" ? "default" : "destructive"} className="text-[10px]">
                {u.payment_status === "paid" ? "💳 Pagado" : "⏳ Sin pagar"}
              </Badge>
              <Badge
                variant="secondary"
                className={`text-[10px] ${u.plan_status === "plan_ready" ? "bg-primary/20 text-primary border-primary/30" : ""}`}
              >
                {u.plan_status === "plan_ready" ? "✅ Plan listo" : u.plan_status === "plan_pending" ? "📋 Pendiente" : "🆕 Onboarding"}
              </Badge>
            </div>

            {/* Arrow */}
            <div className="text-muted-foreground group-hover:text-primary transition-colors">
              →
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No se encontraron usuarios</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;
