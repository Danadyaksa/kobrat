import membersData from "./members.json";

export interface Member {
  id: number;
  name: string;
  nickname: string;
  role?: string;
  image: string;
  instagram?: string;
  bio?: string;
  location?: string;
}

export const members: Member[] = membersData as Member[];

export async function getMembers(): Promise<Member[]> {
  if (typeof window === "undefined") {
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const filePath = path.join(process.cwd(), "src", "data", "members.json");
      const data = await fs.readFile(filePath, "utf-8");
      return JSON.parse(data) as Member[];
    } catch {
      return members;
    }
  }
  return members;
}
