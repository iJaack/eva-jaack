import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type FieldProps = { label: string; className?: string };

export function InputField({ label, className, ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn("field-group", className)}>
      <span className="field-label">{label}</span>
      <input className="field-input" {...props} />
    </label>
  );
}

export function TextareaField({ label, className, ...props }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className={cn("field-group", className)}>
      <span className="field-label">{label}</span>
      <textarea className="field-input compose-textarea" {...props} />
    </label>
  );
}

export function SelectField({ label, className, children, ...props }: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className={cn("field-group", className)}>
      <span className="field-label">{label}</span>
      <select className="field-input" {...props}>
        {children}
      </select>
    </label>
  );
}
