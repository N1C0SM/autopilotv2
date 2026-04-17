import { useState } from "react";
import { Users, Search, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/pages/Admin";

interface Props {
  users: Profile[];
  adminIds: Set<string>;
  onSelectUser: (user: Profile) => void;
}

const STATUS_FILTERS = [
  { label: "Todos", value: "all" },
  { label: "Pagados", value: "paid" },
  { label: "Sin pagar", value: "unpaid" },
  { label: "Plan pendiente", value: "plan_pending" },
  { label: "Plan listo", value: "plan_ready" },
] as const;

const UserList = ({ users, adminIds, onSelectUser }: Props) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const matchesFilters = (u: Profile) => {
    const matchesSearch = u.email.toLowerCase().includes(search.toLowerCase());
    if (filter === "all") return matchesSearch;
    if (filter === "paid") return matchesSearch && u.payment_status === "paid";
    if (filter === "unpaid") return matchesSearch && u.payment_status === "unpaid";
    return matchesSearch && u.plan_status === filter;
  };

  const regularUsers = users.filter((u) => !adminIds.has(u.user_id) && matchesFilters(u));
  const adminUsers = users.filter((u) => adminIds.has(u.user_id) && matchesFilters(u));

  const renderUserCard = (u: Profile, isAdminCard = false) => (
    <div
      key={u.user_id}
      className="bg-card rounded-xl p-4 border border-border flex items-center gap-4 cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 group"
      onClick={() => onSelectUser(u)}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isAdminCard ? "bg-primary/20" : "bg-secondary"}`}>
        {isAdminCard ? (
          <Shield className="w-4 h-4 text-primary" />
        ) : (
          <span className="text-sm font-bold text-muted-foreground">
            {u.email.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">{u.email}</div>
        <div className="text-xs text-muted-foreground">
          Registrado {new Date(u.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      </div>

      {isAdminCard ? (
        <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30 hover:bg-primary/20">
          Admin
        </Badge>
      ) : (
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
      )}

      <div className="text-muted-foreground group-hover:text-primary transition-colors">
        →
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold font-display">Usuarios</h1>
        <span className="text-sm text-muted-foreground ml-2">
          ({users.length - adminIds.size} usuarios · {adminIds.size} admin)
        </span>
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

      {/* Regular users */}
      <div className="mb-8">
        <h2 className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Usuarios ({regularUsers.length})
        </h2>
        <div className="space-y-2">
          {regularUsers.map((u) => renderUserCard(u, false))}
          {regularUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No se encontraron usuarios
            </div>
          )}
        </div>
      </div>

      {/* Admins */}
      {adminUsers.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-xs uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
            <Shield className="w-3 h-3" /> Administradores ({adminUsers.length})
          </h2>
          <div className="space-y-2">
            {adminUsers.map((u) => renderUserCard(u, true))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
