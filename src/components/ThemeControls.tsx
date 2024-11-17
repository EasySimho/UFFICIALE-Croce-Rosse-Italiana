import { Moon, Sun, Type } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeControls() {
  const { isDark, toggleDark, textSize, toggleTextSize } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleDark}
        className="p-2 rounded-md hover:bg-gray-500 dark:hover:bg-gray-700 transition-colors"
        title={isDark ? 'Modalità Chiara' : 'Modalità Scura'}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <button
        onClick={toggleTextSize}
        className="p-2 rounded-md hover:bg-gray-500 dark:hover:bg-gray-700 transition-colors"
        title={textSize === 'large' ? 'Testo Normale' : 'Testo Grande'}
      >
        <Type size={20} />
      </button>
    </div>
  );
}