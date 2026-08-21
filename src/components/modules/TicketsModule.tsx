import React from 'react';
import { TicketFeedbackManager } from '../TicketFeedbackManager';

interface TicketsModuleProps {
  devMode: boolean;
}

export const TicketsModule: React.FC<TicketsModuleProps> = ({ devMode }) => {
  return (
    <div className="space-y-4">
      <TicketFeedbackManager devMode={devMode} />
    </div>
  );
};
