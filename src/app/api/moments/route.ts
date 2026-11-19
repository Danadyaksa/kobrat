import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { Moment } from "@/data/moments";

const MOMENTS_FILE_PATH = path.join(process.cwd(), "src", "data", "moments.json");

export async function GET() {
  try {
    const fileContent = await fs.readFile(MOMENTS_FILE_PATH, "utf-8");
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
    let currentMoments: Moment[] = [];
    try {
      const fileContent = await fs.readFile(MOMENTS_FILE_PATH, "utf-8");
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

    // Save back to JSON file
    await fs.writeFile(MOMENTS_FILE_PATH, JSON.stringify(currentMoments, null, 2), "utf-8");

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

    let currentMoments: Moment[] = [];
    try {
      const fileContent = await fs.readFile(MOMENTS_FILE_PATH, "utf-8");
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

    // Save back to JSON file
    await fs.writeFile(MOMENTS_FILE_PATH, JSON.stringify(filtered, null, 2), "utf-8");

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
