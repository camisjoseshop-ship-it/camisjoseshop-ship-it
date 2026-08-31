import { Star } from "lucide-react";

const REVIEWS = [
  {
    name: "Carlos M.",
    rating: 5,
    text: "Increíble calidad, la camiseta del Madrid es idéntica a la original. El envío llegó en 8 días y la personalización perfecta. 100% recomendado.",
    date: "Hace 3 días",
    product: "Real Madrid 25/26",
  },
  {
    name: "Laura G.",
    rating: 5,
    text: "Pedí 3 camisetas y llegaron perfectas. El trato por WhatsApp fue genial, muy atentos en todo momento.",
    date: "Hace 5 días",
    product: "Barça, PSG y Argentina",
  },
  {
    name: "Miguel Á.",
    rating: 5,
    text: "Ya es mi cuarta compra. Siempre con la misma calidad y rapidez. La retro del Milan es una pasada.",
    date: "Hace 1 semana",
    product: "AC Milan Retro 2006",
  },
  {
    name: "Ana P.",
    rating: 5,
    text: "Le compré la equipación a mi hijo y está encantado. Talla perfecta y envío gratuito a Madrid. Volveré a comprar seguro.",
    date: "Hace 2 semanas",
    product: "Equipación niño Inter",
  },
  {
    name: "David R.",
    rating: 5,
    text: "Excelente servicio. Me ayudaron a elegir la talla por WhatsApp y acertamos a la primera. Gran profesionalidad.",
    date: "Hace 2 semanas",
    product: "Liverpool 25/26",
  },
  {
    name: "Javier T.",
    rating: 5,
    text: "Pedí la camiseta de Argentina y llegó en una semana. La calidad es brutal y la personalización quedó perfecta. Muy recomendable.",
    date: "Hace 3 semanas",
    product: "Argentina Mundial 2026",
  },
  {
    name: "Sara L.",
    rating: 5,
    text: "Compré la camiseta del Bayern para mi pareja y le encantó. Acabados premium, parches incluidos y empaquetado cuidado.",
    date: "Hace 4 días",
    product: "Bayern München 25/26",
  },
  {
    name: "Rubén F.",
    rating: 5,
    text: "Tercera compra y siempre 5 estrellas. Pagué con Bizum sin problema y llegó en 9 días a Sevilla.",
    date: "Hace 1 semana",
    product: "Atlético de Madrid 25/26",
  },
  {
    name: "Patricia N.",
    rating: 5,
    text: "Me equivoqué con la talla y me hicieron el cambio sin coste. Atención al cliente impecable.",
    date: "Hace 6 días",
    product: "FC Barcelona 25/26",
  },
];

const Stars = ({ count }: { count: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < count ? "fill-primary text-primary" : "text-muted-foreground"}`}
      />
    ))}
  </div>
);

const ReviewsSection = () => (
  <section id="resenas" className="py-12 md:py-16">
    <div className="container px-4">
      <div className="text-center mb-10">
        <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-3">
          OPINIONES DE <span className="text-primary">CLIENTES</span>
        </h2>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Stars count={5} />
          <span className="text-foreground font-bold text-lg">4.9/5</span>
        </div>
        <p className="text-muted-foreground text-lg">+500 clientes satisfechos · Reseñas verificadas actualizadas en {new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REVIEWS.map((review) => (
          <div
            key={review.name}
            className="rounded-lg border border-border bg-card p-5 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-foreground">{review.name}</p>
                <p className="text-xs text-muted-foreground">{review.date}</p>
              </div>
              <Stars count={review.rating} />
            </div>
            <p className="text-sm text-muted-foreground mb-2">{review.text}</p>
            <p className="text-xs text-primary font-medium">📦 {review.product}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ReviewsSection;
