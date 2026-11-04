/**
 * Customer profile helpers.
 *
 * A logged-in customer's name, phone and saved delivery address live in
 * their own Supabase auth `user_metadata`, so no extra table is needed.
 */
export type SavedAddress = {
  line1: string;
  city: string;
  state: string;
  pincode: string;
};

export type CustomerPrefill = {
  isLoggedIn: boolean;
  name: string;
  email: string;
  phone: string;
  address: SavedAddress;
};

const EMPTY_ADDRESS: SavedAddress = { line1: "", city: "", state: "", pincode: "" };

type MetaUser = { email?: string | null; user_metadata?: Record<string, unknown> | null } | null | undefined;

export function getCustomerPrefill(user: MetaUser): CustomerPrefill {
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const addr = (meta.address ?? {}) as Partial<SavedAddress>;
  return {
    isLoggedIn: !!user,
    name: typeof meta.full_name === "string" ? meta.full_name : "",
    email: user?.email ?? "",
    phone: typeof meta.phone === "string" ? meta.phone : "",
    address: {
      line1: addr.line1 ?? EMPTY_ADDRESS.line1,
      city: addr.city ?? EMPTY_ADDRESS.city,
      state: addr.state ?? EMPTY_ADDRESS.state,
      pincode: addr.pincode ?? EMPTY_ADDRESS.pincode,
    },
  };
}

