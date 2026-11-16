import momentsData from "./moments.json";

export interface Moment {
  id: number;
  title: string;
  category: "STUDIO" | "ROOFTOP" | "ON THE ROAD" | "AFTER HOURS" | "ANALOG" | string;
  year: string;
  date: string;
  location: string;
  description: string;
  camera: string;
  members: string[]; // member nicknames/slugs
  image: string;
  aspect?: string;
  featured?: boolean;
  highlightSlot?: 1 | 2 | 3 | null;
}

export const moments: Moment[] = momentsData as Moment[];

export async function getMoments(): Promise<Moment[]> {
  if (typeof window === "undefined") {
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const filePath = path.join(process.cwd(), "src", "data", "moments.json");
      const data = await fs.readFile(filePath, "utf-8");
      return JSON.parse(data) as Moment[];
    } catch {
      return moments;
    }
  }
  return moments;
}
