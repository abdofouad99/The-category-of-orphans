import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as ping`;
    const latency = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      latencyMs: latency,
      timestamp: new Date().toISOString(),
      message: 'Supabase project keep-alive ping successful'
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message || 'Unknown database error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
