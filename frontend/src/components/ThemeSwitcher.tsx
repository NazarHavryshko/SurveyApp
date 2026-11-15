import { useEffect, useState } from 'react';
import { Palette } from 'lucide-react';

export type ThemeId = 'ocean' | 'blitz' | 'daylight';

const THEMES: { id: ThemeId; name: string; dotColor: string }[] = [
  { id: 'ocean', name: 'Океан', dotColor: '#2563EB' },
  { id: 'blitz', name: 'Бліц', dotColor: '#E91E63' },
  { id: 'daylight', name: 'День', dotColor: '#F8FAFC' },
];

const THEME_STORAGE_KEY = 'mysurvey_theme';

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeId>(() => {
    return (localStorage.getItem(THEME_STORAGE_KEY) as ThemeId) || 'ocean';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <div className="flex items-center gap-1.5 bg-app border border-line rounded-xl p-1">
      <Palette className="w-4 h-4 text-muted ml-1.5 hidden sm:block" />
      {THEMES.map((t) => {
        const active = theme === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            title={`Колірна схема: ${t.name}`}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              active
                ? 'bg-accent text-accent-text shadow-sm'
                : 'text-muted hover:text-main'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
              style={{ backgroundColor: t.dotColor }}
            />
            <span>{t.name}</span>
          </button>
        );
      })}
    </div>
  );
}