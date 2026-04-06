import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Dumbbell, ChevronDown, ChevronUp, Edit2, X, Check } from "lucide-react";
import type { Exercise } from "@/types/training";
import {
  MUSCLE_GROUPS, EXERCISE_TYPES, MOVEMENT_PATTERNS, LEVELS,
  PRIORITIES, STIMULUS_TYPES, LOAD_LEVELS, FATIGUE_LEVELS, RECOMMENDED_ORDERS,
} from "@/types/training";

const ALL_MUSCLE_GROUPS = [...MUSCLE_GROUPS, "Otro"] as const;

interface ExerciseLibraryProps {
  defaultOpen?: boolean;
}

const SmallSelect = ({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: readonly string[]; placeholder?: string;
}) => (
  <select
    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    value={value ?? ""} onChange={(e) => onChange(parseInt(e.target.value) || 1)}
  >
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

const ExerciseLibrary = ({ defaultOpen = false }: ExerciseLibraryProps) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Exercise>>({});

  // New exercise form
  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [newType, setNewType] = useState("");
  const [newPattern, setNewPattern] = useState("");
  const [newLevel, setNewLevel] = useState(1);
  const [newPriority, setNewPriority] = useState(2);
  const [newStimulus, setNewStimulus] = useState("");
  const [newLoad, setNewLoad] = useState("");
  const [newFatigue, setNewFatigue] = useState("");
  const [newOrder, setNewOrder] = useState(2);

  const fetchExercises = async () => {
    const { data } = await supabase.from("exercises")
      .select("id, name, muscle_group, image_url, exercise_type, movement_pattern, level, priority, stimulus_type, load_level, fatigue_level, recommended_order")
      .order("muscle_group").order("recommended_order").order("name");
    if (data) setExercises(data as Exercise[]);
  };

  useEffect(() => { fetchExercises(); }, []);

  const resetForm = () => {
    setNewName(""); setNewGroup(""); setNewType(""); setNewPattern("");
    setNewLevel(1); setNewPriority(2); setNewStimulus("");
    setNewLoad(""); setNewFatigue(""); setNewOrder(2);
  };

  const addExercise = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("exercises").insert({
      name: newName.trim(),
      muscle_group: newGroup || null,
      exercise_type: newType || null,
      movement_pattern: newPattern || null,
      level: newLevel,
      priority: newPriority,
      stimulus_type: newStimulus || null,
      load_level: newLoad || null,
      fatigue_level: newFatigue || null,
      recommended_order: newOrder,
    } as any);
    if (!error) {
      toast.success("Ejercicio añadido");
      resetForm();
      fetchExercises();
    } else {
      toast.error("Error al añadir ejercicio");
    }
    setLoading(false);
  };

  const startEdit = (ex: Exercise) => {
    setEditingId(ex.id);
    setEditData({ ...ex });
  };

  const saveEdit = async () => {
    if (!editingId || !editData.name?.trim()) return;
    const { error } = await supabase.from("exercises").update({
      name: editData.name?.trim(),
      muscle_group: editData.muscle_group || null,
      exercise_type: editData.exercise_type || null,
      movement_pattern: editData.movement_pattern || null,
      level: editData.level ?? 1,
      priority: editData.priority ?? 2,
      stimulus_type: editData.stimulus_type || null,
      load_level: editData.load_level || null,
      fatigue_level: editData.fatigue_level || null,
      recommended_order: editData.recommended_order ?? 2,
    } as any).eq("id", editingId);
    if (!error) {
      toast.success("Ejercicio actualizado");
      setEditingId(null);
      fetchExercises();
    } else {
      toast.error("Error al actualizar");
    }
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

  const grouped = exercises.reduce<Record<string, Exercise[]>>((acc, ex) => {
    const g = ex.muscle_group || "Sin grupo";
    if (!acc[g]) acc[g] = [];
    acc[g].push(ex);
    return acc;
  }, {});

  const badgeClass = "text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground";

  return (
    <div className="bg-card rounded-xl border border-border mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-primary" />
          <span className="font-bold font-display">Biblioteca de Ejercicios</span>
          <span className="text-xs text-muted-foreground ml-2">({exercises.length})</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4">
          {/* Add new exercise form */}
          <div className="p-4 bg-secondary/30 rounded-lg space-y-3">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nuevo ejercicio</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="col-span-2">
                <Label className="text-[10px]">Nombre</Label>
                <Input className="h-8 text-xs" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Press banca" />
              </div>
              <div>
                <Label className="text-[10px]">Grupo muscular</Label>
                <SmallSelect value={newGroup} onChange={setNewGroup} options={ALL_MUSCLE_GROUPS} placeholder="Seleccionar..." />
              </div>
              <div>
                <Label className="text-[10px]">Tipo</Label>
                <SmallSelect value={newType} onChange={setNewType} options={EXERCISE_TYPES} placeholder="Tipo..." />
              </div>
              <div>
                <Label className="text-[10px]">Patrón</Label>
                <SmallSelect value={newPattern} onChange={setNewPattern} options={MOVEMENT_PATTERNS} placeholder="Patrón..." />
              </div>
              <div>
                <Label className="text-[10px]">Nivel</Label>
                <NumSelect value={newLevel} onChange={setNewLevel} options={LEVELS} />
              </div>
              <div>
                <Label className="text-[10px]">Prioridad</Label>
                <NumSelect value={newPriority} onChange={setNewPriority} options={PRIORITIES} />
              </div>
              <div>
                <Label className="text-[10px]">Estímulo</Label>
                <SmallSelect value={newStimulus} onChange={setNewStimulus} options={STIMULUS_TYPES} placeholder="Estímulo..." />
              </div>
              <div>
                <Label className="text-[10px]">Carga</Label>
                <SmallSelect value={newLoad} onChange={setNewLoad} options={LOAD_LEVELS} placeholder="Carga..." />
              </div>
              <div>
                <Label className="text-[10px]">Fatiga</Label>
                <SmallSelect value={newFatigue} onChange={setNewFatigue} options={FATIGUE_LEVELS} placeholder="Fatiga..." />
              </div>
              <div>
                <Label className="text-[10px]">Orden</Label>
                <NumSelect value={newOrder} onChange={setNewOrder} options={RECOMMENDED_ORDERS} />
              </div>
            </div>
            <Button size="sm" onClick={addExercise} disabled={loading || !newName.trim()}>
              <Plus className="w-4 h-4 mr-1" /> Añadir
            </Button>
          </div>

          {/* List */}
          {Object.entries(grouped).map(([group, exs]) => (
            <div key={group}>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{group}</div>
              <div className="space-y-1">
                {exs.map((ex) => (
                  <div key={ex.id}>
                    {editingId === ex.id ? (
                      <div className="p-3 bg-secondary/30 rounded-lg space-y-2">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="col-span-2">
                            <Label className="text-[10px]">Nombre</Label>
                            <Input className="h-8 text-xs" value={editData.name || ""} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                          </div>
                          <div>
                            <Label className="text-[10px]">Grupo</Label>
                            <SmallSelect value={editData.muscle_group || ""} onChange={(v) => setEditData({ ...editData, muscle_group: v })} options={ALL_MUSCLE_GROUPS} />
                          </div>
                          <div>
                            <Label className="text-[10px]">Tipo</Label>
                            <SmallSelect value={editData.exercise_type || ""} onChange={(v) => setEditData({ ...editData, exercise_type: v })} options={EXERCISE_TYPES} />
                          </div>
                          <div>
                            <Label className="text-[10px]">Patrón</Label>
                            <SmallSelect value={editData.movement_pattern || ""} onChange={(v) => setEditData({ ...editData, movement_pattern: v })} options={MOVEMENT_PATTERNS} />
                          </div>
                          <div>
                            <Label className="text-[10px]">Nivel</Label>
                            <NumSelect value={editData.level} onChange={(v) => setEditData({ ...editData, level: v })} options={LEVELS} />
                          </div>
                          <div>
                            <Label className="text-[10px]">Prioridad</Label>
                            <NumSelect value={editData.priority} onChange={(v) => setEditData({ ...editData, priority: v })} options={PRIORITIES} />
                          </div>
                          <div>
                            <Label className="text-[10px]">Estímulo</Label>
                            <SmallSelect value={editData.stimulus_type || ""} onChange={(v) => setEditData({ ...editData, stimulus_type: v })} options={STIMULUS_TYPES} />
                          </div>
                          <div>
                            <Label className="text-[10px]">Carga</Label>
                            <SmallSelect value={editData.load_level || ""} onChange={(v) => setEditData({ ...editData, load_level: v })} options={LOAD_LEVELS} />
                          </div>
                          <div>
                            <Label className="text-[10px]">Fatiga</Label>
                            <SmallSelect value={editData.fatigue_level || ""} onChange={(v) => setEditData({ ...editData, fatigue_level: v })} options={FATIGUE_LEVELS} />
                          </div>
                          <div>
                            <Label className="text-[10px]">Orden</Label>
                            <NumSelect value={editData.recommended_order} onChange={(v) => setEditData({ ...editData, recommended_order: v })} options={RECOMMENDED_ORDERS} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="default" onClick={saveEdit} className="h-7 text-xs">
                            <Check className="w-3 h-3 mr-1" /> Guardar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 text-xs">
                            <X className="w-3 h-3 mr-1" /> Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-secondary/50 transition-colors group">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className="text-sm font-medium">{ex.name}</span>
                          {ex.exercise_type && <span className={badgeClass}>{ex.exercise_type}</span>}
                          {ex.stimulus_type && <span className={badgeClass}>{ex.stimulus_type}</span>}
                          {ex.level && <span className={badgeClass}>Nv.{ex.level}</span>}
                          {ex.priority === 1 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">Base</span>}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(ex)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteExercise(ex.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {exercises.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No hay ejercicios aún. Añade el primero arriba.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ExerciseLibrary;
