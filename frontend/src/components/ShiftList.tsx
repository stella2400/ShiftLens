import { useMemo, useState } from "react";
import { Check, PencilLine, X } from "lucide-react";
import { api } from "../api/client";
import { Shift } from "../types";
import { shiftBadgeMap } from "../utils/shiftStyles";

const SHIFT_OPTIONS = ["M", "P", "N", "S", "R", "ASS"] as const;

type Props = {
  shifts: Shift[];
  onShiftUpdated: () => Promise<void>;
};

export function ShiftList({ shifts, onShiftUpdated }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftCode, setDraftCode] = useState<Shift["shift_code"]>("M");
  const [draftNotes, setDraftNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const sortedShifts = useMemo(
    () => [...shifts].sort((a, b) => a.shift_date.localeCompare(b.shift_date)),
    [shifts]
  );

  const startEdit = (shift: Shift) => {
    setEditingId(shift.id);
    setDraftCode(shift.shift_code);
    setDraftNotes(shift.notes ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftNotes("");
  };

  const saveEdit = async (shiftId: number) => {
    setSaving(true);
    try {
      await api.put(`/shifts/${shiftId}`, {
        shift_code: draftCode,
        notes: draftNotes || null,
      });
      await onShiftUpdated();
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Turni giornalieri</h3>
          <span className="text-sm text-slate-400">Puoi correggere manualmente ogni turno dopo l&apos;estrazione o dopo un cambio turno.</span>
        </div>
      </div>
      <div className="space-y-3">
        {sortedShifts.map((shift) => {
          const isEditing = editingId === shift.id;
          return (
            <div key={shift.id} className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="font-medium">
                    {new Date(shift.shift_date).toLocaleDateString("it-IT", { weekday: "long", day: "2-digit", month: "long" })}
                  </div>
                  <div className="text-sm text-slate-400">{shift.notes || "Nessuna nota"}</div>
                </div>

                {!isEditing ? (
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${shiftBadgeMap[shift.shift_code] || shiftBadgeMap.R}`}>
                      {shift.shift_code} · {shift.shift_label}
                    </span>
                    <button
                      onClick={() => startEdit(shift)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                    >
                      <PencilLine size={16} /> Modifica
                    </button>
                  </div>
                ) : (
                  <div className="flex w-full flex-col gap-3 xl:max-w-xl">
                    <div className="grid gap-3 md:grid-cols-[160px_1fr]">
                      <select
                        value={draftCode}
                        onChange={(e) => setDraftCode(e.target.value as Shift["shift_code"])}
                        className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3"
                      >
                        {SHIFT_OPTIONS.map((code) => (
                          <option key={code} value={code}>
                            {code}
                          </option>
                        ))}
                      </select>
                      <input
                        value={draftNotes}
                        onChange={(e) => setDraftNotes(e.target.value)}
                        placeholder="Nota opzionale: cambio turno, correzione manuale..."
                        className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={saving}
                        onClick={() => saveEdit(shift.id)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50"
                      >
                        <Check size={16} /> Salva
                      </button>
                      <button
                        disabled={saving}
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200"
                      >
                        <X size={16} /> Annulla
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
