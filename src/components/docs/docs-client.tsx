"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  Plus,
  FileText,
  Lock,
  Globe,
  Download,
  Building2,
  Calendar,
  Trash2,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreateDocDialog } from "@/components/docs/create-doc-dialog"
import { deleteDocumentPolicyAction } from "@/app/actions/doc-actions"

interface DocItem {
  id: string
  title: string
  content?: string | null
  fileUrl?: string | null
  isPublic: boolean
  createdAt: string
  department?: { id: string; name: string } | null
  createdBy?: { id: string; name: string } | null
}

interface DocsClientProps {
  docs: DocItem[]
  totalDocs: number
  departments: { id: string; name: string }[]
}

export function DocsClient({
  docs,
  totalDocs,
  departments,
}: DocsClientProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filterDept, setFilterDept] = useState<string>("ALL")

  const filteredDocs = filterDept === "ALL"
    ? docs
    : filterDept === "NONE"
    ? docs.filter(d => !d.department)
    : docs.filter(d => d.department?.id === filterDept)

  return (
    <div className="space-y-6 pb-12 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <BookOpen className="h-7 w-7 text-purple-500" />
            المستودع السحابي للوائح والسياسات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            الأرشيف السحابي لحفظ السياسات المؤسسية ولوائح العمل ونماذج الصرف المعتمدة.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-[#00B2A9] hover:bg-[#00968F] text-white gap-2 shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            رفع مستند جديد
          </Button>
        </div>
      </div>

      {/* Stats + Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-2.5 shadow-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-black text-foreground">{totalDocs}</span>
            <span className="text-xs text-muted-foreground">مستند مرفوع</span>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-2.5 shadow-sm flex items-center gap-2">
            <Globe className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-black text-foreground">{docs.filter(d => d.isPublic).length}</span>
            <span className="text-xs text-muted-foreground">عام</span>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-2.5 shadow-sm flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-black text-foreground">{docs.filter(d => !d.isPublic).length}</span>
            <span className="text-xs text-muted-foreground">خاص</span>
          </div>
        </div>
        {departments.length > 0 && (
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">جميع الأقسام ({docs.length})</option>
              <option value="NONE">عام للمؤسسة</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Docs Grid */}
      {filteredDocs.length === 0 ? (
        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm p-12 text-center">
          <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-3 text-purple-500 ring-4 ring-purple-500/5">
            <BookOpen className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-foreground">لا توجد مستندات أو لوائح مرفوعة حتى الآن</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
            يمكن لإدارة المؤسسة حفظ اللوائح التنظيمية ونماذج تقييم الأيتام وسياسات الصرف المالي ليطلع عليها الكادر ويحملها بضغطة زر.
          </p>
          <Button
            onClick={() => setDialogOpen(true)}
            variant="outline"
            size="sm"
            className="mt-4 gap-1.5 text-xs border-purple-500/30 text-purple-500 hover:bg-purple-500/10"
          >
            <Plus className="h-3.5 w-3.5" />
            رفع أول لائحة / مستند
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc) => (
            <Card
              key={doc.id}
              className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm hover:border-purple-500/30 transition-all flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-bold truncate text-foreground">{doc.title}</CardTitle>
                      <CardDescription className="text-[11px] truncate text-muted-foreground">
                        {doc.department?.name || "عام للمؤسسة"}
                      </CardDescription>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 border ${
                      doc.isPublic
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {doc.isPublic ? "عام" : "خاص"}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                {doc.content ? (
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-4">
                    {doc.content}
                  </p>
                ) : (
                  <div className="mb-4" />
                )}

                <div className="flex items-center justify-between pt-3 border-t border-border/30 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {new Date(doc.createdAt).toLocaleDateString("ar-SA")}
                  </span>

                  <div className="flex items-center gap-2">
                    {doc.fileUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-3.5 w-3.5" />
                          تحميل
                        </a>
                      </Button>
                    )}

                    <button
                      onClick={async () => {
                        if (confirm(`هل تريد حذف المستند: "${doc.title}"؟`)) {
                          await deleteDocumentPolicyAction(doc.id)
                          router.refresh()
                        }
                      }}
                      title="حذف المستند"
                      className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      <CreateDocDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        departments={departments}
      />
    </div>
  )
}
