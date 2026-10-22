"use client";

type Props = {
  className?: string;
};

export function GetnetMark({ className = "" }: Props) {
  return (
    <span className={`relative inline-flex items-center text-[#ec230f] ${className}`}>
      <span className="text-[1.02em] leading-none font-medium">Getnet</span>
      <span className="ml-0.5 grid grid-cols-3 gap-[1px]">
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className={`h-[2px] w-[2px] rounded-[1px] ${
              i % 2 === 0 ? "bg-[#ec230f]" : "bg-[#ff8a80]"
            }`}
          />
        ))}
      </span>
    </span>
  );
}
