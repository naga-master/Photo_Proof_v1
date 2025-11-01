import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { DashboardView, NavItem } from '../../types';
import {
  DashboardIcon, ProjectsIcon, ClientsIcon, InvoicesIcon, AnalyticsIcon, SettingsIcon, WrenchScrewdriverIcon,
} from '../icons';

interface CommandPaletteProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onNavigate: (view: DashboardView) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, setIsOpen, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: { view: DashboardView; label: string; icon: React.ReactNode, category: string, shortcut: string }[] = [
    { view: 'overview', label: 'Dashboard', icon: <DashboardIcon className="w-5 h-5" />, category: 'Navigation', shortcut: 'Ctrl+D' },
    { view: 'projects', label: 'Projects', icon: <ProjectsIcon className="w-5 h-5" />, category: 'Navigation', shortcut: 'Ctrl+P' },
    { view: 'clients', label: 'Clients', icon: <ClientsIcon className="w-5 h-5" />, category: 'Navigation', shortcut: 'Ctrl+C' },
    { view: 'invoices', label: 'Invoices', icon: <InvoicesIcon className="w-5 h-5" />, category: 'Navigation', shortcut: 'Ctrl+I' },
    { view: 'analytics', label: 'Analytics', icon: <AnalyticsIcon className="w-5 h-5" />, category: 'Navigation', shortcut: 'Ctrl+A' },
    { view: 'tools', label: 'AI Tools', icon: <WrenchScrewdriverIcon className="w-5 h-5" />, category: 'Features', shortcut: 'Ctrl+T' },
    { view: 'settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5" />, category: 'Navigation', shortcut: 'Ctrl+,' },
  ];

  const filteredCommands = query === ''
    ? commands
    : commands.filter(command =>
        command.label.toLowerCase().includes(query.toLowerCase()) ||
        command.category.toLowerCase().includes(query.toLowerCase())
      );

  const closePalette = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, [setIsOpen]);

  const executeCommand = useCallback((view: DashboardView) => {
    onNavigate(view);
    closePalette();
  }, [onNavigate, closePalette]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePalette();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex].view);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closePalette, executeCommand, selectedIndex, filteredCommands]);
  
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closePalette}></div>
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 transform transition-all">
        <div className="p-2">
          <input
            type="text"
            placeholder="Search commands..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full px-4 py-3 text-lg bg-transparent border-0 focus:ring-0 focus:outline-none"
            autoFocus
          />
        </div>
        <hr />
        <ul className="p-2 max-h-96 overflow-y-auto">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((command, index) => (
              <li
                key={command.view}
                onClick={() => executeCommand(command.view)}
                onMouseMove={() => setSelectedIndex(index)}
                className={`flex justify-between items-center p-3 rounded-md cursor-pointer text-sm ${
                  selectedIndex === index ? 'bg-gray-100' : ''
                }`}
              >
                <div className="flex items-center gap-3 text-gray-700">
                  {command.icon}
                  <span>{command.label}</span>
                </div>
                <span className="text-xs text-gray-400">{command.category}</span>
              </li>
            ))
          ) : (
            <li className="p-4 text-center text-sm text-gray-500">No results found.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default CommandPalette;