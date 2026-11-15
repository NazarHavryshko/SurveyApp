import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { OptionStat } from '../types/survey';

export const CHART_COLORS = [
  '#3B82F6', // Синій
  '#10B981', // Смарагдовий
  '#F59E0B', // Бурштиновий
  '#EC4899', // Малиновий
  '#8B5CF6', // Фіолетовий
  '#06B6D4', // Бірюзовий
  '#F97316', // Помаранчевий
  '#14B8A6', // Хвойний
];

interface SurveyChartProps {
  stats: OptionStat[];
  totalResponses: number;
}

export function SurveyChart({ stats, totalResponses }: SurveyChartProps) {
  const hasVotes = totalResponses > 0 && stats.some((s) => s.count > 0);

  return (
    <div className="space-y-6">
      {/* Кольорова діаграма з відсотками */}
      <div className="relative h-64 sm:h-72 w-full">
        {hasVotes ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats}
                dataKey="percentage"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius="48%"
                outerRadius="82%"
                paddingAngle={3}
                label={({ percent }) =>
                  percent && percent >= 0.05 ? `${Math.round(percent * 100)}%` : ''
                }
                labelLine={false}
              >
                {stats.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, name: any) => [`${Number(value).toFixed(1)}%`, name]}
                contentStyle={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-line)',
                  borderRadius: '12px',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                }}
                itemStyle={{ color: 'var(--text-main)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full rounded-2xl bg-app border border-line flex flex-col items-center justify-center text-center p-4">
            <span className="text-sm font-medium text-muted">
              Поки що недостатньо голосів для побудови діаграми
            </span>
          </div>
        )}

        {/* Центральний лічильник усередині кільця діаграми */}
        {hasVotes && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl sm:text-3xl font-bold text-main">{totalResponses}</span>
            <span className="text-[11px] sm:text-xs text-muted">всього голосів</span>
          </div>
        )}
      </div>

      {/* Розшифровка під діаграмою: що кожен колір означає */}
      <div className="space-y-2.5 pt-2 border-t border-line">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Позначення кольорів та розподіл голосів
        </h3>

        <div className="space-y-2">
          {stats.map((item, index) => {
            const color = CHART_COLORS[index % CHART_COLORS.length];
            const pct = Number.isFinite(item.percentage) ? item.percentage : 0;

            return (
              <div
                key={`${item.label}-${index}`}
                className="bg-app border border-line rounded-xl p-3 sm:p-3.5 space-y-2"
              >
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm sm:text-base font-medium text-main break-words">
                      {item.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-right">
                    <span className="text-sm sm:text-base font-bold text-main">
                      {pct.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted">({item.count})</span>
                  </div>
                </div>

                {/* Кольорова смужка прогресу для наочності */}
                <div className="h-1.5 w-full rounded-full bg-card overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(0, pct))}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}