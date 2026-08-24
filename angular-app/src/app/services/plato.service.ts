import { Injectable, signal } from '@angular/core';
import {
  AlimentoCatalogo,
  AlimentoServido,
  BebidaServida,
  EventoClic,
  ItemPlato,
  ResultadoPlato
} from '../models/contrato';
import { elegirCuadrante, slotEnCuadrante } from '../utils/plato-cuadrantes';

const TOPE_PORCIONES = 4;

export interface BebidaEnPlato {
  alimento: AlimentoCatalogo;
  porciones: number;
}

/**
 * Estado vivo del plato (Vía B, B6–B9).
 *
 * Una sola fuente para menú, canvas, bebida y el payload: si cada componente
 * llevara su copia, el menú podría marcar 2 porciones y el canvas mostrar 3, y el
 * envío saldría distinto de lo que el participante vio.
 *
 * Al quitar un alimento no se reorganizan los demás. Mover comida ya servida
 * desconcierta y podría alterar la percepción de cantidad (§5.1).
 */
@Injectable({ providedIn: 'root' })
export class PlatoService {
  private inicioMs = 0;
  private fechaInicioIso = '';
  private readonly catalogo = new Map<number, AlimentoCatalogo>();

  readonly items = signal<ItemPlato[]>([]);
  readonly bebida = signal<BebidaEnPlato | null>(null);
  readonly secuencia = signal<EventoClic[]>([]);
  readonly tocados = signal<ReadonlySet<number>>(new Set());

  iniciarTarea(): void {
    this.inicioMs = Date.now();
    this.fechaInicioIso = new Date().toISOString();
    this.items.set([]);
    this.bebida.set(null);
    this.secuencia.set([]);
    this.tocados.set(new Set());
  }

  get fechaInicio(): string {
    return this.fechaInicioIso;
  }

  registrarCatalogo(alimentos: AlimentoCatalogo[]): void {
    for (const alimento of alimentos) {
      this.catalogo.set(alimento.id, alimento);
    }
  }

  alimentoPorId(id: number): AlimentoCatalogo | undefined {
    return this.catalogo.get(id);
  }

  porcionesDe(id: number): number {
    const bebida = this.bebida();
    if (bebida?.alimento.id === id) {
      return bebida.porciones;
    }
    return this.items().find(item => item.alimento_id === id)?.porciones ?? 0;
  }

  enTope(alimento: AlimentoCatalogo): boolean {
    return this.porcionesDe(alimento.id) >= TOPE_PORCIONES;
  }

  /**
   * Plato vacío según la §5.4: la bebida sola no cuenta. El análisis es de
   * porcionamiento de comida; un vaso sin plato no es una respuesta.
   */
  get estaVacio(): boolean {
    return this.items().length === 0;
  }

  agregar(alimento: AlimentoCatalogo): void {
    if (this.enTope(alimento) && !alimento.es_bebida) {
      return;
    }
    if (alimento.es_bebida) {
      const actual = this.bebida();
      if (actual && actual.alimento.id === alimento.id && actual.porciones >= TOPE_PORCIONES) {
        return;
      }
    }

    this.marcarTocado(alimento.id);
    this.registrarClic(alimento.slug, 'agregar');

    if (alimento.es_bebida) {
      this.agregarBebida(alimento);
    } else {
      this.agregarComida(alimento);
    }
  }

  quitar(alimento: AlimentoCatalogo): void {
    if (this.porcionesDe(alimento.id) <= 0) {
      return;
    }

    this.registrarClic(alimento.slug, 'quitar');

    if (alimento.es_bebida) {
      const actual = this.bebida();
      if (!actual) {
        return;
      }
      if (actual.porciones <= 1) {
        this.bebida.set(null);
      } else {
        this.bebida.set({ ...actual, porciones: actual.porciones - 1 });
      }
      return;
    }

    const actuales = this.items();
    const indice = actuales.findIndex(item => item.alimento_id === alimento.id);
    if (indice === -1) {
      return;
    }

    const item = actuales[indice];
    const unitario = this.catalogo.get(item.alimento_id)?.peso_gramos
      ?? item.peso_total_g / item.porciones;
    if (item.porciones <= 1) {
      // Se elimina sin reordenar: los cuadrantes de los que quedan no se tocan.
      this.items.set(actuales.filter((_, i) => i !== indice));
    } else {
      const copia = actuales.slice();
      copia[indice] = {
        ...item,
        porciones: item.porciones - 1,
        peso_total_g: (item.porciones - 1) * unitario
      };
      this.items.set(copia);
    }
  }

