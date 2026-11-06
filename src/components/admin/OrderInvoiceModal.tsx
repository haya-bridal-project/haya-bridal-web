"use client";

import { useEffect, useRef } from "react";
import { Printer, X } from "lucide-react";
import { formatINR } from "@/lib/money";
import { formatDate } from "@/lib/dates";

interface OrderInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: any[];
  siteSettings?: any;
}

function numberToWordsINR(paise: number): string {
  const rupees = Math.trunc(paise / 100);
  if (rupees === 0) return "Rupees Zero Only";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertTwoDigits(num: number): string {
    if (num === 0) return "";
    if (num < 20) return a[num];
    const tens = b[Math.floor(num / 10)];
    const ones = a[num % 10];
    return tens + (ones ? " " + ones : "");
  }

  function convertThreeDigits(num: number): string {
    const hundreds = Math.floor(num / 100);
    const rest = num % 100;
    let res = "";
    if (hundreds > 0) res += a[hundreds] + " Hundred";
    if (rest > 0) res += (res ? " " : "") + convertTwoDigits(rest);
    return res;
  }

  let n = rupees;
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundredAndRest = n;

  let words = "";
  if (crore > 0) words += convertTwoDigits(crore) + " Crore ";
  if (lakh > 0) words += convertTwoDigits(lakh) + " Lakh ";
  if (thousand > 0) words += convertTwoDigits(thousand) + " Thousand ";
  if (hundredAndRest > 0) words += convertThreeDigits(hundredAndRest) + " ";

  return `Rupees ${words.trim()} Only`;
}

