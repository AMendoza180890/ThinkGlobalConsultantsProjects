import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Building2,
  ChevronDown,
  ClipboardList,
  HelpCircle,
  LogOut,
  Mail,
  Search,
  Settings,
} from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { SchoolProvider } from "@/hooks/useSchoolContext";
import { FilterProvider, FilterRail } from "@/components/FilterRail";
import { useAuth } from "@/hooks/useAuth";
import { useSchoolContext } from "@/hooks/useSchoolContext";

function HeaderBar() {
  const { user, signOut } = useAuth();
  const { schools, selectedSchoolId, setSelectedSchoolId } = useSchoolContext();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [schoolMenuOpen, setSchoolMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const schoolMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
      if (schoolMenuRef.current && !schoolMenuRef.current.contains(e.target as Node))
        setSchoolMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedSchool = schools?.find((s) => s.id === selectedSchoolId);
  const displayName = user?.user_metadata?.full_name ?? user?.email ?? "User";
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "TG";

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center gap-3 z-40 shrink-0">
      {/* Left: logo + sidebar trigger */}
      <div className="flex items-center gap-3 shrink-0">
        <img src="/TGC-logo.png" alt="Think Global Consultants" className="h-24 w-auto object-contain shrink-0" />
      </div>

      {/* Center: Search */}
      <div className="flex-1 flex justify-center max-w-3xl mx-auto">
        <div className={`relative w-full transition-all duration-200 ${searchOpen ? "max-w-2xl" : "max-w-lg"}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff, surveys, reports..."
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setSearchOpen(false)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#1a7a7a]/40 focus:bg-white focus:ring-2 focus:ring-[#1a7a7a]/10 transition-all"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* School selector */}
        <div ref={schoolMenuRef} className="relative hidden sm:block">
          <button
            onClick={() => setSchoolMenuOpen(!schoolMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors text-sm"
          >
            <Building2 className="w-4 h-4 text-[#1a7a7a]" />
            <span className="text-slate-700 font-medium">
              {selectedSchool?.name ?? "Select school"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          {schoolMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
              {schools?.map((school) => (
                <button
                  key={school.id}
                  onClick={() => { setSelectedSchoolId(school.id); setSchoolMenuOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 ${
                    school.id === selectedSchoolId
                      ? "text-slate-700 font-medium bg-[#1a7a7a]/5"
                      : "text-slate-500"
                  }`}
                >
                  <Building2 className={`w-4 h-4 ${school.id === selectedSchoolId ? "text-[#1a7a7a]" : "text-slate-400"}`} />
                  {school.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Help */}
        <button
          className="p-2 text-slate-400 hover:text-[#1a7a7a] hover:bg-slate-50 rounded-lg transition-colors"
          title="Help & Support"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 text-slate-400 hover:text-[#1a7a7a] hover:bg-slate-50 rounded-lg transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">Notifications</span>
                <span className="text-xs text-[#1a7a7a] font-medium cursor-pointer hover:underline">
                  Mark all read
                </span>
              </div>
              <div className="divide-y divide-slate-50">
                <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
                  <p className="text-sm text-slate-700">
                    New friction report submitted by <span className="font-medium">Sarah M.</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">2 hours ago</p>
                </div>
                <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
                  <p className="text-sm text-slate-700">
                    Weekly survey results are ready for <span className="font-medium">{selectedSchool?.name ?? "your school"}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Yesterday</p>
                </div>
                <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">3 staff members</span> completed their wellbeing check-in
                  </p>
                  <p className="text-xs text-slate-400 mt-1">2 days ago</p>
                </div>
              </div>
              <div className="px-4 py-2.5 border-t border-slate-100 text-center">
                <span className="text-xs text-[#1a7a7a] font-medium cursor-pointer hover:underline">
                  View all notifications
                </span>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 pl-2 sm:pl-3 pr-1 py-1 rounded-full hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
          >
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-700 leading-tight">{displayName}</p>
              <p className="text-[11px] text-slate-400 leading-tight">Admin</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#1a7a7a] flex items-center justify-center text-white text-sm font-medium">
              {initials}
            </div>
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-800">{displayName}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <button onClick={() => navigate("/admin/surveys")} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2.5">
                <ClipboardList className="w-4 h-4 text-slate-400" />
                Surveys
              </button>
              <button onClick={() => navigate("/admin/email-monitor")} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400" />
                Email Monitor
              </button>
              <button onClick={() => navigate("/admin/schools")} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                Manage Schools
              </button>
              <div className="border-t border-slate-100 mt-1 pt-1">
                <button onClick={() => navigate("/settings")} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-slate-400" />
                  Settings
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  Help & Support
                </button>
              </div>
              <div className="border-t border-slate-100 mt-1 pt-1">
                <button
                  onClick={() => signOut()}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function LayoutInner({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const showFilterRail = location.pathname.startsWith("/premium/school-level");
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function updateHeaderHeight() {
      if (headerRef.current) {
        const h = headerRef.current.getBoundingClientRect().height;
        document.documentElement.style.setProperty("--header-height", `${h}px`);
      }
    }
    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);
    return () => window.removeEventListener("resize", updateHeaderHeight);
  }, []);

  return (
    <div className="h-screen flex flex-col w-full bg-[#f7f8fa]">
      <div ref={headerRef} className="sticky top-0 z-40 shrink-0">
        <HeaderBar />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <FilterProvider>
          <div className="flex-1 flex min-w-0 overflow-hidden">
            {showFilterRail && !isMobile && <FilterRail />}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </FilterProvider>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  return (
    <SchoolProvider>
      <SidebarProvider defaultOpen={!isMobile} open={isMobile ? undefined : true}>
        <LayoutInner>{children}</LayoutInner>
      </SidebarProvider>
    </SchoolProvider>
  );
}
