import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Wallet,
  FileSignature,
  Database,
  ArrowRightLeft,
  Sparkles,
  Code,
  Settings,
  History,
  LayoutDashboard,
} from 'lucide-react';

interface SidebarNavigationProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  onViewFullState: () => void;
  onViewHistory: () => void;
}

interface NavigationSection {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const sections: NavigationSection[] = [
  { id: 'wallet-info', label: 'Wallet Information', icon: <Wallet className="h-4 w-4" /> },
  { id: 'signatures', label: 'Signatures', icon: <FileSignature className="h-4 w-4" /> },
  { id: 'utxos', label: 'UTXOs', icon: <Database className="h-4 w-4" /> },
  { id: 'transactions', label: 'Transactions', icon: <ArrowRightLeft className="h-4 w-4" /> },
  { id: 'bet-blueprint', label: 'Test Bet Blueprint', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'nano-generic', label: 'Nano Contracts', icon: <Code className="h-4 w-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
];

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  activeSection,
  onNavigate,
  onViewFullState,
  onViewHistory,
}) => {
  return (
    <div className="sticky top-[57px] h-[calc(100vh-57px)] w-64 flex-shrink-0 bg-gray-900/50 border-r border-gray-700 overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <Button
            onClick={onViewFullState}
            variant="outline"
            size="sm"
            className="w-full justify-start border-hathor-yellow-500/30 hover:border-hathor-yellow-500/50 hover:bg-hathor-yellow-500/10 text-hathor-yellow-500"
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            View Full State
          </Button>
          <Button
            onClick={onViewHistory}
            variant="outline"
            size="sm"
            className="w-full justify-start border-gray-600 hover:border-gray-500 hover:bg-gray-800 text-gray-300"
          >
            <History className="h-4 w-4 mr-2" />
            Request History
          </Button>
        </div>

        {/* Navigation Sections */}
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Sections
          </h3>
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => onNavigate(section.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
                  ${isActive
                    ? 'bg-hathor-yellow-500/20 text-hathor-yellow-500 font-medium'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  }
                `}
              >
                {section.icon}
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 leading-relaxed">
            Click a section to scroll to it. The active section is highlighted.
          </p>
        </div>
      </div>
    </div>
  );
};
