export const rupiah = (n) =>
  "Rp " + Number(n || 0).toLocaleString("id-ID");

export const imgSrc = (product) =>
  product?.imageBase64
    ? `data:${product.imageContentType || "image/png"};base64,${product.imageBase64}`
    : "";
