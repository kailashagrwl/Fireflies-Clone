'use client';

import { useEffect } from 'react';

export default function ThemeInitializer() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('firefiles-theme') || 'light';
    const root = document.documentElement;
    if (savedTheme === 'light') {
      root.classList.add('theme-light');
    } else if (savedTheme === 'dark') {
      root.classList.remove('theme-light');
    } else {
      // System Theme
      const systemIsLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      if (systemIsLight) {
        root.classList.add('theme-light');
      } else {
        root.classList.remove('theme-light');
      }
    }
  }, []);

  return null;
}
