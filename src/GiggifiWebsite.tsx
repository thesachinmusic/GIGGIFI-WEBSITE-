import React, {
  forwardRef,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type InputHTMLAttributes,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clapperboard,
  Drum,
  Guitar,
  Laugh,
  MapPin,
  Menu,
  Mic2,
  Music2,
  PartyPopper,
  Play,
  Search,
  ShoppingCart,
  Sparkles,
  Star,
  Ticket,
  Upload,
  X,
} from "lucide-react";

type Page =
  | "home"
  | "services"
  | "artists"
  | "booker-login"
  | "booker-dashboard"
  | "artist-login"
  | "artist-dashboard"
  | "celebrity"
  | "social"
  | "verified"
  | "cities"
  | "booking"
  | "cart"
  | "payment"
  | "weddings"
  | "clubs"
  | "corporate"
  | "college"
  | "hotels"
  | "private"
  | "artist-singer"
  | "artist-musicians"
  | "artist-singers"
  | "artist-bands"
  | "artist-comedy"
  | "artist-dancers"
  | "artist-actors"
  | "artist-circus"
  | "artist-misc";

type Artist = (typeof artists)[number];
type AuthRole = "booker" | "artist";
type AuthMode = "login" | "signup";
type Account = {
  name: string;
  loginId: string;
  password: string;
};

const occasions = [
  ["House Party", "private"],
  ["Birthday", "private"],
  ["Wedding", "weddings"],
  ["Destination Wedding", "weddings"],
  ["Corporate Event", "corporate"],
  ["Club Night", "clubs"],
] as const;

const services = [
  [
    "Luxury Weddings",
    "weddings",
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
  ],
  [
    "Nightclubs & Lounges",
    "clubs",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80",
  ],
  [
    "Corporate Events",
    "corporate",
    "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
  ],
  [
    "Colleges & Festivals",
    "college",
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
  ],
  [
    "Hotels & Resorts",
    "hotels",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
  ],
  [
    "Private Parties",
    "private",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
  ],
] as const;

const artistMenus = [
  ["Singer-Guitarists", "artist-singer", Guitar],
  ["Musicians", "artist-musicians", Drum],
  ["Singers", "artist-singers", Mic2],
  ["Bands", "artist-bands", Music2],
  ["Stand Up Comedy", "artist-comedy", Laugh],
  ["Dancers", "artist-dancers", Sparkles],
  ["Actors", "artist-actors", Clapperboard],
  ["Circus", "artist-circus", PartyPopper],
  ["Misc. Entertainers", "artist-misc", Ticket],
] as const;

const artists = [
  [
    "SACH",
    "Singer-Guitarist",
    "Mumbai",
    "₹20,000 onwards",
    4.9,
    "Featured in your area",
    "Sufi • Bollywood • Live Weddings",
    "/media/sach/profile.jpg",
  ],
  [
    "The Velvet Notes",
    "Band",
    "Pune",
    "₹45,000 onwards",
    4.8,
    "Wedding favourite",
    "Live Band • Reception",
    "https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=1200&q=80",
  ],
  [
    "Riya Flame",
    "Dancer",
    "Bengaluru",
    "₹22,000 onwards",
    4.9,
    "High energy performer",
    "Commercial • Event Choreo",
    "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1200&q=80",
  ],
  [
    "Rahul Roast",
    "Stand Up Comedy",
    "Delhi",
    "₹28,000 onwards",
    4.7,
    "Corporate crowd hit",
    "Clean Comedy",
    "https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=1200&q=80",
  ],
  [
    "Noor Collective",
    "Musicians",
    "Mumbai",
    "₹30,000 onwards",
    4.8,
    "Luxury ambience act",
    "Instrumental • Lounge",
    "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80",
  ],
  [
    "Skyline Circus",
    "Circus",
    "Delhi",
    "₹55,000 onwards",
    4.9,
    "Premium visual act",
    "Aerial • LED",
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80",
  ],
] as const;

const socials = [
  [
    "Artist Reels",
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80",
  ],
  [
    "Event Highlights",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80",
  ],
  [
    "Celebrity Moments",
    "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
  ],
  [
    "Client Testimonials",
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
  ],
] as const;

const premiumJoined = [
  [
    "Headline Singer",
    "Luxury weddings • Live events",
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
  ],
  [
    "Celebrity Host",
    "Corporate • Awards • Launches",
    "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
  ],
  [
    "Premium Band",
    "Reception • Clubs • Festivals",
    "https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=1200&q=80",
  ],
] as const;

const featuredPremium = [
  [
    "SACH",
    "Featured in your area",
    "/media/sach/profile.jpg",
  ],
  [
    "The Royal Band",
    "Popular for weddings",
    "https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=1200&q=80",
  ],
  [
    "Elite Performer",
    "Top rated act",
    "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1200&q=80",
  ],
] as const;

const artistProfileFields = [
  ["Stage name", "SACH"],
  ["Legal name", "Sachin Chaudhary"],
  ["Category", "Singer-Guitarist"],
  ["City", "Mumbai"],
  ["Mobile", "+91 86556 88134"],
  ["Email", "thesachinmusic@gmail.com"],
] as const;

const artistPackages = [
  {
    title: "Solo",
    price: "₹20,000 onwards",
    detail: "Live solo performance format for weddings, cocktails, intimate gatherings and curated private events.",
  },
  {
    title: "Duo / Two-Piece Band",
    price: "₹30,000 onwards",
    detail: "Expanded live format with two musicians for richer arrangements and stronger stage presence.",
  },
  {
    title: "Four-Piece Band",
    price: "₹50,000 onwards",
    detail: "Full event-ready live band setup suited for sangeet, receptions, branded evenings and premium celebrations.",
  },
  {
    title: "Six to Seven Piece Band",
    price: "₹1,00,000 onwards",
    detail: "Large-format premium live act for headline wedding nights, destination events and bigger stage productions.",
  },
] as const;

const artistMediaVault = [
  ["Press kit PDF", "Tutor profile and supporting deck", "Linked"],
  ["Reel", "Primary artist reel", "Linked"],
  ["Performance video", "Live performance video", "Linked"],
  ["Profile photo", "Main hero image", "Linked"],
  ["Package deck", "Pricing and inclusions", "Configured"],
  ["KYC bundle", "PAN, Aadhaar, bank proof", "Details added"],
] as const;

const artistKycRows = [
  ["PAN", "ABCDE1234X"],
  ["Aadhaar", "XXXX 3664"],
  ["Bank account", "XXXX 1664"],
  ["IFSC", "KBK000098"],
] as const;

const artistEnquiries = [
  {
    title: "Luxury Wedding Cocktail",
    city: "Mumbai",
    detail: "Need a premium Hindi-English live singer for 250 guests.",
    status: "Bid within 2 hrs",
    budget: "Client budget: ₹55,000",
  },
  {
    title: "Corporate Awards Night",
    city: "Bengaluru",
    detail: "Opening act plus walk-in ambient performance.",
    status: "Shortlist stage",
    budget: "Client budget: ₹75,000",
  },
  {
    title: "Private Sundowner",
    city: "Goa",
    detail: "Acoustic singer for destination celebration with sunset slot.",
    status: "Need availability",
    budget: "Client budget: ₹28,000",
  },
] as const;

const artistPayoutRows = [
  ["Starting package", "₹20,000 onwards"],
  ["Top format", "₹1,00,000 band"],
  ["Advance model", "Custom per booking"],
  ["Average rating", "4.9 / 5"],
] as const;

