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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate displayName
    if (!formData.displayName.trim()) {
      setError("Vul een naam in");
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Wachtwoorden komen niet overeen");
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError("Wachtwoord moet minimaal 6 tekens lang zijn");
      return;
    }

    setIsLoading(true);

    try {
      await signUp(formData.email, formData.password, formData.displayName);
      navigate("/dashboard");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("Dit e-mailadres is al in gebruik");
      } else if (err.code === "auth/invalid-email") {
        setError("Ongeldig e-mailadres");
      } else {
        setError("Er is een fout opgetreden bij het registreren");
      }
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
      setError("Kon niet registreren met Google");
    }
  };

  return (
    <AuthLayout>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Account Aanmaken
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Registreer voor toegang tot exclusieve content
        </CardDescription>
      </CardHeader>
      
      <CardContent className="grid gap-4">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="displayName">Naam</Label>
              <Input
                id="displayName"
                type="text"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                placeholder="Jouw naam"
                required
                autoComplete="name"
                className="bg-zinc-900/10 border-zinc-600 text-white focus:border-[#2A9D8F]/50 focus:ring-[#2A9D8F]/50"
              />
            </div>
            
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
            
            <PasswordInput
              id="confirmPassword"
              label="Bevestig Wachtwoord"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
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
              Registreren
            </Button>
          </div>
        </form>
        
        <SocialLogin onGoogleSignIn={handleGoogleSignIn} />
      </CardContent>
      
      <CardFooter>
        <p className="text-sm text-zinc-400">
          Heb je al een account?{" "}
          <a
            href="/login"
            className="text-[#2A9D8F] hover:text-[#2A9D8F]/80 hover:underline transition-colors duration-300"
          >
            Inloggen
          </a>
        </p>
      </CardFooter>
    </AuthLayout>
  );
} 