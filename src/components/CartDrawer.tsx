import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingCart, Minus, Plus, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { useCartStore, cartItemKey } from "@/stores/cartStore";
import { supabase } from "@/integrations/supabase/client";

export const CartDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { items, cartId, isLoading, isSyncing, updateQuantity, removeItem, getCheckoutUrl, syncCart } = useCartStore();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (parseFloat(item.price.amount) * item.quantity), 0);

  useEffect(() => { if (isOpen) syncCart(); }, [isOpen, syncCart]);

  const handleCheckout = async () => {
    const checkoutUrl = getCheckoutUrl();
    if (!checkoutUrl) return;

    // Record order locally if user is logged in (fire-and-forget)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const snapshot = items.map((i) => ({
          title: i.product.node.title,
          handle: i.product.node.handle,
          image: i.product.node.images?.edges?.[0]?.node?.url ?? null,
          variantTitle: i.variantTitle,
          quantity: i.quantity,
          price: parseFloat(i.price.amount),
          customization: i.customization ?? null,
        }));
        await supabase.from("orders").insert({
          user_id: user.id,
          shopify_cart_id: cartId,
          checkout_url: checkoutUrl,
          items: snapshot as unknown as any,
          total_amount: totalPrice,
          currency: items[0]?.price.currencyCode ?? "EUR",
          item_count: totalItems,
          status: "pending",
          discount_code: "CLIENTES10",
        });
      }
    } catch (e) {
      console.error("Failed to record order:", e);
    }

    window.open(checkoutUrl, '_blank');
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative border-border">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="text-foreground">Tu Carrito</SheetTitle>
          <SheetDescription>
            {totalItems === 0 ? "Tu carrito está vacío" : `${totalItems} artículo${totalItems !== 1 ? 's' : ''} en tu carrito`}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col flex-1 pt-6 min-h-0">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Tu carrito está vacío</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={cartItemKey(item)} className="flex gap-4 p-3 rounded-lg bg-secondary/30">
                      <div className="w-16 h-16 bg-secondary rounded-md overflow-hidden flex-shrink-0">
                        {item.product.node.images?.edges?.[0]?.node && (
                          <img src={item.product.node.images.edges[0].node.url} alt={item.product.node.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground text-sm truncate">{item.product.node.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.selectedOptions.map(o => o.value).join(' · ')}</p>
                        {item.customization && (item.customization.nombre || item.customization.numero || item.customization.parche) && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {item.customization.nombre && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">✏️ {item.customization.nombre}</span>}
                            {item.customization.numero && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded"># {item.customization.numero}</span>}
                            {item.customization.parche && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">🏅 {item.customization.parche}</span>}
                          </div>
                        )}
                        <p className="font-bold text-primary">{parseFloat(item.price.amount).toFixed(2)}€</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeItem(cartItemKey(item))}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(cartItemKey(item), item.quantity - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm text-foreground">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(cartItemKey(item), item.quantity + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0 space-y-4 pt-4 border-t border-border bg-background">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-foreground">Total</span>
                  <span className="text-xl font-bold text-primary">{totalPrice.toFixed(2)}€</span>
                </div>
                <Button onClick={handleCheckout} className="w-full" size="lg" disabled={items.length === 0 || isLoading || isSyncing}>
                  {isLoading || isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ExternalLink className="w-4 h-4 mr-2" />Finalizar compra</>}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
