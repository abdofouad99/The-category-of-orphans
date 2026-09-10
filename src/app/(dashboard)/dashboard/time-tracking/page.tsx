export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import {
  Clock,
  CheckSquare,
  Users,
  Building2,
  Calendar,
  Hourglass,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

async function getTimeTrackingData() {
  const [entries, totalMinutesAgg, totalTasksTracked] = await Promise.all([
    prisma.timeEntry.findMany({
      take: 50,
      orderBy: { startTime: 'desc' },
      include: {
        task: {
          include: { department: true },
        },
        user: true,
      },
    }),
    prisma.timeEntry.aggregate({
      _sum: { durationMinutes: true },
    }),
    prisma.task.count({
      where: {
        timeEntries: { some: {} },
      },
    }),
  ]);

  const totalMinutes = totalMinutesAgg._sum.durationMinutes || 0;
  const totalHours = (totalMinutes / 60).toFixed(1);

  return { entries, totalMinutes, totalHours, totalTasksTracked };
}

export default async function TimeTrackingPage() {
  const { entries, totalHours, totalTasksTracked } = await getTimeTrackingData();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <Clock className="h-7 w-7 text-teal-500" />
            تتبع ساعات العمل والدوام
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            تسجيل وتوثيق أوقات إنجاز المهام الميدانية والمكتبية وحساب إجمالي الساعات والدقائق بدقة.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button className="bg-[#00B2A9] hover:bg-[#00968F] text-white gap-2 shadow-lg shadow-teal-500/20">
            <Clock className="h-4 w-4" />
            بدء جلسة عمل
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              إجمالي الساعات الموثقة
            </CardTitle>
            <Hourglass className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-teal-500">{totalHours} <span className="text-sm font-normal text-muted-foreground">ساعة</span></div>
            <p className="text-[11px] text-muted-foreground mt-1">ساعات عمل موثقة ومحتسبة للكادر</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              المهام المقاسة بالوقت
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{totalTasksTracked}</div>
            <p className="text-[11px] text-muted-foreground mt-1">مهمة تم تسجيل وقت استغراقها</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              سجلات الدوام
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-blue-500">{entries.length}</div>
            <p className="text-[11px] text-muted-foreground mt-1">حركة تسجيل وقت تمت في النظام</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Entries Table */}
      <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-base font-bold">سجل ساعات العمل اللحظي</CardTitle>
          <CardDescription className="text-xs">تفاصيل فترات العمل المسجلة لكل موظف ومهمة</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-3 text-teal-500 ring-4 ring-teal-500/5">
                <Clock className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-foreground">لا توجد سجلات دوام حتى الآن</p>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                يقوم الباحث والموظف بتشغيل مؤقت المهمة لحساب زمن العمل الميداني أو المكتبي بدقة.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border/30">
                  <tr>
                    <th className="py-3 px-4 font-bold">الموظف</th>
                    <th className="py-3 px-4 font-bold">المهمة المرتبطة</th>
                    <th className="py-3 px-4 font-bold">القسم</th>
                    <th className="py-3 px-4 font-bold">وقت البدء</th>
                    <th className="py-3 px-4 font-bold">وقت الانتهاء</th>
                    <th className="py-3 px-4 font-bold">المدة المستغرقة</th>
                    <th className="py-3 px-4 font-bold">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-foreground">{entry.user?.name || 'مستخدم'}</td>
                      <td className="py-3 px-4 text-primary font-semibold max-w-xs truncate">
                        {entry.task?.title || `مهمة #${entry.taskId.substring(0, 6)}`}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {entry.task?.department?.name || 'عام'}
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {new Date(entry.startTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {entry.endTime ? new Date(entry.endTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : 'قيد العمل'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600 border border-teal-500/20">
                          {entry.durationMinutes ? `${entry.durationMinutes} دقيقة` : 'جاري الاحتساب'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{entry.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
