import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/constants/routes";
import { LEGAL_DOCS, type LegalLang } from "@/features/legal/content";

function createLegalPage(key: keyof typeof LEGAL_DOCS) {
  return function LegalPage() {
    const { t, i18n } = useTranslation();
    const lang: LegalLang = i18n.language?.startsWith("en") ? "en" : "vi";
    const doc = LEGAL_DOCS[key][lang];
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-extrabold text-text">{doc.title}</h1>
        <p className="mt-2 text-text-secondary">{doc.intro}</p>

        <div className="mt-8 flex flex-col gap-8">
          {doc.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="mb-2 text-lg font-bold text-text">{s.heading}</h2>
              {s.paragraphs?.map((p) => (
                <p
                  key={p}
                  className="mb-2 text-sm leading-relaxed text-text-secondary">
                  {p}
                </p>
              ))}
              {s.bullets && (
                <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-secondary">
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <p className="mt-10 text-sm text-text-secondary">
          {t("legal.questions")}{" "}
          <Link
            to={ROUTES.HOME}
            className="font-semibold text-primary hover:underline">
            {t("legal.backHome")}
          </Link>{" "}
          <span>{t("legal.orContact")} </span>
          <a
            href="mailto:tutorlink.n3@gmail.com"
            className="font-semibold text-primary hover:underline">
            tutorlink.n3@gmail.com
          </a>
        </p>
      </div>
    );
  };
}

export const GuidePage = createLegalPage("guide");
export const FeePolicyPage = createLegalPage("fee");
export const PrivacyPage = createLegalPage("privacy");
export const TermsPage = createLegalPage("terms");
