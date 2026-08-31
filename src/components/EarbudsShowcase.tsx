import { ShoppingBag, Truck, ShieldCheck, Zap, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import earbudsHero from "@/assets/wireless-earbuds-hero.jpg";
import { useCartStore } from "@/stores/cartStore";

const AIRPODS_VARIANT_ID = "gid://shopify/ProductVariant/54806530195798";
const AIRPODS_PRODUCT_ID = "gid://shopify/Product/11142958580054";

const EarbudsShowcase = () => {
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);

  const handleBuy = async () => {
    await addItem({
      product: {
        node: {
          id: AIRPODS_PRODUCT_ID,
          title: "AirPods Pro 3 ANC",
          description: "Auriculares inalámbricos con cancelación activa de ruido",
          handle: "airpods-pro-3-anc",
          priceRange: { minVariantPrice: { amount: "45.00", currencyCode: "EUR" } },
          images: { edges: [{ node: { url: new URL(earbudsHero, window.location.origin).href, altText: "AirPods Pro 3 ANC" } }] },
          variants: { edges: [] },
          options: [],
        },
      } as any,
      variantId: AIRPODS_VARIANT_ID,
      variantTitle: "Default Title",
      price: { amount: "45.00", currencyCode: "EUR" },
      quantity: 1,
      selectedOptions: [],
    });
    toast.success("AirPods Pro 3 añadidos al carrito", {
      description: "Abre la cesta para finalizar la compra.",
    });
  };

  return (
    <section className="py-16 md:py-24 bg-white text-slate-900">
      <div className="container px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Imagen */}
          <div className="relative order-2 lg:order-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-100 rounded-3xl" />
            <div className="absolute -top-8 -left-8 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-8 -right-8 w-56 h-56 bg-blue-600/10 rounded-full blur-3xl" />
            <div className="relative rounded-3xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25)]">
              <img
                src={earbudsHero}
                alt="Auriculares inalámbricos premium"
                loading="lazy"
                width={1024}
                height={1024}
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="absolute top-6 left-6 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
              -31% HOY
            </div>
          </div>

          {/* Tarjeta de producto */}
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase mb-4">
              <Zap className="w-3.5 h-3.5" />
              Nueva Generación
            </div>

            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-4">
              AirPods <span className="text-blue-600">Pro 3</span><br />
              ANC
            </h2>

            <p className="text-slate-600 text-lg mb-6 max-w-xl">
              Auriculares inalámbricos con cancelación activa de ruido, sonido espacial y hasta 30h de batería con su estuche de carga.
            </p>

            <div className="flex items-center gap-2 mb-6">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-sm text-slate-600">4.9 · 2.387 reseñas</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
              <div className="flex items-end gap-3 mb-5">
                <span className="font-heading text-5xl font-bold text-slate-900">45€</span>
                <span className="text-xl text-slate-400 line-through mb-1">65€</span>
                <span className="ml-auto bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-md">AHORRA 20€</span>
              </div>

              <Button
                size="lg"
                onClick={handleBuy}
                disabled={isLoading}
                className="w-full text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 shadow-lg shadow-blue-600/30 transition-all hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <ShoppingBag className="w-5 h-5 mr-2" />
                )}
                Añadir a la cesta
              </Button>

              <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-100">
                <div className="flex flex-col items-center text-center gap-1">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-medium text-slate-700">Envío 24h</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-medium text-slate-700">Stock: 18 uds</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-medium text-slate-700">Pago seguro</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-4 text-center">
              ⚡ Oferta especial por tiempo limitado · Stock reducido
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EarbudsShowcase;
