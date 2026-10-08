import Image from "next/image";

type Props = {
  title: string;
  message: string;
};

export function MaintenanceScreen({ title, message }: Props) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white dark:bg-background px-6 py-12 text-center">
      <Image
        src="/logo-light.jpg"
        alt="RAM Informática"
        width={540}
        height={270}
        priority
        className="h-auto w-full max-w-[540px] object-contain dark:hidden"
      />
      <Image
        src="/logo-dark.png"
        alt="RAM Informática"
        width={540}
        height={270}
        priority
        className="hidden h-auto w-full max-w-[540px] object-contain dark:block"
      />
      <h1 className="max-w-[760px] font-serif text-3xl font-bold leading-tight text-foreground md:text-[2.5rem]">
        {title}
      </h1>
      {message && <p className="text-base text-muted">{message}</p>}
    </main>
  );
}
