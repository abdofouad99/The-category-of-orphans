"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeftRight,
  List,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  User,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog"

interface TaskItem {
  id: string
  taskNumber: number
  title: string
  description?: string | null
  status: string
  priority: string
  level: string
  dueDate?: string | null
  createdAt: string
  department?: { id: string; name: string } | null
  assignee?: { id: string; name: string; role: string } | null
}

interface KanbanBoardClientProps {
  tasks: TaskItem[]
  departments: { id: string; name: string }[]
  users: { id: string; name: string; role: string }[]
}

const priorityMap: Record<string, { label: string; color: string }> = {
  HIGH: { label: "عاجلة / قصوى", color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
  MEDIUM: { label: "متوسطة", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  LOW: { label: "منخفضة", color: "text-slate-500 bg-slate-500/10 border-slate-500/20" },
}

export function KanbanBoardClient({
  tasks,
  departments,
  users,
}: KanbanBoardClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const columns = {
    NEW: {
      title: "مهام جديدة واردة",
      tasks: tasks.filter((t) => t.status === "NEW"),
      color: "border-t-blue-500",
      badge: "bg-blue-500/10 text-blue-500",
    },
    IN_PROGRESS: {
      title: "قيد التنفيذ والمباشرة",
      tasks: tasks.filter((t) => t.status === "IN_PROGRESS"),
      color: "border-t-amber-500",
      badge: "bg-amber-500/10 text-amber-500",
    },
    REVIEW: {
      title: "بانتظار المراجعة والاعتماد",
      tasks: tasks.filter((t) =>
        [
          "PENDING_DEPT_HEAD_REVIEW",
          "PENDING_SUPERVISOR_REVIEW",
          "PENDING_EXECUTIVE_REVIEW",
          "PENDING_GM_APPROVAL",
        ].includes(t.status)
      ),
      color: "border-t-purple-500",
      badge: "bg-purple-500/10 text-purple-500",
    },
    COMPLETED: {
      title: "مكتملة ومعتمدة",
      tasks: tasks.filter((t) => ["COMPLETED", "APPROVED"].includes(t.status)),
      color: "border-t-emerald-500",
      badge: "bg-emerald-500/10 text-emerald-500",
    },
  }

  return (
    <div className="space-y-6 pb-12 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <ArrowLeftRight className="h-7 w-7 text-indigo-500" />
            لوحة كانبان المهام التفاعلية
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            متابعة بصرية فورية لسير إنجاز مهام الكادر الإداري والميداني بنظام الأعمدة والمراحل.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" asChild className="gap-2">
            <Link href="/dashboard/tasks">
              <List className="h-4 w-4" />
              عرض الجدول
            </Link>
          </Button>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-[#00B2A9] hover:bg-[#00968F] text-white gap-2 shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            إسناد مهمة
          </Button>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(columns).map(([colKey, col]) => (
          <div key={colKey} className="flex flex-col gap-3">
            <div className={`rounded-xl border border-border/50 bg-card/60 p-3 shadow-sm border-t-4 ${col.color}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground">{col.title}</h3>
                <span className={`flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full text-[10px] font-bold font-mono ${col.badge}`}>
                  {col.tasks.length}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 min-h-[420px] p-2 rounded-2xl bg-muted/20 border border-dashed border-border/40">
              {col.tasks.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <p className="text-xs">لا توجد مهام في هذه المرحلة</p>
                </div>
              ) : (
                col.tasks.map((task) => {
                  const priorityInfo = priorityMap[task.priority] || { label: task.priority, color: "text-slate-500" }
                  return (
                    <Card key={task.id} className="border border-border/60 bg-card shadow-sm hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-[11px] font-bold text-primary">#{task.taskNumber}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${priorityInfo.color}`}>
                            {priorityInfo.label}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-snug">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/30">
                          <span className="font-medium text-foreground flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {task.assignee?.name || "غير محدد"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            {task.department?.name || "عام"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Dialog */}
      <CreateTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        departments={departments}
        users={users}
      />
    </div>
  )
}
