// All copy and settings for the site. Items marked TODO wait on Pedro's answers
// (see docs/requirements/REQUIREMENTS_ANALYSIS.md §11 and the 22 Nov update, kept locally).

export const site = {
  lang: "es",
  title: "14 días de dulce amor · Calendario de San Valentín 2027",
  // Pedro's proposed name for the calendar ("el título del calendario puede ser 14 días de dulce amor").
  name: "14 días de dulce amor",
  description: "14 días de recetas para endulzar el amor. Un corazón nuevo cada día, del 1 al 14 de febrero de 2027.",
  subtitle: "14 días de recetas para endulzar el amor", // C08, exact wording requested by Pedro
  shareText: "Mira «14 días de dulce amor», el Calendario de San Valentín de Sabores y Secretos PR 💗",
  // TODO(Pedro): confirm the community hashtag.
  hashtag: "#DulceSanValentin2027",
  // Pedro's YouTube channel. Not shown on the cover until he decides (Q7).
  channelName: "Sabores y Secretos PR" as string | null,
  youtubeUrl: "https://www.youtube.com/@saboresysecretospr4504" as string | null,
  // Each box opens at 8 a.m. (Pedro). TODO(Q9): confirm the time zone; Puerto Rico (UTC-4) for now.
  launch: "2027-02-01T08:00:00-04:00",
  openTime: "8:00 a. m.",
  days: 14,
  checkoutUrl: "/comprar/" as string | null,
  buyerAreaUrl: "/calendario/" as string | null,
  contact: {
    whatsapp: null as string | null,
    email: null as string | null,
    instagram: "secretos_y_sabores_",
    whatsappMessage: "¡Hola! Me interesa el calendario *14 días de dulce amor* 🗓️💗",
  },
  // TODO(B03): real price. Null shows "muy pronto".
  price: null as null | { amount: number; regular?: number; currency: string },
};

export const nav = [
  { href: "#calendario", label: "Calendario" },
  { href: "#ruta", label: "Ruta" },
  { href: "#recetas", label: "Recetas" },
  { href: "#regala", label: "Regala" },
  { href: "#comunidad", label: "Comunidad" },
  { href: "#precio", label: "Precio" },
  { href: "#preguntas", label: "Preguntas" },
];

// Intro under the landing (the demo's second screen with the 3D book).
export const intro = {
  eyebrow: "Edición San Valentín 2027",
  title: "14 días de amor,",
  accent: "sabor y repostería",
  lead: "Del 1 al 14 de febrero se abre un corazón nuevo cada mañana con una receta para descargar, videos paso a paso de Pedro en YouTube y trucos para que tus postres enamoren.",
};

export type DayKind = "recipe" | "plan" | "beverage" | "special";
export const schedule: { title: string; kind: DayKind; recipeSlug: string }[] = [
  { title: "Bizcocho de chocolate sin harina", kind: "recipe", recipeSlug: "bizcocho-de-chocolate-sin-harina" },
  { title: "Galletas de fresa y gotitas de chocolate", kind: "recipe", recipeSlug: "galletas-de-fresa-y-gotitas-de-chocolate" },
  { title: "Los mejores mini cheesecakes de chocolate", kind: "recipe", recipeSlug: "mini-cheesecakes-de-chocolate" },
  { title: "Cupcakes de chocolate y guineo", kind: "recipe", recipeSlug: "cupcakes-de-chocolate-y-guineo" },
  { title: "Galletas de doble chocolate", kind: "recipe", recipeSlug: "galletas-de-doble-chocolate" },
  { title: "Mantequilla de chocolate", kind: "recipe", recipeSlug: "mantequilla-de-chocolate" },
  { title: "Limonada de fresa", kind: "recipe", recipeSlug: "limonada-de-fresa" },
  { title: "Galletas de polvo de fresas", kind: "recipe", recipeSlug: "galletas-de-polvo-de-fresas" },
  { title: "Bizcocho de chocolate con harina Swans Down", kind: "recipe", recipeSlug: "bizcocho-de-chocolate-con-harina-swans-down" },
  { title: "Las mejores galletas de chocolate chips", kind: "recipe", recipeSlug: "las-mejores-galletas-de-chocolate-chips" },
  { title: "Frosting de chocolate", kind: "recipe", recipeSlug: "frosting-de-chocolate" },
  { title: "Dip cremoso de chocolate", kind: "recipe", recipeSlug: "dip-cremoso-de-chocolate" },
  { title: "Galletas de Oreo y chocolate chips", kind: "recipe", recipeSlug: "galletas-de-oreo-y-chocolate-chips" },
  { title: "Super coquito de Nutella", kind: "special", recipeSlug: "super-coquito-de-nutella" },
];

