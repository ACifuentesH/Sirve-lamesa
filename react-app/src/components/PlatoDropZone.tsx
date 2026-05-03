import { useMemo, useRef, useState } from "react";
import type { ComponenteServido, Ingrediente, IngredienteEnPlato, PersonajeSintetico } from "../types/game";
import { personajeImagenSrc } from "../utils/personajeAssets";

interface Props {
  personajeActual: PersonajeSintetico | null;
  ingredientesEnPlato: IngredienteEnPlato[];
  onIngredienteAgregado: (ingrediente: IngredienteEnPlato) => void;
  onIngredienteEliminado: (index: number) => void;
  onLimpiarPlato: () => void;
  onServirPlato: (componentes: ComponenteServido[]) => void;
  getDraggedIngredient: () => Ingrediente | null;
  getIngredienteById: (id: number) => Ingrediente | undefined;
  clearDraggedIngredient: () => void;
}

const tamanosVisuales: Record<string, number> = {
  Pollo: 50, Bistecs: 55, Huevo: 45, Tocineta: 45, Arroz: 45, "Plátano": 48, Papa: 45, Pasta: 48, Granos: 45,
  Pan: 50, Tomate: 38, Lechuga: 42, "Brócoli": 45, Zanahoria: 48, Pepino: 40, Naranja: 45, Lechosa: 50, Cambur: 45, Fresa: 40, "Piña": 55,
};

