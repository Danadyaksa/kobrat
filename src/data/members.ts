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

export function getMemberSlug(member: { nickname?: string; name: string; id: number }): string {
  const source = member.nickname?.trim() || member.name.trim();
  return source
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function findMemberBySlug(allMembers: Member[], slug: string): Member | undefined {
  const clean = decodeURIComponent(slug).toLowerCase().trim();
  return allMembers.find((m) => {
    const memberSlug = getMemberSlug(m);
    const nick = (m.nickname || "").toLowerCase().trim();
    const name = m.name.toLowerCase().trim();
    const id = String(m.id);
    return (
      memberSlug === clean ||
      nick === clean ||
      name === clean ||
      id === clean
    );
  });
}

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
