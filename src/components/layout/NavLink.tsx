import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface NavLinkProps {
  to: string;
  active: boolean;
  children: ReactNode;
}

export function NavLink({ to, active, children }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={`
        relative px-2 py-2 transition-all duration-300
        ${active 
          ? 'text-[#2A9D8F] font-medium' 
          : 'text-zinc-400 hover:text-white'
        }
        group
      `}
    >
      {/* Text content */}
      <span className="relative z-10">{children}</span>
      
      {/* Active indicator */}
      {active ? (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#2A9D8F] to-[#2A9D8F]/30 rounded-full" />
      ) : (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 w-0 group-hover:w-full bg-zinc-700/50 rounded-full transition-all duration-300" />
      )}
      
      {/* Subtle hover effect */}
      <div className="absolute inset-0 rounded opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-b from-white to-transparent" />
    </Link>
  );
} 