import type { Metadata } from "next";
import Link from "next/link";

import {
  LegalCallout,
  LegalHeader,
  LegalLink,
  LegalList,
  LegalSection,
} from "@/components/features/legal/legal-page";

export const metadata: Metadata = {
  title: "Politika e Privatësisë",
  description:
    "Si i mbledh, përdor dhe mbron HikeIt të dhënat tuaja personale — në përputhje me Ligjin Nr. 06/L-082 të Republikës së Kosovës.",
  alternates: { canonical: "https://hikeit.app/privacy" },
};

const LAST_UPDATED = "Korrik 2026";

/** Third-party processors, with the region their processing happens in. */
const PROCESSORS: { name: string; purpose: string; region: string; eu: boolean }[] =
  [
    {
      name: "Stripe",
      purpose: "Procesimi i pagesave",
      region: "SHBA — me masa mbrojtëse adekuate",
      eu: false,
    },
    {
      name: "Cloudinary",
      purpose: "Ruajtja dhe shpërndarja e imazheve",
      region: "SHBA — me masa mbrojtëse adekuate",
      eu: false,
    },
    {
      name: "Resend",
      purpose: "Dërgimi i email-eve transaksionale",
      region: "SHBA — me masa mbrojtëse adekuate",
      eu: false,
    },
    {
      name: "Supabase",
      purpose: "Baza e të dhënave",
      region: "Frankfurt, BE",
      eu: true,
    },
    { name: "Vercel", purpose: "Hosting i aplikacionit", region: "BE", eu: true },
    {
      name: "Sentry",
      purpose: "Monitorimi i gabimeve teknike",
      region: "BE",
      eu: true,
    },
    {
      name: "PostHog",
      purpose: "Analitikë e përdorimit (e anonimizuar)",
      region: "BE",
      eu: true,
    },
  ];

