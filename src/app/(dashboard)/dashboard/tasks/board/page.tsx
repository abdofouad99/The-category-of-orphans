export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  ArrowLeftRight,
  List,
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

async function getKanbanTasks() {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      assignee: true,
      department: true,
    },
  });

  const columns = {
    NEW: { title: 'مهام جديدة', tasks: tasks.filter((t) => t.status === 'NEW'), color: 'border-t-blue-500' },
    IN_PROGRESS: { title: 'قيد التنفيذ', tasks: tasks.filter((t) => t.status === 'IN_PROGRESS'), color: 'border-t-amber-500' },
    REVIEW: {
      title: 'بانتظار المراجعة والاعتماد',
      tasks: tasks.filter((t) =>
        ['PENDING_DEPT_HEAD_REVIEW', 'PENDING_SUPERVISOR_REVIEW', 'PENDING_EXECUTIVE_REVIEW', 'PENDING_GM_APPROVAL'].includes(t.status)
      ),
      color: 'border-t-purple-500',
    },
    COMPLETED: { title: 'مكتملة ومعتمدة', tasks: tasks.filter((t) => ['COMPLETED', 'APPROVED'].includes(t.status)), color: 'border-t-emerald-500' },
  };

  return { columns, totalCount: tasks.length };
}

const priorityMap: Record<string, { label: string; color: string }> = {
  HIGH: { label: 'عالية', color: 'text-rose-500 bg-rose-500/10' },
  MEDIUM: { label: 'متوسطة', color: 'text-amber-500 bg-amber-500/10' },
  LOW: { label: 'منخفضة', color: 'text-slate-500 bg-slate-500/10' },
};

export default async function TasksBoardPage() {
  const { columns, totalCount } = await getKanbanTasks();

  return (
    <div className="space-y-6 pb-12">
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
          <Button className="bg-[#00B2A9] hover:bg-[#00968F] text-white gap-2 shadow-lg shadow-teal-500/20">
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
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold font-mono">
                  {col.tasks.length}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 min-h-[400px] p-1.5 rounded-2xl bg-muted/20 border border-dashed border-border/40">
              {col.tasks.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <p className="text-xs">لا توجد مهام في هذه المرحلة</p>
                </div>
              ) : (
                col.tasks.map((task) => {
                  const priorityInfo = priorityMap[task.priority] || { label: task.priority, color: 'text-slate-500' };
                  return (
                    <Card key={task.id} className="border border-border/50 bg-card/90 shadow-sm hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-[11px] font-bold text-primary">#{task.taskNumber}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${priorityInfo.color}`}>
                            {priorityInfo.label}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-snug">
                          {task.title}
                        </h4>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/20">
                          <span>{task.assignee?.name || 'غير محدد'}</span>
                          <span>{task.department?.name || 'عام'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
