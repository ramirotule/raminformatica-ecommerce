export type CategoryId = string;
export type Product = {
  id: number;
  name: string;
  brand: string;
  category: CategoryId;
  subcategory: string;
  provider: string;
  costPrice: number | null;
  price: number;
  oldPrice: number | null;
  stock: number;
  rating: number;
  reviews: number;
  installments: string;
  description: string;
  tags: string[];
  /** Colores disponibles (características). */
  colors: string[];
  /** Memoria RAM, ej. "8 GB". */
  ram: string;
  /** Almacenamiento, ej. "256 GB". */
  storage: string;
  imageUrl: string | null;
  /** Galería completa; imageUrl suele ser la primera. */
  imageUrls: string[];
  active: boolean;
  featured: boolean;
};

/** Ruta canónica de ficha: /producto/{categoria}/{id} */
export function productHref(
  product: Pick<Product, "id" | "category">,
): string {
  const cat = encodeURIComponent(product.category || "productos");
  return `/producto/${cat}/${product.id}`;
}

export const categoryLabels: Record<string, string> = {
  celulares: "Celulares",
  notebooks: "Notebooks",
  macbooks: "MacBooks",
  videojuego: "Videojuego",
  televisores: "Televisores",
  gadgets: "Gadgets",
  audio: "Audio",
};

export const homeCategoryIds: CategoryId[] = [
  "celulares",
  "notebooks",
  "macbooks",
  "videojuego",
  "televisores",
  "gadgets",
  "audio",
];

