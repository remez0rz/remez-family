import { NextResponse } from 'next/server'
import dns from 'node:dns/promises'
import { getAuthedProfile } from '../../lib/serverAuth'

export const dynamic = 'force-dynamic'

// Block requests aimed at the server's own network or cloud metadata so this
// link-preview proxy can't be turned into an SSRF tool.
function isBlockedIp(ip) {
  // IPv6 loopback / unspecified / link-local / unique-local
  if (ip === '::1' || ip === '::' || /^fe80:/i.test(ip) || /^f[cd][0-9a-f]{2}:/i.test(ip)) return true
  // Map IPv4-in-IPv6 (e.g. ::ffff:169.254.169.254) down to the v4 part
  const v4 = ip.replace(/^::ffff:/i, '')
  const m = v4.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (!m) return false
  const [a, b] = [Number(m[1]), Number(m[2])]
  return (
    a === 10 ||                          // 10.0.0.0/8
    a === 127 ||                         // loopback
    a === 0 ||                           // 0.0.0.0/8
    (a === 169 && b === 254) ||          // link-local + cloud metadata (169.254.169.254)
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
    (a === 192 && b === 168)             // 192.168.0.0/16
  )
}

async function isSafeUrl(raw) {
  let u
  try { u = new URL(raw) } catch { return false }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
  if (u.username || u.password) return false // strip credential-laden URLs
  // Only allow standard web ports.
  if (u.port && u.port !== '80' && u.port !== '443') return false
  try {
    const addrs = await dns.lookup(u.hostname, { all: true })
    if (!addrs.length) return false
    return !addrs.some(({ address }) => isBlockedIp(address))
  } catch {
    return false
  }
}

export async function GET(req) {
  // Same-origin family callers only — keeps the fetch proxy off the open internet.
  const caller = await getAuthedProfile()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')

  if (!url || !url.startsWith('http')) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }
  if (!(await isSafeUrl(url))) {
    return NextResponse.json({ error: 'Blocked URL' }, { status: 400 })
  }

  try {
    const res = await fetch(url, {
      redirect: 'manual', // don't follow redirects into blocked hosts
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
