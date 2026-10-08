import { swatchForColor } from "@/lib/product-colors";

type Props = {
  colors: string[];
  size?: "sm" | "md";
  showLabels?: boolean;
  className?: string;
};

function isLight(swatch: string) {
  const s = swatch.toLowerCase();
  return (
    s === "#f4f4f4" ||
    s === "#ffffff" ||
    s === "#c0c4c8" ||
    s === "#a8d4f0" ||
    s === "#cbb79a" ||
    s === "#c4a484"
  );
}

export function ColorSwatches({
  colors,
  size = "sm",
  showLabels = false,
  className = "",
}: Props) {
  const list = (colors ?? []).filter(Boolean);
  if (list.length === 0) return null;

  const dot = size === "md" ? "size-4" : "size-3";

  if (showLabels) {
    return (
      <div className={`flex flex-wrap items-center gap-1.5 ${className}`.trim()}>
        {list.map((color) => {
          const swatch = swatchForColor(color);
          return (
            <span
              key={color}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[12px] font-medium text-foreground"
              title={color}
            >
              <span
                className={`${dot} shrink-0 rounded-full ${isLight(swatch) ? "border border-border" : ""}`}
                style={{ backgroundColor: swatch }}
                aria-hidden
              />
              {color}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-nowrap items-center gap-1 ${className}`.trim()}
      aria-label={`Colores: ${list.join(", ")}`}
    >
      {list.map((color) => {
        const swatch = swatchForColor(color);
        return (
          <span
            key={color}
            title={color}
            className={`${dot} rounded-full ${isLight(swatch) ? "border border-border" : "ring-1 ring-black/10"}`}
            style={{ backgroundColor: swatch }}
          />
        );
      })}
    </div>
  );
}
