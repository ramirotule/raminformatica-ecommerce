import type { CategoryId, Order, OrderItem, OrderStatus, Product } from "@/lib/products";
import { formatPrice, type CurrencyCode } from "@/lib/format";

export type ProductRow = {
  id: number;
  name: string;
  brand: string;
  category: string;
  subcategory: string | null;
  provider: string | null;
  cost_price: number | string | null;
  price: number | string;
  old_price: number | string | null;
  stock: number;
  rating: number | string;
  reviews: number;
  installments: string;
  description: string;
  tags: string[] | null;
  colors: string[] | null;
  ram: string | null;
  storage: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  active: boolean | null;
  featured: boolean | null;
};

export type ProviderRow = {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
};

export type StoreConfigRow = {
  id: number;
  store_name: string;
  tagline: string;
  support_email: string;
  support_phone: string;
  currency: string;
  free_shipping_from: number | string;
  shipping_cost: number | string;
  installments_enabled: boolean;
  max_installments: number;
  announcement: string;
  maintenance_enabled: boolean;
  maintenance_title: string;
  maintenance_message: string;
};

export type ProfileRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  dni: string;
};

export type AddressRow = {
  id: string;
  user_id: string;
  label: string;
  street: string;
  city: string;
  province: string;
  zip: string;
  phone: string;
};

export type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  subtotal: number | string;
  shipping: number | string;
  total: number | string;
  payment: string;
  address: string;
  created_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: number | null;
  name: string;
  qty: number;
  unit_price: number | string;
  line_total: number | string;
};

function num(v: number | string | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v);
}

export function mapProduct(row: ProductRow): Product {
  return {
    id: Number(row.id),
    name: row.name,
    brand: row.brand,
    category: row.category as CategoryId,
    subcategory: row.subcategory ?? "",
    provider: row.provider ?? "",
    costPrice: row.cost_price == null ? null : num(row.cost_price),
    price: num(row.price),
    oldPrice: row.old_price == null ? null : num(row.old_price),
    stock: row.stock,
    rating: num(row.rating),
    reviews: row.reviews,
    installments: row.installments,
    description: row.description,
    tags: row.tags ?? [],
    colors: row.colors ?? [],
    ram: row.ram ?? "",
    storage: row.storage ?? "",
    imageUrl:
      row.image_url ??
      (row.image_urls && row.image_urls.length > 0 ? row.image_urls[0] : null),
    imageUrls: (() => {
      const list = (row.image_urls ?? []).filter(Boolean);
      if (list.length > 0) return [...new Set(list)];
      return row.image_url ? [row.image_url] : [];
    })(),
    active: row.active ?? true,
    featured: row.featured ?? false,
  };
}

export function toProductInsert(input: {
  name: string;
  brand: string;
  category: CategoryId;
  subcategory?: string;
  provider?: string;
  costPrice?: number | null;
  price: number;
  oldPrice: number | null;
  stock: number;
  rating?: number;
  reviews?: number;
  installments: string;
  description: string;
  tags?: string[];
  colors?: string[];
  ram?: string;
  storage?: string;
  imageUrl?: string | null;
  imageUrls?: string[];
  active?: boolean;
  featured?: boolean;
}) {
  const urls = [
    ...new Set(
      (input.imageUrls?.length
        ? input.imageUrls
        : input.imageUrl
          ? [input.imageUrl]
          : []
      ).filter(Boolean),
    ),
  ];
  return {
    name: input.name,
    brand: input.brand,
    category: input.category,
    subcategory: input.subcategory ?? "",
    provider: input.provider ?? "",
    cost_price: input.costPrice ?? null,
    price: input.price,
    old_price: input.oldPrice,
    stock: input.stock,
    rating: input.rating ?? 4.5,
    reviews: input.reviews ?? 0,
    installments: input.installments,
    description: input.description,
    tags: input.tags ?? [],
    colors: input.colors ?? [],
    ram: input.ram ?? "",
    storage: input.storage ?? "",
    image_url: urls[0] ?? null,
    image_urls: urls,
    active: input.active ?? true,
    featured: input.featured ?? false,
  };
}

export function mapProvider(row: ProviderRow) {
  return {
    id: row.id,
    name: row.name,
    contact: row.contact,
    email: row.email,
    phone: row.phone,
    address: row.address,
    notes: row.notes,
  };
}

export function mapStoreConfig(row: StoreConfigRow) {
  return {
    storeName: row.store_name,
    tagline: row.tagline,
    supportEmail: row.support_email,
    supportPhone: row.support_phone,
    currency: (row.currency === "ARS" ? "ARS" : "USD") as CurrencyCode,
    freeShippingFrom: num(row.free_shipping_from),
    shippingCost: num(row.shipping_cost),
    installmentsEnabled: row.installments_enabled,
    maxInstallments: row.max_installments,
    announcement: row.announcement,
    maintenanceEnabled: row.maintenance_enabled ?? false,
    maintenanceTitle: row.maintenance_title ?? "",
    maintenanceMessage: row.maintenance_message ?? "",
  };
}

export function toStoreConfigUpdate(config: ReturnType<typeof mapStoreConfig>) {
  return {
    store_name: config.storeName,
    tagline: config.tagline,
    support_email: config.supportEmail,
    support_phone: config.supportPhone,
    currency: config.currency,
    free_shipping_from: config.freeShippingFrom,
    shipping_cost: config.shippingCost,
    installments_enabled: config.installmentsEnabled,
    max_installments: config.maxInstallments,
    announcement: config.announcement,
    maintenance_enabled: config.maintenanceEnabled,
    maintenance_title: config.maintenanceTitle,
    maintenance_message: config.maintenanceMessage,
    updated_at: new Date().toISOString(),
  };
}

export function mapProfile(row: ProfileRow) {
  return {
    name: row.name,
    email: row.email,
    phone: row.phone,
    dni: row.dni,
  };
}

export function mapAddress(row: AddressRow) {
  return {
    id: row.id,
    label: row.label,
    street: row.street,
    city: row.city,
    province: row.province,
    zip: row.zip,
    phone: row.phone,
  };
}

export function mapOrder(
  row: OrderRow,
  items: OrderItemRow[],
  currency: CurrencyCode = "USD",
): Order {
  const mappedItems: OrderItem[] = items.map((i) => ({
    name: i.name,
    qty: i.qty,
    unitPrice: formatPrice(num(i.unit_price), currency),
    lineTotal: formatPrice(num(i.line_total), currency),
  }));

  const shippingNum = num(row.shipping);
  const created = new Date(row.created_at);
  const date = created.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return {
    id: row.order_number,
    date,
    status: row.status as OrderStatus,
    total: formatPrice(num(row.total), currency),
    subtotal: formatPrice(num(row.subtotal), currency),
    shipping: shippingNum === 0 ? "Gratis" : formatPrice(shippingNum, currency),
    payment: row.payment,
    address: row.address,
    items: mappedItems,
  };
}
