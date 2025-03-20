import * as React from "react";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`${className} transition-all duration-500 hover:scale-105 relative group`}>
      <div className="absolute inset-0 bg-[#2A9D8F]/20 blur-2xl rounded-full group-hover:bg-[#2A9D8F]/30 transition-all duration-500" />
      <img 
        src="/images/logo/de-mol-logo.png" 
        alt="De Mol Logo"
        className="w-full h-full object-contain relative z-10"
        style={{
          filter: 'drop-shadow(0 0 20px rgba(42, 157, 143, 0.3))'
        }}
      />
    </div>
  );
} 