import { getProperties } from "./properties";

type Property = Awaited<ReturnType<typeof getProperties>>[number];

export type Project = {
  name: string;
  developer: string;
  locations: string[];
  listings: Property[];
  coverImage: string;
  startingPrice: number | null;
};

export type Developer = {
  name: string;
  slug: string;
  projects: Project[];
  locations: string[];
};

const DEVELOPER_ALIASES: Record<string, string> = {
  GEN: "GEM",
  MY: "MY HOME",
  THE: "JAYABHERI",
};

export async function getDevelopers(): Promise<Developer[]> {
  const properties = await getProperties();
  const developers = new Map<string, Map<string, Property[]>>();

  for (const property of properties) {
    const rawDeveloper = clean(property.developer);
    const projectName = clean(property.project_name);

    if (!rawDeveloper || !projectName) continue;

    const developer = DEVELOPER_ALIASES[rawDeveloper.toUpperCase()] || rawDeveloper;
    const developerKey = developer.toLowerCase();
    const projectKey = projectName.toLowerCase();

    if (!developers.has(developerKey)) developers.set(developerKey, new Map());
    const projects = developers.get(developerKey)!;
    projects.set(projectKey, [...(projects.get(projectKey) || []), property]);
  }

  return [...developers.entries()]
    .map(([developerKey, projectGroups]) => {
      const name = displayName(DEVELOPER_ALIASES[developerKey.toUpperCase()] || developerKey);
      const projects = [...projectGroups.values()]
        .map((listings) => toProject(name, listings))
        .sort((left, right) => left.name.localeCompare(right.name));

      return {
        name,
        slug: slugify(name),
        projects,
        locations: unique(projects.flatMap((project) => project.locations)),
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function toProject(developer: string, listings: Property[]): Project {
  const prices = listings
    .map((property) => property.total_price_cr)
    .filter((price): price is number => typeof price === "number" && price > 0);

  return {
    name: displayName(clean(listings[0].project_name)),
    developer,
    locations: unique(listings.flatMap((property) => [clean(property.area), clean(property.city)])),
    listings,
    coverImage: clean(listings.find((property) => property.cover_image)?.cover_image),
    startingPrice: prices.length ? Math.min(...prices) : null,
  };
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function displayName(value: string) {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bO2\b/gi, "O2");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
