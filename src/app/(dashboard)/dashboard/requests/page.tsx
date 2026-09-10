export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  Building2,
  AlertCircle,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

async function getRequestsData() {
  const [requests, totalRequests, newRequests, completedRequests] = await Promise.all([
    prisma.request.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        targetDepartment: true,
        tasks: true,
      },
    }),
    prisma.request.count(),
    prisma.request.count({ where: { status: 'NEW' } }),
    prisma.request.count({ where: { status: 'COMPLETED' } }),
  ]);

  return { requests, totalRequests, newRequests, completedRequests };
}

const statusMap: Record<string, { label: string; color: string }> = {
  NEW: { label: 'طلب جديد', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  IN_PROGRESS: { label: 'قيد المعالجة', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  COMPLETED: { label: 'مكتمل ومعتمد', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  CLOSED: { label: 'مغلق', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
};

const priorityMap: Record<string, { label: string; color: string }> = {
  HIGH: { label: 'عاجل', color: 'text-rose-500 bg-rose-500/10' },
  MEDIUM: { label: 'متوسط', color: 'text-amber-500 bg-amber-500/10' },
  LOW: { label: 'عادي', color: 'text-slate-500 bg-slate-500/10' },
};

export default async function RequestsPage() {
  const { requests, totalRequests, newRequests, completedRequests } = await getRequestsData();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <FileText className="h-7 w-7 text-blue-500" />
            إدارة ومتابعة الطلبات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            استقبال طلبات المستفيدين الخارجية والطلبات الإدارية الداخلية وتحويلها آلياً إلى مهام عمل.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button className="bg-[#00B2A9] hover:bg-[#00968F] text-white gap-2 shadow-lg shadow-teal-500/20">
            <Plus className="h-4 w-4" />
            تسجيل طلب جديد
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              إجمالي الطلبات
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{totalRequests}</div>
            <p className="text-[11px] text-muted-foreground mt-1">جميع طلبات الرعاية والمساعدات المسجلة</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              طلبات جديدة واردة
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-500">{newRequests}</div>
            <p className="text-[11px] text-muted-foreground mt-1">بانتظار الفرز والتحويل لمهام عمل</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              طلبات منجزة
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-500">{completedRequests}</div>
            <p className="text-[11px] text-muted-foreground mt-1">طلبات تمت معالجتها وإغلاقها بنجاح</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-base font-bold">سجل الطلبات الواردة</CardTitle>
          <CardDescription className="text-xs">تتبع الطلبات ومصادرها والأقسام الموجهة إليها والمهام المنبثقة عنها</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-3 text-blue-500 ring-4 ring-blue-500/5">
                <FileText className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-foreground">لا توجد طلبات مسجلة حتى الآن</p>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                تظهر هنا طلبات كفالة الأيتام والإعانات الميدانية وطلبات الموظفين الداخلية.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border/30">
                  <tr>
                    <th className="py-3 px-4 font-bold">رقم الطلب</th>
                    <th className="py-3 px-4 font-bold">صاحب الطلب</th>
                    <th className="py-3 px-4 font-bold">نوع الطلب</th>
                    <th className="py-3 px-4 font-bold">المصدر</th>
                    <th className="py-3 px-4 font-bold">القسم المعني</th>
                    <th className="py-3 px-4 font-bold">الأولوية</th>
                    <th className="py-3 px-4 font-bold">الحالة</th>
                    <th className="py-3 px-4 font-bold">تاريخ التقديم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {requests.map((req) => {
                    const statusInfo = statusMap[req.status] || { label: req.status, color: 'bg-slate-500/10 text-slate-500' };
                    const priorityInfo = priorityMap[req.priority] || { label: req.priority, color: 'text-slate-500' };
                    return (
                      <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-primary">#{req.requestNumber}</td>
                        <td className="py-3 px-4 font-bold text-foreground">
                          {req.clientName || req.requestedByName || 'مستفيد'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{req.requestType}</td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {req.requestSource === 'INTERNAL' ? 'داخلي (موظف)' : 'خارجي (مستفيد)'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {req.targetDepartment?.name || 'عام'}
                        </td>
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
                          {new Date(req.createdAt).toLocaleDateString('ar-SA')}
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
