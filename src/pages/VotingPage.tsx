import React from 'react';
import { VotingForm } from '@/components/voting/VotingForm';
import { ToastProvider } from '@/components/ui/toast';

interface VotingPageProps {
  userId: string;
}

export function VotingPage({ userId }: VotingPageProps) {
  return (
    <ToastProvider>
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Stem op De Mol</h1>
          <p className="text-sm sm:text-base text-zinc-400 mb-6 sm:mb-8">
            Verdeel 100 punten over de kandidaten die volgens jou De Mol kunnen zijn.
            Hoe meer punten je op een kandidaat zet, hoe meer je vermoedt dat deze persoon De Mol is.
          </p>
          
          <VotingForm userId={userId} />
        </div>
      </div>
    </ToastProvider>
  );
} 