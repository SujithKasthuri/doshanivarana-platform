import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useWindColorScheme } from 'nativewind';
import { useColorScheme as useSystemColorScheme } from 'react-native';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const { colorScheme, setColorScheme } = useWindColorScheme();
  
  // Initialize theme based on current system scheme or nativewind colorScheme, default to 'dark'
  const [theme, setThemeState] = useState<Theme>(
    () => (colorScheme as Theme) || (systemScheme as Theme) || 'dark'
  );

  // Sync with React Native system scheme changes (e.g. system dark mode changes)
  useEffect(() => {
    if (systemScheme) {
      setThemeState(systemScheme as Theme);
    }
  }, [systemScheme]);

  // Sync React theme state to NativeWind
  useEffect(() => {
    if (colorScheme !== theme) {
      setColorScheme(theme);
    }
  }, [theme, colorScheme, setColorScheme]);

  const toggleTheme = () => {
    setThemeState(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}




