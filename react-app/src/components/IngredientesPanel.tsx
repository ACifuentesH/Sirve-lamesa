import type { Ingrediente } from "../types/game";

const categorias = [
  { id: "proteina", nombre: "Proteínas", icono: "🥩" },
  { id: "carbohidrato", nombre: "Carbohidratos", icono: "🍞" },
  { id: "vegetal", nombre: "Vegetales", icono: "🥕" },
  { id: "fruta", nombre: "Frutas", icono: "🍎" },
];

interface Props {
  ingredientes: Ingrediente[];
  onDragStart: (ingrediente: Ingrediente) => void;
  onDragEnd: () => void;
  onSeleccionar: (ingrediente: Ingrediente) => void;
}

export function IngredientesPanel({ ingredientes, onDragStart, onDragEnd, onSeleccionar }: Props) {
  const byCategory = (categoriaId: string) =>
    ingredientes.filter((i) => (i.categoria || "").trim().toLowerCase() === categoriaId);

  return (
    <div className="ingredientes-alacena">
      {categorias.map((cat) => (
        <section
          className={`categoria-seccion categoria-seccion--${cat.id}`}
          key={cat.id}
          aria-labelledby={`cat-${cat.id}`}
        >
          <header className="categoria-seccion__header" id={`cat-${cat.id}`}>
            <span className="categoria-seccion__icon">{cat.icono}</span>
            <span className="categoria-seccion__titulo font-text">{cat.nombre}</span>
          </header>
          <div className="categoria-seccion__items">
            {byCategory(cat.id).map((ingrediente) => (
              <div
                key={ingrediente.id}
                className="food-item"
                draggable
                onDragStart={(event) => {
                  onDragStart(ingrediente);
                  event.dataTransfer.effectAllowed = "copy";
                  event.dataTransfer.setData("application/x-ingrediente-id", String(ingrediente.id));
                  event.dataTransfer.setData("text/plain", String(ingrediente.id));
                  const img = (event.currentTarget.querySelector("img") as HTMLImageElement | null);
                  if (img) {
                    event.dataTransfer.setDragImage(img, img.width / 2, img.height / 2);
                  }
                }}
                onDragEnd={onDragEnd}
                onClick={() => onSeleccionar(ingrediente)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSeleccionar(ingrediente)}
                role="button"
                tabIndex={0}
                aria-label={`Agregar ${ingrediente.nombre}`}
              >
                <img
                  src={`/assets/images/ingredientes/${ingrediente.imagen}`}
                  alt={ingrediente.nombre}
                  data-imagen={ingrediente.imagen}
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
      {!ingredientes.length && <p className="ingredientes-alacena__vacio font-text">No hay alimentos disponibles</p>}
    </div>
  );
}
