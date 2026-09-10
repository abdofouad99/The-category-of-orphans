export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import {
  Megaphone,
  Plus,
  Bell,
  AlertCircle,
  CheckCircle2,
  Calendar,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

async function getAnnouncementsData() {
  const [announcements, totalAnnouncements, activeAnnouncements] = await Promise.all([
    prisma.announcement.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { createdBy: true },
    }),
    prisma.announcement.count(),
    prisma.announcement.count({ where: { isActive: true } }),
  ]);

  return { announcements, totalAnnouncements, activeAnnouncements };
}

export default async function AnnouncementsPage() {
  const { announcements, totalAnnouncements, activeAnnouncements } = await getAnnouncementsData();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <Megaphone className="h-7 w-7 text-emerald-500" />
            نشر وإدارة التعميمات الإدارية
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            بث القرارات الإدارية والتوجيهات المؤسسية وتوثيق اطلاع الكادر عليها لحظياً.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button className="bg-[#00B2A9] hover:bg-[#00968F] text-white gap-2 shadow-lg shadow-teal-500/20">
            <Plus className="h-4 w-4" />
            نشر تعميم إداري جديد
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              إجمالي التعميمات الصادرة
            </CardTitle>
            <Megaphone className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{totalAnnouncements}</div>
            <p className="text-[11px] text-muted-foreground mt-1">قرارات وتعاميم إدارية موثقة</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              التعميمات الفعالة حالياً
            </CardTitle>
            <Bell className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-500">{activeAnnouncements}</div>
            <p className="text-[11px] text-muted-foreground mt-1">تظهر في الشريط العلوي لكافة الموظفين</p>
          </CardContent>
        </Card>
      </div>

      {/* Announcements List */}
      <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-base font-bold">سجل التعميمات والقرارات</CardTitle>
          <CardDescription className="text-xs">استعراض التعميمات الصادرة وحالة النشر</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3 text-emerald-500 ring-4 ring-emerald-500/5">
                <Megaphone className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-foreground">لا توجد تعميمات منشورة حتى الآن</p>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                يمكن للمدير العام والإدارة نشر تعميمات فورية وتوجيهات لفرق العمل تظهر في أعلى لوحة التحكم.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          {ann.type}
                        </span>
                        <h3 className="text-sm font-bold text-foreground">{ann.title}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">{ann.content}</p>
                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-2">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {ann.createdBy?.name || 'الإدارة'}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="h-3 w-3" />
                          {new Date(ann.createdAt).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      ann.isActive
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                    }`}>
                      {ann.isActive ? 'منشور ونشط' : 'معطل'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
