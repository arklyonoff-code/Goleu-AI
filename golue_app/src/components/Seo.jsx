import { Head } from "vite-react-ssg";
import { SITE_URL } from "../lib/site";

/**
 * 라우트별 <head> 메타데이터.
 * - 인덱싱 대상(/, /privacy, /terms): canonical + og:url
 * - 흐름 페이지: noindex (canonical 생략)
 * - jsonLd: 객체 배열 → <script type="application/ld+json">
 * - lang: 본문 언어 (개인정보처리방침/약관은 현재 한국어 본문만 있어 "ko")
 * - image: 링크 미리보기 이미지(public/ 기준 경로, 1200×630). 프리렌더 시 index.html 의 기본값보다 앞에 들어가 우선 적용된다
 */
export default function Seo({ title, description, path = "/", noindex = false, jsonLd = [], lang = "en", image = "/og-image.png" }) {
  const url = `${SITE_URL}${path}`;
  const imageUrl = `${SITE_URL}${image}`;
  return (
    <Head>
      <html lang={lang} />
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {description && <meta property="og:description" content={description} />}
      <meta property="og:title" content={title} />
      <meta name="twitter:title" content={title} />
      <meta property="og:image" content={imageUrl} />
      <meta name="twitter:image" content={imageUrl} />
      {description && <meta name="twitter:description" content={description} />}
      {noindex && <meta name="robots" content="noindex" />}
      {!noindex && <link rel="canonical" href={url} />}
      {!noindex && <meta property="og:url" content={url} />}
      {jsonLd.map((data, i) => (
        <script key={i} type="application/ld+json">
          {/* "</script>" 조기 종료 방지 */}
          {JSON.stringify(data).replace(/</g, "\\u003c")}
        </script>
      ))}
    </Head>
  );
}
