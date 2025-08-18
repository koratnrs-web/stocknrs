import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  hideHeader?: boolean;
}

export function Layout({ children, title, hideHeader = false }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-gradient-primary relative overflow-hidden">
      {/* Background Decoration - Removed glass effects */}
      
      <Sidebar />
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-gradient-primary shadow-glow">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="w-full lg:pl-64 flex flex-col min-h-screen relative z-10">
        {!hideHeader && <Header title={title || ''} onMenuClick={() => setSidebarOpen(true)} />}
        
        <main className={`flex-1 overflow-auto ${hideHeader ? 'pt-0' : ''}`}>
          <div className="w-full px-4 py-6 sm:px-6 lg:px-8 relative">
            {/* Content Background - Removed glass effects */}
            <div className="relative z-10 w-full">
              <div className="mx-auto max-w-7xl">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}