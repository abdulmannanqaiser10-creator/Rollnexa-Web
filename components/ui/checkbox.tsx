import { cn } from "@/lib/utils";

function Checkbox({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 shrink-0 rounded border-gray-300 text-amber-500 focus:ring-2 focus:ring-amber-500/20",
        className
      )}
      {...props}
    />
  );
}

export { Checkbox };
