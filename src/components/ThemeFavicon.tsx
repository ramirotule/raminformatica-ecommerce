"use client";

import { useEffect } from "react";

/**
 * El favicon sigue el tema del navegador/sistema (prefers-color-scheme),
 * no el toggle del sitio, porque la pestaña de Chrome usa ese tema.
 * - favicon-dark.png  → R plateada (pestaña oscura)
 * - favicon-light.png → R oscura (pestaña clara)
 */
const FOR_DARK_UI = "/favicon/favicon-dark.png";
const FOR_LIGHT_UI = "/favicon/favicon-light.png";

export function ThemeFavicon() {
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = (rel: string, id: string, href: string) => {
      let link = document.head.querySelector<HTMLLinkElement>(
        `link[data-rj-favicon="${id}"]`,
      );
      if (!link) {
        link = document.createElement("link");
        link.rel = rel;
        link.type = "image/png";
        link.setAttribute("data-rj-favicon", id);
        document.head.appendChild(link);
      }
      const absolute = new URL(href, window.location.origin).href;
      if (link.href !== absolute) link.href = href;
    };

    const update = () => {
      const href = mql.matches ? FOR_DARK_UI : FOR_LIGHT_UI;
      apply("icon", "icon", href);
      apply("shortcut icon", "shortcut", href);

      document.head
        .querySelectorAll<HTMLLinkElement>(
          'link[rel="icon"]:not([data-rj-favicon]), link[rel="shortcut icon"]:not([data-rj-favicon])',
        )
        .forEach((el) => el.remove());
    };

    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return null;
}
