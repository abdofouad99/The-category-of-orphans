"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Users,
  Baby,
  HeartHandshake,
  PackageOpen,
  FileText,
  Settings,
  ChevronLeft,
  ChevronDown,
  Trash2,
  ArrowLeftRight,
  FileSpreadsheet,
  RefreshCw,
  ClipboardList,
  Bell,
  Stethoscope,
  BookOpen,
  CheckSquare,
  Clock,
  Building2,
  Megaphone,
  HandHeart,
  Activity,
  FolderOpen,
  Kanban,
  Sliders,
  Sparkles,
  ChevronsUpDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

// =============================================================================
// Navigation Types & Configuration
// =============================================================================

interface NavItem {
  href: string
  label: string
  icon: any
  exact?: boolean
  color?: string
  badge?: string
}

interface NavSection {
  id: string
  title: string
  iconEmoji: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  // 1. العمليات الميدانية والبرامج
  {
    id: "operations",
    title: "العمليات والبرامج",
    iconEmoji: "⚙️",
    items: [
      {
        href: "/dashboard/families",
        label: "إدارة الأسر المستفيدة",
        icon: Users,
        exact: false,
        color: "text-blue-400",
      },
      {
        href: "/dashboard/orphans",
        label: "إدارة الأيتام",
        icon: Baby,
        exact: false,
        color: "text-purple-400",
      },
      {
        href: "/dashboard/quran-program",
        label: "برنامج القرآن والدعاة",
        icon: BookOpen,
        exact: false,
        color: "text-emerald-400",
      },
      {
        href: "/dashboard/patients",
        label: "إدارة المرضى",
        icon: Stethoscope,
        exact: false,
        color: "text-rose-400",
      },
      {
        href: "/dashboard/update-requests",
        label: "طلبات التحديث الذاتي",
        icon: RefreshCw,
        exact: false,
        color: "text-amber-400",
      },
      {
        href: "/dashboard/sponsors",
        label: "الكفلاء والكفالات",
        icon: HeartHandshake,
        exact: false,
        color: "text-pink-400",
      },
      {
        href: "/dashboard/projects",
        label: "المشاريع والتوزيعات",
        icon: PackageOpen,
        exact: false,
        color: "text-amber-400",
      },
      {
        href: "/dashboard/requests",
        label: "إدارة ومتابعة الطلبات",
        icon: ClipboardList,
        exact: false,
        color: "text-cyan-400",
      },
      {
        href: "/dashboard/import",
        label: "استيراد البيانات Excel",
        icon: FileSpreadsheet,
        exact: false,
        color: "text-teal-400",
      },
    ],
  },
  // 2. الموارد البشرية والإدارة الداخلية
  {
    id: "hr",
    title: "الموارد البشرية والإدارة",
    iconEmoji: "👥",
    items: [
      {
        href: "/dashboard/tasks",
        label: "إدارة وتوزيع المهام",
        icon: CheckSquare,
        exact: true,
        color: "text-amber-400",
      },
      {
        href: "/dashboard/tasks/board",
        label: "لوحة كانبان المهام",
        icon: Kanban,
        exact: false,
        color: "text-indigo-400",
      },
      {
        href: "/dashboard/time-tracking",
        label: "تتبع ساعات العمل والدوام",
        icon: Clock,
        exact: false,
        color: "text-teal-400",
      },
      {
        href: "/dashboard/volunteers",
        label: "إدارة المتطوعين وبنك الساعات",
        icon: HandHeart,
        exact: false,
        color: "text-rose-400",
      },
      {
        href: "/dashboard/announcements",
        label: "نشر التعميمات الإدارية",
        icon: Megaphone,
        exact: false,
        color: "text-emerald-400",
      },
      {
        href: "/dashboard/docs",
        label: "المستودع واللوائح والسياسات",
        icon: FolderOpen,
        exact: false,
        color: "text-purple-400",
      },
      {
        href: "/dashboard/departments",
        label: "الهيكل الإداري والأقسام",
        icon: Building2,
        exact: false,
        color: "text-cyan-400",
      },
    ],
  },
  // 3. التحليلات والتقارير الذكية
  {
    id: "analytics",
    title: "التحليلات والتقارير",
    iconEmoji: "📊",
    items: [
      {
        href: "/dashboard/kanban",
        label: "لوحة كانبان المستفيدين",
        icon: ArrowLeftRight,
        exact: false,
        color: "text-indigo-400",
      },
      {
        href: "/dashboard/targeting",
        label: "محرك الاستهداف الذكي",
        icon: Sparkles,
        exact: false,
        color: "text-teal-400",
        badge: "ذكي",
      },
      {
        href: "/dashboard/data-quality",
        label: "جودة البيانات والدمج",
        icon: Sliders,
        exact: false,
        color: "text-cyan-400",
      },
      {
        href: "/dashboard/reports",
        label: "التقارير والإحصائيات",
        icon: FileText,
        exact: false,
        color: "text-sky-400",
      },
    ],
  },
  // 4. أدوات وأمان النظام
  {
    id: "system",
    title: "أدوات وأمان النظام",
    iconEmoji: "🔐",
    items: [
      {
        href: "/dashboard/alerts",
        label: "التنبيهات الذكية",
        icon: Bell,
        exact: false,
        color: "text-rose-400",
      },
      {
        href: "/dashboard/my-activity",
        label: "سجل نشاطي",
        icon: ClipboardList,
        exact: false,
        color: "text-slate-400",
      },
      {
        href: "/dashboard/activity-log",
        label: "سجل التدقيق الرقابي",
        icon: Activity,
        exact: false,
        color: "text-emerald-400",
      },
      {
        href: "/dashboard/trash",
        label: "سلة المهملات",
        icon: Trash2,
        exact: false,
        color: "text-slate-500",
      },
      {
        href: "/dashboard/settings",
        label: "إعدادات النظام",
        icon: Settings,
        exact: false,
        color: "text-slate-400",
      },
    ],
  },
]