export const products: Product[] = [
  {
    id: 1,
    name: 'MacBook Air 15" M3',
    brand: "Apple",
    category: "macbooks",
    subcategory: "",
    provider: "",
    costPrice: null,
    tags: ["apple","macbook","notebook","m3","laptop","ultrabook"],
    colors: [],
    ram: "",
    storage: "",
    imageUrl: null,
    imageUrls: [],
    active: true,
    featured: false,
    price: 1899000,
    oldPrice: null,
    stock: 12,
    rating: 4.8,
    reviews: 156,
    installments: "Pagar en Cuotas",
    description:
      "Chip M3 con CPU de 8 núcleos, pantalla Liquid Retina de 15\", hasta 18 horas de batería. Ideal para trabajo y estudio todo el día.",
  },
  {
    id: 2,
    name: 'MacBook Pro 14" M4',
    brand: "Apple",
    category: "macbooks",
    subcategory: "",
    provider: "",
    costPrice: null,
    tags: ["apple","macbook","notebook","m4","pro","laptop"],
    colors: [],
    ram: "",
    storage: "",
    imageUrl: null,
    imageUrls: [],
    active: true,
    featured: false,
    price: 2650000,
    oldPrice: null,
    stock: 0,
    rating: 4.9,
    reviews: 88,
    installments: "Hasta 6 cuotas sin interés",
    description:
      "Rendimiento profesional con chip M4, pantalla Liquid Retina XDR y hasta 22 horas de autonomía para tareas exigentes.",
  },
  {
    id: 3,
    name: "iPhone 15 Pro",
    brand: "Apple",
    category: "celulares",
    subcategory: "",
    provider: "",
    costPrice: null,
    tags: ["apple","iphone","celular","5g","pro"],
    colors: [],
    ram: "",
    storage: "",
    imageUrl: null,
    imageUrls: [],
    active: true,
    featured: false,
    price: 1450000,
    oldPrice: 1600000,
    stock: 8,
    rating: 4.7,
    reviews: 302,
    installments: "Pagar en Cuotas",
    description:
      "Estructura de titanio, chip A17 Pro y sistema de cámaras profesional con teleobjetivo 3x.",
  },
  {
    id: 4,
    name: "Xiaomi Redmi Note 13 Pro",
    brand: "Xiaomi",
    category: "celulares",
    subcategory: "",
    provider: "",
    costPrice: null,
    tags: ["xiaomi","redmi","celular","200mp","amoled"],
    colors: [],
    ram: "",
    storage: "",
    imageUrl: null,
    imageUrls: [],
    active: true,
    featured: false,
    price: 289000,
    oldPrice: null,
    stock: 34,
    rating: 4.5,
    reviews: 512,
    installments: "Pagar en Cuotas",
    description:
      "Pantalla AMOLED 120Hz, cámara principal de 200MP y carga rápida de 67W. Gran relación precio-calidad.",
  },
  {
    id: 5,
    name: "Xiaomi Poco X6",
    brand: "Xiaomi",
    category: "celulares",
    subcategory: "",
    provider: "",
    costPrice: null,
    tags: ["xiaomi","poco","celular","gaming","snapdragon"],
    colors: [],
    ram: "",
    storage: "",
    imageUrl: null,
    imageUrls: [],
    active: true,
    featured: false,
    price: 349000,
    oldPrice: 399000,
    stock: 21,
    rating: 4.4,
    reviews: 198,
    installments: "Hasta 6 cuotas sin interés",
    description:
      "Procesador Snapdragon de alto rendimiento pensado para gaming, con pantalla curva AMOLED.",
  },
  {
    id: 6,
    name: "Motorola Edge 40",
    brand: "Motorola",
    category: "celulares",
    subcategory: "",
    provider: "",
    costPrice: null,
    tags: ["motorola","edge","celular","ip68"],
    colors: [],
    ram: "",
    storage: "",
    imageUrl: null,
    imageUrls: [],
    active: true,
    featured: false,
    price: 399000,
    oldPrice: null,
    stock: 15,
    rating: 4.3,
    reviews: 143,
    installments: "Hasta 6 cuotas sin interés",
    description:
      "Diseño delgado en curva, pantalla pOLED 144Hz y resistencia al agua IP68.",
  },
  {
    id: 7,
    name: "Notebook Lenovo IdeaPad 15",
    brand: "Lenovo",
    category: "notebooks",
    subcategory: "",
    provider: "",
    costPrice: null,
    tags: ["lenovo","notebook","ideapad","laptop","estudio"],
    colors: [],
    ram: "",
    storage: "",
    imageUrl: null,
    imageUrls: [],
    active: true,
    featured: false,
    price: 789000,
    oldPrice: null,
    stock: 14,
    rating: 4.3,
    reviews: 97,
    installments: "Pagar en Cuotas",
    description:
      "Pantalla Full HD de 15.6\", procesador de última generación y 16GB de RAM para estudio y trabajo.",
  },
  {
    id: 8,
    name: "Consola PlayStation 5 Slim",
    brand: "Sony",
    category: "videojuego",
    subcategory: "",
    provider: "",
    costPrice: null,
    tags: ["sony","playstation","ps5","consola","gaming","videojuego"],
    colors: [],
    ram: "",
    storage: "",
    imageUrl: null,
    imageUrls: [],
    active: true,
    featured: false,
    price: 899000,
    oldPrice: 999000,
    stock: 7,
    rating: 4.8,
    reviews: 221,
    installments: "Pagar en Cuotas",
    description:
      "SSD ultrarrápido, gráficos 4K y DualSense incluido. Ideal para la nueva generación de juegos.",
  },
  {
    id: 9,
    name: "Drone Explorer 4K",
    brand: "RAM Informática",
    category: "gadgets",
    subcategory: "",
    provider: "",
    costPrice: null,
    tags: ["drone","4k","gadgets","vuelo"],
    colors: [],
    ram: "",
    storage: "",
    imageUrl: null,
    imageUrls: [],
    active: true,
    featured: false,
    price: 549000,
    oldPrice: null,
    stock: 9,
    rating: 4.6,
    reviews: 64,
    installments: "Hasta 6 cuotas sin interés",
    description:
      "Cámara 4K estabilizada, 30 minutos de vuelo por batería y retorno automático al punto de despegue.",
  },
  {
    id: 10,
    name: "Lentes Smart Vision X",
    brand: "RAM Informática",
    category: "gadgets",
    subcategory: "",
    provider: "",
    costPrice: null,
    tags: ["lentes","smart","gadgets","audio","wearable"],
    colors: [],
    ram: "",
    storage: "",
    imageUrl: null,
    imageUrls: [],
    active: true,
    featured: false,
    price: 199000,
    oldPrice: null,
    stock: 25,
    rating: 4.0,
    reviews: 41,
    installments: "Hasta 3 cuotas sin interés",
    description:
      "Audio open-ear, control por voz y notificaciones integradas en un armazón liviano.",
  },
  {
    id: 11,
    name: 'Smart TV 55" 4K',
    brand: "Samsung",
    category: "televisores",
    subcategory: "",
    provider: "",
    costPrice: null,
    tags: ["samsung","tv","4k","smart tv","televisor"],
    colors: [],
    ram: "",
    storage: "",
    imageUrl: null,
    imageUrls: [],
    active: true,
    featured: false,
    price: 629000,
    oldPrice: 749000,
    stock: 11,
    rating: 4.5,
    reviews: 210,
    installments: "Pagar en Cuotas",
    description:
      "Panel 4K con HDR, sistema operativo con apps de streaming integradas y control por voz.",
  },
  {
    id: 12,
    name: "Audífonos Bluetooth Pro",
    brand: "Sony",
    category: "audio",
    subcategory: "",
    provider: "",
    costPrice: null,
    tags: ["sony","audio","auriculares","bluetooth","anc"],
    colors: [],
    ram: "",
    storage: "",
    imageUrl: null,
    imageUrls: [],
    active: true,
    featured: false,
    price: 89000,
    oldPrice: null,
    stock: 60,
    rating: 4.3,
    reviews: 389,
    installments: "Hasta 3 cuotas sin interés",
    description:
      "Cancelación activa de ruido, 30 horas de batería total con estuche de carga.",
  },
];

