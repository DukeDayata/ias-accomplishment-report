import React, { useState } from 'react';
import AccomplishmentMatrix from './AccomplishmentMatrix';
import AccomplishmentsList from './AccomplishmentsList';

export default function AccomplishmentsManager() {
  const [view, setView] = useState('list'); // Default to list view as requested

  return (
    <div className="h-[calc(100vh-6rem)]">
      {view === 'matrix' ? (
        <AccomplishmentMatrix onSwitchView={setView} />
      ) : (
        <AccomplishmentsList onSwitchView={setView} />
      )}
    </div>
  );
}
