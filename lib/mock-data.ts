import { addDays, subDays } from "date-fns";

export type Role = "ARTIST" | "BOOKER" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
export type KYCStatus = "PENDING" | "APPROVED" | "REJECTED";
export type BookingType = "ENQUIRY" | "QUICK_BOOKING";
export type EscrowStatus =
  | "NOT_INITIATED"
  | "HELD"
  | "RELEASING"
  | "RELEASED"
  | "REFUNDED"
  | "DISPUTED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type BookerType = "INDIVIDUAL" | "CORPORATE" | "PLANNER" | "AGENCY";
export type BookingStatus =
  | "ENQUIRY_SENT"
  | "ENQUIRY_VIEWED"
  | "QUOTE_RECEIVED"
  | "QUOTE_ACCEPTED"
  | "AWAITING_PAYMENT"
  | "PAYMENT_HELD"
  | "EVENT_UPCOMING"
  | "EVENT_COMPLETED"
  | "PAYOUT_PROCESSING"
  | "PAYOUT_RELEASED"
  | "CANCELLED_BY_BOOKER"
  | "CANCELLED_BY_ARTIST"
  | "DISPUTED"
  | "RESOLVED";

export type ServiceMenuItem = readonly [string, string, string];
export type ArtistMenuItem = readonly [
  string,
  string,
  "Guitar" | "Drum" | "Mic2" | "Music2" | "Laugh" | "Sparkles" | "Clapperboard" | "PartyPopper" | "Ticket",
];

