// 랜딩 구조화 데이터(JSON-LD). FAQPage 는 화면 FAQ 와 같은 i18n 키에서 생성 → 1:1 일치
import { translations } from "./i18n";
import { SITE_URL } from "./site";

export const FAQ_IDS = [1, 2, 3, 4, 5, 6];

const en = translations.en;

export function buildLandingJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Goleu AI",
      url: `${SITE_URL}/`,
      description: en.landingDefinition,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_IDS.map((n) => ({
        "@type": "Question",
        name: en[`faq${n}Q`],
        acceptedAnswer: { "@type": "Answer", text: en[`faq${n}A`] },
      })),
    },
  ];
}
