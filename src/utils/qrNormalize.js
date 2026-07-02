// QR / SN normalizer utk customer-app (customer + sales portal).
//
// Dipakai sebelum lookup SN di /sell/check + duplicate-check di cart, supaya
// user boleh paste URL provider (mis. Telkomsel Kartu Perdana / Voucher) di
// input scan. Server yg extract SN "cantik" via categories.qr_pattern.
//
// Usage:
//   import { qrExtract, qrStrip } from "../utils/qrNormalize";
//   const sn = await qrExtract(api,      "customer", rawInput);
//   const sn = await qrExtract(salesApi, "sales",    rawInput);

export function qrStrip(raw) {
  return String(raw == null ? "" : raw).replace(/\s+/g, "");
}

// portal: "customer" | "sales" — menentukan endpoint yg dipakai. Perlu
// eksplisit karena kedua axios instance sharing baseURL, cuma beda token.
export async function qrExtract(apiClient, portal, raw) {
  const s = qrStrip(raw);
  if (!s) return "";
  // Skip round-trip kalau bukan URL — server pun akan return as-is.
  if (s.indexOf("://") < 0) return s;
  const url = portal === "sales" ? "/sales/extract-sn" : "/customer/extract-sn";
  try {
    const { data } = await apiClient.post(url, { qr: s });
    return data && data.ok && data.sn ? String(data.sn) : s;
  } catch (e) {
    return s;
  }
}
