import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Loader2, Copy, LogOut, Gift, ArrowLeft, Package, Sparkles, Tag, ExternalLink, Trash2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { fetchProducts } from "@/lib/shopify";

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Nombre demasiado corto").max(80),
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(1, "Introduce tu contraseña").max(72),
});

interface Profile {
  full_name: string | null;
  email: string;
  discount_code: string;
  discount_percent: number;
}

interface OrderItem {
  title: string;
  handle: string;
  image: string | null;
  variantTitle: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  total_amount: number;
  currency: string;
  item_count: number;
  status: string;
  checkout_url: string | null;
  created_at: string;
}

const DISCOUNT_CODE = "CLIENTES10";

const ACTIVE_COUPONS = [
  { code: "CLIENTES10", desc: "10% en toda la web · clientes registrados", tag: "Bienvenida" },
];

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => {
          loadProfile(s.user.id);
          loadOrders(s.user.id);
        }, 0);
      } else {
        setProfile(null);
        setOrders([]);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user.id);
        loadOrders(data.session.user.id);
      }
      setChecking(false);
    });

    // Load featured products for the "novedades" section
    fetchProducts(6, undefined, undefined, 'CREATED_AT')
      .then((p) => setFeatured(p?.edges ?? []))
      .catch(() => setFeatured([]));

    return () => sub.subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email, discount_code, discount_percent")
      .eq("id", userId)
      .maybeSingle();
    if (data) setProfile(data);
  };

  const loadOrders = async (userId: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, items, total_amount, currency, item_count, status, checkout_url, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) console.error(error);
    if (data) setOrders(data as unknown as Order[]);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = signupSchema.safeParse({
      fullName: form.get("fullName"),
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/cuenta`,
        data: { full_name: parsed.data.fullName },
      },
    });
    setLoading(false);
    if (error) {
      if (error.message.includes("already registered")) toast.error("Este email ya está registrado. Inicia sesión.");
      else toast.error(error.message);
      return;
    }
    toast.success("¡Cuenta creada! Tu código de descuento te espera.");
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setLoading(false);
    if (error) { toast.error("Email o contraseña incorrectos"); return; }
    toast.success("¡Bienvenido de nuevo!");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    const emailInput = document.getElementById("login-email") as HTMLInputElement | null;
    const email = emailInput?.value?.trim();
    if (!email) { toast.error("Introduce tu email primero"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Te hemos enviado un email para restablecer tu contraseña");
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("¿Eliminar este pedido pendiente del historial?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", orderId);
    if (error) { toast.error("No se pudo eliminar el pedido"); return; }
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    toast.success("Pedido eliminado");
  };

  const copyCode = (code: string = DISCOUNT_CODE) => {
    navigator.clipboard.writeText(code);
    toast.success(`Código ${code} copiado`);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const orderCount = orders.length;
  const personalMessage = orderCount === 0
    ? "¡Aprovecha tu descuento de bienvenida y haz tu primer pedido!"
    : orderCount === 1
      ? "¡Gracias por tu primera compra! Vuelve pronto, hay novedades cada semana."
      : `¡Eres un cliente VIP! Llevas ${orderCount} pedidos con nosotros 🏆`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="container flex items-center justify-between h-16 px-4">
          <Link to="/" className="font-heading text-2xl font-bold text-primary tracking-widest">
            CAMISJOSE
          </Link>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver a la tienda
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 md:py-12">
        {session && profile ? (
          <div className="container max-w-4xl mx-auto space-y-6">
            {/* Welcome banner */}
            <div className="rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 p-6 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-widest text-primary mb-1">Panel de cliente</p>
                <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                  Hola{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{personalMessage}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" /> Salir
              </Button>
            </div>

            {/* Discount code */}
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  <CardTitle className="font-heading text-xl">Tu código de bienvenida · {profile.discount_percent}%</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border-2 border-dashed border-primary bg-primary/5 p-5 text-center">
                  <p className="font-heading text-3xl font-bold text-primary tracking-widest mb-3">
                    {DISCOUNT_CODE}
                  </p>
                  <Button onClick={() => copyCode()} size="sm">
                    <Copy className="w-4 h-4 mr-2" /> Copiar código
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Active coupons */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  <CardTitle className="font-heading text-xl">Cupones activos</CardTitle>
                </div>
                <CardDescription>Pega el código en el checkout oficial al finalizar tu compra.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {ACTIVE_COUPONS.map((c) => (
                  <div key={c.code} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/20 p-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-heading font-bold text-primary tracking-wider">{c.code}</span>
                        <Badge variant="outline" className="text-[10px]">{c.tag}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{c.desc}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => copyCode(c.code)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Order history */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  <CardTitle className="font-heading text-xl">Mis pedidos</CardTitle>
                </div>
                <CardDescription>Historial de las compras realizadas desde esta cuenta.</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Aún no tienes pedidos. ¡Aprovecha tu cupón {DISCOUNT_CODE} para empezar!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((o) => (
                      <div key={o.id} className="rounded-lg border border-border p-4">
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(o.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                              {" · "}
                              {o.item_count} artículo{o.item_count !== 1 ? "s" : ""}
                            </p>
                            <p className="font-heading text-lg font-bold text-primary">
                              {o.total_amount.toFixed(2)} {o.currency === "EUR" ? "€" : o.currency}
                            </p>
                          </div>
                          <Badge variant={o.status === "completed" ? "default" : "secondary"} className="text-[10px]">
                            {o.status === "pending" ? "Pendiente / En checkout" : o.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {o.items.slice(0, 5).map((it, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs bg-secondary/30 rounded-md px-2 py-1.5">
                              {it.image && <img src={it.image} alt={it.title} className="w-8 h-8 object-cover rounded" />}
                              <div className="min-w-0">
                                <p className="text-foreground line-clamp-1 max-w-[180px]">{it.title}</p>
                                <p className="text-muted-foreground">x{it.quantity} · {it.price.toFixed(2)}€</p>
                              </div>
                            </div>
                          ))}
                          {o.items.length > 5 && (
                            <div className="flex items-center text-xs text-muted-foreground px-2">+{o.items.length - 5} más</div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {o.checkout_url && o.status === "pending" && (
                            <Button asChild variant="link" size="sm" className="h-auto p-0 text-primary">
                              <a href={o.checkout_url} target="_blank" rel="noopener noreferrer">
                                Retomar checkout <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                            </Button>
                          )}
                          {o.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 text-destructive hover:text-destructive/80"
                              onClick={() => handleDeleteOrder(o.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar pedido
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Featured / launch */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <CardTitle className="font-heading text-xl">Novedades y lanzamientos</CardTitle>
                </div>
                <CardDescription>Las últimas camisetas añadidas a la tienda.</CardDescription>
              </CardHeader>
              <CardContent>
                {featured.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Cargando novedades…</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {featured.map((p: any) => {
                      const img = p.node.images?.edges?.[0]?.node?.url;
                      const price = p.node.priceRange?.minVariantPrice?.amount;
                      return (
                        <Link
                          key={p.node.id}
                          to={`/product/${p.node.handle}`}
                          className="group rounded-lg border border-border overflow-hidden hover:border-primary transition-colors"
                        >
                          <div className="aspect-square bg-secondary/30 overflow-hidden">
                            {img && <img src={img} alt={p.node.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />}
                          </div>
                          <div className="p-2">
                            <p className="text-xs text-foreground line-clamp-2 mb-1">{p.node.title}</p>
                            <p className="text-sm font-bold text-primary">{parseFloat(price ?? "0").toFixed(2)}€</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md border-primary/30">
              <CardHeader className="text-center">
                <CardTitle className="font-heading text-3xl text-primary">Acceso clientes</CardTitle>
                <CardDescription>
                  Regístrate y obtén un <strong className="text-primary">10% de descuento</strong> exclusivo + historial de pedidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="signup">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="signup">Registrarse</TabsTrigger>
                    <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Nombre completo</Label>
                        <Input id="signup-name" name="fullName" placeholder="Tu nombre" required maxLength={80} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input id="signup-email" name="email" type="email" placeholder="tu@email.com" required maxLength={255} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Contraseña</Label>
                        <Input id="signup-password" name="password" type="password" placeholder="Mínimo 8 caracteres" required minLength={8} maxLength={72} />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear cuenta y obtener descuento"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input id="login-email" name="email" type="email" placeholder="tu@email.com" required maxLength={255} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="login-password">Contraseña</Label>
                          <button
                            type="button"
                            onClick={handleForgotPassword}
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <KeyRound className="w-3 h-3" /> ¿Olvidaste tu contraseña?
                          </button>
                        </div>
                        <Input id="login-password" name="password" type="password" required maxLength={72} />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Auth;