export const reviewsData = [
  {
    name: "Marcos D.",
    rating: 5,
    text: "Llegó antes de lo esperado y el equipo funciona perfecto. El soporte por chat respondió todas mis dudas.",
    date: "12 ago 2026",
  },
  {
    name: "Lucía R.",
    rating: 4,
    text: "Muy buena relación precio-calidad. Las cuotas sin interés hicieron la diferencia para comprarlo.",
    date: "3 ago 2026",
  },
  {
    name: "Fede A.",
    rating: 5,
    text: "Segunda compra en RAM Informática, siempre con stock real y sin sorpresas en el envío.",
    date: "28 jul 2026",
  },
];

export type OrderStatus = "Entregado" | "En camino" | "Procesando";

export type OrderItem = {
  name: string;
  qty: number;
  unitPrice: string;
  lineTotal: string;
};

export type Order = {
  id: string;
  date: string;
  status: OrderStatus;
  total: string;
  subtotal: string;
  shipping: string;
  payment: string;
  address: string;
  items: OrderItem[];
};

export const ordersData: Order[] = [
  {
    id: "#RJ-4821",
    date: "18 ago 2026",
    status: "Entregado",
    total: "$399.000",
    subtotal: "$399.000",
    shipping: "Gratis",
    payment: "Cuotas sin interés",
    address: "Av. San Martín 450, Santa Rosa, La Pampa (CP 6300)",
    items: [
      {
        name: "Motorola Edge 40",
        qty: 1,
        unitPrice: "$399.000",
        lineTotal: "$399.000",
      },
    ],
  },
  {
    id: "#RJ-4790",
    date: "02 ago 2026",
    status: "En camino",
    total: "$1.899.000",
    subtotal: "$1.899.000",
    shipping: "Gratis",
    payment: "Tarjeta de crédito",
    address: "Av. San Martín 450, Santa Rosa, La Pampa (CP 6300)",
    items: [
      {
        name: 'MacBook Air 15" M3',
        qty: 1,
        unitPrice: "$1.899.000",
        lineTotal: "$1.899.000",
      },
    ],
  },
  {
    id: "#RJ-4712",
    date: "15 jul 2026",
    status: "Procesando",
    total: "$289.000",
    subtotal: "$289.000",
    shipping: "Gratis",
    payment: "Transferencia bancaria",
    address: "Av. San Martín 450, Santa Rosa, La Pampa (CP 6300)",
    items: [
      {
        name: "Xiaomi Redmi Note 13 Pro",
        qty: 1,
        unitPrice: "$289.000",
        lineTotal: "$289.000",
      },
    ],
  },
];

export const trustBadges = [
  {
    id: "shipping" as const,
    title: "Envío a todo el país",
    desc: "Seguimiento en tiempo real",
  },
  {
    id: "warranty" as const,
    title: "Garantía oficial",
    desc: "12 meses en todos los equipos",
  },
  {
    id: "support" as const,
    title: "Soporte por chat",
    desc: "Respuesta en minutos",
  },
];

