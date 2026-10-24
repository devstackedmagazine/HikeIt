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

const LAST_UPDATED = "Tetor 2026";

const LINK_CLASS =
  "text-moss hover:text-summit font-bold underline underline-offset-4 transition-colors";

/** Third parties that receive personal data, with where they process it. */
const PROCESSORS: {
  name: string;
  purpose: string;
  region: string;
  eu: boolean;
}[] = [
  {
    name: "Supabase",
    purpose: "Baza e të dhënave dhe ruajtja e skedarëve GPX të shtigjeve",
    region: "Frankfurt, BE",
    eu: true,
  },
  {
    name: "Vercel",
    purpose:
      "Hosting i aplikacionit dhe analitika e vizitave pa cookies (Vercel Analytics)",
    region:
      "Frankfurt, BE (serverët e aplikacionit); skedarët statikë shpërndahen nga rrjeti global i Vercel",
    eu: true,
  },
  {
    name: "Cloudinary",
    purpose: "Ruajtja dhe shpërndarja e fotove",
    region: "SHBA — me masa mbrojtëse adekuate",
    eu: false,
  },
  {
    name: "Resend",
    purpose:
      "Dërgimi i email-eve (verifikim, rivendosje fjalëkalimi, njoftime)",
    region: "Irlandë, BE",
    eu: true,
  },
  {
    name: "Sentry",
    purpose: "Monitorimi i gabimeve teknike",
    region: "Gjermani, BE",
    eu: true,
  },
  {
    name: "Google",
    purpose:
      "Kyçja me Google, nëse e zgjidhni — merr kërkesën për kyçje dhe na dërgon emrin, email-in dhe foton e profilit",
    region: "SHBA — me masa mbrojtëse adekuate",
    eu: false,
  },
  {
    name: "Meta (Facebook)",
    purpose:
      "Kyçja me Facebook, nëse e zgjidhni — merr kërkesën për kyçje dhe na dërgon emrin, email-in dhe foton e profilit",
    region: "Irlandë (BE) dhe SHBA — me masa mbrojtëse adekuate",
    eu: false,
  },
  {
    name: "Thunderforest",
    purpose:
      "Pllakat e hartave — shfletuesi juaj i shkarkon drejtpërdrejt prej tyre, prandaj marrin adresën tuaj IP dhe zonën e hartës që shikoni",
    region: "Mbretëria e Bashkuar — me masa mbrojtëse adekuate",
    eu: false,
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
            <strong className="text-summit">Kontrolluesi i të dhënave</strong>{" "}
            është{" "}
            <strong className="text-summit">
              Fatlum Gerxhaliu (person fizik), Kosovë
            </strong>
            , që operon HikeIt. Të dhënat i përpunojmë në përputhje me{" "}
            <strong className="text-summit">
              Ligjin Nr. 06/L-082 për Mbrojtjen e të Dhënave Personale
            </strong>{" "}
            të Republikës së Kosovës, i cili bazohet në GDPR-në e Bashkimit
            Evropian.
          </p>
          <p>
            Për çdo pyetje ose kërkesë:{" "}
            <LegalLink href="mailto:hello@hikeit.app">
              hello@hikeit.app
            </LegalLink>
          </p>
        </LegalSection>

        <LegalSection heading="2. Të Dhënat që Mbledhim">
          <p className="text-moss text-xs font-bold tracking-[0.15em] uppercase">
            Të dhëna që na jepni ju
          </p>
          <LegalList
            items={[
              "Emri dhe mbiemri",
              "Adresa e email-it",
              "Konfirmimi që jeni 18 vjeç ose më shumë, gjatë regjistrimit",
              "Opsionale: numri i telefonit, datëlindja, kontakti i emergjencës (emri dhe numri), fotoja e profilit dhe biografia",
            ]}
          />
          <p>
            Nëse kyçeni me Google ose Facebook, ofruesi na dërgon emrin,
            email-in dhe foton tuaj të profilit.
          </p>
          <p className="text-moss text-xs font-bold tracking-[0.15em] uppercase">
            Të dhëna të aktivitetit
          </p>
          <LegalList
            items={[
              "Regjistrimet tuaja në udhëtime dhe statusi i tyre",
              "Anëtarësimet në klube",
              "Fotot që ngarkoni në udhëtime dhe shtigje",
              "Vlerësimet dhe komentet për shtigjet",
              "Shtigjet e preferuara dhe udhëtimet e ruajtura",
              "Preferencat (gjuha, ndjeshmëria e njoftimeve të motit)",
            ]}
          />
          <p className="text-moss text-xs font-bold tracking-[0.15em] uppercase">
            Propozimet e shtigjeve
          </p>
          <p>
            Kur propozoni një shteg, ruajmë emrin, përshkrimin, rajonin dhe
            skedarin GPX që bashkëngjitni, si dhe faktin që propozimi është
            juaji. Pas miratimit,{" "}
            <strong className="text-summit">
              shtegu dhe skedari GPX bëhen publikë
            </strong>{" "}
            dhe çdokush mund ta shkarkojë skedarin. Para ruajtjes, nga skedari
            hiqen të gjitha kohët (
            <code className="text-moss">&lt;time&gt;</code>
            ), të dhënat e pajisjes dhe të sensorëve (
            <code className="text-moss">&lt;extensions&gt;</code>), si dhe
            autori, pajisja dhe emri te{" "}
            <code className="text-moss">&lt;metadata&gt;</code>. Mbeten vetëm
            koordinatat dhe lartësia e pikave — përfshirë pikën e saktë të
            nisjes dhe të mbërritjes.
          </p>
          <p className="text-moss text-xs font-bold tracking-[0.15em] uppercase">
            Gjurmët e ecjeve personale
          </p>
          <p>
            Kur ngarkoni një skedar GPX të një ecjeje, ne e lexojmë atë vetëm
            për të llogaritur distancën, ngjitjen, kohëzgjatjen dhe datën e
            ecjes, si dhe një vijë të thjeshtuar të gjurmës për ta shfaqur në
            hartë.{" "}
            <strong className="text-summit">Vetë skedari GPX nuk ruhet</strong>{" "}
            — hidhet menjëherë pas llogaritjes. Ruajmë vetëm statistikat dhe
            vijën në hartë, e cila është e dhënë vendndodhjeje dhe prandaj e
            dhënë personale. I përpunojmë sepse ju zgjidhni t&apos;i ngarkoni,
            për t&apos;ju shfaqur ecjet dhe totalin e kilometrave.
          </p>
          <p>
            Ecjet janë private: askush tjetër — as klubet — nuk i sheh. Rreth
            200 metrat e parë dhe të fundit të gjurmës nuk ruhen. Kjo e
            zvogëlon, por nuk e eliminon, mundësinë që pika e nisjes (p.sh.
            shtëpia juaj) të dallohet — veçanërisht te ecjet rrethore ose kur
            nisni pak qindra metra larg shtëpisë.
          </p>
          <p>
            Kur fshini një ecje, ajo fshihet menjëherë dhe përgjithmonë. Kur
            fshini llogarinë, të gjitha ecjet tuaja fshihen menjëherë.
          </p>
          <p className="text-moss text-xs font-bold tracking-[0.15em] uppercase">
            Të dhëna teknike
          </p>
          <LegalList
            items={[
              "Adresa IP — për kufizimin e kërkesave (kyçje, regjistrim, ngarkime) dhe në regjistrat e sigurisë; Vercel Analytics e përdor për të nxjerrë shtetin, pa e ruajtur",
              "Lloji i shfletuesit dhe i pajisjes",
              "Faqet e vizituara, në formë të grumbulluar dhe pa identifikues të qëndrueshëm (Vercel Analytics)",
              "Gabimet teknike: mesazhi i gabimit, faqja dhe shfletuesi (Sentry)",
            ]}
          />
        </LegalSection>

        <LegalSection heading="3. Pse i Mbledhim (Baza Ligjore)">
          <LegalList
            items={[
              <>
                <strong className="text-summit">Ekzekutimi i kontratës</strong>{" "}
                — krijimi i llogarisë, regjistrimi në udhëtime, anëtarësimi në
                klube, propozimi i shtigjeve, komunikimi me klubin organizator
                dhe njoftimet që lidhen me udhëtimet tuaja.
              </>,
              <>
                <strong className="text-summit">Interesi legjitim</strong> —
                siguria e platformës, parandalimi i abuzimit, monitorimi i
                gabimeve teknike dhe statistikat e grumbulluara të vizitave.
              </>,
              <>
                <strong className="text-summit">Pëlqimi juaj</strong> — të
                dhënat opsionale të profilit dhe ecjet personale që zgjidhni
                t&apos;i ngarkoni. Mund ta tërhiqni duke i fshirë ato në çdo
                kohë.
              </>,
              <>
                <strong className="text-summit">Detyrimi ligjor</strong> — kur
                ligji na detyron të ruajmë ose të japim të dhëna.
              </>,
            ]}
          />
        </LegalSection>

        <LegalSection heading="4. Me Kë i Ndajmë">
          <p>
            Ne <strong className="text-summit">nuk i shesim</strong> të dhënat
            tuaja personale dhe nuk i ndajmë me rrjete reklamash. I ndajmë vetëm
            me palët e mëposhtme, në masën e nevojshme për funksionimin e
            shërbimit:
          </p>
          <div className="border-forest overflow-x-auto border-2">
            <table className="w-full min-w-[480px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-forest">
                  <th className="text-sage px-3 py-2.5 text-xs font-bold tracking-[0.1em] uppercase">
                    Shërbimi
                  </th>
                  <th className="text-sage px-3 py-2.5 text-xs font-bold tracking-[0.1em] uppercase">
                    Qëllimi
                  </th>
                  <th className="text-sage px-3 py-2.5 text-xs font-bold tracking-[0.1em] uppercase">
                    Rajoni
                  </th>
                </tr>
              </thead>
              <tbody>
                {PROCESSORS.map((p) => (
                  <tr
                    key={p.name}
                    className="border-forest/40 border-t-2 align-top"
                  >
                    <td className="text-summit px-3 py-2.5 font-bold">
                      {p.name}
                    </td>
                    <td className="text-summit/70 px-3 py-2.5">{p.purpose}</td>
                    <td className="text-summit/70 px-3 py-2.5">
                      {p.eu ? (
                        <span className="text-sage">{p.region}</span>
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
            Parashikimi i motit vjen nga{" "}
            <strong className="text-summit">Open-Meteo</strong>. Serveri ynë u
            dërgon vetëm koordinatat e pikës së takimit ose të shtegut — asnjë
            të dhënë për ju.
          </p>
          <p>
            Abonimet e klubeve nuk janë hapur ende, prandaj{" "}
            <strong className="text-summit">Paddle</strong> sot nuk merr asnjë
            të dhënë. Kur të hapen, do ta shtojmë në këtë listë.
          </p>
          <p>
            <strong className="text-summit">Klubet organizatore:</strong> kur
            regjistroheni në një udhëtim ose bëheni anëtar i një klubi,
            administratorët e klubit shohin{" "}
            <strong className="text-summit">
              emrin, email-in dhe foton tuaj të profilit
            </strong>
            , si dhe statusin dhe datën e regjistrimit dhe nëse jeni regjistruar
            sërish pas një anulimi (ose rolin dhe datën e anëtarësimit). Ata nuk
            shohin datëlindjen apo ecjet tuaja personale. Klubi është
            kontrollues i pavarur për të dhënat që merr.
          </p>
          <p>
            <strong className="text-summit">
              Telefoni dhe kontakti i emergjencës:
            </strong>{" "}
            nëse i keni plotësuar në profil dhe regjistrimi juaj në një udhëtim
            është konfirmuar (edhe pasi klubi shënon pjesëmarrjen), organizatorët dhe administratorët e klubit që e
            organizon udhëtimin i shohin, edhe në eksportin CSV, vetëm nga 3
            ditë para fillimit të udhëtimit deri 2 ditë pas përfundimit të tij,
            për sigurinë tuaj ditën e ecjes. Për regjistrimet në pritje ose të
            anuluara, dhe jashtë kësaj periudhe, nuk i shohin. Një skedar CSV i
            shkarkuar brenda periudhës mbetet te klubi.
          </p>
          <p>
            <strong className="text-summit">Përmbajtja publike:</strong> fotot
            që ngarkoni në udhëtime dhe shtigje, si dhe vlerësimet e shtigjeve,
            shfaqen publikisht me emrin tuaj (dhe foton e profilit te
            vlerësimet).
          </p>
        </LegalSection>

        <LegalSection heading="5. Sa Kohë i Ruajmë">
          <LegalList
            items={[
              <>
                <strong className="text-summit">Llogari aktive</strong> — gjatë
                gjithë kohëzgjatjes së llogarisë suaj.
              </>,
              <>
                <strong className="text-summit">
                  Pas fshirjes së llogarisë
                </strong>{" "}
                — fshirja është{" "}
                <strong className="text-summit">
                  e menjëhershme dhe e përhershme
                </strong>
                , pa periudhë rikthimi. Fshihen: emri, email-i, telefoni,
                datëlindja, kontakti i emergjencës, fotoja e profilit,
                biografia, preferencat, mënyrat e kyçjes dhe seancat, ecjet
                personale, fotot që keni ngarkuar (edhe skedarët te Cloudinary,
                përveç kur i njëjti skedar përdoret ende diku tjetër, p.sh. si
                kopertinë e një udhëtimi ose logo e një klubi), shtigjet e
                preferuara dhe njoftimet. Regjistrimet në udhëtime që
                s&apos;kanë filluar anulohen dhe anëtarësimet në klube
                përfundojnë.
              </>,
              <>
                <strong className="text-summit">
                  Çfarë mbetet pa emrin tuaj
                </strong>{" "}
                — regjistrimet në udhëtimet e kaluara, vlerësimet e shtigjeve
                dhe shtigjet që keni propozuar mbeten në platformë, të lidhura
                me një llogari anonime &ldquo;Përdorues i fshirë&rdquo;.
              </>,
              <>
                <strong className="text-summit">Ecjet personale</strong> — deri
                sa t&apos;i fshini. Fshihen menjëherë kur fshini ecjen ose
                llogarinë, pa periudhë rikthimi.
              </>,
              <>
                <strong className="text-summit">Regjistrat e sigurisë</strong>{" "}
                (audit logs) — veprimet e rëndësishme (p.sh. regjistrimet,
                ngarkimet, ndryshimet e udhëtimeve), disa me adresën IP. Nuk
                fshihen automatikisht; i ruajmë për siguri dhe hetim
                incidentesh. Pas fshirjes së llogarisë mbeten të lidhura vetëm
                me llogarinë anonime.
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
                &ldquo;e drejta për t&apos;u harruar&rdquo;; shihni seksionin 7.
              </>,
              <>
                <strong className="text-summit">
                  E drejta e kufizimit të përpunimit
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
                — mund të kundërshtoni përpunimin që bazohet në interesin tonë
                legjitim.
              </>,
            ]}
          />
          <p>
            Për të ushtruar këto të drejta, shkruani në{" "}
            <LegalLink href="mailto:hello@hikeit.app">
              hello@hikeit.app
            </LegalLink>
            . Ne përgjigjemi brenda 30 ditëve.
          </p>
        </LegalSection>

        <LegalSection id="data-deletion" heading="7. Fshirja e të dhënave">
          <p>
            Llogarinë dhe të dhënat tuaja mund t&apos;i fshini vetë, në çdo
            kohë:
          </p>
          <LegalList
            items={[
              "Kyçuni në llogarinë tuaj HikeIt.",
              <>
                Hapni{" "}
                <Link href="/dashboard/profile" className={LINK_CLASS}>
                  Profili
                </Link>
                .
              </>,
              <>
                Shtypni <strong className="text-summit">Fshi llogarinë</strong>{" "}
                dhe konfirmoni fshirjen.
              </>,
            ]}
          />
          <p>
            Fshirja ndodh menjëherë dhe nuk mund të kthehet mbrapsht — nuk ka
            periudhë rikthimi. Pas saj nuk mund të kyçeni më në atë llogari; me
            të njëjtin email mund të krijoni një llogari të re.
          </p>
          <p>
            Nëse jeni administratori i vetëm i një klubi, fillimisht caktoni një
            administrator tjetër ose fshini klubin — një klub nuk mbetet kurrë
            pa administrator.
          </p>
          <p>
            Nëse nuk mund të kyçeni ose preferoni që fshirjen ta bëjmë ne, na
            shkruani nga adresa e email-it e llogarisë suaj në{" "}
            <LegalLink href="mailto:hello@hikeit.app">
              hello@hikeit.app
            </LegalLink>{" "}
            dhe kërkoni fshirjen e të dhënave. Çfarë fshihet dhe çfarë mbetet pa
            emrin tuaj përshkruhet te seksioni 5.
          </p>
        </LegalSection>

        <LegalSection id="security" heading="8. Siguria">
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
                hash-uara me algoritmin{" "}
                <code className="text-moss">scrypt</code> me salt — asnjëherë në
                tekst të thjeshtë. As ne nuk mund t&apos;i lexojmë.
              </>,
              <>
                <strong className="text-summit">Pagesat</strong> — HikeIt nuk
                proceson pagesa për udhëtime; ato bëhen drejtpërdrejt mes klubit
                dhe hikerit, jashtë platformës. Abonimet e klubeve nuk janë
                hapur ende. Ne nuk ruajmë asnjë të dhënë karte bankare.
              </>,
              <>
                <strong className="text-summit">
                  Heqja e metadatave nga fotot
                </strong>{" "}
                — para se një foto të ruhet, serveri ynë heq të dhënat e
                fshehura EXIF, XMP dhe IPTC, përfshirë koordinatat GPS, modelin
                e pajisjes dhe datën e fotografimit. Ruhet vetëm orientimi, që
                fotoja të shfaqet drejt. Fotot HEIC/HEIF konvertohen në JPEG
                gjatë ngarkimit, pa metadatat origjinale.
              </>,
              <>
                <strong className="text-summit">Baza e të dhënave</strong>{" "}
                ndodhet në Supabase, Frankfurt (BE).
              </>,
              <>
                <strong className="text-summit">Ngarkimi i fotove</strong> —
                pranohen vetëm JPEG, PNG, WebP dhe HEIC/HEIF, me validim të
                tipit MIME dhe të nënshkrimit të skedarit. Fotot zvogëlohen
                automatikisht në shfletues (deri në 2048 px) dhe çdo foto duhet
                të jetë deri në 4 MB pas zvogëlimit.
              </>,
              <>
                <strong className="text-summit">Rate limiting</strong> në
                endpoint-et sensitive — kyçje, regjistrim, rivendosje
                fjalëkalimi, ngarkim fotosh dhe propozim shtigjesh — për të
                parandaluar sulmet me forcë brutale dhe abuzimin.
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

        <LegalSection id="cookies" heading="9. Cookies">
          <p className="text-moss text-xs font-bold tracking-[0.15em] uppercase">
            Vetëm cookies të domosdoshme
          </p>
          <LegalList
            items={[
              "Sesioni i kyçjes (Better Auth) — ju mban të kyçur deri në 7 ditë dhe fshihet kur dilni nga llogaria.",
              "Cookies të përkohshme gjatë kyçjes me Google ose Facebook — mbrojnë procesin e kyçjes dhe skadojnë brenda pak minutash.",
            ]}
          />
          <p>
            Këto janë të domosdoshme për funksionimin e platformës, prandaj nuk
            kërkojnë pëlqim.
          </p>
          <LegalCallout heading="Asnjë cookie analitike ose reklamash">
            <p>
              HikeIt <strong className="text-summit">nuk shfaq reklama</strong>{" "}
              dhe nuk përdor cookies analitike, gjurmuese apo reklamash. Vercel
              Analytics, që përdorim për statistikat e vizitave, nuk vendos
              cookies dhe nuk ju njeh nga një ditë në tjetrën.
            </p>
          </LegalCallout>
          <p>
            <strong className="text-summit">
              Ruajtja tjetër në shfletues:
            </strong>{" "}
            shfletuesi juaj mban në{" "}
            <code className="text-moss">localStorage</code> nëse e keni mbyllur
            njoftimin për cookies dhe ftesën për të instaluar aplikacionin. Kjo
            nuk është cookie dhe nuk përdoret për analitikë apo reklama.
          </p>
          <p>
            Cookies mund t&apos;i fshini ose bllokoni nga cilësimet e
            shfletuesit; pa cookie-n e sesionit nuk mund të kyçeni.
          </p>
        </LegalSection>

        <LegalSection heading="10. Ndryshimet e Politikës">
          <p>
            Kjo politikë mund të përditësohet. Ndryshimet që i kufizojnë të
            drejtat tuaja ju njoftohen me email dhe hyjnë në fuqi{" "}
            <strong className="text-summit">
              të paktën 30 ditë pas njoftimit
            </strong>
            .
          </p>
          <p>
            Përditësimet e tjera hyjnë në fuqi në momentin e publikimit. Data e
            përditësimit të fundit shfaqet në krye të kësaj faqeje.
          </p>
        </LegalSection>

        <LegalSection heading="11. Ankesa">
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
            <LegalLink href="mailto:hello@hikeit.app">
              hello@hikeit.app
            </LegalLink>{" "}
            — shumica e çështjeve zgjidhen shpejt dhe drejtpërdrejt.
          </p>
        </LegalSection>
      </div>
    </article>
  );
}