export function PlatoDropZone({
  personajeActual,
  ingredientesEnPlato,
  onIngredienteAgregado,
  onIngredienteEliminado,
  onLimpiarPlato,
  onServirPlato,
  getDraggedIngredient,
  getIngredienteById,
  clearDraggedIngredient,
}: Props) {
  const plateImageRef = useRef<HTMLImageElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const personajeImagen = useMemo(() => personajeImagenSrc(personajeActual?.imagen), [personajeActual?.imagen]);

  const getPlateRect = () => plateImageRef.current?.getBoundingClientRect() ?? null;

  const validateAndConvert = (x: number, y: number, plateRect: DOMRect, size: number) => {
    const centerX = plateRect.width / 2;
    const centerY = plateRect.height / 2;
    const radius = Math.min(plateRect.width, plateRect.height) / 2 * 0.85;
    const distance = Math.hypot(x - centerX, y - centerY);
    if (distance + size / 2 > radius) return null;
    return { x: (x / plateRect.width) * 100, y: (y / plateRect.height) * 100 };
  };

  const crearIngredienteEnPlato = (ingrediente: Ingrediente, pointer?: { x: number; y: number }): IngredienteEnPlato | null => {
    const plateRect = getPlateRect();
    if (!plateRect) return null;
    const size = Math.round((tamanosVisuales[ingrediente.nombre] ?? 45) * 2.5);
    let pos: { x: number; y: number } | null = null;

    if (pointer) {
      pos = validateAndConvert(pointer.x - plateRect.left, pointer.y - plateRect.top, plateRect, size);
    }
    if (!pos) {
      for (let i = 0; i < 120; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.random() * (Math.min(plateRect.width, plateRect.height) / 2 - size / 2 - 10);
        const x = plateRect.width / 2 + radius * Math.cos(angle);
        const y = plateRect.height / 2 + radius * Math.sin(angle);
        pos = validateAndConvert(x, y, plateRect, size);
        if (pos) break;
      }
    }
    if (!pos) return null;

    return {
      ingrediente,
      cantidad: ingrediente.porcionDefault,
      unidad: ingrediente.unidad,
      x: pos.x,
      y: pos.y,
      size,
      rotation: Math.floor(Math.random() * 30) - 15,
    };
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const ingredienteIdRaw =
      event.dataTransfer.getData("application/x-ingrediente-id") || event.dataTransfer.getData("text/plain");
    const ingredienteId = Number(ingredienteIdRaw);
    const ingredienteFromDataTransfer = Number.isFinite(ingredienteId) ? getIngredienteById(ingredienteId) : undefined;
    const ingrediente = ingredienteFromDataTransfer ?? getDraggedIngredient();
    if (!ingrediente) return;
    const nuevo = crearIngredienteEnPlato(ingrediente, { x: event.clientX, y: event.clientY });
    if (nuevo) onIngredienteAgregado(nuevo);
    clearDraggedIngredient();
  };

  const cantidadTotal = ingredientesEnPlato.reduce((total, item) => {
    if (item.unidad === "gramos") return total + item.cantidad;
    if (item.unidad === "unidad" || item.unidad === "unidades") {
      const pesos: Record<string, number> = { Huevo: 50, Naranja: 150, Cambur: 120 };
      return total + item.cantidad * (pesos[item.ingrediente.nombre] ?? 100);
    }
    if (item.unidad === "rebanadas") {
      const pesos: Record<string, number> = { Pan: 30, Tomate: 25, Lechosa: 80, "Piña": 60 };
      return total + item.cantidad * (pesos[item.ingrediente.nombre] ?? 30);
    }
    return total;
  }, 0);

  const servirPlato = () => {
    if (!ingredientesEnPlato.length) return;
    const componentes = ingredientesEnPlato.map((item) => {
      let cantidad = item.cantidad;
      if (item.unidad === "unidad" || item.unidad === "unidades") {
        const pesos: Record<string, number> = { Huevo: 50, Naranja: 150, Cambur: 120 };
        cantidad = item.cantidad * (pesos[item.ingrediente.nombre] ?? 100);
      } else if (item.unidad === "rebanadas") {
        const pesos: Record<string, number> = { Pan: 30, Tomate: 25, Lechosa: 80, "Piña": 60 };
        cantidad = item.cantidad * (pesos[item.ingrediente.nombre] ?? 30);
      }
      return {
        componente_id: item.ingrediente.id,
        nombre: item.ingrediente.nombre,
        cantidad_gramos: cantidad,
        imagen: item.ingrediente.imagen,
      };
    });
    onServirPlato(componentes);
  };

  return (
    <div className="scene-wrapper">
      <div className="scene-container">
        <div className="table-scene">
          <div className="table-container">
            <div className="table-with-mantel">
              {personajeImagen && <img src={personajeImagen} alt="Personaje" className="personaje-image" />}
              <img src="/assets/images/ingredientes/mesa.png" alt="Mesa" className="mesa-image" />
              <img src="/assets/images/ingredientes/mantel.png" alt="Mantel" className="mantel-image" />
              <div className={`plate-container ${isDragOver ? "drag-over" : ""}`}>
                <img ref={plateImageRef} src="/assets/images/ingredientes/plato.png" alt="Plato" className="plate-image" />
                <div
                  className="plate-area"
                  onDrop={handleDrop}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "copy";
                    setIsDragOver(true);
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                  }}
                />
                {ingredientesEnPlato.map((item, i) => (
                  <div
                    key={`${item.ingrediente.id}-${i}`}
                    className="food-on-plate"
                    style={{
                      left: `${item.x}%`,
                      top: `${item.y}%`,
                      width: `${item.size}px`,
                      height: `${item.size}px`,
                      transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                    }}
                    onClick={() => onIngredienteEliminado(i)}
                    title={`Eliminar ${item.ingrediente.nombre}`}
                  >
                    <img src={`/assets/images/ingredientes/${item.ingrediente.imagen}`} alt={item.ingrediente.nombre} data-imagen={item.ingrediente.imagen} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="button-container">
        <div className="cantidad-total font-text">
          <span className="label">Total aproximado:</span>
          <span className="value">{Math.round(cantidadTotal)} g</span>
        </div>
        <button className="btn clear-plate-btn font-text" type="button" onClick={onLimpiarPlato}>
          Limpiar Plato
        </button>
        <button className="btn btn-primary font-text" type="button" onClick={servirPlato} disabled={!ingredientesEnPlato.length}>
          Finalizar Plato
        </button>
      </div>
    </div>
  );
}
