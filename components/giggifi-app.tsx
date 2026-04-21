"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import * as Accordion from "@radix-ui/react-accordion";
import * as Tabs from "@radix-ui/react-tabs";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clapperboard,
  CreditCard,
  Drum,
  Guitar,
  Laugh,
  Lock,
  Menu,
  Mic2,
  Music2,
  PartyPopper,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Ticket,
  Wallet,
  X,
} from "lucide-react";
import {
  artistMenus,
  bookingStatusLabels,
  calculatePricing,
  celebrityShowcase,
  clients,
  cityShowcase,
  founderProfile,
  formatINR,
  formatIST,
  gradientClass,
  occasions,
  socialShowcase,
  services,
  trustPillars,
  testimonials,
  type ArtistRecord,
  type BookingRecord,
  type BookingStatus,
  type MockDatabase,
  type ReviewRecord,
} from "@/lib/mock-data";
import { resolveAuthenticatedAppPath } from "@/lib/auth-routing";

type SessionPayload = {
  userId: string;
  role: "ARTIST" | "BOOKER" | "ADMIN" | null;
  phone: string;
  email: string;
  name: string;
  onboardingState: string | null;
  onboardingDraftRole: "ARTIST" | "BOOKER" | "ADMIN" | null;
  hasArtistProfile: boolean;
  hasBookerProfile: boolean;
};

type Props = {
  slug: string[];
  initialDb: MockDatabase;
  initialSession: SessionPayload | null;
  pendingPhone: string | null;
  authProviders: {
    googleEnabled: boolean;
    otpMode: "twilio" | "preview" | "unavailable";
  };
};

type CartDraft = {
  artistIds: string[];
  occasion?: string;
  city?: string;
};

type OccasionOption = {
  label: (typeof occasions)[number][0];
  pageKey: (typeof occasions)[number][1];
};

const guestCartStorageKey = "giggifi-guest-cart";
const serviceRouteKeys = services.map((service) => service[1]);
const occasionOptions: OccasionOption[] = occasions.map(([label, pageKey]) => ({
  label,
  pageKey,
}));

const cityOptions = ["Mumbai", "Pune", "Bengaluru", "Delhi"];
const languageOptions = [
  "Hindi",
  "English",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Bengali",
  "Punjabi",
  "Marathi",
  "Gujarati",
  "Other",
];
const genreOptions = [
  "Bollywood",
  "Classical",
  "Jazz",
  "EDM",
  "Folk",
  "Sufi",
  "Hip-hop",
  "Pop",
  "Rock",
  "Ghazal",
  "Devotional",
  "Other",
];
const performanceOptions = ["Solo", "With Band", "DJ Set", "Acoustic", "Hybrid"];
const packageLabels = [
  "Solo",
  "Duo / Two-Piece Band",
  "Four-Piece Band",
  "Six to Seven Piece Band",
];

const pageTransitions = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.3 },
};

function cn(...classes: Array<string | false | null | undefined>) {
  return twMerge(clsx(classes));
}

function getOccasionOption(label?: string | null) {
  return (
    occasionOptions.find((occasion) => occasion.label === label) ??
    occasionOptions[2]
  );
}

function matchesArtistSearch(artist: ArtistRecord, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [
    artist.stageName,
    artist.category,
    artist.city,
    artist.state,
    artist.tagline,
    artist.featuredTag,
    artist.genres.join(" "),
    artist.languages.join(" "),
    artist.performanceTypes.join(" "),
    artist.serviceableStates.join(" "),
    artist.serviceableStates.length > 1 ? "pan india" : "",
    artist.kycStatus === "APPROVED" ? "verified" : "",
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

function isPremiumArtist(artist: ArtistRecord) {
  return (
    artist.rating >= 4.8 ||
    artist.basePriceSolo >= 30000 ||
    artist.totalBookings >= 25 ||
    /premium|featured|celebrity|luxury/i.test(artist.featuredTag)
  );
}

function resolveBookerContinuationPath(
  session: SessionPayload | null,
  nextPath = "/booker/dashboard",
) {
  const safeNextPath = encodeURIComponent(nextPath);

  if (!session?.userId) {
    return `/login?next=${safeNextPath}`;
  }

  if (session.role === "BOOKER" && session.hasBookerProfile) {
    return nextPath;
  }

  if (session.role === "BOOKER") {
    return `/onboarding/booker?next=${safeNextPath}`;
  }

  return `/onboarding/choice?next=${safeNextPath}`;
}

function buildBookerArtistProfilePath(
  artistId: string,
  options?: { occasion?: string; city?: string },
) {
  const params = new URLSearchParams();

  if (options?.occasion) {
    params.set("occasion", options.occasion);
  }

  if (options?.city) {
    params.set("city", options.city);
  }

  const query = params.toString();
  return query ? `/booker/artist/${artistId}?${query}` : `/booker/artist/${artistId}`;
}

function pageName(slug: string[]) {
  const joined = slug.join("/");
  if (!joined) return "Home";
  const map: Record<string, string> = {
    services: "Services",
    artists: "Artists",
    verified: "Verified Artists",
    cities: "Cities Covered",
    celebrity: "Celebrity",
    social: "Social",
    weddings: "Luxury Weddings",
    clubs: "Nightclubs & Lounges",
    corporate: "Corporate Events",
    college: "Colleges & Festivals",
    hotels: "Hotels & Resorts",
    private: "Private Parties",
    login: "Login",
    "onboarding/contact": "Complete Contact",
    "onboarding/choice": "Choose Role",
    "onboarding/artist": "Artist Onboarding",
    "onboarding/booker": "Booker Onboarding",
    "artist/dashboard": "Artist Dashboard",
    "artist/enquiries": "Client Enquiries",
    "artist/calendar": "Availability Calendar",
    "artist/earnings": "Artist Earnings",
    "booker/dashboard": "Booker Dashboard",
    "booker/discover": "Discover Artists",
    cart: "Your Cart",
    payment: "Payment",
    admin: "Admin Overview",
    "admin/kyc": "KYC Queue",
    "admin/bookings": "All Bookings",
    "admin/disputes": "Disputes",
    "admin/payouts": "Payout Controls",
    "admin/users": "Users",
  };
  if (map[joined]) return map[joined];
  if (slug[0] === "booker" && slug[1] === "artist" && slug[3] === "enquiry")
    return "Send Enquiry";
  if (slug[0] === "booker" && slug[1] === "artist" && slug[3] === "quick-book")
    return "Quick Booking";
  if (slug[0] === "booker" && slug[1] === "artist") return "Artist Profile";
  if (slug[0] === "booking") return "Booking Detail";
  if (slug[0] === "checkout") return "Checkout";
  return slug[slug.length - 1]!.replace(/-/g, " ");
}

function iconForArtistMenu(name: string) {
  const size = 18;
  if (name === "Guitar") return <Guitar size={size} />;
  if (name === "Drum") return <Drum size={size} />;
  if (name === "Mic2") return <Mic2 size={size} />;
  if (name === "Music2") return <Music2 size={size} />;
  if (name === "Laugh") return <Laugh size={size} />;
  if (name === "Sparkles") return <Sparkles size={size} />;
  if (name === "Clapperboard") return <Clapperboard size={size} />;
  if (name === "PartyPopper") return <PartyPopper size={size} />;
  return <Ticket size={size} />;
}

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok && "error" in data) {
    throw new Error(data.error || "Request failed.");
  }
  return data;
}

