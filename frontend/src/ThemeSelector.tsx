import React from 'react';
import { useTheme } from './ThemeContext';

const ThemeSelector: React.FC = () => {
  const { themeName, setTheme, availableThemes } = useTheme();

  const themeDisplayNames: { [key: string]: string } = {
    default: '🌙 Default Dark',
    harryPotter: '⚡ Harry Potter',
    strangerThings: '🔴 Stranger Things',
    marvel: '🦸 Marvel',
    disney: '🏰 Disney',
  };

  return (
    <div className="theme-selector">
      <label htmlFor="theme-select">Theme:</label>
      <select
        id="theme-select"
        value={themeName}
        onChange={(e) => setTheme(e.target.value)}
        className="theme-select"
      >
        {availableThemes.map((theme) => (
          <option key={theme} value={theme}>
            {themeDisplayNames[theme] || theme}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ThemeSelector;