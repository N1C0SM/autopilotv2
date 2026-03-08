import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";
import type { Exercise } from "@/types/training";

const MUSCLE_GROUPS = [
  "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps",
  "Piernas", "Glúteos", "Core", "Cardio", "Cuerpo completo", "Otro"
];

const ExerciseLibrary = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchExercises = async () => {
    const { data } = await supabase.from("exercises").select("*").order("muscle_group").order("name");
    if (data) setExercises(data as Exercise[]);
  };

  useEffect(() => { fetchExercises(); }, []);

  const addExercise = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("exercises").insert({ name: newName.trim(), muscle_group: newGroup || null });
    if (!error) {
      toast.success("Ejercicio añadido");
      setNewName("");
      setNewGroup("");
      fetchExercises();
    } else {
      toast.error("Error al añadir ejercicio");
    }
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

  const grouped = exercises.reduce<Record<string, Exercise[]>>((acc, ex) => {
    const g = ex.muscle_group || "Sin grupo";
    if (!acc[g]) acc[g] = [];
    acc[g].push(ex);
    return acc;
  }, {});

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
          {/* Add new */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-xs">Nombre</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Press banca" />
            </div>
            <div className="w-40">
              <Label className="text-xs">Grupo muscular</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {MUSCLE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
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
                  <div key={ex.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-secondary/50 transition-colors">
                    <span className="text-sm">{ex.name}</span>
                    <button onClick={() => deleteExercise(ex.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