export default function PrivacyPage() {
  return (
    <article className="bg-abyss">
      <LegalHeader
        label="Ligjore"
        title="Politika e Privatësisë"
        lastUpdated={LAST_UPDATED}
      />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        <LegalSection heading="1. Hyrje">
          <p>
            HikeIt (hikeit.app) është një platformë teknologjike që lidh hikerët
            me klubet alpine në Kosovë. Kjo politikë shpjegon si i mbledhim,
            përdorim, ruajmë dhe mbrojmë të dhënat tuaja personale.
          </p>
          <p>
            Ne veprojmë si <strong className="text-summit">kontrollues i të dhënave</strong>{" "}
            në përputhje me{" "}
            <strong className="text-summit">
              Ligjin Nr. 06/L-082 për Mbrojtjen e të Dhënave Personale
            </strong>{" "}
            të Republikës së Kosovës, i cili është i barasvlershëm me GDPR-në e
            Bashkimit Evropian.
          </p>
          <p>
            Për çdo pyetje ose kërkesë:{" "}
            <LegalLink href="mailto:hello@hikeit.app">hello@hikeit.app</LegalLink>
          </p>
        </LegalSection>

        <LegalSection heading="2. Të Dhënat që Mbledhim">
          <p className="text-xs font-bold tracking-[0.15em] text-moss uppercase">
            Të dhëna që na jepni ju
          </p>
          <LegalList
            items={[
              "Emri dhe mbiemri",
              "Adresa e email-it",
              "Numri i telefonit",
              "Datëlindja",
              "Kontakti i emergjencës (emri dhe numri)",
              "Fotoja e profilit dhe biografia (opsionale)",
            ]}
          />
          <p className="text-xs font-bold tracking-[0.15em] text-moss uppercase">
            Të dhëna të udhëtimeve
          </p>
          <LegalList
            items={[
              "Regjistrimet tuaja në udhëtime dhe statusi i tyre",
              "Historiku i pagesave dhe rimbursimeve",
              "Anëtarësimet në klube",
              "Fotot dhe komentet që ngarkoni",
            ]}
          />
          <p className="text-xs font-bold tracking-[0.15em] text-moss uppercase">
            Të dhëna teknike
          </p>
          <LegalList
            items={[
              "Adresa IP dhe vendndodhja e përafërt",
              "Lloji i shfletuesit dhe i pajisjes",
              "Cookies dhe teknologji të ngjashme",
              "Sjellja në platformë: faqet e vizituara, klikimet, koha e qëndrimit",
            ]}
          />
        </LegalSection>

        <LegalSection heading="3. Pse i Mbledhim (Baza Ligjore)">
          <LegalList
            items={[
              <>
                <strong className="text-summit">
                  Ekzekutimi i kontratës
                </strong>{" "}
                — krijimi i llogarisë, regjistrimi në udhëtime, procesimi i
                pagesave, komunikimi me klubin organizator.
              </>,
              <>
                <strong className="text-summit">Interesi legjitim</strong> —
                siguria e platformës, parandalimi i mashtrimeve, përmirësimi i
                shërbimit, monitorimi i gabimeve teknike.
              </>,
              <>
                <strong className="text-summit">Konsenti juaj</strong> —
                njoftimet e marketingut dhe cookies jo-esenciale. Konsenti mund
                të tërhiqet në çdo kohë.
              </>,
              <>
                <strong className="text-summit">Detyrimi ligjor</strong> —
                ruajtja e të dhënave financiare sipas legjislacionit tatimor.
              </>,
            ]}
          />
        </LegalSection>

        <LegalSection heading="4. Me Kë i Ndajmë">
          <p>
            Ne <strong className="text-summit">nuk i shesim</strong> të dhënat
            tuaja personale. I ndajmë vetëm me përpunuesit e mëposhtëm, në masën
            e nevojshme për funksionimin e shërbimit:
          </p>
          <div className="overflow-x-auto border-2 border-forest">
            <table className="w-full min-w-[480px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-forest">
                  <th className="px-3 py-2.5 text-xs font-bold tracking-[0.1em] text-moss uppercase">
                    Shërbimi
                  </th>
                  <th className="px-3 py-2.5 text-xs font-bold tracking-[0.1em] text-moss uppercase">
                    Qëllimi
                  </th>
                  <th className="px-3 py-2.5 text-xs font-bold tracking-[0.1em] text-moss uppercase">
                    Rajoni
                  </th>
                </tr>
              </thead>
              <tbody>
                {PROCESSORS.map((p) => (
                  <tr
                    key={p.name}
                    className="border-t-2 border-forest/40 align-top"
                  >
                    <td className="px-3 py-2.5 font-bold text-summit">
                      {p.name}
                    </td>
                    <td className="px-3 py-2.5 text-summit/70">{p.purpose}</td>
                    <td className="px-3 py-2.5 text-summit/70">
                      {p.eu ? (
                        <span className="text-moss">{p.region}</span>
                      ) : (
                        p.region
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            <strong className="text-summit">Klubet organizatore:</strong> kur
            regjistroheni në një udhëtim, emri dhe email-i juaj i ndahen klubit
            organizator, në mënyrë që ai të mund t&apos;ju kontaktojë për
            çështje që lidhen me udhëtimin. Klubi është kontrollues i pavarur
            për këto të dhëna.
          </p>
        </LegalSection>

        <LegalSection heading="5. Sa Kohë i Ruajmë">
          <LegalList
            items={[
              <>
                <strong className="text-summit">Llogari aktive</strong> — gjatë
                gjithë kohëzgjatjes së llogarisë tuaj.
              </>,
              <>
                <strong className="text-summit">Pas fshirjes së llogarisë</strong>{" "}
                — 30 ditë periudhë rikthimi, pastaj fshirje e plotë.
              </>,
              <>
                <strong className="text-summit">Të dhënat e pagesave</strong> —
                5 vjet, sipas detyrimeve ligjore tatimore dhe kontabël.
              </>,
              <>
                <strong className="text-summit">Audit logs</strong> — 1 vit, për
                qëllime sigurie dhe hetimi incidentesh.
              </>,
            ]}
          />
        </LegalSection>

        <LegalSection heading="6. Të Drejtat Tuaja">
          <p>
            Sipas Ligjit Nr. 06/L-082 (LMDhP) dhe standardeve GDPR, ju gëzoni
            këto të drejta:
          </p>
          <LegalList
            items={[
              <>
                <strong className="text-summit">E drejta e aksesit</strong> —
                mund të kërkoni një kopje të të gjitha të dhënave që mbajmë për
                ju.
              </>,
              <>
                <strong className="text-summit">E drejta e korrigjimit</strong>{" "}
                — mund të korrigjoni çdo të dhënë të pasaktë ose të paplotë.
              </>,
              <>
                <strong className="text-summit">E drejta e fshirjes</strong> —
                &ldquo;e drejta për t&apos;u harruar&rdquo;; mund të kërkoni
                fshirjen e plotë të të dhënave tuaja.
              </>,
              <>
                <strong className="text-summit">
                  E drejta e kufizimit të procesimit
                </strong>{" "}
                — mund të kërkoni ndalimin e përkohshëm të përpunimit.
              </>,
              <>
                <strong className="text-summit">
                  E drejta e transportueshmërisë
                </strong>{" "}
                — mund të merrni të dhënat tuaja në format të lexueshëm nga
                makina.
              </>,
              <>
                <strong className="text-summit">
                  E drejta e kundërshtimit
                </strong>{" "}
                — mund të kundërshtoni përpunimin për marketing në çdo kohë.
              </>,
            ]}
          />
          <p>
            Për të ushtruar këto të drejta, shkruani në{" "}
            <LegalLink href="mailto:hello@hikeit.app">hello@hikeit.app</LegalLink>
            . Ne përgjigjemi brenda 30 ditëve. Llogarinë mund ta fshini edhe
            vetë në çdo kohë nga{" "}
            <Link
              href="/dashboard/profile"
              className="font-bold text-moss underline underline-offset-4 transition-colors hover:text-summit"
            >
              profili juaj
            </Link>
            .
          </p>
        </LegalSection>

        <LegalSection id="security" heading="7. Siguria">
          <p>
            Zbatojmë masa teknike dhe organizative për të mbrojtur të dhënat
            tuaja:
          </p>
          <LegalList
            items={[
              <>
                <strong className="text-summit">Enkriptim SSL/TLS</strong> për
                të gjithë trafikun mes shfletuesit tuaj dhe serverëve tanë.
              </>,
              <>
                <strong className="text-summit">Fjalëkalimet</strong> ruhen të
                hash-uara me algoritmin <code className="text-moss">scrypt</code>{" "}
                me salt — asnjëherë në tekst të thjeshtë. As ne nuk mund t&apos;i
                lexojmë.
              </>,
              <>
                <strong className="text-summit">Pagesat</strong> procesohen nga
                Stripe (PCI DSS Level 1). Ne nuk ruajmë asnjë të dhënë të kartës
                bankare në sistemet tona.
              </>,
              <>
                <strong className="text-summit">EXIF stripping</strong> — të
                dhënat e fshehura në foto, përfshirë koordinatat GPS, hiqen
                automatikisht gjatë ngarkimit.
              </>,
              <>
                <strong className="text-summit">Baza e të dhënave</strong>{" "}
                ndodhet në Supabase, Frankfurt (BE), me backup ditor.
              </>,
              <>
                <strong className="text-summit">Ngarkimi i imazheve</strong> —
                validim i tipit MIME dhe i nënshkrimit të skedarit, kufi 10MB
                dhe vetëm formate të lejuara (JPEG, PNG, WebP, HEIC).
              </>,
              <>
                <strong className="text-summit">Rate limiting</strong> në
                endpoint-et sensitive — kyçje, regjistrim, rivendosje
                fjalëkalimi dhe ngarkim imazhesh — për të parandaluar sulmet me
                forcë brutale dhe abuzimin.
              </>,
            ]}
          />
          <LegalCallout heading="Raporto një problem sigurie">
            <p>
              Nëse zbuloni një dobësi sigurie, ju lutemi na njoftoni menjëherë
              në{" "}
              <LegalLink href="mailto:hello@hikeit.app">
                hello@hikeit.app
              </LegalLink>
              . Ju kërkojmë të mos e bëni publike derisa ta kemi rregulluar.
            </p>
          </LegalCallout>
        </LegalSection>

        <LegalSection id="cookies" heading="8. Cookies">
          <p className="text-xs font-bold tracking-[0.15em] text-moss uppercase">
            Cookies esenciale — nuk kërkojnë konsent
          </p>
          <LegalList
            items={[
              "Sesioni i autentikimit (Better Auth) — ju mban të kyçur.",
              "Mbrojtja CSRF — parandalon kërkesat e falsifikuara.",
            ]}
          />
          <p>
            Këto janë të domosdoshme për funksionimin e platformës dhe nuk mund
            të çaktivizohen pa e bërë shërbimin të papërdorshëm.
          </p>
          <p className="text-xs font-bold tracking-[0.15em] text-moss uppercase">
            Cookies analitike — kërkojnë konsent
          </p>
          <LegalList
            items={[
              "PostHog — na ndihmon të kuptojmë si përdoret platforma.",
              "Vercel Analytics — matje e performancës dhe e trafikut.",
            ]}
          />
          <p>
            Këto të dhëna janë të anonimizuara dhe përdoren vetëm në formë të
            grumbulluar. Aktivizohen vetëm pasi ju jepni pëlqimin.
          </p>
          <LegalCallout heading="Asnjë cookie reklamash">
            <p>
              HikeIt <strong className="text-summit">nuk shfaq reklama</strong>{" "}
              dhe nuk përdor cookies gjurmuese për qëllime reklamimi. Nuk i
              ndajmë të dhënat tuaja me rrjete reklamash.
            </p>
          </LegalCallout>
          <p>
            <strong className="text-summit">Si t&apos;i kontrolloni:</strong>{" "}
            mund t&apos;i menaxhoni cookies nga cilësimet e shfletuesit tuaj, ose
            të na shkruani në{" "}
            <LegalLink href="mailto:hello@hikeit.app">hello@hikeit.app</LegalLink>{" "}
            për të tërhequr konsentin.
          </p>
        </LegalSection>

        <LegalSection heading="9. Ndryshimet e Politikës">
          <p>
            Kjo politikë mund të përditësohet. Për ndryshime thelbësore, ju
            njoftojmë me email të paktën{" "}
            <strong className="text-summit">30 ditë</strong> përpara hyrjes së
            tyre në fuqi.
          </p>
        </LegalSection>

        <LegalSection heading="10. Ankesa">
          <p>
            Nëse mendoni se të drejtat tuaja janë shkelur, keni të drejtë të
            paraqisni ankesë pranë autoritetit mbikëqyrës:
          </p>
          <LegalList
            items={[
              <>
                <strong className="text-summit">
                  Agjencia e Informacionit dhe Privatësisë së Kosovës (AIP)
                </strong>{" "}
                — Prishtinë, Republika e Kosovës.
              </>,
            ]}
          />
          <p>
            Gjithsesi, ju inkurajojmë të na kontaktoni fillimisht në{" "}
            <LegalLink href="mailto:hello@hikeit.app">hello@hikeit.app</LegalLink>{" "}
            — shumica e çështjeve zgjidhen shpejt dhe drejtpërdrejt.
          </p>
        </LegalSection>
      </div>
    </article>
  );
}
