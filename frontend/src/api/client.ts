import axios from "axios";

export const api = axios.create({
  baseURL: "https://backend-fu0d.onrender.com",
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem("token", token);
  } else {
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem("token");
  }
}

const persisted = localStorage.getItem("shiftlens_token");
if (persisted) {
  setAuthToken(persisted);
}
