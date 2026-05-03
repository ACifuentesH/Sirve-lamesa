const API_URL = "/api";

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  crearParticipante: (data: unknown) =>
    apiRequest("/participantes", { method: "POST", body: JSON.stringify(data) }),
  iniciarSesion: (data: unknown) =>
    apiRequest("/sesiones", { method: "POST", body: JSON.stringify(data) }),
  finalizarSesion: (id: number, data: unknown) =>
    apiRequest(`/sesiones/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  obtenerPersonajes: () => apiRequest("/personajes"),
  obtenerIngredientes: () => apiRequest("/ingredientes"),
  registrarDecision: (data: unknown) =>
    apiRequest("/decisiones", { method: "POST", body: JSON.stringify(data) }),
};
