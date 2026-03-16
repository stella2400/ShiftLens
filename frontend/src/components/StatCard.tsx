import { motion } from "framer-motion";
import { ReactNode } from "react";

type Props = {
  title: string;
  value: number;
  icon: ReactNode;
  hint: string;
};

export function StatCard({ title, value, icon, hint }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-neon backdrop-blur-xl"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-slate-300">{title}</div>
        <div className="rounded-2xl bg-white/10 p-2">{icon}</div>
      </div>
      <div className="text-3xl font-semibold tracking-tight">{value}</div>
      <div className="mt-2 text-sm text-slate-400">{hint}</div>
    </motion.div>
  );
}
