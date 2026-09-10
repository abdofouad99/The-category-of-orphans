export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import {
  HandHeart,
  Plus,
  Star,
  Hourglass,
  Users,
  Award,
  Phone,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

async function getVolunteersData() {
  const [volunteers, totalVolunteers, activeVolunteers, totalHoursAgg] = await Promise.all([
    prisma.volunteer.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.volunteer.count(),
    prisma.volunteer.count({ where: { status: 'ACTIVE' } }),
    prisma.volunteer.aggregate({
      _sum: { totalHours: true },
    }),
  ]);

  const totalHours = totalHoursAgg._sum.totalHours || 0;

  return { volunteers, totalVolunteers, activeVolunteers, totalHours };
}

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5 justify-end">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i <= n ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'
          }`}
        />
      ))}
    </div>
  );
}

export default async function VolunteersPage() {
  const { volunteers, totalVolunteers, activeVolunteers, totalHours } = await getVolunteersData();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <HandHeart className="h-7 w-7 text-rose-500" />
            إدارة المتطوعين وبنك الساعات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            قاعدة بيانات فرق المتطوعين الميدانيين وتوثيق بنك الساعات التطوعية وتقييم الكفاءة.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button className="bg-[#00B2A9] hover:bg-[#00968F] text-white gap-2 shadow-lg shadow-teal-500/20">
            <Plus className="h-4 w-4" />
            تسجيل متطوع جديد
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              إجمالي المتطوعين
            </CardTitle>
            <Users className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{totalVolunteers}</div>
            <p className="text-[11px] text-muted-foreground mt-1">متطوع مقيد في قاعدة بيانات المؤسسة</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              المتطوعون النشطون
            </CardTitle>
            <Award className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-500">{activeVolunteers}</div>
            <p className="text-[11px] text-muted-foreground mt-1">جاهزون للمشاركة في حملات الإغاثة والتوزيع</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              رصيد بنك الساعات
            </CardTitle>
            <Hourglass className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-500">{totalHours.toLocaleString('ar-SA')} <span className="text-sm font-normal text-muted-foreground">ساعة</span></div>
            <p className="text-[11px] text-muted-foreground mt-1">ساعة تطوعية معتمدة تم توفيرها للمؤسسة</p>
          </CardContent>
        </Card>
      </div>

      {/* Volunteers Table */}
      <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-base font-bold">قائمة المتطوعين وفرق الإسناد الميداني</CardTitle>
          <CardDescription className="text-xs">استعراض مهارات المتطوعين ورصيد ساعاتهم والتقييم المؤسسي</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {volunteers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-3 text-rose-500 ring-4 ring-rose-500/5">
                <HandHeart className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-foreground">لا يوجد متطوعون مسجلون حتى الآن</p>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                يمكن للمؤسسة فتح باب التطوع وحصر ساعات الخدمة المجتمعية وتوثيقها رسمياً.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border/30">
                  <tr>
                    <th className="py-3 px-4 font-bold">الاسم الكامل</th>
                    <th className="py-3 px-4 font-bold">رقم الجوال</th>
                    <th className="py-3 px-4 font-bold">المهارات والتخصص</th>
                    <th className="py-3 px-4 font-bold">رصيد الساعات</th>
                    <th className="py-3 px-4 font-bold">التقييم</th>
                    <th className="py-3 px-4 font-bold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {volunteers.map((vol) => (
                    <tr key={vol.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-foreground">{vol.fullName}</td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{vol.phone}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {vol.skills.length > 0 ? (
                            vol.skills.map((skill, idx) => (
                              <span key={idx} className="bg-muted px-1.5 py-0.5 rounded text-[10px]">
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-500 font-mono">
                        {vol.totalHours} ساعة
                      </td>
                      <td className="py-3 px-4">
                        <Stars n={vol.rating} />
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          vol.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                        }`}>
                          {vol.status === 'ACTIVE' ? 'نشط ومتاح' : 'غير نشط'}
                        </span>
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
  );
}
