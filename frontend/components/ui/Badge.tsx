import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "lime" | "orange" | "stone" | "outline" | "success";
  size?: "sm" | "md";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  className = "",
}) => {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  };

  const variantStyles = {
    default: "bg-ivory text-charcoal border border-border",
    lime: "bg-[#EAF9D2] text-[#345312] border border-[#C7F36B]",
    orange: "bg-[#FDF0E9] text-[#8C3A11] border border-[#E58B5A]",
    stone: "bg-[#EFEFEA] text-stone-dark border border-border",
    outline: "bg-transparent text-charcoal border border-border",
    success: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-md tracking-tight ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
