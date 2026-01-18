
export async function getProperties() {
  const res = await fetch(
    "https://opensheet.elk.sh/1ZCvoWPNJ4OXgmChHk-x2YjEGIQ-EYCcsD86ZIVFj7lE/properties"
  );

  if (!res.ok) {
    throw new Error("Failed to fetch properties");
  }

  const data = await res.json();

  return data.map(normalizeProperty);
}

function normalizeProperty(p: any) {
  return {
    ...p,
    total_price_cr: Number(p.total_price_cr),
    monthly_rent_lakhs: Number(p.monthly_rent_lakhs),
    featured: p.featured === "TRUE",
    is_rental_income: p.is_rental_income === "TRUE",
  };
}


// export function paginate(items, pageSize) {
//   const pages = [];
//   for (let i = 0; i < items.length; i += pageSize) {
//     pages.push(items.slice(i, i + pageSize));
//   }
//   return pages;
// }