const clients = [
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
] as const;

const pageNames: Record<Page, string> = {
  home: "Home",
  services: "Services",
  artists: "Artists",
  "booker-login": "Booker Login",
  "booker-dashboard": "Booker Dashboard",
  "artist-login": "Artist Login",
  "artist-dashboard": "Artist Dashboard",
  celebrity: "Celebrity",
  social: "Social Media",
  verified: "Verified Artists",
  cities: "Cities Covered",
  booking: "Booking Management",
  cart: "Cart",
  payment: "Payment",
  weddings: "Luxury Weddings",
  clubs: "Nightclubs & Lounges",
  corporate: "Corporate Events",
  college: "Colleges & Festivals",
  hotels: "Hotels & Resorts",
  private: "Private Parties",
  "artist-singer": "Singer-Guitarists",
  "artist-musicians": "Musicians",
  "artist-singers": "Singers",
  "artist-bands": "Bands",
  "artist-comedy": "Stand Up Comedy",
  "artist-dancers": "Dancers",
  "artist-actors": "Actors",
  "artist-circus": "Circus",
  "artist-misc": "Misc. Entertainers",
};

const artistFilters: Partial<Record<Page, string>> = {
  "artist-singer": "Singer-Guitarist",
  "artist-musicians": "Musicians",
  "artist-singers": "Singer",
  "artist-bands": "Band",
  "artist-comedy": "Stand Up Comedy",
  "artist-dancers": "Dancer",
  "artist-actors": "Actor",
  "artist-circus": "Circus",
  "artist-misc": "Misc",
};

const gradient =
  "bg-[linear-gradient(135deg,#a53eff,#ff44b7,#ffb13e)]";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const Button = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<"button"> & {
    variant?: "default" | "outline";
    size?: "default" | "lg";
  }
>(function Button(
  { className, variant = "default", size = "default", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        "inline-flex items-center justify-center whitespace-nowrap transition disabled:pointer-events-none disabled:opacity-50",
        variant === "outline"
          ? "border border-white/15 bg-white/5 text-white hover:bg-white/10"
          : "bg-white text-black hover:bg-white/90",
        size === "lg" ? "h-12 px-6 text-sm" : "h-10 px-4 text-sm",
        className,
      )}
      {...props}
    />
  );
});

function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rounded-3xl", className)} {...props} />;
}

function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props} />;
}

function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full text-xs font-medium",
        className,
      )}
      {...props}
    />
  );
}

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cx(
          "w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-white/20",
          className,
        )}
        {...props}
      />
    );
  },
);

function Wordmark() {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cx(
          "relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl shadow-[0_0_30px_rgba(255,94,176,0.22)]",
          gradient,
        )}
      >
        <span className="text-lg font-black text-white">G</span>
      </div>
      <div>
        <div className="bg-[linear-gradient(135deg,#a53eff,#ff44b7,#ffb13e)] bg-clip-text text-3xl font-black tracking-tight text-transparent">
          GiggFi
        </div>
        <div className="text-xs text-white/70">
          Where real talent meets real opportunities
        </div>
      </div>
    </div>
  );
}

function H({ b, t, d }: { b: string; t: string; d?: string }) {
  return (
    <div className="max-w-3xl">
      <Badge className="mb-4 border border-white/10 bg-white/5 px-4 py-1.5 text-white/80">
        {b}
      </Badge>
      <h2 className="text-3xl font-black tracking-tight md:text-5xl">{t}</h2>
      {d ? <p className="mt-4 text-white/68 md:text-lg">{d}</p> : null}
    </div>
  );
}

function ImgCard({
  title,
  sub,
  img,
  onClick,
}: {
  title: string;
  sub?: string;
  img: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-[1.8rem] border border-white/10 text-left transition hover:-translate-y-1 hover:border-white/20"
    >
      <img
        src={img}
        alt={title}
        className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,1,10,0.96),rgba(5,1,10,0.25),transparent)]" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <div className="text-2xl font-bold">{title}</div>
        {sub ? <div className="mt-1 text-white/75">{sub}</div> : null}
      </div>
    </button>
  );
}

function Stat({
  v,
  l,
  onClick,
}: {
  v: string;
  l: string;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="text-left">
      <Card className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.07]">
        <CardContent className="p-5">
          <div className="text-2xl font-black">{v}</div>
          <div className="mt-1 text-sm text-white/60">{l}</div>
        </CardContent>
      </Card>
    </button>
  );
}

function SocialIcons() {
  return (
    <div className="mt-5 flex gap-3">
      {[
        <div
          key="ig"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-[8px] border border-white/80">
            <div className="h-2.5 w-2.5 rounded-full border border-white/80" />
          </div>
        </div>,
        <div
          key="fb"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg font-black text-white"
        >
          f
        </div>,
        <div
          key="yt"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5"
        >
          <div className="flex h-5 w-7 items-center justify-center rounded-md border border-white/80">
            <div className="ml-0.5 h-0 w-0 border-b-[5px] border-l-[8px] border-t-[5px] border-b-transparent border-l-white border-t-transparent" />
          </div>
        </div>,
        <div
          key="in"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-black text-white"
        >
          in
        </div>,
      ]}
    </div>
  );
}

function BackBtn({ show, onClick }: { show: boolean; onClick: () => void }) {
  if (!show) return null;

  return (
    <button
      onClick={onClick}
      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
    >
      ← Back
    </button>
  );
}