// "¿Qué encontrarás dentro?" from the demo, now with Pedro's real recipes and his seasonal extras.
export const categories = [
  { icon: "strawberry", title: "Postres con chocolate", text: "Mini cheesecakes, bizcocho sin harina, cupcakes de chocolate y guineo, galletas de doble chocolate y más." },
  { icon: "heart-cake", title: "Paso a paso", list: ["Videos en YouTube", "Recetas para descargar", "Consejos de Pedro"] },
  { icon: "piping-bag", title: "Galletas", text: "Galletas de fresa, de chocolate chips, de Oreo y chocolate chips, con ideas para presentar y regalar." },
  { icon: "hot-cocoa", title: "Bebidas y extras", text: "Limonada de fresa, frosting de chocolate, dip cremoso de chocolate y más para la temporada." },
  { icon: "ganache-drip", title: "Día 14: cierre especial", text: "Super coquito de Nutella." },
] as const;

// "Mucho más que videos": only what the calendar really includes.
export const extras = [
  { icon: "recipe", text: "Recetas para descargar e imprimir" },
  { icon: "video", text: "Videos paso a paso en YouTube" },
  { icon: "device", text: "En tu teléfono, tableta o computadora" },
] as const;

// TODO(Pedro): real reviews from buyers, with their permission. While empty, the section invites the first ones.
export const testimonials: { quote: string; name: string; place: string }[] = [];

export const closing = {
  title: "¡Nos vemos en febrero!",
  line: "Un regalo dulce para ti y para quien más quieres.",
};

export const months = ["enero", "febrero", "marzo"];

export function dayDate(n: number) {
  return new Date(new Date(site.launch).getTime() + (n - 1) * 86_400_000);
}

export const highlights = [
  { icon: "ticket", title: "Reserva", text: "Cómpralo cuando quieras: tu calendario abre el 1 de febrero." },
  { icon: "heart", title: "Abre", text: "Cada mañana a las 8:00 se abre un corazón nuevo, del 1 al 14." },
  { icon: "whisk", title: "Hornea", text: "Descarga la receta y mira el paso a paso en YouTube." },
] as const;

// The note Pedro asked for in the promotion.
export const buyNote = "Cómpralo en cualquier momento del año: no importa cuándo lo compres, tu calendario abre el 1 de febrero.";

export const included = [
  "Una receta para descargar cada día, del 1 al 14 de febrero",
  "Videos paso a paso de Pedro en YouTube",
  "Recetas de postres y bebidas para el 14",
  "Día 14: cierre especial con una bebida para brindar",
  "Acceso desde cualquier dispositivo",
];

// TODO(Q10, Q11): confirm each answer with Pedro before launch.
export const faqs = [
  { q: "¿Cuándo se abre cada corazón?", a: "Uno por día, del 1 al 14 de febrero de 2027, a las 8:00 de la mañana. Cada corazón se queda abierto para ti." },
  { q: "¿Puedo comprarlo antes de febrero?", a: "Sí, en cualquier momento del año. No importa cuándo lo compres: tu calendario abre el 1 de febrero." },
  { q: "¿Dónde veo los videos?", a: "En el canal de YouTube de Pedro, Sabores y Secretos PR. Cada corazón te lleva directo al video del día." },
  { q: "¿Puedo descargar las recetas?", a: "¡Sí! Cada receta se descarga para que la imprimas o la guardes en tu teléfono." },
  { q: "¿Qué pasa si compro después del 1 de febrero?", a: "Encontrarás abiertos todos los corazones de los días que ya pasaron, listos para ver." },
  { q: "¿Puedo regalarlo?", a: "Sí. Compra el calendario y recibes un enlace personal que puedes enviar a quien quieras como regalo." },
  { q: "¿Qué hay el día 14?", a: "El cierre especial del calendario: una bebida para brindar en San Valentín, con su video paso a paso de Pedro." },
];

// TODO: replace with Pedro's own words and photo.
export const profile = {
  name: "Pedro",
  line: "Sabores y Secretos PR · Puerto Rico → Nueva York",
  // Shown as chips beside the story; plain descriptions of the product, not claims about results.
  values: ["Sabor de Puerto Rico", "Paso a paso", "Para hornear todo el año"],
  bio: "Pedro es puertorriqueño, vive en Nueva York y comparte su repostería en su canal de YouTube, Sabores y Secretos PR. En este calendario reúne sus recetas para San Valentín, explicadas paso a paso para que las prepares en casa.",
};

