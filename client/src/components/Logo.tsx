import React from "react";
import { cn } from "../lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

// Text logo: ConnectiN with the stylized i and gradient N
export const Logo: React.FC<LogoProps> = ({ className, size = "md" }) => {
  const textSize =
    size === "sm" ? "text-xl" : size === "lg" ? "text-3xl" : "text-2xl";

  return (
    <div
      className={cn(
        "font-extrabold flex items-center select-none",
        textSize,
        className
      )}
      title="ConnectiN"
      aria-label="ConnectiN"
      role="img"
    >
      <span className="text-[#0A2472]">Connect</span>
      <span className="relative inline-block">
        <span className="text-[#0A2472]">i</span>
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-red-600 leading-none" style={{ lineHeight: 0 }}>
          •
        </span>
      </span>
      <span className="bg-gradient-to-r from-[#1E3A8A] to-[#6366F1] bg-clip-text text-transparent">
        N
      </span>
    </div>
  );
};

export default Logo;
