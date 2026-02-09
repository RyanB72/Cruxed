import { HTMLAttributes } from "react";

type BadgeVariant = "terracotta" | "sage" | "neutral" | "error";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  terracotta: "bg-terracotta-muted text-terracotta",
  sage: "bg-sage-muted text-sage",
  neutral: "bg-stone-800 text-stone-400",
  error: "bg-error-muted text-error",
};

export function Badge({ variant = "neutral", className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center
        text-xs font-heading font-medium uppercase tracking-wider
        px-2.5 py-1 rounded-full
        ${variantStyles[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}