export default function GiggifiWebsite() {
  const [page, setPage] = useState<Page>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [hover, setHover] = useState<"services" | "artists" | null>(null);
  const [city, setCity] = useState("Mumbai");
  const [cartItems, setCartItems] = useState<Artist[]>([artists[0], artists[4]]);
  const [artistSearch, setArtistSearch] = useState("");
  const [selectedOccasion, setSelectedOccasion] = useState("Wedding");
  const [showAppPopup, setShowAppPopup] = useState(true);
  const [bookerLoggedIn, setBookerLoggedIn] = useState(false);
  const [artistLoggedIn, setArtistLoggedIn] = useState(false);
  const [bookerAccount, setBookerAccount] = useState<Account | null>(null);
  const [artistAccount, setArtistAccount] = useState<Account | null>(null);
  const [authRole, setAuthRole] = useState<AuthRole>("booker");
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [authName, setAuthName] = useState("");
  const [authLoginId, setAuthLoginId] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authMessage, setAuthMessage] = useState(
    "Create your account first, then login with your ID and password.",
  );
  const [pendingCheckoutPage, setPendingCheckoutPage] = useState<Page | null>(null);
  const timer = useRef<number | null>(null);

  const go = (p: Page) => {
    setPage(p);
    setMenuOpen(false);
    setHover(null);
  };

  const open = (m: "services" | "artists") => {
    if (timer.current) clearTimeout(timer.current);
    setHover(m);
  };

  const close = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setHover(null), 220);
  };

  const featured = useMemo(() => {
    const matchingCity = artists.filter((artist) => artist[2] === city);
    return matchingCity.length ? matchingCity : artists.slice(0, 4);
  }, [city]);

  const visibleArtists = useMemo(() => {
    const filter = artistFilters[page];
    if (!filter) return featured;

    const matchingCategory = artists.filter((artist) =>
      artist[1].toLowerCase().includes(filter.toLowerCase()),
    );

    return matchingCategory.length ? matchingCategory : featured;
  }, [featured, page]);

  const bookerArtists = useMemo(() => {
    const query = artistSearch.trim().toLowerCase();
    const cityMatches = artists.filter((artist) => artist[2] === city);
    const scopedArtists = cityMatches.length ? cityMatches : artists;

    if (!query) return scopedArtists;

    const filtered = scopedArtists.filter((artist) =>
      [artist[0], artist[1], artist[2], artist[6]]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );

    return filtered.length ? filtered : scopedArtists;
  }, [artistSearch, city]);

  const cart = cartItems.length;
  const artistConsoleMode = artistLoggedIn && !bookerLoggedIn;

  const setAuthFlow = (role: AuthRole, mode: AuthMode = "signup") => {
    setAuthRole(role);
    setAuthMode(mode);
    setAuthName("");
    setAuthLoginId("");
    setAuthPassword("");
    setAuthConfirmPassword("");
    setAuthMessage("Create your account first, then login with your ID and password.");
    go(role === "booker" ? "booker-login" : "artist-login");
  };

  const addArtistToCart = (artist: Artist) => {
    setCartItems((current) =>
      current.some((item) => item[0] === artist[0]) ? current : [...current, artist],
    );
  };

  const handleCheckoutGate = (nextPage: Page) => {
    if (bookerLoggedIn) {
      go(nextPage);
      return;
    }

    setPendingCheckoutPage(nextPage);
    setAuthFlow("booker", "signup");
  };

  const handleAddToCart = (artist: Artist) => {
    addArtistToCart(artist);
    handleCheckoutGate("cart");
  };

  const handleBookNow = (artist: Artist) => {
    addArtistToCart(artist);
    handleCheckoutGate("payment");
  };

  const submitAuth = (role: AuthRole) => {
    const account = role === "booker" ? bookerAccount : artistAccount;

    if (authMode === "signup") {
      if (!authName.trim()) {
        setAuthMessage("Enter your full name to create the account.");
        return;
      }

      if (!authLoginId.trim()) {
        setAuthMessage("Enter your email or mobile as login ID.");
        return;
      }

      if (authPassword.trim().length < 4) {
        setAuthMessage("Use a password with at least 4 characters.");
        return;
      }

      if (authPassword !== authConfirmPassword) {
        setAuthMessage("Password and confirm password must match.");
        return;
      }

      const nextAccount = {
        name: authName.trim(),
        loginId: authLoginId.trim(),
        password: authPassword,
      };

      if (role === "booker") {
        setBookerAccount(nextAccount);
      } else {
        setArtistAccount(nextAccount);
      }

      setAuthMode("login");
      setAuthPassword("");
      setAuthConfirmPassword("");
      setAuthMessage("Account created. Now login with your ID and password.");
      return;
    }

    if (!account) {
      setAuthMessage("No account found yet. Please sign up first.");
      return;
    }

    if (authLoginId.trim() !== account.loginId || authPassword !== account.password) {
      setAuthMessage("Incorrect login ID or password. Please try again.");
      return;
    }

    if (role === "artist") {
      setBookerLoggedIn(false);
      setArtistLoggedIn(true);
      setAuthMessage(`Welcome back, ${account.name}. Opening your artist dashboard.`);
      go("artist-dashboard");
      return;
    }

    setArtistLoggedIn(false);
    setBookerLoggedIn(true);
    setAuthMessage(`Welcome back, ${account.name}.`);
    go(pendingCheckoutPage ?? "booker-dashboard");
    setPendingCheckoutPage(null);
  };

  const quickPanel = (
    <Card className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.04))] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,180,64,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(171,61,255,0.18),transparent_30%)]" />
      <CardContent className="relative p-6 md:p-7">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-xl font-bold">Quick Booker Panel</div>
            <div className="text-sm text-white/65">
              Colorful discovery for bookers
            </div>
          </div>
          <Badge className="border border-[#ffb340]/30 bg-[#ffb340]/15 px-3 py-1 text-[#ffd68c]">
            Featured
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(135deg,rgba(165,62,255,0.22),rgba(255,68,183,0.18),rgba(255,177,62,0.14))] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm text-white/80">
              <MapPin className="h-4 w-4" />
              Choose location
            </div>
            <div className="flex flex-wrap gap-2">
              {["Mumbai", "Pune", "Bengaluru", "Delhi"].map((itemCity) => (
                <button
                  key={itemCity}
                  onClick={() => setCity(itemCity)}
                  className={cx(
                    "rounded-full border px-4 py-2 text-sm",
                    city === itemCity
                      ? `${gradient} border-transparent text-black`
                      : "border-white/10 bg-black/25 text-white/85 hover:bg-white/10",
                  )}
                >
                  {itemCity}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-[#0f0918] p-4">
            <div className="mb-2 text-sm text-white/60">Search artist</div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ffb340]" />
              <Input
                value={artistSearch}
                onChange={(event) => setArtistSearch(event.target.value)}
                placeholder="Search singer, band, dancer, city..."
                className="pl-10"
              />
            </div>
            <div className="mt-3 flex gap-3">
              <Button
                onClick={() => go("artists")}
                className={cx("rounded-xl font-semibold text-black", gradient)}
              >
                Search Artists
              </Button>
              <Button
                variant="outline"
                onClick={() => go("booker-login")}
                className="rounded-xl"
              >
                Start Booking
              </Button>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">
                Featured artists near {city}
              </div>
              <button
                onClick={() => go("artists")}
                className="text-xs text-[#ffb340]"
              >
                View all
              </button>
            </div>

            <div className="space-y-3">
              {featured.slice(0, 3).map((artist) => (
                <div
                  key={artist[0]}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={artist[7]}
                      alt={artist[0]}
                      className="h-14 w-14 rounded-2xl object-cover"
                    />
                    <div>
                      <div className="font-semibold">{artist[0]}</div>
                      <div className="text-sm text-white/60">
                        {artist[1]} • {artist[2]}
                      </div>
                      <div className="mt-1 text-xs text-[#ffb340]">
                        {artist[5]}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-sm text-white/80">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {artist[4]}
                    </div>
                    <div className="mt-1 text-sm text-white/60">{artist[3]}</div>
                    <button
                      onClick={() => handleAddToCart(artist)}
                      className={cx(
                        "mt-2 rounded-full px-3 py-1 text-xs font-semibold text-black",
                        gradient,
                      )}
                    >
                      Add to cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const simplePage = (
    badge: string,
    title: string,
    text: string,
    img: string,
    points: string[],
  ) => (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
        <div>
          <H b={badge} t={title} d={text} />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {points.map((point) => (
              <div
                key={point}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80"
              >
                {point}
              </div>
            ))}
          </div>
        </div>
        <ImgCard title={title} sub={badge} img={img} />
      </div>
    </section>
  );

  const body = () => {
    if (page === "home") {
      return (
        <>
          <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-12 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-20">
            <div>
              <Badge className="mb-5 border border-white/10 bg-white/5 px-4 py-1.5 text-white/80">
                India’s premium entertainer booking platform
              </Badge>
              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-4xl text-5xl font-black leading-[0.98] tracking-tight md:text-7xl"
              >
                Book artists. Hassle-free payments. Real talent. Real opportunities.
              </motion.h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
                Book singers, bands, dancers, comics, circus acts, premium
                entertainers and celebrity talent with a luxury look and strong
                discovery flow.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() => go("artists")}
                  className={cx("rounded-2xl px-7 font-bold text-black", gradient)}
                >
                  Explore Artists
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => go("services")}
                  className="rounded-2xl px-7"
                >
                  <Play className="mr-2 h-4 w-4" />
                  See How It Works
                </Button>
              </div>
              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Stat
                  v="10,000+"
                  l="Verified Artists"
                  onClick={() => go("verified")}
                />
                <Stat v="25+" l="Cities Covered" onClick={() => go("cities")} />
                <Stat
                  v="300+"
                  l="Premium Artists Joined"
                  onClick={() => go("celebrity")}
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[2rem] bg-[linear-gradient(135deg,rgba(162,62,255,0.18),rgba(255,56,176,0.18),rgba(255,177,62,0.12))] blur-2xl" />
              <div className="mb-5 rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-center rounded-[1.5rem] border border-white/10 bg-[linear-gradient(135deg,rgba(165,62,255,0.16),rgba(255,68,183,0.16),rgba(255,177,62,0.10))] px-6 py-7">
                  <Wordmark />
                </div>
              </div>
              {quickPanel}
            </div>
          </section>

          <section className="border-y border-white/8 bg-white/[0.02] py-5">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 text-sm text-white/60 md:px-6">
              {services.map((service) => (
                <button
                  key={service[0]}
                  onClick={() => go(service[1] as Page)}
                  className="font-medium tracking-wide hover:text-white"
                >
                  {service[0]}
                </button>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
            <H
              b="What we serve"
              t="Services for every occasion."
              d="Choose the event type and move into artist discovery."
            />
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {services.map((service) => (
                <ImgCard
                  key={service[0]}
                  title={service[0]}
                  sub="Premium entertainment experiences"
                  img={service[2]}
                  onClick={() => go(service[1] as Page)}
                />
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 pb-20 md:px-6">
            <H
              b="Featured Premium"
              t="Premium artists that help close bookings faster."
              d="High-trust profiles, city relevance, and standout visual presence."
            />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {featuredPremium.map((item) => (
                <ImgCard key={item[0]} title={item[0]} sub={item[1]} img={item[2]} />
              ))}
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-3 text-sm text-white/45">
              {clients.map((client) => (
                <span
                  key={client}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2"
                >
                  {client}
                </span>
              ))}
            </div>
          </section>
        </>
      );
    }

    if (page === "services") {
      return (
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <H
            b="Services"
            t="Services"
            d="Hover Services in the header to open this flow as a dropdown, then click any service to land on its own page."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <ImgCard
                key={service[0]}
                title={service[0]}
                sub="Premium entertainment experiences"
                img={service[2]}
                onClick={() => go(service[1] as Page)}
              />
            ))}
          </div>
        </section>
      );
    }

    if (
      ["weddings", "clubs", "corporate", "college", "hotels", "private"].includes(
        page,
      )
    ) {
      const service = services.find((item) => item[1] === page)!;
      return simplePage(
        "Service Page",
        service[0],
        "This page is a proper landing destination for bookers. From here, users can move deeper into discovery and continue toward booking.",
        service[2],
        [
          "Curated entertainer matches",
          "Event-style recommendations",
          "Fast enquiry to booking flow",
          "Booker-first journey",
        ],
      );
    }

    if (page === "artists" || page.startsWith("artist-")) {
      return (
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <H
            b="Artists"
            t="Artist page with dropdown-led categories and visual cards."
            d="Hover Artists in the top nav and each category opens a dedicated view."
          />
          <div className="mt-8 flex flex-wrap gap-2">
            {occasions.map((occasion) => (
              <button
                key={occasion[0]}
                onClick={() => {
                  setSelectedOccasion(occasion[0]);
                  go(occasion[1] as Page);
                }}
                className={cx(
                  "rounded-full border px-4 py-2 text-sm",
                  selectedOccasion === occasion[0]
                    ? `${gradient} border-transparent text-black`
                    : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
                )}
              >
                {occasion[0]}
              </button>
            ))}
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleArtists.map((artist) => (
              <Card
                key={artist[0]}
                className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/5 backdrop-blur-xl"
              >
                <img
                  src={artist[7]}
                  alt={artist[0]}
                  className="h-64 w-full object-cover"
                />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xl font-bold">{artist[0]}</div>
                      <div className="mt-1 text-sm text-white/60">
                        {artist[1]} • {artist[2]}
                      </div>
                    </div>
                    <Badge className="border border-white/10 bg-white/5 px-3 py-1 text-white/80">
                      {artist[5]}
                    </Badge>
                  </div>
                  <div className="mt-3 text-sm text-white/58">{artist[6]}</div>
                  <div className="mt-5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-sm text-white/85">
                        <Star className="h-4 w-4 fill-current" />
                        {artist[4]}
                      </div>
                      <div className="mt-1 text-sm text-white/65">{artist[3]}</div>
                    </div>
                    <Button
                      onClick={() => handleAddToCart(artist)}
                      className="rounded-xl"
                    >
                      Add to cart
                    </Button>
                    <Button
                      onClick={() => handleBookNow(artist)}
                      variant="outline"
                      className="rounded-xl"
                    >
                      Book now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      );
    }

    if (page === "booker-login") {
      return (
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <Card className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl">
              <CardContent className="p-6 md:p-8">
                <Badge className="mb-4 border border-white/10 bg-white/5 px-4 py-1.5 text-white/80">
                  Booker Login
                </Badge>
                <h2 className="text-3xl font-black tracking-tight md:text-4xl">
                  Booker sign up first, then login to continue.
                </h2>
                <p className="mt-4 text-white/68">
                  Bookers create their account once and then login with login ID and password before opening cart, checkout and payment.
                </p>
                <div className="mt-6 space-y-4">
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setAuthMode("signup")}
                      className={cx(
                        "rounded-xl font-semibold",
                        authMode === "signup" ? `${gradient} text-black` : "bg-white/5 text-white",
                      )}
                    >
                      Sign Up
                    </Button>
                    <Button
                      onClick={() => setAuthMode("login")}
                      variant="outline"
                      className={cx(
                        "rounded-xl",
                        authMode === "login" ? "border-white/20 bg-white/10" : "",
                      )}
                    >
                      Login
                    </Button>
                  </div>
                  {authMode === "signup" ? (
                    <div>
                      <div className="mb-2 text-sm text-white/60">Full name</div>
                      <Input
                        value={authName}
                        onChange={(event) => setAuthName(event.target.value)}
                        placeholder="Enter your name"
                      />
                    </div>
                  ) : null}
                  <div>
                    <div className="mb-2 text-sm text-white/60">Login ID</div>
                    <Input
                      value={authLoginId}
                      onChange={(event) => setAuthLoginId(event.target.value)}
                      placeholder="Email or mobile number"
                    />
                  </div>
                  <div>
                    <div className="mb-2 text-sm text-white/60">Password</div>
                    <Input
                      type="password"
                      value={authPassword}
                      onChange={(event) => setAuthPassword(event.target.value)}
                      placeholder="Enter password"
                    />
                  </div>
                  {authMode === "signup" ? (
                    <div>
                      <div className="mb-2 text-sm text-white/60">Confirm password</div>
                      <Input
                        type="password"
                        value={authConfirmPassword}
                        onChange={(event) => setAuthConfirmPassword(event.target.value)}
                        placeholder="Confirm password"
                      />
                    </div>
                  ) : null}
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/72">
                    {authMessage}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      onClick={() => submitAuth("booker")}
                      className={cx("h-12 rounded-2xl font-bold text-black", gradient)}
                    >
                      {authMode === "signup" ? "Create Account" : "Login as Booker"}
                    </Button>
                    <Button
                      onClick={() => setAuthFlow("artist", "login")}
                      variant="outline"
                      className="h-12 rounded-2xl"
                    >
                      Continue as Artist
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <ImgCard
              title="Booker Journey"
              sub="Search artist → add to cart → sign up/login → payment"
              img="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80"
            />
          </div>
        </section>
      );
    }

    if (page === "booker-dashboard") {
      return (
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <H
            b="Booker Dashboard"
            t="Search artists, view local premium acts, then book and pay."
            d="Bookers get a cleaner control room with city filters, occasion shortcuts, shortlist states, and fast movement into cart or payment."
          />
          <div className="mt-10 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold">Discovery controls</div>
                    <div className="text-sm text-white/60">
                      Personalize the list before you short-list
                    </div>
                  </div>
                  <Badge className="border border-white/10 bg-white/5 px-3 py-1 text-white/80">
                    {city}
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 text-sm text-white/60">
                      Occasion quick picks
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {occasions.map((occasion) => (
                        <button
                          key={occasion[0]}
                          onClick={() => setSelectedOccasion(occasion[0])}
                          className={cx(
                            "rounded-full border px-4 py-2 text-sm",
                            selectedOccasion === occasion[0]
                              ? `${gradient} border-transparent text-black`
                              : "border-white/10 bg-white/5 text-white/80",
                          )}
                        >
                          {occasion[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 text-sm text-white/60">Search</div>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ffb340]" />
                      <Input
                        value={artistSearch}
                        onChange={(event) => setArtistSearch(event.target.value)}
                        placeholder="Search artist, band, city, performance type..."
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-4 text-xl font-bold">
                    Featured artists in {city}
                  </div>
                  <div className="space-y-3">
                    {bookerArtists.map((artist) => (
                      <div
                        key={artist[0]}
                        className="flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={artist[7]}
                            alt={artist[0]}
                            className="h-16 w-16 rounded-2xl object-cover"
                          />
                          <div>
                            <div className="font-semibold">{artist[0]}</div>
                            <div className="text-sm text-white/60">
                              {artist[1]} • {artist[2]}
                            </div>
                            <div className="mt-1 text-xs text-[#ffb340]">
                              {artist[5]}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="text-right text-sm text-white/70">
                            <div className="flex items-center justify-end gap-1 text-white/85">
                              <Star className="h-4 w-4 fill-current" />
                              {artist[4]}
                            </div>
                            <div>{artist[3]}</div>
                          </div>
                          <Button
                            onClick={() => handleAddToCart(artist)}
                            className={cx("rounded-xl font-semibold text-black", gradient)}
                          >
                            Add to cart
                          </Button>
                          <Button
                            onClick={() => handleBookNow(artist)}
                            variant="outline"
                            className="rounded-xl"
                          >
                            Book now
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-5">
              <Stat v={selectedOccasion} l="Current occasion" />
              <Stat v={`${cart}`} l="Artists in cart" onClick={() => go("cart")} />
              <Stat v="24 hrs" l="Avg. response window" />
              <Card className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="text-xl font-bold">Premium artists near {city}</div>
                  <div className="mt-4 space-y-3">
                    {featuredPremium.map((item) => (
                      <div
                        key={item[0]}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item[2]}
                            alt={item[0]}
                            className="h-12 w-12 rounded-2xl object-cover"
                          />
                          <div>
                            <div className="font-semibold">{item[0]}</div>
                            <div className="text-sm text-white/60">{item[1]}</div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleCheckoutGate("payment")}
                          className={cx("rounded-xl font-semibold text-black", gradient)}
                        >
                          Book
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => handleCheckoutGate("payment")}
                    className={cx("mt-5 w-full rounded-2xl font-bold text-black", gradient)}
                  >
                    Continue to payment
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      );
    }

    if (page === "artist-login") {
      return (
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <Card className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl">
              <CardContent className="p-6 md:p-8">
                <Badge className="mb-4 border border-white/10 bg-white/5 px-4 py-1.5 text-white/80">
                  Artist Login
                </Badge>
                <h2 className="text-3xl font-black tracking-tight md:text-4xl">
                  Artists sign up first, then login to access their dashboard.
                </h2>
                <p className="mt-4 text-white/68">
                  After login, artists go directly into their own dashboard and client enquiries so they can manage media, KYC, bids and bookings.
                </p>
                <div className="mt-6 space-y-4">
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setAuthMode("signup")}
                      className={cx(
                        "rounded-xl font-semibold",
                        authMode === "signup" ? `${gradient} text-black` : "bg-white/5 text-white",
                      )}
                    >
                      Sign Up
                    </Button>
                    <Button
                      onClick={() => setAuthMode("login")}
                      variant="outline"
                      className={cx(
                        "rounded-xl",
                        authMode === "login" ? "border-white/20 bg-white/10" : "",
                      )}
                    >
                      Login
                    </Button>
                  </div>
                  {authMode === "signup" ? (
                    <div>
                      <div className="mb-2 text-sm text-white/60">Artist name</div>
                      <Input
                        value={authName}
                        onChange={(event) => setAuthName(event.target.value)}
                        placeholder="Stage name or legal name"
                      />
                    </div>
                  ) : null}
                  <div>
                    <div className="mb-2 text-sm text-white/60">Login ID</div>
                    <Input
                      value={authLoginId}
                      onChange={(event) => setAuthLoginId(event.target.value)}
                      placeholder="Email or mobile number"
                    />
                  </div>
                  <div>
                    <div className="mb-2 text-sm text-white/60">Password</div>
                    <Input
                      type="password"
                      value={authPassword}
                      onChange={(event) => setAuthPassword(event.target.value)}
                      placeholder="Enter password"
                    />
                  </div>
                  {authMode === "signup" ? (
                    <div>
                      <div className="mb-2 text-sm text-white/60">Confirm password</div>
                      <Input
                        type="password"
                        value={authConfirmPassword}
                        onChange={(event) => setAuthConfirmPassword(event.target.value)}
                        placeholder="Confirm password"
                      />
                    </div>
                  ) : null}
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/72">
                    {authMessage}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      onClick={() => submitAuth("artist")}
                      className={cx("h-12 rounded-2xl font-bold text-black", gradient)}
                    >
                      {authMode === "signup" ? "Create Artist Account" : "Login as Artist"}
                    </Button>
                    <Button
                      onClick={() => setAuthFlow("booker", "signup")}
                      variant="outline"
                      className="h-12 rounded-2xl"
                    >
                      Switch to Booker
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <ImgCard
              title="Artist Control Room"
              sub="Sign up/login → artist dashboard → client enquiries → bidding"
              img="https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80"
            />
          </div>
        </section>
      );
    }

    if (page === "artist-dashboard") {
      if (!artistLoggedIn) {
        return (
          <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
            <H
              b="Artist Dashboard"
              t="Artist login required."
              d="Artists land on their dashboard only after logging in with their account ID and password."
            />
            <div className="mt-8">
              <Button
                onClick={() => setAuthFlow("artist", "login")}
                className={cx("rounded-2xl font-semibold text-black", gradient)}
              >
                Login as Artist
              </Button>
            </div>
          </section>
        );
      }

      return (
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <H
            b="Artist Dashboard"
            t="Artist dashboard with only your profile controls and client enquiries."
            d="Artists do not browse other artist profiles here. This view is limited to your own dashboard, media, KYC, packages, revenue and incoming client enquiries so you can bid."
          />
          <div className="mt-10 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="grid gap-5">
              <Card className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <div className="text-xl font-bold">Artist profile</div>
                      <div className="text-sm text-white/60">
                        Personal info and public booking identity
                      </div>
                    </div>
                    <Badge className="border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-300">
                      Data-ready
                    </Badge>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {artistProfileFields.map((field) => (
                      <div
                        key={field[0]}
                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                          {field[0]}
                        </div>
                        <div className="mt-2 text-sm font-medium text-white/85">
                          {field[1]}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                      Bio
                    </div>
                    <div className="mt-2 text-sm leading-7 text-white/72">
                      SACH is a Mumbai-based live singer-guitarist performing Sufi, Bollywood and premium live sets for weddings, cocktails, private celebrations and curated event experiences. Your press kit PDF is already linked here, and if you want the exact resume wording copied in, I can replace this text once we extract or paste the final bio line from your PDF.
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="mb-5 text-xl font-bold">Media vault</div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {artistMediaVault.map((item) => (
                      <div
                        key={item[0]}
                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold">{item[0]}</div>
                            <div className="mt-1 text-sm text-white/60">{item[1]}</div>
                          </div>
                          <span className="text-xs text-[#ffb340]">{item[2]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      className={cx(
                        "rounded-xl px-4 py-2 text-sm font-semibold text-black",
                        gradient,
                      )}
                    >
                      <Upload className="mr-2 inline h-4 w-4" />
                      Upload Press Kit
                    </button>
                    <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                      Upload Reel
                    </button>
                    <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                      Upload Video
                    </button>
                    <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                      Upload Photos
                    </button>
                  </div>
                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/20">
                      <img
                        src="/media/sach/profile.jpg"
                        alt="SACH live performance portrait"
                        className="h-64 w-full object-cover"
                      />
                      <div className="p-4 text-sm text-white/70">
                        Primary profile image wired from your real photo.
                      </div>
                    </div>
                    <div className="grid gap-4">
                      <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/20">
                        <video
                          src="/media/sach/showreel.mp4"
                          controls
                          className="h-44 w-full object-cover"
                        />
                        <div className="p-4 text-sm text-white/70">
                          Primary reel ready for profile and booker discovery.
                        </div>
                      </div>
                      <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/20">
                        <video
                          src="/media/sach/live-performance.mov"
                          controls
                          className="h-44 w-full object-cover"
                        />
                        <div className="p-4 text-sm text-white/70">
                          Live performance clip ready as a second showcase video.
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/72">
                    Press kit:
                    <a
                      href="/media/sach/press-kit.pdf"
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 text-[#ffb340] underline underline-offset-4"
                    >
                      Open PDF
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="mb-5 text-xl font-bold">Packages and pricing</div>
                  <div className="space-y-3">
                    {artistPackages.map((item) => (
                      <div
                        key={item.title}
                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-semibold">{item.title}</div>
                          <div className="text-sm font-semibold text-[#ffb340]">
                            {item.price}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-white/65">{item.detail}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      className={cx(
                        "rounded-xl px-4 py-2 text-sm font-semibold text-black",
                        gradient,
                      )}
                    >
                      Add New Package
                    </button>
                    <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                      Update Pricing
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl">
                <CardContent className="p-6" id="artist-enquiries">
                  <div className="mb-5 text-xl font-bold">Live enquiries and bidding</div>
                  <div className="space-y-3">
                    {artistEnquiries.map((lead) => (
                      <div
                        key={`${lead.title}${lead.city}`}
                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="font-semibold">{lead.title}</div>
                            <div className="text-sm text-white/60">
                              {lead.city} • {lead.detail}
                            </div>
                            <div className="mt-1 text-xs text-[#ffb340]">
                              {lead.status} • {lead.budget}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              className={cx(
                                "rounded-full px-3 py-1 text-xs font-semibold text-black",
                                gradient,
                              )}
                            >
                              Accept
                            </button>
                            <button className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                              Bid Amount
                            </button>
                            <button className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                              Message
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-5">
              <Stat v="₹1.8L" l="Monthly revenue" />
              <Stat v="47" l="Shows done" />
              <Stat v="4.9" l="Ratings" />
              <Stat v="3" l="Open enquiries" />
              <Stat v="12" l="Pending bids" />
              <Card className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="mb-4 text-xl font-bold">KYC and compliance</div>
                  <div className="space-y-3">
                    {artistKycRows.map((item) => (
                      <div
                        key={item[0]}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4 text-sm"
                      >
                        <span>{item[0]}</span>
                        <span className="text-white/60">{item[1]}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    className={cx(
                      "mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold text-black",
                      gradient,
                    )}
                  >
                    Upload KYC Documents
                  </button>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="mb-4 text-xl font-bold">Payout snapshot</div>
                  <div className="space-y-3">
                    {artistPayoutRows.map((item) => (
                      <div
                        key={item[0]}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4 text-sm"
                      >
                        <span className="text-white/70">{item[0]}</span>
                        <span className="font-semibold text-white">{item[1]}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="mb-4 text-xl font-bold">What we wire next</div>
                  <div className="space-y-3 text-sm text-white/68">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      Your real photo, reel, performance video, package and press kit
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      Personal details, bio, category, city and stage identity
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      KYC data and payout details from your documents
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      );
    }

    if (page === "cart") {
      if (!bookerLoggedIn) {
        return (
          <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
            <H
              b="Cart"
              t="Login or create account before review."
              d="Bookers must sign up or login with their account before opening saved artists and checkout."
            />
            <div className="mt-8">
              <Button
                onClick={() => setAuthFlow("booker", "signup")}
                className={cx("rounded-2xl font-semibold text-black", gradient)}
              >
                Login or Sign Up
              </Button>
            </div>
          </section>
        );
      }

      return (
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <H
            b="Cart"
            t="Review artists before checkout."
            d="Added artists move into the cart and then continue to payment."
          />
          <div className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="mb-5 text-xl font-bold">Selected artists</div>
                <div className="space-y-3">
                  {cartItems.map((artist) => (
                    <div
                      key={artist[0]}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={artist[7]}
                          alt={artist[0]}
                          className="h-14 w-14 rounded-2xl object-cover"
                        />
                        <div>
                          <div className="font-semibold">{artist[0]}</div>
                          <div className="text-sm text-white/60">
                            {artist[1]} • {artist[3]}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setCartItems((current) =>
                            current.filter((item) => item[0] !== artist[0]),
                          )
                        }
                        className="text-sm text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={() => handleCheckoutGate("payment")}
                    className={cx("font-semibold text-black", gradient)}
                  >
                    Proceed to Payment
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => go("artists")}
                    className="rounded-xl"
                  >
                    Add More Artists
                  </Button>
                </div>
              </CardContent>
            </Card>
            <div className="grid gap-5">
              <Stat v={`${cart}`} l="Artists selected" />
              <Stat v={selectedOccasion} l="Occasion" />
              <Stat v="Ready" l="Checkout status" />
            </div>
          </div>
        </section>
      );
    }

    if (page === "payment") {
      if (!bookerLoggedIn) {
        return (
          <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
            <H
              b="Payment"
              t="Login required before payment."
              d="Returning users go straight to Amazon-style payment, while first-time users sign up and then login with ID and password."
            />
            <div className="mt-8">
              <Button
                onClick={() => {
                  setPendingCheckoutPage("payment");
                  setAuthFlow("booker", "signup");
                }}
                className={cx("rounded-2xl font-semibold text-black", gradient)}
              >
                Login or Sign Up
              </Button>
            </div>
          </section>
        );
      }

      return (
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <H
            b="Payment"
            t="Proceed to secure payment."
            d="A familiar payment experience with saved addresses, UPI, cards, wallet, EMI and fast confirmation."
          />
          <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
            <Card className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="mb-5 text-xl font-bold">Payment summary</div>
                <div className="space-y-3">
                  {[
                    `${cart} artists selected`,
                    `Occasion: ${selectedOccasion}`,
                    `City: ${city}`,
                    "Secure checkout enabled",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/80"
                    >
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-6 grid gap-3">
                  {[
                    "Saved Amazon-like address and contact",
                    "UPI / Wallet / Credit & Debit Cards / Netbanking / EMI",
                    "Order review with artist, schedule and advance amount",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/80"
                    >
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Card holder name" />
                  <Input placeholder="Card number" />
                  <Input placeholder="Expiry" />
                  <Input placeholder="CVV" />
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {["UPI", "Cards", "Wallet"].map((item) => (
                    <button
                      key={item}
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left text-sm text-white/80"
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <Button className={cx("mt-6 font-semibold text-black", gradient)}>
                  Pay Securely
                </Button>
              </CardContent>
            </Card>
            <div className="grid gap-5">
              <Stat v="Secure" l="Payment gateway" />
              <Stat v="Protected" l="Checkout" />
              <Stat v="Instant" l="Booking confirmation" />
              <Stat v="Logged In" l="Account status" />
            </div>
          </div>
        </section>
      );
    }

    if (page === "celebrity") {
      return (
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <H
            b="Celebrity Management"
            t="Premium artists joined with us."
            d="A cleaner premium artist showcase for celebrity management."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {premiumJoined.map((item) => (
              <ImgCard key={item[0]} title={item[0]} sub={item[1]} img={item[2]} />
            ))}
          </div>
        </section>
      );
    }

    if (page === "social") {
      return (
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <H
            b="Social Media"
            t="A proper social media page with image-driven content blocks."
            d="This page is separated out, with visual sections for reels, event moments, client proof and celebrity snippets."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {socials.map((item) => (
              <ImgCard key={item[0]} title={item[0]} img={item[1]} />
            ))}
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
            <Card className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="mb-4 text-xl font-bold">Suggested content flow</div>
                <div className="space-y-3">
                  {[
                    "Featured artist reels",
                    "Premium celebrity highlights",
                    "Client testimonials",
                    "Behind-the-scenes event setup",
                    "Location-based trending artists",
                    "Booking tips and event inspiration",
                  ].map((item, index) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-sm font-semibold">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div>{item}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <ImgCard
              title="Social Proof"
              sub="Visual trust-building for bookers and artists"
              img="https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=1200&q=80"
            />
          </div>
        </section>
      );
    }

    if (page === "verified") {
      return (
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <H
            b="Verified Artists"
            t="Trusted artist profiles."
            d="These cards represent verified artists with stronger trust signals."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {artists.slice(0, 3).map((artist) => (
              <Card
                key={artist[0]}
                className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/5 backdrop-blur-xl"
              >
                <img
                  src={artist[7]}
                  alt={artist[0]}
                  className="h-56 w-full object-cover"
                />
                <CardContent className="p-5">
                  <div className="text-xl font-bold">{artist[0]}</div>
                  <div className="mt-1 text-sm text-white/60">
                    {artist[1]} • {artist[2]}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Verified profile
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      );
    }

    if (page === "cities") {
      return (
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <H
            b="Cities Covered"
            t="Active cities across India."
            d="Browse the cities where discovery is strongest right now."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              [
                "Mumbai",
                "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80",
              ],
              [
                "Pune",
                "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=800&q=80",
              ],
              [
                "Bengaluru",
                "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80",
              ],
              [
                "Delhi",
                "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80",
              ],
            ].map((cityCard) => (
              <ImgCard key={cityCard[0]} title={cityCard[0]} img={cityCard[1]} />
            ))}
          </div>
        </section>
      );
    }

    return simplePage(
      "Booking Management",
      "How GiggFi manages bookings from enquiry to event day.",
      "This explains how the team and platform manage artist selection, confirmation, cart, payment flow and booking summaries.",
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
      [
        "Discovery and shortlist",
        "Cart and selection",
        "Confirmation and payment",
        "Managed event summary",
      ],
    );
  };

  const nav = (
    label: string,
    p?: Page,
    drop?: "services" | "artists",
  ) => (
    <div
      className="relative pb-6"
      onMouseEnter={() => drop && open(drop)}
      onMouseLeave={drop ? close : undefined}
    >
      <button
        onClick={() => p && go(p)}
        className="flex items-center gap-1 text-sm text-white/80 transition hover:text-white"
      >
        {label}
        {drop ? <ChevronDown className="h-4 w-4" /> : null}
      </button>
      {drop === "services" && hover === "services" ? (
        <div
          className="absolute left-0 top-full z-50 w-72 rounded-3xl border border-white/10 bg-[#0f0918]/95 p-3 shadow-2xl backdrop-blur-xl"
          onMouseEnter={() => open("services")}
          onMouseLeave={close}
        >
          {services.map((service) => (
            <button
              key={service[0]}
              onClick={() => go(service[1] as Page)}
              className="mb-1 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-white/80 hover:bg-white/5 hover:text-white"
            >
              {service[0]}
              <ArrowRight className="h-4 w-4" />
            </button>
          ))}
        </div>
      ) : null}
      {drop === "artists" && hover === "artists" ? (
        <div
          className="absolute left-0 top-full z-50 w-80 rounded-3xl border border-white/10 bg-[#0f0918]/95 p-3 shadow-2xl backdrop-blur-xl"
          onMouseEnter={() => open("artists")}
          onMouseLeave={close}
        >
          {artistMenus.map((item) => {
            const Icon = item[2];
            return (
              <button
                key={item[0]}
                onClick={() => go(item[1] as Page)}
                className="mb-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-white/80 hover:bg-white/5 hover:text-white"
              >
                <Icon className="h-4 w-4" />
                {item[0]}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#06020b] text-white">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(171,61,255,0.22),transparent_30%),radial-gradient(circle_at_top_right,rgba(255,183,64,0.16),transparent_28%),radial-gradient(circle_at_bottom,rgba(255,54,171,0.18),transparent_35%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),rgba(255,255,255,0))]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#06020b]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <button onClick={() => go(artistConsoleMode ? "artist-dashboard" : "home")} className="text-left">
            <Wordmark />
          </button>

          <nav className="hidden items-center gap-7 md:flex">
            {artistConsoleMode ? (
              <>
                <button
                  onClick={() => go("artist-dashboard")}
                  className="text-sm text-white/80 transition hover:text-white"
                >
                  Dashboard
                </button>
                <a
                  href="#artist-enquiries"
                  className="text-sm text-white/80 transition hover:text-white"
                >
                  Client Enquiries
                </a>
              </>
            ) : (
              <>
                {nav("Home", "home")}
                {nav("Services", "services", "services")}
                {nav("Booker", "booker-login")}
                {nav("Artists", "artists", "artists")}
                {nav("Celebrity", "celebrity")}
                {nav("Social", "social")}
              </>
            )}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {artistConsoleMode ? (
              <Button
                onClick={() => {
                  setArtistLoggedIn(false);
                  go("home");
                }}
                className={cx("rounded-xl font-semibold text-black", gradient)}
              >
                Logout Artist
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => go("cart")}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Cart ({cart})
                </Button>
                <Button
                  onClick={() =>
                    bookerLoggedIn ? go("booker-dashboard") : setAuthFlow("booker", "signup")
                  }
                  className={cx("rounded-xl font-semibold text-black", gradient)}
                >
                  {bookerLoggedIn ? "Dashboard" : "Login"}
                </Button>
              </>
            )}
          </div>

          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 md:hidden"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen ? (
          <div className="border-t border-white/10 bg-[#0d0717] md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4">
              {artistConsoleMode ? (
                <>
                  <button
                    onClick={() => go("artist-dashboard")}
                    className="text-left text-white/80"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      requestAnimationFrame(() => {
                        document.getElementById("artist-enquiries")?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      });
                    }}
                    className="text-left text-white/80"
                  >
                    Client Enquiries
                  </button>
                  <button
                    onClick={() => {
                      setArtistLoggedIn(false);
                      setMenuOpen(false);
                      go("home");
                    }}
                    className="text-left text-white/80"
                  >
                    Logout Artist
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => go("home")} className="text-left text-white/80">
                    Home
                  </button>
                  <button
                    onClick={() => go("services")}
                    className="text-left text-white/80"
                  >
                    Services
                  </button>
                  {services.map((service) => (
                    <button
                      key={service[0]}
                      onClick={() => go(service[1] as Page)}
                      className="pl-4 text-left text-sm text-white/60"
                    >
                      • {service[0]}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      bookerLoggedIn ? go("booker-dashboard") : setAuthFlow("booker", "signup")
                    }
                    className="text-left text-white/80"
                  >
                    Booker
                  </button>
                  <button
                    onClick={() => go("artists")}
                    className="text-left text-white/80"
                  >
                    Artists
                  </button>
                  {artistMenus.map((item) => (
                    <button
                      key={item[0]}
                      onClick={() => go(item[1] as Page)}
                      className="pl-4 text-left text-sm text-white/60"
                    >
                      • {item[0]}
                    </button>
                  ))}
                  <button
                    onClick={() => go("celebrity")}
                    className="text-left text-white/80"
                  >
                    Celebrity
                  </button>
                  <button
                    onClick={() => go("social")}
                    className="text-left text-white/80"
                  >
                    Social
                  </button>
                </>
              )}
            </div>
          </div>
        ) : null}
      </header>

      <div className="sticky top-[81px] z-40 border-b border-white/5 bg-[#06020b]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 text-sm text-white/45 md:px-6">
          <div className="flex items-center gap-3">
            <BackBtn
              show={page !== "home"}
              onClick={() => go(artistConsoleMode ? "artist-dashboard" : "home")}
            />
            <span>{pageNames[page]}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {artistConsoleMode ? "Artist dashboard preview" : "Premium booking interface preview"}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.main
          key={page}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
        >
          {body()}
        </motion.main>
      </AnimatePresence>

      {showAppPopup ? (
        <div className="fixed bottom-6 right-6 z-[70] max-w-sm rounded-[1.5rem] border border-white/10 bg-[#12091d]/95 p-5 shadow-2xl backdrop-blur-xl">
          <button
            onClick={() => setShowAppPopup(false)}
            className="absolute right-3 top-3 text-white/50"
          >
            ✕
          </button>
          <div className="text-lg font-bold">Download GiggFi App</div>
          <div className="mt-2 text-sm text-white/65">
            Get faster booking on iOS and Android.
          </div>
          <div className="mt-4 flex gap-3">
            <button
              className={cx(
                "rounded-xl px-4 py-2 text-sm font-semibold text-black",
                gradient,
              )}
            >
              iOS App
            </button>
            <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/85">
              Android App
            </button>
          </div>
        </div>
      ) : null}

      <footer className="border-t border-white/8 bg-[#05010a]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-md text-white/62">
              Premium entertainer discovery and booking for weddings,
              corporates, clubs, hospitality and private events.
            </p>
            <SocialIcons />
          </div>

          <div>
            <div className="font-bold">Navigation</div>
            <div className="mt-4 space-y-3 text-white/65">
              {artistConsoleMode ? (
                <>
                  <button onClick={() => go("artist-dashboard")} className="block hover:text-white">
                    Dashboard
                  </button>
                  <a href="#artist-enquiries" className="block hover:text-white">
                    Client Enquiries
                  </a>
                  <button
                    onClick={() => {
                      setArtistLoggedIn(false);
                      go("home");
                    }}
                    className="block hover:text-white"
                  >
                    Logout Artist
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => go("home")} className="block hover:text-white">
                    Home
                  </button>
                  <button
                    onClick={() => go("services")}
                    className="block hover:text-white"
                  >
                    Services
                  </button>
                  <button
                    onClick={() => go("artists")}
                    className="block hover:text-white"
                  >
                    Artists
                  </button>
                  <button
                    onClick={() => go("celebrity")}
                    className="block hover:text-white"
                  >
                    Celebrity
                  </button>
                </>
              )}
            </div>
          </div>

          <div>
            <div className="font-bold">Categories</div>
            <div className="mt-4 space-y-3 text-white/65">
              {artistConsoleMode ? (
                <>
                  <button
                    onClick={() => go("artist-dashboard")}
                    className="block hover:text-white"
                  >
                    Media Vault
                  </button>
                  <button
                    onClick={() => go("artist-dashboard")}
                    className="block hover:text-white"
                  >
                    Packages
                  </button>
                  <button
                    onClick={() => go("artist-dashboard")}
                    className="block hover:text-white"
                  >
                    KYC
                  </button>
                </>
              ) : (
                artistMenus.slice(0, 4).map((item) => (
                  <button
                    key={item[0]}
                    onClick={() => go(item[1] as Page)}
                    className="block hover:text-white"
                  >
                    {item[0]}
                  </button>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="font-bold">Quick Actions</div>
            <div className="mt-4 space-y-3 text-white/65">
              {artistConsoleMode ? (
                <>
                  <button
                    onClick={() => go("artist-dashboard")}
                    className="block hover:text-white"
                  >
                    Dashboard Home
                  </button>
                  <a href="#artist-enquiries" className="block hover:text-white">
                    Open Client Enquiries
                  </a>
                  <button
                    onClick={() => {
                      setArtistLoggedIn(false);
                      go("home");
                    }}
                    className="block hover:text-white"
                  >
                    Logout Artist
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => go("booker-login")}
                    className="block hover:text-white"
                  >
                    Booker Login
                  </button>
                  <button
                    onClick={() => go("artist-login")}
                    className="block hover:text-white"
                  >
                    Artist Login
                  </button>
                  <button onClick={() => go("cart")} className="block hover:text-white">
                    Open Cart
                  </button>
                  <button
                    onClick={() => handleCheckoutGate("payment")}
                    className="block hover:text-white"
                  >
                    Payment
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
