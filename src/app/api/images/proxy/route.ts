import { NextResponse } from "next/server";

function isHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawUrl = (searchParams.get("url") ?? "").trim();
  if (!rawUrl || !isHttpUrl(rawUrl)) {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }

  try {
    const res = await fetch(rawUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "No se pudo descargar la imagen remota" },
        { status: 502 },
      );
    }

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "La URL no devolvió una imagen válida" },
        { status: 415 },
      );
    }

    const data = await res.arrayBuffer();
    return new Response(data, {
      headers: {
        "content-type": contentType,
        "cache-control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Error al descargar imagen para procesar" },
      { status: 500 },
    );
  }
}
