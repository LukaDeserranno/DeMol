import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signIn(formData.email, formData.password);
      navigate("/dashboard");
    } catch (err) {
      setError("Ongeldige e-mail of wachtwoord");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      setError("Kon niet inloggen met Google");
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center bg-[url('/images/demol-bg.jpg')] bg-cover bg-center">
      <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-black/90 backdrop-blur-[1px]" />
      
      <div className="relative z-10 mb-16">
        <Logo className="w-[140px] h-auto mx-auto" />
      </div>

      <Card className="w-[380px] bg-black/80 border-[#2A9D8F]/20 text-white relative z-10 backdrop-blur-md shadow-2xl">
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[#2A9D8F]/40 to-transparent" />
        <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-[#2A9D8F]/40 to-transparent" />
        
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Welkom Terug
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Log in om exclusieve content te bekijken
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-zinc-400">
                  E-mailadres
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="naam@voorbeeld.nl"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="bg-zinc-900/50 border-zinc-800/50 text-white placeholder:text-zinc-600 focus:border-[#2A9D8F]/50 focus:ring-[#2A9D8F]/50 transition-colors duration-200"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-zinc-400">
                  Wachtwoord
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="bg-zinc-900/50 border-zinc-800/50 text-white focus:border-[#2A9D8F]/50 focus:ring-[#2A9D8F]/50 transition-colors duration-200"
                  required
                />
              </div>
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
              <Button
                type="submit"
                className="w-full bg-[#2A9D8F] hover:bg-[#2A9D8F]/90 text-white shadow-lg hover:shadow-[#2A9D8F]/25 transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Inloggen
              </Button>
            </div>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-800/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black px-2 text-zinc-500">
                Of ga verder met
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            type="button"
            className="bg-zinc-900/50 border-zinc-800/50 text-white hover:bg-zinc-800/50 hover:border-[#2A9D8F]/30 transition-all duration-300"
            onClick={handleGoogleSignIn}
          >
            <Icons.google className="mr-2 h-4 w-4" /> Google
          </Button>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-zinc-400">
            Nog geen account?{" "}
            <a
              href="/register"
              className="text-[#2A9D8F] hover:text-[#2A9D8F]/80 hover:underline transition-colors duration-300"
            >
              Registreer
            </a>
          </p>
        </CardFooter>
      </Card>

      <div className="relative z-10 mt-8 text-center">
        <p className="text-sm text-zinc-500">
          &copy; {new Date().getFullYear()} De Mol. Alle rechten voorbehouden.
        </p>
      </div>
    </div>
  );
} 