"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  Download,
  Printer,
  X,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileText,
  Eye,
  Users,
  HeartHandshake,
  Clock,
  AlertCircle,
  Sparkles,
  TrendingUp,
  BarChart2,
  PieChart as PieIcon,
  Phone,
  MapPin,
  GraduationCap,
  HeartPulse,
  ExternalLink,
  Calendar,
  ShieldAlert,
  Award,
  Layers,
  CheckCircle2,
  BookOpen,
} from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Button } from "@/components/ui/button"
import { exportToExcel } from "@/lib/excel-export"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ReportsClientProps {
  initialBeneficiaries: any[]
  geography: any[]
  sponsors: any[]
}

const POVERTY_COLORS = {
  SEVERE: "#ef4444",
  MEDIUM: "#f59e0b",
  LOW: "#10b981",
}

const SPONSOR_COLORS = {
  SPONSORED: "#10b981",
  WAITING: "#64748b",
}

const calculateAge = (birthdate: string | Date | null) => {
  if (!birthdate) return null
  const birth = new Date(birthdate)
  if (isNaN(birth.getTime())) return null
  const diff = Date.now() - birth.getTime()
  const ageDate = new Date(diff)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}

export function ReportsClient({ initialBeneficiaries, geography, sponsors }: ReportsClientProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Active view tab (table or analytics)
  const [activeTab, setActiveTab] = useState<string>("table")

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [govId, setGovId] = useState<string>("ALL")
  const [distId, setDistId] = useState<string>("ALL")
  const [category, setCategory] = useState<string>("ALL")
  const [povertyLevel, setPovertyLevel] = useState<string>("ALL")
  const [sponsorshipStatus, setSponsorshipStatus] = useState<string>("ALL")
  const [educationalStage, setEducationalStage] = useState<string>("ALL")
  const [gender, setGender] = useState<string>("ALL")
  const [disability, setDisability] = useState<string>("ALL")
  const [sponsorId, setSponsorId] = useState<string>("ALL")
  const [healthQuery, setHealthQuery] = useState<string>("")

  // Quick preset active tracker
  const [activePreset, setActivePreset] = useState<string>("ALL")

  // Beneficiary for Details Modal
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<any | null>(null)

  // Pagination for screen preview
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(50)

  // Cascading districts list
  const activeGov = geography.find((g) => g.id.toString() === govId)
  const activeDistricts = activeGov ? activeGov.districts : []

  // Reset district filter if governorate changes
  useEffect(() => {
    setDistId("ALL")
  }, [govId])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [
    searchTerm,
    govId,
    distId,
    category,
    povertyLevel,
    sponsorshipStatus,
    educationalStage,
    gender,
    disability,
    sponsorId,
    healthQuery,
  ])

  // Quick Preset Handlers
  const applyPreset = (preset: "ALL" | "UNSPONSORED_ORPHANS" | "SEVERE_POVERTY" | "DISABILITY_PATIENT" | "STUDENTS") => {
    setActivePreset(preset)
    setSearchTerm("")
    setGovId("ALL")
    setDistId("ALL")
    setSponsorId("ALL")
    setHealthQuery("")
    setGender("ALL")

    if (preset === "ALL") {
      setCategory("ALL")
      setPovertyLevel("ALL")
      setSponsorshipStatus("ALL")
      setEducationalStage("ALL")
      setDisability("ALL")
    } else if (preset === "UNSPONSORED_ORPHANS") {
      setCategory("ORPHAN")
      setPovertyLevel("ALL")
      setSponsorshipStatus("UNSPONSORED")
      setEducationalStage("ALL")
      setDisability("ALL")
    } else if (preset === "SEVERE_POVERTY") {
      setCategory("ALL")
      setPovertyLevel("SEVERE")
      setSponsorshipStatus("ALL")
      setEducationalStage("ALL")
      setDisability("ALL")
    } else if (preset === "DISABILITY_PATIENT") {
      setCategory("ALL")
      setPovertyLevel("ALL")
      setSponsorshipStatus("ALL")
      setEducationalStage("ALL")
      setDisability("YES")
    } else if (preset === "STUDENTS") {
      setCategory("STUDENT")
      setPovertyLevel("ALL")
      setSponsorshipStatus("ALL")
      setEducationalStage("ALL")
      setDisability("ALL")
    }
  }

  // Filter Logic
  const filteredBeneficiaries = useMemo(() => {
    return initialBeneficiaries.filter((b) => {
      // Search Name / National ID / Code
      const matchesSearch =
        b.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.nationalId && b.nationalId.includes(searchTerm)) ||
        (b.orphanCode && b.orphanCode.toLowerCase().includes(searchTerm.toLowerCase()))

      // Geography
      const matchesGov =
        govId === "ALL" ||
        b.family?.subDistrict?.district?.governorate?.id?.toString() === govId
      const matchesDist =
        distId === "ALL" ||
        b.family?.subDistrict?.district?.id?.toString() === distId

      // Category
      const matchesCategory = category === "ALL" || b.category === category

      // Poverty
      const matchesPoverty =
        povertyLevel === "ALL" || b.family?.povertyLevel === povertyLevel

      // Sponsorship
      const isSponsored = b.sponsorships && b.sponsorships.length > 0
      const matchesSponsorship =
        sponsorshipStatus === "ALL" ||
        (sponsorshipStatus === "SPONSORED" && isSponsored) ||
        (sponsorshipStatus === "UNSPONSORED" && !isSponsored)

      // Sponsor
      const matchesSponsor =
        sponsorId === "ALL" ||
        (b.sponsorships && b.sponsorships.some((s: any) => s.sponsorId === sponsorId))

      // Education
      const matchesEducation =
        educationalStage === "ALL" ||
        (b.educationalStage && b.educationalStage.toLowerCase() === educationalStage.toLowerCase())

      // Gender
      const matchesGender = gender === "ALL" || b.gender === gender

      // Disability
      const matchesDisability =
        disability === "ALL" ||
        (disability === "YES" && b.disability) ||
        (disability === "NO" && !b.disability)

      // Health / Disease Search
      const matchesHealth =
        !healthQuery.trim() ||
        (b.healthStatus && b.healthStatus.toLowerCase().includes(healthQuery.toLowerCase())) ||
        (b.disabilityType && b.disabilityType.toLowerCase().includes(healthQuery.toLowerCase())) ||
        (b.disabilityDetails && b.disabilityDetails.toLowerCase().includes(healthQuery.toLowerCase()))

      return (
        matchesSearch &&
        matchesGov &&
        matchesDist &&
        matchesCategory &&
        matchesPoverty &&
        matchesSponsorship &&
        matchesSponsor &&
        matchesEducation &&
        matchesGender &&
        matchesDisability &&
        matchesHealth
      )
    })
  }, [
    initialBeneficiaries,
    searchTerm,
    govId,
    distId,
    category,
    povertyLevel,
    sponsorshipStatus,
    sponsorId,
    educationalStage,
    gender,
    disability,
    healthQuery,
  ])

  // Summary Metrics
  const totalCount = filteredBeneficiaries.length
  const sponsoredCount = filteredBeneficiaries.filter(
    (b) => b.sponsorships && b.sponsorships.length > 0
  ).length
  const unsponsoredCount = totalCount - sponsoredCount

  const totalVulnerability = filteredBeneficiaries.reduce(
    (acc, b) => acc + (b.family?.vulnerabilityScore || 0),
    0
  )
  const avgVulnerability = totalCount > 0 ? Math.round(totalVulnerability / totalCount) : 0

  const disabilityCount = filteredBeneficiaries.filter((b) => b.disability).length
  const maleCount = filteredBeneficiaries.filter((b) => b.gender === "MALE").length
  const femaleCount = totalCount - maleCount

  // Paginated records for screen display
  const totalPages = pageSize > 0 ? Math.ceil(totalCount / pageSize) || 1 : 1
  const paginatedBeneficiaries = useMemo(() => {
    if (pageSize <= 0) return filteredBeneficiaries
    const start = (currentPage - 1) * pageSize
    return filteredBeneficiaries.slice(start, start + pageSize)
  }, [filteredBeneficiaries, currentPage, pageSize])

  // Analytics Chart Data
  const governorateChartData = useMemo(() => {
    const govCounts: Record<string, number> = {}
    filteredBeneficiaries.forEach((b) => {
      const gName = b.family?.subDistrict?.district?.governorate?.nameAr || "غير محدد"
      govCounts[gName] = (govCounts[gName] || 0) + 1
    })
    return Object.entries(govCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [filteredBeneficiaries])

  const povertyChartData = useMemo(() => {
    let severe = 0
    let medium = 0
    let low = 0
    filteredBeneficiaries.forEach((b) => {
      const level = b.family?.povertyLevel
      if (level === "SEVERE") severe++
      else if (level === "MEDIUM") medium++
      else if (level === "LOW") low++
    })
    return [
      { name: "فقر شديد", value: severe, color: POVERTY_COLORS.SEVERE },
      { name: "فقر متوسط", value: medium, color: POVERTY_COLORS.MEDIUM },
      { name: "فقر منخفض", value: low, color: POVERTY_COLORS.LOW },
    ].filter((item) => item.value > 0)
  }, [filteredBeneficiaries])

  const sponsorshipChartData = useMemo(() => {
    return [
      { name: "مكفولين", value: sponsoredCount, color: SPONSOR_COLORS.SPONSORED },
      { name: "في قائمة الانتظار", value: unsponsoredCount, color: SPONSOR_COLORS.WAITING },
    ].filter((item) => item.value > 0)
  }, [sponsoredCount, unsponsoredCount])

  const categoryChartData = useMemo(() => {
    const cats: Record<string, number> = {
      "أيتام": 0,
      "طلاب علم": 0,
      "مرضى": 0,
      "عام": 0,
    }
    filteredBeneficiaries.forEach((b) => {
      if (b.category === "ORPHAN") cats["أيتام"]++
      else if (b.category === "STUDENT") cats["طلاب علم"]++
      else if (b.category === "PATIENT") cats["مرضى"]++
      else cats["عام"]++
    })
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value }))
      .filter((i) => i.value > 0)
  }, [filteredBeneficiaries])

  // Excel Export Handler
  const handleExportExcel = () => {
    const data = filteredBeneficiaries.map((b, i) => {
      const age = calculateAge(b.birthdate)
      return {
        "#": i + 1,
        "كود اليتيم": b.orphanCode || "-",
        "الاسم الكامل": b.fullName,
        "الجنس": b.gender === "MALE" ? "ذكر" : "أنثى",
        "العمر": age !== null ? `${age} سنة` : "-",
        "تاريخ الميلاد": b.birthdate ? new Date(b.birthdate).toLocaleDateString("ar-YE-u-nu-latn") : "-",
        "الفئة": b.category === "ORPHAN" ? "يتيم" : b.category === "STUDENT" ? "طالب علم" : b.category === "PATIENT" ? "مريض" : "عام",
        "اسم رب الأسرة": b.family?.headFullName || "-",
        "هاتف التواصل": b.family?.phone || b.family?.contactNumber || "-",
        "المحافظة": b.family?.subDistrict?.district?.governorate?.nameAr || "-",
        "المديرية": b.family?.subDistrict?.district?.nameAr || "-",
        "الحي/القرية": b.family?.subDistrict?.nameAr || "-",
        "مستوى الفقر": b.family?.povertyLevel === "SEVERE" ? "شديد" : b.family?.povertyLevel === "MEDIUM" ? "متوسط" : "منخفض",
        "الهشاشة": b.family?.vulnerabilityScore !== null ? `${b.family?.vulnerabilityScore}%` : "0%",
        "حالة الكفالة": b.sponsorships && b.sponsorships.length > 0 ? "مكفول" : "في الانتظار",
        "اسم الكافل": b.sponsorships?.[0]?.sponsor?.fullName || "-",
        "المرحلة الدراسية": b.educationalStage || "-",
        "الحالة الصحية": b.healthStatus || "سليم",
        "الإعاقة": b.disability ? (b.disabilityType || "يوجد إعاقة") : "لا توجد",
      }
    })

    exportToExcel(data, "تقرير_المستفيدين_الشامل", "المستفيدين")
  }

  // Print Report Handler
  const handlePrint = () => {
    window.print()
  }

  const getPovertyBadge = (level: string | null) => {
    switch (level) {
      case "SEVERE":
        return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30 font-bold">شديد</Badge>
      case "MEDIUM":
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/30 font-bold">متوسط</Badge>
      case "LOW":
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/30 font-bold">منخفض</Badge>
      default:
        return <span className="text-slate-400 text-xs italic">-</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Global Injected Styles for @media print ── */}
      <style>{`
        @media print {
          /* Hide sidebar, headers, controls */
          aside, header, nav, .print-hide, button, select, input, .tabs-list-container {
            display: none !important;
          }
          /* Ensure document stretches fully */
          main, .mx-auto, .max-w-7xl, div {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          /* Printable Document Header */
          .print-header {
            display: flex !important;
            flex-direction: column;
            align-items: center;
            border-bottom: 2px double #333;
            padding-bottom: 15px !important;
            margin-bottom: 25px !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #ddd !important;
            padding: 8px !important;
            font-size: 11px !important;
          }
          th {
            background-color: #f5f5f5 !important;
            color: black !important;
            font-weight: bold !important;
          }
          /* Show all rows when printing */
          .screen-only-pagination {
            display: none !important;
          }
        }
      `}</style>

      {/* ── Official Document Header for Print (Hidden on screen) ── */}
      <div className="hidden print-header text-center space-y-2">
        <h1 className="text-xl font-bold text-gray-800">التقرير الرسمي للمستفيدين والأسر الراعية</h1>
        <p className="text-xs text-gray-500" suppressHydrationWarning>
          صادر عن نظام إدارة المنظمة - تاريخ التقرير: {new Date().toLocaleDateString("ar-YE-u-nu-latn")}
        </p>
        <div className="grid grid-cols-4 gap-4 w-full max-w-xl mx-auto text-xs border border-gray-200 p-2 rounded-lg bg-gray-50/50 mt-4">
          <div>إجمالي الحالات: <span className="font-bold">{totalCount}</span></div>
          <div>متوسط الهشاشة: <span className="font-bold">{avgVulnerability}%</span></div>
          <div>المكفولين: <span className="font-bold">{sponsoredCount}</span></div>
          <div>في قائمة الانتظار: <span className="font-bold">{unsponsoredCount}</span></div>
        </div>
      </div>

      {/* ── Top KPI Stat Cards (Interactive on screen) ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 print-hide">
        {/* Total Matches */}
        <Card className="bg-white dark:bg-slate-900/60 border border-border/60 rounded-2xl shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">إجمالي الحالات</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalCount}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">مطابقة للبحث</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Sponsored */}
        <Card className="bg-white dark:bg-slate-900/60 border border-border/60 rounded-2xl shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">المكفولين</p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{sponsoredCount}</h3>
              <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                {totalCount > 0 ? `${Math.round((sponsoredCount / totalCount) * 100)}% من الإجمالي` : "0%"}
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <HeartHandshake className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Waiting List */}
        <Card className="bg-white dark:bg-slate-900/60 border border-border/60 rounded-2xl shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">في الانتظار</p>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{unsponsoredCount}</h3>
              <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">بحاجة لكفالة</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Vulnerability */}
        <Card className="bg-white dark:bg-slate-900/60 border border-border/60 rounded-2xl shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">متوسط الهشاشة</p>
              <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{avgVulnerability}%</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">مؤشر الاحتياج</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Health / Disability */}
        <Card className="bg-white dark:bg-slate-900/60 border border-border/60 rounded-2xl shadow-sm col-span-2 sm:col-span-1">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">ذوو الإعاقة</p>
              <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{disabilityCount}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">رعاية صحية خاصة</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <HeartPulse className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Quick Presets Bar (Hidden on Print) ── */}
      <div className="flex flex-wrap items-center gap-2 print-hide bg-slate-100/70 dark:bg-slate-900/50 p-2 rounded-2xl border border-border/50 text-xs">
        <span className="text-slate-500 font-bold px-2 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          تقارير جاهزة سريعة:
        </span>
        <Button
          variant={activePreset === "ALL" ? "default" : "outline"}
          size="sm"
          onClick={() => applyPreset("ALL")}
          className="rounded-xl h-7 px-3 text-xs font-semibold"
        >
          الكل ({initialBeneficiaries.length})
        </Button>
        <Button
          variant={activePreset === "UNSPONSORED_ORPHANS" ? "default" : "outline"}
          size="sm"
          onClick={() => applyPreset("UNSPONSORED_ORPHANS")}
          className="rounded-xl h-7 px-3 text-xs font-semibold"
        >
          ⏳ أيتام في الانتظار
        </Button>
        <Button
          variant={activePreset === "SEVERE_POVERTY" ? "default" : "outline"}
          size="sm"
          onClick={() => applyPreset("SEVERE_POVERTY")}
          className="rounded-xl h-7 px-3 text-xs font-semibold"
        >
          🚨 الحالات الأشد فقراً
        </Button>
        <Button
          variant={activePreset === "DISABILITY_PATIENT" ? "default" : "outline"}
          size="sm"
          onClick={() => applyPreset("DISABILITY_PATIENT")}
          className="rounded-xl h-7 px-3 text-xs font-semibold"
        >
          🩺 ذوو الإعاقة والمرضى
        </Button>
        <Button
          variant={activePreset === "STUDENTS" ? "default" : "outline"}
          size="sm"
          onClick={() => applyPreset("STUDENTS")}
          className="rounded-xl h-7 px-3 text-xs font-semibold"
        >
          🎓 طلاب العلم
        </Button>
      </div>

      {/* ── Tabs Navigation: Table View vs. Visual Analytics ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 print-hide">
          <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-border/50 h-11 w-full sm:w-auto">
            <TabsTrigger
              value="table"
              className="rounded-xl font-bold text-xs gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm"
            >
              <FileText className="h-4 w-4" />
              <span>كشوفات وسجلات المستفيدين ({totalCount})</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="rounded-xl font-bold text-xs gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm"
            >
              <BarChart2 className="h-4 w-4" />
              <span>لوحة التحليلات والإحصائيات البيانية</span>
            </TabsTrigger>
          </TabsList>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              onClick={handleExportExcel}
              disabled={totalCount === 0}
              className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl gap-2 font-bold border border-slate-700 transition-all shadow-sm h-10 text-xs"
            >
              <Download className="h-4 w-4" />
              <span>تصدير Excel ({totalCount})</span>
            </Button>

            <Button
              onClick={handlePrint}
              disabled={totalCount === 0}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl gap-2 font-bold shadow-md shadow-emerald-900/30 transition-all h-10 text-xs"
            >
              <Printer className="h-4 w-4" />
              <span>طباعة التقرير (PDF)</span>
            </Button>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: DATA GRID & ADVANCED FILTERS                                 */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="table" className="space-y-6 mt-0">
          {/* Filter Controls Panel */}
          <Card className="bg-white dark:bg-slate-900/60 border border-border/60 backdrop-blur-md rounded-2xl print-hide shadow-lg">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-emerald-500" />
                  مرشحات البحث المتقدمة
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActivePreset("ALL")
                    setSearchTerm("")
                    setGovId("ALL")
                    setDistId("ALL")
                    setCategory("ALL")
                    setPovertyLevel("ALL")
                    setSponsorshipStatus("ALL")
                    setEducationalStage("ALL")
                    setGender("ALL")
                    setDisability("ALL")
                    setSponsorId("ALL")
                    setHealthQuery("")
                  }}
                  className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/40"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>تهيئة الفلاتر</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                {/* Search query */}
                <div className="relative md:col-span-2">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="البحث باسم المستفيد أو الرقم الوطني أو كود اليتيم..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-9 bg-slate-50 dark:bg-slate-950 border-border/70 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus-visible:ring-emerald-500 rounded-xl"
                  />
                </div>

                {/* Governorate Select */}
                <select
                  value={govId}
                  onChange={(e) => setGovId(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-border/70 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right text-slate-800 dark:text-slate-200 font-medium transition-all"
                >
                  <option value="ALL">كل المحافظات</option>
                  {geography.map((gov) => (
                    <option key={gov.id} value={gov.id.toString()}>
                      {gov.nameAr}
                    </option>
                  ))}
                </select>

                {/* District Select */}
                <select
                  value={distId}
                  disabled={govId === "ALL"}
                  onChange={(e) => setDistId(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-border/70 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right text-slate-800 dark:text-slate-200 font-medium disabled:opacity-50 transition-all"
                >
                  <option value="ALL">كل المديريات</option>
                  {activeDistricts.map((dist: any) => (
                    <option key={dist.id} value={dist.id.toString()}>
                      {dist.nameAr}
                    </option>
                  ))}
                </select>

                {/* Beneficiary Category */}
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-border/70 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right text-slate-800 dark:text-slate-200 font-medium transition-all"
                >
                  <option value="ALL">كل الفئات</option>
                  <option value="ORPHAN">يتيم (Orphan)</option>
                  <option value="STUDENT">طالب علم (Student)</option>
                  <option value="PATIENT">مريض (Patient)</option>
                  <option value="GENERAL">عام</option>
                </select>

                {/* Poverty Level */}
                <select
                  value={povertyLevel}
                  onChange={(e) => setPovertyLevel(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-border/70 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right text-slate-800 dark:text-slate-200 font-medium transition-all"
                >
                  <option value="ALL">كل مستويات الفقر</option>
                  <option value="SEVERE">فقر شديد</option>
                  <option value="MEDIUM">فقر متوسط</option>
                  <option value="LOW">فقر منخفض</option>
                </select>

                {/* Sponsorship status */}
                <select
                  value={sponsorshipStatus}
                  onChange={(e) => setSponsorshipStatus(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-border/70 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right text-slate-800 dark:text-slate-200 font-medium transition-all"
                >
                  <option value="ALL">حالة الكفالة (الكل)</option>
                  <option value="SPONSORED">مكفول</option>
                  <option value="UNSPONSORED">في قائمة الانتظار</option>
                </select>

                {/* Educational stage */}
                <select
                  value={educationalStage}
                  onChange={(e) => setEducationalStage(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-border/70 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right text-slate-800 dark:text-slate-200 font-medium transition-all"
                >
                  <option value="ALL">المرحلة الدراسية (الكل)</option>
                  <option value="الابتدائية">الابتدائية</option>
                  <option value="الأساسية">الأساسية / الإعدادية</option>
                  <option value="الثانوية">الثانوية</option>
                  <option value="الجامعية">الجامعية</option>
                </select>

                {/* Gender */}
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-border/70 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right text-slate-800 dark:text-slate-200 font-medium transition-all"
                >
                  <option value="ALL">الجنس (الكل)</option>
                  <option value="MALE">ذكور</option>
                  <option value="FEMALE">إناث</option>
                </select>

                {/* Disability */}
                <select
                  value={disability}
                  onChange={(e) => setDisability(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-border/70 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right text-slate-800 dark:text-slate-200 font-medium transition-all"
                >
                  <option value="ALL">ذوي الاحتياجات الخاصة (الكل)</option>
                  <option value="YES">يعاني من إعاقة</option>
                  <option value="NO">لا توجد إعاقات</option>
                </select>

                {/* Sponsor Agency */}
                <select
                  value={sponsorId}
                  onChange={(e) => setSponsorId(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-border/70 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right text-slate-800 dark:text-slate-200 font-medium transition-all"
                >
                  <option value="ALL">جهة الكفالة (الكل)</option>
                  {sponsors.map((sp: any) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.fullName || sp.name || "كافل"}
                    </option>
                  ))}
                </select>

                {/* Health / Disease Search */}
                <Input
                  placeholder="البحث بنوع المرض أو الإعاقة..."
                  value={healthQuery}
                  onChange={(e) => setHealthQuery(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border-border/70 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus-visible:ring-emerald-500 rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Grid Preview */}
          <Card className="bg-white dark:bg-slate-900/60 border border-border/60 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="w-full text-right">
                  <TableHeader className="bg-slate-50 dark:bg-slate-950 border-b border-border/70">
                    <TableRow className="border-0">
                      <TableHead className="text-right text-slate-700 dark:text-slate-200 font-bold py-4 pr-6 w-12">#</TableHead>
                      <TableHead className="text-right text-slate-700 dark:text-slate-200 font-bold py-4">اسم المستفيد</TableHead>
                      <TableHead className="text-right text-slate-700 dark:text-slate-200 font-bold py-4">العمر والجنس</TableHead>
                      <TableHead className="text-right text-slate-700 dark:text-slate-200 font-bold py-4">الفئة</TableHead>
                      <TableHead className="text-right text-slate-700 dark:text-slate-200 font-bold py-4">رب الأسرة / الهاتف</TableHead>
                      <TableHead className="text-right text-slate-700 dark:text-slate-200 font-bold py-4">المحافظة والمديرية</TableHead>
                      <TableHead className="text-right text-slate-700 dark:text-slate-200 font-bold py-4">مستوى الفقر</TableHead>
                      <TableHead className="text-right text-slate-700 dark:text-slate-200 font-bold py-4">درجة الهشاشة</TableHead>
                      <TableHead className="text-center text-slate-700 dark:text-slate-200 font-bold py-4">حالة الكفالة</TableHead>
                      <TableHead className="text-center text-slate-700 dark:text-slate-200 font-bold py-4 pl-6 print:hidden">التفاصيل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/40">
                    {totalCount > 0 ? (
                      paginatedBeneficiaries.map((b, index) => {
                        const addressStr = `${b.family?.subDistrict?.district?.governorate?.nameAr || "-"} / ${b.family?.subDistrict?.district?.nameAr || "-"}`
                        const isSponsored = b.sponsorships && b.sponsorships.length > 0
                        const age = calculateAge(b.birthdate)
                        const phone = b.family?.phone || b.family?.contactNumber

                        return (
                          <TableRow
                            key={b.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                            onClick={() => setSelectedBeneficiary(b)}
                          >
                            {/* Serial # */}
                            <td className="py-4 pr-6 font-mono text-xs text-slate-500 font-bold">
                              {pageSize > 0 ? (currentPage - 1) * pageSize + index + 1 : index + 1}
                            </td>

                            {/* Name & Code */}
                            <td className="py-4 font-bold text-slate-900 dark:text-white text-sm">
                              <div className="group-hover:text-emerald-600 transition-colors">{b.fullName}</div>
                              {(b.orphanCode || b.nationalId) && (
                                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                                  {b.orphanCode ? b.orphanCode : `هوية: ${b.nationalId}`}
                                </div>
                              )}
                            </td>

                            {/* Age & Gender */}
                            <td className="py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                              <div>{age !== null ? `${age} سنة` : "—"}</div>
                              <span className="text-[11px] text-slate-400">
                                {b.gender === "MALE" ? "ذكر" : "أنثى"}
                              </span>
                            </td>

                            {/* Category */}
                            <td className="py-4 text-xs font-bold">
                              {b.category === "ORPHAN" ? (
                                <Badge className="bg-blue-500/10 text-blue-500 border border-blue-500/30 font-semibold">يتيم</Badge>
                              ) : b.category === "STUDENT" ? (
                                <Badge className="bg-purple-500/10 text-purple-500 border border-purple-500/30 font-semibold">طالب علم</Badge>
                              ) : b.category === "PATIENT" ? (
                                <Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/30 font-semibold">مريض</Badge>
                              ) : (
                                <Badge className="bg-slate-500/10 text-slate-500 border border-slate-500/30 font-semibold">عام</Badge>
                              )}
                            </td>

                            {/* Family Head & Phone */}
                            <td className="py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                              <div>{b.family?.headFullName || "—"}</div>
                              {phone && (
                                <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-normal mt-0.5 flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{phone}</span>
                                </div>
                              )}
                            </td>

                            {/* Address */}
                            <td className="py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                              {addressStr}
                            </td>

                            {/* Poverty */}
                            <td className="py-4">
                              {getPovertyBadge(b.family?.povertyLevel)}
                            </td>

                            {/* Vulnerability Score */}
                            <td className="py-4 font-mono font-bold text-sm text-slate-800 dark:text-slate-200 tabular-nums">
                              {b.family?.vulnerabilityScore !== null && b.family?.vulnerabilityScore !== undefined ? `${b.family.vulnerabilityScore}%` : "0%"}
                            </td>

                            {/* Sponsorship Badge */}
                            <td className="py-4 text-center">
                              {isSponsored ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold px-2.5 py-0.5">
                                  مكفول
                                </Badge>
                              ) : (
                                <Badge className="bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/30 font-bold px-2.5 py-0.5">
                                  في الانتظار
                                </Badge>
                              )}
                            </td>

                            {/* Actions / View Details */}
                            <td className="py-4 pl-6 text-center print:hidden" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedBeneficiary(b)}
                                className="h-8 px-2.5 text-xs text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl gap-1"
                              >
                                <Eye className="h-4 w-4" />
                                <span>عرض</span>
                              </Button>
                            </td>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <td colSpan={10} className="text-center py-12 text-sm text-slate-500 font-medium">
                          لا توجد سجلات مستفيدين تطابق خيارات التصفية والبحث المقررة.
                        </td>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Screen Pagination Controls */}
              {totalCount > 0 && (
                <div className="screen-only-pagination flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-border/50 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-bold">
                      {pageSize > 0 ? (
                        <>
                          عرض {Math.min(totalCount, (currentPage - 1) * pageSize + 1)} -{" "}
                          {Math.min(totalCount, currentPage * pageSize)} من أصل {totalCount} مستفيد
                        </>
                      ) : (
                        <>عرض جميع السجلات: {totalCount} مستفيد</>
                      )}
                    </span>

                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span>لكل صفحة:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value))
                          setCurrentPage(1)
                        }}
                        className="h-8 rounded-lg border border-border/70 bg-white dark:bg-slate-900 px-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                      >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={0}>الكل ({totalCount})</option>
                      </select>
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="rounded-xl h-8 px-3 text-xs"
                      >
                        <ChevronRight className="h-4 w-4 ml-1" /> السابق
                      </Button>

                      <span className="px-2 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {currentPage} / {totalPages}
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="rounded-xl h-8 px-3 text-xs"
                      >
                        التالي <ChevronLeft className="h-4 w-4 mr-1" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: VISUAL ANALYTICS & CHARTS DASHBOARD                          */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="analytics" className="space-y-6 mt-0">
          {mounted ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chart 1: Governorate Breakdown */}
              <Card className="bg-white dark:bg-slate-900/60 border border-border/60 rounded-2xl shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-500" />
                    التوزيع الجغرافي للمستفيدين (حسب المحافظة)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    توزيع الحالات المفلترة عبر المحافظات الأكثر كثافة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    {governorateChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={governorateChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "12px",
                              backgroundColor: "rgba(15, 23, 42, 0.9)",
                              borderColor: "#334155",
                              color: "#fff",
                            }}
                          />
                          <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} name="عدد المستفيدين" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400">
                        لا توجد بيانات جغرافية للمطابقة الحالية
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Chart 2: Poverty Levels Breakdown */}
              <Card className="bg-white dark:bg-slate-900/60 border border-border/60 rounded-2xl shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                    توزيع مستويات الفقر والاحتياج
                  </CardTitle>
                  <CardDescription className="text-xs">
                    نسب تصنيف الفقر للحالات المعروضة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full flex items-center justify-center">
                    {povertyChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={povertyChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={4}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {povertyChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              borderRadius: "12px",
                              backgroundColor: "rgba(15, 23, 42, 0.9)",
                              borderColor: "#334155",
                              color: "#fff",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-xs text-slate-400">لا توجد بيانات كافية</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Chart 3: Sponsorship Status Ratio */}
              <Card className="bg-white dark:bg-slate-900/60 border border-border/60 rounded-2xl shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <HeartHandshake className="h-4 w-4 text-teal-500" />
                    حالة الكفالة (مكفولين مقابل الانتظار)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    نسبة الإنجاز في كفالة الحالات المفلترة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full flex items-center justify-center">
                    {sponsorshipChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sponsorshipChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={4}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {sponsorshipChartData.map((entry, index) => (
                              <Cell key={`cell-spon-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              borderRadius: "12px",
                              backgroundColor: "rgba(15, 23, 42, 0.9)",
                              borderColor: "#334155",
                              color: "#fff",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-xs text-slate-400">لا توجد بيانات كافية</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Chart 4: Categories Breakdown */}
              <Card className="bg-white dark:bg-slate-900/60 border border-border/60 rounded-2xl shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-500" />
                    توزيع فئات المستفيدين
                  </CardTitle>
                  <CardDescription className="text-xs">
                    توزيع الحالات بين أيتام، طلاب، ومرضى
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    {categoryChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "12px",
                              backgroundColor: "rgba(15, 23, 42, 0.9)",
                              borderColor: "#334155",
                              color: "#fff",
                            }}
                          />
                          <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} name="العدد" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400">
                        لا توجد بيانات
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="p-12 text-center text-sm text-slate-400">جاري تحميل الرسوم البيانية...</div>
          )}
        </TabsContent>
      </Tabs>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* BENEFICIARY DETAILS MODAL (FULL DOSSIER INSPECTOR)                  */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!selectedBeneficiary} onOpenChange={(open) => !open && setSelectedBeneficiary(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 bg-white dark:bg-slate-900 border border-border/70 shadow-2xl">
          {selectedBeneficiary && (
            <div className="space-y-6 text-right">
              {/* Header */}
              <DialogHeader className="border-b border-border/50 pb-4 text-right">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{selectedBeneficiary.fullName}</span>
                      {selectedBeneficiary.orphanCode && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono text-xs">
                          {selectedBeneficiary.orphanCode}
                        </Badge>
                      )}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 mt-1">
                      بطاقة الملف التعريفي الشامل للمستفيد وحالته المعيشية والتعليمية
                    </DialogDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedBeneficiary.sponsorships && selectedBeneficiary.sponsorships.length > 0 ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 font-bold px-3 py-1">
                        مكفول رسمياً
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/30 font-bold px-3 py-1">
                        في قائمة الانتظار
                      </Badge>
                    )}
                  </div>
                </div>
              </DialogHeader>

              {/* Grid 1: Personal & Family Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-blue-500" />
                  البيانات الشخصية وبيانات الأسرة
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-border/50 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">الجنس:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedBeneficiary.gender === "MALE" ? "ذكر" : "أنثى"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">العمر:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {calculateAge(selectedBeneficiary.birthdate) !== null
                        ? `${calculateAge(selectedBeneficiary.birthdate)} سنة`
                        : "غير محدد"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">تاريخ الميلاد:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedBeneficiary.birthdate
                        ? new Date(selectedBeneficiary.birthdate).toLocaleDateString("ar-YE-u-nu-latn")
                        : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">اسم رب الأسرة:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedBeneficiary.family?.headFullName || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">اسم الأم:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedBeneficiary.motherName || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">هاتف ولي الأمر:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedBeneficiary.family?.phone || selectedBeneficiary.family?.contactNumber || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid 2: Living & Vulnerability Status */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                  المؤشرات المعيشية ودرجة الفقر
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-border/50 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">مستوى الفقر:</span>
                    {getPovertyBadge(selectedBeneficiary.family?.povertyLevel)}
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">درجة الهشاشة:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {selectedBeneficiary.family?.vulnerabilityScore !== null
                        ? `${selectedBeneficiary.family?.vulnerabilityScore}%`
                        : "0%"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">نوع السكن:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedBeneficiary.housingStatus || selectedBeneficiary.family?.housingType || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">حالة التغذية:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedBeneficiary.nutritionStatus || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid 3: Education & Health */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                  التعليم والصحة
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-border/50 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">المرحلة الدراسية:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedBeneficiary.educationalStage || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">الصف الدراسي:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedBeneficiary.schoolGrade || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">حفظ القرآن الكريم:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedBeneficiary.quranMemorization || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">الحالة الصحية:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedBeneficiary.healthStatus || (selectedBeneficiary.disability ? "يعاني من إعاقة" : "سليم")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid 4: Geographic Address */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                  العنوان الجغرافي والسكن الحالي
                </h4>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-border/50 text-xs space-y-1">
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedBeneficiary.family?.subDistrict?.district?.governorate?.nameAr || "-"} -{" "}
                    {selectedBeneficiary.family?.subDistrict?.district?.nameAr || "-"} -{" "}
                    {selectedBeneficiary.family?.subDistrict?.nameAr || "-"}
                  </p>
                  {selectedBeneficiary.currentAddressFull && (
                    <p className="text-slate-500">
                      العنوان التفصيلي: {selectedBeneficiary.currentAddressFull}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBeneficiary(null)}
                  className="rounded-xl text-xs h-9 px-4"
                >
                  إغلاق النافذة
                </Button>

                {selectedBeneficiary.category === "ORPHAN" && (
                  <Link
                    href={`/dashboard/orphans/${selectedBeneficiary.id}`}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold px-4 py-2 shadow-sm transition-all"
                  >
                    <span>فتح ملف اليتيم الكامل في النظام</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
