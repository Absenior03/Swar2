import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, getTheme, defaultTheme } from './themes';

interface ThemeContextType {
  theme: Theme;
  themeName: string;
  setTheme: (themeName: string) => void;
  availableThemes: string[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeName, setThemeName] = useState('default');
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  const setTheme = (newThemeName: string) => {
    setThemeName(newThemeName);
    setThemeState(getTheme(newThemeName));
    localStorage.setItem('swar-theme', newThemeName);
  };

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('swar-theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Apply CSS custom properties for the current theme
    const root = document.documentElement;
    const colors = theme.colors;
    
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-text-secondary', colors.textSecondary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-border', colors.border);
    root.style.setProperty('--color-highlight', colors.highlight);
    root.style.setProperty('--color-code-background', colors.codeBackground);
    
    root.style.setProperty('--font-primary', theme.fonts.primary);
    root.style.setProperty('--font-code', theme.fonts.code);
  }, [theme]);

  const availableThemes = ['default', 'harryPotter', 'strangerThings', 'marvel', 'disney'];

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};