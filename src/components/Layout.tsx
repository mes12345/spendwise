
import React from 'react';
import { motion } from 'motion/react';
import TopHeader from './TopHeader';

interface LayoutProps {
  title: string;
  rightHeaderElement?: React.ReactNode;
  viewToggleElement?: React.ReactNode;
  bottomNavElement: React.ReactNode;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ 
  title, 
  rightHeaderElement, 
  viewToggleElement, 
  bottomNavElement, 
  children 
}) => {
  return (
    <div className="max-w-md mx-auto h-screen bg-slate-50 flex flex-col relative shadow-2xl overflow-hidden border-x border-slate-200">
      <TopHeader title={title} rightElement={rightHeaderElement} />
      
      {viewToggleElement}
      
      <main className="flex-1 overflow-y-auto hide-scrollbar bg-white relative z-0">
        {children}
      </main>

      <nav className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] px-10 flex justify-between items-center border-t border-slate-100 z-50">
        {bottomNavElement}
      </nav>
    </div>
  );
};

export default Layout;
