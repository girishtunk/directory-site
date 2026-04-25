
const SHEET_URL =
  "https://opensheet.elk.sh/116uboS9fT9qsnltyVg8gyaF3mPke7ODvRw_CoRncZXg/properties";

const MIDDLE_FIELDS = [
  "block_tower",
  "corner_unit",
  "view",
  "built_up_area_sft",
  "plot_area_sqyd",
  "super_built_up_sft",
  "price_per_sft",
  "total_price_cr",
  "price_negotiable",
  "includes_registration",
  "gst_applicable",
  "payment_terms",
] as const;

const TAIL_FIELDS = [
  "project_name",
  "developer",
  "land_area_acres",
  "total_towers",
  "amenities",
  "possession_status",
  "rera_number",
  "bhk",
  "bathrooms",
  "parking_slots",
  "has_lift",
  "servant_room",
  "theatre_room",
  "agent_name",
  "phone",
  "company",
  "rera_verified",
  "agents_allowed",
  "short_description",
  "full_description",
  "seo_title",
  "seo_description",
  "keywords",
  "cover_image",
  "gallery_images",
  "brochure_link",
  "created_at",
] as const;

type MiddleField = (typeof MIDDLE_FIELDS)[number];
type TailField = (typeof TAIL_FIELDS)[number];

export async function getProperties() {
  const res = await fetch(SHEET_URL);

  if (!res.ok) {
    throw new Error("Failed to fetch properties");
  }

  const data = await res.json();

  return data.map(normalizeProperty);
}

function normalizeProperty(raw: Record<string, any>) {
  const middleRepaired = repairSegment(raw, MIDDLE_FIELDS, compatibilityCost);
  const tailRepaired = repairSegment(middleRepaired, TAIL_FIELDS, compatibilityCost);
  const repaired = normalizeImageFields(tailRepaired);
  const coverImage = pickImage(repaired.cover_image);
  const galleryImages = splitImages(repaired.gallery_images);

  return {
    ...repaired,
    total_price_cr: toOptionalNumber(repaired.total_price_cr),
    monthly_rent_lakhs: toNumber(repaired.monthly_rent_lakhs),
    featured: toBoolean(repaired.featured),
    is_rental_income: toBoolean(repaired.is_rental_income),
    has_lift: toBoolean(repaired.has_lift),
    servant_room: toBoolean(repaired.servant_room),
    theatre_room: toBoolean(repaired.theatre_room),
    rera_verified: toBoolean(repaired.rera_verified),
    agents_allowed: toBoolean(repaired.agents_allowed),
    phone: pickPhone(repaired.phone),
    cover_image: coverImage,
    gallery_images: galleryImages.join(","),
    short_description:
      cleanText(repaired.short_description) ||
      cleanText(repaired.full_description) ||
      cleanText(repaired.title),
    full_description:
      cleanText(repaired.full_description) || cleanText(repaired.short_description),
  };
}

function repairSegment<TField extends string>(
  raw: Record<string, any>,
  fields: readonly TField[],
  scorer: (field: TField, value: string) => number
) {
  const originalScore = scoreFields(raw, fields, scorer);
  const values = fields.map((field) => cleanText(raw[field]));

  if (fields === TAIL_FIELDS && cleanText(raw.undefined)) {
    values.push(cleanText(raw.undefined));
  }

  const repairedValues = alignFields(values, fields, scorer);
  const repaired = { ...raw };

  fields.forEach((field, index) => {
    repaired[field] = repairedValues[index];
  });

  if (fields === TAIL_FIELDS) {
    delete repaired.undefined;
  }

  return scoreFields(repaired, fields, scorer) < originalScore ? repaired : raw;
}

function alignFields<TField extends string>(
  values: string[],
  fields: readonly TField[],
  scorer: (field: TField, value: string) => number
) {
  const memo = new Map<string, { cost: number; values: string[] }>();

  function solve(valueIndex: number, fieldIndex: number): { cost: number; values: string[] } {
    const key = `${valueIndex}:${fieldIndex}`;
    const cached = memo.get(key);

    if (cached) {
      return cached;
    }

    if (fieldIndex === fields.length) {
      const cost = values
        .slice(valueIndex)
        .filter(Boolean)
        .reduce((sum) => sum + 6, 0);

      const result = { cost, values: [] };
      memo.set(key, result);
      return result;
    }

    let best = solve(valueIndex, fieldIndex + 1);
    best = { cost: best.cost + 2, values: ["", ...best.values] };

    if (valueIndex < values.length) {
      const assigned = solve(valueIndex + 1, fieldIndex + 1);
      const field = fields[fieldIndex];
      const value = values[valueIndex];
      const assignedCandidate = {
        cost: assigned.cost + scorer(field, value),
        values: [value, ...assigned.values],
      };

      if (assignedCandidate.cost <= best.cost) {
        best = assignedCandidate;
      }

      const dropped = solve(valueIndex + 1, fieldIndex);
      const dropPenalty = value ? 6 : 0;
      if (dropped.cost + dropPenalty < best.cost) {
        best = { cost: dropped.cost + dropPenalty, values: dropped.values };
      }
    }

    memo.set(key, best);
    return best;
  }

  return solve(0, 0).values;
}

function scoreTail(property: Record<string, any>) {
  return scoreFields(property, TAIL_FIELDS, compatibilityCost);
}