export const gift = {
  messages: [
    "Te regalo 14 días de dulce amor",
    "Para endulzar nuestro amor",
    "Horneemos juntos este San Valentín",
    "Porque eres mi receta favorita",
  ],
};

// The day-1 preview shows one of Pedro's real recipes before launch.
export const preview = {
  note: "Una de las recetas del calendario",
  recipe: "bizcocho-de-chocolate-sin-harina",
};

// ───────── Pedro's content (docs/Unread, 22 Nov) ─────────
// Videos stay on his YouTube channel and are watched from there. Recipes are copied from each video's
// description, which Pedro named as the source for the downloadables. TODO(Pedro): he will also send each
// recipe as a document; replace these when they arrive.
export const channel = { name: "Sabores y Secretos PR", url: "https://www.youtube.com/@saboresysecretospr4504" };

export type Recipe = {
  slug: string;
  title: string;
  category?: "dessert" | "beverage" | "meal" | "special";
  videos: { id: string; title: string }[];
  groups: { name?: string; items: string[] }[];
  steps?: string[];
  bake?: string[];
  notes?: string[];
};

export const recipes: Recipe[] = [
  {
    slug: "bizcocho-de-chocolate-sin-harina",
    title: "Bizcocho de chocolate sin harina",
    videos: [{ id: "aRsS3trRyn4", title: "Bizcocho de chocolate sin harina" }],
    groups: [{ items: ["1 taza de gotitas de chocolate semidulce (chocolate chips)", "2 barras de mantequilla", "1 taza de cocoa amarga para repostería", "1 ½ tazas de azúcar", "6 huevos grandes"] }],
    steps: [
      "Derrite las gotitas de chocolate con la mantequilla. Puedes hacerlo en baño de María o en el microondas durante un minuto o menos. Deja enfriar.",
      "En el envase de la batidora agrega la cocoa con el azúcar y mezcla ligeramente.",
      "Agrega entonces los huevos de uno en uno hasta que estén incorporados.",
      "Añade entonces la mezcla del chocolate con la mantequilla.",
      "Coloca la mezcla en un molde redondo de 8 x 3 pulgadas cubierto con papel encerado (wax) o papel de hornear.",
      "Hornea a 350 °F durante alrededor de 50 minutos aproximadamente.",
    ],
    notes: [
      "No hagas la prueba del palillo: no va a salir limpio, porque el bizcocho queda húmedo y chocolatoso.",
      "Está listo cuando el centro no se mueva al mover el molde.",
      "Ideal para polvorear una capa fina de azúcar en polvo. Agrégala con el cernidor al momento de esparcirla.",
      "Si usas moldes de 6 pulgadas, el tiempo de horneo es de 25 minutos aproximadamente.",
    ],
  },
  {
    slug: "galletas-de-fresa-y-gotitas-de-chocolate",
    title: "Galletas de fresa y gotitas de chocolate",
    videos: [{ id: "YK6ClZWz-8o", title: "Galletas de fresa y gotitas de chocolate semidulce" }],
    groups: [],
  },
  {
    slug: "mini-cheesecakes-de-chocolate",
    title: "Los mejores mini cheesecakes de chocolate",
    videos: [
      { id: "YE1RcmFqKHE", title: "Los mejores mini cheesecakes de chocolate, parte 1" },
      { id: "m9EkUKJQWDo", title: "Los mejores mini cheesecakes de chocolate, parte 2" },
    ],
    groups: [
      { name: "Crust", items: ["12 galletas Oreo de chocolate", "2 1/2 cdas. de mantequilla sin sal, derretida"] },
      { name: "Relleno", items: ["1/4 taza de heavy cream", "6 onzas de chocolate semidulce", "12 onzas de queso crema", "1/2 taza de azúcar granulada", "2 huevos grandes", "2 cdtas. de extracto de vainilla", "1 cda. de cocoa sin endulzar para repostería"] },
      { name: "Ganache", items: ["1/4 taza de heavy cream", "3 onzas de chocolate semidulce"] },
    ],
    bake: ["Hornea el crust a 350 °F durante 5 minutos. Deja refrescar.", "Hornea el crust con el relleno a 325 °F durante 20 a 25 minutos aproximadamente."],
  },
  {
    slug: "cupcakes-de-chocolate-y-guineo",
    title: "Cupcakes de chocolate y guineo",
    videos: [
      { id: "5cao0PVoI0U", title: "Cupcakes de chocolate y guineo" },
      { id: "cUZJk2Yl_V4", title: "Decorando cupcakes de chocolate y guineo" },
    ],
    groups: [{ items: ["1 2/3 tazas de harina preparada para bizcocho", "¼ taza de cocoa en polvo para hornear", "½ cdta. de bicarbonato de soda", "½ cdta. de canela en polvo", "¾ taza de chocolate semidulce", "1 ½ tazas de guineos maduros cortados en rueditas", "¾ taza de azúcar morena clara", "½ taza de aceite vegetal", "1/3 taza de crema agria (sour cream)", "2 huevos grandes", "2 cdtas. de extracto de vainilla"] }],
    bake: ["Hornea a 350 °F durante 20 a 22 minutos aproximadamente."],
  },
  {
    slug: "galletas-de-doble-chocolate",
    title: "Galletas de doble chocolate",
    videos: [{ id: "DUUpLyLFqJg", title: "Galletas de doble chocolate" }],
    groups: [],
  },
  {
    slug: "mantequilla-de-chocolate",
    title: "Mantequilla de chocolate",
    videos: [{ id: "iZ64emSEu9s", title: "Mantequilla de chocolate" }],
    groups: [
      { items: ["4 onzas (1/2 barra) de mantequilla sin sal", "1 cda. de cocoa en polvo para hornear", "1/2 cdta. de canela en polvo", "1/4 cdta. de extracto de vainilla", "1 cdta. de azúcar granulada", "1/4 cdta. de sal"] },
      { name: "Para servir", items: ["Fresas frescas lavadas y cortadas a gusto", "Galletas dulces de preferencia, tipo María o Graham", "Una tabla de madera para presentar, de preferencia"] },
    ],
  },
  {
    slug: "limonada-de-fresa",
    title: "Limonada de fresa",
    category: "beverage" as const,
    videos: [{ id: "hXNBNKUIKgg", title: "Limonada de fresa" }],
    groups: [],
  },
  {
    slug: "galletas-de-polvo-de-fresas",
    title: "Galletas de polvo de fresas",
    videos: [{ id: "ptVQYJN5_Kg", title: "Galletas de polvo de fresas" }],
    groups: [],
  },
  {
    slug: "bizcocho-de-chocolate-con-harina-swans-down",
    title: "Bizcocho de chocolate con harina Swans Down",
    videos: [{ id: "cYlcqX3dDLE", title: "Bizcocho de chocolate con harina Swans Down" }],
    groups: [],
  },
  {
    slug: "las-mejores-galletas-de-chocolate-chips",
    title: "Las mejores galletas de chocolate chips",
    videos: [{ id: "sN8SIfNnVWI", title: "Las mejores galletas de chocolate chips" }],
    groups: [],
  },
  {
    slug: "frosting-de-chocolate",
    title: "Frosting de chocolate",
    videos: [{ id: "fouVEZJOpI8", title: "Frosting de chocolate" }],
    groups: [],
  },
  {
    slug: "dip-cremoso-de-chocolate",
    title: "Dip cremoso de chocolate",
    videos: [
      { id: "_wHg43jILGQ", title: "Dip cremoso de chocolate, parte 1" },
      { id: "7Cv-96ipywE", title: "Dip cremoso de chocolate, parte 2" },
    ],
    groups: [],
  },
  {
    slug: "galletas-de-oreo-y-chocolate-chips",
    title: "Galletas de Oreo y chocolate chips",
    videos: [{ id: "tHfDnQQ4NJ0", title: "Galletas de Oreo y chocolate chips" }],
    groups: [],
  },
  {
    slug: "super-coquito-de-nutella",
    title: "Super coquito de Nutella",
    category: "beverage" as const,
    videos: [{ id: "KvAklBTkOPc", title: "Super coquito de Nutella" }],
    groups: [],
  },
];

// Day 14: beverage video + optional downloadable plan. The plan download is pending client confirmation.
export const day14Plan = {
  title: "Tu plan para el 14 de febrero",
  intro: "El cierre especial del calendario: una bebida para brindar en San Valentín.",
  steps: [
    "Prepárate un desayuno para que puedas comenzar bien el día.",
    "Ten listos tus pedidos de antemano. Solo deja para último momento colocar algunos pedidos en cajas, de ser necesario, y sus decoraciones.",
    "Date un baño, vístete y arréglate para entregar los pedidos.",
    "Ya en la tarde, descansa para cualquier evento o actividad que tengas en la noche.",
  ],
  // TODO(Pedro): confirm whether the downloadable plan also appears alongside the video on Day 14.
  hasDownload: false,
};
