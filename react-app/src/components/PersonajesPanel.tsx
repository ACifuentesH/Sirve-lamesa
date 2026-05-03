import type { PersonajeSintetico } from "../types/game";
import { personajeImagenSrc } from "../utils/personajeAssets";

interface Props {
  personajes: PersonajeSintetico[];
  personajeActual: PersonajeSintetico | null;
  onSeleccionar: (personaje: PersonajeSintetico) => void;
}

export function PersonajesPanel({ personajes, personajeActual, onSeleccionar }: Props) {
  return (
    <div className="personajes-container">
      {personajes.map((personaje) => (
        <div
          key={personaje.id}
          className={`personaje-card ${personajeActual?.id === personaje.id ? "activo" : ""} ${personaje.estado === "servido" ? "servido" : ""} ${personaje.estado === "pendiente" ? "clickable" : ""}`}
          onClick={() => personaje.estado === "pendiente" && onSeleccionar(personaje)}
        >
          <div className="personaje-imagen-container">
            {personaje.imagen && (
              <img
                src={personajeImagenSrc(personaje.imagen) ?? ""}
                alt={personaje.nombre}
                className="personaje-imagen"
              />
            )}
            {personaje.estado === "servido" && (
              <div className="estado-overlay">
                <span className="check-icon">✓</span>
              </div>
            )}
          </div>
          <h4 className="personaje-nombre font-text">{personaje.nombre}</h4>
        </div>
      ))}
    </div>
  );
}