function scoreFields<TField extends string>(
  property: Record<string, any>,
  fields: readonly TField[],
  scorer: (field: TField, value: string) => number
) {
  return fields.reduce((sum, field) => {
    return sum + scorer(field, cleanText(property[field]));
  }, 0);
}

function compatibilityCost(field: MiddleField | TailField, value: string) {
  if (!value) {
    return 1;
  }

  switch (field) {
    case "corner_unit":
    case "land_area_acres":
      return isNumberish(value) ? 0 : 6;
    case "built_up_area_sft":
    case "plot_area_sqyd":
    case "super_built_up_sft":
    case "price_per_sft":
    case "total_price_cr":
    case "bhk":
    case "bathrooms":
    case "parking_slots":
      return isNumberish(value) ? 0 : 6;
    case "price_negotiable":
    case "includes_registration":
    case "gst_applicable":
    case "has_lift":
    case "servant_room":
    case "theatre_room":
    case "rera_verified":
    case "agents_allowed":
      return isBooleanString(value) ? 0 : 8;
    case "phone":
      return isPhone(value) ? 0 : 10;
    case "created_at":
      return isDateLike(value) ? 0 : 8;
    case "cover_image":
      return looksLikeImage(value) ? 0 : 7;
    case "gallery_images":
      return looksLikeImageList(value) ? 0 : 7;
    case "brochure_link":
      return looksLikeLink(value) ? 0 : 5;
    case "rera_number":
      return looksLikeRera(value) ? 0 : 8;
    case "possession_status":
      return looksLikePossessionStatus(value) ? 0 : 4;
    case "agent_name":
      return looksLikeName(value) ? 0 : 7;
    case "company":
      return looksLikeCompany(value) ? 0 : 6;
    case "block_tower":
    case "total_towers":
      return looksLikeTowerCount(value) ? 0 : 4;
    case "view":
    case "payment_terms":
    case "project_name":
    case "developer":
    case "amenities":
    case "short_description":
    case "full_description":
    case "seo_title":
    case "seo_description":
    case "keywords":
      return looksLikeText(value) ? 0 : 5;
  }
}

function toNumber(value: unknown) {
  const parsed = Number.parseFloat(cleanText(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function toOptionalNumber(value: unknown) {
  const parsed = Number.parseFloat(cleanText(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function toBoolean(value: unknown) {
  return cleanText(value).toUpperCase() === "TRUE";
}

function pickPhone(value: unknown) {
  const text = cleanText(value);
  return isPhone(text) ? text.replace(/\D/g, "") : "";
}

function pickImage(value: unknown) {
  const text = cleanText(value);
  return looksLikeImage(text) ? text : "";
}

function normalizeImageFields(property: Record<string, any>) {
  const coverImage = cleanText(property.cover_image);
  const keywords = cleanText(property.keywords);
  const galleryImages = cleanText(property.gallery_images);

  if (!pickImage(coverImage) && looksLikeImage(keywords) && looksLikeImageList(coverImage)) {
    return {
      ...property,
      keywords: "",
      cover_image: keywords,
      gallery_images: coverImage || galleryImages,
    };
  }

  return property;
}

function splitImages(value: unknown) {
  return cleanText(value)
    .split(",")
    .map((part) => part.trim())
    .filter((part) => looksLikeImage(part));
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isBooleanString(value: string) {
  return value === "TRUE" || value === "FALSE";
}

function isNumberish(value: string) {
  return /^\d+(\.\d+)?$/.test(value);
}

function isPhone(value: string) {
  return /^\+?[\d\s-]{10,}$/.test(value);
}

function isDateLike(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isNaN(Date.parse(value));
}

function looksLikeImage(value: string) {
  return /^(https?:\/\/[^\s,]+|[^\s,]+\.(?:png|jpe?g|webp|gif|svg))$/i.test(value);
}

function looksLikeImageList(value: string) {
  return value.split(",").every((part) => !part.trim() || looksLikeImage(part.trim()));
}

function looksLikeLink(value: string) {
  return /^(https?:\/\/[^\s,]+|[^\s,]+\.(?:pdf|png|jpe?g|webp|gif|svg))$/i.test(value);
}

function looksLikeRera(value: string) {
  return /^(?:[A-Z]\d{6,}|[A-Z]\d{3,}[A-Z0-9-]*|[A-Z0-9-]{8,})$/i.test(value);
}

function looksLikePossessionStatus(value: string) {
  return /(ready|under|move|possession|construction|completed)/i.test(value);
}

function looksLikeName(value: string) {
  return /^[A-Za-z][A-Za-z .'-]{2,}$/.test(value) && !isBooleanString(value);
}

function looksLikeCompany(value: string) {
  return /[A-Za-z]/.test(value) && !isBooleanString(value) && !isPhone(value);
}

function looksLikeTowerCount(value: string) {
  return isNumberish(value) || /(tower|block|standalone)/i.test(value);
}

function looksLikeText(value: string) {
  return !isBooleanString(value) && !isPhone(value) && !isDateLike(value);
}


// export function paginate(items, pageSize) {
//   const pages = [];
//   for (let i = 0; i < items.length; i += pageSize) {
//     pages.push(items.slice(i, i + pageSize));
//   }
//   return pages;
// }
