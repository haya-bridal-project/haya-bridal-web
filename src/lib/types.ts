export type Color = { name: string; hex: string };

export type Collection = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  image_url: string | null;
  image_public_id: string | null;
  image_alt: string | null;
  is_published: boolean;
  show_on_home: boolean;
  is_featured: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  public_id: string;
  alt: string | null;
  color_name: string | null;
  sort_order: number;
  is_primary: boolean;
  width: number | null;
  height: number | null;
};

export type RentalOption = {
  id: string;
  product_id: string;
  duration_days: number;
  price_paise: number;
  sort_order: number;
};

export type SizeGuide = {
  id: string;
  name: string;
  notes: string | null;
  columns: string[];
  rows: string[][];
};

export type Product = {
  id: string;
  collection_id: string | null;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  rental_price_paise: number;
  compare_at_price_paise: number | null;
  rental_duration_days: number;
  deposit_paise: number;
  quantity: number;
  buffer_days: number | null;
  colors: Color[];
  sizes: string[];
  size_guide_id: string | null;
  care_instructions: string | null;
  rental_conditions: string | null;
  is_published: boolean;
  is_featured: boolean;
  is_archived: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductWithImages = Product & {
  product_images: ProductImage[];
  collection?: Pick<Collection, "id" | "name" | "slug"> | null;
};

export type HeroSlide = {
  id: string;
  eyebrow: string | null;
  heading: string;
  body: string | null;
  cta_label: string | null;
  cta_href: string | null;
  side_text: string | null;
  image_url: string | null;
  image_public_id: string | null;
  image_alt: string | null;
  mobile_image_url: string | null;
  mobile_image_public_id: string | null;
  is_published: boolean;
  sort_order: number;
};

export type PromoBanner = {
  id: string;
  title: string;
  body: string | null;
  cta_label: string | null;
  cta_href: string | null;
  image_url: string | null;
  image_public_id: string | null;
  image_alt: string | null;
  is_published: boolean;
  sort_order: number;
};

export type BookingStatus =
  | "pending_payment"
  | "requested"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "picked_up"
  | "returned"
  | "completed"
  | "expired";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded" | "partially_refunded";

export type Booking = {
  id: string;
  reference: string;
  customer_id: string | null;
  product_id: string;
  product_name: string;
  size: string | null;
  color: string | null;
  start_date: string;
  end_date: string;
  duration_days: number;
  buffer_days: number;
  rental_amount_paise: number;
  deposit_paise: number;
  fees_paise: number;
  discount_paise: number;
  total_paise: number;
  currency: string;
  workflow: "payment" | "request";
  status: BookingStatus;
  payment_status: PaymentStatus;
  hold_expires_at: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string | null;
  event_date: string | null;
  notes: string | null;
  admin_notes: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  picked_up_at: string | null;
  returned_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  booking_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount_paise: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "failed" | "refunded" | "partially_refunded";
  method: string | null;
  verified_at: string | null;
  refund_id: string | null;
  refund_status: string | null;
  refund_amount_paise: number | null;
  error_code: string | null;
  error_description: string | null;
  created_at: string;
};

export type BookingRules = {
  workflow: "payment" | "request";
  hold_minutes: number;
  request_hold_hours: number;
  buffer_days: number;
  min_lead_days: number;
  max_advance_days: number;
  fees_paise: number;
};

export type BrandSettings = {
  site_name: string;
  tagline: string | null;
  logo_url: string | null;
  logo_public_id: string | null;
  logo_light_url: string | null;
  logo_light_public_id: string | null;
};

export type ContactSettings = {
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  hours: string | null;
  map_url: string | null;
};

export type SocialSettings = {
  instagram: string | null;
  facebook: string | null;
  pinterest: string | null;
  youtube: string | null;
};

export type HomeSettings = {
  highlights: string[];
  show_collection_cards: boolean;
  show_featured_collections: boolean;
  show_featured_products: boolean;
  featured_heading: string;
  products_heading: string;
};

export type SiteSettings = {
  brand: BrandSettings;
  contact: ContactSettings;
  social: SocialSettings;
  home: HomeSettings;
  booking: BookingRules;
  product_services: { items: string[] };
  email: { admin_notification_email: string | null };
};

export type ContentPage = {
  slug: string;
  title: string;
  body: string;
  is_published: boolean;
  seo_description: string | null;
  updated_at: string;
};
