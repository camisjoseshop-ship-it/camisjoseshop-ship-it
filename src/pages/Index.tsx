import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, MessageCircle, Truck, Shield, Headphones, ShoppingBag, Star, ChevronRight, Phone, Mail, User } from "lucide-react";
import { CartDrawer } from "@/components/CartDrawer";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";

import { WHATSAPP_URL, CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/constants";
import OrderTracking from "@/components/OrderTracking";
import ProductGrid, { PRODUCT_CATEGORIES } from "@/components/ProductGrid";
import ReviewsSection from "@/components/ReviewsSection";
import RecentPurchasePopup from "@/components/RecentPurchasePopup";
import ChatWidget from "@/components/ChatWidget";
import EarbudsShowcase from "@/components/EarbudsShowcase";
import LuckyWheel from "@/components/LuckyWheel";
import mundialBanner from "@/assets/espana-campeona-2026.png.asset.json";
import heroJersey from "@/assets/hero-jersey.jpg";

const NAV_LINKS = [
  { label: "Productos", href: "#productos" },
  { label: "Ligas", href: "#categorias" },
  { label: "Precios", href: "#precios" },
  { label: "Reseñas", href: "#resenas" },
  { label: "Seguimiento", href: "#seguimiento" },
  { label: "Contacto", href: "#contacto" },
];

const PRICES = [
  { name: "Retro (1800-2019)", price: "38,00€", icon: "🏛️" },
  { name: "Chándal Invierno", price: "60,00€", icon: "🧥" },
  { name: "Chándal Corto", price: "50,00€", icon: "👕" },
  { name: "Niño / Equipaciones", price: "33,00€", icon: "👦" },
  { name: "Versión Jugador", price: "33,00€", icon: "⚽" },
  { name: "Versión Fan", price: "30,00€", icon: "🙌" },
  { name: "Pantalones", price: "25,00€", icon: "👖" },
  { name: "Calcetines", price: "20,00€", icon: "🧦" },
  { name: "Sudaderas", price: "27,00€", icon: "🧤" },
];

const CATEGORIES = [
  { name: "La Liga", flag: "🇪🇸", teams: ["Real Madrid", "FC Barcelona", "Atlético de Madrid", "Athletic Club"] },
  { name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", teams: ["Manchester United", "Liverpool", "Arsenal", "Chelsea"] },
  { name: "Serie A", flag: "🇮🇹", teams: ["AC Milan", "Juventus", "Inter de Milán", "AS Roma"] },
  { name: "Bundesliga", flag: "🇩🇪", teams: ["Bayern München", "Borussia Dortmund", "Bayer Leverkusen"] },
  { name: "Ligue 1", flag: "🇫🇷", teams: ["PSG", "Olympique de Marsella", "AS Monaco"] },
  { name: "Américas", flag: "🌎", teams: ["Boca Juniors", "River Plate", "Flamengo", "Club América"] },
  { name: "Retro", flag: "🏛️", teams: ["Clásicas históricas", "Ediciones especiales", "Colección vintage"] },
  { name: "Selecciones", flag: "🏆", teams: ["España", "Argentina", "Brasil", "Francia"] },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground text-center py-1.5 text-xs md:text-sm font-medium tracking-wider">
        ENVÍO GRATUITO EN TODA ESPAÑA · PERSONALIZACIÓN INCLUIDA
      </div>

      <div className="container flex items-center justify-between h-16 px-4">
        <a href="#" className="font-heading text-2xl md:text-3xl font-bold text-primary tracking-widest">
          CAMISJOSE
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors uppercase tracking-wide"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/cuenta"
            className="inline-flex items-center gap-2 border border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
            title="Mi cuenta"
          >
            <User className="w-4 h-4" />
            <span className="hidden md:inline">Mi cuenta</span>
          </Link>
          <CartDrawer />
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
          <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-medium text-foreground/80 hover:text-primary uppercase tracking-wide"
            >
              {link.label}
            </a>
          ))}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-foreground px-4 py-2 rounded-md text-sm font-medium w-fit"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
        </nav>
      )}
    </header>
  );
};

