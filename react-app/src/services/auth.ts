import type { Participante, Sesion } from "../types/game";

const PARTICIPANTE_KEY = "participante";
const SESION_KEY = "sesion";

export const auth = {
  getParticipante(): Participante | null {
    const value = localStorage.getItem(PARTICIPANTE_KEY);
    return value ? (JSON.parse(value) as Participante) : null;
  },
  getSesion(): Sesion | null {
    const value = localStorage.getItem(SESION_KEY);
    return value ? (JSON.parse(value) as Sesion) : null;
  },
  getSesionId(): number | null {
    return this.getSesion()?.pk_sesion ?? null;
  },
  setParticipante(participante: Participante) {
    localStorage.setItem(PARTICIPANTE_KEY, JSON.stringify(participante));
  },
  setSesion(sesion: Sesion) {
    localStorage.setItem(SESION_KEY, JSON.stringify(sesion));
  },
  clearSession() {
    localStorage.removeItem(PARTICIPANTE_KEY);
    localStorage.removeItem(SESION_KEY);
  },
  isAuthenticated() {
    return !!(this.getParticipante() && this.getSesion());
  },
};
