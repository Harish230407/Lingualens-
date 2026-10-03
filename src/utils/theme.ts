export type ThemeOption = 'dark' | 'light' | 'system';

export function getStoredTheme(): ThemeOption {
  try {
    const saved = localStorage.getItem('lingualens_theme') as ThemeOption | null;
    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'dark';
}

export function applyTheme(theme: ThemeOption): 'dark' | 'light' {
  let effectiveTheme: 'dark' | 'light' = 'dark';

  if (theme === 'system') {
    const isSystemLight =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: light)').matches;
    effectiveTheme = isSystemLight ? 'light' : 'dark';
  } else {
    effectiveTheme = theme;
  }

  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    const body = document.body;

    root.setAttribute('data-theme', effectiveTheme);
    body.setAttribute('data-theme', effectiveTheme);

    if (effectiveTheme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
      body.classList.add('light');
      body.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
    }

    try {
      localStorage.setItem('lingualens_theme', theme);
    } catch {
      // ignore
    }
  }

  return effectiveTheme;
}
