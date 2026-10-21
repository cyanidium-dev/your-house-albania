/**
 * Inter for Satori (next/og): the social cards and the Price Index card.
 * Text is set in Inter, which has the Cyrillic and the Albanian letters; the
 * brand face does not.
 */

const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap'

export type FontFace = { name: string; weight: 400 | 700; data: ArrayBuffer; style: 'normal' }

let fontsPromise: Promise<FontFace[]> | null = null

/**
 * Google serves TrueType when the client sends no modern user agent, which
 * is the one format Satori reads without a converter. Fetched once per
 * process and kept; a failed fetch is forgotten so the next request retries.
 */
export async function loadFonts(): Promise<FontFace[]> {
  if (!fontsPromise) {
    fontsPromise = (async () => {
      const css = await fetch(FONT_CSS, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((r) => {
        if (!r.ok) throw new Error(`font css ${r.status}`)
        return r.text()
      })
      const faces: FontFace[] = []
      const block = /@font-face\s*{([^}]+)}/g
      for (const m of css.matchAll(block)) {
        const body = m[1]
        const weight = /font-weight:\s*(\d+)/.exec(body)?.[1]
        const url = /src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype)'\)/.exec(body)?.[1]
        if (!weight || !url) continue
        if (faces.some((f) => f.weight === Number(weight))) continue
        const data = await fetch(url).then((r) => {
          if (!r.ok) throw new Error(`font file ${r.status}`)
          return r.arrayBuffer()
        })
        faces.push({ name: 'Inter', weight: Number(weight) as 400 | 700, data, style: 'normal' })
      }
      if (!faces.length) throw new Error('no TrueType faces in Google Fonts response')
      return faces
    })().catch((err) => {
      fontsPromise = null
      throw err
    })
  }
  return fontsPromise
}