export const productSpecs = [
  { k: "Pantalla", v: "Alta resolución, tratamiento antirreflejo" },
  { k: "Batería", v: "Hasta un día completo de uso" },
  { k: "Garantía", v: "6 meses" },
  { k: "Caja incluye", v: "Equipo, cable de carga y manual" },
];

export function getProduct(id: number, list: Product[] = products) {
  return list.find((p) => p.id === id);
}

export function getRelatedProducts(
  product: Product,
  limit = 4,
  list: Product[] = products,
) {
  return list
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, limit);
}

export type SortOption =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "name_asc"
  | "name_desc"
  | "category_asc"
  | "category_desc"
  | "brand_asc"
  | "brand_desc";

export type ProductFilters = {
  category?: CategoryId | "all";
  brand?: string | "all";
  subcategory?: string | "all";
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortOption;
};

export function getAllBrands(list: Product[] = products) {
  return [...new Set(list.map((p) => p.brand))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
}

export function getPriceBounds(list: Product[] = products) {
  if (list.length === 0) return { min: 0, max: 0 };
  const prices = list.map((p) => p.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}


export function parseTags(input: string): string[] {
  return [
    ...new Set(
      input
        .split(/[,;#]+/)
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  ];
}

/** URLs de galería (sin duplicados); cae a imageUrl si hace falta. */
export function productImages(product: Product): string[] {
  const fromList = (product.imageUrls ?? []).filter(Boolean);
  if (fromList.length > 0) return [...new Set(fromList)];
  return product.imageUrl ? [product.imageUrl] : [];
}

export function productMatchesQuery(product: Product, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const tags = product.tags ?? [];
  const colors = product.colors ?? [];
  const haystack = [
    product.name,
    product.brand,
    product.description,
    categoryLabels[product.category],
    product.ram,
    product.storage,
    ...tags,
    ...colors,
  ]
    .join(" ")
    .toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.every((token) => haystack.includes(token));
}

export function filterProducts(
  filters: ProductFilters = {},
  list: Product[] = products,
) {
  const {
    category = "all",
    brand = "all",
    subcategory = "all",
    query = "",
    minPrice,
    maxPrice,
    sort = "relevance",
  } = filters;

  const q = query.trim().toLowerCase();

  let filtered = list.filter((p) => {
    if (category !== "all" && p.category !== category) return false;
    if (brand !== "all" && p.brand.toLowerCase() !== brand.toLowerCase())
      return false;
    if (
      subcategory !== "all" &&
      (p.subcategory ?? "").toLowerCase() !== subcategory.toLowerCase()
    )
      return false;
    if (minPrice != null && p.price < minPrice) return false;
    if (maxPrice != null && p.price > maxPrice) return false;
    if (q && !productMatchesQuery(p, q)) {
      return false;
    }
    return true;
  });

  filtered = [...filtered];
  if (sort === "price_asc") filtered.sort((a, b) => a.price - b.price);
  if (sort === "price_desc") filtered.sort((a, b) => b.price - a.price);
  if (sort === "name_asc")
    filtered.sort((a, b) => a.name.localeCompare(b.name, "es"));
  if (sort === "name_desc")
    filtered.sort((a, b) => b.name.localeCompare(a.name, "es"));
  if (sort === "category_asc" || sort === "category_desc") {
    const dir = sort === "category_asc" ? 1 : -1;
    filtered.sort((a, b) => {
      const la = categoryLabels[a.category] ?? a.category;
      const lb = categoryLabels[b.category] ?? b.category;
      const byCat = la.localeCompare(lb, "es") * dir;
      if (byCat !== 0) return byCat;
      return a.name.localeCompare(b.name, "es");
    });
  }
  if (sort === "brand_asc" || sort === "brand_desc") {
    const dir = sort === "brand_asc" ? 1 : -1;
    filtered.sort((a, b) => {
      const byBrand = a.brand.localeCompare(b.brand, "es") * dir;
      if (byBrand !== 0) return byBrand;
      return a.name.localeCompare(b.name, "es");
    });
  }
  if (sort === "relevance")
    filtered.sort((a, b) => b.rating * b.reviews - a.rating * a.reviews);

  return filtered;
}
