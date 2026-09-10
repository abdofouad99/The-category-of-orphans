export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import {
  BookOpen,
  Plus,
  FileText,
  Lock,
  Globe,
  Download,
  Building2,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

async function getDocsData() {
  const [docs, totalDocs] = await Promise.all([
    prisma.documentPolicy.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        department: true,
        createdBy: true,
      },
    }),
    prisma.documentPolicy.count(),
  ]);

  return { docs, totalDocs };
}

export default async function DocsPage() {
  const { docs, totalDocs } = await getDocsData();

  return (
    <div className="space-y-6 pb-12">
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
          <Button className="bg-[#00B2A9] hover:bg-[#00968F] text-white gap-2 shadow-lg shadow-teal-500/20">
            <Plus className="h-4 w-4" />
            رفع مستند جديد
          </Button>
        </div>
      </div>

      {/* Docs Grid */}
      {docs.length === 0 ? (
        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm p-12 text-center">
          <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-3 text-purple-500 ring-4 ring-purple-500/5">
            <BookOpen className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-foreground">لا توجد مستندات أو لوائح مرفوعة حتى الآن</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
            يمكن لإدارة المؤسسة حفظ اللوائح التنظيمية ونماذج تقييم الأيتام وسياسات الصرف المالي ليطلع عليها الكادر ويحملها بضغطة زر.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <Card key={doc.id} className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm hover:border-purple-500/30 transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-bold truncate">{doc.title}</CardTitle>
                      <CardDescription className="text-[11px] truncate">
                        {doc.department?.name || 'عام للمؤسسة'}
                      </CardDescription>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    doc.isPublic ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {doc.isPublic ? 'عام' : 'خاص'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {doc.content && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                    {doc.content}
                  </p>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-border/20 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="h-3 w-3" />
                    {new Date(doc.createdAt).toLocaleDateString('ar-SA')}
                  </span>
                  {doc.fileUrl && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary hover:text-primary">
                      <Download className="h-3.5 w-3.5" />
                      تنزيل
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
