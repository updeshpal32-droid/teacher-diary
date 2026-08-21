import React, { useState } from 'react';
import { MessageSquarePlus, HelpCircle } from 'lucide-react';
import { RaiseTicketModal } from './RaiseTicketModal';
import { UserAccount } from '../types/auth';

interface FloatingTicketButtonProps {
  currentUser?: UserAccount | null;
  currentTab?: string;
  onNavigateTab?: (tab: string) => void;
}

export const FloatingTicketButton: React.FC<FloatingTicketButtonProps> = ({
  currentUser,
  currentTab,
  onNavigateTab
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 print:hidden flex items-center gap-2">
        <button
          onClick={() => setIsOpen(true)}
          className="px-3.5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-purple-600/40 border border-purple-400/40 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 group"
          title="Raise Ticket / Feedback / Report Bug"
        >
          <span className="p-1 rounded-full bg-white/20 group-hover:rotate-12 transition-transform">
            <MessageSquarePlus className="w-4 h-4 text-white" />
          </span>
          <span className="hidden sm:inline font-sans">Feedback & Report Issue</span>
        </button>
      </div>

      <RaiseTicketModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentUser={currentUser}
        currentTab={currentTab}
      />
    </>
  );
};
