import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Camera,
  LogOut,
  Trash2,
  Loader2,
  User,
  Lock,
  ClipboardList,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Profile
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Onboarding
  const [onboarding, setOnboarding] = useState({
    age: "",
    height: "",
    weight: "",
    goal: "lose_weight",
    sports: "",
    availability: { days: "", hours: "" },
    nutrition_preferences: "",
    allergies: "",
  });
  const [hasOnboarding, setHasOnboarding] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [{ data: profile }, { data: roleData }, { data: onb }] = await Promise.all([
        supabase.from("profiles").select("name, email, avatar_url").eq("user_id", user.id).single(),
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
        supabase.from("onboarding").select("*").eq("user_id", user.id).single(),
      ]);

      if (profile) {
        setName(profile.name || "");
        setEmail(profile.email || "");
        setAvatarUrl(profile.avatar_url || "");
      }
      setIsAdmin(!!roleData);

      if (onb) {
        setHasOnboarding(true);
        const avail = (onb.availability as any) || { days: "", hours: "" };
        setOnboarding({
          age: onb.age?.toString() || "",
          height: onb.height?.toString() || "",
          weight: onb.weight?.toString() || "",
          goal: onb.goal || "lose_weight",
          sports: onb.sports || "",
          availability: { days: avail.days?.toString() || "", hours: avail.hours?.toString() || "" },
          nutrition_preferences: onb.nutrition_preferences || "",
          allergies: onb.allergies || "",
        });
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no puede superar 2MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) {
      toast.error("Error al subir la imagen");
      setUploading(false);
      return;
    }

    const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${publicUrl.publicUrl}?t=${Date.now()}`;

    await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user.id);
    setAvatarUrl(url);
    toast.success("Foto actualizada");
    setUploading(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase.from("profiles").update({ name, email }).eq("user_id", user.id);

    if (email !== user.email) {
      const { error: emailErr } = await supabase.auth.updateUser({ email });
      if (emailErr) {
        toast.error("Error al cambiar email: " + emailErr.message);
        setSaving(false);
        return;
      }
      toast.info("Se ha enviado un email de confirmación al nuevo correo");
    }

    if (!error) toast.success("Perfil guardado");
    else toast.error("Error al guardar");
    setSaving(false);
  };

  const changePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) {
      toast.success("Contraseña actualizada");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast.error("Error: " + error.message);
    }
    setChangingPassword(false);
  };

  const saveOnboarding = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("onboarding").upsert({
      user_id: user.id,
      age: parseInt(onboarding.age) || null,
      height: parseFloat(onboarding.height) || null,
      weight: parseFloat(onboarding.weight) || null,
      goal: onboarding.goal,
      sports: onboarding.sports,
      availability: onboarding.availability,
      nutrition_preferences: onboarding.nutrition_preferences,
      allergies: onboarding.allergies,
    });
    if (!error) toast.success("Datos actualizados");
    else toast.error("Error al guardar");
    setSaving(false);
  };

  const deleteAccount = async () => {
    if (!user) return;
    setDeleting(true);

    // Delete user data
    await Promise.all([
      supabase.from("training_plan").delete().eq("user_id", user.id),
      supabase.from("nutrition_plan").delete().eq("user_id", user.id),
      supabase.from("onboarding").delete().eq("user_id", user.id),
      supabase.from("user_roles").delete().eq("user_id", user.id),
      supabase.from("profiles").delete().eq("user_id", user.id),
      supabase.storage.from("avatars").remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.webp`]),
    ]);

    await signOut();
    navigate("/");
    toast.success("Cuenta eliminada");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <span className="font-display text-xl font-bold text-gradient">FitPlan Pro</span>
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-10 max-w-2xl space-y-8">
        <h1 className="text-3xl font-bold font-display">Ajustes</h1>

        {/* Avatar + Profile */}
        <div className="bg-card rounded-2xl p-6 border border-border card-shadow">
          <div className="flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-primary" />
            <h2 className="font-bold font-display text-lg">Perfil</h2>
          </div>

          <div className="flex items-center gap-6 mb-6">
            <div
              className="relative w-20 h-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-muted-foreground" />
              )}
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div className="text-sm text-muted-foreground">Haz clic para cambiar tu foto de perfil</div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm">Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Correo electrónico</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@ejemplo.com" className="mt-1" />
            </div>
          </div>

          <Button variant="default" className="mt-4" onClick={saveProfile} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> {saving ? "Guardando..." : "Guardar perfil"}
          </Button>
        </div>

        {/* Password */}
        <div className="bg-card rounded-2xl p-6 border border-border card-shadow">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="font-bold font-display text-lg">Cambiar contraseña</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm">Nueva contraseña</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Confirmar contraseña</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repite la contraseña" className="mt-1" />
            </div>
          </div>

          <Button variant="default" className="mt-4" onClick={changePassword} disabled={changingPassword}>
            <Lock className="w-4 h-4 mr-1" /> {changingPassword ? "Cambiando..." : "Cambiar contraseña"}
          </Button>
        </div>

        {/* Onboarding data (only for non-admin users) */}
        {!isAdmin && hasOnboarding && (
          <div className="bg-card rounded-2xl p-6 border border-border card-shadow">
            <div className="flex items-center gap-2 mb-6">
              <ClipboardList className="w-5 h-5 text-primary" />
              <h2 className="font-bold font-display text-lg">Tus datos</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Edad</Label>
                  <Input type="number" value={onboarding.age} onChange={(e) => setOnboarding((o) => ({ ...o, age: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Altura (cm)</Label>
                  <Input type="number" value={onboarding.height} onChange={(e) => setOnboarding((o) => ({ ...o, height: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Peso (kg)</Label>
                  <Input type="number" value={onboarding.weight} onChange={(e) => setOnboarding((o) => ({ ...o, weight: e.target.value }))} className="mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-xs">Objetivo</Label>
                <RadioGroup
                  value={onboarding.goal}
                  onValueChange={(v) => setOnboarding((o) => ({ ...o, goal: v }))}
                  className="mt-1 space-y-2"
                >
                  {[
                    { value: "lose_weight", label: "Perder peso" },
                    { value: "gain_muscle", label: "Ganar músculo" },
                    { value: "improve_endurance", label: "Mejorar resistencia" },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors text-sm ${
                        onboarding.goal === opt.value ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <RadioGroupItem value={opt.value} />
                      <span className="font-medium">{opt.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="text-xs">Deportes</Label>
                <Textarea
                  value={onboarding.sports}
                  onChange={(e) => setOnboarding((o) => ({ ...o, sports: e.target.value }))}
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Días/semana</Label>
                  <Input
                    type="number"
                    min={1}
                    max={7}
                    value={onboarding.availability.days}
                    onChange={(e) => setOnboarding((o) => ({ ...o, availability: { ...o.availability, days: e.target.value } }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Horas/sesión</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={onboarding.availability.hours}
                    onChange={(e) => setOnboarding((o) => ({ ...o, availability: { ...o.availability, hours: e.target.value } }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Preferencias nutricionales</Label>
                <Textarea
                  value={onboarding.nutrition_preferences}
                  onChange={(e) => setOnboarding((o) => ({ ...o, nutrition_preferences: e.target.value }))}
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div>
                <Label className="text-xs">Alergias</Label>
                <Textarea
                  value={onboarding.allergies}
                  onChange={(e) => setOnboarding((o) => ({ ...o, allergies: e.target.value }))}
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>

            <Button variant="default" className="mt-4" onClick={saveOnboarding} disabled={saving}>
              <Save className="w-4 h-4 mr-1" /> {saving ? "Guardando..." : "Guardar datos"}
            </Button>
          </div>
        )}

        {/* Danger zone */}
        <div className="bg-card rounded-2xl p-6 border border-destructive/30 card-shadow">
          <h2 className="font-bold font-display text-lg text-destructive mb-4">Zona peligrosa</h2>

          <div className="space-y-4">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                signOut();
                navigate("/");
              }}
            >
              <LogOut className="w-4 h-4 mr-2" /> Cerrar sesión
            </Button>

            <Separator />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" /> Eliminar cuenta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará permanentemente tu cuenta y todos tus datos. No se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteAccount} disabled={deleting}>
                    {deleting ? "Eliminando..." : "Sí, eliminar cuenta"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
