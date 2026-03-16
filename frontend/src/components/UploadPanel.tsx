import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { api } from "../api/client";
import { User } from "../types";

type Props = {
  user: User;
  onUploaded: () => Promise<void>;
};

export function UploadPanel({ user, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>("");

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    setMessage("");
    const form = new FormData();
    form.append("image", file);
    try {
      const { data } = await api.post(`/ingest/me`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(`Elaborazione completata: ${data.month_label}. ${data.source_note ?? ""}`.trim());
      setFile(null);
      await onUploaded();
    } catch (error: any) {
      setMessage(error?.response?.data?.detail ?? "Errore durante l'upload");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-2xl bg-cyan-500/15 p-2 text-cyan-200"><UploadCloud size={20} /></div>
        <div>
          <h3 className="text-xl font-semibold">Upload turni</h3>
          <p className="text-sm text-slate-400">La pipeline cercherà prima la tua matricola {user.employee_code} e leggerà soltanto quella riga della tabella.</p>
        </div>
      </div>
      <input
        className="mb-4 block w-full rounded-2xl border border-dashed border-white/20 bg-slate-950/60 px-4 py-5 text-sm"
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <button
        onClick={submit}
        disabled={!file || busy}
        className="rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-3 font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Elaborazione in corso..." : "Processa immagine"}
      </button>
      {message && <p className="mt-3 text-sm text-slate-300">{message}</p>}
    </div>
  );
}