  registrarCambioPestana(pestana: string): void {
    this.secuencia.update(eventos => [
      ...eventos,
      {
        timestamp_ms: this.ahoraRelativo(),
        alimento_slug: null,
        accion: 'cambio_pestana',
        pestana
      }
    ]);
  }

  /**
   * Segundos con un decimal, desde el montaje hasta el clic en "Sí, enviar
   * porción" (§B9). Se redondea al décimo más cercano.
   */
  tiempoDecisionSegundos(): number {
    return Math.round((Date.now() - this.inicioMs) / 100) / 10;
  }

  compilarResultado(): ResultadoPlato {
    const alimentos: AlimentoServido[] = this.items().map(item => {
      const cat = this.catalogo.get(item.alimento_id);
      if (!cat) {
        throw new Error(`Alimento ${item.alimento_id} no está en el catálogo cargado.`);
      }
      return {
        alimento_id: item.alimento_id,
        slug: item.slug,
        nombre: cat.nombre,
        tipo: cat.tipo,
        grupo: cat.grupo,
        porciones: item.porciones,
        unidad_display: cat.unidad_display,
        peso_unitario_g: cat.peso_gramos,
        peso_total_g: item.peso_total_g,
        cuadrante: item.cuadrante
      };
    });

    const estadoBebida = this.bebida();
    const bebida: BebidaServida | null = estadoBebida
      ? {
          alimento_id: estadoBebida.alimento.id,
          slug: estadoBebida.alimento.slug,
          nombre: estadoBebida.alimento.nombre,
          porciones: estadoBebida.porciones,
          volumen_ml: estadoBebida.porciones * estadoBebida.alimento.peso_gramos
        }
      : null;

    return {
      alimentos,
      bebida,
      total_plato_gramos: alimentos.reduce((suma, a) => suma + a.peso_total_g, 0),
      total_bebida_ml: bebida?.volumen_ml ?? 0
    };
  }

  secuenciaClics(): EventoClic[] {
    return this.secuencia();
  }

  private agregarComida(alimento: AlimentoCatalogo): void {
    const actuales = this.items();
    const indice = actuales.findIndex(item => item.alimento_id === alimento.id);

    if (indice >= 0) {
      const item = actuales[indice];
      const porciones = item.porciones + 1;
      const copia = actuales.slice();
      copia[indice] = {
        ...item,
        porciones,
        peso_total_g: porciones * alimento.peso_gramos
      };
      this.items.set(copia);
      return;
    }

    const cuadrante = elegirCuadrante(actuales);
    const nuevo: ItemPlato = {
      alimento_id: alimento.id,
      slug: alimento.slug,
      porciones: 1,
      peso_total_g: alimento.peso_gramos,
      cuadrante,
      offset_index: slotEnCuadrante(actuales, cuadrante)
    };
    this.items.set([...actuales, nuevo]);
  }

  private agregarBebida(alimento: AlimentoCatalogo): void {
    const actual = this.bebida();
    if (!actual || actual.alimento.id !== alimento.id) {
      // Elegir otra bebida reemplaza la anterior; no se suman (§5.2).
      this.bebida.set({ alimento, porciones: 1 });
      return;
    }
    this.bebida.set({ alimento, porciones: actual.porciones + 1 });
  }

  private marcarTocado(id: number): void {
    if (this.tocados().has(id)) {
      return;
    }
    const siguiente = new Set(this.tocados());
    siguiente.add(id);
    this.tocados.set(siguiente);
  }

  private registrarClic(slug: string, accion: 'agregar' | 'quitar'): void {
    this.secuencia.update(eventos => [
      ...eventos,
      {
        timestamp_ms: this.ahoraRelativo(),
        alimento_slug: slug,
        accion
      }
    ]);
  }

  private ahoraRelativo(): number {
    return Date.now() - this.inicioMs;
  }
}
