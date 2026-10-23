import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type ThemeContextValue = {
  theme: string;
  resolvedTheme: string;
  setTheme: (theme: string) => void;
};

type ThemeProviderProps = {
  children: ReactNode;
  attribute?: string;
  defaultTheme?: string;
  storageKey?: string;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "dark",
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(storageKey) ?? defaultTheme,
  );

  useEffect(() => {
    if (attribute === "class") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
    localStorage.setItem(storageKey, theme);
  }, [attribute, storageKey, theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider in tests.");
  }

  return context;
}
