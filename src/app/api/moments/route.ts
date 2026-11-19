import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { Moment } from "@/data/moments";

const ROOT_MOMENTS_PATH = path.join(process.cwd(), "data", "moments.json");
const SRC_MOMENTS_PATH = path.join(process.cwd(), "src", "data", "moments.json");

const ROOT_MEMBERS_PATH = path.join(process.cwd(), "data", "members.json");
const SRC_MEMBERS_PATH = path.join(process.cwd(), "src", "data", "members.json");

async function getMomentsFilePath(): Promise<string> {
  try {
    await fs.access(ROOT_MOMENTS_PATH);
    return ROOT_MOMENTS_PATH;
  } catch {
    return SRC_MOMENTS_PATH;
  }
}

async function getMembersFilePath(): Promise<string> {
  try {
    await fs.access(ROOT_MEMBERS_PATH);
    return ROOT_MEMBERS_PATH;
  } catch {
    return SRC_MEMBERS_PATH;
  }
}

async function sanitizeMomentsMembers(momentsList: Moment[]): Promise<Moment[]> {
  try {
    const memFilePath = await getMembersFilePath();
    const rawMembers = await fs.readFile(memFilePath, "utf-8");
    const membersList: Array<{ name: string; nickname?: string }> = JSON.parse(rawMembers);
    const validSlugs = new Set<string>();
    for (const m of membersList) {
      const src = (m.nickname || m.name || "").trim().toLowerCase();
      const slug = src.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      if (slug) validSlugs.add(slug);
      if (m.nickname) validSlugs.add(m.nickname.trim().toLowerCase());
    }
    return momentsList.map((m) => {
      const cleaned = Array.isArray(m.members)
        ? Array.from(
            new Set(
              m.members
                .map((s) => s.toLowerCase().trim())
                .filter((s) => validSlugs.has(s))
            )
          )
        : [];
      return { ...m, members: cleaned };
    });
  } catch {
    return momentsList;
  }
}

export async function GET() {
  try {
    const filePath = await getMomentsFilePath();
    const fileContent = await fs.readFile(filePath, "utf-8");
    const moments: Moment[] = JSON.parse(fileContent);
    return NextResponse.json(moments, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    console.error("Failed to read moments file:", err);
    return NextResponse.json({ error: "Failed to read moments" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    // Read current data
    const filePath = await getMomentsFilePath();
    let currentMoments: Moment[] = [];
    try {
      const fileContent = await fs.readFile(filePath, "utf-8");
      currentMoments = JSON.parse(fileContent);
    } catch {
      currentMoments = [];
    }

    if (Array.isArray(body)) {
      // Direct array replacement
      currentMoments = body;
    } else if (body && body.id) {
      // Single moment update
      const index = currentMoments.findIndex((m) => m.id === Number(body.id));
      if (index !== -1) {
        // If this moment is being assigned a highlightSlot (1, 2, or 3),
        // clear that slot from any other moment to avoid conflict
        if (body.highlightSlot) {
          currentMoments = currentMoments.map((m) =>
            m.id !== Number(body.id) && m.highlightSlot === body.highlightSlot
              ? { ...m, highlightSlot: null }
              : m
          );
        }

        currentMoments[index] = {
          ...currentMoments[index],
          ...body,
          id: Number(body.id),
        };
      } else {
        currentMoments.push(body);
      }
    } else {
      return NextResponse.json(
        { error: "Invalid payload. Provide an array of moments or an object with an 'id'." },
        { status: 400 }
      );
    }

    // Sanitize member tags against actual members
    currentMoments = await sanitizeMomentsMembers(currentMoments);

    // Save to ROOT data file (outside src) so Turbopack dev watcher never triggers Fast Refresh
    await fs.writeFile(ROOT_MOMENTS_PATH, JSON.stringify(currentMoments, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      moments: currentMoments,
    });
  } catch (err) {
    console.error("Failed to update moments:", err);
    return NextResponse.json({ error: "Failed to update moments" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    let targetId: number | null = idParam ? Number(idParam) : null;

    if (!targetId) {
      try {
        const body = await req.json();
        if (body && body.id) targetId = Number(body.id);
      } catch {
        // ignore JSON parse error if body empty
      }
    }

    if (!targetId) {
      return NextResponse.json(
        { error: "Missing moment id to delete" },
        { status: 400 }
      );
    }

    const filePath = await getMomentsFilePath();
    let currentMoments: Moment[] = [];
    try {
      const fileContent = await fs.readFile(filePath, "utf-8");
      currentMoments = JSON.parse(fileContent);
    } catch {
      currentMoments = [];
    }

    const initialLength = currentMoments.length;
    const filtered = currentMoments.filter((m) => m.id !== targetId);

    if (filtered.length === initialLength) {
      return NextResponse.json(
        { error: "Moment not found" },
        { status: 404 }
      );
    }

    await fs.writeFile(ROOT_MOMENTS_PATH, JSON.stringify(filtered, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      deletedId: targetId,
      moments: filtered,
    });
  } catch (err) {
    console.error("Failed to delete moment:", err);
    return NextResponse.json({ error: "Failed to delete moment" }, { status: 500 });
  }
}
