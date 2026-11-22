import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  className = "",
  children,
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs tracking-wide",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base font-semibold",
  };

  const variantStyles = {
    primary: "bg-charcoal text-white hover:bg-charcoal-light focus:ring-charcoal",
    secondary: "bg-white text-charcoal border border-border hover:bg-ivory hover:border-stone-light focus:ring-charcoal",
    accent: "bg-lime text-charcoal font-semibold hover:bg-lime-hover shadow-sm hover:shadow-lime-glow focus:ring-lime",
    outline: "border border-border text-charcoal hover:bg-white hover:border-charcoal focus:ring-charcoal",
    ghost: "text-stone hover:text-charcoal hover:bg-black/5 focus:ring-charcoal",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