const HeroSection = () => (
  <section className="relative overflow-hidden min-h-[88vh] flex items-center">
    {/* Background image */}
    <div className="absolute inset-0">
      <img
        src={heroJersey}
        alt="Camiseta de fútbol premium iluminada por focos de estadio"
        className="w-full h-full object-cover"
        width={1920}
        height={1280}
        fetchPriority="high"
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-background/95" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
    </div>

    <div className="relative container px-4 py-20 md:py-28">
      <div className="max-w-3xl mx-auto text-center">

        <p className="text-primary font-heading text-sm md:text-base tracking-[0.4em] mb-4 uppercase">
          Tienda Oficial · Envío desde España
        </p>

        <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold text-foreground leading-[0.95] mb-6">
          TU LEYENDA.
          <br />
          <span className="bg-gradient-to-r from-primary via-yellow-300 to-primary bg-clip-text text-transparent">TU CAMISETA.</span>
        </h1>

        <p className="text-muted-foreground text-base md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
          Camisetas premium con <span className="text-foreground font-semibold">nombre, dorsal y parche oficial</span> incluidos. Calidad réplica jugador y envío gratis en toda España.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-10">
          <a href="#productos">
            <Button size="lg" className="text-base md:text-lg px-8 py-6 font-heading tracking-wider shadow-[0_10px_40px_-10px_hsl(43_38%_54%/0.6)] hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5 mr-2" />
              VER CATÁLOGO
            </Button>
          </a>
          <a href="#productos" onClick={() => window.dispatchEvent(new CustomEvent("filter-products", { detail: "title:España OR title:Argentina OR title:Brasil OR title:Francia OR title:Alemania OR title:Portugal" }))}>
            <Button size="lg" variant="outline" className="text-base md:text-lg px-8 py-6 font-heading tracking-wider border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              🏆 MUNDIAL 2026
            </Button>
          </a>
        </div>

        {/* Trust strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-3xl mx-auto pt-8 border-t border-border/50">
          <div className="text-center">
            <div className="font-heading text-2xl md:text-3xl font-bold text-primary">+4.700</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Productos</div>
          </div>
          <div className="text-center">
            <div className="font-heading text-2xl md:text-3xl font-bold text-primary">+12.000</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Clientes</div>
          </div>
          <div className="text-center">
            <div className="font-heading text-2xl md:text-3xl font-bold text-primary flex items-center justify-center gap-1">
              4,9 <Star className="w-5 h-5 fill-primary" />
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Valoración</div>
          </div>
          <div className="text-center">
            <div className="font-heading text-2xl md:text-3xl font-bold text-primary">7-15</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Días entrega</div>
          </div>
        </div>
      </div>
    </div>

    {/* Bottom fade */}
    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
  </section>
);

const MundialBanner = () => (
  <section className="py-4 md:py-6">
    <div className="container px-4">
      <div className="max-w-4xl mx-auto">
        <a
          href="#productos"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("filter-products", { detail: "title:España OR title:Argentina OR title:Brasil OR title:Francia OR title:Alemania OR title:Portugal OR title:Italia OR title:México OR title:Uruguay OR title:Colombia" }));
          }}
          className="block relative rounded-2xl overflow-hidden group cursor-pointer border border-primary/20 shadow-xl mx-auto"
          aria-label="Mundial 2026 - Ver camisetas de selecciones"
        >
          <img
            src={mundialBanner.url}
            alt="España Campeona del Mundo 2026"
            className="w-full h-auto object-cover aspect-[16/7] max-h-[280px] group-hover:scale-[1.02] transition-transform duration-500"
            width={1280}
            height={560}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        </a>
      </div>
    </div>
  </section>
);

