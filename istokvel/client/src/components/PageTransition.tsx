import React from 'react';

interface PageTransitionProps {
  show: boolean;
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ show, children }) => (
  <div className="relative">
    <div
      className={`fixed inset-0 bg-blue-600 z-50 transition-transform duration-500 ease-in-out ${
        show ? 'translate-y-0' : 'translate-y-full'
      }`}
    />
    {children}
  </div>
  );

export default PageTransition; 