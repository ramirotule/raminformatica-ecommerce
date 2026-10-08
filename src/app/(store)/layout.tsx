import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MaintenanceScreen } from "@/components/MaintenanceScreen";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { createClient } from "@/lib/supabase/server";

async function getMaintenance() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ram_store_config")
    .select("maintenance_enabled, maintenance_title, maintenance_message")
    .eq("id", 1)
    .maybeSingle();

  if (!data?.maintenance_enabled) return null;

  // Los admins ven la tienda igual para poder revisarla.
  const { data: isAdmin } = await supabase.rpc("ram_is_admin");

  return {
    title: data.maintenance_title as string,
    message: data.maintenance_message as string,
    isAdmin: isAdmin === true,
  };
}

export default async function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const maintenance = await getMaintenance();

  if (maintenance && !maintenance.isAdmin) {
    return (
      <MaintenanceScreen
        title={maintenance.title}
        message={maintenance.message}
      />
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      {maintenance && (
        <div className="bg-primary px-4 py-2 text-center text-xs font-semibold !text-white">
          Modo mantenimiento activo: los visitantes ven la página de
          mantenimiento. Vos la ves porque sos administrador.
        </div>
      )}
      <Header />
      <main className="mx-auto w-full max-w-[1280px] flex-1 box-border px-6 md:px-10">
        {children}
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
