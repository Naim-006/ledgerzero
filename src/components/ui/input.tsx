import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, label, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-semibold text-brand-900 mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          id={id}
          className={cn(
            "w-full px-3 py-2 text-sm bg-surface border border-slateSurface-300 rounded-lg text-brand-900 placeholder:text-brand-700/50 focus:outline-none focus:ring-2 focus:ring-forest-action focus:border-forest-action transition-colors disabled:bg-slateSurface-100 disabled:cursor-not-allowed",
            error && "border-risk-500 focus:ring-risk-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-risk-600 mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
