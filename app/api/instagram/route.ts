import { NextResponse } from 'next/server';

// Behold (https://behold.so) handles the Instagram auth + token refresh for us
// and publishes a plain JSON feed of recent posts at feeds.behold.so/FEED_ID.
// We normalize it down to what the landing grid needs and cache it for an hour
// (the free Behold plan only refreshes once a day anyway). If the feed isn't
// configured or the fetch fails we return an empty list and the landing page
// falls back to its built-in placeholder tiles.
export const runtime = 'nodejs';
export const revalidate = 3600;

interface BeholdSize {
  mediaUrl?: string;
  width?: number;
  height?: number;
}

interface BeholdPost {
  id?: string;
  permalink?: string;
  mediaUrl?: string;
  mediaType?: string;
  caption?: string;
  prunedCaption?: string;
  sizes?: {
    small?: BeholdSize;
    medium?: BeholdSize;
    large?: BeholdSize;
    full?: BeholdSize;
  };
}

export interface InstagramPost {
  id: string;
  permalink: string;
  imageUrl: string;
  caption: string;
}

const PROFILE_URL = 'https://www.instagram.com/the.kiwi.pop/';

export async function GET() {
  const feedUrl =
    process.env.BEHOLD_FEED_URL ??
    (process.env.BEHOLD_FEED_ID
      ? `https://feeds.behold.so/${process.env.BEHOLD_FEED_ID}`
      : null);

  if (!feedUrl) {
    return NextResponse.json({ posts: [] as InstagramPost[] });
  }

  try {
    const res = await fetch(feedUrl, { next: { revalidate: 3600 } });
    if (!res.ok) {
      throw new Error(`behold feed responded ${res.status}`);
    }
    const data: unknown = await res.json();
    // Behold returns a bare array; some feed shapes wrap it in { posts: [...] }.
    const raw: BeholdPost[] = Array.isArray(data)
      ? (data as BeholdPost[])
      : ((data as { posts?: BeholdPost[] })?.posts ?? []);

    const posts: InstagramPost[] = raw
      .map((p) => {
        // Prefer a sized still (these exist for images AND video thumbnails);
        // only fall back to mediaUrl for non-video posts since for videos that
        // field is the raw video file.
        const imageUrl =
          p.sizes?.medium?.mediaUrl ??
          p.sizes?.large?.mediaUrl ??
          p.sizes?.small?.mediaUrl ??
          p.sizes?.full?.mediaUrl ??
          (p.mediaType !== 'VIDEO' ? p.mediaUrl : undefined) ??
          '';
        return {
          id: p.id ?? p.permalink ?? imageUrl,
          permalink: p.permalink ?? PROFILE_URL,
          imageUrl,
          caption: (p.caption ?? p.prunedCaption ?? '').trim(),
        };
      })
      .filter((p) => p.imageUrl)
      .slice(0, 6);

    return NextResponse.json({ posts });
  } catch {
    return NextResponse.json({ posts: [] as InstagramPost[] });
  }
}
