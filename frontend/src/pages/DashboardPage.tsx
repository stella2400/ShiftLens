import { useEffect, useState } from "react";
import {
  CalendarDays,
  IdCard,
  LogOut,
  MoonStar,
  ShieldCheck,
  Sunrise,
  Sunset,
} from "lucide-react";
import { api, setAuthToken } from "../api/client";
import { DashboardResponse, User } from "../types";
import { StatCard } from "../components/StatCard";
import { ShiftCalendar } from "../components/ShiftCalendar";
import { ShiftList } from "../components/ShiftList";
import { UploadPanel } from "../components/UploadPanel";

type Props = {
  user: User;
  onLogout: () => void;
};

export default function DashboardPage({ user, onLogout }: Props) {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);

  const loadDashboard = async () => {
    const { data } = await api.get<DashboardResponse>(`/dashboard/me`);
    setDashboard(data);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-grid [background-size:22px_22px] px-4 py-6 text-white md:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-neon backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
                ShiftLens
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
                I tuoi turni, in modo chiaro e ordinato.
              </h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                Carica la foto della tabella e visualizza solo i tuoi turni. Se
                qualcosa non è corretto, puoi modificarlo in pochi secondi.
              </p>
            </div>

            <div className="min-w-[280px] rounded-3xl border border-white/10 bg-slate-950/60 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-cyan-200">
                <ShieldCheck size={16} />
                Il tuo profilo
              </div>
              <div className="text-xl font-semibold">{user.full_name}</div>
              <div className="mt-1 text-sm text-slate-400">{user.email}</div>

              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200">
                <IdCard size={14} />
                Matricola {user.employee_code}
              </div>

              <div className="mt-3 text-sm text-slate-400">
                {user.ward_name || "Reparto non indicato"}
              </div>

              <button
                className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
                onClick={() => {
                  setAuthToken(null);
                  onLogout();
                }}
              >
                <LogOut size={16} />
                Esci
              </button>
            </div>
          </div>
        </header>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Giorni registrati"
            value={dashboard?.summary.total_days ?? 0}
            icon={<CalendarDays size={18} />}
            hint="Turni trovati o aggiornati da te"
          />
          <StatCard
            title="Mattine"
            value={dashboard?.summary.morning_shifts ?? 0}
            icon={<Sunrise size={18} />}
            hint="Turni del mattino"
          />
          <StatCard
            title="Pomeriggi"
            value={dashboard?.summary.afternoon_shifts ?? 0}
            icon={<Sunset size={18} />}
            hint="Turni del pomeriggio"
          />
          <StatCard
            title="Notti"
            value={dashboard?.summary.night_shifts ?? 0}
            icon={<MoonStar size={18} />}
            hint="Turni notturni"
          />
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <ShiftCalendar shifts={dashboard?.shifts ?? []} />
          <UploadPanel user={user} onUploaded={loadDashboard} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <ShiftList
            shifts={dashboard?.shifts ?? []}
            onShiftUpdated={loadDashboard}
          />

          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl">
            <h3 className="text-xl font-semibold">Storico caricamenti</h3>

            <div className="mt-4 space-y-3">
              {dashboard?.uploads?.map((upload) => (
                <div
                  key={upload.id}
                  className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3"
                >
                  <div className="font-medium">{upload.month_label}</div>
                  <div className="text-sm text-slate-400">
                    {upload.original_filename}
                  </div>
                  {upload.source_note && (
                    <div className="mt-2 text-xs text-slate-400">
                      {upload.source_note}
                    </div>
                  )}
                  <div className="mt-2 text-xs uppercase tracking-wide text-cyan-200">
                    {upload.processing_status}
                  </div>
                </div>
              )) || null}
            </div>

            <div className="mt-6 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4 text-sm text-violet-100">
              Hai notato un errore o un cambio turno? Puoi aggiornare il singolo
              giorno direttamente dalla lista.
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              Riposi: {dashboard?.summary.rest_days ?? 0} · Smonti:{" "}
              {dashboard?.summary.smonto_days ?? 0} · Giorni lavorativi:{" "}
              {dashboard?.summary.work_days ?? 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
