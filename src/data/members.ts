import membersData from "./members.json";

export interface Member {
  id: number;
  name: string;
  nickname: string;
  role?: string;
  image: string;
  instagram?: string;
  website?: string;
  github?: string;
  bio?: string;
  location?: string;
}

export const members: Member[] = membersData as Member[];

export function getMemberSlug(member: {
  nickname?: string;
  name: string;
  id: number;
}): string {
  const source = member.nickname?.trim() || member.name.trim();
  return source
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function findMemberBySlug(
  allMembers: Member[],
  slug: string
): Member | undefined {
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

export function formatInstagramLink(raw?: string): {
  href: string;
  label: string;
} | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  const cleaned = trimmed
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "")
    .trim();
  if (!cleaned) return null;
  return {
    href: `https://instagram.com/${cleaned}`,
    label: `@${cleaned}`,
  };
}

export function formatGithubLink(raw?: string): {
  href: string;
  label: string;
  username: string;
} | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  const cleaned = trimmed
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/^github\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "")
    .trim();
  if (!cleaned) return null;
  return {
    href: `https://github.com/${cleaned}`,
    label: `github.com/${cleaned}`,
    username: cleaned,
  };
}

export function formatWebsiteLink(raw?: string): {
  href: string;
  label: string;
} | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const label = trimmed
    .replace(/^https?:\/\/(www\.)?/i, "")
    .replace(/\/+$/, "");
  if (!label) return null;
  return { href, label };
}

export async function getMembers(): Promise<Member[]> {
  if (typeof window === "undefined") {
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const rootPath = path.join(process.cwd(), "data", "members.json");
      const srcPath = path.join(process.cwd(), "src", "data", "members.json");
      try {
        const data = await fs.readFile(rootPath, "utf-8");
        return JSON.parse(data) as Member[];
      } catch {
        const data = await fs.readFile(srcPath, "utf-8");
        return JSON.parse(data) as Member[];
      }
    } catch {
      return members;
    }
  }
  return members;
}
