
import React from 'react';

interface TopHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
}

const TopHeader: React.FC<TopHeaderProps> = ({ title, rightElement }) => {
  return (
    <div className="sticky top-0 z-50 px-5 pt-[env(safe-area-inset-top,48px)] pb-4 bg-[#F2F2F7]/80 ios-blur flex justify-between items-end border-b border-gray-200">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-black">{title}</h1>
      </div>
      {rightElement && <div>{rightElement}</div>}
    </div>
  );
};

export default TopHeader;
