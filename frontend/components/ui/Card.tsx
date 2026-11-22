import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-border p-6 shadow-subtle ${
        hoverEffect ? "transition-all duration-200 hover:border-charcoal hover:shadow-premium" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
