import React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  options?: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, id, options, children, ...props }, ref) => {
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
        <select
          ref={ref}
          id={id}
          className={cn(
            "w-full px-3 py-2 text-sm bg-surface border border-slateSurface-300 rounded-lg text-brand-900 focus:outline-none focus:ring-2 focus:ring-forest-action focus:border-forest-action transition-colors disabled:bg-slateSurface-100 disabled:cursor-not-allowed",
            error && "border-risk-500 focus:ring-risk-500",
            className
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-surface text-foreground">
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <p className="text-xs text-risk-600 mt-1">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
