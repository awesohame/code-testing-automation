import * as React from "react";
import {
  BarChart3,
  Brain,
  ChevronLeft,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  TestTube,
  Users,
  Globe2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "./ui/tooltip";

// Helper function to replace Next.js's cn utility
const cn = (...classes: any[]) => {
  return classes.filter(Boolean).join(" ");
};

// Routes configuration
const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-sky-400",
  },
  {
    label: "Test Cases",
    icon: ShieldCheck,
    href: "/test-cases",
    color: "text-indigo-400",
  },
  {
    label: "Testing Suite",
    icon: TestTube,
    href: "/testing",
    color: "text-violet-400",
  },
  {
    label: "Code Culture",
    icon: Globe2,
    href: "/code-culture",
    color: "text-blue-400",
  },
  // {
  //   label: "Documentation",
  //   icon: FileText,
  //   href: "/documentation",
  //   color: "text-pink-400",
  // },
  {
    label: "AI Tools",
    icon: Brain,
    href: "/ai-tools",
    color: "text-orange-400",
  },
  {
    label: "Leaderboard",
    icon: BarChart3,
    href: "/leaderboard",
    color: "text-emerald-400",
  },
  {
    label: "Manager View",
    icon: Users,
    href: "/manager-view",
    color: "text-blue-400",
  },
];

// Button component
const Button = ({ variant, size, className, onClick, children }: any) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        variant === "ghost" && "hover:bg-muted hover:text-accent-foreground",
        size === "icon" && "h-10 w-10",
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
};



export default function AppSidebar() {
  const [pathname, setPathname] = React.useState(window.location.pathname);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Clean up event listener
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle navigation and update pathname
  const handleNavigation = (href: string) => {
    navigate(href);
    setPathname(href);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "relative h-screen border-r transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[60px]" : "w-[260px]",
          "bg-[#0f172a] border-[#1e293b]"
        )}
      >
        {/* Logo/Brand */}
        <div
          className={cn(
            "flex items-center h-16 px-4 border-b border-[#1e293b]",
            isCollapsed ? "justify-center" : "justify-start"
          )}
        >
          {!isCollapsed && (
            <span className="text-xl font-semibold text-white">TestForge</span>
          )}
        </div>

        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 rounded-full bg-[#1e293b] border border-[#334155] shadow-md hover:bg-[#334155] hover:text-white"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 text-white transition-transform",
              isCollapsed && "rotate-180"
            )}
          />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>

        {/* Navigation Links */}
        <div className="space-y-2 py-4">
          <div className="px-3 py-2">
            <div className="space-y-1">
              {routes.map((route) => (
                <Tooltip key={route.href}>
                  <TooltipTrigger asChild>
                    <button

                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigation(route.href);
                      }}
                      className={cn(
                        "flex items-center w-full p-2 rounded-md transition-colors",
                        pathname === route.href
                          ? "bg-[#1e293b] text-white"
                          : "text-[#94a3b8] hover:text-white hover:bg-[#1e293b]",
                        isCollapsed ? "justify-center" : "justify-start p-3"
                      )}
                    >
                      <route.icon
                        className={cn(
                          "h-6 w-6",
                          isCollapsed ? "mr-0" : "mr-3",
                          pathname === route.href ? "text-white" : route.color
                        )}
                      />
                      {!isCollapsed && (
                        <span className="text-md font-medium">
                          {route.label}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent
                      side="right"
                      className="bg-[#1e293b] text-white border-[#334155]"
                    >
                      {route.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 p-3 border-t border-[#1e293b] bg-[#0f172a]",
            isCollapsed ? "flex justify-center" : "flex justify-start space-x-2"
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-md text-[#94a3b8] hover:text-white hover:bg-[#1e293b]"
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="bg-[#1e293b] text-white border-[#334155]"
            >
              Settings
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-md text-[#94a3b8] hover:text-white hover:bg-[#1e293b]"
              >
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Log out</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="bg-[#1e293b] text-white border-[#334155]"
            >
              Log out
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