// =============================================================================
// Sidebar Component
// =============================================================================

interface AppSidebarProps {
  className?: string
}

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + "/")
  }

  // Section collapse state (default: open operations by default)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    operations: true,
    hr: false,
    analytics: false,
    system: false,
  })

  // Automatically ensure the section containing the active route is open
  useEffect(() => {
    navSections.forEach((sec) => {
      const containsActive = sec.items.some((item) => isActive(item.href, item.exact))
      if (containsActive) {
        setOpenSections((prev) => ({ ...prev, [sec.id]: true }))
      }
    })
  }, [pathname])

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const isHomeActive = pathname === "/dashboard"

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col select-none",
        "bg-[#1C355E] dark:bg-[#080c18]",
        className
      )}
    >
      {/* ── Brand / Logo ──────────────────────────────────────────── */}
      <div className="flex h-20 flex-shrink-0 items-center justify-between gap-2 border-b border-white/10 dark:border-white/5 px-3 bg-black/10 dark:bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-lg shadow-teal-900/30 overflow-hidden ring-2 ring-[#00B2A9]/40">
            <img src="/logo.jpg" alt="جمعية اليتامى التنموية" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black tracking-wide text-white">
              اليتامى التنموية
            </p>
            <p className="text-[9px] font-bold text-[#00B2A9] uppercase tracking-wider">المنظومة الموحدة</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* ── Navigation ────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
        
        {/* 1. الزر الرئيسي للداشبورد (ثابت ومميز في الأعلى) */}
        <Link
          href="/dashboard"
          className={cn(
            "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200 shadow-sm",
            isHomeActive
              ? "bg-[#00B2A9] text-white shadow-[#00B2A9]/30"
              : "text-white/80 hover:bg-white/10 hover:text-white bg-white/5 border border-white/5"
          )}
        >
          <Home
            className={cn(
              "h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
              isHomeActive ? "text-white" : "text-emerald-400"
            )}
          />
          <span className="flex-1 truncate">الرئيسية والداشبورد</span>
          <span className="text-[10px] bg-black/20 text-white/90 px-1.5 py-0.5 rounded font-mono">
            Ctrl+H
          </span>
        </Link>

        <div className="h-[1px] bg-white/10 my-2" />

        {/* 2. الأقسام القابلة للطي والتوسيع مع الأسهم */}
        {navSections.map((section) => {
          const isOpen = !!openSections[section.id]
          const hasActiveItem = section.items.some((item) => isActive(item.href, item.exact))

          return (
            <div
              key={section.id}
              className={cn(
                "rounded-xl border transition-all duration-200 overflow-hidden",
                hasActiveItem
                  ? "border-teal-500/30 bg-white/[0.04]"
                  : "border-white/5 bg-transparent"
              )}
            >
              {/* عنوان القسم القابل للنقر مع السهم */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold transition-all duration-150 group text-right",
                  hasActiveItem ? "text-teal-300" : "text-white/80 hover:text-white",
                  "hover:bg-white/8"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm">{section.iconEmoji}</span>
                  <span className="truncate">{section.title}</span>
                  {hasActiveItem && !isOpen && (
                    <span className="inline-block h-2 w-2 rounded-full bg-[#00D4CA] ring-2 ring-[#00D4CA]/30 animate-pulse" />
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={cn(
                      "text-[10px] font-mono px-1.5 py-0.5 rounded-full transition-colors",
                      hasActiveItem
                        ? "bg-teal-500/20 text-teal-300"
                        : "bg-white/10 text-white/50 group-hover:text-white/80"
                    )}
                  >
                    {section.items.length}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-white/50 transition-transform duration-200 group-hover:text-white",
                      isOpen ? "rotate-180 text-teal-300" : ""
                    )}
                  />
                </div>
              </button>

              {/* عناصر القسم (تظهر عند الفتح) */}
              {isOpen && (
                <div className="space-y-0.5 px-2 pb-2 pt-1 border-t border-white/5">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href, item.exact)

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150",
                          active
                            ? "bg-white/15 text-[#00D4CA] font-bold shadow-sm border-r-2 border-[#00B2A9]"
                            : "text-white/70 hover:bg-white/8 hover:text-white"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-3.5 w-3.5 flex-shrink-0 transition-transform duration-150 group-hover:scale-110",
                            active ? "text-[#00D4CA]" : item.color || "text-slate-400"
                          )}
                        />
                        <span className="flex-1 truncate text-[11.5px]">{item.label}</span>
                        {item.badge && (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-1 py-0.2 rounded font-bold">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* ── User Footer ───────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-white/10 p-3 bg-black/10 dark:bg-black/20">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/8">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#00B2A9] to-[#1C355E] text-sm font-bold text-white shadow-lg ring-1 ring-white/20">
            م
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white">
              مشرف المنظومة
            </p>
            <p className="truncate text-[11px] text-teal-200/60 font-mono">admin@ngo.com</p>
          </div>
          <ChevronLeft className="h-4 w-4 flex-shrink-0 text-white/30" />
        </div>
      </div>
    </aside>
  )
}
