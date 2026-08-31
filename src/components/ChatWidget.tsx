import { useState } from "react";
import { MessageCircle, X, Send, ChevronRight } from "lucide-react";
import { WHATSAPP_URL } from "@/lib/constants";
import { openWhatsApp } from "@/lib/whatsapp";

const FAQ_ITEMS = [
  {
    question: "¿Cómo personalizo mi camiseta?",
    answer: "¡Es muy fácil! Al hacer tu pedido por WhatsApp, indícanos el nombre, número y parches que quieres. La personalización está incluida en el precio sin coste adicional.",
  },
  {
    question: "¿Cómo puedo hacer un seguimiento de mi pedido?",
    answer: "Una vez enviado tu pedido, te proporcionaremos un número de seguimiento por WhatsApp para que puedas rastrear tu envío en todo momento.",
  },
  {
    question: "¿Hacéis envíos a Canarias?",
    answer: "Actualmente no realizamos envíos a Canarias ni a territorios extrapeninsulares. Solo enviamos a España peninsular y Baleares. Disculpa las molestias.",
  },
  {
    question: "No he recibido el email de confirmación de mi pedido",
    answer: "Revisa tu carpeta de spam o correo no deseado. Si no lo encuentras, contacta con nosotros por WhatsApp y te lo reenviamos al momento.",
  },
];

const POLICIES = [
  { label: "Política de cambios y devoluciones", text: "Aceptamos cambios y devoluciones en un plazo de 14 días desde la recepción del pedido. El artículo debe estar sin usar y con las etiquetas originales. Contacta con nosotros por WhatsApp para gestionar tu cambio o devolución." },
  { label: "Política de envío y entrega", text: "El plazo de entrega es de 7 a 15 días, aunque la mayoría de pedidos suelen llegar antes. El envío es gratuito en todos los pedidos. Recibirás un número de seguimiento por WhatsApp una vez enviado." },
  { label: "Política de privacidad", text: "Tus datos personales se utilizan exclusivamente para procesar tu pedido y mejorar tu experiencia de compra. No compartimos tu información con terceros. Cumplimos con la normativa RGPD." },
  { label: "Términos y condiciones", text: "Al realizar un pedido en Camisjose, aceptas nuestras condiciones de venta. Los precios incluyen IVA y personalización. Nos reservamos el derecho de modificar precios sin previo aviso." },
];

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [activeAnswer, setActiveAnswer] = useState<number | null>(null);
  const [activePolicy, setActivePolicy] = useState<number | null>(null);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-24 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        aria-label="Chat con nosotros"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {open && (
        <div className="fixed bottom-[10rem] right-6 z-50 w-[340px] max-h-[480px] rounded-lg border border-border bg-card shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-primary text-primary-foreground px-4 py-3">
            <p className="font-heading font-bold text-lg">Chatea con nosotros</p>
            <p className="text-xs opacity-90">
              👋 Hola, si tienes alguna duda envíanos un mensaje. Estamos disponibles para ayudar.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Respuestas instantáneas</p>

            {FAQ_ITEMS.map((faq, i) => (
              <div key={i}>
                <button
                  onClick={() => setActiveAnswer(activeAnswer === i ? null : i)}
                  className="w-full text-left flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  <ChevronRight className={`w-3.5 h-3.5 text-primary shrink-0 transition-transform ${activeAnswer === i ? "rotate-90" : ""}`} />
                  <span>{faq.question}</span>
                </button>
                {activeAnswer === i && (
                  <div className="ml-6 mr-2 mb-2 p-3 rounded-md bg-secondary text-xs text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}

            <div className="border-t border-border pt-3 mt-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Información</p>
              {POLICIES.map((policy, i) => (
                <div key={i}>
                  <button
                    onClick={() => setActivePolicy(activePolicy === i ? null : i)}
                    className="w-full text-left flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    <ChevronRight className={`w-3.5 h-3.5 text-primary shrink-0 transition-transform ${activePolicy === i ? "rotate-90" : ""}`} />
                    <span>{policy.label}</span>
                  </button>
                  {activePolicy === i && (
                    <div className="ml-6 mr-2 mb-2 p-3 rounded-md bg-secondary text-xs text-muted-foreground leading-relaxed">
                      {policy.text}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border p-3">
            <p className="text-xs text-muted-foreground mb-2">¿Necesita ayuda con una orden?</p>
            <button
              type="button"
              onClick={() => openWhatsApp(WHATSAPP_URL)}
              className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-foreground rounded-md px-4 py-2.5 text-sm font-medium transition-colors"
            >
              <Send className="w-4 h-4" />
              Háblanos por WhatsApp
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;

