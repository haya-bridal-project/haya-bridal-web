import type { BookingStatus, PaymentStatus } from "@/lib/types";

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending_payment: "Awaiting payment",
  requested: "Request received",
  confirmed: "Confirmed",
  rejected: "Not accepted",
  cancelled: "Cancelled",
  picked_up: "Picked up",
  returned: "Returned",
  completed: "Completed",
  expired: "Expired",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
  partially_refunded: "Partially refunded",
};

export const AVAILABILITY_REASON: Record<string, string> = {
  too_soon: "This date is too soon. Please choose a later start date.",
  too_far: "Bookings are not yet open for this date.",
  unavailable: "This outfit is not available for the selected dates.",
  invalid_duration: "Please choose a valid rental duration.",
  product_unavailable: "This outfit is no longer available for booking.",
  invalid_size: "Please choose an available size.",
  invalid_color: "Please choose an available colour.",
  auth_required: "Please sign in to continue.",
};
