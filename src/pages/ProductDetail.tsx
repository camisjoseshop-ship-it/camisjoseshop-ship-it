import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, ShoppingBag, ShoppingCart, Minus, Plus, Shirt, Hash, User, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { storefrontApiRequest } from "@/lib/shopify";
import { useCartStore, type CartItem, type CartCustomization } from "@/stores/cartStore";
import { CartDrawer } from "@/components/CartDrawer";
import { toast } from "sonner";
import sizeNino from "@/assets/size-nino.webp.asset.json";
import sizeJugador from "@/assets/size-jugador.webp.asset.json";
import sizeFanS from "@/assets/size-fan-s3xl.webp.asset.json";
import sizeFanXXL from "@/assets/size-fan-2xl4xl.webp.asset.json";
import sizeMujer from "@/assets/size-mujer.webp.asset.json";

const getSizeGuides = (title: string): { label: string; url: string }[] => {
  const t = title.toLowerCase();
  if (t.includes("calcet") || t.includes("airpod") || t.includes("auricular")) return [];
  if (t.includes("niño") || t.includes("niña") || t.includes("kid") || t.includes("junior") || t.includes("infantil") || t.includes("conjunto")) {
    return [{ label: "Conjunto Infantil", url: sizeNino.url }];
  }
  if (t.includes("mujer") || t.includes("women") || t.includes("femenin")) {
    return [{ label: "Mujer", url: sizeMujer.url }];
  }
  if (t.includes("jugador") || t.includes("player")) {
    return [{ label: "Versión Jugador", url: sizeJugador.url }];
  }
  // Fan / Aficionado (default para camisetas/chándals adultos)
  return [
    { label: "Aficionados (S · M · L · XL · 2XL · 3XL)", url: sizeFanS.url },
    { label: "Aficionados Tallas Grandes (2XL · 3XL · 4XL)", url: sizeFanXXL.url },
  ];
};

const PRODUCT_BY_HANDLE_QUERY = `
  query GetProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      description
      handle
      priceRange {
        minVariantPrice { amount currencyCode }
      }
      images(first: 10) {
        edges { node { url altText } }
      }
      variants(first: 30) {
        edges {
          node {
            id title
            price { amount currencyCode }
            availableForSale
            selectedOptions { name value }
          }
        }
      }
      options { name values }
    }
  }
`;

const isSocks = (title: string) => {
  const t = title.toLowerCase();
  return t.includes("calcetín") || t.includes("calcetines") || t.includes("sock");
};

const isNonCustomizable = (title: string) => {
  const t = title.toLowerCase();
  return isSocks(t) || t.includes("airpod") || t.includes("auricular") || t.includes("earbud") || t.includes("headphone") || t.includes("audífono");
};

const getProductDescription = (title: string, description: string) => {
  if (description && description.trim().length > 10) return description;
  const t = title.toLowerCase();
  if (isSocks(t)) return "Calcetines deportivos de alta gama confeccionados con tejido técnico transpirable, refuerzo en talón y puntera y compresión graduada para máximo confort durante el partido. Talla única adaptable. Acabados profesionales y durabilidad garantizada.";
  if (t.includes("chándal")) return "Chándal premium completo, compuesto por chaqueta con cremallera integral y pantalón de corte slim con puños elásticos. Tejido técnico transpirable, ligero y de secado rápido. Costuras reforzadas y acabados de primera calidad para entrenamiento y uso casual.";
  if (t.includes("retro") || t.includes("vintage")) return "Edición retro que reproduce con fidelidad el diseño original de la temporada. Tejido suave de alta calidad, escudo y patrocinadores serigrafiados conforme al modelo histórico. Pieza de colección recomendada para aficionados al fútbol clásico.";
  if (t.includes("niño") || t.includes("kid") || t.includes("junior")) return "Equipación infantil fabricada en tejido DryFit transpirable y ligero, pensada para el rendimiento y la comodidad de los más pequeños. Colores resistentes al lavado, costuras reforzadas y personalización incluida sin coste adicional.";
  if (t.includes("pantalón") || t.includes("short")) return "Pantalón deportivo profesional con tejido ligero, transpirable y de secado rápido. Cintura elástica ajustable y costuras planas que evitan rozaduras. Complemento ideal para completar la equipación oficial.";
  if (t.includes("sudadera") || t.includes("hoodie")) return "Sudadera de calidad superior con interior afelpado y exterior resistente. Capucha ajustable, bolsillo canguro y puños elásticos. Diseñada para ofrecer abrigo y comodidad sin renunciar al estilo deportivo.";
  return "Camiseta de fútbol réplica de gama premium, confeccionada en tejido DryFit transpirable. Colores firmes, costuras reforzadas y ajuste corporal preciso. Incluye personalización gratuita: nombre, dorsal y parche oficial de competición.";
};

