import { NavLink, useLocation } from "react-router-dom";
import {
  Fingerprint,
  TrendingUp,
  AlertTriangle,
  Heart,
  ListChecks,
  ClipboardList,
  Compass,
  FileText,
  Home,
  BarChart3,
  UserMinus,
  UserPlus,
  ClipboardCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

// ─── Badge pill ───────────────────────────────────────────────────────────────

type BadgeColor = "amber" | "red" | "blue";

function CountBadge({ count, color }: { count: number; color: BadgeColor }) {
  if (count <= 0) return null;
  const styles: Record<BadgeColor, string> = {
    amber: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    red:   "bg-red-500/10 text-red-400 border border-red-500/20",
    blue:  "bg-[#4db8b8]/10 text-[#4db8b8] border border-[#4db8b8]/20",
  };
  return (
    <span className={cn("ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none", styles[color])}>
      {count}
    </span>
  );
}

function PremiumBadge() {
  return (
    <span className="ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider leading-none bg-amber-500/10 text-amber-400 border border-amber-500/20">
      Premium
    </span>
  );
}

// ─── Nav item ─────────────────────────────────────────────────────────────────

function NavItem({
  to,
  label,
  icon: Icon,
  badge,
  redBadge,
  premium,
  collapsed,
  wrap,
}: {
  to: string;
  label: React.ReactNode;
  icon: React.ElementType;
  badge?: { count: number; color: BadgeColor };
  redBadge?: number;
  premium?: boolean;
  collapsed: boolean;
  wrap?: boolean;
}) {
  const location = useLocation();
  // highlight if current path starts with this route (handles tab sub-pages)
  const isActive = location.pathname === to;

  return (
    <SidebarMenuItem className="relative">
      {isActive && (
        <div className="absolute w-[4px] bg-[#4db8b8] z-10" style={{ left: 0, top: 2, bottom: 2 }} />
      )}
      <SidebarMenuButton asChild className={wrap ? "h-auto" : undefined}>
        <NavLink
          to={to}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
            isActive
              ? "bg-[#1a7a7a]/15 text-[#4db8b8] font-medium"
              : "text-slate-400 hover:bg-[#113a49] hover:text-slate-200"
          )}
        >
          <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#4db8b8]" : "text-slate-500")} />
          {!collapsed && (
            <>
              <span className={cn("flex-1 leading-tight", wrap ? "whitespace-normal" : "truncate")}>{label}</span>
              {badge && <CountBadge count={badge.count} color={badge.color} />}
              {redBadge != null && redBadge > 0 && <CountBadge count={redBadge} color="red" />}
              {premium && !badge && !redBadge && <PremiumBadge />}
            </>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// ─── Collapsible Nav Item ─────────────────────────────────────────────────────

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 pb-1">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>{children}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent className="flex flex-col h-full">
        {/* Scrollable nav */}
        <div className="flex-1 overflow-y-auto">
          {/* Home */}
          <Section label="">
            <NavItem to="/" label="Home" icon={Home} collapsed={collapsed} />
            <NavItem to="/quarterly-action-plan" label="Quarterly Action Plan" icon={ListChecks} collapsed={collapsed} />
            <NavItem to="/quarterly-reports" label="Quarterly Reports" icon={FileText} collapsed={collapsed} />
            <NavItem
              to="/analytics/cultural-fingerprint"
              label="Cultural Preferences"
              icon={Fingerprint}
              collapsed={collapsed}
            />
            <NavItem
              to="/analytics/cq-navigator"
              label="CQ Navigator"
              icon={TrendingUp}
              collapsed={collapsed}
            />
            <NavItem to="/staff/wellness" label="Staff Wellness" icon={Heart} collapsed={collapsed} />
            <NavItem to="/staff/leadership-clarity" label="Leadership Clarity" icon={Compass} collapsed={collapsed} />
            <NavItem to="/staff/new-staff-integration" label="New Staff Integration" icon={UserPlus} collapsed={collapsed} />
            <NavItem to="/analytics/benchmarking" label={<>Cultural<br />Benchmarks</>} icon={BarChart3} collapsed={collapsed} premium wrap />
            <NavItem to="/analytics/turnover-benchmarks" label="Turnover Benchmarks" icon={UserMinus} collapsed={collapsed} premium wrap />
          </Section>

          {/* Staff & Issues */}
          <Section label="Staff & Issues">
            <NavItem
              to="/staff/issues"
              label="Weekly Frictions"
              icon={AlertTriangle}
              collapsed={collapsed}
            />
          </Section>

          {/* Survey Responses */}
          <Section label="Survey Responses">
            <NavItem to="/survey-hub" label="Survey Hub" icon={ClipboardList} collapsed={collapsed} />
            <NavItem to="/survey" label="Survey" icon={ClipboardCheck} collapsed={collapsed} />
          </Section>


        </div>

      </SidebarContent>
    </Sidebar>
  );
}
