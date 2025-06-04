
import React, { useState, useEffect } from 'react';
import { Settings, Palette, Hash, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
  };
}

const themes: Theme[] = [
  {
    id: 'cyber-default',
    name: 'Cyber Default (Current)',
    colors: {
      primary: '#00ffff',
      secondary: '#ff00ff',
      accent: '#00ff00',
      background: '#0a0a0f',
      surface: '#1a1a2e'
    }
  },
  {
    id: 'neon-purple',
    name: 'Neon Purple',
    colors: {
      primary: '#8b5cf6',
      secondary: '#a855f7',
      accent: '#c084fc',
      background: '#0f0a1a',
      surface: '#1e1a2e'
    }
  },
  {
    id: 'electric-blue',
    name: 'Electric Blue',
    colors: {
      primary: '#3b82f6',
      secondary: '#1d4ed8',
      accent: '#60a5fa',
      background: '#0a0f1a',
      surface: '#1a1e2e'
    }
  },
  {
    id: 'matrix-green',
    name: 'Matrix Green',
    colors: {
      primary: '#10b981',
      secondary: '#059669',
      accent: '#34d399',
      background: '#0a1a0f',
      surface: '#1a2e1e'
    }
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    colors: {
      primary: '#f59e0b',
      secondary: '#d97706',
      accent: '#fbbf24',
      background: '#1a0f0a',
      surface: '#2e1e1a'
    }
  }
];

interface AppSettingsProps {
  decimalPlaces: number;
  onDecimalPlacesChange: (places: number) => void;
}

export const AppSettings: React.FC<AppSettingsProps> = ({
  decimalPlaces,
  onDecimalPlacesChange
}) => {
  const [selectedTheme, setSelectedTheme] = useState('cyber-default');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'cyber-default';
    setSelectedTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;

    const root = document.documentElement;
    
    // Apply CSS custom properties
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-background', theme.colors.background);
    root.style.setProperty('--color-surface', theme.colors.surface);

    // Update Tailwind classes dynamically
    const styleElement = document.getElementById('dynamic-theme');
    if (styleElement) {
      styleElement.remove();
    }

    const newStyle = document.createElement('style');
    newStyle.id = 'dynamic-theme';
    newStyle.textContent = `
      :root {
        --neon-blue: ${theme.colors.primary};
        --neon-purple: ${theme.colors.secondary};
        --neon-green: ${theme.colors.accent};
        --cyber-dark: ${theme.colors.background};
        --cyber-light: ${theme.colors.surface};
      }
      .text-neon-blue { color: ${theme.colors.primary} !important; }
      .text-neon-purple { color: ${theme.colors.secondary} !important; }
      .text-neon-green { color: ${theme.colors.accent} !important; }
      .bg-cyber-dark { background-color: ${theme.colors.background} !important; }
      .bg-cyber-light { background-color: ${theme.colors.surface} !important; }
      .border-neon-blue { border-color: ${theme.colors.primary}40 !important; }
      .border-neon-purple { border-color: ${theme.colors.secondary}40 !important; }
      .border-neon-green { border-color: ${theme.colors.accent}40 !important; }
    `;
    document.head.appendChild(newStyle);
  };

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    applyTheme(themeId);
    localStorage.setItem('app-theme', themeId);
  };

  const handleDecimalChange = (value: string) => {
    const places = parseInt(value);
    onDecimalPlacesChange(places);
    localStorage.setItem('decimal-places', places.toString());
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          className="bg-cyber-light border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10"
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-cyber-dark border-neon-purple/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-neon-purple flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Application Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Theme Selection */}
          <div>
            <Label className="text-neon-blue flex items-center mb-3">
              <Palette className="w-4 h-4 mr-2" />
              Theme Selection
            </Label>
            <Select value={selectedTheme} onValueChange={handleThemeChange}>
              <SelectTrigger className="bg-cyber-light border-neon-blue/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-cyber-light border-neon-blue/30 text-white z-50">
                {themes.map(theme => (
                  <SelectItem key={theme.id} value={theme.id}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded border border-gray-400"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <span>{theme.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Decimal Places */}
          <div>
            <Label className="text-neon-green flex items-center mb-3">
              <Hash className="w-4 h-4 mr-2" />
              Decimal Places
            </Label>
            <Select value={decimalPlaces.toString()} onValueChange={handleDecimalChange}>
              <SelectTrigger className="bg-cyber-light border-neon-green/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-cyber-light border-neon-green/30 text-white z-50">
                <SelectItem value="0">0 (Integer)</SelectItem>
                <SelectItem value="1">1 (0.0)</SelectItem>
                <SelectItem value="2">2 (0.00)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Theme Preview */}
          <div className="p-3 rounded border border-neon-purple/30 bg-cyber-light">
            <h4 className="text-sm font-semibold text-neon-purple mb-2">Preview</h4>
            <div className="flex space-x-2">
              {themes.find(t => t.id === selectedTheme) && (
                <>
                  <div 
                    className="w-8 h-8 rounded border border-gray-400"
                    style={{ backgroundColor: themes.find(t => t.id === selectedTheme)?.colors.primary }}
                    title="Primary Color"
                  />
                  <div 
                    className="w-8 h-8 rounded border border-gray-400"
                    style={{ backgroundColor: themes.find(t => t.id === selectedTheme)?.colors.secondary }}
                    title="Secondary Color"
                  />
                  <div 
                    className="w-8 h-8 rounded border border-gray-400"
                    style={{ backgroundColor: themes.find(t => t.id === selectedTheme)?.colors.accent }}
                    title="Accent Color"
                  />
                </>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Sample number: {(123.456789).toFixed(decimalPlaces)}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
