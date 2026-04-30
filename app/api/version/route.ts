import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
};

export async function GET() {
  return NextResponse.json(
    {
      sha:
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.GIT_COMMIT_SHA ||
        'dev',
      env: process.env.VERCEL_ENV || 'development',
      branch: process.env.VERCEL_GIT_COMMIT_REF || null,
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID || null,
      now: new Date().toISOString(),
    },
    { headers: corsHeaders }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { ...corsHeaders, 'Access-Control-Max-Age': '86400' },
  });
}
