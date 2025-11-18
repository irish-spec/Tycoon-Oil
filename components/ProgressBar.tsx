import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  isProducing: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, isProducing }) => {
  return (
    <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden mt-2 border border-gray-700 relative">
      <div
        className={`h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-100 ease-linear`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};