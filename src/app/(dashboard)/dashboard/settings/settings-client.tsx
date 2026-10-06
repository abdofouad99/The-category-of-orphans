"use client"

import { useState, useEffect, useMemo } from "react"
import {
  getGeoStructure,
  createGovernorate,
  createDistrict,
  createSubDistrict,
  updateGovernorate,
  updateDistrict,
  updateSubDistrict,
  deleteGovernorate,
  deleteDistrict,
  deleteSubDistrict,
  getSystemStats,
  getUsersList,
  createSystemUser,
  toggleUserStatus,
  deleteUser,
  updateSystemUser,
  updateCurrentUserProfile,
  changeCurrentUserPassword,
} from "@/app/actions/settings-actions"
import { getAllTagsAdmin, createTag, updateTag, toggleTag, deleteTag, seedInitialTags } from "@/app/actions/tag-actions"
import { TagCategory, Role } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  User,
  Settings,
  Map,
  Plus,
  Info,
  Server,
  Users,
  Heart,
  Briefcase,
  Coins,
  FileText,
  Activity,
  CheckCircle,
  Database,
  MapPin,
  Tag,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Search,
  ChevronDown,
  ChevronRight,
  Edit3,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  UserCheck,
  AlertTriangle,
  X,
  Filter,
} from "lucide-react"

