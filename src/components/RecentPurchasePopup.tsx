import { useState, useEffect } from "react";
import { ShoppingBag, X } from "lucide-react";

const FAKE_PURCHASES = [
  { name: "Carlos de Madrid", product: "Camiseta Real Madrid 24/25", time: "hace 2 min", img: "https://cdn.shopify.com/s/files/1/0901/3317/8498/files/real-madrid.jpg?v=1" },
  { name: "Laura de Barcelona", product: "Camiseta FC Barcelona 24/25", time: "hace 5 min", img: "https://cdn.shopify.com/s/files/1/0901/3317/8498/files/barcelona.jpg?v=1" },
  { name: "Miguel de Sevilla", product: "Camiseta Betis Retro", time: "hace 8 min", img: "" },
  { name: "Ana de Valencia", product: "Equipación Niño PSG", time: "hace 12 min", img: "" },
  { name: "David de Bilbao", product: "Camiseta Athletic Club 24/25", time: "hace 15 min", img: "" },
  { name: "Sofía de Málaga", product: "Chándal Manchester City", time: "hace 18 min", img: "" },
  { name: "Pablo de Zaragoza", product: "Camiseta Juventus 24/25", time: "hace 22 min", img: "" },
  { name: "Marina de Alicante", product: "Calcetines Liverpool", time: "hace 25 min", img: "" },
];

const RecentPurchasePopup = () => {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    // Show first popup after 8 seconds
    const initialTimer = setTimeout(() => {
      setVisible(true);
    }, 8000);

    return () => clearTimeout(initialTimer);
  }, [dismissed]);

  useEffect(() => {
    if (!visible || dismissed) return;

    // Auto-hide after 5 seconds
    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 5000);

    return () => clearTimeout(hideTimer);
  }, [visible, dismissed]);

  useEffect(() => {
    if (visible || dismissed) return;

    // Show next purchase after random interval (15-30s)
    const nextTimer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % FAKE_PURCHASES.length);
      setVisible(true);
    }, 15000 + Math.random() * 15000);

    return () => clearTimeout(nextTimer);
  }, [visible, dismissed]);

  if (dismissed || !visible) return null;

  const purchase = FAKE_PURCHASES[currentIndex];

  return (
    <div className="fixed bottom-24 left-4 z-40 animate-in slide-in-from-left-full duration-500 max-w-xs">
      <div className="rounded-lg border border-border bg-card shadow-lg p-3 flex items-start gap-3">
        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
          {purchase.img ? (
            <img src={purchase.img} alt={purchase.product} className="w-full h-full object-cover" />
          ) : (
            <ShoppingBag className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-tight">
            {purchase.name}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-1">
            compró <span className="text-primary">{purchase.product}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{purchase.time}</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default RecentPurchasePopup;
