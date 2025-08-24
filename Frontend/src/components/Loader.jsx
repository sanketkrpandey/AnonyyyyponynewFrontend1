import React from 'react';

export default function Loader({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        <span>{label}</span>
      </div>
    </div>
  );
}