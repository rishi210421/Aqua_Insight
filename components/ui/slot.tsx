import { cloneElement, isValidElement, type HTMLAttributes, type ReactElement } from "react";
import { cn } from "@/lib/utils";

export function Slot({ children, className, ...props }: HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
  if (!isValidElement(children)) return null;
  const child = children as ReactElement<{ className?: string }>;
  return cloneElement(child, {
    ...props,
    className: cn(className, child.props.className),
  });
}
