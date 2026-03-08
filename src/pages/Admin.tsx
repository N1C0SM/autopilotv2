import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, Users, Loader2, Settings } from "lucide-react";
import UserList from "@/components/admin/UserList";
import UserDetail from "@/components/admin/UserDetail";
import PaymentModeToggle from "@/components/admin/PaymentModeToggle";

export interface Profile {
  user_id: string;
  email: string;
  plan_status: string;
  payment_status: string;
  created_at: string;
}

const Admin = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!data) {
        navigate("/dashboard");
        return;
      }
      setIsAdmin(true);
      const { data: profiles } = await supabase.from("profiles").select("*");
      if (profiles) setUsers(profiles as unknown as Profile[]);
      setLoading(false);
    };
    checkAdmin();
  }, [user, navigate]);

  const updateUserInList = (userId: string, updates: Partial<Profile>) => {
    setUsers((u) => u.map((p) => p.user_id === userId ? { ...p, ...updates } : p));
    setSelectedUser((p) => p?.user_id === userId ? { ...p, ...updates } : p);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <span className="font-display text-xl font-bold text-gradient">Autopilot Admin</span>
          <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}>
            <LogOut className="w-4 h-4 mr-1" /> Log out
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {/* Payment Mode Toggle */}
        <PaymentModeToggle />

        {!selectedUser ? (
          <UserList users={users} onSelectUser={setSelectedUser} />
        ) : (
          <UserDetail
            profile={selectedUser}
            onBack={() => setSelectedUser(null)}
            onUpdate={updateUserInList}
          />
        )}
      </div>
    </div>
  );
};

export default Admin;
