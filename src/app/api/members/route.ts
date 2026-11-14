import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { Member } from "@/data/members";

const MEMBERS_FILE_PATH = path.join(process.cwd(), "src", "data", "members.json");

export async function GET() {
  try {
    const fileContent = await fs.readFile(MEMBERS_FILE_PATH, "utf-8");
    const members: Member[] = JSON.parse(fileContent);
    return NextResponse.json(members, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    console.error("Failed to read members file:", err);
    return NextResponse.json({ error: "Failed to read members" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    // Read current data
    let currentMembers: Member[] = [];
    try {
      const fileContent = await fs.readFile(MEMBERS_FILE_PATH, "utf-8");
      currentMembers = JSON.parse(fileContent);
    } catch {
      currentMembers = [];
    }

    if (Array.isArray(body)) {
      // Direct array replacement
      currentMembers = body;
    } else if (body.id) {
      // Single member update
      const index = currentMembers.findIndex((m) => m.id === Number(body.id));
      if (index !== -1) {
        currentMembers[index] = {
          ...currentMembers[index],
          ...body,
          id: Number(body.id),
        };
      } else {
        currentMembers.push(body);
      }
    } else {
      return NextResponse.json(
        { error: "Invalid payload. Provide an array of members or an object with an 'id'." },
        { status: 400 }
      );
    }

    // Save back to JSON file
    await fs.writeFile(MEMBERS_FILE_PATH, JSON.stringify(currentMembers, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      members: currentMembers,
    });
  } catch (err) {
    console.error("Failed to update members:", err);
    return NextResponse.json({ error: "Failed to update members" }, { status: 500 });
  }
}
