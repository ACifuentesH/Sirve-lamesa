import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { IngredientesPanel } from "../components/IngredientesPanel";
import { PersonajesPanel } from "../components/PersonajesPanel";
import { PlatoDropZone } from "../components/PlatoDropZone";
import { api } from "../services/api";
import { auth } from "../services/auth";
import type { ComponenteServido, DecisionPayload, Ingrediente, IngredienteEnPlato, PersonajeSintetico } from "../types/game";
type EstadoPersonaje = "pendiente" | "en_curso" | "servido";

const escenarios: Array<"desayuno" | "almuerzo" | "cena"> = ["desayuno", "almuerzo", "cena"];

export function GamePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mensajeError, setMensajeError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [escenarioActual, setEscenarioActual] = useState<"desayuno" | "almuerzo" | "cena">("desayuno");
  const [personajes, setPersonajes] = useState<PersonajeSintetico[]>([]);
  const [personajeActual, setPersonajeActual] = useState<PersonajeSintetico | null>(null);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [ingredientesEnPlato, setIngredientesEnPlato] = useState<IngredienteEnPlato[]>([]);
  const [enviandoDecisiones, setEnviandoDecisiones] = useState(false);
  const [juegoCompletado, setJuegoCompletado] = useState(false);
  const ordenServicioRef = useRef(1);
  const tiempoInicioRef = useRef(Date.now());
  const draggedIngredienteRef = useRef<Ingrediente | null>(null);

  const participante = auth.getParticipante();
  if (!auth.isAuthenticated()) return <Navigate to="/" replace />;

  useEffect(() => {
    const init = async () => {
      try {
        const [personajesRes, ingredientesRes] = await Promise.all([api.obtenerPersonajes(), api.obtenerIngredientes()]) as any[];
        const personajesMapped: PersonajeSintetico[] = personajesRes.data.map((p: any) => ({
          id: p.pk_personaje,
          tipo: p.tipo,
          edad_rango: p.edad_rango,
          sexo: p.sexo,
          imagen: p.imagen,
          nombre: p.nombre,
          imc_representado: p.imc_representado || "no_aplica",
          estado: "pendiente",
        }));
        const ingredientesMapped: Ingrediente[] = ingredientesRes.data
          .filter((i: any) => i.imagen)
          .map((i: any) => ({
            id: i.pk_alimento,
            nombre: i.nombre,
            imagen: i.imagen,
            categoria: i.categoria,
            unidad: i.unidad,
            porcionDefault: i.porcion_default,
          }));
        setPersonajes(personajesMapped);
        setIngredientes(ingredientesMapped);
        if (personajesMapped[0]) seleccionarPersonaje(personajesMapped[0], personajesMapped);
      } catch {
        setMensajeError("Error al cargar los datos del juego.");
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, []);

  const seleccionarPersonaje = (personaje: PersonajeSintetico, source = personajes) => {
    if (enviandoDecisiones) return;
    if (ingredientesEnPlato.length > 0 && personajeActual && personaje.id !== personajeActual.id) {
      setMensajeError("Primero finaliza o limpia el plato actual antes de cambiar de personaje.");
      setTimeout(() => setMensajeError(""), 2500);
      return;
    }

    setIngredientesEnPlato([]);
    const updated = source.map((p) =>
      p.estado === "servido"
        ? p
        : p.id === personaje.id
          ? { ...p, estado: "en_curso" as EstadoPersonaje }
          : { ...p, estado: "pendiente" as EstadoPersonaje }
    );
    setPersonajes(updated);
    setPersonajeActual({ ...personaje, estado: "en_curso" });
    setEscenarioActual(escenarios[Math.floor(Math.random() * escenarios.length)]);
    tiempoInicioRef.current = Date.now();
  };

  const getDraggedIngredient = () => draggedIngredienteRef.current;
  const clearDraggedIngredient = () => { draggedIngredienteRef.current = null; };
  const getIngredienteById = (id: number) => ingredientes.find((i) => i.id === id);

  const onPlatoServido = async (componentesServidos: ComponenteServido[]) => {
    if (!personajeActual) return;
    const sesionId = auth.getSesionId();
    if (!sesionId) return;
    const payload: DecisionPayload = {
      sesion_id: sesionId,
      escenario: escenarioActual,
      personaje_tipo: personajeActual.tipo,
      personaje_edad_rango: personajeActual.edad_rango,
      personaje_sexo: personajeActual.sexo,
      personaje_imc_representado: personajeActual.imc_representado ?? null,
      personaje_id: personajeActual.id,
      componentes_servidos: componentesServidos,
      tiempo_decision_ms: Date.now() - tiempoInicioRef.current,
      orden_servicio: ordenServicioRef.current,
    };

    try {
      setEnviandoDecisiones(true);
      await api.registrarDecision(payload);
      ordenServicioRef.current += 1;
      const served = personajes.map((p) =>
        p.id === personajeActual.id ? { ...p, estado: "servido" as EstadoPersonaje } : p
      );
      setPersonajes(served);
      setMensajeExito(`¡Plato servido para ${personajeActual.nombre}!`);
      setIngredientesEnPlato([]);
      setTimeout(() => {
        const siguiente = served.find((p) => p.estado === "pendiente");
        if (siguiente) {
          seleccionarPersonaje(siguiente, served);
        } else {
          setJuegoCompletado(true);
          const sesion = auth.getSesionId();
          if (sesion) void api.finalizarSesion(sesion, { estado: "completada" });
          setTimeout(() => {
            auth.clearSession();
            navigate("/");
          }, 3000);
        }
      }, 1200);
    } catch {
      setMensajeError("Error al guardar el plato. Intenta nuevamente.");
    } finally {
      setEnviandoDecisiones(false);
      setTimeout(() => setMensajeExito(""), 2500);
      setTimeout(() => setMensajeError(""), 3500);
    }
  };

  const progreso = useMemo(() => {
    const servidos = personajes.filter((p) => p.estado === "servido").length;
    const total = personajes.length || 1;
    return { servidos, total, porcentaje: (servidos / total) * 100 };
  }, [personajes]);

  if (loading) return <div className="loading-overlay"><div className="loading-spinner" /><p className="font-text">Cargando datos del juego...</p></div>;

  return (
    <div className="game-container">
      <header className="game-header">
        <h1 className="font-title font-title-watermelon">Sirve la Mesa</h1>
        <div className="escenario-info">
          <span className="font-text">Estás sirviendo: <strong>{escenarioActual[0].toUpperCase() + escenarioActual.slice(1)}</strong></span>
        </div>
        <div className="participante-info">
          <span className="font-text">Participante #{participante?.pk_participante}</span>
        </div>
      </header>

      <div className="mensajes-container">
        {mensajeExito && <div className="mensaje-exito font-text">{mensajeExito}</div>}
        {mensajeError && <div className="mensaje-error font-text">{mensajeError}</div>}
      </div>

      {!juegoCompletado && (
        <div className="game-content">
          <aside className="personajes-panel">
            <h2 className="font-title font-title-watermelon">Personajes</h2>
            <PersonajesPanel personajes={personajes} personajeActual={personajeActual} onSeleccionar={(p) => seleccionarPersonaje(p)} />
          </aside>

          <div className="game-main-column">
            <div className="mesa-servicio" aria-label="Área de servicio">
              {personajeActual && <div className="personaje-actual-info"><h3 className="font-title font-title-watermelon">Sirviendo a: <span className="font-text">{personajeActual.nombre}</span></h3></div>}
              <div className="plato-area plato-area--play">
                <PlatoDropZone
                  personajeActual={personajeActual}
                  ingredientesEnPlato={ingredientesEnPlato}
                  onIngredienteAgregado={(item) => setIngredientesEnPlato((prev) => [...prev, item])}
                  onIngredienteEliminado={(index) => setIngredientesEnPlato((prev) => prev.filter((_, i) => i !== index))}
                  onLimpiarPlato={() => setIngredientesEnPlato([])}
                  onServirPlato={onPlatoServido}
                  getDraggedIngredient={getDraggedIngredient}
                  getIngredienteById={getIngredienteById}
                  clearDraggedIngredient={clearDraggedIngredient}
                />
              </div>
            </div>

            <aside className="ingredientes-panel ingredientes-panel--below" aria-label="Alimentos por categoría">
              <h2 className="ingredientes-panel__titulo font-title font-title-watermelon">Alimentos</h2>
              <IngredientesPanel
                ingredientes={ingredientes}
                onDragStart={(i) => { draggedIngredienteRef.current = i; }}
                onDragEnd={clearDraggedIngredient}
                onSeleccionar={(ingrediente) => {
                  const size = 88;
                  const angle = Math.random() * 2 * Math.PI;
                  const radius = Math.random() * 35;
                  const x = 50 + (radius * Math.cos(angle));
                  const y = 50 + (radius * Math.sin(angle));
                  setIngredientesEnPlato((prev) => [...prev, {
                    ingrediente, cantidad: ingrediente.porcionDefault, unidad: ingrediente.unidad,
                    x: Math.max(18, Math.min(82, x)),
                    y: Math.max(18, Math.min(82, y)),
                    size, rotation: Math.floor(Math.random() * 30) - 15,
                  }]);
                }}
              />
            </aside>
          </div>
        </div>
      )}

      {juegoCompletado && (
        <div className="juego-completado">
          <div className="completado-content">
            <h1 className="font-title">¡Felicidades!</h1>
            <p className="font-text">Has completado el juego exitosamente</p>
            <p className="font-text">Gracias por participar en nuestro estudio</p>
            {enviandoDecisiones && <div className="loading-spinner" />}
          </div>
        </div>
      )}

      <div className="progreso-container">
        <div className="progreso-personajes">
          <span className="font-text">Progreso: {progreso.servidos} / {progreso.total} personajes servidos</span>
          <div className="barra-progreso"><div className="barra-progreso-fill" style={{ width: `${progreso.porcentaje}%` }} /></div>
        </div>
      </div>
    </div>
  );
}
