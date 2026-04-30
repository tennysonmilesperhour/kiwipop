import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STORAGE_BUCKET = 'product-images';
const ACCEPTED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  if (!ACCEPTED_MIME.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported type: ${file.type}` },
      { status: 415 }
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: 'File exceeds 5 MB' },
      { status: 413 }
    );
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const path = `${crypto.randomUUID()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: 'Upload failed', details: uploadError.message },
      { status: 502 }
    );
  }

  const { data: publicUrl } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return NextResponse.json({ url: publicUrl.publicUrl, path });
}
