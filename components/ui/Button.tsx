import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline";
}

export const Button = ({ 
  children, 
  variant = "primary", 
  className = "", 
  ...props 
}: ButtonProps) => {
  const baseClass = variant === "primary" ? "btn-primary" : "btn-outline";
  
  // Base structural classes that align with dashboard buttons
  const styles = variant === "primary" 
    ? "px-6 py-2.5 bg-[var(--accent)] text-white font-bold text-[13px] rounded-[var(--radius)] flex items-center justify-center gap-2"
    : "px-6 py-2.5 bg-transparent border border-[var(--border-primary)] text-[var(--text-primary)] font-bold text-[13px] rounded-[var(--radius)] hover:bg-[var(--bg-secondary)] flex items-center justify-center gap-2";

  return (
    <button className={`${baseClass} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
};
