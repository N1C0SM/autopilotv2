import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Dumbbell, Edit2, Search, X, ArrowLeftRight } from "lucide-react";
import type { Exercise } from "@/types/training";
import {
  MUSCLE_GROUPS, EXERCISE_TYPES, MOVEMENT_PATTERNS, LEVELS,
  PRIORITIES, STIMULUS_TYPES, LOAD_LEVELS, FATIGUE_LEVELS, RECOMMENDED_ORDERS,
} from "@/types/training";

const ALL_MUSCLE_GROUPS = [...MUSCLE_GROUPS, "Otro"] as const;

interface ExerciseLibraryProps {
  defaultOpen?: boolean;
}

/* ── Helpers ── */

const SmallSelect = ({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: readonly string[]; placeholder?: string;
}) => (
  <select
    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    value={value} onChange={(e) => onChange(e.target.value)}
  >
    <option value="">{placeholder || "—"}</option>
    {options.map((o) => <option key={o} value={o}>{o}</option>)}
  </select>
);

const NumSelect = ({ value, onChange, options }: {
  value: number | null | undefined; onChange: (v: number) => void;
  options: readonly { value: number; label: string }[];
}) => (
  <select
    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    value={value ?? ""} onChange={(e) => onChange(parseInt(e.target.value) || 1)}
  >
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

const GROUP_COLORS: Record<string, string> = {
  Pecho: "bg-red-500/15 text-red-400 border-red-500/30",
  Espalda: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Hombros: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Bíceps: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  Tríceps: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  Piernas: "bg-green-500/15 text-green-400 border-green-500/30",
  Glúteos: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Core: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  Cardio: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  "Cuerpo completo": "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  Otro: "bg-muted text-muted-foreground border-border",
};

const LEVEL_COLORS: Record<number, string> = {
  1: "bg-emerald-500/15 text-emerald-400",
  2: "bg-yellow-500/15 text-yellow-400",
  3: "bg-red-500/15 text-red-400",
};

const STIMULUS_COLORS: Record<string, string> = {
  Fuerza: "bg-blue-600/15 text-blue-400",
  Hipertrofia: "bg-violet-500/15 text-violet-400",
  Resistencia: "bg-orange-500/15 text-orange-400",
  Isométrico: "bg-teal-500/15 text-teal-400",
};

/* ── Exercise Form Dialog ── */

const ExerciseFormDialog = ({
  open, onOpenChange, initial, onSave, loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Exercise | null;
  onSave: (data: Partial<Exercise>) => void;
  loading: boolean;
}) => {
  const [form, setForm] = useState<Partial<Exercise>>({});

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...initial } : {
        name: "", muscle_group: "", exercise_type: "", movement_pattern: "",
        level: 1, priority: 2, stimulus_type: "", load_level: "", fatigue_level: "", recommended_order: 2,
      });
    }
  }, [open, initial]);

  const set = (k: keyof Exercise, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            {initial ? "Editar ejercicio" : "Nuevo ejercicio"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          {/* Basic info */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Información básica</p>
            <div>
              <Label className="text-xs">Nombre</Label>
              <Input className="mt-1" value={form.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="Press banca" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Grupo muscular</Label>
                <SmallSelect value={form.muscle_group || ""} onChange={(v) => set("muscle_group", v)} options={ALL_MUSCLE_GROUPS} placeholder="Seleccionar..." />
              </div>
              <div>
                <Label className="text-xs">Tipo</Label>
                <SmallSelect value={form.exercise_type || ""} onChange={(v) => set("exercise_type", v)} options={EXERCISE_TYPES} placeholder="Tipo..." />
              </div>
            </div>
          </div>

          {/* Classification */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Clasificación</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Patrón</Label>
                <SmallSelect value={form.movement_pattern || ""} onChange={(v) => set("movement_pattern", v)} options={MOVEMENT_PATTERNS} placeholder="Patrón..." />
              </div>
              <div>
                <Label className="text-xs">Estímulo</Label>
                <SmallSelect value={form.stimulus_type || ""} onChange={(v) => set("stimulus_type", v)} options={STIMULUS_TYPES} placeholder="Estímulo..." />
              </div>
              <div>
                <Label className="text-xs">Nivel</Label>
                <NumSelect value={form.level} onChange={(v) => set("level", v)} options={LEVELS} />
              </div>
              <div>
                <Label className="text-xs">Prioridad</Label>
                <NumSelect value={form.priority} onChange={(v) => set("priority", v)} options={PRIORITIES} />
              </div>
            </div>
          </div>

          {/* Generation params */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Parámetros de generación</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Carga</Label>
                <SmallSelect value={form.load_level || ""} onChange={(v) => set("load_level", v)} options={LOAD_LEVELS} placeholder="—" />
              </div>
              <div>
                <Label className="text-xs">Fatiga</Label>
                <SmallSelect value={form.fatigue_level || ""} onChange={(v) => set("fatigue_level", v)} options={FATIGUE_LEVELS} placeholder="—" />
              </div>
              <div>
                <Label className="text-xs">Orden</Label>
                <NumSelect value={form.recommended_order} onChange={(v) => set("recommended_order", v)} options={RECOMMENDED_ORDERS} />
              </div>
            </div>
          </div>

          <Button className="w-full" onClick={() => onSave(form)} disabled={loading || !form.name?.trim()}>
            {initial ? "Guardar cambios" : "Añadir ejercicio"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ── Main Component ── */

const ExerciseLibrary = ({ defaultOpen = false }: ExerciseLibraryProps) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  const fetchExercises = async () => {
    const { data } = await supabase.from("exercises")
      .select("id, name, muscle_group, image_url, exercise_type, movement_pattern, level, priority, stimulus_type, load_level, fatigue_level, recommended_order")
      .order("muscle_group").order("recommended_order").order("name");
    if (data) setExercises(data as Exercise[]);
  };

  useEffect(() => { fetchExercises(); }, []);

  const filtered = useMemo(() => {
    let result = exercises;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.name.toLowerCase().includes(q));
    }
    if (filterGroup) result = result.filter((e) => (e.muscle_group || "Sin grupo") === filterGroup);
    if (filterType) result = result.filter((e) => e.exercise_type === filterType);
    return result;
  }, [exercises, search, filterGroup, filterType]);

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    exercises.forEach((e) => {
      const g = e.muscle_group || "Sin grupo";
      counts[g] = (counts[g] || 0) + 1;
    });
    return counts;
  }, [exercises]);

  const handleSave = async (form: Partial<Exercise>) => {
    setLoading(true);
    const payload = {
      name: form.name?.trim(),
      muscle_group: form.muscle_group || null,
      exercise_type: form.exercise_type || null,
      movement_pattern: form.movement_pattern || null,
      level: form.level ?? 1,
      priority: form.priority ?? 2,
      stimulus_type: form.stimulus_type || null,
      load_level: form.load_level || null,
      fatigue_level: form.fatigue_level || null,
      recommended_order: form.recommended_order ?? 2,
    };

    if (editingExercise) {
      const { error } = await supabase.from("exercises").update(payload as any).eq("id", editingExercise.id);
      if (!error) { toast.success("Ejercicio actualizado"); } else { toast.error("Error al actualizar"); }
    } else {
      const { error } = await supabase.from("exercises").insert(payload as any);
      if (!error) { toast.success("Ejercicio añadido"); } else { toast.error("Error al añadir"); }
    }
    setDialogOpen(false);
    setEditingExercise(null);
    fetchExercises();
    setLoading(false);
  };

  const deleteExercise = async (id: string) => {
    const { error } = await supabase.from("exercises").delete().eq("id", id);
    if (!error) {
      setExercises((e) => e.filter((ex) => ex.id !== id));
      toast.success("Ejercicio eliminado");
    } else {
      toast.error("Error al eliminar");
    }
  };

  const levelLabel = (l: number) => LEVELS.find((x) => x.value === l)?.label || "";
  const priorityLabel = (p: number) => PRIORITIES.find((x) => x.value === p)?.label || "";
  const orderLabel = (o: number) => RECOMMENDED_ORDERS.find((x) => x.value === o)?.label || "";

  return (
    <div className="bg-card rounded-xl border border-border mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-primary" />
          <span className="font-bold font-display">Biblioteca de Ejercicios</span>
          <Badge variant="secondary" className="ml-1 text-xs">{exercises.length}</Badge>
        </div>
        <span className="text-muted-foreground text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 animate-fade-in">
          {/* Search + Add */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9 h-10"
                placeholder="Buscar ejercicio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            <Button onClick={() => { setEditingExercise(null); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Nuevo
            </Button>
          </div>

          {/* Filter chips - muscle groups */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterGroup(null)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                !filterGroup ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Todos
            </button>
            {Object.entries(groupCounts).sort(([a], [b]) => a.localeCompare(b)).map(([group, count]) => (
              <button
                key={group}
                onClick={() => setFilterGroup(filterGroup === group ? null : group)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterGroup === group ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {group} <span className="opacity-60">({count})</span>
              </button>
            ))}
          </div>

          {/* Filter chips - type */}
          <div className="flex gap-1.5">
            {EXERCISE_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(filterType === t ? null : t)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterType === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Card grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((ex) => (
                <div
                  key={ex.id}
                  className={`group relative rounded-lg border p-3.5 transition-all hover:shadow-md hover:border-primary/30 ${
                    ex.priority === 1 ? "border-amber-500/40 bg-amber-500/5" : "border-border bg-card"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-sm leading-tight">{ex.name}</h4>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => { setEditingExercise(ex); setDialogOpen(true); }}
                        className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => deleteExercise(ex.id)}
                        className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </div>

                  {/* Muscle group badge */}
                  {ex.muscle_group && (
                    <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border mb-2 ${GROUP_COLORS[ex.muscle_group] || GROUP_COLORS.Otro}`}>
                      {ex.muscle_group}
                    </span>
                  )}

                  {/* Info badges */}
                  <div className="flex flex-wrap gap-1">
                    {ex.level && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${LEVEL_COLORS[ex.level] || ""}`}>
                        {levelLabel(ex.level)}
                      </span>
                    )}
                    {ex.priority === 1 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-amber-500/15 text-amber-400">
                        Base
                      </span>
                    )}
                    {ex.stimulus_type && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STIMULUS_COLORS[ex.stimulus_type] || "bg-secondary text-muted-foreground"}`}>
                        {ex.stimulus_type}
                      </span>
                    )}
                    {ex.exercise_type && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        {ex.exercise_type}
                      </span>
                    )}
                    {ex.movement_pattern && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        {ex.movement_pattern}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Dumbbell className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                {exercises.length === 0 ? "No hay ejercicios aún. Añade el primero." : "Sin resultados para esta búsqueda."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Form Dialog */}
      <ExerciseFormDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditingExercise(null); }}
        initial={editingExercise}
        onSave={handleSave}
        loading={loading}
      />
    </div>
  );
};

export default ExerciseLibrary;
