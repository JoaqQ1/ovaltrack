import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { formatMetricValue, MetricUnit } from '../../utils/division-metrics';

export interface ChartSeries {
  name: string;
  color: string;
  dashed?: boolean;
  values: number[];
}

interface ChartPoint { x: number; y: number; tooltip: string; }
interface ChartLine { name: string; color: string; dashed: boolean; polyline: string; points: ChartPoint[]; }
interface Gridline { y: number; label: string; }
interface XTick { x: number; label: string; }

const WIDTH = 600;
const HEIGHT = 230;
const MARGIN = { top: 14, right: 18, bottom: 34, left: 42 };
const MAX_X_TICKS = 8;

/** Gráfico de líneas con puntos en SVG puro (sin dependencias): un punto por partido, una línea por serie. */
@Component({
  selector: 'ot-stat-line-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stat-line-chart.component.html',
  styleUrl: './stat-line-chart.component.css',
})
export class StatLineChartComponent implements OnChanges {
  /** Etiqueta corta del eje X (una por partido). */
  @Input() labels: string[] = [];
  /** Detalle completo de cada partido, para el tooltip. */
  @Input() details: string[] = [];
  @Input() series: ChartSeries[] = [];
  @Input() unit: MetricUnit = 'int';

  readonly width = WIDTH;
  readonly height = HEIGHT;
  readonly plotLeft = MARGIN.left;
  readonly plotRight = WIDTH - MARGIN.right;

  lines: ChartLine[] = [];
  gridlines: Gridline[] = [];
  xTicks: XTick[] = [];

  ngOnChanges(): void {
    const count = this.labels.length;
    const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
    const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const yMax = this.niceMax();

    const xAt = (index: number) =>
      count <= 1 ? MARGIN.left + plotWidth / 2 : MARGIN.left + (plotWidth * index) / (count - 1);
    const yAt = (value: number) => MARGIN.top + plotHeight - (Math.min(value, yMax) / yMax) * plotHeight;

    this.gridlines = [0, 0.25, 0.5, 0.75, 1].map(ratio => ({
      y: yAt(yMax * ratio),
      label: formatMetricValue(Math.round(yMax * ratio * 10) / 10, this.unit),
    }));

    const step = Math.max(1, Math.ceil(count / MAX_X_TICKS));
    this.xTicks = this.labels
      .map((label, index) => ({ x: xAt(index), label, index }))
      .filter(tick => tick.index % step === 0 || tick.index === count - 1)
      .map(({ x, label }) => ({ x, label }));

    this.lines = this.series.map(serie => {
      const points = serie.values.map((value, index) => ({
        x: xAt(index),
        y: yAt(value),
        tooltip: `${this.details[index] ?? this.labels[index] ?? ''}\n${serie.name}: ${formatMetricValue(value, this.unit)}`,
      }));
      return {
        name: serie.name,
        color: serie.color,
        dashed: !!serie.dashed,
        polyline: points.map(point => `${point.x},${point.y}`).join(' '),
        points,
      };
    });
  }

  /** Techo del eje Y: 100 en porcentajes; en conteos, el siguiente valor "redondo" por encima del máximo. */
  private niceMax(): number {
    if (this.unit === 'percent') return 100;
    const max = Math.max(0, ...this.series.flatMap(serie => serie.values));
    if (max <= 4) return 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    return Math.ceil(max / (magnitude / 2)) * (magnitude / 2) || 4;
  }
}
