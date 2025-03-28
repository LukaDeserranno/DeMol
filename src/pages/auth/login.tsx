import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { PasswordInput } from "@/components/ui/password-input";
import { EmailInput } from "@/components/ui/email-input";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SocialLogin } from "@/components/auth/social-login";

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
    <AuthLayout>
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
            <EmailInput
              label="E-mailadres"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
            
            <PasswordInput
              id="password"
              label="Wachtwoord"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
            
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
        
        <SocialLogin onGoogleSignIn={handleGoogleSignIn} />
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
    </AuthLayout>
  );
} 