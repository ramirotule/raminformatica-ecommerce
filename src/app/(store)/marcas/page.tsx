import type { Metadata } from "next";
import { MarcasClient } from "./MarcasClient";

export const metadata: Metadata = {
  title: "Marcas — RAM Informatica",
  description:
    "Explora las marcas del catalogo RAM Informatica y filtra productos por marca.",
};

export default function MarcasPage() {
  return <MarcasClient />;
}
