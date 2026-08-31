import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, KeyRound, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase recovery link sets a session via hash; wait for it.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password.length < 8) { toast.error("Mínimo 8 caracteres"); return; }
    if (password !== confirm) { toast.error("Las contraseñas no coinciden"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Contraseña actualizada");
    navigate("/cuenta");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="container flex items-center justify-between h-16 px-4">
          <Link to="/" className="font-heading text-2xl font-bold text-primary tracking-widest">
            CAMISJOSE
          </Link>
          <Button variant="ghost" size="sm" onClick={() => navigate("/cuenta")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-12 flex items-center justify-center">
        <Card className="w-full max-w-md border-primary/30">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="font-heading text-2xl text-primary">Nueva contraseña</CardTitle>
            <CardDescription>Introduce tu nueva contraseña para acceder a tu cuenta.</CardDescription>
          </CardHeader>
          <CardContent>
            {!ready ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-primary" />
                Verificando enlace de recuperación…<br />
                <span className="text-xs">Si no se carga, abre el enlace del email en esta misma pestaña.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nueva contraseña</Label>
                  <Input id="password" name="password" type="password" required minLength={8} maxLength={72} placeholder="Mínimo 8 caracteres" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Repite la contraseña</Label>
                  <Input id="confirm" name="confirm" type="password" required minLength={8} maxLength={72} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Actualizar contraseña"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ResetPassword;
