"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Search,
  Download,
  Printer,
  X,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { exportToExcel } from "@/lib/excel-export"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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

export function ReportsClient({ initialBeneficiaries, geography, sponsors }: ReportsClientProps) {
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

  // Filter Logic
  const filteredBeneficiaries = useMemo(() => {
    return initialBeneficiaries.filter((b) => {
      // Search Name / National ID
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

  // Paginated records for screen display
  const totalPages = pageSize > 0 ? Math.ceil(totalCount / pageSize) || 1 : 1
  const paginatedBeneficiaries = useMemo(() => {
    if (pageSize <= 0) return filteredBeneficiaries
    const start = (currentPage - 1) * pageSize
    return filteredBeneficiaries.slice(start, start + pageSize)
  }, [filteredBeneficiaries, currentPage, pageSize])

  // Excel Export Handler
  const handleExportExcel = () => {
    const data = filteredBeneficiaries.map((b, i) => ({
      "#": i + 1,
      "الاسم الكامل": b.fullName,
      "الجنس": b.gender === "MALE" ? "ذكر" : "أنثى",
      "تاريخ الميلاد": b.birthdate ? new Date(b.birthdate).toLocaleDateString("ar-YE-u-nu-latn") : "-",
      "الفئة": b.category === "ORPHAN" ? "يتيم" : b.category === "STUDENT" ? "طالب علم" : b.category === "PATIENT" ? "مريض" : "عام",
      "اسم رب الأسرة": b.family?.headFullName || "-",
      "المحافظة": b.family?.subDistrict?.district?.governorate?.nameAr || "-",
      "المديرية": b.family?.subDistrict?.district?.nameAr || "-",
      "الحي/القرية": b.family?.subDistrict?.nameAr || "-",
      "مستوى الفقر": b.family?.povertyLevel === "SEVERE" ? "شديد" : b.family?.povertyLevel === "MEDIUM" ? "متوسط" : "منخفض",
      "الهشاشة": b.family?.vulnerabilityScore !== null ? `${b.family?.vulnerabilityScore}%` : "0%",
      "حالة الكفالة": b.sponsorships && b.sponsorships.length > 0 ? "مكفول" : "في الانتظار",
    }))

    exportToExcel(data, "تقرير_المستفيدين", "المستفيدين")
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
          aside, header, nav, .print-hide, button, select, input {
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

      {/* ── Filter Controls Panel (Hidden on Print) ── */}
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

      {/* ── Summary Counters & Action Buttons (Hidden on Print) ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print-hide">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold py-1.5 px-3 rounded-xl border border-border/60">
            إجمالي المطابقين: {totalCount} مستفيد
          </Badge>
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold py-1.5 px-3 rounded-xl border border-emerald-500/20">
            مكفولين: {sponsoredCount}
          </Badge>
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold py-1.5 px-3 rounded-xl border border-amber-500/20">
            في الانتظار: {unsponsoredCount}
          </Badge>
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold py-1.5 px-3 rounded-xl border border-blue-500/20">
            متوسط الهشاشة: {avgVulnerability}%
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Excel Export */}
          <Button
            onClick={handleExportExcel}
            disabled={totalCount === 0}
            className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl gap-2 font-bold border border-slate-700 transition-all shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span>تصدير Excel ({totalCount})</span>
          </Button>

          {/* Print PDF */}
          <Button
            onClick={handlePrint}
            disabled={totalCount === 0}
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl gap-2 font-bold shadow-md shadow-emerald-900/30 transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>طباعة التقرير (PDF)</span>
          </Button>
        </div>
      </div>

      {/* ── Data Grid Preview ── */}
      <Card className="bg-white dark:bg-slate-900/60 border border-border/60 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full text-right">
              <TableHeader className="bg-slate-50 dark:bg-slate-950 border-b border-border/70">
                <TableRow className="border-0">
                  <TableHead className="text-right text-slate-700 dark:text-slate-200 font-bold py-4 pr-6 w-12">#</TableHead>
                  <TableHead className="text-right text-slate-700 dark:text-slate-200 font-bold py-4">اسم المستفيد</TableHead>
                  <TableHead className="text-right text-slate-700 dark:text-slate-200 font-bold py-4">الجنس</TableHead>
                  <TableHead className="text-right text-slate-700 dark:text-slate-200 font-bold py-4">الفئة</TableHead>
                  <TableHead className="text-right text-slate-700 dark:text-slate-200 font-bold py-4">رب الأسرة</TableHead>
                  <TableHead className="text-right text-slate-700 dark:text-slate-200 font-bold py-4">المحافظة والمديرية</TableHead>
                  <TableHead className="text-right text-slate-700 dark:text-slate-200 font-bold py-4">مستوى الفقر</TableHead>
                  <TableHead className="text-right text-slate-700 dark:text-slate-200 font-bold py-4">درجة الهشاشة</TableHead>
                  <TableHead className="text-center text-slate-700 dark:text-slate-200 font-bold py-4 pl-6">حالة الكفالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/40">
                {totalCount > 0 ? (
                  paginatedBeneficiaries.map((b, index) => {
                    const addressStr = `${b.family?.subDistrict?.district?.governorate?.nameAr || "-"} / ${b.family?.subDistrict?.district?.nameAr || "-"}`
                    const isSponsored = b.sponsorships && b.sponsorships.length > 0

                    return (
                      <TableRow key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        {/* Serial # */}
                        <td className="py-4 pr-6 font-mono text-xs text-slate-500 font-bold">
                          {pageSize > 0 ? (currentPage - 1) * pageSize + index + 1 : index + 1}
                        </td>
                        {/* Name & Code */}
                        <td className="py-4 font-bold text-slate-900 dark:text-white text-sm">
                          <div>{b.fullName}</div>
                          {(b.orphanCode || b.nationalId) && (
                            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                              {b.orphanCode ? b.orphanCode : `هوية: ${b.nationalId}`}
                            </div>
                          )}
                        </td>
                        {/* Gender */}
                        <td className="py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {b.gender === "MALE" ? "ذكر" : "أنثى"}
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
                        {/* Family Head */}
                        <td className="py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {b.family?.headFullName || "—"}
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
                        <td className="py-4 pl-6 text-center">
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
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <td colSpan={9} className="text-center py-12 text-sm text-slate-500 font-medium">
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
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
    </div>
  )
}
