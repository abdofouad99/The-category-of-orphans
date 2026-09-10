export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import {
  Building2,
  Plus,
  Users,
  CheckSquare,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

async function getDepartmentsData() {
  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: {
      users: true,
      tasks: true,
      requests: true,
    },
  });

  return { departments };
}

export default async function DepartmentsPage() {
  const { departments } = await getDepartmentsData();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <Building2 className="h-7 w-7 text-cyan-500" />
            الهيكل الإداري والأقسام المؤسسية
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            تنظيم وهيكلة إدارات وأقسام المؤسسة وربط الكادر والمهام والطلبات بكل قسم.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button className="bg-[#00B2A9] hover:bg-[#00968F] text-white gap-2 shadow-lg shadow-teal-500/20">
            <Plus className="h-4 w-4" />
            إضافة قسم جديد
          </Button>
        </div>
      </div>

      {/* Departments Grid */}
      {departments.length === 0 ? (
        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm p-12 text-center">
          <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-3 text-cyan-500 ring-4 ring-cyan-500/5">
            <Building2 className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-foreground">لا توجد أقسام مسجلة حتى الآن</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
            يمكن للمدير العام إضافة الأقسام المؤسسية الرسمية (الرعاية الاجتماعية، الموارد البشرية، الميدان، المالية...).
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => {
            const completedTasks = dept.tasks.filter((t) => t.status === 'COMPLETED').length;
            const inProgressTasks = dept.tasks.filter((t) => t.status === 'IN_PROGRESS').length;

            return (
              <Card key={dept.id} className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm hover:border-cyan-500/30 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-cyan-500" />
                      {dept.name}
                    </CardTitle>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                      {dept.users.length} موظف
                    </span>
                  </div>
                  {dept.description && (
                    <CardDescription className="text-xs line-clamp-2 mt-1">
                      {dept.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/20 text-center text-xs">
                    <div className="bg-muted/40 p-2 rounded-lg">
                      <p className="text-muted-foreground text-[10px]">المهام</p>
                      <p className="font-bold text-foreground font-mono mt-0.5">{dept.tasks.length}</p>
                    </div>
                    <div className="bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                      <p className="text-amber-500 text-[10px]">قيد العمل</p>
                      <p className="font-bold text-amber-500 font-mono mt-0.5">{inProgressTasks}</p>
                    </div>
                    <div className="bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                      <p className="text-emerald-500 text-[10px]">منجزة</p>
                      <p className="font-bold text-emerald-500 font-mono mt-0.5">{completedTasks}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
