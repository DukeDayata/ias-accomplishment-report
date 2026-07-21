import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-slate-300 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-slate-700 mb-2">Page Not Found</h2>
      <p className="text-slate-500 mb-6">The page you are looking for doesn't exist or has been moved.</p>
      <Link to="/" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
        Return to Dashboard
      </Link>
    </div>
  );
}