export interface UserRecord {
  id: string;
  phone: string;
  email?: string;
  role: Role | null;
  status: UserStatus;
  name: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface ArtistPackage {
  title: string;
  description: string;
  price: number;
}

export interface ArtistRecord {
  id: string;
  userId?: string;
  legalName: string;
  stageName: string;
  city: string;
  state: string;
  serviceableStates: string[];
  category: string;
  subcategory: string[];
  genres: string[];
  languages: string[];
  performanceTypes: string[];
  yearsExperience: number;
  bio: string;
  notableClients: string;
  portfolioPhotos: string[];
  portfolioVideos: string[];
  audioSamples: string[];
  profilePhoto: string;
  coverPhoto: string;
  basePriceSolo: number;
  basePriceBand?: number;
  basePriceDJ?: number;
  travelIncluded: "YES" | "NO" | "NEGOTIABLE";
  accommodationNeeded: boolean;
  minAdvanceBooking: number;
  blackoutDates: string[];
  availableWeekdays: boolean;
  availableWeekends: boolean;
  isAvailable: boolean;
  aadhaarNumber?: string;
  panNumber?: string;
  gstNumber?: string;
  bankAccountNumber?: string;
  bankIFSC?: string;
  bankAccountName?: string;
  stripeAccountId?: string;
  razorpayAccountId?: string;
  kycStatus: KYCStatus;
  onboardingStep: number;
  rating: number;
  totalBookings: number;
  termsAcceptedAt?: string;
  featuredTag: string;
  tagline: string;
  packages: ArtistPackage[];
  socials: {
    instagramUrl?: string;
    youtubeUrl?: string;
    spotifyUrl?: string;
    facebookUrl?: string;
    websiteUrl?: string;
  };
  mediaVault: {
    label: string;
    description: string;
    status: string;
    href?: string;
  }[];
}

export interface BookerRecord {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  companyName?: string;
  bookerType: BookerType;
  city?: string;
  state?: string;
  kycVerified: boolean;
  termsAcceptedAt?: string;
  howHeard?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  bookingId: string;
  amount: number;
  platformFee: number;
  gstAmount: number;
  artistPayout: number;
  status: PaymentStatus;
  paidAt?: string;
  releasedAt?: string;
  refundedAt?: string;
  refundAmount?: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  stripePaymentIntentId?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  from: "ARTIST" | "BOOKER" | "SYSTEM";
  body: string;
  createdAt: string;
}

export interface BookingRecord {
  id: string;
  bookerId: string;
  artistId: string;
  bookingType: BookingType;
  status: BookingStatus;
  eventName: string;
  eventType: string;
  eventDate: string;
  isFlexibleDate: boolean;
  alternateDates: string[];
  eventStartTime?: string;
  eventEndTime?: string;
  venueType?: string;
  venueName?: string;
  venueAddress?: string;
  eventCity: string;
  eventState?: string;
  audienceSize: number;
  duration: number;
  performanceType?: string;
  languagePref: string[];
  specialRequests?: string;
  soundAvailable: boolean;
  lightAvailable: boolean;
  travelArranged: boolean;
  accomProvided: boolean;
  budgetMin?: number;
  budgetMax?: number;
  contactPerson?: string;
  contactPhone?: string;
  responseUrgency?: string;
  moodboardUrl?: string;
  quotedPrice?: number;
  totalAmount?: number;
  platformFee?: number;
  gstAmount?: number;
  artistPayout?: number;
  escrowStatus: EscrowStatus;
  contractUrl?: string;
  paymentId?: string;
  disputeReason?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  quickBookPackage?: string;
  chat: ChatMessage[];
}

export interface ReviewRecord {
  id: string;
  bookingId: string;
  fromId: string;
  toId: string;
  rating: number;
  comment: string;
  eventType?: string;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface SavedArtistRecord {
  id: string;
  bookerId: string;
  artistId: string;
  savedAt: string;
}

export interface CartRecord {
  bookerId: string;
  artistIds: string[];
  occasion?: string;
  city?: string;
  updatedAt: string;
}

export interface OTPRequestRecord {
  phone: string;
  otp: string;
  expiresAt: string;
  verifiedAt?: string;
}

export interface OnboardingDraftRecord {
  phone: string;
  role: "ARTIST" | "BOOKER";
  step: number;
  data: Record<string, unknown>;
  updatedAt: string;
}

export interface MockDatabase {
  users: UserRecord[];
  artists: ArtistRecord[];
  bookers: BookerRecord[];
  bookings: BookingRecord[];
  payments: PaymentRecord[];
  reviews: ReviewRecord[];
  notifications: NotificationRecord[];
  savedArtists: SavedArtistRecord[];
  carts: CartRecord[];
  otpRequests: OTPRequestRecord[];
  onboardingDrafts: OnboardingDraftRecord[];
}

export const gradientClass =
  "bg-[linear-gradient(135deg,#a53eff,#ff44b7,#ffb13e)]";

export const occasions = [
  ["House Party", "private"],
  ["Birthday", "private"],
  ["Wedding", "weddings"],
  ["Destination Wedding", "weddings"],
  ["Corporate Event", "corporate"],
  ["Club Night", "clubs"],
  ["College Fest", "college"],
  ["Hotel / Resort Event", "hotels"],
] as const;

export const services: ServiceMenuItem[] = [
  ["Luxury Weddings", "weddings", "https://picsum.photos/seed/giggifi-weddings/1200/900"],
  ["Nightclubs & Lounges", "clubs", "https://picsum.photos/seed/giggifi-clubs/1200/900"],
  ["Corporate Events", "corporate", "https://picsum.photos/seed/giggifi-corporate/1200/900"],
  ["Colleges & Festivals", "college", "https://picsum.photos/seed/giggifi-college/1200/900"],
  ["Hotels & Resorts", "hotels", "https://picsum.photos/seed/giggifi-hotels/1200/900"],
  ["Private Parties", "private", "https://picsum.photos/seed/giggifi-private/1200/900"],
];

export const artistMenus: ArtistMenuItem[] = [
  ["Singer-Guitarists", "artist-singer", "Guitar"],
  ["Musicians", "artist-musicians", "Drum"],
  ["Singers", "artist-singers", "Mic2"],
  ["Bands", "artist-bands", "Music2"],
  ["Stand Up Comedy", "artist-comedy", "Laugh"],
  ["Dancers", "artist-dancers", "Sparkles"],
  ["Actors", "artist-actors", "Clapperboard"],
  ["Circus", "artist-circus", "PartyPopper"],
  ["Misc. Entertainers", "artist-misc", "Ticket"],
];

export const clients = [
  "Taj",
  "Marriott",
  "JW",
  "Novotel",
  "Google",
  "Infosys",
  "Compass",
  "Hard Rock",
  "ITC",
  "Hyatt",
];

export const bookingStatusLabels: Record<BookingStatus, string> = {
  ENQUIRY_SENT: "Enquiry Sent",
  ENQUIRY_VIEWED: "Enquiry Viewed by Artist",
  QUOTE_RECEIVED: "Quote Received",
  QUOTE_ACCEPTED: "Quote Accepted",
  AWAITING_PAYMENT: "Awaiting Payment",
  PAYMENT_HELD: "Payment Secured in Escrow",
  EVENT_UPCOMING: "Event Coming Up",
  EVENT_COMPLETED: "Event Completed",
  PAYOUT_PROCESSING: "Payout Processing",
  PAYOUT_RELEASED: "Payout Released to Artist",
  CANCELLED_BY_BOOKER: "Cancelled by Booker",
  CANCELLED_BY_ARTIST: "Cancelled by Artist",
  DISPUTED: "Under Dispute Review",
  RESOLVED: "Dispute Resolved",
};

export const testimonials = [
  {
    name: "Ritika Sharma",
    eventType: "Wedding Cocktail",
    rating: 5,
    quote:
      "GiggiFi made the shortlist feel premium, the payment felt safe, and the artist turned up exactly as promised.",
  },
  {
    name: "Aarav Mehta",
    eventType: "Corporate Launch",
    rating: 5,
    quote:
      "We booked a clean comedy set with escrow protection and the whole experience felt boardroom-ready.",
  },
  {
    name: "Naina Gupta",
    eventType: "Private Birthday",
    rating: 4.9,
    quote:
      "The quick booking flow was the fastest way we have ever locked an entertainer for a premium house party.",
  },
];

export const cityShowcase = [
  {
    name: "Mumbai",
    detail: "Luxury weddings, hospitality launches, celebrity nights",
    image:
      "https://images.unsplash.com/photo-1526481280695-3c4691f7f8e6?auto=format&fit=crop&w=1400&q=80",
  },
  {
    name: "Delhi NCR",
    detail: "Corporate showcases, destination celebrations, clubs",
    image:
      "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1400&q=80",
  },
  {
    name: "Bengaluru",
    detail: "Tech events, premium socials, branded experiences",
    image:
      "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1400&q=80",
  },
  {
    name: "Goa",
    detail: "Beach weddings, sundowners, private celebrations",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1400&q=80",
  },
  {
    name: "Jaipur",
    detail: "Heritage venues, destination wedding programming",
    image:
      "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1400&q=80",
  },
  {
    name: "Kolkata",
    detail: "Cultural performances, premium private events",
    image:
      "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=1400&q=80",
  },
] as const;

export const celebrityShowcase = [
  {
    name: "Headline Singer",
    detail: "Luxury weddings • curated private stages • brand appearances",
    image:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1400&q=80",
  },
  {
    name: "Premium Host",
    detail: "Awards nights • launches • celebrity moderation",
    image:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=80",
  },
  {
    name: "Luxury Band",
    detail: "Reception stages • club residencies • festival headliners",
    image:
      "https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=1400&q=80",
  },
  {
    name: "Spotlight Performer",
    detail: "Premium choreography • visual production • curated acts",
    image:
      "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1400&q=80",
  },
] as const;

export const socialShowcase = [
  {
    title: "Artist Reels",
    detail: "Vertical cuts built for discovery, trust, and faster shortlists.",
    image:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Event Moments",
    detail: "Luxury guest reactions, stage energy, and premium crowd shots.",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Celebrity Highlights",
    detail: "High-end management moments, backstage clips, and arrivals.",
    image:
      "https://images.unsplash.com/photo-1509824227185-9c5a01ceba0d?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Client Testimonials",
    detail: "Elegant proof from weddings, hotels, brands, and private hosts.",
    image:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1400&q=80",
  },
] as const;

export const trustPillars = [
  {
    title: "Escrow-first payments",
    detail:
      "Clients pay the full amount plus tax upfront. GiggiFi holds funds safely until the event is completed.",
  },
  {
    title: "Verified artist network",
    detail:
      "KYC, identity checks, and profile reviews keep discovery premium and reduce reliability risk.",
  },
  {
    title: "Transparent commissions",
    detail:
      "Bookers see the platform fee. Artists know the payout after commission and tax deduction before confirmation.",
  },
  {
    title: "Reliability and dispute support",
    detail:
      "Cancellation policies, tracked booking stages, and platform intervention protect both sides.",
  },
] as const;

export const founderProfile = {
  name: "Sachin Chaudhary",
  title: "Singer, songwriter, tutor, performer, musician",
  image: "/media/sach/profile.jpg",
  highlights: [
    "Represented India in London",
    "Performed across Dubai tours",
    "Delivered shows across major Indian states and 5-star hotels",
    "116k YouTube subscribers and Silver Play Button creator",
    "Recording studio owner and working live performer",
  ],
} as const;

export function calculatePricing(artistFee: number) {
  const platformFee = Math.round(artistFee * 0.1);
  const gstAmount = Math.round(platformFee * 0.18);
  return {
    artistFee,
    platformFee,
    gstAmount,
    total: artistFee + platformFee + gstAmount,
    artistPayout: artistFee,
  };
}

export function formatINR(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export function formatIST(dateInput: string | Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateInput));
}

function createArtist(
  id: string,
  legalName: string,
  stageName: string,
  category: string,
  city: string,
  state: string,
  price: number,
  rating: number,
  tagline: string,
  featuredTag: string,
  imageSeed: string,
  genres: string[],
  languages: string[],
) {
  return {
    id,
    legalName,
    stageName,
    city,
    state,
    serviceableStates: [state, "Maharashtra", "Delhi", "Karnataka", "Goa"],
    category,
    subcategory: [category],
    genres,
    languages,
    performanceTypes: ["Solo", "With Band", "Acoustic"],
    yearsExperience: 6,
    bio: `${stageName} is a premium ${category.toLowerCase()} act built for luxury celebrations, corporate stages, and high-touch hospitality events across India.`,
    notableClients: "Taj Hotels, Marriott, Google, ITC, private destination weddings",
    portfolioPhotos: [
      `https://picsum.photos/seed/${imageSeed}-1/1200/900`,
      `https://picsum.photos/seed/${imageSeed}-2/1200/900`,
      `https://picsum.photos/seed/${imageSeed}-3/1200/900`,
    ],
    portfolioVideos: [
      "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
      "https://samplelib.com/lib/preview/mp4/sample-10s.mp4",
    ],
    audioSamples: [
      "https://samplelib.com/lib/preview/mp3/sample-3s.mp3",
    ],
    profilePhoto:
      stageName === "SACH"
        ? "/media/sach/profile.jpg"
        : `https://picsum.photos/seed/${imageSeed}-avatar/800/800`,
    coverPhoto: `https://picsum.photos/seed/${imageSeed}-cover/1600/900`,
    basePriceSolo: price,
    basePriceBand: price + 15000,
    basePriceDJ: price + 10000,
    travelIncluded: "NEGOTIABLE" as const,
    accommodationNeeded: true,
    minAdvanceBooking: 7,
    blackoutDates: [addDays(new Date(), 9).toISOString(), addDays(new Date(), 19).toISOString()],
    availableWeekdays: true,
    availableWeekends: true,
    isAvailable: true,
    aadhaarNumber: "XXXX XXXX 6721",
    panNumber: "ABCDE1234F",
    gstNumber: "27ABCDE1234F1Z5",
    bankAccountNumber: "XXXXXXXX4821",
    bankIFSC: "HDFC0004821",
    bankAccountName: legalName,
    stripeAccountId: `acct_${id}`,
    razorpayAccountId: `rzp_${id}`,
    kycStatus: "APPROVED" as const,
    onboardingStep: 7,
    rating,
    totalBookings: Math.round(rating * 10),
    termsAcceptedAt: subDays(new Date(), 60).toISOString(),
    featuredTag,
    tagline,
    packages: [
      {
        title: "Solo",
        price,
        description:
          "Live solo performance for weddings, cocktails, intimate gatherings",
      },
      {
        title: "Duo / Two-Piece Band",
        price: price + 12000,
        description: "Layered instrumentation for premium mid-size gatherings",
      },
      {
        title: "Four-Piece Band",
        price: price + 22000,
        description: "High-impact stage format for receptions and clubs",
      },
      {
        title: "Six to Seven Piece Band",
        price: price + 38000,
        description: "Full-scale production for marquee celebrations",
      },
    ],
    socials: {
      instagramUrl: "https://instagram.com/giggifi",
      youtubeUrl: "https://youtube.com/@giggifi",
      spotifyUrl: "https://spotify.com",
      facebookUrl: "https://facebook.com/giggifi",
      websiteUrl: "https://giggifi.example.com",
    },
    mediaVault: [
      { label: "Press kit PDF", description: "Latest introduction deck", status: "Ready", href: "/media/sach/press-kit.pdf" },
      { label: "Reel", description: "Vertical highlight edit", status: "Ready", href: "/media/sach/showreel.mp4" },
      { label: "Performance video", description: "Landscape live clip", status: "Ready", href: "/media/sach/live-performance.mov" },
      { label: "Profile photo", description: "Primary artist photo", status: "Ready", href: stageName === "SACH" ? "/media/sach/profile.jpg" : `https://picsum.photos/seed/${imageSeed}-avatar/800/800` },
      { label: "Package deck", description: "Pricing one-pager", status: "Pending refresh" },
      { label: "KYC bundle", description: "Verification docs set", status: "Approved" },
    ],
  } satisfies ArtistRecord;
}

export function createInitialDatabase(): MockDatabase {
  const artists: ArtistRecord[] = [
    createArtist("artist-sach", "Sachin Chaudhary", "SACH", "Singer-Guitarist", "Mumbai", "Maharashtra", 20000, 4.9, "Sufi • Bollywood • Live Weddings", "Featured in your area", "sach", ["Bollywood", "Sufi", "Pop"], ["Hindi", "English"]),
    createArtist("artist-velvet", "Velvet Notes LLP", "The Velvet Notes", "Band", "Pune", "Maharashtra", 45000, 4.8, "Live Band • Reception", "Wedding favourite", "velvet", ["Pop", "Rock", "Bollywood"], ["Hindi", "English"]),
    createArtist("artist-riya", "Riya Sharma", "Riya Flame", "Dancer", "Bengaluru", "Karnataka", 22000, 4.9, "Commercial • Event Choreo", "High energy performer", "riya", ["Pop"], ["Hindi", "English", "Kannada"]),
    createArtist("artist-rahul", "Rahul Jain", "Rahul Roast", "Stand Up Comedy", "Delhi", "Delhi", 28000, 4.7, "Clean Comedy • Corporate", "Corporate crowd hit", "rahul", ["Comedy"], ["Hindi", "English"]),
    createArtist("artist-noor", "Noor Collective Arts", "Noor Collective", "Musicians", "Mumbai", "Maharashtra", 30000, 4.8, "Instrumental • Lounge", "Luxury ambience act", "noor", ["Jazz", "Classical", "Sufi"], ["Hindi", "English"]),
    createArtist("artist-skyline", "Skyline Circus Studio", "Skyline Circus", "Circus", "Delhi", "Delhi", 55000, 4.9, "Aerial • LED", "Visual spectacle", "skyline", ["Other"], ["English", "Hindi"]),
    createArtist("artist-sufi", "Sufi Soulz Private", "Sufi Soulz", "Singers", "Jaipur", "Rajasthan", 22000, 4.9, "Sufi • Ghazal", "Destination wedding pick", "soulz", ["Sufi", "Ghazal"], ["Hindi", "Punjabi"]),
    createArtist("artist-arjun", "Arjun Varma", "RJ Arjun", "Misc. Entertainers", "Hyderabad", "Telangana", 12000, 4.8, "Emcee • Host", "Reliable host", "arjun", ["Other"], ["Hindi", "English", "Telugu"]),
    createArtist("artist-nritya", "Nritya Arts Company", "Nritya Arts", "Dancers", "Pune", "Maharashtra", 35000, 4.7, "Bollywood Dance Troupe", "Sangeet specialist", "nritya", ["Bollywood"], ["Hindi", "Marathi"]),
    createArtist("artist-rajan", "Rajan Mukherjee", "Maestro Rajan", "Singers", "Kolkata", "West Bengal", 30000, 4.9, "Classical Vocalist", "Heritage premium act", "rajan", ["Classical", "Devotional"], ["Hindi", "Bengali"]),
  ];

  const artistUsers: UserRecord[] = artists.map((artist, index) => ({
    id: `user-artist-${index + 1}`,
    phone: `+9198000000${index + 1}`,
    email: `${artist.stageName.toLowerCase().replace(/\s+/g, "")}@giggifi.in`,
    role: "ARTIST",
    status: index === 0 ? "ACTIVE" : "PENDING_VERIFICATION",
    name: artist.stageName,
    emailVerified: true,
    createdAt: subDays(new Date(), 90 - index).toISOString(),
  }));

  artists.forEach((artist, index) => {
    artist.userId = artistUsers[index]?.id;
  });

  const bookerUser: UserRecord = {
    id: "user-booker-1",
    phone: "+919876543210",
    email: "ritika@giggifi.in",
    role: "BOOKER",
    status: "ACTIVE",
    name: "Ritika Sharma",
    emailVerified: true,
    createdAt: subDays(new Date(), 45).toISOString(),
  };

  const adminUser: UserRecord = {
    id: "user-admin-1",
    phone: "+919000000000",
    email: "admin@giggifi.in",
    role: "ADMIN",
    status: "ACTIVE",
    name: "GiggiFi Admin",
    emailVerified: true,
    createdAt: subDays(new Date(), 120).toISOString(),
  };

  const bookers: BookerRecord[] = [
    {
      id: "booker-profile-1",
      userId: bookerUser.id,
      fullName: "Ritika Sharma",
      email: "ritika@giggifi.in",
      companyName: "Ritika Events",
      bookerType: "PLANNER",
      city: "Mumbai",
      state: "Maharashtra",
      kycVerified: true,
      howHeard: "Instagram",
      termsAcceptedAt: subDays(new Date(), 45).toISOString(),
      createdAt: subDays(new Date(), 45).toISOString(),
    },
  ];

  const quickPricing = calculatePricing(20000);
  const enquiryPricing = calculatePricing(28000);

  const bookings: BookingRecord[] = [
    {
      id: "booking-gf-001",
      bookerId: bookers[0].id,
      artistId: "artist-sach",
      bookingType: "QUICK_BOOKING",
      status: "PAYMENT_HELD",
      eventName: "Sangeet by the Sea",
      eventType: "Wedding",
      eventDate: addDays(new Date(), 12).toISOString(),
      isFlexibleDate: false,
      alternateDates: [],
      eventStartTime: "19:00",
      eventEndTime: "21:00",
      venueType: "Indoor",
      venueName: "Sea Crest Ballroom",
      venueAddress: "Bandra West, Mumbai",
      eventCity: "Mumbai",
      eventState: "Maharashtra",
      audienceSize: 220,
      duration: 120,
      performanceType: "Solo",
      languagePref: ["Hindi", "English"],
      specialRequests: "Need a Sufi opener followed by Bollywood singalong set.",
      soundAvailable: true,
      lightAvailable: true,
      travelArranged: true,
      accomProvided: false,
      budgetMin: 18000,
      budgetMax: 30000,
      contactPerson: "Ritika Sharma",
      contactPhone: "+919876543210",
      responseUrgency: "Within 24 hrs",
      quotedPrice: quickPricing.artistFee,
      totalAmount: quickPricing.total,
      platformFee: quickPricing.platformFee,
      gstAmount: quickPricing.gstAmount,
      artistPayout: quickPricing.artistPayout,
      escrowStatus: "HELD",
      paymentId: "payment-gf-001",
      createdAt: subDays(new Date(), 3).toISOString(),
      updatedAt: subDays(new Date(), 2).toISOString(),
      quickBookPackage: "Solo",
      chat: [
        { id: "chat-1", from: "SYSTEM", body: "Your booking with SACH is confirmed and payment is held in escrow.", createdAt: subDays(new Date(), 2).toISOString() },
        { id: "chat-2", from: "ARTIST", body: "Looking forward to performing. Please share the final running order 48 hours before the event.", createdAt: subDays(new Date(), 1).toISOString() },
      ],
    },
    {
      id: "booking-gf-002",
      bookerId: bookers[0].id,
      artistId: "artist-rahul",
      bookingType: "ENQUIRY",
      status: "QUOTE_RECEIVED",
      eventName: "Annual Leadership Night",
      eventType: "Corporate Event",
      eventDate: addDays(new Date(), 20).toISOString(),
      isFlexibleDate: true,
      alternateDates: [addDays(new Date(), 21).toISOString()],
      eventStartTime: "20:30",
      eventEndTime: "21:30",
      venueType: "Indoor",
      venueName: "The Westin Gurugram",
      venueAddress: "Sector 29, Gurugram",
      eventCity: "Delhi",
      eventState: "Delhi",
      audienceSize: 400,
      duration: 60,
      performanceType: "Solo",
      languagePref: ["English", "Hindi"],
      specialRequests: "Clean corporate comedy only. No politics.",
      soundAvailable: true,
      lightAvailable: true,
      travelArranged: true,
      accomProvided: true,
      budgetMin: 20000,
      budgetMax: 40000,
      contactPerson: "Ritika Sharma",
      contactPhone: "+919876543210",
      responseUrgency: "3 days",
      quotedPrice: enquiryPricing.artistFee,
      totalAmount: enquiryPricing.total,
      platformFee: enquiryPricing.platformFee,
      gstAmount: enquiryPricing.gstAmount,
      artistPayout: enquiryPricing.artistPayout,
      escrowStatus: "NOT_INITIATED",
      createdAt: subDays(new Date(), 2).toISOString(),
      updatedAt: subDays(new Date(), 1).toISOString(),
      chat: [
        { id: "chat-3", from: "BOOKER", body: "We need a 45-minute clean set for a senior corporate audience.", createdAt: subDays(new Date(), 2).toISOString() },
        { id: "chat-4", from: "ARTIST", body: "Happy to do that. My quote includes show prep and travel.", createdAt: subDays(new Date(), 1).toISOString() },
      ],
    },
  ];

  const payments: PaymentRecord[] = [
    {
      id: "payment-gf-001",
      bookingId: "booking-gf-001",
      amount: quickPricing.total,
      platformFee: quickPricing.platformFee,
      gstAmount: quickPricing.gstAmount,
      artistPayout: quickPricing.artistPayout,
      status: "PAID",
      paidAt: subDays(new Date(), 2).toISOString(),
      razorpayOrderId: "order_mock_001",
      razorpayPaymentId: "pay_mock_001",
      createdAt: subDays(new Date(), 2).toISOString(),
    },
  ];

  const reviews: ReviewRecord[] = [
    {
      id: "review-1",
      bookingId: "booking-gf-001",
      fromId: bookerUser.id,
      toId: artistUsers[0]!.id,
      rating: 4.9,
      comment: "Beautiful audience connection and a very polished premium set.",
      eventType: "Wedding",
      createdAt: subDays(new Date(), 1).toISOString(),
    },
    {
      id: "review-2",
      bookingId: "booking-gf-002",
      fromId: bookerUser.id,
      toId: artistUsers[3]!.id,
      rating: 4.7,
      comment: "Sharp, clean, and perfectly paced for our corporate audience.",
      eventType: "Corporate Event",
      createdAt: subDays(new Date(), 1).toISOString(),
    },
  ];

  const notifications: NotificationRecord[] = [
    {
      id: "notification-1",
      userId: bookerUser.id,
      title: "Booking confirmed",
      body: "Your booking with SACH is confirmed and the payment is held in escrow.",
      type: "BOOKING_CONFIRMED",
      read: false,
      actionUrl: "/booking/booking-gf-001",
      createdAt: subDays(new Date(), 2).toISOString(),
    },
    {
      id: "notification-2",
      userId: artistUsers[0]!.id,
      title: "Payment held in escrow",
      body: "₹22,360 is held securely for your upcoming booking.",
      type: "PAYMENT_HELD_ARTIST",
      read: false,
      actionUrl: "/booking/booking-gf-001",
      createdAt: subDays(new Date(), 2).toISOString(),
    },
  ];

  return {
    users: [...artistUsers, bookerUser, adminUser],
    artists,
    bookers,
    bookings,
    payments,
    reviews,
    notifications,
    savedArtists: [
      {
        id: "saved-1",
        bookerId: bookers[0].id,
        artistId: "artist-noor",
        savedAt: subDays(new Date(), 5).toISOString(),
      },
      {
        id: "saved-2",
        bookerId: bookers[0].id,
        artistId: "artist-riya",
        savedAt: subDays(new Date(), 1).toISOString(),
      },
    ],
    carts: [
      {
        bookerId: bookers[0].id,
        artistIds: ["artist-sach", "artist-noor"],
        occasion: "Wedding",
        city: "Mumbai",
        updatedAt: new Date().toISOString(),
      },
    ],
    otpRequests: [],
    onboardingDrafts: [],
  };
}

export function buildDashboardPath(role: Role) {
  if (role === "ARTIST") return "/artist/dashboard";
  if (role === "ADMIN") return "/admin";
  return "/booker/dashboard";
}
