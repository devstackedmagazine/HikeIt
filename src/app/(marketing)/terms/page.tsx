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
  title: "Kushtet e Shërbimit",
  description:
    "Kushtet e Shërbimit të HikeIt — platformë teknologjike ndërmjetëse që lidh hikerët me klubet alpine në Kosovë.",
  alternates: { canonical: "https://hikeit.app/terms" },
};

const LAST_UPDATED = "Tetor 2026";

export default function TermsPage() {
  return (
    <article className="bg-abyss">
      <LegalHeader
        label="Ligjore"
        title="Kushtet e Shërbimit"
        lastUpdated={LAST_UPDATED}
      />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        <LegalSection heading="1. Hyrje">
          <p>
            HikeIt është një{" "}
            <strong className="text-summit">
              platformë teknologjike ndërmjetëse
            </strong>{" "}
            që lidh hikerët me klubet alpine dhe organizatorët e pavarur në
            Kosovë. HikeIt ofron infrastrukturën dixhitale — listimin e
            udhëtimeve dhe regjistrimin e pjesëmarrësve — por{" "}
            <strong className="text-summit">
              nuk është operator turistik, agjenci udhëtimesh, guidë malore apo
              organizator aktivitetesh
            </strong>
            .
          </p>
          <p>
            HikeIt operohet nga{" "}
            <strong className="text-summit">
              Fatlum Gerxhaliu (person fizik), Kosovë
            </strong>
            . Kontakti:{" "}
            <LegalLink href="mailto:hello@hikeit.app">
              hello@hikeit.app
            </LegalLink>
            . Në këto Kushte, &ldquo;HikeIt&rdquo;, &ldquo;ne&rdquo; dhe
            &ldquo;neve&rdquo; i referohen operatorit.
          </p>
          <p>
            Këto Kushte rregullojnë përdorimin e platformës HikeIt (hikeit.app)
            nga të gjithë përdoruesit: hikerët dhe klubet organizatore.
          </p>
        </LegalSection>

        <LegalSection heading="2. Pranimi i Kushteve">
          <p>
            Duke krijuar llogari ose duke përdorur platformën, ju pranoni në
            mënyrë të plotë dhe të pakushtëzuar këto Kushte të Shërbimit dhe{" "}
            <Link
              href="/privacy"
              className="text-moss hover:text-summit font-bold underline underline-offset-4 transition-colors"
            >
              Politikën e Privatësisë
            </Link>
            . Nëse nuk pajtoheni, ju lutemi mos e përdorni platformën.
          </p>
          <LegalList
            items={[
              <>
                Mosha minimale për të krijuar llogari është{" "}
                <strong className="text-summit">18 vjeç</strong>. Personat nën
                18 vjeç nuk lejohen të regjistrohen, as me leje të prindit.
              </>,
              "Gjatë regjistrimit — me email ose me Google/Facebook — ju konfirmoni që jeni 18 vjeç ose më shumë.",
              "Nëse mësojmë se një llogari i përket një personi nën 18 vjeç, e fshijmë.",
            ]}
          />
        </LegalSection>

        <LegalSection heading="3. Llogaritë">
          <LegalList
            items={[
              "Ju detyroheni të jepni informacion të saktë, të plotë dhe të përditësuar gjatë regjistrimit.",
              "Jeni përgjegjës për ruajtjen e konfidencialitetit të fjalëkalimit tuaj dhe për çdo veprimtari që ndodh nën llogarinë tuaj.",
              "Lejohet një llogari për person. Krijimi i llogarive të shumëfishta apo i llogarive false është i ndaluar.",
              "Duhet të na njoftoni menjëherë në hello@hikeit.app për çdo përdorim të paautorizuar të llogarisë tuaj.",
              "HikeIt rezervon të drejtën të pezullojë ose fshijë llogari që shkelin këto Kushte.",
            ]}
          />
        </LegalSection>

        <LegalSection heading="4. HikeIt si Platformë Ndërmjetëse">
          <LegalCallout heading="Seksion kritik — lexoni me kujdes">
            <p>
              <strong className="text-summit">
                HikeIt nuk organizon, nuk drejton dhe nuk mbikëqyr asnjë udhëtim
                të listuar në platformë.
              </strong>
            </p>
            <LegalList
              items={[
                "Klubet dhe organizatorët janë subjekte krejtësisht të pavarura dhe mbajnë përgjegjësinë e plotë ligjore për udhëtimet që organizojnë.",
                "HikeIt nuk është operator turistik sipas legjislacionit të Republikës së Kosovës dhe nuk vepron si i tillë.",
                "HikeIt nuk ofron shërbime guidimi, transporti, akomodimi, sigurimi shëndetësor apo shpëtimi malor.",
                "Kontrata për pjesëmarrjen në udhëtim lidhet drejtpërdrejt mes hikerit dhe klubit organizator — HikeIt nuk është palë në atë kontratë.",
                "HikeIt nuk verifikon kualifikimet, licencat, certifikimet apo aftësitë e klubeve dhe udhëheqësve të tyre.",
              ]}
            />
          </LegalCallout>
        </LegalSection>

        <LegalSection heading="5. Rreziqet e Aktiviteteve të Jashtme">
          <LegalCallout heading="Paralajmërim rreziku — pranim vullnetar">
            <p>
              <strong className="text-summit">
                Alpinizmi dhe ecja malore janë aktivitete me rreziqe të
                qenësishme që nuk mund të eliminohen plotësisht.
              </strong>{" "}
              Këto përfshijnë, por nuk kufizohen në:
            </p>
            <LegalList
              items={[
                "Lëndime trupore të lehta ose të rënda, paaftësi të përhershme, ose vdekje.",
                "Ndryshime të papritura të motit, stuhi, rrufe, temperatura ekstreme, ortekë.",
                "Terren i rrezikshëm, rrëshqitje, rënie nga lartësia, rrëzime gurësh.",
                "Humbje orientimi, izolim, mungesë sinjali telefonik, vonesa në shpëtim.",
                "Kafshë të egra, insekte helmuese, bimë toksike.",
                "Sëmundje e lartësisë, dehidratim, hipotermi, goditje nga nxehtësia.",
                "Humbje ose dëmtim i pronës personale.",
              ]}
            />
            <p>
              <strong className="text-summit">
                Duke u regjistruar në një udhëtim, ju pranoni vullnetarisht dhe
                me vetëdije të plotë të gjitha këto rreziqe.
              </strong>
            </p>
            <LegalList
              items={[
                "HikeIt nuk mban asnjë përgjegjësi për lëndime, aksidente, vdekje, sëmundje apo humbje prone gjatë ose në lidhje me çdo udhëtim.",
                "Ju jeni vetë përgjegjës për vlerësimin real të aftësive tuaja fizike dhe teknike përpara regjistrimit.",
                "Ju rekomandojmë fuqishëm të siguroni sigurim personal shëndetësor dhe aksidentesh që mbulon aktivitetet malore përpara çdo udhëtimi.",
                "Ju jeni përgjegjës për pajisjet tuaja personale, gjendjen shëndetësore dhe respektimin e udhëzimeve të organizatorit.",
              ]}
            />
          </LegalCallout>
        </LegalSection>

        <LegalSection heading="6. Informacioni për Shtigjet">
          <LegalCallout heading="Vetëm informativ — verifikojeni para ecjes">
            <LegalList
              items={[
                "Informacioni për shtigjet — distanca, lartësia, ngjitja, vështirësia, kohëzgjatja, itinerari, harta dhe skedarët GPX — është vetëm informativ. Mund të jetë i pasaktë, i paplotë ose i vjetëruar.",
                "Shumë shtigje propozohen nga përdoruesit dhe statistikat llogariten automatikisht nga skedarët GPX. Ne i shqyrtojmë propozimet, por nuk e verifikojmë shtegun në terren.",
                "Kushtet në terren ndryshojnë: shtigjet mund të jenë të dëmtuara, të mbyllura ose të rrezikshme pa u pasqyruar në platformë.",
                "Ju jeni përgjegjës ta verifikoni informacionin nga burime të tjera (harta zyrtare, udhërrëfyes vendas, klubi organizator) para çdo ecjeje dhe të mos mbështeteni vetëm te HikeIt për orientim.",
              ]}
            />
          </LegalCallout>
        </LegalSection>

        <LegalSection heading="7. Njoftimet e Motit">
          <LegalCallout heading="Lehtësi, jo shërbim sigurie">
            <LegalList
              items={[
                "Njoftimet e motit për udhëtimet janë një lehtësi. Ato bazohen në parashikime automatike të palëve të treta (Open-Meteo) dhe në pragje të thjeshta.",
                "Njoftimet mund të vonohen, të jenë të gabuara ose të mos dërgohen fare — p.sh. kur udhëtimi nuk ka pikë takimi në hartë, kur parashikimi ndryshon ose kur një shërbim teknik dështon.",
                "Mungesa e një njoftimi nuk do të thotë që moti është i sigurt. Njoftimet e motit nuk janë shërbim sigurie dhe nuk zëvendësojnë parashikimet zyrtare, gjykimin tuaj apo vendimin e klubit organizator.",
              ]}
            />
          </LegalCallout>
        </LegalSection>

        <LegalSection heading="8. Pagesat">
          <LegalCallout heading="Seksion kritik — pagesat e udhëtimeve">
            <LegalList
              items={[
                <>
                  <strong className="text-summit">
                    HikeIt nuk proceson, nuk mbledh, nuk mban dhe nuk transferon
                    asnjë pagesë për udhëtime.
                  </strong>{" "}
                  Platforma nuk vepron si ndërmjetës financiar për çmimin e
                  udhëtimeve dhe nuk trajton asnjë të dhënë karte bankare apo
                  fonde të lidhura me to.
                </>,
                <>
                  Çmimi i çdo udhëtimi i shfaqur në platformë është{" "}
                  <strong className="text-summit">vetëm informativ</strong>, i
                  vendosur nga klubi organizator. Pagesa mblidhet drejtpërdrejt
                  nga klubi, sipas marrëveshjes së tij me hikerin — në para në
                  dorë, transfertë bankare, ose çdo metodë tjetër që klubi
                  zgjedh.
                </>,
                "HikeIt nuk mban asnjë komision mbi çmimin e udhëtimeve. E gjithë vlera e pagesës i takon klubit organizator.",
                <>
                  Çdo mosmarrëveshje rreth pagesës, anulimit apo rimbursimit të
                  një udhëtimi zgjidhet{" "}
                  <strong className="text-summit">
                    drejtpërdrejt mes hikerit dhe klubit organizator
                  </strong>
                  . HikeIt nuk është palë në këtë marrëdhënie financiare dhe nuk
                  ndërmjetëson, nuk garanton dhe nuk proceson rimbursime për
                  udhëtime.
                </>,
                "Klubi organizator është përgjegjës të komunikojë qartë kushtet e veta të anulimit dhe rimbursimit përpara se hikeri të regjistrohet në udhëtim.",
              ]}
            />
            <p className="text-alert text-xs font-bold tracking-[0.15em] uppercase">
              Abonimet e klubeve
            </p>
            <LegalList
              items={[
                <>
                  Kur të hapen abonimet, klubet që abonohen te planet Pro ose
                  Team do të paguajnë nëpërmjet{" "}
                  <strong className="text-summit">Paddle</strong>, i cili do të
                  veprojë si{" "}
                  <strong className="text-summit">Merchant of Record</strong>{" "}
                  për këto abonime — Paddle do ta faturojë klubin, do të mbajë
                  të dhënat e kartës bankare dhe do ta trajtojë TVSH-në sipas
                  juridiksionit të klubit.
                </>,
                "HikeIt nuk ruan asnjë të dhënë karte bankare.",
                "Abonimet nuk janë hapur ende: sot çdo klub e përdor platformën falas, brenda planit falas ose periudhës së provës. Për çdo pyetje rreth planit të klubit — dhe, kur të hapen abonimet, për faturat, metodën e pagesës ose anulimin — na shkruani në hello@hikeit.app.",
                "HikeIt nuk mban përgjegjësi për dështime teknike, vonesa apo gabime të shkaktuara nga Paddle gjatë procesimit të abonimeve.",
              ]}
            />
          </LegalCallout>
        </LegalSection>

        <LegalSection heading="9. Kufizimi i Përgjegjësisë">
          <LegalCallout heading="Seksion kritik — kufizim i përgjegjësisë">
            <p>
              Në masën maksimale të lejuar nga legjislacioni i Republikës së
              Kosovës:
            </p>
            <LegalList
              items={[
                <>
                  <strong className="text-summit">
                    Përgjegjësia totale e HikeIt ndaj jush nuk do të tejkalojë
                    shumën totale që ju keni paguar te HikeIt gjatë 12 muajve të
                    fundit
                  </strong>{" "}
                  përpara ngjarjes që shkaktoi pretendimin.
                </>,
                "HikeIt nuk mban përgjegjësi për lëndime fizike, dëme shëndetësore apo vdekje të ndodhura gjatë udhëtimeve.",
                "HikeIt nuk mban përgjegjësi për humbje financiare, humbje fitimi, humbje të dhënash apo dëme indirekte e pasuese.",
                "HikeIt nuk mban përgjegjësi për ndërprerje, vonesa apo mosdisponueshmëri të shërbimit.",
                "HikeIt nuk garanton saktësinë, plotësinë apo besueshmërinë e informacionit të publikuar nga klubet (përshkrime, çmime, vështirësi, orare, pika takimi).",
              ]}
            />
            <p>
              <strong className="text-summit">Force majeure:</strong> HikeIt nuk
              mban përgjegjësi për mospërmbushje të detyrimeve për shkak
              ngjarjesh jashtë kontrollit të arsyeshëm, përfshirë mot ekstrem,
              fatkeqësi natyrore, tërmete, zjarre, pandemi, luftë, trazira,
              vendime shtetërore, ose ndërprerje të infrastrukturës së
              internetit.
            </p>
          </LegalCallout>
        </LegalSection>

        <LegalSection heading="10. Klubet dhe Organizatorët">
          <p>
            Klubet që përdorin HikeIt për të listuar udhëtime marrin përsipër
            detyrimet e mëposhtme:
          </p>
          <LegalList
            items={[
              "Të japin informacion të saktë dhe jo mashtrues për çdo udhëtim: itinerarin, vështirësinë, çmimin, kohëzgjatjen dhe pikën e takimit.",
              "Të sigurojnë kushte të përshtatshme sigurie për pjesëmarrësit dhe të ndërpresin aktivitetin kur kushtet e bëjnë atë të rrezikshëm.",
              "Të respektojnë legjislacionin në fuqi të Republikës së Kosovës, përfshirë detyrimet tatimore dhe ato për mbrojtjen e konsumatorit.",
              "Të disponojnë licencat, lejet dhe sigurimet e nevojshme sipas natyrës së aktivitetit që organizojnë.",
              "Të trajtojnë të dhënat personale të pjesëmarrësve në përputhje me Ligjin Nr. 06/L-082.",
              "Të përcaktojnë dhe respektojnë politikën e tyre të anulimit dhe rimbursimit ndaj hikerëve, siç përshkruhet në Seksionin 8.",
            ]}
          />
          <p>
            Klubi dëmshpërblen HikeIt-in për çdo pretendim, humbje apo shpenzim
            që rrjedh nga udhëtimet që organizon ose nga shkelja e këtyre
            Kushteve.
          </p>
        </LegalSection>

        <LegalSection heading="11. Pronësia Intelektuale">
          <LegalList
            items={[
              "Platforma HikeIt, emri, logoja, dizajni dhe kodi burimor janë pronë e HikeIt dhe mbrohen nga legjislacioni për pronësinë intelektuale.",
              "Përmbajtja që ju ngarkoni (foto, përshkrime, komente) mbetet pronë juaja.",
              "Duke ngarkuar përmbajtje, ju i jepni HikeIt një licencë jo-ekskluzive, pa pagesë dhe globale për ta përdorur, shfaqur dhe shpërndarë atë brenda platformës dhe në materialet promovuese të saj.",
              "Ju garantoni se zotëroni të drejtat mbi përmbajtjen që ngarkoni dhe se ajo nuk cenon të drejtat e palëve të treta.",
              "Mund të kërkoni heqjen e përmbajtjes tuaj në çdo kohë në hello@hikeit.app — përveç shtigjeve të propozuara, për të cilat vlen Seksioni 12.",
            ]}
          />
        </LegalSection>

        <LegalSection heading="12. Propozimet e Shtigjeve">
          <LegalList
            items={[
              "Duke propozuar një shteg, ju na jepni të drejtën — jo-ekskluzive, pa pagesë, globale dhe pa afat — për të ruajtur, përpunuar dhe publikuar të dhënat e shtegut (emrin, përshkrimin, rajonin, gjurmën dhe skedarin GPX) pas miratimit, përfshirë shkarkimin e skedarit GPX nga kushdo.",
              "Para ruajtjes, nga skedari GPX hiqen kohët, të dhënat e pajisjes dhe autori; mbeten koordinatat dhe lartësia.",
              "Ju garantoni se keni të drejtë ta ndani gjurmën dhe se ajo nuk zbulon vende private (p.sh. shtëpinë tuaj).",
              "Me kërkesën tuaj në hello@hikeit.app, ose kur fshini llogarinë, heqim emrin tuaj nga shtegu. Vetë shtegu mund të mbetet i publikuar.",
              "Mund ta refuzojmë, ndryshojmë ose heqim një shteg sipas gjykimit tonë.",
            ]}
          />
        </LegalSection>

        <LegalSection heading="13. Ecjet Personale">
          <LegalList
            items={[
              "Jeni përgjegjës për skedarët GPX që ngarkoni si ecje personale dhe garantoni se ju përkasin juve.",
              "Statistikat e ecjeve — distanca, ngjitja, kohëzgjatja dhe totali i kilometrave — llogariten automatikisht dhe janë vlerësime; mund të ndryshojnë nga vlerat reale ose nga aplikacione të tjera.",
              "Ecjet janë private dhe mund t'i fshini në çdo kohë. Si i trajtojmë përshkruhet në Politikën e Privatësisë.",
            ]}
          />
        </LegalSection>

        <LegalSection heading="14. Sjellja e Përdoruesve">
          <p>Gjatë përdorimit të platformës, ndalohet:</p>
          <LegalList
            items={[
              "Dërgimi i spam-it ose i mesazheve të padëshiruara komerciale.",
              "Publikimi i informacionit të rremë, mashtrues ose i udhëtimeve që nuk ekzistojnë.",
              "Ngacmimi, kërcënimi, gjuha e urrejtjes ose sjellja abuzive ndaj përdoruesve të tjerë.",
              "Çdo veprimtari e paligjshme, përfshirë mashtrimin dhe pastrimin e parave.",
              "Tentativa për të cenuar sigurinë e platformës, aksesi i paautorizuar, scraping automatik ose mbingarkim i qëllimshëm.",
              "Imitimi i identitetit të një personi ose klubi tjetër.",
            ]}
          />
          <p>
            Shkelja e këtyre rregullave mund të sjellë pezullim ose fshirje të
            menjëhershme të llogarisë, si dhe njoftim të autoriteteve kompetente
            kur është e nevojshme.
          </p>
        </LegalSection>

        <LegalSection heading="15. Ndryshimet e Kushteve">
          <p>
            HikeIt mund t&apos;i ndryshojë këto Kushte në çdo kohë. Për
            ndryshime thelbësore, ju njoftojmë me email dhe/ose me njoftim në
            platformë të paktën <strong className="text-summit">30 ditë</strong>{" "}
            përpara hyrjes në fuqi. Vazhdimi i përdorimit të platformës pas
            kësaj date konsiderohet pranim i kushteve të reja.
          </p>
        </LegalSection>

        <LegalSection heading="16. Ligji i Aplikueshëm dhe Juridiksioni">
          <p>
            Këto Kushte rregullohen nga legjislacioni i{" "}
            <strong className="text-summit">Republikës së Kosovës</strong>.
          </p>
          <p>
            Për çdo mosmarrëveshje, palët angazhohen të kërkojnë fillimisht
            zgjidhje me mirëkuptim. Në pamundësi, mosmarrëveshja zgjidhet nga
            gjykatat kompetente të{" "}
            <strong className="text-summit">Prishtinës</strong>.
          </p>
          <p>
            Nëse ndonjë dispozitë e këtyre Kushteve shpallet e pavlefshme,
            dispozitat e mbetura mbeten plotësisht në fuqi.
          </p>
        </LegalSection>

        <LegalSection heading="17. Kontakti">
          <p>
            Për çdo pyetje në lidhje me këto Kushte të Shërbimit, na shkruani në{" "}
            <LegalLink href="mailto:hello@hikeit.app">
              hello@hikeit.app
            </LegalLink>
            .
          </p>
        </LegalSection>
      </div>
    </article>
  );
}
