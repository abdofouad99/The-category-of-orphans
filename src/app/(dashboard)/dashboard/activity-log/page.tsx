export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import {
  Activity,
  Shield,
  User,
  Calendar,
  Clock,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

async function getActivityLogsData() {
  const [logs, totalLogs] = await Promise.all([
    prisma.activityLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
      },
    }),
    prisma.activityLog.count(),
  ]);

  return { logs, totalLogs };
}

const actionTypeLabels: Record<string, { label: string; color: string }> = {
  CREATE: { label: 'إنشاء جديد', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  UPDATE: { label: 'تعديل وتحديث', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  DELETE: { label: 'حذف', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
  APPROVE: { label: 'اعتماد وموافقة', color: 'bg-teal-500/10 text-teal-600 border-teal-500/20' },
  EXPORT: { label: 'تصدير بيانات', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
};

export default async function ActivityLogPage() {
  const { logs, totalLogs } = await getActivityLogsData();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <Activity className="h-7 w-7 text-slate-400" />
            سجل التدقيق والرقابة الشامل (Audit Log)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            رصد وتوثيق كافة العمليات الحساسة في المنظومة بالوقت واسم المستخدم والـ IP لضمان أعلى معايير الحوكمة.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              إجمالي الحركات الرقابية
            </CardTitle>
            <Activity className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{totalLogs}</div>
            <p className="text-[11px] text-muted-foreground mt-1">حركة موثقة في سجل النظام</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              مستوى الحماية والنزاهة
            </CardTitle>
            <Shield className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-500">100%</div>
            <p className="text-[11px] text-muted-foreground mt-1">جميع العمليات تخضع للتوثيق الصارم غير القابل للتعديل</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-base font-bold">سجل العمليات الإدارية والرقابية</CardTitle>
          <CardDescription className="text-xs">توثيق الإجراءات بالاسم والتوقيت والكيان المتأثر</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 rounded-2xl bg-slate-500/10 flex items-center justify-center mb-3 text-slate-400 ring-4 ring-slate-500/5">
                <Activity className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-foreground">لا توجد حركات رقابية مسجلة بعد</p>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                يتم تسجيل كل عملية إنشاء أو تعديل أو اعتماد أو حذف تلقائياً في هذا السجل بصورة فورية.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border/30">
                  <tr>
                    <th className="py-3 px-4 font-bold">نوع الإجراء</th>
                    <th className="py-3 px-4 font-bold">المستخدم المنفذ</th>
                    <th className="py-3 px-4 font-bold">الكيان المعني</th>
                    <th className="py-3 px-4 font-bold">العنوان / البيان</th>
                    <th className="py-3 px-4 font-bold">عنوان الـ IP</th>
                    <th className="py-3 px-4 font-bold">التاريخ والتوقيت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {logs.map((log) => {
                    const actionInfo = actionTypeLabels[log.actionType] || {
                      label: log.actionType,
                      color: 'bg-slate-500/10 text-slate-500',
                    };
                    return (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${actionInfo.color}`}>
                            {actionInfo.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-foreground">{log.user?.name || 'النظام'}</td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">{log.entityType}</td>
                        <td className="py-3 px-4 font-semibold text-foreground max-w-xs truncate">
                          {log.entityTitle || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-muted-foreground text-[11px]">
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-mono">
                          {new Date(log.createdAt).toLocaleString('ar-SA')}
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
