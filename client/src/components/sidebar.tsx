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
import { SignOutButton } from "@clerk/clerk-react";

// Helper function to replace Next.js's cn utility
const cn = (...classes: any[]) => {
  return classes.filter(Boolean).join(" ");
};

// Routes configuration with updated colors
const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-blue-400",
  },
  // {
  //   label: "Test Cases",
  //   icon: ShieldCheck,
  //   href: "/test-cases",
  //   color: "text-blue-400",
  // },
  {
    label: "Testing Suite",
    icon: TestTube,
    href: "/testing",
    color: "text-blue-400",
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
  //   color: "text-blue-400",
  // },
  {
    label: "AI Tools",
    icon: Brain,
    href: "/ai-tools",
    color: "text-blue-400",
  },
  {
    label: "Leaderboard",
    icon: BarChart3,
    href: "/leaderboard",
    color: "text-blue-400",
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
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2",
        variant === "ghost" && "hover:bg-blue-500/10 hover:text-blue-100",
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
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
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
          "bg-[#0a1122] border-blue-500/20"
        )}
      >
        {/* Logo/Brand with subtle animation */}
        <div
          className={cn(
            "flex items-center h-16 px-4 border-b border-blue-500/20",
            isCollapsed ? "justify-center" : "justify-start"
          )}
        >
          {!isCollapsed && (
            <span className="text-3xl font-black text-blue-100 bg-gradient-to-r from-blue-300 to-blue-400 bg-clip-text text-transparent transition-all duration-300">
              TestForge
            </span>
          )}
        </div>

        {/* Toggle Button with pulse animation on hover */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 rounded-full bg-[#0f172a] border border-blue-500/30 shadow-md hover:bg-blue-500/10 hover:shadow-blue-500/20 shadow-lg transition-all duration-300 hover:border-blue-400/50 group z-[999]"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 text-blue-100 transition-transform duration-300 ease-in-out group-hover:text-blue-400",
              isCollapsed && "rotate-180"
            )}
          />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>

        {/* Navigation Links with hover animations */}
        <div className="space-y-2 py-4">
          <div className="px-3 py-2">
            <div className="space-y-1">
              {routes.map((route) => (
                <Tooltip key={route.href}>
                  <TooltipTrigger asChild>
                    <button
                      onMouseEnter={() => setHoveredItem(route.href)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigation(route.href);
                      }}
                      className={cn(
                        "flex items-center w-full rounded-md transition-all duration-200",
                        pathname === route.href
                          ? "bg-blue-500/10 text-blue-100 border-l-2 border-blue-400"
                          : "text-blue-100/80 hover:text-blue-100 hover:bg-blue-500/5",
                        isCollapsed ? "justify-center py-3 px-2" : "justify-start p-3",
                        hoveredItem === route.href && pathname !== route.href && "bg-blue-500/5"
                      )}
                    >
                      <route.icon
                        className={cn(
                          "transition-all duration-300",
                          isCollapsed ? "mr-0" : "mr-3",
                          pathname === route.href
                            ? "text-blue-400 scale-110"
                            : hoveredItem === route.href
                              ? "text-blue-400 scale-105"
                              : "text-blue-100/80",
                          "h-6 w-6"
                        )}
                      />
                      {!isCollapsed && (
                        <span
                          className={cn(
                            "text-md font-medium transition-all duration-200",
                            pathname === route.href ? "text-blue-100" : "text-blue-100/80"
                          )}
                        >
                          {route.label}
                        </span>
                      )}
                      {/* Active indicator dot */}
                      {pathname === route.href && !isCollapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                      )}
                    </button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent
                      side="right"
                      className="bg-[#0f172a] text-blue-100 border-blue-500/30 shadow-md shadow-blue-900/20"
                    >
                      {route.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Actions with subtle hover effects */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 p-3 border-t border-blue-500/20 bg-[#0a1122]/80 backdrop-blur-sm",
            isCollapsed ? "flex justify-center" : "flex justify-start space-x-2"
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-md text-blue-100/80 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-300"
              >
                <Settings className="h-5 w-5 transition-transform duration-500 hover:rotate-90" />
                <span className="sr-only">Settings</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="bg-[#0f172a] text-blue-100 border-blue-500/30"
            >
              Settings
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-md text-blue-100/80 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-300"
              >
                <LogOut className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                <span className="sr-only">Log out</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="bg-[#0f172a] text-blue-100 border-blue-500/30"
            >
              Log out
            </TooltipContent>
            <SignOutButton />
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}