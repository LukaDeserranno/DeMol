import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";

interface SocialLoginProps {
  onGoogleSignIn: () => Promise<void>;
  buttonText?: string;
}

export function SocialLogin({ 
  onGoogleSignIn, 
  buttonText = "Google" 
}: SocialLoginProps) {
  return (
    <>
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
        onClick={onGoogleSignIn}
      >
        <Icons.google className="mr-2 h-4 w-4" /> {buttonText}
      </Button>
    </>
  );
} 