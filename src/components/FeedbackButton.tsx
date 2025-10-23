'use client';

import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import FeedbackDialog from './FeedbackDialog';
import { useSession } from 'next-auth/react';

const FeedbackButton: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: session } = useSession();

  // Don't show feedback button if user is not logged in
  if (!session) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        className="fixed bottom-6 right-6 z-50 group bg-linear-to-r from-pink-600 to-orange-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800"
        aria-label="Send Feedback"
      >
        <MessageSquare className="h-6 w-6" />
        
        {/* Tooltip */}
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none shadow-lg">
          Send Feedback
        </span>

        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-linear-to-r from-pink-600 to-orange-600 animate-ping opacity-20"></span>
      </button>

      <FeedbackDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
};

export default FeedbackButton;
