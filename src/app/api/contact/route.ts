import { NextResponse } from "next/server";

const CONTACT_TO = "raminformatik@gmail.com";

type Body = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function siteOrigin(req: Request) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

async function sendWithResend(input: {
  to: string;
  from: string;
  replyTo: string;
  subject: string;
  text: string;
  apiKey: string;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: input.from,
      to: [input.to],
      reply_to: input.replyTo,
      subject: input.subject,
      text: input.text,
    }),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
}

/** Envío a Gmail vía FormSubmit (gratis). La 1ª vez pide activar el mail. */
async function sendWithFormSubmit(input: {
  to: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  origin: string;
}): Promise<{ message?: string; needsActivation: boolean }> {
  // FormSubmit rechaza llamadas sin Origin/Referer de un "web server".
  const res = await fetch(`https://formsubmit.co/ajax/${input.to}`, {
    method: "POST",
    // Evita que el formulario quede "Enviando…" si FormSubmit no responde.
    signal: AbortSignal.timeout(15_000),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: input.origin,
      Referer: `${input.origin}/contacto`,
    },
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      message: input.message,
      _subject: input.subject,
      _replyto: input.email,
      _template: "table",
      _captcha: "false",
    }),
  });
  const data = (await res.json().catch(() => null)) as {
    success?: string | boolean;
    message?: string;
  } | null;
  if (!res.ok) {
    throw new Error(data?.message || "FormSubmit error");
  }

  const msg = data?.message ?? "";
  const msgLower = msg.toLowerCase();
  const needsActivation =
    msgLower.includes("activat") ||
    msgLower.includes("confirm") ||
    msgLower.includes("check your email") ||
    msgLower.includes("verificar");

  if (data && (data.success === false || data.success === "false")) {
    if (needsActivation) {
      return { message: msg, needsActivation: true };
    }
    throw new Error(msg || "FormSubmit rechazó el envío");
  }

  return { message: msg || undefined, needsActivation: false };
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Pedido inválido" },
      { status: 400 },
    );
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const subject = (body.subject ?? "").trim();
  const message = (body.message ?? "").trim();

  if (!name || !email || !subject || !message) {
    return NextResponse.json(
      { ok: false, error: "Completá todos los campos" },
      { status: 400 },
    );
  }
  if (!isEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "Email inválido" },
      { status: 400 },
    );
  }
  if (message.length > 5000 || subject.length > 200 || name.length > 120) {
    return NextResponse.json(
      { ok: false, error: "El mensaje es demasiado largo" },
      { status: 400 },
    );
  }

  const to = process.env.CONTACT_TO_EMAIL?.trim() || CONTACT_TO;
  const mailSubject = `[RAM Informatica] ${subject}`;
  const text = `Nombre: ${name}\nEmail: ${email}\n\n${message}`;
  const origin = siteOrigin(req);

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    try {
      await sendWithResend({
        to,
        from:
          process.env.CONTACT_FROM_EMAIL?.trim() ||
          "RAM Informatica <onboarding@resend.dev>",
        replyTo: email,
        subject: mailSubject,
        text,
        apiKey: resendKey,
      });
      return NextResponse.json({ ok: true, sent: true, provider: "resend" });
    } catch (err) {
      console.error("Resend error:", err);
    }
  }

  try {
    const result = await sendWithFormSubmit({
      to,
      name,
      email,
      subject: mailSubject,
      message,
      origin,
    });

    if (result.needsActivation) {
      return NextResponse.json({
        ok: true,
        sent: true,
        provider: "formsubmit",
        needsActivation: true,
        hint: `FormSubmit te mandó un mail a ${to} con el link "Activate Form". Abrilo (mirá también spam), hacé clic, y después volvé a enviar el mensaje desde la web. Hasta activarlo no llegan los contactos.`,
      });
    }

    return NextResponse.json({
      ok: true,
      sent: true,
      provider: "formsubmit",
    });
  } catch (err) {
    console.error("FormSubmit error:", err);
  }

  // No abrimos mailto automáticamente: el usuario ve un error claro.
  return NextResponse.json(
    {
      ok: false,
      error: `No pudimos enviar el mail a ${to}. Si es la primera vez, revisá Gmail (y spam) por un mail de FormSubmit para activar el formulario.`,
    },
    { status: 502 },
  );
}
