import React, { useState } from 'react';
import ReportMatrix from './ReportMatrix';
import ReportReviewList from './ReportReviewList';

export default function ReportReview() {
  const [view, setView] = useState('list'); // Default to list view

  return (
    <div className="h-[calc(100vh-6rem)]">
      {view === 'matrix' ? (
        <ReportMatrix onSwitchView={setView} />
      ) : (
        <ReportReviewList onSwitchView={setView} />
      )}
    </div>
  );
}

