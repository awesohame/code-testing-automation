import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom'; // Replace Next.js imports
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  TestTube,
  FileText,
  Brain,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  LogOut,
  Globe2,
  ShieldCheck,
} from 'lucide-react';

const routes = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    color: 'text-sky-500',
    description: 'Overview of key metrics and status',
  },
  {
    label: 'Test Cases',
    icon: ShieldCheck,
    href: '/test-cases',
    color: 'text-indigo-500',
    description: 'Code culture translation tools',
  },
  {
    label: 'Testing Suite',
    icon: TestTube,
    href: '/testing',
    color: 'text-violet-500',
    description: 'Run and manage tests',
  },
  {
    label: 'Code Culture',
    icon: Globe2,
    href: '/code-culture',
    color: 'text-indigo-500',
    description: 'Code culture translation tools',
  },
  {
    label: 'Documentation',
    icon: FileText,
    href: '/docs',
    color: 'text-pink-700',
    description: 'Access project documentation',
  },
  {
    label: 'AI Tools',
    icon: Brain,
    href: '/ai-tools',
    color: 'text-orange-700',
    description: 'AI-powered development tools',
  },
  {
    label: 'Leaderboard',
    icon: BarChart3,
    href: '/leaderboard',
    color: 'text-emerald-500',
    description: 'Data insights and reports',
  },
  {
    label: 'Manager View',
    icon: Users,
    href: '/manager-dashboard',
    color: 'text-blue-700',
    description: 'Team management dashboard',
  },
];

export default function Sidebar() {
  const location = useLocation(); // Replace usePathname with useLocation
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <TooltipProvider>
      <div
        className={cn(
          'relative h-full border-r pt-16 bg-card transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-16' : 'w-64',
          'shadow-sm'
        )}
      >
        {/* Company Title */}
        <div
          className={cn(
            'absolute top-0 left-0 right-0 p-4 border-b bg-card',
            'flex items-center gap-2',
            isCollapsed ? 'justify-center' : 'justify-start'
          )}
        >
          {!isCollapsed && <span className="font-bold text-lg tracking-tight">TestForge</span>}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'absolute -right-3 top-20 rounded-full bg-background border shadow-sm',
            'hover:bg-accent hover:text-accent-foreground',
            'transition-all duration-200'
          )}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <ChevronLeft
            className={cn('h-4 w-4 transition-transform duration-200', isCollapsed && 'rotate-180')}
          />
        </Button>

        <div className="space-y-2 py-4">
          <div className="px-3 py-2">
            <div className="space-y-1">
              {routes.map((route) => (
                <Tooltip key={route.href} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      to={route.href} // Replace href with to
                      className={cn(
                        'flex p-3 w-full items-center rounded-lg transition-colors duration-200',
                        'hover:bg-accent hover:text-accent-foreground',
                        location.pathname === route.href ? 'bg-accent text-accent-foreground' : 'transparent', // Replace pathname with location.pathname
                        isCollapsed ? 'justify-center' : 'justify-start'
                      )}
                    >
                      <route.icon
                        className={cn(
                          'h-5 w-5 shrink-0',
                          isCollapsed ? 'mr-0' : 'mr-3',
                          route.color,
                          location.pathname === route.href && 'text-current' // Replace pathname with location.pathname
                        )}
                      />
                      {!isCollapsed && (
                        <span className="text-sm font-medium truncate">{route.label}</span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right" className="flex items-center gap-4">
                      <span className="font-medium">{route.label}</span>
                      {/* <span className="text-muted-foreground text-xs">{route.description}</span> */}
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Bottom section with settings and logout */}
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 p-3 border-t bg-card',
              'flex items-center gap-2',
              isCollapsed ? 'justify-center' : 'justify-start'
            )}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-lg">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-lg">
                  <LogOut className="h-5 w-5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}