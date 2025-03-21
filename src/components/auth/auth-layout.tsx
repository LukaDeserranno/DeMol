import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center bg-[url('/images/demol-bg.jpg')] bg-cover bg-center">
      <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-black/90 backdrop-blur-[1px]" />
      
      <div className="relative z-10 mb-16">
        <Logo className="w-[140px] h-auto mx-auto" />
      </div>

      <Card className="w-[380px] bg-black/80 border-[#2A9D8F]/20 text-white relative z-10 backdrop-blur-md shadow-2xl">
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[#2A9D8F]/40 to-transparent" />
        <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-[#2A9D8F]/40 to-transparent" />
        
        {children}
      </Card>

      <div className="relative z-10 mt-8 text-center">
        <p className="text-sm text-zinc-500">
          &copy; {new Date().getFullYear()} De Mol. Alle rechten voorbehouden.
        </p>
      </div>
    </div>
  );
} 