const PARCHE_OPTIONS = [
  { value: "", label: "Sin parche" },
  { value: "La Liga", label: "🇪🇸 La Liga" },
  { value: "Champions League", label: "🏆 Champions League" },
  { value: "Premier League", label: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League" },
  { value: "Serie A", label: "🇮🇹 Serie A" },
  { value: "Bundesliga", label: "🇩🇪 Bundesliga" },
  { value: "Ligue 1", label: "🇫🇷 Ligue 1" },
  { value: "Copa América", label: "🌎 Copa América" },
  { value: "Eurocopa", label: "🇪🇺 Eurocopa" },
  { value: "Mundial", label: "🌍 Mundial" },
];

const ProductDetail = () => {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [customization, setCustomization] = useState<CartCustomization>({ nombre: "", numero: "", parche: "" });
  const addItem = useCartStore(state => state.addItem);
  const isCartLoading = useCartStore(state => state.isLoading);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
        const p = data?.data?.productByHandle;
        if (p) {
          setProduct(p);
          const defaults: Record<string, string> = {};
          p.options?.forEach((opt: any) => {
            if (opt.values.length > 0) defaults[opt.name] = opt.values[0];
          });
          setSelectedOptions(defaults);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [handle]);

  const getSelectedVariant = () => {
    if (!product) return null;
    return product.variants.edges.find((v: any) =>
      v.node.selectedOptions.every((opt: any) => selectedOptions[opt.name] === opt.value)
    )?.node;
  };

  const productIsSocks = product ? isNonCustomizable(product.title) : false;

  const handleAddToCart = async () => {
    const variant = getSelectedVariant();
    if (!variant) { toast.error("Selecciona todas las opciones"); return; }
    if (!variant.availableForSale) { toast.error("Esta variante no está disponible"); return; }

    const cartProduct = {
      node: {
        id: product.id,
        title: product.title,
        description: product.description,
        handle: product.handle,
        priceRange: product.priceRange,
        images: product.images,
        variants: product.variants,
        options: product.options,
      }
    };

    await addItem({
      product: cartProduct,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity,
      selectedOptions: variant.selectedOptions || [],
      customization: productIsSocks ? undefined : {
        nombre: customization.nombre || undefined,
        numero: customization.numero || undefined,
        parche: customization.parche || undefined,
      },
    });

    toast.success("Añadido al carrito", { description: product.title });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <ShoppingBag className="w-16 h-16 text-muted-foreground" />
        <p className="text-muted-foreground text-lg">Producto no encontrado</p>
        <Button onClick={() => navigate("/")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>
      </div>
    );
  }

  const images = product.images.edges.map((e: any) => e.node);
  const selectedVariant = getSelectedVariant();
  const variantPrice = selectedVariant
    ? parseFloat(selectedVariant.price.amount).toFixed(2)
    : parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2);
  const enhancedDescription = getProductDescription(product.title, product.description);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver
            </Button>
            <span className="font-heading text-xl font-bold text-primary">CAMISJOSE</span>
          </div>
          <CartDrawer />
        </div>
      </div>

      <div className="container px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-xl overflow-hidden bg-secondary border border-border shadow-lg">
              {images.length > 0 ? (
                <img src={images[selectedImage]?.url} alt={images[selectedImage]?.altText || product.title} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-20 h-20 text-muted-foreground" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img: any, i: number) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-md overflow-hidden border-2 shrink-0 transition-colors ${selectedImage === i ? "border-primary" : "border-border"}`}>
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">{product.title}</h1>
              <p className="font-heading text-3xl md:text-4xl font-bold text-primary">{variantPrice}€</p>
              <p className="text-xs text-muted-foreground mt-1">Personalización incluida en el precio</p>
            </div>

            {/* Description */}
            <div className="rounded-xl p-6 border border-border bg-card">
              <h2 className="font-heading text-sm font-bold text-primary uppercase tracking-widest mb-3">Descripción</h2>
              <p className="text-foreground/90 text-base leading-relaxed">{enhancedDescription}</p>
            </div>

            {/* Talla */}
            {/* Talla */}
            <div className="border border-primary/30 rounded-xl p-5 bg-primary/5">
              <label className="text-lg font-heading font-bold text-foreground mb-3 flex items-center gap-2">
                <Shirt className="w-5 h-5 text-primary" /> 👕 Elige tu Talla
              </label>
              {productIsSocks ? (
                <div className="mt-2">
                  <div className="px-6 py-3 rounded-lg text-base font-bold bg-primary text-primary-foreground border border-primary inline-flex items-center gap-2 shadow-md">
                    🧦 Talla Única — Se adapta a todos
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">No necesitas elegir talla, ¡un solo tamaño para todos!</p>
                </div>
              ) : (
                product.options?.filter((opt: any) => opt.name !== "Title").map((option: any) => (
                  <div key={option.name} className="mt-2">
                    {option.name !== "Talla" && option.name !== "Size" && (
                      <p className="text-sm font-medium text-muted-foreground mb-2">{option.name}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((val: string) => (
                        <button key={val} onClick={() => setSelectedOptions(prev => ({ ...prev, [option.name]: val }))}
                          className={`px-5 py-2.5 rounded-lg text-sm font-bold border-2 transition-all ${
                            selectedOptions[option.name] === val
                              ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105"
                              : "bg-secondary text-foreground border-border hover:border-primary hover:shadow-md hover:scale-105"
                          }`}>
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}

              {/* Guía de tallas */}
              {(() => {
                const guides = getSizeGuides(product.title);
                if (guides.length === 0) return null;
                return (
                  <div className="mt-5 space-y-3">
                    <p className="text-sm font-heading font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                      📏 Guía de tallas
                    </p>
                    <div className="grid gap-3">
                      {guides.map((g) => (
                        <details key={g.label} className="group rounded-lg border border-border bg-card overflow-hidden">
                          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-foreground flex items-center justify-between hover:bg-secondary/50 transition-colors">
                            <span>{g.label}</span>
                            <span className="text-primary text-xs group-open:rotate-180 transition-transform">▼</span>
                          </summary>
                          <div className="p-3 bg-white">
                            <img src={g.url} alt={`Guía de tallas ${g.label}`} loading="lazy" className="w-full h-auto rounded" />
                          </div>
                        </details>
                      ))}
                      <p className="text-xs text-muted-foreground">Medidas orientativas · Desviación máxima ±2 cm por medidas manuales.</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Personalización - solo para camisetas/chándals, no calcetines */}
            {/* Personalización - solo para camisetas/chándals, no calcetines */}
            {!productIsSocks && (
              <div className="border-2 border-primary/40 rounded-2xl p-6 bg-gradient-to-br from-primary/10 to-primary/5 space-y-5 shadow-lg">
                <div className="text-center">
                  <h3 className="font-heading text-2xl font-black text-foreground flex items-center justify-center gap-2">
                    ✨ PERSONALIZACIÓN GRATIS ✨
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Haz única tu camiseta: nombre, dorsal y parche <span className="font-bold text-primary">¡TODO INCLUIDO!</span></p>
                </div>

                {/* Nombre */}
                <div className="bg-card/50 rounded-xl p-4 border border-border">
                  <label className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" /> 🔤 Nombre del dorsal
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">El nombre que aparecerá en la parte trasera de tu camiseta</p>
                  <Input
                    placeholder="Ej: BELLINGHAM, MBAPPÉ, MESSI..."
                    value={customization.nombre}
                    onChange={(e) => setCustomization(prev => ({ ...prev, nombre: e.target.value.toUpperCase() }))}
                    maxLength={20}
                    className="bg-card border-border text-foreground uppercase placeholder:normal-case text-lg py-3 font-bold"
                  />
                </div>

                {/* Número */}
                <div className="bg-card/50 rounded-xl p-4 border border-border">
                  <label className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                    <Hash className="w-5 h-5 text-primary" /> 🔢 Número del dorsal
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">Elige tu número de la suerte o el de tu jugador favorito (1-99)</p>
                  <Input
                    placeholder="Ej: 7, 10, 9..."
                    value={customization.numero}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                      setCustomization(prev => ({ ...prev, numero: val }));
                    }}
                    maxLength={2}
                    className="bg-card border-border text-foreground w-32 text-2xl py-3 font-black text-center"
                  />
                </div>

                {/* Parche */}
                <div className="bg-card/50 rounded-xl p-4 border border-border">
                  <label className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" /> 🏅 Parche de competición
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">Añade el parche oficial de la liga o competición que prefieras</p>
                  <div className="flex flex-wrap gap-2">
                    {PARCHE_OPTIONS.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setCustomization(prev => ({ ...prev, parche: p.value }))}
                        className={`px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all ${
                          customization.parche === p.value
                            ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105"
                            : "bg-card text-foreground border-border hover:border-primary hover:scale-105"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Cantidad */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Cantidad</label>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus className="w-4 h-4" /></Button>
                <span className="text-lg font-bold text-foreground w-8 text-center">{quantity}</span>
                <Button variant="outline" size="icon" onClick={() => setQuantity(q => q + 1)}><Plus className="w-4 h-4" /></Button>
              </div>
            </div>

            {/* Add to cart */}
            <Button size="lg" className="w-full text-lg py-6 shadow-lg" onClick={handleAddToCart}
              disabled={isCartLoading || (selectedVariant && !selectedVariant.availableForSale)}>
              {isCartLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ShoppingCart className="w-5 h-5 mr-2" />}
              {selectedVariant && !selectedVariant.availableForSale ? "Agotado" : "Añadir al carrito"}
            </Button>

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-3 border-t border-border pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><span>🚚</span> Envío gratis</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><span>✨</span> Personalización gratis</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><span>🔒</span> Pago seguro</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><span>📦</span> Entrega 7-15 días</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
