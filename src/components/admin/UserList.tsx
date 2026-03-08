import { Users } from "lucide-react";
import type { Profile } from "@/pages/Admin";

interface Props {
  users: Profile[];
  onSelectUser: (user: Profile) => void;
}

const UserList = ({ users, onSelectUser }: Props) => (
  <>
    <div className="flex items-center gap-2 mb-6">
      <Users className="w-5 h-5 text-primary" />
      <h1 className="text-2xl font-bold font-display">All Users</h1>
    </div>
    <div className="space-y-3">
      {users.map((u) => (
        <div
          key={u.user_id}
          className="bg-card rounded-xl p-5 border border-border flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => onSelectUser(u)}
        >
          <div>
            <div className="font-medium">{u.email}</div>
            <div className="text-xs text-muted-foreground">Joined {new Date(u.created_at).toLocaleDateString()}</div>
          </div>
          <div className="flex gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${u.payment_status === "paid" ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}>
              {u.payment_status}
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${u.plan_status === "plan_ready" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
              {u.plan_status}
            </span>
          </div>
        </div>
      ))}
    </div>
  </>
);

export default UserList;
