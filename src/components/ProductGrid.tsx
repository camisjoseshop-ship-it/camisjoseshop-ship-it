import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Loader2, ChevronDown, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";

const ProductCard = ({ product }: { product: ShopifyProduct["node"] }) => {
  const navigate = useNavigate();
  const image = product.images.edges[0]?.node;
  const price = parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2);

  const goToProduct = () => navigate(`/product/${product.handle}`);

  return (
    <div className="group rounded-lg border border-border bg-card overflow-hidden hover:border-primary transition-all duration-300 hover:shadow-[0_0_20px_hsl(43_38%_54%/0.15)] cursor-pointer" onClick={goToProduct}>
      <div className="aspect-square bg-secondary overflow-hidden">
        {image ? (
          <img
            src={image.url}
            alt={image.altText || product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-foreground text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
          {product.title}
        </h3>
        <div className="flex items-center justify-between">
          <span className="font-heading text-xl font-bold text-primary">
            {price}€
          </span>
          <Button size="sm" className="text-xs" onClick={(e) => { e.stopPropagation(); goToProduct(); }}>
            <ShoppingBag className="w-3 h-3 mr-1" />
            Ver
          </Button>
        </div>
      </div>
    </div>
  );
};

export const PRODUCT_CATEGORIES = [
  { label: "Todos", query: "", emoji: "🔥" },
  { label: "La Liga", query: "title:Real Madrid OR title:Barcelona OR title:Atlético OR title:Athletic OR title:Betis OR title:Sevilla OR title:Valencia OR title:Villarreal", emoji: "🇪🇸" },
  { label: "Premier League", query: "title:Manchester OR title:Liverpool OR title:Arsenal OR title:Chelsea OR title:Tottenham OR title:Newcastle", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { label: "Serie A", query: "title:Milan OR title:Juventus OR title:Inter OR title:Roma OR title:Napoli OR title:Lazio", emoji: "🇮🇹" },
  { label: "Bundesliga", query: "title:Bayern OR title:Dortmund OR title:Leverkusen OR title:Leipzig", emoji: "🇩🇪" },
  { label: "Ligue 1", query: "title:PSG OR title:Marsella OR title:Monaco OR title:Lyon", emoji: "🇫🇷" },
  { label: "Américas", query: "title:Boca OR title:River OR title:Flamengo OR title:América OR title:Santos OR title:Corinthians", emoji: "🌎" },
  { label: "Retro", query: "title:Retro OR title:retro", emoji: "🏛️" },
  { label: "Selecciones", query: "title:España OR title:Argentina OR title:Brasil OR title:Francia OR title:Alemania OR title:Portugal OR title:Italia", emoji: "🏆" },
  { label: "Calcetines", query: "title:Calcetines", emoji: "🧦" },
  { label: "Chándal", query: "title:Chándal", emoji: "🧥" },
];

const ProductGrid = () => {
  const [products, setProducts] = useState<ShopifyProduct["node"][]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Helper to score products: World Cup 2026 selecciones first, then jerseys
  const PRIORITY_TEAMS = [
    { keys: ["argentina"], rank: 1 },
    { keys: ["españa", "espana", "spain"], rank: 2 },
    { keys: ["brasil", "brazil"], rank: 3 },
    { keys: ["inglaterra", "england"], rank: 4 },
    { keys: ["alemania", "germany", "deutschland"], rank: 5 },
    { keys: ["francia", "france"], rank: 6 },
    { keys: ["portugal"], rank: 7 },
  ];

  const sortJerseysFirst = (items: ShopifyProduct["node"][]) => {
    const jerseyKeywords = ["camiseta", "kit", "equipación", "jersey", "maillot", "maglia", "trikot"];
    const longSleeveKeywords = ["manga larga", "long sleeve", "ml ", " ml"];
    const isJersey = (title: string) => jerseyKeywords.some(kw => title.toLowerCase().includes(kw));
    const isShortSleeve = (title: string) => !longSleeveKeywords.some(kw => title.toLowerCase().includes(kw));
    const is2026 = (title: string) => {
      const t = title.toLowerCase();
      return t.includes("2026") || t.includes("25/26") || t.includes("25-26") || t.includes("2025/26") || t.includes("2025-26");
    };
    const teamRank = (title: string) => {
      const t = title.toLowerCase();
      const match = PRIORITY_TEAMS.find(p => p.keys.some(k => t.includes(k)));
      return match ? match.rank : 99;
    };

    return [...items].sort((a, b) => {
      const aTitle = a.title;
      const bTitle = b.title;
      // Tier 1: priority selección + short sleeve + 2026
      const aPriority = teamRank(aTitle) < 99 && isShortSleeve(aTitle) && is2026(aTitle);
      const bPriority = teamRank(bTitle) < 99 && isShortSleeve(bTitle) && is2026(bTitle);
      if (aPriority && !bPriority) return -1;
      if (!aPriority && bPriority) return 1;
      if (aPriority && bPriority) return teamRank(aTitle) - teamRank(bTitle);

      // Tier 2: any short sleeve 2026 jersey
      const a2026 = isJersey(aTitle) && isShortSleeve(aTitle) && is2026(aTitle);
      const b2026 = isJersey(bTitle) && isShortSleeve(bTitle) && is2026(bTitle);
      if (a2026 && !b2026) return -1;
      if (!a2026 && b2026) return 1;

      // Tier 3: any jersey before non-jersey
      const aIsJersey = isJersey(aTitle) ? 1 : 0;
      const bIsJersey = isJersey(bTitle) ? 1 : 0;
      return bIsJersey - aIsJersey;
    });
  };

  const loadProducts = async (query: string, append = false, after?: string) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const result = await fetchProducts(24, query || undefined, after);
      if (result) {
        const newProducts = result.edges
          .map((e: ShopifyProduct) => e.node)
          .filter((p: ShopifyProduct["node"]) => {
            const t = p.title.toLowerCase();
            return !t.includes("airpod") && !t.includes("auricular") && !t.includes("earbud") && !t.includes("headphone");
          });
        // Sort jerseys first, then by Shopify's best-selling order
        const sorted = sortJerseysFirst(newProducts);
        setProducts(prev => append ? [...prev, ...sorted] : sorted);
        setEndCursor(result.pageInfo.endCursor);
        setHasNextPage(result.pageInfo.hasNextPage);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const currentQuery = searchTerm ? `title:*${searchTerm}*` : activeCategory;

  useEffect(() => {
    loadProducts(currentQuery);
  }, [activeCategory]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      const query = value ? `title:*${value}*` : activeCategory;
      loadProducts(query);
    }, 500);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    const query = searchTerm ? `title:*${searchTerm}*` : activeCategory;
    loadProducts(query);
  };

  // Expose method to set category from outside (used by league cards)
  useEffect(() => {
    const handler = (e: CustomEvent<string>) => {
      setSearchTerm("");
      setActiveCategory(e.detail);
      sectionRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    window.addEventListener("filter-products", handler as EventListener);
    return () => window.removeEventListener("filter-products", handler as EventListener);
  }, []);

  return (
    <section id="productos" ref={sectionRef} className="py-12 md:py-16">
      <div className="container px-4">
        <div className="text-center mb-8">
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-3">
            NUESTROS <span className="text-primary">PRODUCTOS</span>
          </h2>
          <p className="text-muted-foreground text-lg">Camisetas de fútbol · Personalización incluida</p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar equipo, liga o producto..."
              aria-label="Buscar"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground h-11"
            />
          </div>
        </form>

        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {PRODUCT_CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => { setSearchTerm(""); setActiveCategory(cat.query); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeCategory === cat.query && !searchTerm
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-primary/20"
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground text-xl font-heading font-semibold mb-2">
              No hay productos todavía
            </p>
            <p className="text-muted-foreground text-lg max-w-md mx-auto mb-6">
              La tienda Shopify conectada está vacía. Crea productos desde el chat o impórtalos por CSV desde tu tienda anterior.
            </p>
            <Button
              variant="outline"
              size="lg"
              onClick={() => loadProducts(currentQuery)}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {hasNextPage && (
              <div className="text-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => loadProducts(currentQuery, true, endCursor || undefined)}
                  disabled={loadingMore}
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  {loadingMore ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ChevronDown className="w-4 h-4 mr-2" />
                  )}
                  Cargar más productos
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;
