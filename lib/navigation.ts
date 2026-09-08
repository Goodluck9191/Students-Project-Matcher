import {
  Bell,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Settings,
  UserRound,
  UsersRound,
  Inbox,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  adminOnly?: boolean;
}

export const STUDENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/matches", label: "Find Teammates", icon: Sparkles },
  { href: "/teams", label: "My Teams", icon: UsersRound },
  { href: "/requests", label: "Requests", icon: Inbox, badge: 3 },
  { href: "/notifications", label: "Notifications", icon: Bell, badge: 5 },
  { href: "/profile/me", label: "Profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: ShieldCheck },
  { href: "/admin/students", label: "Students", icon: GraduationCap },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/teams", label: "Teams", icon: UsersRound },
  { href: "/admin/reports", label: "Reports", icon: LayoutDashboard },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];
