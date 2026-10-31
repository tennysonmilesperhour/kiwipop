import { NextResponse, type NextRequest } from 'next/server';
import { unsubscribeByRecoveryToken } from '@/lib/abandoned-checkout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Unsubscribe link from the checkout recovery email.
 *
 * GET  shows a one-button confirmation page. It does not unsubscribe on its
 *      own, because mail security scanners open every link in an email and
 *      would otherwise unsubscribe people who never clicked.
 * POST unsubscribes. The confirmation button posts here, and so do Gmail and
 *      Apple Mail for RFC 8058 one-click unsubscribe from the
 *      List-Unsubscribe header.
 *
 * Idempotent, and never reveals the address behind a token.
 */
function page(title: string, body: string, status = 200): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${title} · kiwi pop</title>
<style>
  body { margin: 0; padding: 48px 16px; background: #050510; color: #f4f0e8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; }
  main { max-width: 480px; margin: 0 auto; }
  h1 { font-size: 26px; color: #a8ff3c; margin: 0 0 12px; }
  p { color: #d8d2c4; }
  a { color: #a8ff3c; }
  button { font: inherit; font-weight: 700; padding: 12px 28px; background: #a8ff3c; color: #050510; border: 0; border-radius: 4px; cursor: pointer; }
</style>
</head>
<body><main><h1>${title}</h1>${body}<p><a href="/">back to kiwipop.fun</a></p></main></body>
</html>`;
  return new NextResponse(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('t') ?? '';
  const action = `/api/email/unsubscribe?t=${encodeURIComponent(token)}`;
  return page(
    'unsubscribe?',
    `<p>stop marketing email from kiwi pop to this address. receipts for anything you order still come through.</p>
<form method="post" action="${action}"><button type="submit">unsubscribe</button></form>`
  );
}

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('t') ?? '';
  const ok = await unsubscribeByRecoveryToken(token);
  const wantsHtml = (request.headers.get('accept') ?? '').includes('text/html');

  if (!wantsHtml) {
    return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
  }
  if (!ok) {
    return page(
      'link not recognised',
      "<p>we couldn't match this unsubscribe link. reply to any kiwi pop email and we'll take you off the list by hand.</p>",
      404
    );
  }
  return page(
    "you're unsubscribed.",
    "<p>you won't get marketing email from kiwi pop at this address. receipts for anything you order still come through.</p>"
  );
}
