import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSidebar } from '@/contexts/SidebarContext';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import DesktopSidebar from './DesktopSidebar';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

const ResponsiveLayout = ({ children }: ResponsiveLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { sidebarCollapsed } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      {/* Mobile Menu Toggle - Top Right */}
      {isMobile && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 right-4 z-50 glass-panel"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <DesktopSidebar />
        )}

        {/* Mobile Sidebar Overlay */}
        {isMobile && sidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed top-0 right-0 h-full w-80 glass-panel z-50 transform transition-transform duration-300">
              <div className="p-6 pt-20">
                <DesktopSidebar mobile onItemClick={() => setSidebarOpen(false)} />
              </div>
            </div>
          </>
        )}

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${
          !isMobile ? (sidebarCollapsed ? 'ml-20' : 'ml-64') : ''
        } pt-16 pb-20 md:pb-4 ${!isMobile ? 'h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden' : ''}`}>
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && <BottomNav />}
    </div>
  );
};

export default ResponsiveLayout;