import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleDark: () => void;
  textSize: 'normal' | 'large';
  toggleTextSize: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  
  const [textSize, setTextSize] = useState<'normal' | 'large'>(() => {
    return (localStorage.getItem('textSize') as 'normal' | 'large') || 'normal';
  });

  useEffect(() => {
    localStorage.setItem('darkMode', isDark.toString());
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('textSize', textSize);
    document.documentElement.classList.toggle('text-large', textSize === 'large');
  }, [textSize]);

  const toggleDark = () => setIsDark(!isDark);
  const toggleTextSize = () => setTextSize(prev => prev === 'normal' ? 'large' : 'normal');

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark, textSize, toggleTextSize }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}