export function GiggiFiApp({
  slug,
  initialDb,
  initialSession,
  pendingPhone,
  authProviders,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [db, setDb] = useState(initialDb);
  const [session, setSession] = useState(initialSession);
  const [toast, setToast] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [downloadPopupDismissed, setDownloadPopupDismissed] = useState(true);
  const [guestCart, setGuestCart] = useState<CartDraft>({ artistIds: [] });

  useEffect(() => {
    setDb(initialDb);
    setSession(initialSession);
  }, [initialDb, initialSession]);

  useEffect(() => {
    const dismissed = window.localStorage.getItem("giggifi-download-popup");
    setDownloadPopupDismissed(Boolean(dismissed));
    const storedCart = window.localStorage.getItem(guestCartStorageKey);
    if (!storedCart) return;
    try {
      const parsed = JSON.parse(storedCart) as CartDraft;
      if (Array.isArray(parsed.artistIds)) {
        setGuestCart({
          artistIds: parsed.artistIds,
          occasion: parsed.occasion,
          city: parsed.city,
        });
      }
    } catch {
      window.localStorage.removeItem(guestCartStorageKey);
    }
  }, []);

  useEffect(() => {
    if (!guestCart.artistIds.length) {
      window.localStorage.removeItem(guestCartStorageKey);
      return;
    }

    window.localStorage.setItem(guestCartStorageKey, JSON.stringify(guestCart));
  }, [guestCart]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const routeKey = slug.join("/");
  const viewerBooker = session
    ? db.bookers.find((item) => item.userId === session.userId)
    : undefined;
  const viewerArtist = session
    ? db.artists.find((item) => item.userId === session.userId)
    : undefined;
  const viewerCart = viewerBooker
    ? db.carts.find((item) => item.bookerId === viewerBooker.id)
    : undefined;
  const effectiveCart = viewerCart ?? (guestCart.artistIds.length ? {
    bookerId: "guest-booker",
    artistIds: guestCart.artistIds,
    occasion: guestCart.occasion,
    city: guestCart.city,
    updatedAt: new Date().toISOString(),
  } : undefined);
  const nextQuery = searchParams.get("next");
  const authError = searchParams.get("error");

  async function refreshFromServer(nextPath?: string) {
    startTransition(() => {
      router.refresh();
      if (nextPath) router.push(nextPath);
    });
  }

  async function handleLogout() {
    await signOut({ redirect: false });
    setToast("Logged out.");
    await refreshFromServer("/");
  }

  useEffect(() => {
    if (
      !session?.userId ||
      session.role !== "BOOKER" ||
      !session.hasBookerProfile ||
      !guestCart.artistIds.length
    ) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        for (const artistId of guestCart.artistIds) {
          await jsonRequest("/api/cart", {
            method: "POST",
            body: JSON.stringify({
              artistId,
              action: "add",
              occasion: guestCart.occasion,
              city: guestCart.city,
            }),
          });
        }

        if (cancelled) return;

        setGuestCart({ artistIds: [] });
        setToast("Saved artists restored to your cart.");
        await refreshFromServer("/cart");
      } catch (error) {
        if (cancelled) return;
        setToast(error instanceof Error ? error.message : "Could not restore your saved cart.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [guestCart, session?.hasBookerProfile, session?.role, session?.userId]);

  async function addToCart(artistId: string, occasion?: string, city?: string) {
    if (!session?.userId) {
      setGuestCart((current) => ({
        artistIds: Array.from(new Set([...current.artistIds, artistId])),
        occasion: occasion ?? current.occasion ?? "Wedding",
        city: city ?? current.city ?? "Mumbai",
      }));
      setToast("Artist added to cart.");
      go("/cart");
      return;
    }

    if (session.role !== "BOOKER" || !session.hasBookerProfile) {
      setGuestCart((current) => ({
        artistIds: Array.from(new Set([...current.artistIds, artistId])),
        occasion: occasion ?? current.occasion ?? "Wedding",
        city: city ?? current.city ?? "Mumbai",
      }));
      setToast("Artist added to cart. Continue as a booker from cart to move ahead.");
      go("/cart");
      return;
    }

    try {
      await jsonRequest("/api/cart", {
        method: "POST",
        body: JSON.stringify({ artistId, action: "add", occasion, city }),
      });
      setToast("Added to cart.");
      await refreshFromServer("/cart");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not update cart.");
    }
  }

  async function removeFromCart(artistId: string) {
    if (!session?.userId || session.role !== "BOOKER" || !session.hasBookerProfile) {
      setGuestCart((current) => ({
        ...current,
        artistIds: current.artistIds.filter((item) => item !== artistId),
      }));
      setToast("Removed from saved cart.");
      return;
    }

    try {
      await jsonRequest("/api/cart", {
        method: "POST",
        body: JSON.stringify({ artistId, action: "remove" }),
      });
      setToast("Removed from cart.");
      await refreshFromServer();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not update cart.");
    }
  }

  function go(path: string) {
    startTransition(() => {
      setMobileMenuOpen(false);
      router.push(path);
    });
  }

  const isArtistConsole = session?.role === "ARTIST";
  const showSubHeader =
    pathname !== "/" &&
    pathname !== "/login" &&
    pathname !== "/onboarding/contact" &&
    pathname !== "/onboarding/choice" &&
    !mobileMenuOpen;
  const selectedArtist = slug[0] === "booker" && slug[1] === "artist" ? db.artists.find((item) => item.id === slug[2]) : undefined;
  const selectedBooking = slug[1] ? db.bookings.find((item) => item.id === slug[1]) : undefined;
  const selectedBookingArtist = selectedBooking
    ? db.artists.find((item) => item.id === selectedBooking.artistId)
    : undefined;
  const selectedBookingBooker = selectedBooking
    ? db.bookers.find((item) => item.id === selectedBooking.bookerId)
    : undefined;
  const artistScopedBookings = viewerArtist
    ? db.bookings.filter((item) => item.artistId === viewerArtist.id)
    : [];

  return (
    <div className="min-h-screen bg-[#06020b] text-white">
      <SiteHeader
        cartCount={effectiveCart?.artistIds.length ?? 0}
        isArtistConsole={isArtistConsole}
        onNavigate={go}
        onLogout={handleLogout}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        session={session}
      />
      {showSubHeader ? (
        <div className="sticky top-20 z-40 border-b border-white/10 bg-[#06020b]/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
            <button
              className="flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
              onClick={() => (window.history.length > 1 ? router.back() : go("/"))}
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <div className="text-sm font-semibold text-white">{pageName(slug)}</div>
            <div className="text-xs uppercase tracking-[0.18em] text-white/40">
              {session?.role === "ARTIST"
                ? "Artist workspace"
                : "Booking workspace"}
            </div>
          </div>
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:px-6 md:pt-8"
          {...pageTransitions}
        >
          {routeKey === "" ? (
            <LandingPage
              artists={db.artists}
              bookings={db.bookings}
              onAddToCart={addToCart}
              onNavigate={go}
              quickRows={db.artists}
            />
          ) : null}

          {routeKey === "services" ? (
            <ServicesPage onNavigate={go} />
          ) : null}

          {serviceRouteKeys.includes(routeKey) ? (
            <ServiceDetailPage
              service={services.find((item) => item[1] === routeKey)!}
              artists={db.artists}
              onAddToCart={addToCart}
              onNavigate={go}
            />
          ) : null}

          {routeKey === "artists" ? (
            <DiscoverPage
              artists={db.artists}
              cartArtistCount={effectiveCart?.artistIds.length ?? 0}
              onAddToCart={addToCart}
              onNavigate={go}
            />
          ) : null}

          {routeKey === "verified" ? (
            <VerifiedArtistsPage artists={db.artists} onAddToCart={addToCart} onNavigate={go} />
          ) : null}

          {routeKey === "cities" ? (
            <CitiesCoveredPage onNavigate={go} />
          ) : null}

          {routeKey === "celebrity" ? (
            <CelebrityPage artists={db.artists} onNavigate={go} />
          ) : null}

          {routeKey === "social" ? (
            <SocialPage onNavigate={go} />
          ) : null}

          {routeKey === "login" ? (
            <LoginPage
              initialPhone={session?.phone ?? pendingPhone ?? ""}
              nextPath={nextQuery}
              authError={authError}
              authProviders={authProviders}
              onDone={async (path) => {
                setToast("Welcome to GiggiFi.");
                await refreshFromServer(path);
              }}
            />
          ) : null}

          {routeKey === "onboarding/contact" ? (
            <ContactCompletionPage
              session={session}
              authProviders={authProviders}
              nextPath={nextQuery}
              onDone={async (path) => {
                setToast("Contact details updated.");
                await refreshFromServer(path);
              }}
            />
          ) : null}

          {routeKey === "onboarding/choice" ? (
            <ChoicePage
              session={session}
              nextPath={nextQuery}
              onDone={async (path) => {
                await refreshFromServer(path);
              }}
            />
          ) : null}

          {routeKey === "onboarding/artist" ? (
            <ArtistOnboardingPage
              phone={session?.phone ?? null}
              nextPath={nextQuery}
              onDone={async (path) => {
                setToast("Artist account created.");
                await refreshFromServer(path);
              }}
            />
          ) : null}

          {routeKey === "onboarding/booker" ? (
            <BookerOnboardingPage
              phone={session?.phone ?? null}
              email={session?.email ?? null}
              name={session?.name ?? null}
              nextPath={nextQuery}
              onDone={async (path) => {
                setToast("Booker account created.");
                await refreshFromServer(path);
              }}
            />
          ) : null}

          {routeKey === "booker/dashboard" ? (
            <BookerDashboardPage
              artists={db.artists}
              cartArtistCount={effectiveCart?.artistIds.length ?? 0}
              onAddToCart={addToCart}
              onNavigate={go}
            />
          ) : null}

          {routeKey === "booker/discover" ? (
            <DiscoverPage
              artists={db.artists}
              cartArtistCount={effectiveCart?.artistIds.length ?? 0}
              onAddToCart={addToCart}
              onNavigate={go}
            />
          ) : null}

          {slug[0] === "booker" && slug[1] === "artist" && slug.length === 3 ? (
            selectedArtist ? (
              <ArtistProfilePage
                artist={selectedArtist}
                reviews={db.reviews}
                onAddToCart={addToCart}
                onNavigate={go}
              />
            ) : (
              <NotFoundPanel
                title="Artist not found"
                body="This artist page is no longer available or the link is invalid."
                onNavigate={go}
              />
            )
          ) : null}

          {slug[0] === "booker" && slug[1] === "artist" && slug[3] === "enquiry" ? (
            selectedArtist ? (
              <EnquiryPage
                artist={selectedArtist}
                phone={session?.phone ?? pendingPhone ?? ""}
                onDone={async (path) => {
                  setToast("Your enquiry has been sent. Most artists respond within 24 hours.");
                  await refreshFromServer(path);
                }}
              />
            ) : (
              <NotFoundPanel
                title="Artist not found"
                body="We couldn’t load this enquiry flow because the artist record is missing."
                onNavigate={go}
              />
            )
          ) : null}

          {slug[0] === "booker" && slug[1] === "artist" && slug[3] === "quick-book" ? (
            selectedArtist ? (
              <QuickBookPage
                artist={selectedArtist}
                phone={session?.phone ?? ""}
                onDone={async (path) => {
                  setToast("Booking summary prepared.");
                  await refreshFromServer(path);
                }}
              />
            ) : (
              <NotFoundPanel
                title="Artist not found"
                body="This quick booking link is invalid because the artist record is missing."
                onNavigate={go}
              />
            )
          ) : null}

          {slug[0] === "checkout" && slug[1] ? (
            selectedBooking ? (
              <CheckoutPage
                booking={selectedBooking}
                artist={selectedBookingArtist}
                onDone={async (path, message) => {
                  setToast(message);
                  await refreshFromServer(path);
                }}
              />
            ) : (
              <NotFoundPanel
                title="Booking not found"
                body="We couldn’t load checkout because this booking ID is invalid."
                onNavigate={go}
              />
            )
          ) : null}

          {slug[0] === "booking" && slug[1] ? (
            selectedBooking ? (
              <BookingDetailPage
                booking={selectedBooking}
                artist={selectedBookingArtist}
                booker={selectedBookingBooker}
                onUpdate={async (payload) => {
                  try {
                    await jsonRequest(`/api/bookings/${slug[1]}`, {
                      method: "PATCH",
                      body: JSON.stringify(payload),
                    });
                    setToast("Booking updated.");
                    await refreshFromServer();
                  } catch (error) {
                    setToast(error instanceof Error ? error.message : "Could not update booking.");
                  }
                }}
                session={session}
              />
            ) : (
              <NotFoundPanel
                title="Booking not found"
                body="This booking detail page is unavailable because the booking ID does not exist."
                onNavigate={go}
              />
            )
          ) : null}

          {routeKey === "artist/dashboard" ? (
            viewerArtist ? (
              <ArtistDashboardPage artist={viewerArtist} bookings={db.bookings} />
            ) : (
              <NotFoundPanel
                title="Artist profile missing"
                body="Your artist dashboard can’t load until your artist profile is completed."
                onNavigate={go}
              />
            )
          ) : null}

          {routeKey === "artist/enquiries" ? (
            viewerArtist ? (
              <ArtistEnquiriesPage
                artist={viewerArtist}
                bookings={artistScopedBookings}
                onUpdate={async (id, payload) => {
                  try {
                    await jsonRequest(`/api/bookings/${id}`, {
                      method: "PATCH",
                      body: JSON.stringify(payload),
                    });
                    setToast("Enquiry updated.");
                    await refreshFromServer();
                  } catch (error) {
                    setToast(error instanceof Error ? error.message : "Could not update enquiry.");
                  }
                }}
              />
            ) : (
              <NotFoundPanel
                title="Artist profile missing"
                body="Your enquiries will appear here after the artist profile is available."
                onNavigate={go}
              />
            )
          ) : null}

          {routeKey === "artist/calendar" ? (
            viewerArtist ? (
              <ArtistCalendarPage
                artist={viewerArtist}
                bookings={artistScopedBookings}
                onToggle={async (date) => {
                  await jsonRequest("/api/artist/calendar", {
                    method: "PATCH",
                    body: JSON.stringify({ date }),
                  });
                  setToast("Availability updated.");
                  await refreshFromServer();
                }}
              />
            ) : (
              <NotFoundPanel
                title="Artist profile missing"
                body="The availability calendar becomes available after your artist profile is set up."
                onNavigate={go}
              />
            )
          ) : null}

          {routeKey === "artist/earnings" ? (
            viewerArtist ? (
              <ArtistEarningsPage
                artist={viewerArtist}
                bookings={artistScopedBookings}
                payments={db.payments}
              />
            ) : (
              <NotFoundPanel
                title="Artist profile missing"
                body="Earnings data will appear once your artist profile and bookings are available."
                onNavigate={go}
              />
            )
          ) : null}

          {routeKey === "cart" ? (
            <CartPage
              artists={db.artists.filter((artist) =>
                effectiveCart?.artistIds.includes(artist.id),
              )}
              cart={effectiveCart}
              onRemove={removeFromCart}
              onNavigate={go}
              session={session}
            />
          ) : null}

          {routeKey === "payment" ? (
            <PaymentPage cart={effectiveCart} artists={db.artists} onNavigate={go} session={session} />
          ) : null}

          {routeKey.startsWith("booker/") &&
          ![
            "booker/dashboard",
            "booker/discover",
          ].includes(routeKey) &&
          !(slug[1] === "artist") ? (
            <BookerOpsPage
              routeKey={routeKey}
              bookings={db.bookings.filter((item) => item.bookerId === viewerBooker?.id)}
              artists={db.artists}
              saved={db.savedArtists.filter((item) => item.bookerId === viewerBooker?.id)}
            />
          ) : null}

          {routeKey.startsWith("artist/") &&
          !["artist/dashboard", "artist/enquiries", "artist/calendar", "artist/earnings"].includes(
            routeKey,
          ) ? (
            viewerArtist ? (
              <ArtistOpsPage
                routeKey={routeKey}
                artist={viewerArtist}
                bookings={artistScopedBookings}
                reviews={db.reviews}
              />
            ) : (
              <NotFoundPanel
                title="Artist profile missing"
                body="This artist console page needs a completed artist profile."
                onNavigate={go}
              />
            )
          ) : null}

          {routeKey === "admin" || routeKey.startsWith("admin/") ? (
            <AdminPage
              routeKey={routeKey}
              db={db}
              onUpdate={async (id, payload) => {
                try {
                  await jsonRequest(`/api/bookings/${id}`, {
                    method: "PATCH",
                    body: JSON.stringify(payload),
                  });
                  setToast("Admin action completed.");
                  await refreshFromServer();
                } catch (error) {
                  setToast(error instanceof Error ? error.message : "Admin action failed.");
                }
              }}
              onReviewKyc={async (artistId, payload) => {
                try {
                  await jsonRequest(`/api/admin/kyc/${artistId}`, {
                    method: "PATCH",
                    body: JSON.stringify(payload),
                  });
                  setToast("KYC review updated.");
                  await refreshFromServer();
                } catch (error) {
                  setToast(error instanceof Error ? error.message : "KYC review failed.");
                }
              }}
            />
          ) : null}
        </motion.main>
      </AnimatePresence>

      <footer className="border-t border-white/10 bg-[#05010a]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_0.8fr_0.8fr] md:px-6">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-md text-sm text-white/60">
              GiggiFi is a premium dark entertainment marketplace built around verified artists, escrow-based payments, and a trust-first booking journey for both bookers and performers.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-white/40">Explore</div>
            <div className="mt-4 space-y-3 text-sm text-white/65">
              {[
                ["Home", "/"],
                ["Services", "/services"],
                ["Artists", "/artists"],
                ["Verified Artists", "/verified"],
                ["Cities Covered", "/cities"],
              ].map(([label, path]) => (
                <button key={label} onClick={() => go(path)} className="block hover:text-white">
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-white/40">Trust Model</div>
            <div className="mt-4 space-y-3 text-sm text-white/65">
              <div>Client amount plus tax is collected upfront.</div>
              <div>Funds remain in escrow until the event is complete.</div>
              <div>Artist payout releases after commission and tax deduction.</div>
              <div>Cancellation, reliability, and disputes stay tracked inside GiggiFi.</div>
            </div>
          </div>
        </div>
      </footer>

      {downloadPopupDismissed ? null : (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-[1.8rem] border border-white/10 bg-[#0f0918]/95 p-5 shadow-glow backdrop-blur-xl">
          <button
            className="absolute right-3 top-3 rounded-full border border-white/10 p-1 text-white/60 transition hover:text-white"
            onClick={() => {
              window.localStorage.setItem("giggifi-download-popup", "1");
              setDownloadPopupDismissed(true);
            }}
          >
            <X size={16} />
          </button>
          <div className="mb-2 text-lg font-black">Download GiggiFi App</div>
          <div className="mb-4 text-sm text-white/70">
            Download links are opening soon. Join the waitlist from iOS or Android and we&apos;ll notify you first.
          </div>
          <div className="flex gap-3">
            <button
              className={`${gradientClass} h-12 rounded-2xl px-5 font-semibold text-black`}
              onClick={() => setToast("iOS waitlist opening soon.")}
            >
              iOS App
            </button>
            <button
              className="h-12 rounded-2xl border border-white/15 bg-white/5 px-5 text-white"
              onClick={() => setToast("Android waitlist opening soon.")}
            >
              Android App
            </button>
          </div>
        </div>
      )}

      {toast ? (
        <div className="fixed left-1/2 top-4 z-[60] -translate-x-1/2 rounded-full border border-white/10 bg-[#0f0918]/90 px-4 py-2 text-sm text-white shadow-lg backdrop-blur-xl">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function SiteHeader({
  cartCount,
  isArtistConsole,
  onNavigate,
  onLogout,
  mobileMenuOpen,
  setMobileMenuOpen,
  session,
}: {
  cartCount: number;
  isArtistConsole: boolean;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (value: boolean) => void;
  session: SessionPayload | null;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#06020b]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <button onClick={() => onNavigate(isArtistConsole ? "/artist/dashboard" : "/")}>
          <Wordmark />
        </button>

        {isArtistConsole ? (
          <div className="hidden items-center gap-8 md:flex">
            <button className="text-white/80 transition hover:text-white" onClick={() => onNavigate("/artist/dashboard")}>
              Dashboard
            </button>
            <button className="text-white/80 transition hover:text-white" onClick={() => onNavigate("/artist/enquiries")}>
              Client Enquiries
            </button>
          </div>
        ) : (
          <nav className="hidden items-center gap-6 text-sm text-white/80 md:flex">
            <button onClick={() => onNavigate("/")} className="transition hover:text-white">Home</button>
            <DropdownNav label="Services">
              {services.map((item) => (
                <button
                  key={item[0]}
                  className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-white/80 transition hover:bg-white/5 hover:text-white"
                  onClick={() => onNavigate(`/${item[1]}`)}
                >
                  <span>{item[0]}</span>
                  <ArrowRight size={16} />
                </button>
              ))}
            </DropdownNav>
            <button onClick={() => onNavigate("/booker/dashboard")} className="transition hover:text-white">Booker</button>
            <DropdownNav label="Artists">
              {artistMenus.map((item) => (
                <button
                  key={item[0]}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-white/80 transition hover:bg-white/5 hover:text-white"
                  onClick={() => onNavigate("/booker/discover")}
                >
                  <span className={`${gradientClass} rounded-2xl p-2 text-black`}>
                    {iconForArtistMenu(item[2])}
                  </span>
                  <span>{item[0]}</span>
                </button>
              ))}
            </DropdownNav>
            <button onClick={() => onNavigate("/celebrity")} className="transition hover:text-white">Celebrity</button>
            <button onClick={() => onNavigate("/social")} className="transition hover:text-white">Social</button>
          </nav>
        )}

        <div className="hidden items-center gap-3 md:flex">
          {!isArtistConsole ? (
            <button
              onClick={() => onNavigate("/cart")}
              className="relative rounded-full border border-white/15 bg-white/5 p-3 text-white"
            >
              <ShoppingCart size={18} />
              <span className={`absolute -right-1 -top-1 ${gradientClass} flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-black`}>
                {cartCount}
              </span>
            </button>
          ) : null}
          {session ? (
            <>
              <button
                onClick={() =>
                  onNavigate(
                    resolveAuthenticatedAppPath({
                      role: session.role,
                      phone: session.phone,
                      email: session.email,
                      onboardingState:
                        session.onboardingState as
                          | "ROLE_SELECTION"
                          | "PROFILE_IN_PROGRESS"
                          | "COMPLETE"
                          | null,
                      onboardingDraftRole: session.onboardingDraftRole,
                      hasArtistProfile: session.hasArtistProfile,
                      hasBookerProfile: session.hasBookerProfile,
                    }),
                  )
                }
                className={`${gradientClass} flex h-12 items-center rounded-2xl px-6 font-semibold text-black`}
              >
                Dashboard
              </button>
              <button
                onClick={onLogout}
                className="flex h-12 items-center rounded-2xl border border-white/15 bg-white/5 px-6 text-white"
              >
                {isArtistConsole ? "Logout Artist" : "Logout"}
              </button>
            </>
          ) : (
            <button
              onClick={() => onNavigate("/login")}
              className={`${gradientClass} flex h-12 items-center rounded-2xl px-6 font-semibold text-black`}
            >
              Login / Dashboard
            </button>
          )}
        </div>

        <button
          className="rounded-2xl border border-white/10 p-2 text-white md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu />
        </button>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-white/10 bg-[#0f0918]/95 p-4 md:hidden">
          <div className="space-y-3">
            <button className="block w-full text-left" onClick={() => onNavigate("/")}>Home</button>
            <button className="block w-full text-left" onClick={() => onNavigate("/services")}>Services</button>
            {services.map((item) => (
              <button key={item[1]} className="block w-full text-left pl-4 text-white/70" onClick={() => onNavigate(`/${item[1]}`)}>
                {item[0]}
              </button>
            ))}
            <button className="block w-full text-left" onClick={() => onNavigate("/booker/dashboard")}>Booker</button>
            <button className="block w-full text-left" onClick={() => onNavigate("/artists")}>Artists</button>
            {artistMenus.map((item) => (
              <button key={item[1]} className="block w-full text-left pl-4 text-white/70" onClick={() => onNavigate("/booker/discover")}>
                {item[0]}
              </button>
            ))}
            <button className="block w-full text-left" onClick={() => onNavigate("/celebrity")}>Celebrity</button>
            <button className="block w-full text-left" onClick={() => onNavigate("/social")}>Social</button>
            <button className="block w-full text-left" onClick={() => onNavigate("/verified")}>Verified Artists</button>
            <button className="block w-full text-left" onClick={() => onNavigate("/cities")}>Cities Covered</button>
            <button className="block w-full text-left" onClick={() => onNavigate("/cart")}>Cart ({cartCount})</button>
            {!session ? (
              <button className="block w-full text-left" onClick={() => onNavigate("/login")}>
                Login / Dashboard
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function NotFoundPanel({
  title,
  body,
  onNavigate,
}: {
  title: string;
  body: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <GlassCard className="mx-auto max-w-2xl space-y-4 text-center">
      <div className="text-3xl font-black">{title}</div>
      <div className="text-white/65">{body}</div>
      <div className="flex justify-center">
        <button
          className={`${gradientClass} rounded-2xl px-6 py-3 font-semibold text-black`}
          onClick={() => onNavigate("/")}
        >
          Back to home
        </button>
      </div>
    </GlassCard>
  );
}

function DropdownNav({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        className="flex items-center gap-1 py-2 transition hover:text-white"
      >
        {label}
        <ChevronDown size={14} />
      </button>
      <div
        className={cn(
          "absolute left-0 top-full z-20 w-80 pt-2 transition",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div className="rounded-[1.6rem] border border-white/10 bg-[#0f0918]/95 p-3 shadow-glow backdrop-blur-xl">
          {children}
        </div>
      </div>
    </div>
  );
}

function Wordmark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_30px_rgba(255,94,176,0.18)]">
        <img src="/brand/giggifi-logo.png" alt="GiggiFi logo" className="h-10 w-10 object-contain" />
      </div>
      <div className="text-left">
        <div className="bg-[linear-gradient(135deg,#a53eff,#ff44b7,#ffb13e)] bg-clip-text text-3xl font-black tracking-tight text-transparent">
          GiggiFi
        </div>
        <div className="text-xs text-white/70">Escrow-first entertainment marketplace</div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs uppercase tracking-[0.18em] text-white/40">{children}</div>;
}

function GlassCard({
  className,
  id,
  children,
}: {
  className?: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className={cn("glass-card p-6", className)}>
      {children}
    </div>
  );
}

function StatCard({
  title,
  value,
  note,
  onClick,
}: {
  title: string;
  value: string;
  note: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5 text-left transition hover:-translate-y-1 hover:border-white/20"
    >
      <div className="text-xs uppercase tracking-[0.18em] text-white/40">{title}</div>
      <div className="mt-3 text-2xl font-black text-white">{value}</div>
      <div className="mt-2 text-sm text-white/60">{note}</div>
    </button>
  );
}

function LandingPage({
  artists,
  bookings,
  onAddToCart,
  onNavigate,
  quickRows,
}: {
  artists: ArtistRecord[];
  bookings: BookingRecord[];
  onAddToCart: (artistId: string, occasion?: string, city?: string) => Promise<void>;
  onNavigate: (path: string) => void;
  quickRows: ArtistRecord[];
}) {
  return (
    <div className="space-y-10 md:space-y-14">
      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="space-y-8 pt-4">
          <div className="flex items-center gap-4">
            <img
              src="/brand/giggifi-logo.png"
              alt="GiggiFi"
              className="h-16 w-16 rounded-[1.6rem] border border-white/10 bg-white/5 p-2 object-contain shadow-glow"
            />
            <div className="text-sm uppercase tracking-[0.3em] text-white/50">
              Premium live entertainment marketplace
            </div>
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl text-5xl font-black leading-[0.98] tracking-tight md:text-7xl"
          >
            Discover verified artists, lock bookings in escrow, and run premium events with confidence.
          </motion.h1>
          <p className="max-w-2xl text-lg leading-8 text-white/72">
            GiggiFi pairs premium artist discovery with trust-first booking logic: verified talent,
            transparent platform fees, escrow-held payments, and artist payouts released only after
            successful event completion.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => onNavigate("/booker/discover")}
              className={`${gradientClass} flex h-12 items-center gap-2 rounded-2xl px-6 font-semibold text-black`}
            >
              Explore Artists <ArrowRight size={18} />
            </button>
            <button
              onClick={() => onNavigate("/booker/dashboard")}
              className="flex h-12 items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 text-white"
            >
              <ShieldCheck size={16} />
              Open Booker Journey
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard title="Verified Artists" value="10,000+" note="Open verified roster" onClick={() => onNavigate("/verified")} />
            <StatCard title="Cities Covered" value="25+" note="Explore city-led browsing" onClick={() => onNavigate("/cities")} />
            <StatCard title="Premium Artists Joined" value="300+" note="Luxury and celebrity discovery" onClick={() => onNavigate("/celebrity")} />
          </div>
        </div>

        <div className="space-y-6">
          <GlassCard className="relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,179,64,0.22),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(165,62,255,0.18),transparent_35%)]" />
            <div className="relative space-y-5">
              <Wordmark />
              <div className="grid gap-3">
                {trustPillars.slice(0, 3).map((item) => (
                  <div key={item.title} className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                    <div className="font-semibold text-white">{item.title}</div>
                    <div className="mt-2 text-sm text-white/65">{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
          <QuickBookerPanel artists={quickRows} onAddToCart={onAddToCart} onNavigate={onNavigate} />
        </div>
      </section>

      <div className="overflow-x-auto border-y border-white/8 bg-white/[0.02] py-4">
        <div className="flex min-w-max gap-3">
          {services.map((service) => (
            <button
              key={service[0]}
              onClick={() => onNavigate(`/${service[1]}`)}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-white/70 transition hover:border-white/20 hover:text-white"
            >
              {service[0]}
            </button>
          ))}
        </div>
      </div>

      <section className="space-y-6">
        <div>
          <SectionLabel>Services</SectionLabel>
          <h2 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Built for every premium occasion</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <ImageCard
              key={service[0]}
              image={service[2]}
              title={service[0]}
              subtitle="Curated artists, safe payments, premium execution"
              onClick={() => onNavigate(`/${service[1]}`)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <SectionLabel>Featured Premium</SectionLabel>
          <h2 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Top-rated artists trusted by premium clients</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {artists.slice(0, 3).map((artist) => (
            <ArtistCard key={artist.id} artist={artist} onAddToCart={onAddToCart} onNavigate={onNavigate} />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {trustPillars.map((item) => (
            <GlassCard key={item.title} className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5">
                <Lock size={18} className="text-[#ffb340]" />
              </div>
              <div className="text-lg font-bold">{item.title}</div>
              <p className="text-sm text-white/65">{item.detail}</p>
            </GlassCard>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {clients.map((client) => (
            <div key={client} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              {client}
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <SectionLabel>How It Works — Booker</SectionLabel>
          <div className="mt-4 space-y-4">
            {[
              "Discover artists by city, occasion, category, or premium tier",
              "Pay the full amount plus tax into escrow before the event",
              "Approve successful completion and release payout after platform fees",
            ].map((item, index) => (
              <div key={item} className="flex gap-4 rounded-2xl bg-black/20 p-4">
                <div className={`${gradientClass} flex h-10 w-10 items-center justify-center rounded-2xl font-black text-black`}>
                  {index + 1}
                </div>
                <div className="text-white/80">{item}</div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <SectionLabel>How It Works — Artist</SectionLabel>
          <div className="mt-4 space-y-4">
            {[
              "Complete KYC, upload media, and set occasion-wise pricing",
              "Receive local plus pan-India enquiries and respond with bids",
              "Perform with confidence and receive payout after event completion",
            ].map((item, index) => (
              <div key={item} className="flex gap-4 rounded-2xl bg-black/20 p-4">
                <div className={`${gradientClass} flex h-10 w-10 items-center justify-center rounded-2xl font-black text-black`}>
                  {index + 1}
                </div>
                <div className="text-white/80">{item}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-3">
          {occasions.map((occasion) => (
            <div key={occasion[0]} className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-white/70">
              {occasion[0]}
            </div>
          ))}
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <GlassCard>
          <SectionLabel>Why clients trust GiggiFi</SectionLabel>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[
              "Client pays full amount + tax upfront",
              "Funds move into protected escrow",
              "Artist payout releases after commission + tax deduction",
              "Booking can be tracked and saved to calendar",
            ].map((item) => (
              <div key={item} className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4 text-white/75">
                {item}
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard className="grid gap-6 md:grid-cols-[140px_1fr] md:items-center">
          <img
            src={founderProfile.image}
            alt={founderProfile.name}
            className="h-36 w-36 rounded-[1.8rem] border border-white/10 object-cover"
          />
          <div>
            <SectionLabel>Founder</SectionLabel>
            <div className="mt-2 text-2xl font-black">{founderProfile.name}</div>
            <div className="mt-2 text-white/70">{founderProfile.title}</div>
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-white/65">
              {founderProfile.highlights.map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {testimonials.map((item) => (
          <GlassCard key={item.name}>
            <div className="flex items-center gap-1 text-[#ffb340]">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} size={16} fill="currentColor" />
              ))}
            </div>
            <p className="mt-4 text-white/80">&quot;{item.quote}&quot;</p>
            <div className="mt-5 text-sm font-semibold">{item.name}</div>
            <div className="text-sm text-white/50">{item.eventType}</div>
          </GlassCard>
        ))}
      </section>

      <GlassCard>
        <SectionLabel>Live pipeline</SectionLabel>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {bookings.slice(0, 2).map((booking) => (
            <div key={booking.id} className="rounded-[1.6rem] bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{booking.eventName}</div>
                <div className="text-sm text-[#ffb340]">{bookingStatusLabels[booking.status]}</div>
              </div>
              <div className="mt-2 text-sm text-white/60">{booking.eventType} · {booking.eventCity} · {formatIST(booking.eventDate)}</div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function QuickBookerPanel({
  artists,
  onAddToCart,
  onNavigate,
}: {
  artists: ArtistRecord[];
  onAddToCart: (artistId: string, occasion?: string, city?: string) => Promise<void>;
  onNavigate: (path: string) => void;
}) {
  const [city, setCity] = useState("Mumbai");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const filtered = useMemo(() => {
    const lower = deferredQuery.toLowerCase();
    const cityMatches = artists.filter((artist) => artist.city === city);
    const base = cityMatches.length ? cityMatches : artists;
    return base
      .filter((artist) =>
        [artist.stageName, artist.category, artist.city, artist.genres.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(lower),
      )
      .slice(0, 4);
  }, [artists, city, deferredQuery]);
  const premiumRows = filtered
    .slice()
    .sort((left, right) => right.rating - left.rating || right.basePriceSolo - left.basePriceSolo)
    .slice(0, 3);

  return (
    <GlassCard className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,179,64,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(165,62,255,0.2),transparent_32%)]" />
      <div className="relative space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl font-bold">Quick Booker Panel</div>
            <div className="text-sm text-white/60">Faster shortlists for premium events</div>
          </div>
          <span className="rounded-full bg-[#ffb340]/20 px-3 py-1 text-xs font-medium text-[#ffb340]">Featured</span>
        </div>

        <div className="space-y-3">
          <SectionLabel>Location</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {cityOptions.map((option) => (
              <button
                key={option}
                onClick={() => setCity(option)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm transition",
                  city === option
                    ? `${gradientClass} text-black`
                    : "border border-white/10 bg-white/5 text-white/70",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <SectionLabel>Search</SectionLabel>
          <div className="rounded-[1.5rem] bg-black/20 p-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <Search className="text-[#ffb340]" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full bg-transparent outline-none placeholder:text-white/30"
                placeholder="Search singer, band, dancer, city..."
              />
            </div>
            <div className="mt-3 flex gap-3">
              <button className={`${gradientClass} h-12 rounded-2xl px-6 font-semibold text-black`} onClick={() => onNavigate("/booker/discover")}>
                Search Artists
              </button>
              <button className="h-12 rounded-2xl border border-white/15 bg-white/5 px-6 text-white" onClick={() => onNavigate("/booker/discover")}>
                Start Booking
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <SectionLabel>Featured artists near {city}</SectionLabel>
          <div className="space-y-3">
            {filtered.map((artist) => (
              <div key={artist.id} className="flex items-center gap-4 rounded-[1.5rem] bg-black/20 p-3">
                <img src={artist.profilePhoto} alt={artist.stageName} className="h-14 w-14 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate font-semibold">{artist.stageName}</div>
                    <span className="rounded-full bg-[#ffb340]/20 px-2 py-1 text-[10px] font-medium text-[#ffb340]">{artist.featuredTag}</span>
                  </div>
                  <div className="text-sm text-white/60">{artist.category} · {artist.city}</div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-white/70">
                    <Star size={14} className="text-[#ffb340]" fill="currentColor" />
                    {artist.rating}
                    <span>·</span>
                    <span>{formatINR(artist.basePriceSolo)}</span>
                  </div>
                </div>
                <button className={`${gradientClass} rounded-full px-4 py-2 text-sm font-semibold text-black`} onClick={() => onAddToCart(artist.id, "Wedding", artist.city)}>
                  Add to cart
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <SectionLabel>Premium artists in {city}</SectionLabel>
          <div className="grid gap-3 md:grid-cols-3">
            {premiumRows.map((artist) => (
              <div key={artist.id} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/20">
                <img src={artist.coverPhoto} alt={artist.stageName} className="h-36 w-full object-cover" />
                <div className="space-y-2 p-4">
                  <div className="font-semibold">{artist.stageName}</div>
                  <div className="text-sm text-white/60">{artist.category} · {artist.city}</div>
                  <div className="flex items-center justify-between text-sm text-white/70">
                    <span className="flex items-center gap-1"><Star size={13} fill="currentColor" className="text-[#ffb340]" /> {artist.rating}</span>
                    <span>{formatINR(artist.basePriceSolo)}</span>
                  </div>
                  <button
                    className={`${gradientClass} w-full rounded-2xl px-4 py-2 text-sm font-semibold text-black`}
                    onClick={() => onAddToCart(artist.id, "Wedding", artist.city)}
                  >
                    Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function ImageCard({
  image,
  title,
  subtitle,
  onClick,
}: {
  image: string;
  title: string;
  subtitle: string;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="group relative overflow-hidden rounded-[1.8rem] border border-white/10 text-left transition hover:-translate-y-1">
      <img src={image} alt={title} className="h-72 w-full object-cover transition duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="text-xl font-bold">{title}</div>
        <div className="mt-1 text-sm text-white/70">{subtitle}</div>
      </div>
    </button>
  );
}

function ServicesPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="space-y-8">
      <GlassCard className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <SectionLabel>Services</SectionLabel>
          <h1 className="mt-2 text-4xl font-black md:text-6xl">Occasion-led discovery for premium entertainment bookings.</h1>
          <p className="mt-4 max-w-2xl text-white/70">
            Browse by event type first, then move into city, talent, and trust filters without losing the
            core GiggiFi booking flow.
          </p>
        </div>
        <div className="grid gap-3">
          {trustPillars.slice(0, 2).map((item) => (
            <div key={item.title} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
              <div className="font-semibold">{item.title}</div>
              <div className="mt-2 text-sm text-white/65">{item.detail}</div>
            </div>
          ))}
        </div>
      </GlassCard>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <ImageCard
            key={service[0]}
            image={service[2]}
            title={service[0]}
            subtitle="Book verified artists with escrow-backed payments"
            onClick={() => onNavigate(`/${service[1]}`)}
          />
        ))}
      </div>
    </div>
  );
}

function ServiceDetailPage({
  service,
  artists,
  onAddToCart,
  onNavigate,
}: {
  service: (typeof services)[number];
  artists: ArtistRecord[];
  onAddToCart: (artistId: string, occasion?: string, city?: string) => Promise<void>;
  onNavigate: (path: string) => void;
}) {
  const relevantArtists = artists
    .filter((artist) =>
      [artist.tagline, artist.category, artist.genres.join(" ")].join(" ").toLowerCase().includes(service[0].toLowerCase().split(" ")[0].toLowerCase()),
    )
    .slice(0, 6);
  const fallbackArtists = relevantArtists.length ? relevantArtists : artists.slice(0, 6);
  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10">
        <img src={service[2]} alt={service[0]} className="h-[360px] w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06020b] via-[#06020b]/60 to-transparent" />
        <div className="absolute inset-y-0 left-0 flex max-w-2xl items-center p-8 md:p-12">
          <div>
            <SectionLabel>{service[0]}</SectionLabel>
            <h1 className="mt-2 text-4xl font-black md:text-6xl">{service[0]}</h1>
            <p className="mt-4 text-white/70">
              Premium discovery, transparent escrow, verified artists, and a clear performance-to-payout journey for {service[0].toLowerCase()} bookings.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => onNavigate("/booker/discover")} className={`${gradientClass} rounded-2xl px-6 py-3 font-semibold text-black`}>
                Open Artist Discovery
              </button>
              <button onClick={() => onNavigate("/booker/dashboard")} className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-white">
                Booker Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          "Escrow protection for every confirmed booking",
          "Verified artists with strong platform trust indicators",
          "Platform fee + artist payout communicated clearly",
          "Cancellation and reliability support handled inside GiggiFi",
        ].map((item) => (
          <GlassCard key={item} className="text-sm text-white/70">
            {item}
          </GlassCard>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {fallbackArtists.map((artist) => (
          <ArtistCard key={artist.id} artist={artist} onAddToCart={onAddToCart} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}

function VerifiedArtistsPage({
  artists,
  onAddToCart,
  onNavigate,
}: {
  artists: ArtistRecord[];
  onAddToCart: (artistId: string, occasion?: string, city?: string) => Promise<void>;
  onNavigate: (path: string) => void;
}) {
  const verifiedArtists = artists.filter((artist) => artist.kycStatus === "APPROVED");
  return (
    <div className="space-y-8">
      <GlassCard className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <SectionLabel>Verified Artists</SectionLabel>
          <h1 className="mt-2 text-4xl font-black md:text-6xl">Profiles backed by KYC, media, and trust signals.</h1>
          <p className="mt-4 text-white/70">
            These cards highlight verified artists with visible platform trust indicators so bookers can move
            from discovery to escrow-backed payment with less uncertainty.
          </p>
        </div>
        <div className="grid gap-3">
          {trustPillars.slice(0, 3).map((item) => (
            <div key={item.title} className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
              <div className="font-semibold">{item.title}</div>
              <div className="mt-2 text-sm text-white/65">{item.detail}</div>
            </div>
          ))}
        </div>
      </GlassCard>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {verifiedArtists.map((artist) => (
          <ArtistCard key={artist.id} artist={artist} onAddToCart={onAddToCart} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}

function CitiesCoveredPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="space-y-8">
      <GlassCard className="space-y-4">
        <SectionLabel>Cities Covered</SectionLabel>
        <h1 className="text-4xl font-black md:text-6xl">Premium entertainment discovery across India.</h1>
        <p className="max-w-2xl text-white/70">
          City-led browsing helps bookers find trusted local artists fast, while still opening access to pan-India premium talent where needed.
        </p>
      </GlassCard>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cityShowcase.map((city) => (
          <ImageCard
            key={city.name}
            image={city.image}
            title={city.name}
            subtitle={city.detail}
            onClick={() => onNavigate("/booker/discover")}
          />
        ))}
      </div>
    </div>
  );
}

function CelebrityPage({
  artists,
  onNavigate,
}: {
  artists: ArtistRecord[];
  onNavigate: (path: string) => void;
}) {
  const premiumArtists = artists
    .slice()
    .sort((left, right) => right.basePriceSolo - left.basePriceSolo || right.rating - left.rating)
    .slice(0, 4);
  return (
    <div className="space-y-8">
      <GlassCard className="grid gap-6 lg:grid-cols-[1fr_0.95fr] lg:items-center">
        <div>
          <SectionLabel>Celebrity</SectionLabel>
          <h1 className="mt-2 text-4xl font-black md:text-6xl">Premium artists joined with us.</h1>
          <p className="mt-4 text-white/70">
            A luxury-facing presentation for headline talent, celebrity-format acts, and high-visibility bookings that still sit inside GiggiFi&apos;s trust-first marketplace.
          </p>
          <button onClick={() => onNavigate("/booker/discover")} className={`${gradientClass} mt-6 rounded-2xl px-6 py-3 font-semibold text-black`}>
            Start Premium Discovery
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {celebrityShowcase.map((item) => (
            <ImageCard key={item.name} image={item.image} title={item.name} subtitle={item.detail} />
          ))}
        </div>
      </GlassCard>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {premiumArtists.map((artist) => (
          <GlassCard key={artist.id} className="overflow-hidden p-0">
            <img src={artist.coverPhoto} alt={artist.stageName} className="h-56 w-full object-cover" />
            <div className="space-y-2 p-5">
              <div className="text-xl font-bold">{artist.stageName}</div>
              <div className="text-sm text-white/60">{artist.category} · {artist.city}</div>
              <div className="text-sm text-[#ffb340]">{formatINR(artist.basePriceSolo)}</div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

function SocialPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="space-y-8">
      <GlassCard className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <SectionLabel>Social</SectionLabel>
          <h1 className="mt-2 text-4xl font-black md:text-6xl">Reels, event moments, celebrity highlights, and testimonials.</h1>
          <p className="mt-4 text-white/70">
            Social proof on GiggiFi should feel premium, image-led, and brand-safe while still pushing users back into verified artist discovery and bookings.
          </p>
        </div>
        <div className="grid gap-3">
          {[
            "Artist reels that help bookers trust performance quality",
            "Luxury event moments showing crowd energy and stage presence",
            "Celebrity highlights that elevate the premium marketplace layer",
            "Testimonials that reinforce reliability, trust, and delivery",
          ].map((item) => (
            <div key={item} className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4 text-white/70">
              {item}
            </div>
          ))}
        </div>
      </GlassCard>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {socialShowcase.map((item) => (
          <ImageCard key={item.title} image={item.image} title={item.title} subtitle={item.detail} />
        ))}
      </div>
      <GlassCard className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-2xl font-black">Turn interest into bookings</div>
          <div className="mt-2 text-white/65">Move from social proof into trusted artist discovery and checkout.</div>
        </div>
        <button onClick={() => onNavigate("/booker/discover")} className={`${gradientClass} rounded-2xl px-6 py-3 font-semibold text-black`}>
          Browse Artists
        </button>
      </GlassCard>
    </div>
  );
}

function ArtistCard({
  artist,
  profilePath,
  selectedCity,
  selectedOccasion,
  onAddToCart,
  onNavigate,
}: {
  artist: ArtistRecord;
  profilePath?: string;
  selectedCity?: string;
  selectedOccasion?: string;
  onAddToCart: (artistId: string, occasion?: string, city?: string) => Promise<void>;
  onNavigate: (path: string) => void;
}) {
  const premium = isPremiumArtist(artist);
  return (
    <GlassCard className="group overflow-hidden p-0">
      <div className="relative overflow-hidden">
        <img
          src={artist.profilePhoto}
          alt={artist.stageName}
          className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        <div className="absolute left-4 right-4 top-4 flex flex-wrap gap-2">
          {artist.kycStatus === "APPROVED" ? (
            <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-200">
              Verified
            </span>
          ) : null}
          {premium ? (
            <span className="rounded-full bg-[#ffb340]/20 px-3 py-1 text-xs font-medium text-[#ffb340]">
              Premium
            </span>
          ) : null}
          <span className="rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white/85">
            {artist.featuredTag}
          </span>
        </div>
        <div className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-xs font-medium text-white/90">
          Starting {formatINR(artist.basePriceSolo)}
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-bold">{artist.stageName}</div>
            <div className="mt-1 text-sm text-white/60">{artist.category} · {artist.city}</div>
          </div>
          <div className="flex items-center gap-1 text-sm text-white/80">
            <Star size={14} className="text-[#ffb340]" fill="currentColor" />
            {artist.rating}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[artist.state, ...artist.genres].slice(0, 3).map((genre) => (
            <span key={genre} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              {genre}
            </span>
          ))}
        </div>
        <div className="mt-4 text-sm text-white/65">{artist.tagline}</div>
        <div className="mt-4 text-sm text-white/60">
          {artist.languages.slice(0, 2).join(" • ")} • {artist.performanceTypes.slice(0, 2).join(" • ")}
        </div>
        <div className="mt-5 flex gap-3">
          <button
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white"
            onClick={() => onNavigate(profilePath ?? `/booker/artist/${artist.id}`)}
          >
            View Profile
          </button>
          <button
            className={`${gradientClass} rounded-2xl px-4 py-3 font-semibold text-black`}
            onClick={() =>
              onAddToCart(
                artist.id,
                selectedOccasion ?? "Wedding",
                selectedCity ?? artist.city,
              )
            }
          >
            Book
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

function LoginPage({
  initialPhone,
  nextPath,
  authError,
  authProviders,
  onDone,
}: {
  initialPhone: string;
  nextPath: string | null;
  authError: string | null;
  authProviders: {
    googleEnabled: boolean;
    otpMode: "twilio" | "preview" | "unavailable";
  };
  onDone: (path: string) => Promise<void>;
}) {
  const [phone, setPhone] = useState(initialPhone || "");
  const [otp, setOtp] = useState(Array.from({ length: 6 }, () => ""));
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewOtp, setPreviewOtp] = useState("");
  const otpUnavailable = authProviders.otpMode === "unavailable";
  const googleUnavailable = !authProviders.googleEnabled;

  useEffect(() => {
    if (!countdown) return;
    const timer = window.setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (!authError) {
      return;
    }

    const messages: Record<string, string> = {
      AccessDenied: "Google login was denied. Please try again.",
      Configuration: "Google login is not configured correctly yet.",
      OAuthSignin: "Google sign-in could not be started. Please try again.",
      OAuthAccountNotLinked: "This email is already linked to another sign-in method.",
      OAuthCallback: "Google login could not be completed. Please try again.",
      Signin: "We could not sign you in with Google. Please try again.",
      default: "Login could not be completed. Please try again.",
    };

    setError(messages[authError] ?? messages.default);
  }, [authError]);

  async function sendOtp() {
    if (otpUnavailable) {
      setError("OTP login is not available yet. Add Twilio credentials or use Google login.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await jsonRequest<{
        success: boolean;
        previewOtp?: string;
      }>("/api/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      setOtpSent(true);
      setCountdown(60);
      setPreviewOtp(response.previewOtp ?? "");
      setOtp(Array.from({ length: 6 }, () => ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setLoading(true);
    setError("");
    try {
      const result = await signIn("phone-otp", {
        phone,
        otp: otp.join(""),
        redirect: false,
        callbackUrl: nextPath || "/onboarding/choice",
      });

      if (!result || result.error) {
        throw new Error(
          result?.error === "CredentialsSignin"
            ? "Incorrect or expired OTP."
            : result?.error ?? "Could not verify OTP.",
        );
      }

      await onDone(nextPath || "/onboarding/choice");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify OTP.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl py-12">
      <GlassCard className="space-y-6 p-8 text-center">
        <div className="mx-auto w-fit">
          <Wordmark />
        </div>
        <div>
          <h1 className="text-4xl font-black">Welcome to GiggiFi</h1>
          <p className="mt-3 text-white/70">
            Sign in with OTP or Google. We&apos;ll collect any missing phone or email right after login
            before you choose Booker or Artist.
          </p>
        </div>

        {otpUnavailable ? (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-left text-sm text-amber-100">
            OTP login is currently unavailable on this environment because Twilio Verify is not configured yet.
          </div>
        ) : null}

        <div className="text-left">
          <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">Phone</label>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <span>🇮🇳</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full bg-transparent outline-none placeholder:text-white/30"
              placeholder="9876543210 or +919876543210"
            />
          </div>
          <div className="mt-2 text-xs text-white/45">
            Indian mobile numbers are accepted with or without `+91`.
          </div>
        </div>

        {!otpSent ? (
          <button disabled={loading || otpUnavailable} onClick={sendOtp} className={`${gradientClass} h-12 w-full rounded-2xl font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60`}>
            {loading ? "Sending..." : authProviders.otpMode === "twilio" ? "Get My OTP" : "Get Test OTP"}
          </button>
        ) : (
          <div className="space-y-4 text-left">
            <label className="block text-xs uppercase tracking-[0.18em] text-white/40">OTP</label>
            <div
              className="flex gap-2"
              onPaste={(event) => {
                const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                if (!pasted) return;
                event.preventDefault();
                setOtp((current) =>
                  current.map((_, index) => pasted[index] ?? ""),
                );
              }}
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  value={digit}
                  onChange={(event) => {
                    const value = event.target.value.replace(/\D/g, "").slice(0, 1);
                    setOtp((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
                    if (value && index < 5) {
                      const nextInput = document.getElementById(`otp-${index + 1}`);
                      nextInput?.focus();
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Backspace" && !otp[index] && index > 0) {
                      const prevInput = document.getElementById(`otp-${index - 1}`);
                      prevInput?.focus();
                    }
                  }}
                  id={`otp-${index}`}
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  className="h-14 w-14 rounded-2xl border border-white/10 bg-black/20 text-center text-xl outline-none focus:border-white/20"
                />
              ))}
            </div>
            <button disabled={loading} onClick={verifyOtp} className={`${gradientClass} h-12 w-full rounded-2xl font-semibold text-black`}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <div className="text-sm text-white/60">
              {countdown > 0 ? `Resend OTP in ${countdown}s` : "You can resend OTP now."}
            </div>
            {countdown === 0 ? (
              <button className="text-sm text-[#ffb340]" onClick={sendOtp}>
                Resend OTP
              </button>
            ) : null}
            {previewOtp ? (
              <div className="rounded-2xl border border-[#ffb340]/20 bg-[#ffb340]/10 p-3 text-sm text-[#ffb340]">
                Local preview OTP: <span className="font-bold">{previewOtp}</span>
              </div>
            ) : null}
          </div>
        )}

        <div className="flex items-center gap-3 text-sm text-white/40">
          <div className="h-px flex-1 bg-white/10" />
          or
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          disabled={loading || googleUnavailable}
          className="h-12 w-full rounded-2xl border border-white/15 bg-white/5 text-white disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => {
            if (googleUnavailable) {
              setError("Google login is not configured yet.");
              return;
            }

            void signIn("google", { callbackUrl: nextPath || "/onboarding/choice" });
          }}
        >
          {googleUnavailable ? "Google login unavailable" : "Continue with Google"}
        </button>

        {error ? <div className="text-sm text-red-300">{error}</div> : null}

        <div className="text-xs text-white/40">
          By continuing you agree to our Terms of Service and Privacy Policy
        </div>
      </GlassCard>
    </div>
  );
}

function ContactCompletionPage({
  session,
  authProviders,
  nextPath,
  onDone,
}: {
  session: SessionPayload | null;
  authProviders: {
    googleEnabled: boolean;
    otpMode: "twilio" | "preview" | "unavailable";
  };
  nextPath: string | null;
  onDone: (path: string) => Promise<void>;
}) {
  const [name, setName] = useState(session?.name ?? "");
  const [email, setEmail] = useState(session?.email ?? "");
  const [phone, setPhone] = useState(session?.phone ?? "");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(Boolean(session?.phone));
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewOtp, setPreviewOtp] = useState("");
  const otpUnavailable = authProviders.otpMode === "unavailable";
  const missingPhone = !session?.phone;
  const missingEmail = !session?.email;

  useEffect(() => {
    if (!countdown) return;
    const timer = window.setTimeout(() => setCountdown((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  async function sendPhoneOtp() {
    if (otpUnavailable) {
      setError("Phone verification is not configured yet on this environment.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await jsonRequest<{
        success: boolean;
        previewOtp?: string;
      }>("/api/auth/contact/send-phone-otp", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });

      setOtpSent(true);
      setCountdown(60);
      setPreviewOtp(response.previewOtp ?? "");
      setOtp("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyPhone() {
    setLoading(true);
    setError("");

    try {
      const response = await jsonRequest<{ redirect: string }>("/api/auth/contact/verify-phone", {
        method: "POST",
        body: JSON.stringify({ phone, otp, nextPath }),
      });
      await onDone(response.redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify phone.");
    } finally {
      setLoading(false);
    }
  }

  async function saveEmail() {
    setLoading(true);
    setError("");

    try {
      const response = await jsonRequest<{ redirect: string }>("/api/auth/contact", {
        method: "POST",
        body: JSON.stringify({ email, name, nextPath }),
      });
      await onDone(response.redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl py-10">
      <GlassCard className="space-y-8 p-8 md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <SectionLabel>Mandatory contact completion</SectionLabel>
            <h1 className="text-4xl font-black">Finish your GiggiFi contact identity</h1>
            <p className="max-w-2xl text-white/70">
              Login only proves who you are. Before choosing Booker or Artist, we need both your
              phone number and your email saved on the same base account.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-4 text-sm text-white/70">
            <div className="font-semibold text-white">What happens next</div>
            <div className="mt-2">1. Complete missing contact details</div>
            <div>2. Choose Booker or Artist</div>
            <div>3. Continue to the right dashboard or onboarding flow</div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-black/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold">Email address</div>
                <div className="mt-2 text-sm text-white/55">
                  Required for receipts, account recovery, and booking communication.
                </div>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
                  missingEmail ? "bg-amber-400/15 text-amber-200" : "bg-emerald-400/15 text-emerald-200",
                )}
              >
                {missingEmail ? "Missing" : "Saved"}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <Field label="Full name" value={name} onChange={setName} />
              <Field label="Email" value={email} onChange={setEmail} />
              {missingEmail ? (
                <button
                  disabled={loading}
                  className={`${gradientClass} w-full rounded-2xl px-5 py-3 font-semibold text-black`}
                  onClick={saveEmail}
                >
                  {loading ? "Saving..." : "Save Email"}
                </button>
              ) : (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                  {email}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-black/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold">Phone number</div>
                <div className="mt-2 text-sm text-white/55">
                  Required for OTP login, urgent booking communication, and trust checks.
                </div>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
                  missingPhone ? "bg-amber-400/15 text-amber-200" : "bg-emerald-400/15 text-emerald-200",
                )}
              >
                {missingPhone ? "Missing" : "Verified"}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <Field label="Phone" value={phone} onChange={setPhone} />
              {missingPhone ? (
                <>
                  {!otpSent ? (
                    <button
                      disabled={loading || otpUnavailable}
                      className={`${gradientClass} w-full rounded-2xl px-5 py-3 font-semibold text-black disabled:opacity-60`}
                      onClick={sendPhoneOtp}
                    >
                      {loading ? "Sending..." : "Send OTP"}
                    </button>
                  ) : (
                    <>
                      <Field
                        label="Enter OTP"
                        value={otp}
                        onChange={setOtp}
                        hint={countdown > 0 ? `Resend OTP in ${countdown}s` : "You can resend OTP now."}
                      />
                      <button
                        disabled={loading}
                        className={`${gradientClass} w-full rounded-2xl px-5 py-3 font-semibold text-black`}
                        onClick={verifyPhone}
                      >
                        {loading ? "Verifying..." : "Verify Phone"}
                      </button>
                      {countdown === 0 ? (
                        <button className="text-sm text-[#ffb340]" onClick={sendPhoneOtp}>
                          Resend OTP
                        </button>
                      ) : null}
                      {previewOtp ? (
                        <div className="rounded-2xl border border-[#ffb340]/20 bg-[#ffb340]/10 p-3 text-sm text-[#ffb340]">
                          Local preview OTP: <span className="font-bold">{previewOtp}</span>
                        </div>
                      ) : null}
                    </>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                  {phone}
                </div>
              )}
            </div>
          </div>
        </div>

        {error ? <div className="text-sm text-red-300">{error}</div> : null}
      </GlassCard>
    </div>
  );
}

function ChoicePage({
  session,
  nextPath,
  onDone,
}: {
  session: SessionPayload | null;
  nextPath: string | null;
  onDone: (path: string) => Promise<void>;
}) {
  const [loadingRole, setLoadingRole] = useState<"ARTIST" | "BOOKER" | null>(null);
  const [error, setError] = useState("");

  async function selectRole(role: "ARTIST" | "BOOKER") {
    setLoadingRole(role);
    setError("");

    try {
      const response = await jsonRequest<{ redirect: string }>("/api/onboarding/role", {
        method: "POST",
        body: JSON.stringify({ role, nextPath }),
      });
      await onDone(response.redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not continue to the selected role.");
    } finally {
      setLoadingRole(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col items-center justify-center gap-8 py-12">
      <Wordmark />
      <div className="text-center">
        <h1 className="text-5xl font-black">How do you want to use GiggiFi?</h1>
        <p className="mt-4 text-white/70">
          Your phone and email are now secured on one account. Choose the experience you want to
          continue with.
        </p>
      </div>
      <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60">
        Signed in as {session?.email || session?.phone || "GiggiFi user"}
      </div>
      <div className="grid w-full gap-6 md:grid-cols-2">
        <RoleCard
          title="I want to Book Artists"
          description="Discover and hire verified artists for your events with escrow-protected payments"
          bullets={[
            "Browse 500+ verified artists",
            "Send event enquiries",
            "Instant booking available",
            "Escrow-protected payments",
          ]}
          gradient
          cta="Continue as Booker"
          icon={<CalendarDays size={26} />}
          loading={loadingRole === "BOOKER"}
          onClick={() => selectRole("BOOKER")}
        />
        <RoleCard
          title="I'm an Artist"
          description="List your talent and start receiving paid bookings"
          bullets={[
            "Free profile listing",
            "Receive direct booking requests",
            "Set your own pricing",
            "Guaranteed escrow payouts",
          ]}
          cta="Continue as Artist"
          icon={<Mic2 size={26} />}
          loading={loadingRole === "ARTIST"}
          onClick={() => selectRole("ARTIST")}
        />
      </div>
      {error ? <div className="text-sm text-red-300">{error}</div> : null}
      <div className="text-center text-sm text-white/50">
        Returning users go straight to their existing dashboard. New users continue into the right
        onboarding flow automatically.
      </div>
    </div>
  );
}

function RoleCard({
  title,
  description,
  bullets,
  cta,
  icon,
  onClick,
  gradient,
  loading,
}: {
  title: string;
  description: string;
  bullets: string[];
  cta: string;
  icon: React.ReactNode;
  onClick: () => void;
  gradient?: boolean;
  loading?: boolean;
}) {
  return (
    <GlassCard className="h-full p-8">
      <div className={cn("mb-6 flex h-16 w-16 items-center justify-center rounded-full text-white", gradient ? gradientClass : "bg-[#ffb340]/20 text-[#ffb340]")}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold">{title}</h3>
      <p className="mt-3 text-white/70">{description}</p>
      <div className="mt-6 space-y-3">
        {bullets.map((bullet) => (
          <div key={bullet} className="flex items-center gap-3 text-white/80">
            <span className={`${gradientClass} flex h-6 w-6 items-center justify-center rounded-full text-black`}>
              <Check size={14} />
            </span>
            {bullet}
          </div>
        ))}
      </div>
      <button
        onClick={onClick}
        disabled={loading}
        className={cn(
          "mt-8 h-12 w-full rounded-2xl px-6 font-semibold disabled:cursor-not-allowed disabled:opacity-60",
          gradient ? `${gradientClass} text-black` : "border border-white/15 bg-white/5 text-white",
        )}
      >
        {loading ? "Continuing..." : cta}
      </button>
    </GlassCard>
  );
}

function ArtistOnboardingPage({
  phone,
  nextPath,
  onDone,
}: {
  phone: string | null;
  nextPath: string | null;
  onDone: (path: string) => Promise<void>;
}) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<any>({
    legalName: "Sachin Chaudhary",
    stageName: "SACH",
    dateOfBirth: "1998-01-01",
    gender: "Prefer not to say",
    profilePhoto: "https://picsum.photos/seed/giggifi-artist-profile/800/800",
    coverPhoto: "https://picsum.photos/seed/giggifi-artist-cover/1600/900",
    city: "Mumbai",
    state: "Maharashtra",
    serviceableStates: ["Maharashtra", "Goa"],
    category: "Singer-Guitarist",
    subcategory: ["Live Singer"],
    genres: ["Bollywood", "Sufi"],
    languages: ["Hindi", "English"],
    performanceTypes: ["Solo", "Acoustic"],
    yearsExperience: 4,
    bio: "Premium live singer-guitarist for weddings, cocktail evenings, private celebrations, and curated corporate events across India.",
    notableClients: "Taj, Marriott, premium private weddings, curated lounges",
    portfolioPhotos: [
      "https://picsum.photos/seed/onboard-1/1200/900",
      "https://picsum.photos/seed/onboard-2/1200/900",
      "https://picsum.photos/seed/onboard-3/1200/900",
    ],
    portfolioVideos: ["https://samplelib.com/lib/preview/mp4/sample-5s.mp4"],
    audioSamples: ["https://samplelib.com/lib/preview/mp3/sample-3s.mp3"],
    packages: packageLabels.map((title, index) => ({
      title,
      description:
        index === 0
          ? "Live solo performance for weddings, cocktails, intimate gatherings"
          : title,
      price: [25000, 42000, 65000, 90000][index],
    })),
    travelIncluded: "NEGOTIABLE",
    accommodationNeeded: true,
    minAdvanceBooking: 7,
    blackoutDates: [],
    availableWeekdays: true,
    availableWeekends: true,
    instagramUrl: "https://instagram.com/giggifi",
    youtubeUrl: "https://youtube.com/@giggifi",
    spotifyUrl: "",
    facebookUrl: "",
    websiteUrl: "",
    aadhaarNumber: "123412341234",
    panNumber: "ABCDE1234F",
    gstNumber: "",
    bankAccountNumber: "123456789012",
    confirmBankAccountNumber: "123456789012",
    bankIFSC: "HDFC0001234",
    bankAccountName: "Sachin Chaudhary",
    agreements: {
      artistAgreement: true,
      cancellationPolicy: true,
      escrowTerms: true,
      privacyPolicy: true,
    },
  });

  useEffect(() => {
    let active = true;

    async function loadDraft() {
      try {
        const response = await jsonRequest<{ draft: { step: number; data: Record<string, unknown> } | null }>("/api/onboarding/draft");
        if (!active || !response.draft) return;
        setStep(response.draft.step || 1);
        setForm((current: Record<string, unknown>) => ({
          ...current,
          ...response.draft?.data,
          agreements: {
            ...(current.agreements as Record<string, boolean>),
            ...((response.draft?.data?.agreements as Record<string, boolean> | undefined) ?? {}),
          },
        }));
      } catch {
        return;
      }
    }

    void loadDraft();

    return () => {
      active = false;
    };
  }, []);

  async function saveDraft(nextStep = step) {
    await jsonRequest("/api/onboarding/draft", {
      method: "POST",
      body: JSON.stringify({
        role: "ARTIST",
        step: nextStep,
        data: form,
      }),
    });
  }

  async function submitFinal() {
    setSaving(true);
    setError("");
    try {
      const response = await jsonRequest<{ success: boolean; redirect: string; artistId?: string; profilePath?: string }>(
        "/api/onboarding",
        {
          method: "POST",
          body: JSON.stringify({ role: "ARTIST", payload: form, nextPath }),
        },
      );
      await onDone(response.redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create artist account.");
    } finally {
      setSaving(false);
    }
  }

  async function next() {
    setSaving(true);
    try {
      await saveDraft(step);
      setStep(Math.min(7, step + 1));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <SectionLabel>Artist onboarding</SectionLabel>
            <div className="mt-2 text-2xl font-black">Step {step} of 7</div>
          </div>
          <div className="text-sm text-white/60">{phone}</div>
        </div>
        <div className="h-3 rounded-full bg-white/5">
          <div className={`${gradientClass} h-3 rounded-full`} style={{ width: `${(step / 7) * 100}%` }} />
        </div>
      </GlassCard>

      <GlassCard className="space-y-6">
        {step === 1 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Legal full name" value={form.legalName} onChange={(value) => setForm({ ...form, legalName: value })} hint="Used only for KYC and contracts. Bookers see your stage name." />
            <Field label="Stage / artist name" value={form.stageName} onChange={(value) => setForm({ ...form, stageName: value })} />
            <Field label="Date of birth" type="date" value={form.dateOfBirth} onChange={(value) => setForm({ ...form, dateOfBirth: value })} />
            <Field label="Gender" value={form.gender} onChange={(value) => setForm({ ...form, gender: value })} />
            <Field label="Profile photo URL" value={form.profilePhoto} onChange={(value) => setForm({ ...form, profilePhoto: value })} />
            <Field label="Cover/banner photo URL" value={form.coverPhoto} onChange={(value) => setForm({ ...form, coverPhoto: value })} />
            <Field label="City" value={form.city} onChange={(value) => setForm({ ...form, city: value })} />
            <Field label="State" value={form.state} onChange={(value) => setForm({ ...form, state: value })} />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <Field label="Primary category" value={form.category} onChange={(value) => setForm({ ...form, category: value })} />
            <ChipSelector values={form.genres} options={genreOptions} onChange={(values) => setForm({ ...form, genres: values })} label="Genres" />
            <ChipSelector values={form.languages} options={languageOptions} onChange={(values) => setForm({ ...form, languages: values })} label="Languages performed" />
            <ChipSelector values={form.performanceTypes} options={performanceOptions} onChange={(values) => setForm({ ...form, performanceTypes: values })} label="Performance types" />
            <Field label="Years of experience" type="number" value={String(form.yearsExperience)} onChange={(value) => setForm({ ...form, yearsExperience: Number(value) })} />
            <TextAreaField label="Bio" value={form.bio} onChange={(value) => setForm({ ...form, bio: value })} hint={`${form.bio.length}/500`} />
            <TextAreaField label="Notable past clients or events" value={form.notableClients} onChange={(value) => setForm({ ...form, notableClients: value })} />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5">
            <TextAreaField label="Profile photos URLs (comma separated)" value={form.portfolioPhotos.join(", ")} onChange={(value) => setForm({ ...form, portfolioPhotos: value.split(",").map((item) => item.trim()).filter(Boolean) })} hint="Artists with videos get 3x more enquiries. Upload at least one performance video." />
            <TextAreaField label="Performance video URLs (comma separated)" value={form.portfolioVideos.join(", ")} onChange={(value) => setForm({ ...form, portfolioVideos: value.split(",").map((item) => item.trim()).filter(Boolean) })} />
            <TextAreaField label="Audio sample URLs (comma separated)" value={form.audioSamples.join(", ")} onChange={(value) => setForm({ ...form, audioSamples: value.split(",").map((item) => item.trim()).filter(Boolean) })} />
          </div>
        ) : null}

        {step === 4 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {form.packages.map((pkg: any, index: number) => (
              <div key={pkg.title} className="rounded-[1.5rem] bg-black/20 p-4">
                <div className="font-bold">{pkg.title}</div>
                <div className="mt-2 text-sm text-white/60">{pkg.description}</div>
                <Field label="Price in INR" type="number" value={String(pkg.price)} onChange={(value) => {
                  const packages = [...form.packages];
                  packages[index] = { ...packages[index], price: Number(value) };
                  setForm({ ...form, packages });
                }} />
              </div>
            ))}
          </div>
        ) : null}

        {step === 5 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Instagram" value={form.instagramUrl} onChange={(value) => setForm({ ...form, instagramUrl: value })} />
            <Field label="YouTube" value={form.youtubeUrl} onChange={(value) => setForm({ ...form, youtubeUrl: value })} />
            <Field label="Spotify" value={form.spotifyUrl} onChange={(value) => setForm({ ...form, spotifyUrl: value })} />
            <Field label="Facebook" value={form.facebookUrl} onChange={(value) => setForm({ ...form, facebookUrl: value })} />
            <Field label="Website" value={form.websiteUrl} onChange={(value) => setForm({ ...form, websiteUrl: value })} />
          </div>
        ) : null}

        {step === 6 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Aadhaar number" value={form.aadhaarNumber} onChange={(value) => setForm({ ...form, aadhaarNumber: value })} />
            <Field label="PAN number" value={form.panNumber} onChange={(value) => setForm({ ...form, panNumber: value })} />
            <Field label="GST number" value={form.gstNumber} onChange={(value) => setForm({ ...form, gstNumber: value })} />
            <Field label="Bank account number" value={form.bankAccountNumber} onChange={(value) => setForm({ ...form, bankAccountNumber: value })} />
            <Field label="Confirm bank account number" value={form.confirmBankAccountNumber} onChange={(value) => setForm({ ...form, confirmBankAccountNumber: value })} />
            <Field label="IFSC" value={form.bankIFSC} onChange={(value) => setForm({ ...form, bankIFSC: value })} />
            <Field label="Account holder name" value={form.bankAccountName} onChange={(value) => setForm({ ...form, bankAccountName: value })} />
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-sm text-white/70">
              <div className="mb-2 flex items-center gap-2 text-[#ffb340]"><Lock size={16} /> Security notice</div>
              Sensitive KYC details stay restricted to internal verification and operational review.
            </div>
          </div>
        ) : null}

        {step === 7 ? (
          <div className="space-y-4">
            {[
              ["artistAgreement", "Platform Artist Agreement"],
              ["cancellationPolicy", "Cancellation and Refund Policy"],
              ["escrowTerms", "Escrow and Payout Terms"],
              ["privacyPolicy", "Privacy Policy and Data Usage"],
            ].map(([key, label]) => (
              <Accordion.Root key={key} type="single" collapsible>
                <Accordion.Item value={key} className="rounded-[1.5rem] border border-white/10 bg-black/20">
                  <Accordion.Trigger className="flex w-full items-center justify-between px-5 py-4 text-left">
                    <span>{label}</span>
                    <ChevronDown size={16} />
                  </Accordion.Trigger>
                  <Accordion.Content className="px-5 pb-4 text-sm text-white/60">
                    Plain English summary: GiggiFi protects the client experience while guaranteeing transparent escrow rules for artists. We don&apos;t use pre-checked boxes. Please read and check each agreement individually.
                  </Accordion.Content>
                </Accordion.Item>
              </Accordion.Root>
            ))}
            <div className="space-y-3">
              {Object.entries(form.agreements).map(([key, value]) => (
                <label key={key} className="flex items-center gap-3 text-white/80">
                  <input type="checkbox" checked={Boolean(value)} onChange={(event) => setForm({ ...form, agreements: { ...form.agreements, [key]: event.target.checked } })} />
                  {key}
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {error ? <div className="text-sm text-red-300">{error}</div> : null}

        <div className="flex items-center justify-between">
          {step > 1 ? (
            <button className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-white" onClick={() => setStep(step - 1)}>
              Back
            </button>
          ) : (
            <div />
          )}
          {step < 7 ? (
            <button disabled={saving} className={`${gradientClass} rounded-2xl px-6 py-3 font-semibold text-black`} onClick={next}>
              {saving ? "Saving..." : "Save & Continue"}
            </button>
          ) : (
            <button
              disabled={saving || !Object.values(form.agreements).every(Boolean)}
              className={`${gradientClass} rounded-2xl px-6 py-3 font-semibold text-black disabled:opacity-50`}
              onClick={submitFinal}
            >
              {saving ? "Creating..." : "Create My Artist Account"}
            </button>
          )}
        </div>
        <div className="text-xs text-white/45">
          The final step now creates the artist account, profile, and dashboard immediately after submission.
        </div>
      </GlassCard>
    </div>
  );
}

function BookerOnboardingPage({
  phone,
  email,
  name,
  nextPath,
  onDone,
}: {
  phone: string | null;
  email: string | null;
  name: string | null;
  nextPath: string | null;
  onDone: (path: string) => Promise<void>;
}) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<any>({
    fullName: name ?? "",
    email: email ?? "",
    companyName: "",
    bookerType: "INDIVIDUAL",
    city: "Mumbai",
    state: "Maharashtra",
    howHeard: "",
    terms: { service: false, escrow: false },
  });

  useEffect(() => {
    let active = true;

    async function loadDraft() {
      try {
        const response = await jsonRequest<{ draft: { step: number; data: Record<string, unknown> } | null }>("/api/onboarding/draft");
        if (!active || !response.draft) return;
        setStep(response.draft.step || 1);
        setForm((current: Record<string, unknown>) => ({
          ...current,
          ...response.draft?.data,
          terms: {
            ...(current.terms as Record<string, boolean>),
            ...((response.draft?.data?.terms as Record<string, boolean> | undefined) ?? {}),
          },
        }));
      } catch {
        return;
      }
    }

    void loadDraft();

    return () => {
      active = false;
    };
  }, []);

  async function saveDraft(nextStep = step) {
    await jsonRequest("/api/onboarding/draft", {
      method: "POST",
      body: JSON.stringify({
        role: "BOOKER",
        step: nextStep,
        data: form,
      }),
    });
  }

  async function next() {
    setSaving(true);
    try {
      await saveDraft(step);
      setStep(Math.min(3, step + 1));
    } finally {
      setSaving(false);
    }
  }

  async function submitFinal() {
    setSaving(true);
    setError("");
    try {
      const response = await jsonRequest<{ redirect: string }>("/api/onboarding", {
        method: "POST",
        body: JSON.stringify({ role: "BOOKER", payload: form, nextPath }),
      });
      await onDone(response.redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create booker account.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <SectionLabel>Booker onboarding</SectionLabel>
            <div className="mt-2 text-2xl font-black">Step {step} of 3</div>
          </div>
          <div className="text-sm text-emerald-300">Phone verified {phone}</div>
        </div>
        <div className="h-3 rounded-full bg-white/5">
          <div className={`${gradientClass} h-3 rounded-full`} style={{ width: `${(step / 3) * 100}%` }} />
        </div>
      </GlassCard>
      <GlassCard className="space-y-6">
        {step === 1 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name" value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} />
            <Field label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          </div>
        ) : null}
        {step === 2 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Company / org name" value={form.companyName} onChange={(value) => setForm({ ...form, companyName: value })} />
            <Field label="City" value={form.city} onChange={(value) => setForm({ ...form, city: value })} />
            <Field label="State" value={form.state} onChange={(value) => setForm({ ...form, state: value })} />
            <Field label="How did you hear about us" value={form.howHeard} onChange={(value) => setForm({ ...form, howHeard: value })} />
            <div className="md:col-span-2">
              <SectionLabel>Booker type</SectionLabel>
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                {["INDIVIDUAL", "CORPORATE", "PLANNER", "AGENCY"].map((type) => (
                  <button key={type} onClick={() => setForm({ ...form, bookerType: type })} className={cn("rounded-[1.5rem] border p-4 text-left", form.bookerType === type ? `${gradientClass} border-transparent text-black` : "border-white/10 bg-white/5 text-white")}>
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
        {step === 3 ? (
          <div className="space-y-4">
            <label className="flex items-center gap-3 text-white/80">
              <input type="checkbox" checked={form.terms.service} onChange={(event) => setForm({ ...form, terms: { ...form.terms, service: event.target.checked } })} />
              Booker Terms of Service
            </label>
            <label className="flex items-center gap-3 text-white/80">
              <input type="checkbox" checked={form.terms.escrow} onChange={(event) => setForm({ ...form, terms: { ...form.terms, escrow: event.target.checked } })} />
              Payment and Escrow Policy
            </label>
          </div>
        ) : null}
        {error ? <div className="text-sm text-red-300">{error}</div> : null}
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <button className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-white" onClick={() => setStep(step - 1)}>
              Back
            </button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <button className={`${gradientClass} rounded-2xl px-6 py-3 font-semibold text-black`} onClick={next}>
              Save & Continue
            </button>
          ) : (
            <button disabled={saving} className={`${gradientClass} rounded-2xl px-6 py-3 font-semibold text-black`} onClick={submitFinal}>
              Start Booking Artists
            </button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

function BookerDashboardPage({
  artists,
  cartArtistCount,
  onAddToCart,
  onNavigate,
}: {
  artists: ArtistRecord[];
  cartArtistCount: number;
  onAddToCart: (artistId: string, occasion?: string, city?: string) => Promise<void>;
  onNavigate: (path: string) => void;
}) {
  return (
    <BookerDiscoveryWorkspace
      artists={artists}
      cartArtistCount={cartArtistCount}
      mode="dashboard"
      onAddToCart={onAddToCart}
      onNavigate={onNavigate}
    />
  );
}

function DiscoverPage({
  artists,
  cartArtistCount,
  onAddToCart,
  onNavigate,
}: {
  artists: ArtistRecord[];
  cartArtistCount: number;
  onAddToCart: (artistId: string, occasion?: string, city?: string) => Promise<void>;
  onNavigate: (path: string) => void;
}) {
  return (
    <BookerDiscoveryWorkspace
      artists={artists}
      cartArtistCount={cartArtistCount}
      mode="discover"
      onAddToCart={onAddToCart}
      onNavigate={onNavigate}
    />
  );
}

function BookerDiscoveryWorkspace({
  artists,
  cartArtistCount,
  mode,
  onAddToCart,
  onNavigate,
}: {
  artists: ArtistRecord[];
  cartArtistCount: number;
  mode: "dashboard" | "discover";
  onAddToCart: (artistId: string, occasion?: string, city?: string) => Promise<void>;
  onNavigate: (path: string) => void;
}) {
  const [city, setCity] = useState("Mumbai");
  const [query, setQuery] = useState("");
  const [selectedOccasionLabel, setSelectedOccasionLabel] = useState(
    occasionOptions[2]?.label ?? "Wedding",
  );
  const deferredQuery = useDeferredValue(query);
  const selectedOccasion = getOccasionOption(selectedOccasionLabel);
  const filteredArtists = useMemo(
    () => artists.filter((artist) => matchesArtistSearch(artist, deferredQuery)),
    [artists, deferredQuery],
  );
  const localArtists = useMemo(
    () => filteredArtists.filter((artist) => artist.city === city),
    [city, filteredArtists],
  );
  const localFeaturedArtists = useMemo(
    () =>
      (localArtists.length ? localArtists : filteredArtists)
        .slice()
        .sort(
          (left, right) =>
            Number(isPremiumArtist(right)) - Number(isPremiumArtist(left)) ||
            right.rating - left.rating ||
            right.totalBookings - left.totalBookings,
        )
        .slice(0, 6),
    [filteredArtists, localArtists],
  );
  const premiumArtists = useMemo(
    () =>
      filteredArtists
        .filter(isPremiumArtist)
        .slice()
        .sort(
          (left, right) =>
            right.rating - left.rating || right.basePriceSolo - left.basePriceSolo,
        )
        .slice(0, 6),
    [filteredArtists],
  );
  const panIndiaArtists = useMemo(
    () =>
      filteredArtists
        .filter(
          (artist) =>
            artist.city !== city || artist.serviceableStates.length > 1,
        )
        .slice()
        .sort(
          (left, right) =>
            right.serviceableStates.length - left.serviceableStates.length ||
            right.rating - left.rating,
        )
        .slice(0, 6),
    [city, filteredArtists],
  );
  const paymentPath = cartArtistCount > 0 ? "/payment" : "/cart";
  const heroTitle =
    mode === "dashboard"
      ? "Search artists, shortlist faster, and move into escrow-backed payment."
      : "Discover local, featured, and pan-India artists in one booker flow.";
  const heroSubtitle =
    mode === "dashboard"
      ? "Your Booker Dashboard is now the main working discovery page. Search by artist, category, city, area, or Pan India, then move straight into cart and payment."
      : "Use the same Booker discovery engine to compare premium profiles, open artist pages, and move directly into cart and payment.";

  return (
    <div className="space-y-6">
      <GlassCard className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div>
            <SectionLabel>
              {mode === "dashboard" ? "Booker Dashboard" : "Booker Discovery"}
            </SectionLabel>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">{heroTitle}</h1>
            <p className="mt-4 max-w-3xl text-white/70">{heroSubtitle}</p>
          </div>
          <div className="rounded-[1.7rem] border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <Search size={18} className="text-[#ffb340]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search artist, category, city, area or Pan India"
                className="w-full bg-transparent outline-none placeholder:text-white/30"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {cityOptions.map((item) => (
                <button
                  key={item}
                  onClick={() => setCity(item)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm",
                    city === item
                      ? `${gradientClass} text-black`
                      : "border border-white/10 bg-white/5 text-white/70",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div>
            <SectionLabel>Occasion selector</SectionLabel>
            <div className="mt-3 flex flex-wrap gap-2">
              {occasionOptions.map((occasion) => (
                <button
                  key={occasion.label}
                  onClick={() => setSelectedOccasionLabel(occasion.label)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm",
                    selectedOccasion.label === occasion.label
                      ? `${gradientClass} text-black`
                      : "border border-white/10 bg-white/5 text-white/70",
                  )}
                >
                  {occasion.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className={`${gradientClass} rounded-2xl px-6 py-3 font-semibold text-black`}
              onClick={() => onNavigate("/cart")}
            >
              Proceed to Cart
            </button>
            <button
              className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-white"
              onClick={() => onNavigate(paymentPath)}
            >
              Proceed to Payment
            </button>
            <button
              className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-white"
              onClick={() => onNavigate(`/${selectedOccasion.pageKey}`)}
            >
              Browse {selectedOccasion.label}
            </button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
          <StatCard
            title="Occasion"
            value={selectedOccasion.label}
            note={`Routes into ${selectedOccasion.pageKey}`}
          />
          <StatCard
            title="Selected city"
            value={city}
            note="Local artists are prioritized first"
          />
          <StatCard
            title="Artists in cart"
            value={String(cartArtistCount)}
            note="Open cart and payment summary"
            onClick={() => onNavigate("/cart")}
          />
          <StatCard
            title="Results"
            value={String(filteredArtists.length)}
            note="Search, compare, and open artist profiles"
          />
        </div>
      </GlassCard>

      <BookerArtistSection
        title={`Local / Featured artists in ${city}`}
        subtitle={`Artists suited for ${selectedOccasion.label.toLowerCase()} with premium trust signals and direct booking access.`}
        artists={localFeaturedArtists}
        emptyMessage={`No local artists matched this search in ${city}. Try another city or clear the search.`}
        selectedOccasion={selectedOccasion.label}
        selectedCity={city}
        onAddToCart={onAddToCart}
        onNavigate={onNavigate}
      />

      <BookerArtistSection
        title="Premium artists"
        subtitle="High-trust profiles with strong ratings, premium positioning, and faster shortlisting."
        artists={premiumArtists}
        emptyMessage="No premium artists matched this search yet."
        selectedOccasion={selectedOccasion.label}
        selectedCity={city}
        onAddToCart={onAddToCart}
        onNavigate={onNavigate}
      />

      <BookerArtistSection
        title="Pan-India artists"
        subtitle="Artists available beyond the selected city for destination events and wider search coverage."
        artists={panIndiaArtists}
        emptyMessage="No pan-India artists matched this search yet."
        selectedOccasion={selectedOccasion.label}
        selectedCity={city}
        onAddToCart={onAddToCart}
        onNavigate={onNavigate}
      />

      <EscrowExplainer />
    </div>
  );
}

function BookerArtistSection({
  title,
  subtitle,
  artists,
  emptyMessage,
  selectedOccasion,
  selectedCity,
  onAddToCart,
  onNavigate,
}: {
  title: string;
  subtitle: string;
  artists: ArtistRecord[];
  emptyMessage: string;
  selectedOccasion: string;
  selectedCity: string;
  onAddToCart: (artistId: string, occasion?: string, city?: string) => Promise<void>;
  onNavigate: (path: string) => void;
}) {
  return (
    <GlassCard className="space-y-5">
      <div>
        <SectionLabel>{title}</SectionLabel>
        <div className="mt-2 text-2xl font-black">{title}</div>
        <p className="mt-2 text-white/65">{subtitle}</p>
      </div>
      {!artists.length ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6 text-white/70">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {artists.map((artist) => (
            <ArtistCard
              key={artist.id}
              artist={artist}
              profilePath={buildBookerArtistProfilePath(artist.id, {
                occasion: selectedOccasion,
                city: selectedCity,
              })}
              selectedCity={selectedCity}
              selectedOccasion={selectedOccasion}
              onAddToCart={(artistId, _, artistCity) =>
                onAddToCart(artistId, selectedOccasion, artistCity)
              }
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </GlassCard>
  );
}

function EscrowExplainer() {
  return (
    <GlassCard className="space-y-5">
      <div>
        <SectionLabel>Escrow payment logic</SectionLabel>
        <div className="mt-2 text-2xl font-black">
          GiggiFi holds the client payment first, then settles the artist after the event.
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          "Client pays the full amount plus tax before the event.",
          "Payment moves into escrow instead of going straight to the artist.",
          "After successful performance, GiggiFi releases the payout to the artist.",
          "Commission and tax are deducted before the final artist settlement is completed.",
        ].map((item) => (
          <div
            key={item}
            className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-sm text-white/75"
          >
            {item}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function ArtistProfilePage({
  artist,
  reviews,
  onAddToCart,
  onNavigate,
}: {
  artist: ArtistRecord;
  reviews: ReviewRecord[];
  onAddToCart: (artistId: string, occasion?: string, city?: string) => Promise<void>;
  onNavigate: (path: string) => void;
}) {
  const searchParams = useSearchParams();
  const artistReviews = reviews.filter((review) => review.toId === artist.userId);
  const selectedOccasion = getOccasionOption(searchParams.get("occasion")).label;
  const selectedCity = searchParams.get("city") || artist.city;
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10">
        <img src={artist.coverPhoto} alt={artist.stageName} className="h-80 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06020b] via-black/20 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-4">
            <img src={artist.profilePhoto} alt={artist.stageName} className="h-28 w-28 rounded-[2rem] border border-white/10 object-cover shadow-glow" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-4xl font-black">{artist.stageName}</h1>
                <span className="flex items-center gap-1 rounded-full bg-emerald-400/15 px-3 py-1 text-sm text-emerald-300">
                  <CheckCircle2 size={16} />
                  Verified
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-white/70">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{artist.category}</span>
                <span>{artist.city}</span>
                <span className="flex items-center gap-1"><Star size={14} fill="currentColor" className="text-[#ffb340]" /> {artist.rating}</span>
              </div>
              <div className="mt-3 text-xl font-bold text-[#ffb340]">From {formatINR(artist.basePriceSolo)}</div>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-white" onClick={() => onNavigate(`/booker/artist/${artist.id}/enquiry`)}>
              Send Enquiry
            </button>
            <button className={`${gradientClass} rounded-2xl px-6 py-3 font-semibold text-black`} onClick={() => onAddToCart(artist.id, selectedOccasion, selectedCity)}>
              Book Now
            </button>
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Tabs.Root defaultValue="about" className="space-y-6">
          <Tabs.List className="flex flex-wrap gap-2">
            {["about", "portfolio", "reviews", "availability"].map((tab) => (
              <Tabs.Trigger key={tab} value={tab} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm capitalize text-white/70 data-[state=active]:bg-[linear-gradient(135deg,#a53eff,#ff44b7,#ffb13e)] data-[state=active]:text-black">
                {tab}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <Tabs.Content value="about">
            <GlassCard className="space-y-4">
              <p className="text-white/80">{artist.bio}</p>
              <div className="flex flex-wrap gap-2">
                {artist.genres.map((genre) => (
                  <span key={genre} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70">{genre}</span>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  `${artist.totalBookings}+ bookings completed`,
                  `${artist.minAdvanceBooking} day minimum lead time`,
                  `${artist.serviceableStates.length > 1 ? "Pan-India" : "Local"} availability`,
                ].map((item) => (
                  <div key={item} className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                    {item}
                  </div>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <InfoLine label="Languages" value={artist.languages.join(", ")} />
                <InfoLine label="Performance types" value={artist.performanceTypes.join(", ")} />
                <InfoLine label="Years" value={`${artist.yearsExperience}+ years`} />
                <InfoLine label="Notable clients" value={artist.notableClients} />
              </div>
            </GlassCard>
          </Tabs.Content>
          <Tabs.Content value="portfolio">
            <div className="grid gap-4 md:grid-cols-2">
              {artist.portfolioPhotos.map((photo) => (
                <img key={photo} src={photo} alt={artist.stageName} className="h-64 w-full rounded-[1.8rem] border border-white/10 object-cover" />
              ))}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {artist.mediaVault.slice(0, 4).map((item) => (
                <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                  <div className="font-semibold">{item.label}</div>
                  <div className="mt-2 text-sm text-white/65">{item.description}</div>
                  <div className="mt-3 text-xs uppercase tracking-[0.18em] text-[#ffb340]">{item.status}</div>
                </div>
              ))}
            </div>
          </Tabs.Content>
          <Tabs.Content value="reviews">
            <div className="space-y-4">
              {artistReviews.map((review) => (
                <GlassCard key={review.id}>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{review.eventType}</div>
                    <div className="flex items-center gap-1 text-[#ffb340]"><Star size={16} fill="currentColor" /> {review.rating}</div>
                  </div>
                  <p className="mt-3 text-white/70">{review.comment}</p>
                </GlassCard>
              ))}
            </div>
          </Tabs.Content>
          <Tabs.Content value="availability">
            <GlassCard>
              <SimpleCalendar blackoutDates={artist.blackoutDates} bookedDates={[]} />
            </GlassCard>
          </Tabs.Content>
        </Tabs.Root>
        <div className="space-y-4 lg:sticky lg:top-36 lg:self-start">
          <GlassCard>
            <div className="text-xl font-bold">Book {artist.stageName}</div>
            <p className="mt-2 text-sm text-white/60">Quotes, approvals, escrow status, and payout release stay visible to both sides in one tracked GiggiFi flow.</p>
            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/45">Booking context</div>
              <div className="mt-3 grid gap-3 text-sm text-white/75 md:grid-cols-2">
                <div>
                  <div className="text-white/45">Occasion</div>
                  <div className="mt-1 font-semibold text-white">{selectedOccasion}</div>
                </div>
                <div>
                  <div className="text-white/45">Event city</div>
                  <div className="mt-1 font-semibold text-white">{selectedCity}</div>
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold text-white">Performance highlights</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[...artist.performanceTypes, ...artist.languages].slice(0, 5).map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <button className="w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-white" onClick={() => onNavigate(`/booker/artist/${artist.id}/enquiry`)}>
                Send Enquiry
              </button>
              <button className={`${gradientClass} w-full rounded-2xl px-5 py-3 font-semibold text-black`} onClick={() => onAddToCart(artist.id, selectedOccasion, selectedCity)}>
                Book Now
              </button>
            </div>
          </GlassCard>
          <GlassCard className="space-y-3">
            <div className="text-lg font-bold">Trust and payout logic</div>
            {[
              "Booker pays full amount plus tax into escrow",
              "Artist payout releases after successful event completion",
              "Platform fee and tax are visible before payment",
              "Reliability and cancellation support stays inside GiggiFi",
            ].map((item) => (
              <div key={item} className="rounded-[1.3rem] border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                {item}
              </div>
            ))}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function EnquiryPage({
  artist,
  phone,
  onDone,
}: {
  artist: ArtistRecord;
  phone: string;
  onDone: (path: string) => Promise<void>;
}) {
  const [form, setForm] = useState<any>({
    artistId: artist.id,
    mode: "ENQUIRY",
    eventName: "",
    eventType: "Wedding",
    eventDate: "",
    isFlexibleDate: false,
    alternateDates: [],
    eventStartTime: "",
    eventEndTime: "",
    venueType: "Indoor",
    venueName: "",
    venueAddress: "",
    eventCity: artist.city,
    eventState: artist.state,
    audienceSize: 150,
    duration: 60,
    performanceType: "Solo",
    languagePref: ["Hindi"],
    specialRequests: "",
    soundAvailable: true,
    lightAvailable: true,
    travelArranged: true,
    accomProvided: false,
    budgetMin: artist.basePriceSolo,
    budgetMax: artist.basePriceSolo + 15000,
    contactPerson: "",
    contactPhone: phone || "+91",
    responseUrgency: "Within 24 hrs",
    moodboardUrl: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadDraft() {
      try {
        const response = await jsonRequest<{ draft: { data: Record<string, unknown> } | null }>(
          `/api/bookings/draft?artistId=${artist.id}`,
        );
        if (!active || !response.draft?.data) return;
        setForm((current: Record<string, unknown>) => ({
          ...current,
          ...response.draft?.data,
        }));
      } catch {
        return;
      }
    }

    void loadDraft();

    return () => {
      active = false;
    };
  }, [artist.id]);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const response = await jsonRequest<{ bookingId: string; redirect: string }>("/api/bookings", {
        method: "POST",
        body: JSON.stringify(form),
      });
      await onDone(response.redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send enquiry.");
    } finally {
      setLoading(false);
    }
  }

  async function saveDraft() {
    try {
      await jsonRequest("/api/bookings/draft", {
        method: "POST",
        body: JSON.stringify({ artistId: artist.id, data: form }),
      });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save draft.");
    }
  }

  return (
    <div className="space-y-6">
      <GlassCard className="flex items-center gap-4">
        <img src={artist.profilePhoto} alt={artist.stageName} className="h-16 w-16 rounded-2xl object-cover" />
        <div>
          <div className="text-xl font-bold">{artist.stageName}</div>
          <div className="text-sm text-white/60">{artist.category} · {artist.city}</div>
        </div>
      </GlassCard>
      <div className="space-y-6">
        <FormSection title="Section 1 — Event Details">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Event title" value={form.eventName} onChange={(value) => setForm({ ...form, eventName: value })} />
            <Field label="Event type" value={form.eventType} onChange={(value) => setForm({ ...form, eventType: value })} />
            <Field label="Event date" type="date" value={form.eventDate} onChange={(value) => setForm({ ...form, eventDate: value })} />
            <Field label="Venue type" value={form.venueType} onChange={(value) => setForm({ ...form, venueType: value })} />
            <Field label="Venue name" value={form.venueName} onChange={(value) => setForm({ ...form, venueName: value })} />
            <Field label="City" value={form.eventCity} onChange={(value) => setForm({ ...form, eventCity: value })} />
            <Field label="State" value={form.eventState} onChange={(value) => setForm({ ...form, eventState: value })} />
            <Field label="Audience size" type="number" value={String(form.audienceSize)} onChange={(value) => setForm({ ...form, audienceSize: Number(value) })} />
          </div>
          <TextAreaField label="Full address" value={form.venueAddress} onChange={(value) => setForm({ ...form, venueAddress: value })} />
        </FormSection>
        <FormSection title="Section 2 — Artist Requirements">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Performance duration (mins)" type="number" value={String(form.duration)} onChange={(value) => setForm({ ...form, duration: Number(value) })} />
            <Field label="Performance type" value={form.performanceType} onChange={(value) => setForm({ ...form, performanceType: value })} />
            <Field label="Sound system available" value={String(form.soundAvailable)} onChange={(value) => setForm({ ...form, soundAvailable: value === "true" })} />
            <Field label="Lighting available" value={String(form.lightAvailable)} onChange={(value) => setForm({ ...form, lightAvailable: value === "true" })} />
          </div>
          <TextAreaField label="Special requests" value={form.specialRequests} onChange={(value) => setForm({ ...form, specialRequests: value })} />
        </FormSection>
        <FormSection title="Section 3 — Budget and Contact">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Budget min" type="number" value={String(form.budgetMin)} onChange={(value) => setForm({ ...form, budgetMin: Number(value) })} />
            <Field label="Budget max" type="number" value={String(form.budgetMax)} onChange={(value) => setForm({ ...form, budgetMax: Number(value) })} />
            <Field label="Contact person name" value={form.contactPerson} onChange={(value) => setForm({ ...form, contactPerson: value })} />
            <Field label="Contact phone" value={form.contactPhone} onChange={(value) => setForm({ ...form, contactPhone: value })} />
          </div>
          <TextAreaField label="Additional notes" value={form.specialRequests} onChange={(value) => setForm({ ...form, specialRequests: value })} />
        </FormSection>
      </div>
      {error ? <div className="text-sm text-red-300">{error}</div> : null}
      <div className="flex flex-wrap gap-3">
        <button disabled={loading} className={`${gradientClass} rounded-2xl px-6 py-3 font-semibold text-black`} onClick={submit}>
          Send Enquiry
        </button>
        <button className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-white" onClick={saveDraft}>
          Save as Draft
        </button>
      </div>
    </div>
  );
}

function QuickBookPage({
  artist,
  phone,
  onDone,
}: {
  artist: ArtistRecord;
  phone: string;
  onDone: (path: string) => Promise<void>;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<any>({
    artistId: artist.id,
    mode: "QUICK_BOOKING",
    eventName: "GiggiFi Quick Booking",
    eventType: "Wedding",
    eventDate: "",
    eventCity: artist.city,
    eventState: artist.state,
    venueName: "",
    venueAddress: "",
    audienceSize: 150,
    duration: 60,
    contactPerson: "",
    contactPhone: phone || "+91",
    soundAvailable: true,
    lightAvailable: true,
    travelArranged: true,
    accomProvided: false,
    languagePref: ["Hindi"],
    quickBookPackage: artist.packages[0]?.title,
    quotedPrice: artist.packages[0]?.price,
  });
  const selectedPackage = artist.packages.find((pkg) => pkg.title === form.quickBookPackage) ?? artist.packages[0];
  const pricing = calculatePricing(selectedPackage?.price ?? artist.basePriceSolo);
  const blocked = artist.blackoutDates.some(
    (date) => new Date(date).toDateString() === new Date(form.eventDate).toDateString(),
  );

  async function submit() {
    const response = await jsonRequest<{ redirect: string }>("/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        quotedPrice: selectedPackage?.price,
        performanceType: selectedPackage?.title,
      }),
    });
    await onDone(response.redirect);
  }

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="h-3 rounded-full bg-white/5">
          <div className={`${gradientClass} h-3 rounded-full`} style={{ width: `${(step / 3) * 100}%` }} />
        </div>
        <div className="mt-3 text-sm text-white/60">Step {step} of 3</div>
      </GlassCard>
      {step === 1 ? (
        <GlassCard className="grid gap-4 md:grid-cols-2">
          <Field label="Event type" value={form.eventType} onChange={(value) => setForm({ ...form, eventType: value })} />
          <Field label="Date" type="date" value={form.eventDate} onChange={(value) => setForm({ ...form, eventDate: value })} />
          <Field label="City" value={form.eventCity} onChange={(value) => setForm({ ...form, eventCity: value })} />
          <Field label="Venue" value={form.venueName} onChange={(value) => setForm({ ...form, venueName: value })} />
          <Field label="Duration (mins)" type="number" value={String(form.duration)} onChange={(value) => setForm({ ...form, duration: Number(value) })} />
          <Field label="Audience size" type="number" value={String(form.audienceSize)} onChange={(value) => setForm({ ...form, audienceSize: Number(value) })} />
          {blocked ? <div className="md:col-span-2 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-300">Date Unavailable — Submit an enquiry to request alternate dates.</div> : null}
          <button className={`${gradientClass} rounded-2xl px-6 py-3 font-semibold text-black`} onClick={() => setStep(2)}>
            Check Availability
          </button>
        </GlassCard>
      ) : null}
      {step === 2 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {artist.packages.map((pkg) => (
            <button key={pkg.title} onClick={() => setForm({ ...form, quickBookPackage: pkg.title, quotedPrice: pkg.price })} className={cn("rounded-[1.8rem] border p-5 text-left", form.quickBookPackage === pkg.title ? `${gradientClass} border-transparent text-black` : "border-white/10 bg-white/5 text-white")}>
              <div className="text-xl font-bold">{pkg.title}</div>
              <div className="mt-2">{formatINR(pkg.price)} onwards</div>
              <div className="mt-3 text-sm opacity-80">{pkg.description}</div>
            </button>
          ))}
          <div className="md:col-span-2">
            <TextAreaField label="Special requests" value={form.specialRequests || ""} onChange={(value) => setForm({ ...form, specialRequests: value })} />
          </div>
          <button className={`${gradientClass} rounded-2xl px-6 py-3 font-semibold text-black`} onClick={() => setStep(3)}>
            Continue
          </button>
        </div>
      ) : null}
      {step === 3 ? (
        <GlassCard className="space-y-6">
          <div className="rounded-[1.5rem] bg-black/20 p-5">
            <div className="flex gap-4">
              <img src={artist.profilePhoto} alt={artist.stageName} className="h-20 w-20 rounded-2xl object-cover" />
              <div>
                <div className="text-2xl font-bold">{artist.stageName}</div>
                <div className="text-sm text-white/60">{artist.category} · {artist.city}</div>
              </div>
            </div>
            <div className="mt-5 space-y-2 text-white/70">
              <div>Package: {selectedPackage?.title}</div>
              <div>Date: {form.eventDate || "Select a date"}</div>
              <div>City: {form.eventCity}</div>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
            <div className="space-y-2">
              <FeeRow label="Artist fee" value={pricing.artistFee} />
              <FeeRow label="Platform fee (10%)" value={pricing.platformFee} />
              <FeeRow label="GST on platform fee (18%)" value={pricing.gstAmount} />
              <FeeRow label="Total payable" value={pricing.total} strong />
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-sm text-white/70">
            <div className="mb-2 flex items-center gap-2 text-white">
              <Lock size={16} />
              This booking is prepared for escrow-based payment once a real gateway callback is enabled.
            </div>
            Cancelling late means you may lose part of your payment. Check the full policy.
          </div>
          <button className={`${gradientClass} rounded-2xl px-6 py-3 font-semibold text-black`} onClick={submit}>
            Agree and Proceed to Payment
          </button>
        </GlassCard>
      ) : null}
    </div>
  );
}

function CheckoutPage({
  booking,
  artist,
  onDone,
}: {
  booking: BookingRecord;
  artist?: ArtistRecord;
  onDone: (path: string, message: string) => Promise<void>;
}) {
  const [method, setMethod] = useState<"UPI" | "CARDS" | "NETBANKING" | "WALLET">("UPI");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function pay() {
    setLoading(true);
    try {
      const response = await jsonRequest<{ redirect: string; message?: string }>(`/api/bookings/${booking.id}/payment`, {
        method: "POST",
        body: JSON.stringify({ paymentMethod: method }),
      });
      await onDone(
        response.redirect,
        response.message ?? "Payment request recorded. This booking will stay awaiting payment until gateway confirmation is live.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <GlassCard className="space-y-6">
        <div className="text-3xl font-black">Checkout</div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: "UPI" as const, icon: <Wallet size={16} /> },
            { key: "CARDS" as const, icon: <CreditCard size={16} /> },
            { key: "NETBANKING" as const, icon: <Calendar size={16} /> },
            { key: "WALLET" as const, icon: <Wallet size={16} /> },
          ].map((item) => (
            <button key={item.key} onClick={() => setMethod(item.key)} className={cn("flex items-center gap-2 rounded-full px-4 py-2 text-sm", method === item.key ? `${gradientClass} text-black` : "border border-white/10 bg-white/5 text-white/70")}>
              {item.icon}
              {item.key}
            </button>
          ))}
        </div>
        <div className="rounded-[1.5rem] bg-black/20 p-5">
          <div className="text-lg font-bold">Gateway readiness</div>
          <div className="mt-3 text-sm text-white/70">
            This checkout now creates a pending payment record only. No fake charge is attempted, and the booking stays in
            <span className="mx-1 font-semibold text-white">Awaiting Payment</span>
            until a real gateway callback confirms payment.
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
            Selected method: {method}. Provider integration hooks are prepared, but live capture is intentionally disabled until the gateway is configured.
          </div>
        </div>
        <div className="rounded-[1.5rem] bg-black/20 p-5">
          <div className="mb-4 text-lg font-bold">Escrow explanation</div>
          <div className="grid gap-4 md:grid-cols-3">
            {["You Pay", "Held Safely", "Released After Event"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <div className={`${gradientClass} mx-auto flex h-10 w-10 items-center justify-center rounded-full text-black`}>
                  <Lock size={16} />
                </div>
                <div className="mt-3 font-semibold">{item}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-white/60">
          <span>SSL Secured</span>
          <span>·</span>
          <span>Escrow-ready architecture</span>
          <span>·</span>
          <span>Dispute Resolution Available</span>
        </div>
        {error ? <div className="text-sm text-red-300">{error}</div> : null}
        <button className={`${gradientClass} flex h-14 w-full items-center justify-center gap-2 rounded-2xl font-semibold text-black`} onClick={pay} disabled={loading}>
          <Lock size={18} />
          {loading ? "Creating payment..." : `Create Payment Record for ${formatINR(booking.totalAmount ?? 0)}`}
        </button>
      </GlassCard>
      <GlassCard className="space-y-5 lg:sticky lg:top-36 lg:self-start">
        <div className="flex items-center gap-4">
          <img src={artist?.profilePhoto} alt={artist?.stageName} className="h-16 w-16 rounded-2xl object-cover" />
          <div>
            <div className="font-bold">{artist?.stageName}</div>
            <div className="text-sm text-white/60">{booking.eventCity} · {booking.duration} mins</div>
          </div>
        </div>
        <FeeRow label="Artist fee" value={booking.artistPayout ?? 0} />
        <FeeRow label="Platform fee" value={booking.platformFee ?? 0} />
        <FeeRow label="GST" value={booking.gstAmount ?? 0} />
        <FeeRow label="Total payable" value={booking.totalAmount ?? 0} strong />
        <div className="rounded-[1.5rem] border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">
          Booking status will move forward only after a real payment callback is wired in.
        </div>
      </GlassCard>
    </div>
  );
}

function BookingDetailPage({
  booking,
  artist,
  booker,
  onUpdate,
  session,
}: {
  booking: BookingRecord;
  artist?: ArtistRecord;
  booker?: { fullName: string; email: string; city?: string };
  onUpdate: (payload: Record<string, unknown>) => Promise<void>;
  session: SessionPayload | null;
}) {
  const timeline: BookingStatus[] = [
    "ENQUIRY_SENT",
    "QUOTE_RECEIVED",
    "AWAITING_PAYMENT",
    "PAYMENT_HELD",
    "EVENT_UPCOMING",
    "EVENT_COMPLETED",
    "PAYOUT_RELEASED",
  ];
  return (
    <div className="space-y-6">
      <GlassCard className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <div className="text-sm text-white/50">Booking ID {booking.id}</div>
          <div className="mt-2 text-3xl font-black">{booking.eventName}</div>
          <div className="mt-2 text-white/60">Created {formatIST(booking.createdAt)}</div>
          <div className="mt-6 grid gap-4">
            {timeline.map((step) => (
              <div key={step} className="flex items-center gap-3">
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", timeline.indexOf(step) <= timeline.indexOf(booking.status) ? `${gradientClass} text-black` : "border border-white/10 bg-white/5 text-white/40")}>
                  {timeline.indexOf(step) + 1}
                </div>
                <div className={cn("text-sm", step === booking.status ? "text-white" : "text-white/50")}>
                  {bookingStatusLabels[step]}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-[1.5rem] bg-black/20 p-4">
            <div className="font-semibold">{artist?.stageName}</div>
            <div className="text-sm text-white/60">{artist?.category} · {artist?.city}</div>
          </div>
          <div className="rounded-[1.5rem] bg-black/20 p-4">
            <div className="font-semibold">{booker?.fullName}</div>
            <div className="text-sm text-white/60">{booker?.email}</div>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <GlassCard className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <InfoLine label="Event type" value={booking.eventType} />
            <InfoLine label="Date" value={formatIST(booking.eventDate)} />
            <InfoLine label="City" value={booking.eventCity} />
            <InfoLine label="Duration" value={`${booking.duration} minutes`} />
            <InfoLine label="Payment and escrow" value={booking.escrowStatus} />
            <InfoLine label="Contact" value={booking.status === "PAYMENT_HELD" ? booking.contactPhone || "-" : "Visible after payment held"} />
          </div>
          <div className="rounded-[1.5rem] bg-black/20 p-4">
            <div className="font-semibold">Chat thread</div>
            <div className="mt-3 space-y-3">
              {booking.chat.map((message) => (
                <div key={message.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/40">{message.from}</div>
                  <div className="mt-2 text-white/80">{message.body}</div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
        <GlassCard className="space-y-4 lg:sticky lg:top-36 lg:self-start">
          <a href={`/api/bookings/${booking.id}/contract`} target="_blank" className={`${gradientClass} block rounded-2xl px-5 py-3 text-center font-semibold text-black`}>
            View printable contract
          </a>
          {session?.role === "BOOKER" && booking.status === "QUOTE_RECEIVED" ? (
            <button className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-white" onClick={() => onUpdate({ action: "accept_quote" })}>
              Agree and Proceed to Payment
            </button>
          ) : null}
          {session?.role === "ARTIST" && booking.status === "ENQUIRY_SENT" ? (
            <>
              <button className={`${gradientClass} rounded-2xl px-5 py-3 font-semibold text-black`} onClick={() => onUpdate({ action: "send_quote", quotedPrice: booking.quotedPrice ?? 25000, message: "Quote shared with standard GiggiFi payment terms." })}>
                Bid Amount
              </button>
              <button className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-white" onClick={() => onUpdate({ action: "artist_decline", reason: "Date Unavailable" })}>
                Decline
              </button>
            </>
          ) : null}
          {booking.status === "PAYMENT_HELD" ? (
            <>
              <button className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-white" onClick={() => onUpdate({ action: "mark_completed" })}>
                Mark Event as Completed
              </button>
              <button className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-white" onClick={() => onUpdate({ action: "raise_dispute", reason: "Needs admin review" })}>
                Raise a Dispute
              </button>
            </>
          ) : null}
          {session?.role === "ADMIN" && booking.status === "EVENT_COMPLETED" ? (
            <button className={`${gradientClass} rounded-2xl px-5 py-3 font-semibold text-black`} onClick={() => onUpdate({ action: "release_payout" })}>
              Release Payout
            </button>
          ) : null}
        </GlassCard>
      </div>
    </div>
  );
}

function ArtistDashboardPage({
  artist,
  bookings,
}: {
  artist: ArtistRecord;
  bookings: BookingRecord[];
}) {
  const artistBookings = bookings.filter((item) => item.artistId === artist.id);
  const completedWorks = artistBookings.filter((item) => item.status === "EVENT_COMPLETED" || item.status === "PAYOUT_RELEASED");
  const openWorks = artistBookings.filter((item) => item.status === "ENQUIRY_SENT" || item.status === "QUOTE_RECEIVED" || item.status === "AWAITING_PAYMENT");
  return (
    <div className="space-y-6">
      <GlassCard className="flex items-center justify-between">
        <div>
          <div className="text-sm text-[#ffb340]">{artist.kycStatus === "APPROVED" ? "KYC approved" : artist.kycStatus === "REJECTED" ? "KYC rejected" : "KYC pending"}</div>
          <div className="mt-2 text-3xl font-black">Welcome back, {artist.stageName}</div>
        </div>
        <div className="text-sm text-white/60">Profile and KYC data shown from your saved artist record</div>
      </GlassCard>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <GlassCard>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["Legal name", artist.legalName],
                ["Stage name", artist.stageName],
                ["Category", artist.category],
                ["City", artist.city],
                ["Mobile", "+91 980000001"],
                ["Email", `${artist.stageName.toLowerCase().replace(/\s+/g, "")}@giggifi.in`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[1.4rem] bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/40">{label}</div>
                  <div className="mt-2 font-semibold">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-[1.4rem] bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/40">Bio</div>
              <div className="mt-2 text-white/70">{artist.bio}</div>
            </div>
          </GlassCard>
          <GlassCard className="space-y-4">
            <div className="text-2xl font-black">Media Vault</div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {artist.mediaVault.map((item) => (
                <div key={item.label} className="rounded-[1.4rem] bg-black/20 p-4">
                  <div className="font-semibold">{item.label}</div>
                  <div className="mt-2 text-sm text-white/60">{item.description}</div>
                  <div className="mt-3 text-sm text-[#ffb340]">{item.status}</div>
                </div>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <img src={artist.profilePhoto} alt={artist.stageName} className="h-72 w-full rounded-[1.6rem] object-cover" />
              <div className="grid gap-4 md:grid-cols-2">
                {artist.portfolioPhotos.slice(0, 2).map((photo) => (
                  <img key={photo} src={photo} alt={artist.stageName} className="h-40 w-full rounded-[1.4rem] object-cover" />
                ))}
                {artist.portfolioVideos.slice(0, 2).map((video) => (
                  <video key={video} src={video} controls className="h-40 w-full rounded-[1.4rem] object-cover" />
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className={`${gradientClass} rounded-2xl px-5 py-3 font-semibold text-black`}>Upload Press Kit</button>
              <button className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-white">Upload Reel</button>
              <button className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-white">Upload Video</button>
              <button className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-white">Upload Photos</button>
            </div>
          </GlassCard>
          <GlassCard className="space-y-4">
            <div className="text-2xl font-black">Occasion-wise pricing</div>
            <div className="grid gap-4 md:grid-cols-2">
              {artist.packages.map((pkg) => (
                <div key={pkg.title} className="rounded-[1.4rem] bg-black/20 p-4">
                  <div className="font-semibold">{pkg.title}</div>
                  <div className="mt-2 text-[#ffb340]">{formatINR(pkg.price)}</div>
                  <div className="mt-2 text-sm text-white/60">{pkg.description}</div>
                  <div className="mt-3 text-xs uppercase tracking-[0.18em] text-white/40">Wedding • Corporate • Private</div>
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard id="artist-enquiries" className="space-y-4">
            <div className="text-2xl font-black">Live Enquiries and Bidding</div>
            {artistBookings.slice(0, 3).map((booking) => (
              <div key={booking.id} className="rounded-[1.4rem] bg-black/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{booking.eventName}</div>
                    <div className="text-sm text-white/60">{booking.eventCity} · {booking.eventType}</div>
                  </div>
                  <div className="text-sm text-[#ffb340]">Bid within 2 hrs</div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button className={`${gradientClass} rounded-full px-4 py-2 text-sm font-semibold text-black`}>Accept</button>
                  <button className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white">Bid Amount</button>
                  <button className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white">Message</button>
                </div>
              </div>
            ))}
          </GlassCard>
          <GlassCard className="space-y-4">
            <div className="text-2xl font-black">Recent works and completed events</div>
            {(completedWorks.length ? completedWorks : artistBookings).slice(0, 3).map((booking) => (
              <div key={booking.id} className="rounded-[1.4rem] bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{booking.eventName}</div>
                    <div className="text-sm text-white/60">{booking.eventType} · {booking.eventCity}</div>
                  </div>
                  <div className="text-sm text-[#ffb340]">{bookingStatusLabels[booking.status]}</div>
                </div>
              </div>
            ))}
          </GlassCard>
        </div>
        <div className="space-y-6">
          <div className="grid gap-4">
            <StatCard title="Monthly revenue" value="₹1.8L" note="Escrow-backed payouts" />
            <StatCard title="Shows done" value="47" note="Across weddings and corporate" />
            <StatCard title="Ratings" value="4.9" note="Premium client reviews" />
            <StatCard title="Open enquiries" value={String(openWorks.length || 3)} note="Respond within 24 hours" />
            <StatCard title="Pending bids" value="12" note="High-intent opportunities" />
          </div>
          <GlassCard>
            <div className="text-xl font-black">KYC and compliance</div>
            <div className="mt-4 space-y-3 text-sm text-white/70">
              <InfoLine label="PAN" value={artist.panNumber || "Pending"} />
              <InfoLine label="Aadhaar" value={artist.aadhaarNumber || "Pending"} />
              <InfoLine label="Bank account" value={artist.bankAccountNumber || "Pending"} />
              <InfoLine label="IFSC" value={artist.bankIFSC || "Pending"} />
            </div>
            <button className={`${gradientClass} mt-5 rounded-2xl px-5 py-3 font-semibold text-black`}>Upload KYC Documents</button>
          </GlassCard>
          <GlassCard className="space-y-3">
            <div className="text-xl font-black">Availability calendar</div>
            <SimpleCalendar blackoutDates={artist.blackoutDates} bookedDates={artistBookings.map((item) => item.eventDate)} />
          </GlassCard>
          <GlassCard className="space-y-3">
            <div className="text-xl font-black">Enquiry coverage</div>
            <div className="rounded-[1.4rem] bg-black/20 p-4 text-sm text-white/70">Local enquiries from {artist.city} plus pan-India requests across {artist.serviceableStates.slice(0, 4).join(", ")}.</div>
            <div className="rounded-[1.4rem] bg-black/20 p-4 text-sm text-white/70">GiggiFi tracks reliability, payment status, and payout release in one artist workspace.</div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function ArtistEnquiriesPage({
  artist,
  bookings,
  onUpdate,
}: {
  artist: ArtistRecord;
  bookings: BookingRecord[];
  onUpdate: (id: string, payload: Record<string, unknown>) => Promise<void>;
}) {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<BookingRecord | null>(bookings[0] ?? null);
  const filtered = bookings.filter((booking) => {
    if (filter === "All") return true;
    if (filter === "New") return booking.status === "ENQUIRY_SENT";
    if (filter === "Responded") return booking.status === "QUOTE_RECEIVED";
    return booking.status === "CANCELLED_BY_ARTIST";
  });
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <GlassCard className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {["All", "New", "Responded", "Expired"].map((tab) => (
            <button key={tab} onClick={() => setFilter(tab)} className={cn("rounded-full px-4 py-2 text-sm", filter === tab ? `${gradientClass} text-black` : "border border-white/10 bg-white/5 text-white/70")}>
              {tab}
            </button>
          ))}
        </div>
        {filtered.map((booking) => (
          <button key={booking.id} onClick={() => setSelected(booking)} className="w-full rounded-[1.5rem] bg-black/20 p-4 text-left">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold">{booking.eventName}</div>
                <div className="text-sm text-white/60">{booking.eventType} · {booking.eventCity}</div>
              </div>
              <div className="rounded-full bg-[#ffb340]/20 px-3 py-1 text-xs text-[#ffb340]">24h left</div>
            </div>
            <div className="mt-3 text-sm text-white/60">{booking.contactPerson} · {formatINR(booking.budgetMax ?? booking.artistPayout ?? 0)}</div>
          </button>
        ))}
      </GlassCard>
      <GlassCard className="space-y-4">
        <div className="text-xl font-black">Enquiry drawer</div>
        {selected ? (
          <>
            <div className="rounded-[1.5rem] bg-black/20 p-4">
              <div className="font-semibold">{selected.eventName}</div>
              <div className="mt-2 text-sm text-white/60">{selected.specialRequests || "No extra notes"}</div>
            </div>
            <div className="space-y-3">
              <button className={`${gradientClass} w-full rounded-2xl px-5 py-3 font-semibold text-black`} onClick={() => onUpdate(selected.id, { action: "send_quote", quotedPrice: selected.quotedPrice ?? artist.basePriceSolo, message: "Quote shared with payment terms." })}>
                Accept and Quote
              </button>
              <button className="w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-white" onClick={() => onUpdate(selected.id, { action: "send_quote", quotedPrice: (selected.quotedPrice ?? artist.basePriceSolo) + 5000, message: "Counter-offer shared." })}>
                Ask a Question
              </button>
              <button className="w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-white" onClick={() => onUpdate(selected.id, { action: "artist_decline", reason: "Date Unavailable" })}>
                Decline
              </button>
            </div>
          </>
        ) : null}
      </GlassCard>
    </div>
  );
}

function ArtistCalendarPage({
  artist,
  bookings,
  onToggle,
}: {
  artist: ArtistRecord;
  bookings: BookingRecord[];
  onToggle: (date: string) => Promise<void>;
}) {
  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-black">Availability calendar</div>
            <div className="mt-2 text-white/60">Advance booking minimum notice {artist.minAdvanceBooking} days</div>
          </div>
          <button className={`${gradientClass} rounded-2xl px-5 py-3 font-semibold text-black`}>Sync to Google Calendar</button>
        </div>
      </GlassCard>
      <GlassCard>
        <SimpleCalendar blackoutDates={artist.blackoutDates} bookedDates={bookings.map((item) => item.eventDate)} onToggle={onToggle} />
      </GlassCard>
      <GlassCard className="space-y-4">
        <div className="text-xl font-black">Upcoming events</div>
        {bookings.map((booking) => (
          <div key={booking.id} className="rounded-[1.4rem] bg-black/20 p-4">
            <div className="font-semibold">{booking.eventName}</div>
            <div className="mt-2 text-sm text-white/60">{formatIST(booking.eventDate)} · {booking.eventCity}</div>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}

function ArtistEarningsPage({
  artist,
  bookings,
  payments,
}: {
  artist: ArtistRecord;
  bookings: BookingRecord[];
  payments: MockDatabase["payments"];
}) {
  const artistPayments = payments.filter((payment) =>
    bookings.some((booking) => booking.paymentId === payment.id),
  );
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total earned" value="₹6.2L" note="Lifetime on GiggiFi" />
        <StatCard title="This month" value="₹1.8L" note="After platform escrow" />
        <StatCard title="In escrow" value="₹28,000" note="Upcoming releases" />
        <StatCard title="Pending release" value="₹22,000" note="Expected within 3 business days" />
      </div>
      <GlassCard>
        <div className="text-xl font-black">Payout history</div>
        <div className="mt-4 space-y-3">
          {artistPayments.map((payment) => (
            <div key={payment.id} className="grid gap-2 rounded-[1.4rem] bg-black/20 p-4 md:grid-cols-5">
              <div>{payment.paidAt ? formatIST(payment.paidAt) : "-"}</div>
              <div>{payment.bookingId}</div>
              <div>{formatINR(payment.artistPayout)}</div>
              <div>{payment.status}</div>
              <div>{payment.releasedAt ? "Released" : "Held"}</div>
            </div>
          ))}
        </div>
      </GlassCard>
      <GlassCard>
        <div className="text-xl font-black">Bank account details</div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <InfoLine label="Payout method" value="NEFT / IMPS" />
          <InfoLine label="Bank name" value="HDFC Bank" />
          <InfoLine label="Account" value={artist.bankAccountNumber || "XXXX4821"} />
          <InfoLine label="IFSC" value={artist.bankIFSC || "HDFC0004821"} />
        </div>
      </GlassCard>
    </div>
  );
}

function CartPage({
  artists,
  cart,
  onRemove,
  onNavigate,
  session,
}: {
  artists: ArtistRecord[];
  cart: MockDatabase["carts"][number] | undefined;
  onRemove: (artistId: string) => Promise<void>;
  onNavigate: (path: string) => void;
  session: SessionPayload | null;
}) {
  const subtotal = artists.reduce((sum, artist) => sum + artist.basePriceSolo, 0);
  const pricing = calculatePricing(subtotal);
  const paymentPath = !artists.length
    ? "/booker/discover"
    : session?.role === "BOOKER" && session.hasBookerProfile
      ? "/payment"
      : resolveBookerContinuationPath(session, "/booker/dashboard");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <GlassCard className="space-y-4">
        <div className="text-3xl font-black">Selected artists</div>
        {!artists.length ? (
          <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6 text-white/70">
            Your cart is empty right now. Add artists from discovery, verified, or city-led browsing.
          </div>
        ) : null}
        {artists.map((artist) => (
          <div key={artist.id} className="flex items-center gap-4 rounded-[1.5rem] bg-black/20 p-4">
            <img src={artist.profilePhoto} alt={artist.stageName} className="h-16 w-16 rounded-2xl object-cover" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{artist.stageName}</div>
              <div className="text-sm text-white/60">{artist.category} · {cart?.city ?? artist.city}</div>
              <div className="text-sm text-[#ffb340]">{formatINR(artist.basePriceSolo)}</div>
            </div>
            <button className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white" onClick={() => onRemove(artist.id)}>
              Remove
            </button>
          </div>
        ))}
        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-sm text-white/70">
          Client pays the full amount plus tax. Funds are held in escrow and artist payout releases only after successful event completion, platform fee deduction, and status confirmation.
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-sm text-white/70">
          Booking summary: {cart?.occasion ?? "Wedding"} in {cart?.city ?? "Mumbai"} with {artists.length} selected artist{artists.length === 1 ? "" : "s"}.
        </div>
        <div className="flex flex-wrap gap-3">
          <button className={`${gradientClass} rounded-2xl px-6 py-3 font-semibold text-black`} onClick={() => onNavigate(paymentPath)}>
            {artists.length ? "Proceed to Payment" : "Browse Artists"}
          </button>
          <button className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-white" onClick={() => onNavigate("/booker/discover")}>
            Add More Artists
          </button>
        </div>
      </GlassCard>
      <GlassCard className="space-y-4">
        <StatCard title="Artists selected" value={String(artists.length)} note="Ready for checkout" />
        <StatCard title="Occasion" value={cart?.occasion ?? "Wedding"} note="Saved from discovery" />
        <StatCard title="City" value={cart?.city ?? "Mumbai"} note="Primary event location" />
        <StatCard title="Amount summary" value={formatINR(pricing.total)} note={`Artist fees ${formatINR(pricing.artistFee)} + platform + GST`} />
      </GlassCard>
    </div>
  );
}

function PaymentPage({
  cart,
  artists,
  onNavigate,
  session,
}: {
  cart: MockDatabase["carts"][number] | undefined;
  artists: ArtistRecord[];
  onNavigate: (path: string) => void;
  session: SessionPayload | null;
}) {
  const [method, setMethod] = useState<"UPI" | "Card" | "Netbanking">("UPI");
  const [holderName, setHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [success, setSuccess] = useState(false);
  const selectedArtists = artists.filter((artist) => cart?.artistIds.includes(artist.id));
  const subtotal = selectedArtists.reduce((sum, artist) => sum + artist.basePriceSolo, 0);
  const pricing = calculatePricing(subtotal);
  const paymentRedirectPath = resolveBookerContinuationPath(
    session,
    "/booker/dashboard",
  );

  if (!session?.userId || session.role !== "BOOKER" || !session.hasBookerProfile) {
    return (
      <GlassCard className="mx-auto max-w-2xl space-y-5 text-center">
        <div className="text-3xl font-black">Booker access required before payment</div>
        <p className="text-white/70">
          Your selected artists are saved. Continue as a booker to review payment, escrow, and confirmation.
        </p>
        <div className="flex justify-center">
          <button onClick={() => onNavigate(paymentRedirectPath)} className={`${gradientClass} rounded-2xl px-6 py-3 font-semibold text-black`}>
            Continue as Booker
          </button>
        </div>
      </GlassCard>
    );
  }

  if (!selectedArtists.length) {
    return (
      <GlassCard className="mx-auto max-w-2xl space-y-5 text-center">
        <div className="text-3xl font-black">Your cart is empty</div>
        <p className="text-white/70">
          Add at least one artist to cart before opening payment.
        </p>
        <div className="flex justify-center">
          <button onClick={() => onNavigate("/booker/discover")} className={`${gradientClass} rounded-2xl px-6 py-3 font-semibold text-black`}>
            Browse Artists
          </button>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <GlassCard className="space-y-5">
        <div className="text-3xl font-black">Payment</div>
        {success ? (
          <div className="space-y-4 rounded-[1.5rem] border border-emerald-400/20 bg-emerald-400/10 p-6">
            <div className="text-2xl font-black text-emerald-200">Booking confirmed</div>
            <p className="text-sm text-emerald-100">
              Your payment is marked as escrow-held in the Booker flow. The booking is saved, the event is tracked, and final payout is released to the artist only after successful performance.
            </p>
            <div className="rounded-[1.5rem] border border-emerald-300/20 bg-black/20 p-5 text-left text-sm text-emerald-50">
              <div className="flex items-center gap-2 font-semibold text-emerald-100">
                <CalendarDays size={16} />
                Save-to-calendar style confirmation
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/70">Occasion</div>
                  <div className="mt-1">{cart?.occasion ?? "Wedding"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/70">City</div>
                  <div className="mt-1">{cart?.city ?? "Mumbai"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/70">Artists</div>
                  <div className="mt-1">{selectedArtists.map((artist) => artist.stageName).join(", ")}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/70">Status</div>
                  <div className="mt-1">Confirmed and saved in your GiggiFi booking flow</div>
                </div>
              </div>
            </div>
            <button onClick={() => onNavigate("/booker/dashboard")} className={`${gradientClass} rounded-2xl px-6 py-3 font-semibold text-black`}>
              Return to Booker Dashboard
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {(["UPI", "Card", "Netbanking"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setMethod(item)}
                  className={cn("rounded-full px-4 py-2 text-sm", method === item ? `${gradientClass} text-black` : "border border-white/10 bg-white/5 text-white/70")}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="rounded-[1.5rem] bg-black/20 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Holder name" value={holderName} onChange={setHolderName} />
                <Field label={method === "UPI" ? "UPI ID" : "Card number"} value={cardNumber} onChange={setCardNumber} />
                <Field label={method === "Netbanking" ? "Bank name" : "Expiry"} value={expiry} onChange={setExpiry} />
                <Field label={method === "UPI" ? "Mobile number" : "CVV"} value={cvv} onChange={setCvv} />
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-sm text-white/70">
              Payment summary:
              <div className="mt-3 space-y-2">
                <FeeRow label="Artist fees" value={pricing.artistFee} />
                <FeeRow label="Platform fee" value={pricing.platformFee} />
                <FeeRow label="GST on platform fee" value={pricing.gstAmount} />
                <FeeRow label="Total payable" value={pricing.total} strong />
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-sm text-white/70">
              Tax note: GST is applied on the platform fee and shown before confirmation so the full payable amount is clear to the booker.
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-sm text-white/70">
              Escrow note: client pays the full amount plus tax, GiggiFi holds the money securely, and payout is released after the performance succeeds and commission plus tax are accounted for.
            </div>
            <button className={`${gradientClass} rounded-2xl px-6 py-3 font-semibold text-black`} onClick={() => setSuccess(true)}>
              Confirm Booking and Hold in Escrow
            </button>
          </>
        )}
      </GlassCard>
      <GlassCard className="space-y-4">
        <StatCard title="Artists count" value={String(selectedArtists.length)} note={cart?.occasion ?? "Selected shortlist"} />
        <StatCard title="City" value={cart?.city ?? "Mumbai"} note="Secure checkout enabled" />
        <StatCard title="Total" value={formatINR(pricing.total)} note="Protected before payout release" />
        <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4 text-sm text-white/70">
          Selected occasion: <span className="font-semibold text-white">{cart?.occasion ?? "Wedding"}</span>
        </div>
        {selectedArtists.map((artist) => (
          <div key={artist.id} className="rounded-[1.4rem] bg-black/20 p-4">
            <div className="font-semibold">{artist.stageName}</div>
            <div className="mt-1 text-sm text-white/60">{artist.category} · {artist.city}</div>
            <div className="mt-2 text-sm text-[#ffb340]">{formatINR(artist.basePriceSolo)}</div>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}

function BookerOpsPage({
  routeKey,
  bookings,
  artists,
  saved,
}: {
  routeKey: string;
  bookings: BookingRecord[];
  artists: ArtistRecord[];
  saved: MockDatabase["savedArtists"];
}) {
  const titleMap: Record<string, string> = {
    "booker/enquiries": "My submitted enquiries",
    "booker/bookings": "My confirmed bookings",
    "booker/payments": "Payment history and invoices",
    "booker/saved": "Wishlist of saved artists",
    "booker/settings": "Account settings",
  };
  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="text-3xl font-black">{titleMap[routeKey] || "Booker Workspace"}</div>
      </GlassCard>
      {routeKey === "booker/saved" ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {saved.map((item) => {
            const artist = artists.find((entry) => entry.id === item.artistId);
            return artist ? <ArtistCard key={artist.id} artist={artist} onAddToCart={async () => undefined} onNavigate={() => undefined} /> : null;
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <GlassCard key={booking.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{booking.eventName}</div>
                  <div className="text-sm text-white/60">{bookingStatusLabels[booking.status]}</div>
                </div>
                <div className="text-sm text-white/60">{formatINR(booking.totalAmount ?? booking.artistPayout ?? 0)}</div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

function ArtistOpsPage({
  routeKey,
  artist,
  bookings,
  reviews,
}: {
  routeKey: string;
  artist: ArtistRecord;
  bookings: BookingRecord[];
  reviews: ReviewRecord[];
}) {
  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="text-3xl font-black">{pageName(routeKey.split("/"))}</div>
      </GlassCard>
      {routeKey === "artist/reviews" ? (
        <div className="space-y-4">
          {reviews
            .filter((review) => review.toId === artist.userId)
            .map((review) => (
              <GlassCard key={review.id}>
                <div className="flex items-center justify-between">
                  <div>{review.eventType}</div>
                  <div className="text-[#ffb340]">{review.rating}</div>
                </div>
                <p className="mt-3 text-white/70">{review.comment}</p>
              </GlassCard>
            ))}
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <GlassCard key={booking.id}>
              <div className="font-semibold">{booking.eventName}</div>
              <div className="mt-2 text-sm text-white/60">{bookingStatusLabels[booking.status]}</div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminPage({
  routeKey,
  db,
  onUpdate,
  onReviewKyc,
}: {
  routeKey: string;
  db: MockDatabase;
  onUpdate: (id: string, payload: Record<string, unknown>) => Promise<void>;
  onReviewKyc: (
    artistId: string,
    payload: { status: "APPROVED" | "REJECTED"; reason?: string },
  ) => Promise<void>;
}) {
  const pendingArtists = db.artists.filter((artist) => artist.kycStatus === "PENDING");
  if (routeKey === "admin") {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Pending KYC" value={String(pendingArtists.length)} note="Needs review" />
          <StatCard title="Active disputes" value={String(db.bookings.filter((booking) => booking.status === "DISPUTED").length)} note="Admin action required" />
          <StatCard title="Bookings" value={String(db.bookings.length)} note="All statuses" />
          <StatCard title="Users" value={String(db.users.length)} note="Artist, booker, admin" />
        </div>
        <GlassCard>
          <div className="text-2xl font-black">Operations overview</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[
              ["KYC Queue", "/admin/kyc"],
              ["Disputes", "/admin/disputes"],
              ["Bookings", "/admin/bookings"],
              ["Payouts", "/admin/payouts"],
            ].map(([label]) => (
              <div key={label} className="rounded-[1.5rem] bg-black/20 p-5">
                <div className="font-semibold">{label}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    );
  }

  if (routeKey === "admin/kyc") {
    return (
      <div className="space-y-4">
        {pendingArtists.map((artist) => (
          <GlassCard key={artist.id}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-semibold">{artist.stageName}</div>
                <div className="text-sm text-white/60">{artist.city} · {artist.category}</div>
              </div>
              <div className="flex gap-3">
                <button className={`${gradientClass} rounded-2xl px-4 py-2 font-semibold text-black`} onClick={() => onReviewKyc(artist.id, { status: "APPROVED" })}>
                  Approve KYC
                </button>
                <button className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-white" onClick={() => onReviewKyc(artist.id, { status: "REJECTED", reason: "Please review uploaded KYC details and resubmit." })}>
                  Reject KYC
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {db.bookings.map((booking) => (
        <GlassCard key={booking.id}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="font-semibold">{booking.eventName}</div>
              <div className="text-sm text-white/60">{bookingStatusLabels[booking.status]}</div>
            </div>
            <div className="flex gap-3">
              {routeKey === "admin/disputes" ? (
                <>
                  <button className={`${gradientClass} rounded-2xl px-4 py-2 font-semibold text-black`} onClick={() => onUpdate(booking.id, { action: "release_payout" })}>
                    Release to Artist
                  </button>
                  <button className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-white" onClick={() => onUpdate(booking.id, { action: "cancel_by_booker", reason: "Admin refund" })}>
                    Full Refund
                  </button>
                </>
              ) : routeKey === "admin/payouts" ? (
                <button className={`${gradientClass} rounded-2xl px-4 py-2 font-semibold text-black`} onClick={() => onUpdate(booking.id, { action: "release_payout" })}>
                  Release Payout
                </button>
              ) : (
                <button className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-white">
                  Review
                </button>
              )}
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function SimpleCalendar({
  blackoutDates,
  bookedDates,
  onToggle,
}: {
  blackoutDates: string[];
  bookedDates: string[];
  onToggle?: (date: string) => void;
}) {
  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(1 + index);
    return date;
  });
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((date) => {
        const iso = date.toISOString();
        const blocked = blackoutDates.some((item) => new Date(item).toDateString() === date.toDateString());
        const booked = bookedDates.some((item) => new Date(item).toDateString() === date.toDateString());
        return (
          <button
            key={iso}
            onClick={() => onToggle?.(iso)}
            className={cn(
              "rounded-2xl border p-3 text-sm",
              blocked
                ? "border-white/10 bg-white/10 text-white/60"
                : booked
                  ? "border-[#ffb340]/30 bg-[#ffb340]/20 text-[#ffb340]"
                  : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
            )}
          >
            {date.getDate()}
          </button>
        );
      })}
    </div>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <GlassCard className="space-y-4">
      <div className="text-xl font-bold">{title}</div>
      {children}
    </GlassCard>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-white/20"
      />
      {hint ? <div className="mt-2 text-xs text-white/50">{hint}</div> : null}
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-white/20"
      />
      {hint ? <div className="mt-2 text-xs text-white/50">{hint}</div> : null}
    </div>
  );
}

function ChipSelector({
  label,
  values,
  options,
  onChange,
}: {
  label: string;
  values: string[];
  options: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = values.includes(option);
          return (
            <button
              key={option}
              onClick={() =>
                onChange(active ? values.filter((value) => value !== option) : [...values, option])
              }
              className={cn(
                "rounded-full px-4 py-2 text-sm",
                active ? `${gradientClass} text-black` : "border border-white/10 bg-white/5 text-white/70",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.18em] text-white/40">{label}</div>
      <div className="mt-2 text-white/80">{value}</div>
    </div>
  );
}

function FeeRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between text-sm", strong ? "font-bold text-white" : "text-white/70")}>
      <span>{label}</span>
      <span>{formatINR(value)}</span>
    </div>
  );
}
