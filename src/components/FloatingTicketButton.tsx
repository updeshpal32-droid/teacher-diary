import React, { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { RaiseTicketModal } from './RaiseTicketModal';
import { UserAccount } from '../types/auth';

interface FloatingTicketButtonProps {
  currentUser?: UserAccount | null;
  currentTab?: string;
  onNavigateTab?: (tab: string) => void;
}

export const FloatingTicketButton: React.FC<FloatingTicketButtonProps> = ({
  currentUser,
  currentTab
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 print:hidden flex items-center">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center h-11 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-purple-600/30 border border-purple-400/40 cursor-pointer transition-all duration-300 ease-out hover:shadow-purple-500/50 p-2.5 overflow-hidden"
          title="Feedback & Report Issue"
          aria-label="Feedback & Report Issue"
        >
          {/* Icon Circle */}
          <div className="w-6 h-6 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform duration-200">
            <MessageSquarePlus className="w-5 h-5 text-white" />
          </div>

          {/* Smooth Expanding Hover Text */}
          <span className="max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 group-hover:mr-1.5 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden text-xs font-semibold select-none">
            Feedback & Report Issue
          </span>
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
