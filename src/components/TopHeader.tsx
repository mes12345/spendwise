
import React from 'react';

interface TopHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
}

const TopHeader: React.FC<TopHeaderProps> = ({ title, rightElement }) => {
  return (
    <div className="flex-none z-50 px-5 pt-[env(safe-area-inset-top,44px)] pb-3 bg-white/80 ios-blur flex justify-between items-center border-b border-gray-100">
      <div className="flex-1">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
      </div>
      {rightElement && (
        <div className="flex-none flex justify-end">
          {rightElement}
        </div>
      )}
    </div>
  );
};

export default TopHeader;