interface SettingsClientProps {
  initialGeoStructure: any[]
  initialStats: any
  initialTags: any[]
  initialUsers: any[]
  currentUser?: any
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  ADMIN: { label: "مسؤول النظام الكامل", color: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50" },
  MANAGER: { label: "مدير البرامج", color: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50" },
  DATA_ENTRY: { label: "مدخل بيانات", color: "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/50" },
  MARKETER: { label: "مسوق ميداني", color: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50" },
  VIEWER: { label: "مطلع (قراءة فقط)", color: "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700" },
}

export function SettingsClient({
  initialGeoStructure,
  initialStats,
  initialTags,
  initialUsers,
  currentUser: initialCurrentUser,
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState("geo")
  const [geoStructure, setGeoStructure] = useState<any[]>(initialGeoStructure)
  const [stats, setStats] = useState<any>(initialStats)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Tags state
  const [allTags, setAllTags] = useState<any[]>(initialTags)
  const [newTagName, setNewTagName] = useState("")
  const [newTagCategory, setNewTagCategory] = useState<TagCategory>("ORPHAN_OPERATIONAL_STATUS" as TagCategory)
  const [newTagColor, setNewTagColor] = useState("#6366f1")
  const [tagSearch, setTagSearch] = useState("")
  const [seedingTags, setSeedingTags] = useState(false)
  const [editingTag, setEditingTag] = useState<any>(null)
  const [editTagName, setEditTagName] = useState("")
  const [editTagColor, setEditTagColor] = useState("")

  // Users state
  const [usersList, setUsersList] = useState<any[]>(initialUsers)
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [newUserPhone, setNewUserPhone] = useState("")
  const [newUserRole, setNewUserRole] = useState<Role>("MARKETER" as Role)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [userSearch, setUserSearch] = useState("")
  const [userRoleFilter, setUserRoleFilter] = useState("ALL")
  const [editingUser, setEditingUser] = useState<any>(null)
  const [editUserName, setEditUserName] = useState("")
  const [editUserPhone, setEditUserPhone] = useState("")
  const [editUserRole, setEditUserRole] = useState<Role>("MARKETER" as Role)

  // Geo form states
  const [govName, setGovName] = useState("")
  const [distName, setDistName] = useState("")
  const [distGovId, setDistGovId] = useState("")
  const [subName, setSubName] = useState("")
  const [subGovId, setSubGovId] = useState("")
  const [subDistId, setSubDistId] = useState("")
  const [geoSearch, setGeoSearch] = useState("")
  const [expandedGovs, setExpandedGovs] = useState<Set<number>>(new Set())
  const [editingGeo, setEditingGeo] = useState<{ type: "gov" | "dist" | "sub"; id: number; name: string } | null>(null)
  const [editGeoName, setEditGeoName] = useState("")

  // Profile state
  const [profileName, setProfileName] = useState(initialCurrentUser?.name || "")
  const [profilePhone, setProfilePhone] = useState(initialCurrentUser?.phone || "")
  const [currentUser, setCurrentUser] = useState<any>(initialCurrentUser || null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ text: "", type: "" })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (message.text) {
      const t = setTimeout(() => setMessage({ text: "", type: "" }), 4000)
      return () => clearTimeout(t)
    }
  }, [message])

  const loadData = async () => {
    setLoading(true)
    const [geoRes, statsRes, tagsRes, usersRes] = await Promise.all([
      getGeoStructure(),
      getSystemStats(),
      getAllTagsAdmin(),
      getUsersList(),
    ])
    if (geoRes.success) setGeoStructure(geoRes.governorates || [])
    if (statsRes.success) setStats(statsRes.stats || null)
    if (tagsRes.success) setAllTags(tagsRes.tags || [])
    if (usersRes.success) setUsersList(usersRes.users || [])
    setLoading(false)
  }

  const showMsg = (text: string, type: "success" | "error") => setMessage({ text, type })

  // ─── GEO HANDLERS ─────────────────────────────────────────────────────────

  const handleCreateGov = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!govName.trim()) return
    setSubmitting(true)
    const res = await createGovernorate({ nameAr: govName.trim() })
    if (res.success) {
      setGovName("")
      showMsg("تمت إضافة المحافظة بنجاح! ✅", "success")
      loadData()
    } else {
      showMsg(res.error || "فشل إضافة المحافظة", "error")
    }
    setSubmitting(false)
  }

  const handleCreateDist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!distName.trim() || !distGovId) return
    setSubmitting(true)
    const res = await createDistrict({ nameAr: distName.trim(), governorateId: Number(distGovId) })
    if (res.success) {
      setDistName("")
      showMsg("تمت إضافة المديرية بنجاح! ✅", "success")
      loadData()
    } else {
      showMsg(res.error || "فشل إضافة المديرية", "error")
    }
    setSubmitting(false)
  }

  const handleCreateSub = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subName.trim() || !subDistId) return
    setSubmitting(true)
    const res = await createSubDistrict({ nameAr: subName.trim(), districtId: Number(subDistId) })
    if (res.success) {
      setSubName("")
      showMsg("تمت إضافة العزلة/الحي بنجاح! ✅", "success")
      loadData()
    } else {
      showMsg(res.error || "فشل إضافة العزلة/الحي", "error")
    }
    setSubmitting(false)
  }

  const handleUpdateGeo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGeo || !editGeoName.trim()) return
    setSubmitting(true)
    let res: any
    if (editingGeo.type === "gov") {
      res = await updateGovernorate(editingGeo.id, editGeoName.trim())
    } else if (editingGeo.type === "dist") {
      res = await updateDistrict(editingGeo.id, editGeoName.trim())
    } else {
      res = await updateSubDistrict(editingGeo.id, editGeoName.trim())
    }

    if (res.success) {
      showMsg("تم تعديل الاسم بنجاح ✅", "success")
      setEditingGeo(null)
      loadData()
    } else {
      showMsg(res.error || "فشل التعديل", "error")
    }
    setSubmitting(false)
  }

  const handleDeleteGov = async (id: number, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف محافظة "${name}"؟\nسيتم التأكد من عدم ارتباط أي أسر بها.`)) return
    setSubmitting(true)
    const res = await deleteGovernorate(id)
    if (res.success) {
      showMsg("تم حذف المحافظة بنجاح", "success")
      loadData()
    } else {
      showMsg(res.error || "فشل الحذف", "error")
    }
    setSubmitting(false)
  }

  const handleDeleteDist = async (id: number, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف مديرية "${name}"؟`)) return
    setSubmitting(true)
    const res = await deleteDistrict(id)
    if (res.success) {
      showMsg("تم حذف المديرية بنجاح", "success")
      loadData()
    } else {
      showMsg(res.error || "فشل الحذف", "error")
    }
    setSubmitting(false)
  }

  const handleDeleteSub = async (id: number, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return
    setSubmitting(true)
    const res = await deleteSubDistrict(id)
    if (res.success) {
      showMsg("تم الحذف بنجاح", "success")
      loadData()
    } else {
      showMsg(res.error || "فشل الحذف", "error")
    }
    setSubmitting(false)
  }

  // ─── USER HANDLERS ─────────────────────────────────────────────────────────

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword) return
    setSubmitting(true)
    const res = await createSystemUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      password: newUserPassword,
      role: newUserRole,
      phone: newUserPhone.trim(),
    })
    if (res.success) {
      if (res.notifyCredentials) {
        try {
          const welcomeMsg = `🌹 مرحباً بك *${res.notifyCredentials.name}* في *مؤسسة الأيتام الخيرية التنموية*.\n\nلقد تم إنشاء حساب مسوق ميداني خاص بك في النظام بنجاح! 🎉\n\n🔑 *بيانات الدخول الخاصة بك:*\n📧 البريد الإلكتروني: \`${res.notifyCredentials.email}\`\n🔒 كلمة المرور: \`${res.notifyCredentials.password}\`\n\n🔗 *رابط لوحة التحكم:*\nhttps://ngo-erp-system.vercel.app/login\n\n🔹 يرجى استخدام هذه البيانات لتسجيل الدخول والبدء بتسجيل وإدارة ملفات الأيتام.`
          let cleaned = res.notifyCredentials.phone.replace(/\D/g, "")
          if (cleaned.startsWith("00")) cleaned = cleaned.substring(2)
          if (cleaned.startsWith("0")) cleaned = "967" + cleaned.substring(1)
          else if (cleaned.length === 9 && (cleaned.startsWith("7") || cleaned.startsWith("1"))) cleaned = "967" + cleaned
          await fetch("http://127.0.0.1:5005/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: cleaned, message: welcomeMsg }),
            mode: "cors",
          })
        } catch (err) {
          console.warn("⚠️ Local WhatsApp bot is not running:", err)
        }
      }
      setNewUserName("")
      setNewUserEmail("")
      setNewUserPassword("")
      setNewUserPhone("")
      setNewUserRole("MARKETER" as Role)
      showMsg("تم إنشاء حساب المستخدم بنجاح ومزامنته مع Supabase Auth! ✅", "success")
      loadData()
    } else {
      showMsg(res.error || "فشل إنشاء حساب المستخدم", "error")
    }
    setSubmitting(false)
  }

  const handleToggleUser = async (id: string) => {
    const res = await toggleUserStatus(id)
    if (res.success) {
      showMsg("تم تحديث حالة الحساب بنجاح", "success")
      loadData()
    } else {
      showMsg(res.error || "فشل", "error")
    }
  }

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف مستخدم "${name}" نهائياً من النظام وSupabase؟ لا يمكن التراجع.`)) return
    setSubmitting(true)
    const res = await deleteUser(id)
    if (res.success) {
      showMsg("تم حذف المستخدم بنجاح", "success")
      loadData()
    } else {
      showMsg(res.error || "فشل الحذف", "error")
    }
    setSubmitting(false)
  }

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser || !editUserName.trim()) return
    setSubmitting(true)
    const res = await updateSystemUser(editingUser.id, {
      name: editUserName.trim(),
      phone: editUserPhone.trim(),
      role: editUserRole,
    })
    if (res.success) {
      showMsg("تم تحديث بيانات المستخدم بنجاح ✅", "success")
      setEditingUser(null)
      loadData()
    } else {
      showMsg(res.error || "فشل التحديث", "error")
    }
    setSubmitting(false)
  }

  // ─── TAG EDIT HANDLERS ────────────────────────────────────────────────────

  const handleSaveTagEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTag || !editTagName.trim()) return
    setSubmitting(true)
    const fd = new FormData()
    fd.set("id", editingTag.id)
    fd.set("nameAr", editTagName.trim())
    fd.set("category", editingTag.category)
    fd.set("color", editTagColor || editingTag.color)
    const res = await updateTag(fd)
    if (res.success) {
      showMsg("تم تعديل التصنيف بنجاح ✅", "success")
      setEditingTag(null)
      loadData()
    } else {
      showMsg(res.error || "فشل تعديل التصنيف", "error")
    }
    setSubmitting(false)
  }

  // ─── PROFILE HANDLERS ─────────────────────────────────────────────────────

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const res = await updateCurrentUserProfile({ name: profileName.trim(), phone: profilePhone.trim() })
    if (res.success) {
      setCurrentUser(res.user)
      showMsg("تم تحديث بيانات الملف الشخصي بنجاح ✅", "success")
    } else {
      showMsg(res.error || "فشل التحديث", "error")
    }
    setSubmitting(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      showMsg("كلمتا المرور غير متطابقتين!", "error")
      return
    }
    if (newPassword.length < 6) {
      showMsg("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "error")
      return
    }
    setSubmitting(true)
    const res = await changeCurrentUserPassword(newPassword)
    if (res.success) {
      setNewPassword("")
      setConfirmPassword("")
      showMsg("تم تغيير كلمة المرور بنجاح ✅", "success")
    } else {
      showMsg(res.error || "فشل تغيير كلمة المرور", "error")
    }
    setSubmitting(false)
  }

  // ─── COMPUTED ─────────────────────────────────────────────────────────────

  const getDistrictsForGov = (govId: string) => {
    if (!govId) return []
    const gov = geoStructure.find((g) => g.id === Number(govId))
    return gov ? gov.districts : []
  }

  const filteredGeo = useMemo(() => {
    if (!geoSearch.trim()) return geoStructure
    const q = geoSearch.toLowerCase()
    return geoStructure
      .map((gov) => {
        if (gov.nameAr.toLowerCase().includes(q)) return gov
        const matchedDistricts = (gov.districts || []).filter(
          (d: any) =>
            d.nameAr.toLowerCase().includes(q) ||
            (d.subDistricts || []).some((s: any) => s.nameAr.toLowerCase().includes(q))
        )
        if (matchedDistricts.length > 0) return { ...gov, districts: matchedDistricts }
        return null
      })
      .filter(Boolean)
  }, [geoStructure, geoSearch])

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch =
        !userSearch.trim() ||
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.phone && u.phone.includes(userSearch))
      const matchesRole = userRoleFilter === "ALL" || u.role === userRoleFilter
      return matchesSearch && matchesRole
    })
  }, [usersList, userSearch, userRoleFilter])

  const toggleGovExpand = (id: number) => {
    setExpandedGovs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const totalDistricts = useMemo(() => geoStructure.reduce((s, g) => s + (g.districts?.length || 0), 0), [geoStructure])
  const totalSubDistricts = useMemo(
    () => geoStructure.reduce((s, g) => s + (g.districts || []).reduce((ds: number, d: any) => ds + (d.subDistricts?.length || 0), 0), 0),
    [geoStructure]
  )

  if (!mounted) return null

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto text-right" dir="rtl">
      {/* Page Title */}
      <div className="border-b border-gray-200 dark:border-slate-800 pb-5">
        <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-emerald-500" />
          إعدادات النظام والإدارة العامة
        </h2>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
          إدارة الملف الشخصي، النطاقات الجغرافية، المستخدمين والتصنيفات، وفحص صحة وتشخيص النظام.
        </p>
      </div>

      {message.text && (
        <div
          className={`p-3 rounded-lg text-xs font-bold border flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
              : "bg-rose-50 dark:bg-red-950/40 text-rose-700 dark:text-red-400 border-rose-200 dark:border-red-900/50"
          }`}
        >
          {message.type === "success" ? <CheckCircle className="h-4 w-4 flex-shrink-0" /> : <AlertTriangle className="h-4 w-4 flex-shrink-0" />}
          {message.text}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="space-y-6">
        <TabsList className="bg-gray-100 dark:bg-slate-950 p-1 rounded-xl flex flex-wrap justify-start gap-1 border border-gray-200 dark:border-slate-800/80">
          <TabsTrigger value="geo" className="rounded-lg text-xs font-bold gap-1.5 px-3 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">
            <Map className="h-3.5 w-3.5 text-emerald-500" />
            المناطق الجغرافية ({geoStructure.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg text-xs font-bold gap-1.5 px-3 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">
            <Users className="h-3.5 w-3.5 text-blue-500" />
            المستخدمون ({usersList.length})
          </TabsTrigger>
          <TabsTrigger value="tags" className="rounded-lg text-xs font-bold gap-1.5 px-3 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">
            <Tag className="h-3.5 w-3.5 text-indigo-500" />
            التصنيفات ({allTags.length})
          </TabsTrigger>
          <TabsTrigger value="profile" className="rounded-lg text-xs font-bold gap-1.5 px-3 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">
            <User className="h-3.5 w-3.5 text-gray-500 dark:text-slate-400" />
            الملف الشخصي
          </TabsTrigger>
          <TabsTrigger value="system" className="rounded-lg text-xs font-bold gap-1.5 px-3 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">
            <Server className="h-3.5 w-3.5 text-gray-500 dark:text-slate-400" />
            تشخيص النظام
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════════════════════════════
            TAB 1 — GEO MANAGEMENT
        ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="geo" className="space-y-6">
          {/* Quick stats bar */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: MapPin, label: "محافظة مسجلة", value: geoStructure.length, color: "text-emerald-600 dark:text-emerald-400" },
              { icon: Map, label: "مديرية إدارية", value: totalDistricts, color: "text-blue-600 dark:text-blue-400" },
              { icon: MapPin, label: "عزلة وحي سكني", value: totalSubDistricts, color: "text-purple-600 dark:text-purple-400" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
                <Icon className={`h-5 w-5 ${color}`} />
                <div>
                  <div className="text-lg font-extrabold text-gray-900 dark:text-white">{value}</div>
                  <div className="text-[10px] text-gray-500 dark:text-slate-400 font-semibold">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Add forms */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Governorate */}
            <Card className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-emerald-500" />
                  إضافة محافظة جديدة
                </CardTitle>
                <CardDescription className="text-[11px] text-gray-500 dark:text-slate-400">إنشاء تقسيم إداري رئيسي (محافظة).</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateGov} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300">اسم المحافظة بالعربية</label>
                    <Input
                      placeholder="مثال: صنعاء، عدن، تعز..."
                      value={govName}
                      onChange={(e) => setGovName(e.target.value)}
                      className="h-9 text-xs rounded-lg"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={submitting || !govName.trim()} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg h-9 font-bold text-xs">
                    حفظ المحافظة
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Create District */}
            <Card className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-emerald-500" />
                  إضافة مديرية جديدة
                </CardTitle>
                <CardDescription className="text-[11px] text-gray-500 dark:text-slate-400">ربط مديرية جديدة بمحافظة مسجلة.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateDist} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300">اختر المحافظة التابعة لها</label>
                    <select
                      value={distGovId}
                      onChange={(e) => setDistGovId(e.target.value)}
                      className="flex h-9 w-full rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/60 px-3 py-1.5 text-xs font-semibold focus-visible:outline-none text-right text-gray-800 dark:text-slate-200"
                      required
                    >
                      <option value="">-- اختر محافظة --</option>
                      {geoStructure.map((g) => (
                        <option key={g.id} value={g.id}>{g.nameAr}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300">اسم المديرية</label>
                    <Input
                      placeholder="مثال: مديرية السبعين..."
                      value={distName}
                      onChange={(e) => setDistName(e.target.value)}
                      className="h-9 text-xs rounded-lg"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={submitting || !distName.trim() || !distGovId} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg h-9 font-bold text-xs">
                    حفظ المديرية
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Create Sub-District */}
            <Card className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-emerald-500" />
                  إضافة عزلة أو حي سكني
                </CardTitle>
                <CardDescription className="text-[11px] text-gray-500 dark:text-slate-400">ربط حي أو قرية بمديرية معينة.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateSub} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 dark:text-slate-300">اختر المحافظة</label>
                      <select
                        value={subGovId}
                        onChange={(e) => { setSubGovId(e.target.value); setSubDistId("") }}
                        className="flex h-9 w-full rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/60 px-2 py-1 text-[11px] font-semibold focus-visible:outline-none text-right text-gray-800 dark:text-slate-200"
                        required
                      >
                        <option value="">-- اختر --</option>
                        {geoStructure.map((g) => (
                          <option key={g.id} value={g.id}>{g.nameAr}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 dark:text-slate-300">اختر المديرية</label>
                      <select
                        value={subDistId}
                        onChange={(e) => setSubDistId(e.target.value)}
                        className="flex h-9 w-full rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/60 px-2 py-1 text-[11px] font-semibold focus-visible:outline-none text-right text-gray-800 dark:text-slate-200"
                        disabled={!subGovId}
                        required
                      >
                        <option value="">-- اختر --</option>
                        {getDistrictsForGov(subGovId).map((d: any) => (
                          <option key={d.id} value={d.id}>{d.nameAr}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300">اسم الحي / العزلة / القرية</label>
                    <Input
                      placeholder="مثال: حي الأصبحي، قرية الحجر..."
                      value={subName}
                      onChange={(e) => setSubName(e.target.value)}
                      className="h-9 text-xs rounded-lg"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={submitting || !subName.trim() || !subDistId} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg h-9 font-bold text-xs">
                    حفظ الحي/العزلة
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Geographical Tree View with search */}
          <Card className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="h-4.5 w-4.5 text-emerald-500" />
                  الهيكل الجغرافي النشط ({geoStructure.length} محافظة)
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedGovs(new Set(geoStructure.map((g: any) => g.id)))}
                    className="h-8 px-2.5 text-xs font-semibold"
                  >
                    توسيع الكل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedGovs(new Set())}
                    className="h-8 px-2.5 text-xs font-semibold"
                  >
                    طي الكل
                  </Button>
                  <div className="relative">
                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      placeholder="بحث بالمحافظة أو المديرية أو الحي..."
                      value={geoSearch}
                      onChange={(e) => setGeoSearch(e.target.value)}
                      className="h-8 text-xs pr-8 pl-3 w-52 rounded-lg"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadData}
                    disabled={loading}
                    className="h-8 px-2"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 text-gray-500 ${loading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-xs text-gray-500">جاري التحميل...</div>
              ) : filteredGeo.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400 italic">
                  {geoSearch ? "لا توجد نتائج مطابقة للبحث." : "لا توجد مناطق جغرافية مسجلة بعد."}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredGeo.map((gov: any) => {
                    const isExpanded = expandedGovs.has(gov.id)
                    return (
                      <div key={gov.id} className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                        {/* Governorate header */}
                        <div
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/60 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-850 transition-colors"
                          onClick={() => toggleGovExpand(gov.id)}
                        >
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                            <span className="text-sm font-bold text-gray-900 dark:text-white">محافظة {gov.nameAr}</span>
                            <Badge className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 text-[10px] font-bold">
                              {gov.districts?.length || 0} مديرية
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingGeo({ type: "gov", id: gov.id, name: gov.nameAr })
                                setEditGeoName(gov.nameAr)
                              }}
                              className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5 rounded hover:bg-gray-200/50 dark:hover:bg-slate-800 transition-colors"
                              title="تعديل اسم المحافظة"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteGov(gov.id, gov.nameAr)
                              }}
                              className="text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                              title="حذف المحافظة"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Districts list */}
                        {isExpanded && (
                          <div className="divide-y divide-gray-100 dark:divide-slate-800/50 bg-white dark:bg-slate-950/40">
                            {(gov.districts || []).length === 0 ? (
                              <div className="px-6 py-3 text-[11px] text-gray-400 italic">لا توجد مديريات مسجلة تحت هذه المحافظة.</div>
                            ) : (
                              (gov.districts || []).map((d: any) => (
                                <div key={d.id} className="p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-gray-800 dark:text-slate-200">مديرية: {d.nameAr}</span>
                                      <span className="text-[9px] text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-900 px-2 py-0.5 rounded-full border border-gray-200 dark:border-slate-800 font-semibold">
                                        {d.subDistricts?.length || 0} حي / عزلة
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => {
                                          setEditingGeo({ type: "dist", id: d.id, name: d.nameAr })
                                          setEditGeoName(d.nameAr)
                                        }}
                                        className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                        title="تعديل اسم المديرية"
                                      >
                                        <Edit3 className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteDist(d.id, d.nameAr)}
                                        className="text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                        title="حذف المديرية"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                  {d.subDistricts && d.subDistricts.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                      {d.subDistricts.map((s: any) => (
                                        <div
                                          key={s.id}
                                          className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-900 px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-800 text-[11px]"
                                        >
                                          <span className="text-gray-700 dark:text-slate-300 font-medium">{s.nameAr}</span>
                                          <button
                                            onClick={() => {
                                              setEditingGeo({ type: "sub", id: s.id, name: s.nameAr })
                                              setEditGeoName(s.nameAr)
                                            }}
                                            className="text-gray-400 hover:text-indigo-500 p-0.5"
                                            title="تعديل"
                                          >
                                            <Edit3 className="h-2.5 w-2.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteSub(s.id, s.nameAr)}
                                            className="text-gray-400 hover:text-rose-500 p-0.5"
                                            title="حذف"
                                          >
                                            <Trash2 className="h-2.5 w-2.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════
            TAB 2 — USERS MANAGEMENT
        ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create User Form */}
            <Card className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-emerald-500" />
                  إضافة مستخدم جديد
                </CardTitle>
                <CardDescription className="text-[11px] text-gray-500 dark:text-slate-400">إنشاء حساب جديد وتفويضه بصلاحيات محددة.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300">الاسم الكامل</label>
                    <Input
                      placeholder="مثال: محمد أحمد علي"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="h-9 text-xs rounded-lg"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300">البريد الإلكتروني</label>
                    <Input
                      type="email"
                      placeholder="name@ngo.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="h-9 text-xs rounded-lg"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300">كلمة المرور</label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        className="h-9 text-xs rounded-lg pl-9"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300">رقم الهاتف (لإرسال بيانات الدخول واتساب)</label>
                    <Input
                      placeholder="770000000"
                      value={newUserPhone}
                      onChange={(e) => setNewUserPhone(e.target.value)}
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300">الصلاحية / الدور</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as Role)}
                      className="flex h-9 w-full rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/60 px-3 py-1.5 text-xs font-semibold focus-visible:outline-none text-right text-gray-800 dark:text-slate-200"
                      required
                    >
                      <option value="MARKETER">مسوق ميداني (MARKETER)</option>
                      <option value="DATA_ENTRY">مدخل بيانات (DATA_ENTRY)</option>
                      <option value="MANAGER">مدير برامج (MANAGER)</option>
                      <option value="VIEWER">مطلع قراءة فقط (VIEWER)</option>
                      <option value="ADMIN">مسؤول النظام الكامل (ADMIN)</option>
                    </select>
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting || !newUserName.trim() || !newUserEmail.trim() || !newUserPassword}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg h-9 font-bold text-xs shadow-sm"
                  >
                    حفظ الحساب وتزويده بالصلاحية
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Users List Table */}
            <Card className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800/80 rounded-2xl shadow-sm lg:col-span-2">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <CardTitle className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-emerald-500" />
                    المستخدمون والمسوقون المسجلون ({filteredUsers.length} من {usersList.length})
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        placeholder="بحث بالاسم أو البريد..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="h-8 text-xs pr-8 pl-3 w-40 rounded-lg"
                      />
                    </div>
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="h-8 rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 px-2 text-xs font-semibold text-gray-800 dark:text-slate-200"
                    >
                      <option value="ALL">جميع الأدوار</option>
                      <option value="ADMIN">مسؤول</option>
                      <option value="MANAGER">مدير برامج</option>
                      <option value="DATA_ENTRY">مدخل بيانات</option>
                      <option value="MARKETER">مسوق ميداني</option>
                      <option value="VIEWER">مطلع</option>
                    </select>
                    <Button variant="ghost" size="sm" onClick={loadData} disabled={loading} className="h-8 px-2">
                      <RefreshCw className={`h-3.5 w-3.5 text-gray-500 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-xs text-gray-500">جاري التحميل...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400 italic">لا يوجد مستخدمون مطابقون.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-gray-100 dark:bg-slate-950 text-gray-700 dark:text-slate-300 font-bold border-b border-gray-200 dark:border-slate-800">
                        <tr>
                          <th className="p-3">الاسم الكامل</th>
                          <th className="p-3">البريد الإلكتروني</th>
                          <th className="p-3">الهاتف</th>
                          <th className="p-3 text-center">الصلاحية</th>
                          <th className="p-3 text-center">الحالة</th>
                          <th className="p-3 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-gray-700 dark:text-slate-300">
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/30 transition-all">
                            <td className="p-3 font-bold text-gray-900 dark:text-white whitespace-nowrap">{u.name}</td>
                            <td className="p-3 font-mono text-[11px] text-gray-500 dark:text-slate-400">{u.email}</td>
                            <td className="p-3 font-mono text-[11px]">{u.phone || "—"}</td>
                            <td className="p-3 text-center">
                              <Badge className={`border font-bold text-[9px] ${ROLE_LABELS[u.role]?.color || "bg-gray-100 text-gray-600"}`}>
                                {ROLE_LABELS[u.role]?.label || u.role}
                              </Badge>
                            </td>
                            <td className="p-3 text-center">
                              {u.isActive ? (
                                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold text-[9px]">نشط</Badge>
                              ) : (
                                <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-[9px]">موقف</Badge>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingUser(u)
                                    setEditUserName(u.name)
                                    setEditUserPhone(u.phone || "")
                                    setEditUserRole(u.role)
                                  }}
                                  className="h-7 px-2 text-gray-500 hover:text-indigo-600"
                                  title="تعديل المستخدم"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleToggleUser(u.id)}
                                  className="h-7 px-2 text-gray-500 hover:text-emerald-600"
                                  title={u.isActive ? "تعطيل الحساب" : "تفعيل الحساب"}
                                >
                                  {u.isActive ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4 text-gray-400" />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteUser(u.id, u.name)}
                                  className="h-7 px-2 text-gray-400 hover:text-rose-600"
                                  title="حذف المستخدم"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════
            TAB 3 — TAGS MANAGEMENT
        ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="tags" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">إدارة التصنيفات المرنة</h3>
              <p className="text-xs text-gray-500 dark:text-white/50 mt-1">إضافة وتعديل التصنيفات المستخدمة لفرز ملفات الأيتام والأسر.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={async () => {
                  setSeedingTags(true)
                  const res = await seedInitialTags()
                  showMsg(res.message || res.error || "", res.success ? "success" : "error")
                  await loadData()
                  setSeedingTags(false)
                }}
                disabled={seedingTags}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {seedingTags ? "جاري الإضافة..." : "إضافة التصنيفات الافتراضية"}
              </Button>
            </div>
          </div>

          {/* Add New Tag Form */}
          <Card className="bg-white dark:bg-slate-900/40 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                إضافة تصنيف جديد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!newTagName.trim()) return
                  setSubmitting(true)
                  const fd = new FormData()
                  fd.set("nameAr", newTagName.trim())
                  fd.set("category", newTagCategory)
                  fd.set("color", newTagColor)
                  const res = await createTag(fd)
                  if (res.success) {
                    setNewTagName("")
                    showMsg(res.message || "تم إنشاء التصنيف", "success")
                    await loadData()
                  } else {
                    showMsg(res.error || "فشل", "error")
                  }
                  setSubmitting(false)
                }}
                className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
              >
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-white/60">اسم التصنيف</label>
                  <Input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="مثال: تحت المتابعة، مستعجل..."
                    className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-white/60">الفئة</label>
                  <select
                    value={newTagCategory}
                    onChange={(e) => setNewTagCategory(e.target.value as TagCategory)}
                    className="w-full h-9 rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-gray-900 dark:text-white"
                  >
                    <option value="ORPHAN_OPERATIONAL_STATUS">الحالة التشغيلية للأيتام</option>
                    <option value="FUNDING_SOURCE">جهة التمويل والكفالة</option>
                    <option value="FAMILY_NEED">احتياجات الأسرة</option>
                    <option value="MEDICAL_CONDITION">الحالة الطبية</option>
                    <option value="CUSTOM">مخصص</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-white/60">اللون</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="h-9 w-12 rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
                    />
                    <Button type="submit" disabled={submitting || !newTagName.trim()} className="flex-1 h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                      <Plus className="h-3 w-3 ml-1" /> إضافة
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Tags List grouped by category */}
          {([
            { key: "ORPHAN_OPERATIONAL_STATUS", label: "الحالة التشغيلية للأيتام" },
            { key: "FUNDING_SOURCE", label: "جهات التمويل والكفالة" },
            { key: "FAMILY_NEED", label: "احتياجات الأسرة" },
            { key: "MEDICAL_CONDITION", label: "الحالات الطبية" },
            { key: "CUSTOM", label: "تصنيفات مخصصة" },
          ] as const).map(({ key, label }) => {
            const catTags = allTags.filter((t) => t.category === key)
            if (catTags.length === 0) return null
            return (
              <Card key={key} className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800/80 rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                      {label}
                    </span>
                    <span className="text-xs font-normal text-gray-400 dark:text-white/40">{catTags.length} تصنيف</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {catTags.map((tag) => (
                      <div
                        key={tag.id}
                        className={`flex items-center justify-between rounded-xl px-3 py-2.5 border transition-all ${
                          tag.isActive
                            ? "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                            : "bg-gray-50/50 dark:bg-white/[0.02] border-gray-100 dark:border-white/5 opacity-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-3.5 w-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{tag.nameAr}</span>
                          {!tag.isActive && (
                            <span className="text-[10px] bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full font-bold">معطّل</span>
                          )}
                          <span className="text-[10px] text-gray-400 dark:text-white/30 font-semibold">
                            {tag._count.beneficiaryTags + tag._count.familyTags} استخدام
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingTag(tag)
                              setEditTagName(tag.nameAr)
                              setEditTagColor(tag.color)
                            }}
                            className="text-gray-400 hover:text-indigo-600 p-1 rounded"
                            title="تعديل التصنيف"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={async () => {
                              const res = await toggleTag(tag.id)
                              showMsg(res.message || res.error || "", res.success ? "success" : "error")
                              await loadData()
                            }}
                            className="text-gray-400 hover:text-gray-700 p-1 rounded"
                            title={tag.isActive ? "تعطيل" : "تفعيل"}
                          >
                            {tag.isActive
                              ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                              : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm(`هل أنت متأكد من حذف "${tag.nameAr}"؟`)) return
                              const res = await deleteTag(tag.id)
                              showMsg(res.message || res.error || "", res.success ? "success" : "error")
                              await loadData()
                            }}
                            className="text-gray-300 hover:text-rose-600 p-1 rounded"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════
            TAB 4 — PROFILE
        ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
            {/* Profile Info Card */}
            <Card className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <UserCheck className="h-4.5 w-4.5 text-emerald-500" />
                  بيانات الحساب الشخصي
                </CardTitle>
                <CardDescription className="text-[11px] text-gray-500 dark:text-slate-400">
                  تعديل الاسم ورقم الهاتف الخاصين بحسابك.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Avatar section */}
                <div className="flex items-center gap-4 border-b border-gray-100 dark:border-slate-800 pb-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                    {(currentUser?.name || "م").charAt(0)}
                  </div>
                  <div className="space-y-1.5">
                    <div className="font-bold text-gray-900 dark:text-white text-sm">{currentUser?.name || "—"}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 font-mono">{currentUser?.email || "—"}</div>
                    <Badge className={`border font-bold text-[10px] ${ROLE_LABELS[currentUser?.role]?.color || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                      <Shield className="h-3 w-3 ml-1 inline" />
                      {ROLE_LABELS[currentUser?.role]?.label || currentUser?.role || "—"}
                    </Badge>
                  </div>
                </div>

                {/* Edit form */}
                <form onSubmit={handleUpdateProfile} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300">الاسم الكامل</label>
                    <Input
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="h-9 text-xs rounded-lg"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300">رقم الهاتف</label>
                    <Input
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="770000000"
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg h-9 font-bold text-xs"
                  >
                    حفظ التعديلات
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <KeyRound className="h-4.5 w-4.5 text-amber-500" />
                  تغيير كلمة المرور
                </CardTitle>
                <CardDescription className="text-[11px] text-gray-500 dark:text-slate-400">
                  يُوصى بتغيير كلمة المرور بشكل دوري لحماية حسابك.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300">كلمة المرور الجديدة</label>
                    <div className="relative">
                      <Input
                        type={showNewPwd ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-9 text-xs rounded-lg pl-9"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPwd(!showNewPwd)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                      >
                        {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300">تأكيد كلمة المرور</label>
                    <div className="relative">
                      <Input
                        type={showConfirmPwd ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-9 text-xs rounded-lg pl-9"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                      >
                        {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-[10px] text-rose-500 font-semibold">كلمتا المرور غير متطابقتين</p>
                    )}
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-2.5 text-[11px] text-amber-700 dark:text-amber-400">
                    ⚠️ سيتم تطبيق كلمة المرور الجديدة فوراً عبر Supabase Auth.
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting || !newPassword || newPassword !== confirmPassword}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white rounded-lg h-9 font-bold text-xs"
                  >
                    <KeyRound className="h-3.5 w-3.5 ml-1" />
                    تغيير كلمة المرور
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════
            TAB 5 — SYSTEM DIAGNOSTICS
        ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stats */}
            <Card className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800/80 rounded-2xl shadow-sm md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Database className="h-4.5 w-4.5 text-emerald-500" />
                    حالة قاعدة البيانات ومعدلات التخزين
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={loadData} disabled={loading} className="h-8 px-2">
                    <RefreshCw className={`h-3.5 w-3.5 text-gray-500 ${loading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
                <CardDescription className="text-[11px] text-gray-500 dark:text-slate-400">
                  ملخص إحصائيات الجداول المسجلة في نظام قاعدة البيانات Supabase PostgreSQL.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-6 text-xs text-gray-500">جاري التحميل...</div>
                ) : !stats ? (
                  <div className="text-center py-6 text-xs text-gray-500">فشل في الحصول على بيانات التشخيص.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { icon: Users, label: "المستخدمون", value: stats.users, color: "text-blue-500" },
                      { icon: Heart, label: "الأسر المسجلة", value: stats.families, color: "text-rose-500" },
                      { icon: Heart, label: "الأيتام والطلاب", value: stats.orphans, color: "text-pink-500" },
                      { icon: Briefcase, label: "المشاريع الإغاثية", value: stats.projects, color: "text-indigo-500" },
                      { icon: Coins, label: "الكفالات النشطة", value: stats.sponsorships, color: "text-amber-500" },
                      { icon: FileText, label: "سندات القبض المالي", value: stats.receipts, color: "text-emerald-500" },
                      { icon: Activity, label: "سجلات التدقيق", value: stats.auditLogs, color: "text-purple-500" },
                      { icon: MapPin, label: "المحافظات", value: stats.govs, color: "text-teal-500" },
                      { icon: Map, label: "المديريات", value: stats.dists, color: "text-cyan-500" },
                    ].map(({ icon: Icon, label, value, color }) => (
                      <div key={label} className="bg-gray-50 dark:bg-slate-900/30 p-3 rounded-xl border border-gray-200 dark:border-slate-800/50 flex items-center gap-3">
                        <Icon className={`h-5 w-5 ${color} flex-shrink-0`} />
                        <div>
                          <span className="text-[9px] font-bold text-gray-500 dark:text-slate-400 block">{label}</span>
                          <span className="text-sm font-extrabold text-gray-900 dark:text-slate-100">{value?.toLocaleString("ar")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Environment Info */}
            <Card className="border border-gray-200 dark:border-slate-800/80 rounded-2xl shadow-sm bg-gradient-to-br from-gray-900 via-slate-900 to-slate-950 text-white">
              <CardHeader>
                <CardTitle className="text-sm font-extrabold flex items-center gap-1.5">
                  <Info className="h-4.5 w-4.5 text-emerald-400" />
                  بيئة التشغيل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs font-medium text-slate-300">
                <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                  <span>قاعدة البيانات:</span>
                  <Badge className="bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">Supabase PG</Badge>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                  <span>إطار العمل:</span>
                  <Badge className="bg-slate-800 text-slate-200">Next.js 15.5</Badge>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                  <span>Prisma ORM:</span>
                  <span className="font-mono text-[10px]">v5.22.0</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                  <span>المستخدمون النشطون:</span>
                  <span className="font-bold text-emerald-400">{stats ? usersList.filter((u: any) => u.isActive).length : "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>حالة الخادم:</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    متصل ونشط
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── EDIT GEO DIALOG ── */}
      {editingGeo && (
        <Dialog open={!!editingGeo} onOpenChange={(open) => !open && setEditingGeo(null)}>
          <DialogContent className="max-w-md text-right" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-sm font-extrabold flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-emerald-500" />
                تعديل اسم{" "}
                {editingGeo.type === "gov" ? "المحافظة" : editingGeo.type === "dist" ? "المديرية" : "الحي / العزلة"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateGeo} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">الاسم بالعربية</label>
                <Input
                  value={editGeoName}
                  onChange={(e) => setEditGeoName(e.target.value)}
                  className="h-9 text-xs"
                  required
                  autoFocus
                />
              </div>
              <DialogFooter className="flex gap-2 sm:justify-start">
                <Button type="submit" disabled={submitting || !editGeoName.trim()} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">
                  حفظ التعديل
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingGeo(null)} className="text-xs">
                  إلغاء
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── EDIT USER DIALOG ── */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="max-w-md text-right" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-sm font-extrabold flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-emerald-500" />
                تعديل بيانات المستخدم: {editingUser.name}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveUserEdit} className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">الاسم الكامل</label>
                <Input
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">رقم الهاتف</label>
                <Input
                  value={editUserPhone}
                  onChange={(e) => setEditUserPhone(e.target.value)}
                  placeholder="770000000"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">الصلاحية / الدور</label>
                <select
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value as Role)}
                  className="flex h-9 w-full rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold focus-visible:outline-none text-right"
                  required
                >
                  <option value="MARKETER">مسوق ميداني (MARKETER)</option>
                  <option value="DATA_ENTRY">مدخل بيانات (DATA_ENTRY)</option>
                  <option value="MANAGER">مدير برامج (MANAGER)</option>
                  <option value="VIEWER">مطلع قراءة فقط (VIEWER)</option>
                  <option value="ADMIN">مسؤول النظام الكامل (ADMIN)</option>
                </select>
              </div>
              <DialogFooter className="flex gap-2 sm:justify-start pt-2">
                <Button type="submit" disabled={submitting || !editUserName.trim()} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">
                  حفظ التعديلات
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)} className="text-xs">
                  إلغاء
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── EDIT TAG DIALOG ── */}
      {editingTag && (
        <Dialog open={!!editingTag} onOpenChange={(open) => !open && setEditingTag(null)}>
          <DialogContent className="max-w-md text-right" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-sm font-extrabold flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-indigo-500" />
                تعديل التصنيف: {editingTag.nameAr}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveTagEdit} className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">اسم التصنيف</label>
                <Input
                  value={editTagName}
                  onChange={(e) => setEditTagName(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">اللون</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={editTagColor}
                    onChange={(e) => setEditTagColor(e.target.value)}
                    className="h-9 w-12 rounded-md border border-gray-200 dark:border-slate-700 cursor-pointer"
                  />
                  <span className="text-xs font-mono">{editTagColor}</span>
                </div>
              </div>
              <DialogFooter className="flex gap-2 sm:justify-start pt-2">
                <Button type="submit" disabled={submitting || !editTagName.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold">
                  حفظ التعديل
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingTag(null)} className="text-xs">
                  إلغاء
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
