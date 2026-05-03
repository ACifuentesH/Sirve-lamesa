import {
  Component, OnInit, AfterViewInit, OnDestroy,
  ViewChild, ElementRef, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import * as XLSX from 'xlsx';
import { ApiService } from '../../services/api.service';

Chart.register(...registerables);

interface Filters {
  participanteSexo: string;
  participanteEdad: string;
  participanteIMC:  string;
}

const PALETTE = ['#52A5CE','#EF6F3C','#FF7BAC','#6B9B7A','#F5C842','#9B8EC4','#4A8CA6','#8FBB9E'];

const CAT_COLOR: Record<string, string> = {
  proteina:     '#EF6F3C',
  carbohidrato: '#52A5CE',
  vegetal:      '#6B9B7A',
  fruta:        '#FF7BAC',
  otro:         '#9B8EC4'
};

const CAT_LABEL: Record<string, string> = {
  proteina: 'Proteína', carbohidrato: 'Carbohidrato',
  vegetal: 'Vegetal', fruta: 'Fruta', otro: 'Otro'
};

const EDAD_ORDEN = ['8-12','40-55','65+'];
const EDAD_PART_RANGOS = ['<18','18-25','26-35','36-50','51+'];

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, AfterViewInit, OnDestroy {

  // ── state ──────────────────────────────────────────────────────
  loading = true;
  error = '';
  activeTab = 'graficos';
  chartsReady = false;

  // ── data ───────────────────────────────────────────────────────
  rawData: any[] = [];
  filteredData: any[] = [];
  componentesMap = new Map<number, any>();

  // ── filters ────────────────────────────────────────────────────
  filters: Filters = { participanteSexo: '', participanteEdad: '', participanteIMC: '' };
  participanteEdadRangos: string[] = [];

  // ── stats ──────────────────────────────────────────────────────
  stats = { decisiones: 0, participantes: 0, sesiones: 0, promedioGramos: 0 };

  // ── table ──────────────────────────────────────────────────────
  tablePage = 0;
  readonly PAGE_SIZE = 20;

  // ── tabs ───────────────────────────────────────────────────────
  readonly tabs = [
    { id: 'graficos', label: '📊 Gráficos' },
    { id: 'datos',    label: '📋 Datos'    }
  ];

  // ── canvas refs ────────────────────────────────────────────────
  @ViewChild('resumenPersonajeChart') resumenPersonajeRef!: ElementRef<HTMLCanvasElement>; // chart 0 — principal
  @ViewChild('edadChart')       edadRef!:       ElementRef<HTMLCanvasElement>; // chart 1
  @ViewChild('mfEdadChart')     mfEdadRef!:     ElementRef<HTMLCanvasElement>; // chart 2
  @ViewChild('catSexoPerChart') catSexoPerRef!: ElementRef<HTMLCanvasElement>; // chart 3
  @ViewChild('catChart')        catRef!:        ElementRef<HTMLCanvasElement>; // chart 4
  @ViewChild('topCountChart')   topCountRef!:   ElementRef<HTMLCanvasElement>; // chart 5
  @ViewChild('partSexoChart')   partSexoRef!:   ElementRef<HTMLCanvasElement>; // chart 6
  @ViewChild('rankingChart')    rankingRef!:    ElementRef<HTMLCanvasElement>; // chart 7
  @ViewChild('catSexoStackChart') catSexoStackRef!: ElementRef<HTMLCanvasElement>; // chart 8
  @ViewChild('imcPartChart')    imcPartRef!:    ElementRef<HTMLCanvasElement>; // chart 9

  private charts: Record<string, Chart> = {};

  constructor(private api: ApiService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.loadData(); }

  ngAfterViewInit(): void {
    this.chartsReady = true;
    if (!this.loading) this.renderCharts();
  }

  ngOnDestroy(): void {
    Object.values(this.charts).forEach(c => c.destroy());
  }

  // ── data loading ───────────────────────────────────────────────
  loadData(): void {
    this.api.obtenerDatosAdmin().subscribe({
      next: (res: any) => {
        const { decisiones, componentes_catalogo } = res.data;
        this.rawData = decisiones || [];
        (componentes_catalogo || []).forEach((c: any) => this.componentesMap.set(c.pk_alimento, c));
        this.buildFilterOptions();
        this.applyFilters();
        this.loading = false;
        if (this.chartsReady) this.renderCharts();
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'No se pudieron cargar los datos. Verifique la conexión al servidor.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  buildFilterOptions(): void {
    // Only show age ranges that actually appear in the data
    this.participanteEdadRangos = EDAD_PART_RANGOS.filter(r =>
      this.rawData.some(d => this.partEdadRange(parseInt(d.participante_edad) || 0) === r)
    );
  }

  // ── filtering ──────────────────────────────────────────────────
  applyFilters(): void {
    const f = this.filters;
    this.filteredData = this.rawData.filter((d: any) => {
      if (f.participanteSexo && d.participante_sexo !== f.participanteSexo) return false;
      if (f.participanteEdad) {
        const edad = parseInt(d.participante_edad) || 0;
        if (this.partEdadRange(edad) !== f.participanteEdad) return false;
      }
      if (f.participanteIMC) {
        const imc = parseFloat(d.participante_imc) || 0;
        if (f.participanteIMC === 'bajo'      && imc >= 18.5)            return false;
        if (f.participanteIMC === 'normal'    && (imc < 18.5 || imc >= 25)) return false;
        if (f.participanteIMC === 'sobrepeso' && (imc < 25   || imc >= 30)) return false;
        if (f.participanteIMC === 'obesidad'  && imc < 30)               return false;
      }
      return true;
    });
    this.computeStats();
    this.tablePage = 0;
    if (this.chartsReady) this.renderCharts();
  }

  resetFilters(): void {
    this.filters = { participanteSexo: '', participanteEdad: '', participanteIMC: '' };
    this.applyFilters();
  }

  // ── stats ──────────────────────────────────────────────────────
  computeStats(): void {
    const d = this.filteredData;
    this.stats.decisiones    = d.length;
    this.stats.participantes = new Set(d.map((x: any) => x.participante_id)).size;
    this.stats.sesiones      = new Set(d.map((x: any) => x.sesion_id)).size;
    const g = d.map((x: any) => +x.cantidad_total_gramos || 0).filter(v => v > 0);
    this.stats.promedioGramos = g.length ? g.reduce((a, b) => a + b, 0) / g.length : 0;
  }

  // ── shared helpers ─────────────────────────────────────────────
  private groupBy(data: any[], key: string): Map<string, any[]> {
    const m = new Map<string, any[]>();
    data.forEach(d => {
      const k = String(d[key] ?? 'Sin datos');
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(d);
    });
    return m;
  }

  private avgGramos(items: any[]): number {
    const v = items.map(d => +d.cantidad_total_gramos || 0).filter(g => g > 0);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  }

  private personajeLabel(tipo: string, edad: string, imc: string): string {
    const t = tipo === 'adulto_hombre' ? 'H' : tipo === 'adulto_mujer' ? 'M' : tipo === 'niño' ? 'N' : tipo;
    const i = imc === 'normopeso' ? 'Normo' : imc === 'sobrepeso' ? 'Sobre' : '';
    return i ? `${t} · ${edad} · ${i}` : `${t} · ${edad}`;
  }

  private partEdadRange(edad: number): string {
    if (edad < 18)  return '<18';
    if (edad <= 25) return '18-25';
    if (edad <= 35) return '26-35';
    if (edad <= 50) return '36-50';
    return '51+';
  }

  private foodStats(): { categorias: any[]; topCount: any[] } {
    const catMap    = new Map<string, { count: number; total: number }>();
    const compCount = new Map<string, number>();

    this.filteredData.forEach(d => {
      const comps: any[] = d.componentes_servidos || [];
      comps.forEach((c: any) => {
        const info = this.componentesMap.get(c.componente_id);
        const cat  = info?.categoria || 'otro';
        const g    = +c.cantidad_gramos || 0;
        const nom  = c.nombre || info?.nombre || 'Desconocido';

        const e = catMap.get(cat) ?? { count: 0, total: 0 };
        e.count++; e.total += g;
        catMap.set(cat, e);

        compCount.set(nom, (compCount.get(nom) ?? 0) + 1);
      });
    });

    const categorias = [...catMap.entries()].map(([cat, v]) => ({ cat, ...v }));
    const topCount   = [...compCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([n, v]) => ({ n, v }));
    return { categorias, topCount };
  }

  // ── chart engine ───────────────────────────────────────────────
  private upsert(key: string, ref: ElementRef<HTMLCanvasElement> | undefined, cfg: ChartConfiguration): void {
    if (!ref?.nativeElement) return;
    if (this.charts[key]) {
      this.charts[key].data.labels   = cfg.data.labels;
      this.charts[key].data.datasets = cfg.data.datasets;
      this.charts[key].update('none');
    } else {
      this.charts[key] = new Chart(ref.nativeElement, cfg);
    }
  }

  renderCharts(): void {
    this.chartResumenPersonaje();
    this.chartEdad();
    this.chartMFporEdad();
    this.chartCatPorSexoPersonaje();
    const { categorias, topCount } = this.foodStats();
    this.chartCategorias(categorias);
    this.chartTopCount(topCount);
    this.chartPartSexo();
    this.chartRankingPersonajes();
    this.chartCatSexoStacked();
    this.chartImcParticipante();
  }

  // ── CHART 0 — Resumen principal: personaje × categoría ───────────
  // Cada barra = un personaje único. Label = tipo | edad | sexo | IMC.
  // Stack = categorías de alimento. Y = promedio de gramos de esa categoría por decisión.
  private chartResumenPersonaje(): void {
    const cats = ['proteina', 'carbohidrato', 'vegetal', 'fruta'];

    // Composite key so each of the 7 characters gets its own bar
    const charMap = new Map<string, { label: string; items: any[] }>();
    this.filteredData.forEach(d => {
      const key = `${d.personaje_tipo}|${d.personaje_edad_rango}|${d.personaje_imc_representado || ''}`;
      if (!charMap.has(key)) {
        charMap.set(key, {
          label: this.personajeLabel(d.personaje_tipo, d.personaje_edad_rango, d.personaje_imc_representado || ''),
          items: []
        });
      }
      charMap.get(key)!.items.push(d);
    });

    const chars = [...charMap.values()];
    const labels = chars.map(c => c.label);

    const datasets = cats.map(cat => ({
      label: CAT_LABEL[cat],
      data: chars.map(c => {
        const n = c.items.length || 1;
        let total = 0;
        c.items.forEach(d => {
          (d.componentes_servidos || []).forEach((comp: any) => {
            if (this.componentesMap.get(comp.componente_id)?.categoria === cat)
              total += +comp.cantidad_gramos || 0;
          });
        });
        return Math.round(total / n);
      }),
      backgroundColor: CAT_COLOR[cat],
      stack: 'main'
    }));

    this.upsert('resumenPersonaje', this.resumenPersonajeRef, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              title: (items: any[]) => items[0]?.label?.replace(/\s\s+/g, ' ') ?? ''
            }
          }
        },
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true, title: { display: true, text: 'g promedio / decisión' } }
        }
      }
    } as ChartConfiguration);
  }

  // ── CHART 1 — Promedio (g) por edad del personaje ──────────────
  private chartEdad(): void {
    const g = this.groupBy(this.filteredData, 'personaje_edad_rango');
    this.upsert('edad', this.edadRef, {
      type: 'bar',
      data: {
        labels: EDAD_ORDEN,
        datasets: [{
          label: 'Promedio (g)',
          data: EDAD_ORDEN.map(r => Math.round(this.avgGramos(g.get(r) ?? []))),
          backgroundColor: PALETTE[0]
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  // ── CHART 2 — Promedio (g) por edad del personaje — M vs F ─────
  private chartMFporEdad(): void {
    const dataM = EDAD_ORDEN.map(r =>
      Math.round(this.avgGramos(this.filteredData.filter(d => d.personaje_edad_rango === r && d.personaje_sexo === 'M')))
    );
    const dataF = EDAD_ORDEN.map(r =>
      Math.round(this.avgGramos(this.filteredData.filter(d => d.personaje_edad_rango === r && d.personaje_sexo === 'F')))
    );
    this.upsert('mfEdad', this.mfEdadRef, {
      type: 'bar',
      data: {
        labels: EDAD_ORDEN,
        datasets: [
          { label: 'Masculino', data: dataM, backgroundColor: PALETTE[0] },
          { label: 'Femenino',  data: dataF, backgroundColor: PALETTE[2] }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  // ── CHART 3 — Promedio (g) por categoría — según sexo personaje ─
  // Metric: total grams of that category / number of decisions for that sex group
  private chartCatPorSexoPersonaje(): void {
    const cats   = ['proteina', 'carbohidrato', 'vegetal', 'fruta'];
    const countM = this.filteredData.filter(d => d.personaje_sexo === 'M').length || 1;
    const countF = this.filteredData.filter(d => d.personaje_sexo === 'F').length || 1;
    const totM: Record<string, number> = Object.fromEntries(cats.map(c => [c, 0]));
    const totF: Record<string, number> = Object.fromEntries(cats.map(c => [c, 0]));

    this.filteredData.forEach(d => {
      const sexo = d.personaje_sexo;
      if (sexo !== 'M' && sexo !== 'F') return;
      (d.componentes_servidos || []).forEach((c: any) => {
        const info = this.componentesMap.get(c.componente_id);
        const cat  = info?.categoria;
        if (!cats.includes(cat)) return;
        if (sexo === 'M') totM[cat] += +c.cantidad_gramos || 0;
        else              totF[cat] += +c.cantidad_gramos || 0;
      });
    });

    this.upsert('catSexoPer', this.catSexoPerRef, {
      type: 'bar',
      data: {
        labels: cats.map(c => CAT_LABEL[c]),
        datasets: [
          { label: 'Personaje Masculino', data: cats.map(c => Math.round(totM[c] / countM)), backgroundColor: PALETTE[0] },
          { label: 'Personaje Femenino',  data: cats.map(c => Math.round(totF[c] / countF)), backgroundColor: PALETTE[2] }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  // ── CHART 4 — Distribución por categoría (g) ──────────────────
  private chartCategorias(categorias: any[]): void {
    const sorted = categorias.sort((a, b) => b.total - a.total);
    this.upsert('cat', this.catRef, {
      type: 'pie',
      data: {
        labels:   sorted.map(c => CAT_LABEL[c.cat] ?? c.cat),
        datasets: [{ data: sorted.map(c => Math.round(c.total)), backgroundColor: sorted.map(c => CAT_COLOR[c.cat] ?? '#ccc') }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
  }

  // ── CHART 5 — Top 10 alimentos — Frecuencia ───────────────────
  private chartTopCount(top: any[]): void {
    this.upsert('topCount', this.topCountRef, {
      type: 'bar',
      data: {
        labels:   top.map(t => t.n),
        datasets: [{ label: 'Veces servido', data: top.map(t => t.v), backgroundColor: PALETTE[1] }]
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } }
      }
    } as ChartConfiguration);
  }

  // ── CHART 6 — Sexo del participante ───────────────────────────
  private chartPartSexo(): void {
    const g = this.groupBy(this.filteredData, 'participante_sexo');
    const labels = [...g.keys()].map(k => k === 'M' ? 'Masculino' : k === 'F' ? 'Femenino' : k || 'Sin datos');
    this.upsert('partSexo', this.partSexoRef, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: [...g.values()].map(v => v.length), backgroundColor: [PALETTE[0], PALETTE[2], PALETTE[4]] }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
  }

  // ── CHART 7 — Ranking de personajes por gramos servidos ──────────
  private chartRankingPersonajes(): void {
    const g = new Map<string, { label: string; items: any[] }>();
    this.filteredData.forEach(d => {
      const key = `${d.personaje_tipo}|${d.personaje_edad_rango}|${d.personaje_imc_representado || ''}`;
      if (!g.has(key)) g.set(key, { label: this.personajeLabel(d.personaje_tipo, d.personaje_edad_rango, d.personaje_imc_representado || ''), items: [] });
      g.get(key)!.items.push(d);
    });
    const sorted = [...g.values()]
      .map(({ label, items }) => ({ label, avg: Math.round(this.avgGramos(items)) }))
      .sort((a, b) => b.avg - a.avg);
    this.upsert('ranking', this.rankingRef, {
      type: 'bar',
      data: {
        labels: sorted.map(s => s.label),
        datasets: [{ label: 'Promedio (g)', data: sorted.map(s => s.avg), backgroundColor: sorted.map((_, i) => PALETTE[i % PALETTE.length]) }]
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } }
      }
    } as ChartConfiguration);
  }

  // ── CHART 8 — Categorías por sexo personaje (stacked 100%) ───────
  private chartCatSexoStacked(): void {
    const cats  = ['proteina', 'carbohidrato', 'vegetal', 'fruta'];
    const sexos = ['M', 'F'];
    const totals: Record<string, Record<string, number>> = {};
    sexos.forEach(s => { totals[s] = Object.fromEntries(cats.map(c => [c, 0])); });

    this.filteredData.forEach(d => {
      const sexo = d.personaje_sexo;
      if (!totals[sexo]) return;
      (d.componentes_servidos || []).forEach((c: any) => {
        const cat = this.componentesMap.get(c.componente_id)?.categoria;
        if (cats.includes(cat)) totals[sexo][cat] += +c.cantidad_gramos || 0;
      });
    });

    const pct: Record<string, Record<string, number>> = {};
    sexos.forEach(s => {
      const sum = cats.reduce((a, c) => a + totals[s][c], 0) || 1;
      pct[s] = Object.fromEntries(cats.map(c => [c, Math.round((totals[s][c] / sum) * 100)]));
    });

    this.upsert('catSexoStack', this.catSexoStackRef, {
      type: 'bar',
      data: {
        labels: ['Masculino', 'Femenino'],
        datasets: cats.map(cat => ({
          label: CAT_LABEL[cat],
          data: sexos.map(s => pct[s][cat]),
          backgroundColor: CAT_COLOR[cat],
          stack: 'main'
        }))
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          x: { stacked: true },
          y: { stacked: true, max: 100, ticks: { callback: (v: any) => v + '%' } }
        }
      }
    } as ChartConfiguration);
  }

  // ── CHART 9 — Promedio (g) por IMC del participante ───────────────
  private chartImcParticipante(): void {
    const groups = [
      { label: 'Bajo peso',  fn: (imc: number) => imc > 0 && imc < 18.5 },
      { label: 'Normal',     fn: (imc: number) => imc >= 18.5 && imc < 25 },
      { label: 'Sobrepeso',  fn: (imc: number) => imc >= 25 && imc < 30 },
      { label: 'Obesidad',   fn: (imc: number) => imc >= 30 }
    ];
    const data = groups.map(gr =>
      Math.round(this.avgGramos(this.filteredData.filter(d => gr.fn(parseFloat(d.participante_imc) || 0))))
    );
    this.upsert('imcPart', this.imcPartRef, {
      type: 'bar',
      data: {
        labels: groups.map(g => g.label),
        datasets: [{ label: 'Promedio (g)', data, backgroundColor: PALETTE[0] }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  // ── table ──────────────────────────────────────────────────────
  get tableData(): any[] {
    const s = this.tablePage * this.PAGE_SIZE;
    return this.filteredData.slice(s, s + this.PAGE_SIZE);
  }
  get totalPages(): number { return Math.ceil(this.filteredData.length / this.PAGE_SIZE); }
  prevPage(): void { if (this.tablePage > 0) this.tablePage--; }
  nextPage(): void { if (this.tablePage < this.totalPages - 1) this.tablePage++; }

  // ── export ─────────────────────────────────────────────────────
  downloadCSV(): void {
    this.api.obtenerExportacionCSV().subscribe({
      next: csv => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `sirve-la-mesa_datos_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
      },
      error: () => {
        this.error = 'No se pudo generar el CSV. Comprueba Supabase y las políticas RLS.';
      }
    });
  }

  downloadJSON(): void {
    this.api.obtenerExportacionJSON().subscribe({
      next: payload => {
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
          type: 'application/json;charset=utf-8'
        });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `sirve-la-mesa_datos_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
      },
      error: () => {
        this.error = 'No se pudo generar el JSON. Comprueba Supabase y las políticas RLS.';
      }
    });
  }

  downloadExcel(): void {
    const rows = this.rawData.map((d: any) => ({
      'ID':                  d.pk_decision,
      'Fecha':               this.formatFecha(d.timestamp_decision),
      'Escenario':           this.escenarioLabel(d.escenario),
      'Personaje':           d.personaje_tipo,
      'Sexo personaje':      this.sexoLabel(d.personaje_sexo),
      'Edad personaje':      d.personaje_edad_rango,
      'IMC personaje':       d.personaje_imc_representado || '—',
      'ID participante':     d.participante_id,
      'Sexo participante':   this.sexoLabel(d.participante_sexo),
      'IMC participante':    d.participante_imc ? (+d.participante_imc).toFixed(1) : '—',
      'Total (g)':           d.cantidad_total_gramos ? (+d.cantidad_total_gramos).toFixed(0) : '—',
      'Alimentos servidos':  this.formatComps(d.componentes_servidos)
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Decisiones');
    XLSX.writeFile(wb, `sirve-la-mesa_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  // ── navigation ─────────────────────────────────────────────────
  goBack():           void { this.router.navigate(['/']); }
  setTab(id: string): void { this.activeTab = id; }

  // ── template helpers ───────────────────────────────────────────
  sexoLabel(s: string): string { return s === 'M' ? 'M' : s === 'F' ? 'F' : s || '—'; }
  escenarioLabel(e: string): string {
    return ({ desayuno: 'Desayuno', almuerzo: 'Almuerzo', cena: 'Cena' } as any)[e] ?? e;
  }
  formatComps(comps: any[]): string {
    if (!comps?.length) return '—';
    return comps.map((c: any) => `${c.nombre} (${Math.round(c.cantidad_gramos)}g)`).join(', ');
  }
  formatFecha(ts: string): string {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  round(n: number): string { return n ? n.toFixed(1) : '—'; }
  activeFiltersCount(): number { return Object.values(this.filters).filter(v => v !== '').length; }
}
