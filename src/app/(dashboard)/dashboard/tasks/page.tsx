export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  CheckSquare,
  Clock,
  Building2,
  Plus,
  Filter,
  ArrowLeftRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

async function getTasksData() {
  const [tasks, totalTasks, inProgressTasks, completedTasks, departments] = await Promise.all([
    prisma.task.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        department: true,
        assignee: true,
        assignedBy: true,
      },
    }),
    prisma.task.count(),
    prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.task.count({ where: { status: 'COMPLETED' } }),
    prisma.department.findMany({ select: { id: true, name: true } }),
  ]);

  return { tasks, totalTasks, inProgressTasks, completedTasks, departments };
}

const statusMap: Record<string, { label: string; color: string }> = {
  NEW: { label: 'جديدة', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  NOT_STARTED: { label: 'لم تبدأ', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
  IN_PROGRESS: { label: 'قيد التنفيذ', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  COMPLETED: { label: 'مكتملة', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  PENDING_DEPT_HEAD_REVIEW: { label: 'مراجعة رئيس القسم', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  PENDING_GM_APPROVAL: { label: 'موافقة المدير العام', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
  APPROVED: { label: 'معتمدة', color: 'bg-teal-500/10 text-teal-500 border-teal-500/20' },
  REJECTED: { label: 'مرفوضة', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
};

const priorityMap: Record<string, { label: string; color: string }> = {
  HIGH: { label: 'عالية', color: 'text-rose-500 bg-rose-500/10' },
  MEDIUM: { label: 'متوسطة', color: 'text-amber-500 bg-amber-500/10' },
  LOW: { label: 'منخفضة', color: 'text-slate-500 bg-slate-500/10' },
};

export default async function TasksPage() {
  const { tasks, totalTasks, inProgressTasks, completedTasks, departments } = await getTasksData();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <CheckSquare className="h-7 w-7 text-amber-500" />
            إدارة وتوزيع المهام المؤسسية
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            متابعة إسناد المهام الميدانية والإدارية وتتبع أداء الكادر ونسب الإنجاز اللحظية.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" asChild className="gap-2">
            <Link href="/dashboard/tasks/board">
              <ArrowLeftRight className="h-4 w-4 text-indigo-500" />
              لوحة كانبان المهام
            </Link>
          </Button>
          <Button className="bg-[#00B2A9] hover:bg-[#00968F] text-white gap-2 shadow-lg shadow-teal-500/20">
            <Plus className="h-4 w-4" />
            إسناد مهمة جديدة
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              إجمالي المهام
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{totalTasks}</div>
            <p className="text-[11px] text-muted-foreground mt-1">جميع المهام المسجلة بالمنظومة</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              قيد التنفيذ
            </CardTitle>
            <Clock className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-500">{inProgressTasks}</div>
            <p className="text-[11px] text-muted-foreground mt-1">مهام يباشرها الكادر الميداني حالياً</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              المهام المكتملة
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-500">{completedTasks}</div>
            <p className="text-[11px] text-muted-foreground mt-1">مهام منجزة وموثقة بالسجلات</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              الأقسام المفعلة
            </CardTitle>
            <Building2 className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-cyan-500">{departments.length}</div>
            <p className="text-[11px] text-muted-foreground mt-1">أقسام معتمدة بالهيكل الإداري</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Table */}
      <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold">قائمة المهام والتكليفات</CardTitle>
              <CardDescription className="text-xs">جدول استعراض المهام وحالات الاعتماد والمسؤولين عن التنفيذ</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                تصفية حسب القسم
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-3 text-amber-500 ring-4 ring-amber-500/5">
                <CheckSquare className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-foreground">لا توجد مهام مسجلة حتى الآن</p>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                يمكن للإدارة والمشرفين إسناد مهام ميدانية أو إدارية جديدة وتوجيهها للكادر المختص.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border/30">
                  <tr>
                    <th className="py-3 px-4 font-bold">رقم المهمة</th>
                    <th className="py-3 px-4 font-bold">عنوان المهمة</th>
                    <th className="py-3 px-4 font-bold">القسم</th>
                    <th className="py-3 px-4 font-bold">الموظف المكلف</th>
                    <th className="py-3 px-4 font-bold">الأولوية</th>
                    <th className="py-3 px-4 font-bold">الحالة</th>
                    <th className="py-3 px-4 font-bold">تاريخ الإسناد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {tasks.map((task) => {
                    const statusInfo = statusMap[task.status] || { label: task.status, color: 'bg-slate-500/10 text-slate-500' };
                    const priorityInfo = priorityMap[task.priority] || { label: task.priority, color: 'text-slate-500' };
                    return (
                      <tr key={task.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-primary">#{task.taskNumber}</td>
                        <td className="py-3 px-4 font-semibold text-foreground max-w-xs truncate">{task.title}</td>
                        <td className="py-3 px-4 text-muted-foreground">{task.department?.name || 'عام'}</td>
                        <td className="py-3 px-4 font-medium">{task.assignee?.name || 'غير محدد'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${priorityInfo.color}`}>
                            {priorityInfo.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-mono">
                          {new Date(task.createdAt).toLocaleDateString('ar-SA')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
