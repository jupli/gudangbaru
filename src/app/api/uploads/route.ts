import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "File tidak ditemukan" },
      { status: 400 },
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const ext = path.extname(file.name) || ".jpg";
  const safeName = file.name.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
  const filename = `${Date.now()}-${safeName}${ext}`;
  const filePath = path.join(uploadsDir, filename);

  await writeFile(filePath, buffer);

  const url = `/uploads/${filename}`;

  return NextResponse.json({ url });
}

