import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Shift } from "../types";
import { shiftBadgeMap } from "../utils/shiftStyles";

const normalize = (value: Date) => value.toISOString().slice(0, 10);

export function ShiftCalendar({ shifts }: { shifts: Shift[] }) {
  const byDate = Object.fromEntries(shifts.map((shift) => [shift.shift_date, shift]));

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl">
      <div className="mb-4">
        <h3 className="text-xl font-semibold">Calendario smart</h3>
        <p className="mt-1 text-sm text-slate-400">Ogni giorno evidenzia il turno dell'operatore senza dover leggere l'intera tabella di reparto.</p>
      </div>
      <Calendar
        locale="it-IT"
        tileContent={({ date, view }) => {
          if (view !== "month") return null;
          const shift = byDate[normalize(date)];
          if (!shift) return null;
          return (
            <div className="mt-2 flex justify-center">
              <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${shiftBadgeMap[shift.shift_code] || shiftBadgeMap.R}`}>
                {shift.shift_code}
              </span>
            </div>
          );
        }}
      />
    </div>
  );
}