const MUNDIAL_TEAMS = [
  { name: "Argentina", flag: "🇦🇷", query: "title:Argentina" },
  { name: "España", flag: "🇪🇸", query: "title:España" },
  { name: "Brasil", flag: "🇧🇷", query: "title:Brasil" },
  { name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", query: "title:Inglaterra OR title:England" },
  { name: "Alemania", flag: "🇩🇪", query: "title:Alemania OR title:Germany" },
  { name: "Francia", flag: "🇫🇷", query: "title:Francia OR title:France" },
  { name: "Portugal", flag: "🇵🇹", query: "title:Portugal" },
];

const MundialTopSellers = () => {
  const handleClick = (query: string) => {
    window.dispatchEvent(new CustomEvent("filter-products", { detail: query }));
  };

  return (
    <section className="py-12 md:py-16 bg-secondary/30">
      <div className="container px-4">
        <div className="text-center mb-10">
          <div className="inline-block bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3">
            TOP VENTAS
          </div>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-3">
            MÁS VENDIDAS <span className="text-primary">MUNDIAL 2026</span>
          </h2>
          <p className="text-muted-foreground text-lg">Las selecciones más pedidas por nuestros clientes</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {MUNDIAL_TEAMS.map((team, idx) => (
            <button
              key={team.name}
              onClick={() => handleClick(team.query)}
              className="group relative rounded-lg border border-border bg-card p-5 hover:border-primary transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--primary)/0.25)] hover:-translate-y-1 cursor-pointer text-center"
            >
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {idx + 1}
              </div>
              <div className="text-5xl mb-2">{team.flag}</div>
              <h3 className="font-heading text-base font-bold text-foreground group-hover:text-primary transition-colors uppercase tracking-wide">
                {team.name}
              </h3>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};




const PriceSection = () => (
  <section id="precios" className="py-12 md:py-16">
    <div className="container px-4">
      <div className="text-center mb-10">
        <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-3">
          NUESTROS <span className="text-primary">PRECIOS</span>
        </h2>
        <p className="text-muted-foreground text-lg">Personalización incluida: nombre, número y parches</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PRICES.map((item) => (
          <div
            key={item.name}
            className="group rounded-lg border border-border bg-card p-6 hover:border-primary transition-all duration-300 hover:shadow-[0_0_20px_hsl(43_38%_54%/0.15)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <span className="font-medium text-foreground">{item.name}</span>
              </div>
              <span className="font-heading text-2xl font-bold text-primary">{item.price}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const CategoriesSection = () => {
  const handleCategoryClick = (catName: string) => {
    // Find matching product category
    const match = PRODUCT_CATEGORIES.find((pc) => pc.label === catName);
    if (match) {
      window.dispatchEvent(new CustomEvent("filter-products", { detail: match.query }));
    }
  };

  return (
    <section id="categorias" className="py-12 md:py-16">
      <div className="container px-4">
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-3">
            EXPLORA POR <span className="text-primary">LIGA</span>
          </h2>
          <p className="text-muted-foreground text-lg">Encuentra la camiseta de tu equipo favorito</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => handleCategoryClick(cat.name)}
              className="group rounded-lg border border-border bg-card p-5 hover:border-primary transition-all duration-300 hover:shadow-[0_0_20px_hsl(43_38%_54%/0.15)] cursor-pointer text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{cat.flag}</span>
                <h3 className="font-heading text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {cat.name}
                </h3>
              </div>
              <div className="space-y-1">
                {cat.teams.map((team) => (
                  <div key={team} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ChevronRight className="w-3 h-3 text-primary" />
                    {team}
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

const BenefitsSection = () => (
  <section className="py-12 md:py-16 border-y border-border">
    <div className="container px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Truck, title: "Envío GRATIS", desc: "En todos los pedidos, sin mínimo" },
          { icon: Headphones, title: "Atención VIP", desc: "Atención personalizada por WhatsApp" },
          { icon: Shield, title: "Pago 100% Seguro", desc: "Bizum, transferencia o PayPal" },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
              <Icon className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-heading text-xl font-bold text-foreground mb-1">{title}</h3>
            <p className="text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer id="contacto" className="py-12 border-t border-border">
    <div className="container px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-heading text-2xl font-bold text-primary tracking-widest mb-3">CAMISJOSE</h3>
          <p className="text-muted-foreground text-sm">
            Tu tienda de confianza para camisetas de fútbol. Calidad premium, personalización incluida y los mejores precios.
          </p>
        </div>
        <div>
          <h4 className="font-heading text-lg font-bold text-foreground mb-3">CATEGORÍAS</h4>
          <div className="space-y-2">
            {["La Liga", "Premier League", "Serie A", "Bundesliga", "Retro", "Selecciones"].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  const match = PRODUCT_CATEGORIES.find((pc) => pc.label === cat);
                  if (match) window.dispatchEvent(new CustomEvent("filter-products", { detail: match.query }));
                }}
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-heading text-lg font-bold text-foreground mb-3">CONTACTO</h4>
          <div className="space-y-3 text-sm text-muted-foreground">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
              <MessageCircle className="w-4 h-4" />
              WhatsApp: {CONTACT_PHONE}
            </a>
            <a href={`tel:+34${CONTACT_PHONE.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-primary transition-colors">
              <Phone className="w-4 h-4" />
              {CONTACT_PHONE}
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-2 hover:text-primary transition-colors">
              <Mail className="w-4 h-4" />
              {CONTACT_EMAIL}
            </a>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              <span>⭐⭐⭐⭐⭐ +500 clientes satisfechos</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex flex-wrap justify-center gap-4 mb-4 text-xs text-muted-foreground">
          <span>Política de cambios y devoluciones</span>
          <span>·</span>
          <span>Política de envío y entrega (7-15 días)</span>
          <span>·</span>
          <span>Política de privacidad</span>
          <span>·</span>
          <span>Términos y condiciones</span>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Camisjose. Todos los derechos reservados.
        </p>
      </div>
    </div>
  </footer>
);

const WhatsAppFloat = () => (
  <a
    href={WHATSAPP_URL}
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
    aria-label="Contactar por WhatsApp"
  >
    <MessageCircle className="w-7 h-7 text-foreground" />
  </a>
);

const Index = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <HeroSection />
    <MundialBanner />
    <MundialTopSellers />
    <ProductGrid />
    <LuckyWheel />
    <EarbudsShowcase />
    <PriceSection />
    <CategoriesSection />
    <ReviewsSection />
    <OrderTracking />
    <BenefitsSection />
    <Footer />
    <WhatsAppFloat />
    <ChatWidget />
    <RecentPurchasePopup />
  </div>
);

export default Index;
