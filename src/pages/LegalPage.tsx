import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { LEGAL_DOCS } from "@/features/legal/content";

function createLegalPage(key: keyof typeof LEGAL_DOCS) {
  return function LegalPage() {
    const doc = LEGAL_DOCS[key];
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
                  className="mb-2 text-sm leading-relaxed text-text-secondary"
                >
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
          Có thắc mắc?{" "}
          <Link
            to={ROUTES.HOME}
            className="font-semibold text-primary hover:underline"
          >
            Về trang chủ
          </Link>{" "}
          hoặc liên hệ support@tutorlink.vn.
        </p>
      </div>
    );
  };
}

export const GuidePage = createLegalPage("guide");
export const FeePolicyPage = createLegalPage("fee");
export const PrivacyPage = createLegalPage("privacy");
export const TermsPage = createLegalPage("terms");
