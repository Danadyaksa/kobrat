import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { Member } from "@/data/members";

const ROOT_MEMBERS_PATH = path.join(process.cwd(), "data", "members.json");
const SRC_MEMBERS_PATH = path.join(process.cwd(), "src", "data", "members.json");

async function getMembersFilePath(): Promise<string> {
  try {
    await fs.access(ROOT_MEMBERS_PATH);
    return ROOT_MEMBERS_PATH;
  } catch {
    return SRC_MEMBERS_PATH;
  }
}

export async function GET() {
  try {
    const filePath = await getMembersFilePath();
    const fileContent = await fs.readFile(filePath, "utf-8");
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
    const filePath = await getMembersFilePath();
    let currentMembers: Member[] = [];
    try {
      const fileContent = await fs.readFile(filePath, "utf-8");
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

    // Save to ROOT data file (outside src) so Turbopack dev watcher never triggers Fast Refresh
    await fs.writeFile(ROOT_MEMBERS_PATH, JSON.stringify(currentMembers, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      members: currentMembers,
    });
  } catch (err) {
    console.error("Failed to update members:", err);
    return NextResponse.json({ error: "Failed to update members" }, { status: 500 });
  }
}
