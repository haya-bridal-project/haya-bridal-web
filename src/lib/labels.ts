import type { BookingStatus, PaymentStatus } from "@/lib/types";

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending_payment: "Awaiting Razorpay Payment",
  requested: "Order Received",
  confirmed: "Confirmed / Payment Received",
  rejected: "Declined",
  cancelled: "Order Cancelled",
  picked_up: "In Production / Tailoring",
  returned: "Shipped / In Transit",
  completed: "Delivered & Fulfilled",
  expired: "Payment Expired",
};

export const ORDER_STATUS_LABEL = BOOKING_STATUS_LABEL;

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  pending: "Pending",
  paid: "Paid via Razorpay",
  failed: "Payment Failed",
  refunded: "Refunded",
  partially_refunded: "Partially refunded",
};

export const AVAILABILITY_REASON: Record<string, string> = {
  too_soon: "Please select a valid date.",
  too_far: "Orders are not yet open for this date.",
  unavailable: "This item is currently sold out.",
  invalid_duration: "Invalid duration.",
  product_unavailable: "This item is no longer available in store.",
  invalid_size: "Please choose an available size.",
  invalid_color: "Please choose an available colour.",
  auth_required: "Please sign in to continue.",
};
