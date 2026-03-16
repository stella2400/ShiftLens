import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { api } from "./api/client";
import { User } from "./types";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    api
      .get<User>("/auth/me")
      .then(({ data }) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setBooting(false));
  }, []);

  if (booting) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">Caricamento ShiftLens...</div>;
  }

  return user ? <DashboardPage user={user} onLogout={() => setUser(null)} /> : <AuthPage onAuthenticated={setUser} />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
