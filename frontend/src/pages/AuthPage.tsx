import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { LogIn, UserPlus } from "lucide-react";
import { api, setAuthToken } from "../api/client";
import { AuthResponse, User } from "../types";
type Props = {
  onAuthenticated: (user: User) => void;
};

export default function AuthPage({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    employee_code: "",
    ward_name: "",
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const payload =
        mode === "login"
          ? { email: form.email, password: form.password }
          : {
              email: form.email,
              password: form.password,
              full_name: form.full_name,
              employee_code: form.employee_code,
              ward_name: form.ward_name || null,
            };
      const { data } = await api.post<AuthResponse>(endpoint, payload);
      setAuthToken(data.access_token);
      onAuthenticated(data.user);
    } catch (error: any) {
      setMessage(error?.response?.data?.detail ?? "Operazione non riuscita");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-grid [background-size:22px_22px] px-4 py-6 text-white md:px-8 lg:px-10">
      <div className="mx-auto grid min-h-[90vh] max-w-7xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-neon backdrop-blur-xl md:p-10"
        >
          <div className="mb-4 inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
            ShiftLens
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
            I tuoi turni di lavoro, chiari e sempre a portata di mano.
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300 md:text-lg">
            Carica la foto della tabella dei turni e visualizza solo i tuoi,
            giorno per giorno. Niente più confusione tra tutte le righe della
            bacheca.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              [
                "Trova automaticamente i tuoi turni",
                "Inserisci la tua matricola durante la registrazione. Quando carichi la foto della tabella, il sistema identifica automaticamente la tua riga.",
              ],
              [
                "Correzione manuale",
                "Se c'è un cambio turno o un errore di lettura, puoi correggere tutto manualmente.",
              ],
              [
                "Privacy per utente",
                "Ogni account vede solo i propri turni e il proprio storico",
              ],
              [
                "Facile e veloce",
                "Scatta o carica la foto della tabella e visualizza subito il tuo calendario di lavoro.",
              ],
            ].map(([title, text]) => (
              <div
                key={title}
                className="rounded-3xl border border-white/10 bg-slate-950/50 p-4"
              >
                <div className="font-semibold">{title}</div>
                <div className="mt-2 text-sm text-slate-400">{text}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-neon backdrop-blur-xl"
        >
          <div className="mb-6 flex rounded-2xl border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium transition ${mode === "login" ? "bg-white text-slate-950" : "text-slate-300"}`}
            >
              Accedi
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium transition ${mode === "register" ? "bg-white text-slate-950" : "text-slate-300"}`}
            >
              Registrati
            </button>
          </div>

          <div className="space-y-4">
            {mode === "register" && (
              <>
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-400">
                    Nome e cognome
                  </span>
                  <input
                    required
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
                    value={form.full_name}
                    onChange={(e) =>
                      setForm({ ...form, full_name: e.target.value })
                    }
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-400">
                    Matricola
                  </span>
                  <input
                    required
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 uppercase"
                    value={form.employee_code}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        employee_code: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-400">
                    Reparto
                  </span>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
                    value={form.ward_name}
                    onChange={(e) =>
                      setForm({ ...form, ward_name: e.target.value })
                    }
                  />
                </label>
              </>
            )}
            <label className="block">
              <span className="mb-2 block text-sm text-slate-400">Email</span>
              <input
                required
                type="email"
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-400">
                Password
              </span>
              <input
                required
                type="password"
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </label>
          </div>

          <button
            disabled={busy}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-3 font-semibold text-slate-950 transition hover:scale-[1.01] disabled:opacity-50"
          >
            {mode === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}
            {busy
              ? "Attendi..."
              : mode === "login"
                ? "Entra nella dashboard"
                : "Crea account"}
          </button>
          {message && <p className="mt-4 text-sm text-rose-300">{message}</p>}
        </motion.form>
      </div>
    </div>
  );
}
