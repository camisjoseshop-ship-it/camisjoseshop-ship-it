import { useState } from "react";
import { Package, Search, MessageCircle, Truck, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import { openWhatsApp } from "@/lib/whatsapp";

const ORDER_STATUSES = [
  { key: "pending", label: "Pendiente", icon: Clock, description: "Tu pedido ha sido recibido" },
  { key: "confirmed", label: "Confirmado", icon: CheckCircle, description: "Pago verificado y pedido en preparación" },
  { key: "shipped", label: "Enviado", icon: Truck, description: "Tu pedido está en camino" },
  { key: "delivered", label: "Entregado", icon: Package, description: "¡Pedido entregado!" },
];

const OrderTracking = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNumber.trim()) setSearched(true);
  };

  const whatsappTrackingUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`¡Hola! Quiero consultar el estado de mi pedido ${orderNumber}`)}`;

  return (
    <section id="seguimiento" className="py-12 md:py-16">
      <div className="container px-4 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-3">
            SEGUIMIENTO DE <span className="text-primary">PEDIDO</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Introduce tu número de pedido o contacta por WhatsApp para conocer el estado
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <Input
            placeholder="Nº de pedido (ej: CJ-00123)"
            value={orderNumber}
            onChange={(e) => { setOrderNumber(e.target.value); setSearched(false); }}
            className="flex-1 bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
          <Button type="submit" disabled={!orderNumber.trim()}>
            <Search className="w-4 h-4 mr-2" /> Buscar
          </Button>
        </form>

        {searched && (
          <div className="rounded-lg border border-border bg-card p-6 text-center space-y-4">
            <Package className="w-12 h-12 text-primary mx-auto" />
            <p className="text-foreground font-medium">
              Para consultar el estado de tu pedido <span className="text-primary font-bold">#{orderNumber}</span>, contacta directamente por WhatsApp:
            </p>
            <Button variant="default" onClick={() => openWhatsApp(whatsappTrackingUrl)}>
              <MessageCircle className="w-4 h-4 mr-2" /> Consultar por WhatsApp
            </Button>
          </div>
        )}

        {!searched && (
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-heading text-lg font-bold text-foreground mb-4">Estados del pedido</h3>
            <div className="space-y-4">
              {ORDER_STATUSES.map((status, i) => (
                <div key={status.key} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <status.icon className="w-5 h-5 text-primary" />
                    </div>
                    {i < ORDER_STATUSES.length - 1 && <div className="w-0.5 h-6 bg-border mt-1" />}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{status.label}</p>
                    <p className="text-sm text-muted-foreground">{status.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default OrderTracking;
