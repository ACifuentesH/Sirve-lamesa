import {
  Component, OnInit, AfterViewInit, OnDestroy,
  ViewChild, ElementRef, ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import * as XLSX from 'xlsx';
import { ApiService } from '../../services/api.service';
import { InvestigadorService } from '../../services/investigador.service';
import { MOMENTOS_DIA, TIPOS_ALIMENTO } from '../../models/contrato';
import {
  ENCABEZADOS,
  ExportRow,
  FilaVista,
  buildExportRows,
  comoArreglo,
  parseAlimentos
} from '../../utils/research-export';

Chart.register(...registerables);

interface Filters {
  participanteGenero: string;
  participanteEdad: string;
  participanteIMC: string;
  nivelEstudios: string;
  etnia: string;
  regionOrigen: string;
  regionResidencia: string;
  personajePerfil: string;
  personajeGenero: string;
  momentoDia: string;
}

const PALETTE = ['#1e5fa8', '#164a85', '#6b7280', '#2e7d32', '#b3261e', '#4b7bb8', '#9ca3af', '#1f2937'];

const CAT_COLOR: Record<string, string> = {
  proteina: '#EF6F3C',
  carbohidrato: '#52A5CE',
  vegetal: '#6B9B7A',
  fruta: '#FF7BAC',
  lacteo: '#F5C842',
  otro: '#9B8EC4'
};

const CAT_LABEL: Record<string, string> = {
  proteina: 'Proteína',
  carbohidrato: 'Carbohidrato',
  vegetal: 'Vegetal',
  fruta: 'Fruta',
  lacteo: 'Lácteo',
  otro: 'Otro'
};

const PERFIL_ORDEN = ['Niño', 'Niña', 'Joven', 'Adulto', 'Adulto Mayor'];
const BANDAS_EDAD = ['7-9', '14-16', '30-40', '70-75'];
const EDAD_PART_RANGOS = ['<18', '18-25', '26-35', '36-50', '51+'];

const GENERO_PART_LABEL: Record<string, string> = {
  masculino: 'Masculino',
  femenino: 'Femenino',
  no_binario: 'No binario',
  prefiero_no_decir: 'Prefiere no decir',
  M: 'Masculino',
  F: 'Femenino'
};

const GENERO_PERS_LABEL: Record<string, string> = {
  M: 'Personaje masculino',
  F: 'Personaje femenino'
};

const NIVEL_LABEL: Record<string, string> = {
  pregrado_curso: 'Pregrado en curso',
  pregrado_completo: 'Pregrado completo',
  posgrado: 'Posgrado',
  otro: 'Otro'
};

const ETNIA_LABEL: Record<string, string> = {
  latino_hispano: 'Latino o Hispano',
  afrodescendiente: 'Afrodescendiente',
  indigena: 'Indígena',
  blanco: 'Blanco',
  otro: 'Otro'
};

/**
 * Panel de análisis (A8 / issue #13).
 *
 * Lee la vista respuestas_experimento, igual que el CSV. El gráfico central es el
 * cruce género del participante × género del personaje: es la hipótesis del estudio.
 * El IMC del personaje ya no se grafica: la matriz nueva no lo representa.
 */
@Component({
  selector: 'app-investigador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './investigador.component.html',
  styleUrls: ['./investigador.component.scss']
})
export class InvestigadorComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly investigador = inject(InvestigadorService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  error = '';
  activeTab = 'graficos';
  chartsReady = false;

  rawData: FilaVista[] = [];
  filteredData: FilaVista[] = [];

  filters: Filters = {
    participanteGenero: '',
    participanteEdad: '',
    participanteIMC: '',
    nivelEstudios: '',
    etnia: '',
    regionOrigen: '',
    regionResidencia: '',
    personajePerfil: '',
    personajeGenero: '',
    momentoDia: ''
  };
  participanteEdadRangos: string[] = [];
  generosParticipante: string[] = [];
  momentosPresentes: string[] = [];
  nivelesPresentes: string[] = [];
  etniasPresentes: string[] = [];
  regionesPresentes: string[] = [];
  regionesResidenciaPresentes: string[] = [];
  perfilesPresentes: string[] = [];

  stats = {
    decisiones: 0,
    participantes: 0,
    sesiones: 0,
    promedioGramos: 0,
    promedioTiempoDecisionSeg: 0,
    promedioDuracionSesionSeg: 0,
    promedioBebidaMl: 0
  };

  tablePage = 0;
  readonly PAGE_SIZE = 20;

  readonly tabs = [
    { id: 'graficos', label: 'Gráficos' },
    { id: 'datos', label: 'Datos' }
  ];

  @ViewChild('cruceGeneroChart') cruceGeneroRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('perfilEdadChart') perfilEdadRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('generoPersChart') generoPersRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('perfilYGeneroChart') perfilYGeneroRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('momentoChart') momentoRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('catSexoPerChart') catSexoPerRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('catPerfilChart') catPerfilRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('catChart') catRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('partGeneroChart') partGeneroRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('rankingChart') rankingRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('imcPartChart') imcPartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tiempoPerfilChart') tiempoPerfilRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tiempoGeneroChart') tiempoGeneroRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ordenServicioChart') ordenServicioRef!: ElementRef<HTMLCanvasElement>;

  private charts: Record<string, Chart> = {};

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.chartsReady = true;
    if (!this.loading) {
      this.renderCharts();
    }
  }

  ngOnDestroy(): void {
    Object.values(this.charts).forEach(c => c.destroy());
  }

  loadData(): void {
    this.loading = true;
    this.error = '';
    this.api.obtenerDatosInvestigador().subscribe({
      next: res => {
        this.rawData = res.data ?? [];
        this.buildFilterOptions();
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
        if (this.chartsReady) {
          this.renderCharts();
        }
      },
      error: () => {
        this.error = 'No se pudieron cargar los datos. Inicia sesión como investigador autorizado.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  buildFilterOptions(): void {
    this.participanteEdadRangos = EDAD_PART_RANGOS.filter(r =>
      this.rawData.some(d => this.partEdadRange(Number(d.participante_edad) || 0) === r)
    );
    this.generosParticipante = [...new Set(
      this.rawData.map(d => d.participante_genero).filter((g): g is string => !!g)
    )].sort();
    this.momentosPresentes = MOMENTOS_DIA.filter(m =>
      this.rawData.some(d => d.momento_dia === m)
    );
    this.nivelesPresentes = [...new Set(
      this.rawData.map(d => d.participante_nivel_estudios).filter((n): n is string => !!n)
    )].sort();
    this.etniasPresentes = [...new Set(
      this.rawData.map(d => d.participante_etnia).filter((e): e is string => !!e)
    )].sort();
    this.regionesPresentes = [...new Set(
      this.rawData.map(d => d.participante_region_origen).filter((r): r is string => !!r)
    )].sort();
    this.regionesResidenciaPresentes = [...new Set(
      this.rawData.map(d => d.participante_region_residencia).filter((r): r is string => !!r)
    )].sort();
    const perfiles = [...new Set(this.rawData.map(d => this.perfilDe(d)))];
    this.perfilesPresentes = [
      ...PERFIL_ORDEN.filter(p => perfiles.includes(p)),
      ...perfiles.filter(p => !PERFIL_ORDEN.includes(p) && p !== 'Sin perfil')
    ];
  }

  applyFilters(): void {
    const f = this.filters;
    this.filteredData = this.rawData.filter(d => {
      if (f.participanteGenero && d.participante_genero !== f.participanteGenero) {
        return false;
      }
      if (f.participanteEdad) {
        if (this.partEdadRange(Number(d.participante_edad) || 0) !== f.participanteEdad) {
          return false;
        }
      }
      if (f.participanteIMC) {
        const imc = Number(d.participante_imc) || 0;
        if (f.participanteIMC === 'bajo' && imc >= 18.5) return false;
        if (f.participanteIMC === 'normal' && (imc < 18.5 || imc >= 25)) return false;
        if (f.participanteIMC === 'sobrepeso' && (imc < 25 || imc >= 30)) return false;
        if (f.participanteIMC === 'obesidad' && imc < 30) return false;
      }
      if (f.nivelEstudios && d.participante_nivel_estudios !== f.nivelEstudios) {
        return false;
      }
      if (f.etnia && d.participante_etnia !== f.etnia) {
        return false;
      }
      if (f.regionOrigen && d.participante_region_origen !== f.regionOrigen) {
        return false;
      }
      if (f.regionResidencia && d.participante_region_residencia !== f.regionResidencia) {
        return false;
      }
      if (f.personajePerfil && this.perfilDe(d) !== f.personajePerfil) {
        return false;
      }
      if (f.personajeGenero && d.personaje_genero !== f.personajeGenero) {
        return false;
      }
      if (f.momentoDia && d.momento_dia !== f.momentoDia) {
        return false;
      }
      return true;
    });
    this.computeStats();
    this.tablePage = 0;
    if (this.chartsReady) {
      this.renderCharts();
    }
  }

  resetFilters(): void {
    this.filters = {
      participanteGenero: '',
      participanteEdad: '',
      participanteIMC: '',
      nivelEstudios: '',
      etnia: '',
      regionOrigen: '',
      regionResidencia: '',
      personajePerfil: '',
      personajeGenero: '',
      momentoDia: ''
    };
    this.applyFilters();
  }

  computeStats(): void {
    const d = this.filteredData;
    this.stats.decisiones = d.length;
    this.stats.participantes = new Set(d.map(x => x.participante_id)).size;
    this.stats.sesiones = new Set(d.map(x => x.sesion_id)).size;
    this.stats.promedioGramos = this.avgGramos(d);

    const tiempos = d
      .map(x => Number(x.tiempo_decision_segundos))
      .filter(n => Number.isFinite(n) && n >= 0);
    this.stats.promedioTiempoDecisionSeg = tiempos.length
      ? tiempos.reduce((a, b) => a + b, 0) / tiempos.length
      : 0;

    const duracionPorSesion = new Map<number, number>();
    d.forEach(row => {
      const tiempo = Number(row.duracion_total_segundos);
      if (!Number.isFinite(row.sesion_id) || !Number.isFinite(tiempo) || tiempo < 0) {
        return;
      }
      if (!duracionPorSesion.has(row.sesion_id)) {
        duracionPorSesion.set(row.sesion_id, tiempo);
      }
    });
    const duraciones = [...duracionPorSesion.values()];
    this.stats.promedioDuracionSesionSeg = duraciones.length
      ? duraciones.reduce((a, b) => a + b, 0) / duraciones.length
      : 0;

    const bebidas = d
      .map(x => Number(x.total_bebida_ml))
      .filter(n => Number.isFinite(n) && n > 0);
    this.stats.promedioBebidaMl = bebidas.length
      ? bebidas.reduce((a, b) => a + b, 0) / bebidas.length
      : 0;
  }

  private groupBy(data: FilaVista[], key: keyof FilaVista): Map<string, FilaVista[]> {
    const m = new Map<string, FilaVista[]>();
    data.forEach(d => {
      const k = String(d[key] ?? 'Sin datos');
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(d);
    });
    return m;
  }

  private avgGramos(items: FilaVista[]): number {
    const v = items.map(d => Number(d.total_plato_gramos) || 0).filter(g => g > 0);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  }

  private partEdadRange(edad: number): string {
    if (edad < 18) return '<18';
    if (edad <= 25) return '18-25';
    if (edad <= 35) return '26-35';
    if (edad <= 50) return '36-50';
    return '51+';
  }

  private perfilDe(d: FilaVista): string {
    return d.personaje_perfil_edad || d.personaje_edad_rango || 'Sin perfil';
  }

  private foodStats(): { categorias: { cat: string; count: number; total: number }[] } {
    const catMap = new Map<string, { count: number; total: number }>();

    this.filteredData.forEach(d => {
      parseAlimentos(d.componentes_servidos).forEach(c => {
        const e = catMap.get(c.tipo) ?? { count: 0, total: 0 };
        e.count++;
        e.total += c.gramos;
        catMap.set(c.tipo, e);
      });
    });

    return {
      categorias: [...catMap.entries()].map(([cat, v]) => ({ cat, ...v }))
    };
  }

  private upsert(key: string, ref: ElementRef<HTMLCanvasElement> | undefined, cfg: ChartConfiguration): void {
    if (!ref?.nativeElement) return;
    if (this.charts[key]) {
      this.charts[key].data.labels = cfg.data.labels;
      this.charts[key].data.datasets = cfg.data.datasets;
      this.charts[key].update('none');
    } else {
      this.charts[key] = new Chart(ref.nativeElement, cfg);
    }
  }

  renderCharts(): void {
    this.chartCruceGenero();
    this.chartPerfilEdad();
    this.chartGeneroPersonaje();
    this.chartPerfilYGenero();
    this.chartMomento();
    this.chartCatPorSexoPersonaje();
    this.chartCatPorPerfil();
    const { categorias } = this.foodStats();
    this.chartCategorias(categorias);
    this.chartPartGenero();
    this.chartRankingPersonajes();
    this.chartImcParticipante();
    this.chartTiempoPerfil();
    this.chartTiempoGenero();
    this.chartOrdenServicio();
  }

  /** Hipótesis central: cuánto se sirve según el cruce de géneros. */
  private chartCruceGenero(): void {
    const pers = ['M', 'F'];
    const parts = this.generosEnDatos();
    const datasets = parts.map((g, i) => ({
      label: this.generoPartLabel(g),
      data: pers.map(p =>
        Math.round(this.avgGramos(this.filteredData.filter(
          d => d.personaje_genero === p && d.participante_genero === g
        )))
      ),
      backgroundColor: PALETTE[i % PALETTE.length]
    }));

    this.upsert('cruceGenero', this.cruceGeneroRef, {
      type: 'bar',
      data: {
        labels: pers.map(p => GENERO_PERS_LABEL[p] ?? p),
        datasets: datasets.length ? datasets : [{ label: 'Sin datos', data: [0, 0], backgroundColor: PALETTE[0] }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'g promedio / decisión' } } }
      }
    });
  }

  private chartPerfilEdad(): void {
    const presentes = [...new Set(this.filteredData.map(d => this.perfilDe(d)))];
    const labels = [
      ...PERFIL_ORDEN.filter(p => presentes.includes(p)),
      ...presentes.filter(p => !PERFIL_ORDEN.includes(p))
    ];
    this.upsert('perfilEdad', this.perfilEdadRef, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Promedio (g)',
          data: labels.map(r => Math.round(this.avgGramos(this.filteredData.filter(d => this.perfilDe(d) === r)))),
          backgroundColor: PALETTE[0]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  private chartGeneroPersonaje(): void {
    const labels = ['M', 'F'];
    this.upsert('generoPers', this.generoPersRef, {
      type: 'bar',
      data: {
        labels: labels.map(g => GENERO_PERS_LABEL[g]),
        datasets: [{
          label: 'Promedio (g)',
          data: labels.map(g => Math.round(this.avgGramos(this.filteredData.filter(d => d.personaje_genero === g)))),
          backgroundColor: [PALETTE[0], PALETTE[2]]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  private chartMomento(): void {
    this.upsert('momento', this.momentoRef, {
      type: 'bar',
      data: {
        labels: MOMENTOS_DIA.map(m => this.momentoLabel(m)),
        datasets: [{
          label: 'Promedio (g)',
          data: MOMENTOS_DIA.map(m => Math.round(this.avgGramos(this.filteredData.filter(d => d.momento_dia === m)))),
          backgroundColor: PALETTE[3]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  private chartCatPorSexoPersonaje(): void {
    const countM = this.filteredData.filter(d => d.personaje_genero === 'M').length || 1;
    const countF = this.filteredData.filter(d => d.personaje_genero === 'F').length || 1;
    const totM: Record<string, number> = Object.fromEntries(TIPOS_ALIMENTO.map(c => [c, 0]));
    const totF: Record<string, number> = Object.fromEntries(TIPOS_ALIMENTO.map(c => [c, 0]));

    this.filteredData.forEach(d => {
      const dest = d.personaje_genero === 'M' ? totM : d.personaje_genero === 'F' ? totF : null;
      if (!dest) return;
      parseAlimentos(d.componentes_servidos).forEach(c => {
        if (c.tipo in dest) dest[c.tipo] += c.gramos;
      });
    });

    this.upsert('catSexoPer', this.catSexoPerRef, {
      type: 'bar',
      data: {
        labels: TIPOS_ALIMENTO.map(c => CAT_LABEL[c]),
        datasets: [
          { label: 'Personaje masculino', data: TIPOS_ALIMENTO.map(c => Math.round(totM[c] / countM)), backgroundColor: PALETTE[0] },
          { label: 'Personaje femenino', data: TIPOS_ALIMENTO.map(c => Math.round(totF[c] / countF)), backgroundColor: PALETTE[2] }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  private chartCategorias(categorias: { cat: string; total: number }[]): void {
    const sorted = [...categorias].sort((a, b) => b.total - a.total);
    this.upsert('cat', this.catRef, {
      type: 'pie',
      data: {
        labels: sorted.length ? sorted.map(c => CAT_LABEL[c.cat] ?? c.cat) : ['Sin datos'],
        datasets: [{
          data: sorted.length ? sorted.map(c => Math.round(c.total)) : [1],
          backgroundColor: sorted.length ? sorted.map(c => CAT_COLOR[c.cat] ?? '#ccc') : ['#e5e7eb']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
  }

  private chartPartGenero(): void {
    const g = this.groupBy(this.filteredData, 'participante_genero');
    const keys = [...g.keys()];
    this.upsert('partGenero', this.partGeneroRef, {
      type: 'doughnut',
      data: {
        labels: keys.map(k => this.generoPartLabel(k)),
        datasets: [{
          data: keys.map(k => g.get(k)!.length),
          backgroundColor: keys.map((_, i) => PALETTE[i % PALETTE.length])
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
  }

  private chartRankingPersonajes(): void {
    const g = this.groupBy(this.filteredData, 'personaje_nombre');
    const sorted = [...g.entries()]
      .map(([label, items]) => ({ label: label || 'Sin nombre', avg: Math.round(this.avgGramos(items)) }))
      .sort((a, b) => b.avg - a.avg);
    this.upsert('ranking', this.rankingRef, {
      type: 'bar',
      data: {
        labels: sorted.map(s => s.label),
        datasets: [{
          label: 'Promedio (g)',
          data: sorted.map(s => s.avg),
          backgroundColor: sorted.map((_, i) => PALETTE[i % PALETTE.length])
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } }
      }
    } as ChartConfiguration);
  }

  private chartImcParticipante(): void {
    const groups = [
      { label: 'Bajo peso', fn: (imc: number) => imc > 0 && imc < 18.5 },
      { label: 'Normal', fn: (imc: number) => imc >= 18.5 && imc < 25 },
      { label: 'Sobrepeso', fn: (imc: number) => imc >= 25 && imc < 30 },
      { label: 'Obesidad', fn: (imc: number) => imc >= 30 }
    ];
    const data = groups.map(gr =>
      Math.round(this.avgGramos(this.filteredData.filter(d => gr.fn(Number(d.participante_imc) || 0))))
    );
    this.upsert('imcPart', this.imcPartRef, {
      type: 'bar',
      data: {
        labels: groups.map(g => g.label),
        datasets: [{ label: 'Promedio (g)', data, backgroundColor: PALETTE[0] }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  private chartTiempoPerfil(): void {
    const presentes = [...new Set(this.filteredData.map(d => this.perfilDe(d)))];
    const labels = [
      ...PERFIL_ORDEN.filter(p => presentes.includes(p)),
      ...presentes.filter(p => !PERFIL_ORDEN.includes(p))
    ];
    this.upsert('tiempoPerfil', this.tiempoPerfilRef, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Segundos',
          data: labels.map(r => Math.round(this.avgTiempo(this.filteredData.filter(d => this.perfilDe(d) === r)))),
          backgroundColor: PALETTE[4]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 's' } } }
      }
    });
  }

  private chartPerfilYGenero(): void {
    const presentes = [...new Set(this.filteredData.map(d => this.bandaEdad(d)))];
    const labels = [
      ...BANDAS_EDAD.filter(b => presentes.includes(b)),
      ...presentes.filter(b => !BANDAS_EDAD.includes(b))
    ];
    this.upsert('perfilYGenero', this.perfilYGeneroRef, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Personaje masculino',
            data: labels.map(b => Math.round(this.avgGramos(
              this.filteredData.filter(d => this.bandaEdad(d) === b && d.personaje_genero === 'M')
            ))),
            backgroundColor: PALETTE[0]
          },
          {
            label: 'Personaje femenino',
            data: labels.map(b => Math.round(this.avgGramos(
              this.filteredData.filter(d => this.bandaEdad(d) === b && d.personaje_genero === 'F')
            ))),
            backgroundColor: PALETTE[2]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'g promedio / decisión' } } }
      }
    });
  }

  private chartCatPorPerfil(): void {
    const perfiles = this.perfilesEnFiltro();
    const datasets = perfiles.map((perfil, i) => {
      const filas = this.filteredData.filter(d => this.perfilDe(d) === perfil);
      const n = filas.length || 1;
      const tot: Record<string, number> = Object.fromEntries(TIPOS_ALIMENTO.map(c => [c, 0]));
      filas.forEach(d => {
        parseAlimentos(d.componentes_servidos).forEach(c => {
          if (c.tipo in tot) tot[c.tipo] += c.gramos;
        });
      });
      return {
        label: perfil,
        data: TIPOS_ALIMENTO.map(c => Math.round(tot[c] / n)),
        backgroundColor: PALETTE[i % PALETTE.length]
      };
    });
    this.upsert('catPerfil', this.catPerfilRef, {
      type: 'bar',
      data: {
        labels: TIPOS_ALIMENTO.map(c => CAT_LABEL[c]),
        datasets: datasets.length ? datasets : [{ label: 'Sin datos', data: TIPOS_ALIMENTO.map(() => 0), backgroundColor: PALETTE[0] }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  private chartTiempoGenero(): void {
    const labels = ['M', 'F'];
    this.upsert('tiempoGenero', this.tiempoGeneroRef, {
      type: 'bar',
      data: {
        labels: labels.map(g => GENERO_PERS_LABEL[g]),
        datasets: [{
          label: 'Segundos',
          data: labels.map(g => Math.round(this.avgTiempo(this.filteredData.filter(d => d.personaje_genero === g)))),
          backgroundColor: [PALETTE[0], PALETTE[2]]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 's' } } }
      }
    });
  }

  private chartOrdenServicio(): void {
    const tipos = TIPOS_ALIMENTO.map(c => CAT_LABEL[c]);
    const totM: Record<string, number> = Object.fromEntries(tipos.map(t => [t, 0]));
    const totF: Record<string, number> = Object.fromEntries(tipos.map(t => [t, 0]));
    this.filteredData.forEach(d => {
      const tipo = this.primerTipoServido(d);
      if (!(tipo in totM)) return;
      if (d.personaje_genero === 'M') totM[tipo]++;
      else if (d.personaje_genero === 'F') totF[tipo]++;
    });
    this.upsert('ordenServicio', this.ordenServicioRef, {
      type: 'bar',
      data: {
        labels: tipos,
        datasets: [
          { label: 'Personaje masculino', data: tipos.map(t => totM[t]), backgroundColor: PALETTE[0] },
          { label: 'Personaje femenino', data: tipos.map(t => totF[t]), backgroundColor: PALETTE[2] }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: 'decisiones' } } }
      }
    });
  }

  private primerTipoServido(d: FilaVista): string {
    const eventos = comoArreglo(d.secuencia_clics);
    const primero = eventos.find(e => e?.accion === 'agregar' && e?.alimento_slug);
    if (!primero) {
      const alimentos = parseAlimentos(d.componentes_servidos);
      return alimentos[0] ? (CAT_LABEL[alimentos[0].tipo] ?? alimentos[0].tipo) : 'Sin datos';
    }
    const item = comoArreglo(d.componentes_servidos).find(
      a => a?.slug === primero.alimento_slug || a?.alimento_slug === primero.alimento_slug
    );
    const tipo = String(item?.tipo || '').toLowerCase();
    return CAT_LABEL[tipo] ?? (tipo || 'Sin datos');
  }

  private bandaEdad(d: FilaVista): string {
    return d.personaje_edad_rango || this.perfilDe(d);
  }

  private perfilesEnFiltro(): string[] {
    const presentes = [...new Set(this.filteredData.map(d => this.perfilDe(d)))];
    return [
      ...PERFIL_ORDEN.filter(p => presentes.includes(p)),
      ...presentes.filter(p => !PERFIL_ORDEN.includes(p))
    ];
  }

  private avgTiempo(items: FilaVista[]): number {
    const v = items.map(d => Number(d.tiempo_decision_segundos)).filter(n => Number.isFinite(n) && n >= 0);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  }

  private generosEnDatos(): string[] {
    const enFiltro = [...new Set(
      this.filteredData.map(d => d.participante_genero).filter((g): g is string => !!g)
    )];
    return enFiltro.length ? enFiltro : ['masculino', 'femenino'];
  }

  get tableData(): FilaVista[] {
    const s = this.tablePage * this.PAGE_SIZE;
    return this.filteredData.slice(s, s + this.PAGE_SIZE);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredData.length / this.PAGE_SIZE) || 1;
  }

  prevPage(): void {
    if (this.tablePage > 0) this.tablePage--;
  }

  nextPage(): void {
    if (this.tablePage < this.totalPages - 1) this.tablePage++;
  }

  downloadCSV(): void {
    this.api.obtenerExportacionCSV().subscribe({
      next: csv => this.bajarArchivo(csv, 'text/csv;charset=utf-8', 'csv'),
      error: () => {
        this.error = 'No se pudo generar el CSV. Comprueba la sesión de investigador.';
      }
    });
  }

  downloadJSON(): void {
    this.api.obtenerExportacionJSON().subscribe({
      next: payload => this.bajarArchivo(
        JSON.stringify(payload, null, 2),
        'application/json;charset=utf-8',
        'json'
      ),
      error: () => {
        this.error = 'No se pudo generar el JSON. Comprueba la sesión de investigador.';
      }
    });
  }

  downloadExcel(): void {
    const rows = buildExportRows(this.rawData);
    const campos = Object.keys(ENCABEZADOS) as (keyof ExportRow)[];
    const named = rows.length
      ? rows.map(r => {
          const o: Record<string, unknown> = {};
          for (const campo of campos) {
            o[ENCABEZADOS[campo]] = r[campo];
          }
          return o;
        })
      : [Object.fromEntries(campos.map(c => [ENCABEZADOS[c], '']))];

    const ws = XLSX.utils.json_to_sheet(named);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Respuestas');
    XLSX.writeFile(wb, `sirve-la-mesa_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  async cerrarSesion(): Promise<void> {
    await this.investigador.cerrarSesion();
    await this.router.navigate(['/acceso-investigadores']);
  }

  setTab(id: string): void {
    this.activeTab = id;
    if (id === 'graficos') {
      setTimeout(() => {
        this.renderCharts();
        Object.values(this.charts).forEach(c => c.resize());
      });
    }
  }

  nivelLabel(valor: string | null): string {
    if (!valor) return '—';
    return NIVEL_LABEL[valor] ?? valor;
  }

  etniaLabel(valor: string | null): string {
    if (!valor) return '—';
    return ETNIA_LABEL[valor] ?? valor;
  }

  generoPartLabel(g: string | null): string {
    if (!g) return 'Sin datos';
    return GENERO_PART_LABEL[g] ?? g;
  }

  generoPersLabel(g: string | null): string {
    if (g === 'M') return 'M';
    if (g === 'F') return 'F';
    return g || '—';
  }

  momentoLabel(e: string | null): string {
    return ({ desayuno: 'Desayuno', almuerzo: 'Almuerzo', cena: 'Cena' } as Record<string, string>)[e ?? ''] ?? (e || '—');
  }

  formatComps(componentes: unknown): string {
    const alimentos = parseAlimentos(componentes);
    if (!alimentos.length) return '—';
    return alimentos.map(c => `${c.nombre} (${Math.round(c.gramos)} g)`).join(', ');
  }

  formatFecha(ts: string | null): string {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  round(n: number): string {
    return n ? n.toFixed(1) : '—';
  }

  formatSeconds(seconds: number): string {
    if (!seconds || seconds < 0) return '—';
    if (seconds < 60) return `${seconds.toFixed(1)} s`;
    return `${(seconds / 60).toFixed(1)} min`;
  }

  activeFiltersCount(): number {
    return Object.values(this.filters).filter(v => v !== '').length;
  }

  private bajarArchivo(contenido: string, tipo: string, ext: string): void {
    const blob = new Blob([contenido], { type: tipo });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sirve-la-mesa_datos_${new Date().toISOString().split('T')[0]}.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
