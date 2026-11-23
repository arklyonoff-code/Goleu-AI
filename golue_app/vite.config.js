import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// 프리렌더(SSG) 대상. src/routes.jsx 의 PRERENDER_PATHS 와 동일하게 유지
const PRERENDER_PATHS = ['/', '/privacy', '/terms']

// 흐름 페이지(/quiz, /result/:id 등)용 클라이언트 전용 셸.
// data-server-rendered 가 없으므로 클라이언트가 hydrate 대신 새로 render 한다.
const SPA_SHELL = 'app.html'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_')
  const SITE_URL = (env.VITE_SITE_URL || 'https://goleu.vercel.app').replace(/\/$/, '')

  let shellWritten = false

  return {
    plugins: [
      react(),
      svgr(),
      {
        // `npm run preview` 를 vercel.json 과 같은 규칙으로: 파일 → 프리렌더 HTML → app.html
        name: 'goleu-preview-spa-shell',
        configurePreviewServer(server) {
          server.middlewares.use((req, _res, next) => {
            const pathname = (req.url || '/').split('?')[0]
            const route = pathname.replace(/\/$/, '') || '/'
            if (path.extname(pathname)) return next()
            if (route === '/') return next()
            req.url = PRERENDER_PATHS.includes(route) ? `${route}/index.html` : '/' + SPA_SHELL
            next()
          })
        },
      },
    ],
    base: '/',
    ssgOptions: {
      entry: 'src/main.jsx',
      dirStyle: 'nested', // /privacy → privacy/index.html
      // 흐름 페이지는 프리렌더하지 않음 (클라이언트 전용, app.html 셸로 서빙)
      includedRoutes: () => PRERENDER_PATHS,
      // 렌더 직전의 템플릿(빌드된 스크립트/CSS 포함, 본문 없음)을 SPA 셸로 저장
      onBeforePageRender(route, indexHTML) {
        if (!shellWritten) {
          shellWritten = true
          const shell = indexHTML.replace(
            '<head>',
            '<head>\n    <meta name="robots" content="noindex">',
          )
          fs.writeFileSync(path.resolve('dist', SPA_SHELL), shell)
        }
        return indexHTML
      },
      // 템플릿 기본 title/description/og 태그 중 Head(data-rh)로 다시 지정된 것은 제거 (중복 방지)
      onPageRendered(route, html) {
        let out = html
        const dedupe = (re, rhRe) => {
          if (rhRe.test(out)) out = out.replace(re, '')
        }
        dedupe(/<title>[^<]*<\/title>\s*/, /<title data-rh="true">/)
        dedupe(/<meta name="description" content="[^"]*">\s*/, /<meta data-rh="true" name="description"/)
        dedupe(/<meta property="og:url" content="[^"]*">\s*/, /<meta data-rh="true" property="og:url"/)
        dedupe(/<meta property="og:title" content="[^"]*">\s*/, /<meta data-rh="true" property="og:title"/)
        dedupe(/<meta property="og:description" content="[^"]*">\s*/, /<meta data-rh="true" property="og:description"/)
        dedupe(/<meta name="twitter:title" content="[^"]*">\s*/, /<meta data-rh="true" name="twitter:title"/)
        dedupe(/<meta name="twitter:description" content="[^"]*">\s*/, /<meta data-rh="true" name="twitter:description"/)
        // charset 은 <head> 맨 앞 (첫 1024바이트 이내) 으로
        out = out.replace(/\s*<meta charset="UTF-8">/, '').replace('<head>', '<head><meta charset="UTF-8">')
        return out
      },
      onFinished(outDir) {
        // public/ 의 크롤러 파일: %SITE_URL% 치환 (도메인은 .env 한 곳에서 관리)
        for (const f of ['robots.txt', 'llms.txt']) {
          const p = path.join(outDir, f)
          if (fs.existsSync(p)) {
            fs.writeFileSync(p, fs.readFileSync(p, 'utf-8').replaceAll('%SITE_URL%', SITE_URL))
          }
        }
        // Vercel 은 dist 를 배포하므로 rewrite 설정을 dist 에도 복사
        fs.copyFileSync(path.resolve('vercel.json'), path.join(outDir, 'vercel.json'))
        // sitemap.xml (인덱싱 대상만)
        const urls = PRERENDER_PATHS.map(
          (p) => `  <url><loc>${SITE_URL}${p === '/' ? '/' : p}</loc></url>`,
        ).join('\n')
        fs.writeFileSync(
          path.join(outDir, 'sitemap.xml'),
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
        )
      },
    },
  }
})
