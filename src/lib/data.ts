import type { Research } from "./research";
export type Profile = {
  id: string;
  name: string;
  relation: string;
  initials: string;
  color: string;
  occasion: string;
  date: string;
  budget: number;
  notes: string;
  address?: string;
  birthday?: string;
  dislikes: string[];
  owned: string[];
  interests: string[];
};
export type Product = {
  photo: string;
  id: string;
  name: string;
  merchant: string;
  price: number;
  shipping: number;
  tags: string[];
  description: string;
  image: string;
  available: boolean;
  days: number;
};
export const profiles: Profile[] = [
  {
    id: "alex",
    name: "Alex Morgan",
    relation: "Best friend",
    initials: "AM",
    color: "#d8e3d4",
    occasion: "Birthday",
    date: "2026-11-08",
    budget: 6500,
    notes:
      "My best friend since university. Sunday mornings are for pour-over coffee and long walks. Loves specialty coffee, photography and thoughtful, useful objects. Recently mentioned wanting to try beans from different origins. Already has a coffee grinder and a camera. No alcohol.",
    dislikes: ["alcohol"],
    owned: ["grinder", "camera"],
    interests: ["Specialty coffee", "Photography", "The outdoors"],
  },
  {
    id: "sophie",
    name: "Sophie Chen",
    relation: "Girlfriend",
    initials: "SC",
    color: "#eed9d1",
    occasion: "Anniversary",
    date: "2026-11-14",
    budget: 12000,
    notes:
      "Our third anniversary. Sophie loves handmade ceramics, slow Sunday mornings, flowers and contemporary art. She said she would love to try a pottery class together. She prefers experiences and objects with a story. Sensitive to strong scents. Already owns a French press.",
    dislikes: ["fragrance", "perfume"],
    owned: ["French press"],
    interests: ["Ceramics", "Art & design", "Shared experiences"],
  },
];
export const merchants = [
  "Origin Studio",
  "Still & Form",
  "Field Notes",
  "Clay House",
];
export const catalog: Product[] = [
  {
    id: "coffee",
    photo: "/images/products/coffee.jpg",
    name: "The origin discovery set",
    merchant: "Origin Studio",
    price: 3200,
    shipping: 400,
    tags: ["coffee", "specialty", "beans", "origins"],
    description:
      "Three single-origin coffees, tasting cards, and a slower kind of Sunday.",
    image: "coffee",
    available: true,
    days: 3,
  },
  {
    id: "cups",
    photo: "/images/products/cups.jpg",
    name: "Two cups, made slowly",
    merchant: "Still & Form",
    price: 4800,
    shipping: 500,
    tags: ["ceramics", "coffee", "handmade", "art", "objects"],
    description:
      "A pair of hand-thrown stoneware cups. A little different, just like you two.",
    image: "cups",
    available: true,
    days: 4,
  },
  {
    id: "pottery",
    photo: "/images/products/pottery.jpg",
    name: "An afternoon at the wheel",
    merchant: "Clay House",
    price: 8800,
    shipping: 0,
    tags: ["pottery", "ceramics", "class", "together", "experiences", "art"],
    description:
      "A pottery workshop for two, with your finished pieces fired and glazed.",
    image: "pottery",
    available: true,
    days: 1,
  },
  {
    id: "journal",
    photo: "/images/products/journal.jpg",
    name: "Out of office, on paper",
    merchant: "Field Notes",
    price: 2400,
    shipping: 350,
    tags: ["outdoors", "walks", "photography", "useful", "travel"],
    description:
      "A linen-bound field journal for walks, little discoveries, and big ideas.",
    image: "journal",
    available: true,
    days: 3,
  },
  {
    id: "flowers",
    photo: "/images/products/flowers.jpg",
    name: "A season in stems",
    merchant: "Still & Form",
    price: 4200,
    shipping: 600,
    tags: ["flowers", "art", "design"],
    description: "A seasonal arrangement from an independent floral studio.",
    image: "flowers",
    available: true,
    days: 2,
  },
  {
    id: "grinder",
    photo: "/images/products/grinder.jpg",
    name: "Precision coffee grinder",
    merchant: "Origin Studio",
    price: 5900,
    shipping: 400,
    tags: ["coffee", "grinder"],
    description: "A compact hand grinder for freshly brewed mornings.",
    image: "coffee",
    available: true,
    days: 3,
  },
  {
    id: "candle",
    photo: "/images/products/candle.jpg",
    name: "Evening ritual candle",
    merchant: "Still & Form",
    price: 2800,
    shipping: 400,
    tags: ["fragrance", "perfume", "home"],
    description: "A richly scented candle in a ceramic vessel.",
    image: "cups",
    available: true,
    days: 3,
  },
  {
    id: "camera",
    photo: "/images/products/camera.jpg",
    name: "Pocket film camera",
    merchant: "Field Notes",
    price: 14500,
    shipping: 500,
    tags: ["photography", "camera"],
    description: "A compact film camera for everyday stories.",
    image: "journal",
    available: true,
    days: 4,
  },
];
export const money = (pence: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: pence % 100 ? 2 : 0,
  }).format(pence / 100);
export type Policy = {
  autoLimit: number;
  allowedMerchants: string[];
  autopilot: boolean;
};
export const defaultPolicy: Policy = {
  autoLimit: 5000,
  allowedMerchants: merchants,
  autopilot: true,
};
export type Trace = {
  title: string;
  detail: string;
  kind: "info" | "success" | "warning";
};
export type Recommendation = {
  sourceIds?: string[];
  productId: string;
  reason: string;
  evidence: string;
  score: number;
};
export type Payment = {
  provider: "mock" | "stripe";
  type?: "transfer" | "payment_intent";
  id?: string;
  status: "succeeded" | "processing" | "failed";
  balanceBefore?: number;
  balanceAfter?: number;
  destination?: string;
  error?: string;
};
export type AgentStage =
  | "profile"
  | "memory"
  | "research"
  | "shortlist"
  | "policy"
  | "payment"
  | "complete";
export type ProgressEvent = Trace & { stage: AgentStage };
export type Receipt = {
  payment?: Payment;
  approvedAt?: string;
  preferences?: { dislikes: string[]; owned: string[] };
  sourceUrls?: string[];
  id: string;
  profileId: string;
  name: string;
  productId: string;
  total: number;
  reason: string;
  evidence: string;
  rules: string[];
  at: string;
  status: "paid" | "pending" | "declined" | "processing" | "failed";
  policy: Policy;
  budget: number;
  date: string;
};
export type Wallet = {
  balance: number;
  receipts: Receipt[];
  runs: number;
  paymentProvider?: "mock" | "stripe";
  stripeBalance?: number;
  stripeConfigured?: boolean;
};
export type AgentResult = {
  research?: Research;
  summary: string;
  interests: { name: string; evidence: string; inferred: boolean }[];
  recommendations: Recommendation[];
  trace: Trace[];
  receipt?: Receipt;
};
