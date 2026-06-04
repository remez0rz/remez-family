import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')

  if (!url || !url.startsWith('http')) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Remez-Family-Bot/1.0)',
        'Accept': 'text/html'
      },
      signal: AbortSignal.timeout(5000)
    })

    if (!res.ok) return NextResponse.json({ url }, { status: 200 })

    const html = await res.text()

    const getMeta = (name) => {
      const patterns = [
        new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`, 'i'),
      ]
      for (const p of patterns) {
        const m = html.match(p)
        if (m) return m[1].trim()
      }
      return null
    }

    const title       = getMeta('og:title')       || getMeta('twitter:title')       || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim()
    const description = getMeta('og:description') || getMeta('twitter:description') || getMeta('description')
    const image       = getMeta('og:image')        || getMeta('twitter:image')
    const siteName    = getMeta('og:site_name')

    // Make relative image URLs absolute
    let absoluteImage = image
    if (image && !image.startsWith('http')) {
      try {
        const base = new URL(url)
        absoluteImage = new URL(image, base.origin).href
      } catch {}
    }

    return NextResponse.json({
      url,
      title:       title       || null,
      description: description || null,
      image:       absoluteImage || null,
      siteName:    siteName    || null,
    })
  } catch (err) {
    // Return minimal data on any error (timeout, CORS, etc.)
    return NextResponse.json({ url }, { status: 200 })
  }
}
