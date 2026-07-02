import type { NewOrganization } from "../schema";

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
  },
];
