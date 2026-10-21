"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FinancingSimulator } from "@/components/FinancingSimulator";

export default function SimuladorPage() {
  return (
    <Suspense fallback={null}>
      <SimuladorFromQuery />
    </Suspense>
  );
}

function SimuladorFromQuery() {
  const searchParams = useSearchParams();
  return <FinancingSimulator initialProductId={searchParams.get("producto") ?? ""} />;
}
