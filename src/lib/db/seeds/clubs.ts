import type { NewOrganization, Trip } from "../schema";

export const clubSeeds: NewOrganization[] = [
  {
    slug: "kosovo-hiking-club",
    name: "Kosovo Hiking Club",
    description:
      "Klubi më i madh i alpinizmit në Kosovë, aktiv që nga 2010. Organizojmë udhëtime për të gjitha nivelet.",
    city: "Prishtinë",
    foundedYear: 2010,
    instagram: "kosovohikingclub",
    facebook: "https://facebook.com/kosovohikingclub",
    subscriptionTier: "pro",
  },
  {
    slug: "alpinistet-e-pejes",
    name: "Alpinistët e Pejës",
    description:
      "Klubi i alpinizmit bazuar në Pejë, specializuar në Alpet Shqiptare dhe Bjeshkët e Namuna.",
    city: "Pejë",
    foundedYear: 2015,
    instagram: "alpinistetpejes",
    subscriptionTier: "pro",
  },
  {
    slug: "sharri-outdoor",
    name: "Sharri Outdoor",
    description:
      "Aventura alpine në malin Sharr. Organizojmë udhëtime çdo fundjavë.",
    city: "Prizren",
    foundedYear: 2018,
    instagram: "sharrioutdoor",
    subscriptionTier: "free",
  },
  // Clubs from the redesigned clubs-listing design.
  {
    slug: "sharri",
    name: "Sharri",
    description:
      "Klubi më i vjetër i kryeqytetit me fokus në eksplorimin e maleve të Sharrit dhe rajoneve përreth.",
    city: "Prishtinë",
    foundedYear: 2012,
    subscriptionTier: "pro",
  },
  {
    slug: "alpin-kosova",
    name: "Alpin Kosova",
    description:
      "Specialistët e ngjitjes teknike dhe ekspeditave të larta në Bjeshkët e Namuna.",
    city: "Pejë",
    foundedYear: 2015,
    subscriptionTier: "pro",
  },
  {
    slug: "pashtriku",
    name: "Pashtriku",
    description:
      "Komuniteti i Prizrenit që bashkon natyrën me trashëgiminë kulturore në çdo ecje.",
    city: "Prizren",
    foundedYear: 2010,
    subscriptionTier: "pro",
  },
  {
    slug: "gjeravica",
    name: "Gjeravica",
    description:
      "Klub dinamik me fokus në sportet malore dhe mbrojtjen e mjedisit në rajonin e Gjakovës.",
    city: "Gjakovë",
    foundedYear: 2018,
    subscriptionTier: "free",
  },
  {
    slug: "karradaku",
    name: "Karradaku",
    description:
      "Eksploruesit e maleve të Karradakut, të njohur për mikpritjen dhe udhëtimet e organizuara mirë.",
    city: "Gjilan",
    foundedYear: 2014,
    subscriptionTier: "free",
  },
  {
    slug: "shala-e-bajgores",
    name: "Shala e Bajgorës",
    description:
      "Promovimi i bukurisë së Shalës dhe zhvillimi i turizmit aktiv në veriun e Kosovës.",
    city: "Mitrovicë",
    foundedYear: 2020,
    subscriptionTier: "free",
  },
];

export interface TripSeed {
  slug: string;
  clubSlug: string;
  trailSlug: string;
  title: string;
  description: string;
  daysFromNow: number;
  priceEur: string;
  maxParticipants: number | null;
  meetingPoint: string;
  difficulty: Trip["difficulty"];
}

export const tripSeeds: TripSeed[] = [
  {
    slug: "ngjitje-gjeravica-korrik",
    clubSlug: "kosovo-hiking-club",
    trailSlug: "maja-e-gjeravices",
    title: "Ngjitje te Maja e Gjeravicës",
    description:
      "Ngjitja drejt pikut më të lartë të Kosovës. Për hikerë me përvojë.",
    daysFromNow: 4,
    priceEur: "25",
    maxParticipants: 15,
    meetingPoint: "Parkimi i Rugovës, ora 06:00",
    difficulty: "expert",
  },
  {
    slug: "shetitje-germia-fundjave",
    clubSlug: "kosovo-hiking-club",
    trailSlug: "germia-park-prishtina",
    title: "Shëtitje familjare në Gërmi",
    description: "Shëtitje e lehtë në parkun e Gërmisë, ideale për fillestarë.",
    daysFromNow: 1,
    priceEur: "0",
    maxParticipants: 30,
    meetingPoint: "Hyrja kryesore e Gërmisë, ora 09:00",
    difficulty: "easy",
  },
  {
    slug: "kanioni-rugoves-eksplorim",
    clubSlug: "alpinistet-e-pejes",
    trailSlug: "kanioni-i-rugovës",
    title: "Eksplorim i Kanionit të Rugovës",
    description: "Ditë e plotë në kanionin më spektakolar të Ballkanit.",
    daysFromNow: 3,
    priceEur: "15",
    maxParticipants: 20,
    meetingPoint: "Qendra e Pejës, ora 07:30",
    difficulty: "moderate",
  },
  {
    slug: "laku-i-zi-aventure",
    clubSlug: "alpinistet-e-pejes",
    trailSlug: "bjeshket-e-nemuna-loop",
    title: "Aventurë te Laku i Zi",
    description: "Unazë alpine kërkuese nëpër Bjeshkët e Nemuna.",
    daysFromNow: 4,
    priceEur: "35",
    maxParticipants: 12,
    meetingPoint: "Parkimi i Bogës, ora 06:30",
    difficulty: "hard",
  },
  {
    slug: "sharri-brezovica-fundjave",
    clubSlug: "sharri-outdoor",
    trailSlug: "sharri-brezovica",
    title: "Fundjavë në Sharr — Brezovicë",
    description: "Shtigje alpine me pamje mbi Brezovicën.",
    daysFromNow: 2,
    priceEur: "10",
    maxParticipants: 25,
    meetingPoint: "Qendra e Prizrenit, ora 08:00",
    difficulty: "easy",
  },
  {
    slug: "via-ferrata-ari-rugove",
    clubSlug: "alpinistet-e-pejes",
    trailSlug: "kanioni-i-rugovës",
    title: "Via Ferrata — Ari",
    description:
      "Aventurë vertikale në kanionin e Rugovës me kabllo dhe shkallë çeliku.",
    daysFromNow: 6,
    priceEur: "30",
    maxParticipants: 8,
    meetingPoint: "Hyrja e Via Ferratës, ora 08:00",
    difficulty: "expert",
  },
];