export function OrderInvoiceModal({ isOpen, onClose, orders, siteSettings }: OrderInvoiceModalProps) {
  const printContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || orders.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  const companyName = siteSettings?.brand?.site_name || "Haya";
  const tagline = siteSettings?.brand?.tagline || "Bridal Couture & Fine Ornaments";
  const companyAddress = siteSettings?.contact?.address || "Luxury Couture Atelier & Boutique Studio, Kerala, India";
  const companyPhone = siteSettings?.contact?.phone || siteSettings?.contact?.whatsapp || "+91 9995204495";
  const companyEmail = siteSettings?.contact?.email || "contact@hayabridal.com";

  const getCustomization = (b: any) => {
    if (b.customization && typeof b.customization === "object" && Object.keys(b.customization).length > 0) {
      return b.customization;
    }
    if (typeof b.notes === "string" && b.notes.includes("Custom Sizing")) {
      const match = b.notes.match(/Bust\s*([\d.]+)"?,\s*Waist\s*([\d.]+)"?,\s*Hips\s*([\d.]+)"?/i);
      if (match) {
        return {
          custom_type: "custom_fit",
          bust_inches: match[1],
          waist_inches: match[2],
          hips_inches: match[3],
        };
      }
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible">
      
      {/* Print Specific CSS to Isolate Only the Invoices during window.print() */}
      <style jsx global>{`
        @media print {
          /* Hide everything in the DOM */
          body * {
            visibility: hidden !important;
          }
          /* Show ONLY the printable invoice sheets */
          #print-invoice-wrapper,
          #print-invoice-wrapper * {
            visibility: visible !important;
          }
          #print-invoice-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          .invoice-page-break {
            page-break-after: always !important;
            break-after: page !important;
            min-height: 100vh !important;
            margin: 0 !important;
            padding: 24px 32px !important;
            box-shadow: none !important;
            border: none !important;
          }
          .invoice-page-break:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal Container */}
      <div className="relative bg-white rounded-md shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden border border-[#E8DDD1] print:max-w-none print:max-h-none print:border-none print:shadow-none print:rounded-none">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="no-print bg-[#FAF6F0] border-b border-[#E8DDD1] px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-sans font-semibold uppercase tracking-widest text-[#B06F5E]">
                Official Invoice
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-[#E8DDD1] font-mono text-[#7A6A5F]">
                {orders.length} {orders.length === 1 ? "Invoice" : "Invoices"}
              </span>
            </div>
            <h2 className="font-serif text-xl text-[#2B211C] font-normal mt-0.5">
              {orders.length === 1 ? `Tax Invoice — ${orders[0].reference}` : `Batch Invoice Print (${orders.length} Orders)`}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B06F5E] hover:bg-[#975D4E] text-white rounded-sm text-xs font-medium tracking-wide shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#7A6A5F] hover:text-[#2B211C] hover:bg-[#E8DDD1]/50 rounded-sm transition-colors"
              aria-label="Close invoice"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Invoice Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#F4ECE1]/40 print:p-0 print:bg-white">
          <div id="print-invoice-wrapper" ref={printContainerRef} className="space-y-8 print:space-y-0">
            {orders.map((order, idx) => {
              const isPaid = order.payment_status === "paid" || order.payments?.some((p: any) => p.status === "captured");
              const isFailed = !isPaid && order.payment_status === "failed";
              const latestPayment = order.payments?.[0];
              const custom = getCustomization(order);
              const invoiceNumber = `INV-${order.reference}`;
              const invoiceDate = formatDate(order.created_at);
              const transactionId = latestPayment?.razorpay_payment_id || order.reference;

              return (
                <div
                  key={order.id || idx}
                  className="invoice-page-break bg-white border border-[#E8DDD1] shadow-sm rounded-sm p-8 sm:p-10 max-w-3xl mx-auto print:max-w-none print:border-none print:shadow-none text-[#2B211C] text-xs font-sans relative"
                >
                  {/* 1. Header: Boutique Details From Site Settings & Invoice Metas */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b-2 border-[#2B211C] gap-6">
                    {/* Company Identity */}
                    <div>
                      <h1 className="font-serif text-3xl font-normal text-[#2B211C] tracking-wide uppercase">
                        {companyName}
                      </h1>
                      <p className="text-[11px] font-sans uppercase tracking-[0.2em] text-[#B06F5E] font-medium mt-0.5">
                        {tagline}
                      </p>
                      <div className="text-[11px] text-[#7A6A5F] mt-2 space-y-0.5 leading-relaxed">
                        <p className="whitespace-pre-line">{companyAddress}</p>
                        <p>Kerala, India &bull; GST Registered (0% GST)</p>
                        {companyPhone && <p>Phone / WhatsApp: {companyPhone}</p>}
                        {companyEmail && <p>Email: {companyEmail}</p>}
                        <p>Official Website: www.hayabridal.com</p>
                      </div>
                    </div>

                    {/* Invoice Badge & Numbers */}
                    <div className="sm:text-right space-y-1.5 shrink-0">
                      <span className="inline-block px-3 py-1 bg-[#FAF6F0] border border-[#E8DDD1] text-[10px] font-mono font-semibold uppercase tracking-wider text-[#B06F5E]">
                        Tax Invoice / Bill of Supply
                      </span>
                      <div className="pt-1">
                        <span className="text-[10px] uppercase text-[#7A6A5F] block">Invoice No:</span>
                        <strong className="font-mono text-sm text-[#2B211C] block">{invoiceNumber}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-[#7A6A5F] block">Invoice Date:</span>
                        <span className="text-xs text-[#2B211C]">{invoiceDate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-[#7A6A5F] block">Order Reference:</span>
                        <span className="font-mono font-semibold text-[#B06F5E] text-xs">{order.reference}</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Customer & Shipping Destination (2 Columns) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-[#E8DDD1] text-xs">
                    {/* Billed To */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-[#7A6A5F] block">
                        Billed To (Customer):
                      </span>
                      <p className="font-semibold text-sm text-[#2B211C]">{order.customer_name}</p>
                      <p className="text-[#7A6A5F] font-mono">{order.customer_phone}</p>
                      {order.customer_email && (
                        <p className="text-[#7A6A5F]">{order.customer_email}</p>
                      )}
                    </div>

                    {/* Ship To Destination */}
                    <div className="space-y-1 sm:border-l sm:border-[#E8DDD1] sm:pl-6">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-[#7A6A5F] block">
                        Ship To (Delivery Address):
                      </span>
                      <p className="text-[#2B211C] leading-relaxed whitespace-pre-line">
                        {order.customer_address || "Standard Boutique Delivery"}
                      </p>
                      <p className="text-[10px] text-[#7A6A5F] pt-1">
                        Delivery Method: <strong className="text-[#2B211C]">Insured Express Courier</strong>
                      </p>
                    </div>
                  </div>

                  {/* 3. Itemized Table of Goods */}
                  <div className="py-6 border-b border-[#E8DDD1]">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#2B211C] text-[10px] uppercase font-semibold text-[#7A6A5F] tracking-wider">
                          <th className="py-2.5 w-10 text-center">#</th>
                          <th className="py-2.5">Item Description</th>
                          <th className="py-2.5">Specifications</th>
                          <th className="py-2.5 w-16 text-center">Qty</th>
                          <th className="py-2.5 w-24 text-right">Unit Price</th>
                          <th className="py-2.5 w-28 text-right">Total (INR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8DDD1]/80">
                        <tr>
                          <td className="py-3 text-center text-[#7A6A5F] font-mono">1</td>
                          <td className="py-3">
                            <strong className="font-serif text-sm block text-[#2B211C]">
                              {order.product_name}
                            </strong>
                            <span className="text-[10px] text-[#7A6A5F] uppercase tracking-wide">
                              Category: {order.order_type === "ornament" || order.order_type === "ornaments" ? "Fine Ornament" : "Bridal Couture"}
                            </span>
                          </td>
                          <td className="py-3 text-[#5A4C42]">
                            <p>Fit / Size: <strong className="text-[#2B211C]">{order.size || "Standard Free Size"}</strong></p>
                            {order.color && <p>Color: <span className="text-[#2B211C]">{order.color}</span></p>}
                          </td>
                          <td className="py-3 text-center font-mono">1</td>
                          <td className="py-3 text-right font-mono">
                            {formatINR(order.rental_amount_paise || (order.total_paise - (order.fees_paise || 0)))}
                          </td>
                          <td className="py-3 text-right font-mono font-semibold text-[#2B211C]">
                            {formatINR(order.rental_amount_paise || (order.total_paise - (order.fees_paise || 0)))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 4. Bespoke Custom Measurements (If Dress) */}
                  {custom && (
                    <div className="my-5 p-3.5 bg-[#FAF6F0] border border-[#E8DDD1] rounded-xs space-y-1.5">
                      <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#B06F5E] block">
                        Bespoke Tailoring Dimensions:
                      </span>
                      <div className="grid grid-cols-5 gap-2 text-center text-[11px] font-mono">
                        <div className="bg-white p-1 rounded-xs border border-[#E8DDD1]">
                          <span className="text-[9px] uppercase text-[#7A6A5F] block">Bust</span>
                          <strong>{custom.bust_inches || "—"}&quot;</strong>
                        </div>
                        <div className="bg-white p-1 rounded-xs border border-[#E8DDD1]">
                          <span className="text-[9px] uppercase text-[#7A6A5F] block">Waist</span>
                          <strong>{custom.waist_inches || "—"}&quot;</strong>
                        </div>
                        <div className="bg-white p-1 rounded-xs border border-[#E8DDD1]">
                          <span className="text-[9px] uppercase text-[#7A6A5F] block">Hips</span>
                          <strong>{custom.hips_inches || "—"}&quot;</strong>
                        </div>
                        <div className="bg-white p-1 rounded-xs border border-[#E8DDD1]">
                          <span className="text-[9px] uppercase text-[#7A6A5F] block">Shoulder</span>
                          <strong>{custom.shoulder_inches || "—"}&quot;</strong>
                        </div>
                        <div className="bg-white p-1 rounded-xs border border-[#E8DDD1]">
                          <span className="text-[9px] uppercase text-[#7A6A5F] block">Length</span>
                          <strong>{custom.length_inches || "—"}&quot;</strong>
                        </div>
                      </div>
                      {custom.custom_notes && (
                        <p className="text-[10px] text-[#7A6A5F] pt-1 italic">
                          Tailoring note: {custom.custom_notes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 5. Pricing Breakdown & Simple Payment Summary (No Gateway Brands) */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 py-6 border-b border-[#E8DDD1]">
                    {/* Payment Audit Record (Clean & Simple) */}
                    <div className="sm:col-span-7 space-y-2.5">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-[#7A6A5F] block">
                        Payment &amp; Settlement Details:
                      </span>
                      <div className="bg-[#FAF6F0] p-3.5 rounded-xs border border-[#E8DDD1] space-y-2 text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="text-[#7A6A5F]">Payment Mode:</span>
                          <span className="font-semibold text-[#2B211C]">Prepaid Online Payment</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#7A6A5F]">Payment Status:</span>
                          <span className="font-semibold uppercase tracking-wider">
                            {isPaid ? (
                              <span className="text-emerald-700 font-mono">PAID (CONFIRMED)</span>
                            ) : isFailed ? (
                              <span className="text-red-700 font-mono">FAILED</span>
                            ) : (
                              <span className="text-amber-800 font-mono">AWAITING PAYMENT</span>
                            )}
                          </span>
                        </div>
                        {transactionId && (
                          <div className="flex justify-between items-center font-mono text-[10px]">
                            <span className="text-[#7A6A5F]">Transaction Reference:</span>
                            <span className="text-[#2B211C] font-semibold">{transactionId}</span>
                          </div>
                        )}
                        {latestPayment?.method && (
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-[#7A6A5F]">Payment Method:</span>
                            <span className="capitalize text-[#2B211C]">{latestPayment.method}</span>
                          </div>
                        )}
                      </div>

                      {/* Amount in words */}
                      <div className="pt-1">
                        <span className="text-[10px] uppercase text-[#7A6A5F] block">Amount in Words:</span>
                        <p className="font-serif italic text-xs text-[#2B211C] mt-0.5">
                          {numberToWordsINR(order.total_paise)}
                        </p>
                      </div>
                    </div>

                    {/* Price Calculation (Right 5 Cols) */}
                    <div className="sm:col-span-5 space-y-2 text-xs">
                      <div className="flex justify-between text-[#7A6A5F]">
                        <span>Subtotal (Item):</span>
                        <span className="font-mono text-[#2B211C]">
                          {formatINR(order.rental_amount_paise || (order.total_paise - (order.fees_paise || 0)))}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#7A6A5F]">
                        <span>Insured Express Shipping:</span>
                        <span className="font-mono text-[#2B211C]">
                          {formatINR(order.fees_paise || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#7A6A5F]">
                        <span>Taxes &amp; GST:</span>
                        <span className="font-mono text-emerald-700">₹0 (Zero GST)</span>
                      </div>
                      <div className="flex justify-between items-baseline pt-2 border-t-2 border-[#2B211C] text-sm">
                        <strong className="text-[#2B211C] uppercase tracking-wide">Total Payable:</strong>
                        <strong className="font-serif text-lg text-[#B06F5E] font-normal">
                          {formatINR(order.total_paise)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* 6. Footer & Legal Declarations */}
                  <div className="pt-6 grid grid-cols-1 sm:grid-cols-12 gap-6 items-end text-[10px] text-[#7A6A5F]">
                    <div className="sm:col-span-8 space-y-1">
                      <p className="font-semibold uppercase text-[#2B211C]">Declaration &amp; Terms:</p>
                      <p className="leading-relaxed">
                        This is a computer-generated tax invoice issued by {companyName}. All bridal ensembles and fine ornaments undergo multi-tier quality checks and insured dispatch.
                      </p>
                      {companyPhone && <p>For alterations, styling consultations, or courier inquiries, contact: {companyPhone}.</p>}
                    </div>

                    <div className="sm:col-span-4 text-center sm:text-right space-y-1">
                      <div className="h-10 border-b border-[#2B211C]/30 w-36 ml-auto" />
                      <span className="block font-serif text-[11px] text-[#2B211C] uppercase tracking-wider font-semibold">
                        {companyName}
                      </span>
                      <span className="block text-[9px] uppercase tracking-widest text-[#7A6A5F]">
                        Authorized Signatory
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Bar (No-print) */}
        <div className="no-print bg-[#FAF6F0] border-t border-[#E8DDD1] px-6 py-3 flex items-center justify-between text-xs text-[#7A6A5F]">
          <span>Tip: In the print dialog, select &quot;Save as PDF&quot; to export electronic invoice files.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-[#E8DDD1] hover:bg-[#FAF6F0] text-[#2B211C] rounded-sm"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
