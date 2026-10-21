export type AnalyticsEventProps = Record<
  string,
  string | number | boolean | null | undefined
>;

type UmamiClient = {
  track: (eventName: string, eventData?: AnalyticsEventProps) => void;
};

export function trackEvent(
  eventName: string,
  eventData?: AnalyticsEventProps,
): void {
  if (typeof window === "undefined") return;
  const maybeUmami = (window as Window & { umami?: UmamiClient }).umami;
  if (!maybeUmami?.track) return;
  try {
    maybeUmami.track(eventName, eventData);
  } catch {
    // Nunca romper la UX por fallos de analítica.
  }
}
