import { NextResponse } from "next/server";

import { deleteProfileAvatar, PROFILE_AVATAR_MAX_BYTES, saveProfileAvatar, signAvatar } from "@/lib/server/profile-avatar";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.seo.quasarasoft.com";

async function currentUserId(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
    headers: { Authorization: header },
    cache: "no-store",
  });
  if (!response.ok) return null;

  const data = (await response.json()) as { user?: { id?: string } };
  return data.user?.id ?? null;
}

export async function GET(request: Request) {
  const userId = await currentUserId(request);
  if (!userId) return NextResponse.json({ message: "Not authenticated." }, { status: 401 });

  try {
    const url = await signAvatar(userId);
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load profile photo.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await currentUserId(request);
  if (!userId) return NextResponse.json({ message: "Not authenticated." }, { status: 401 });

  try {
    const form = await request.formData();
    const file = form.get("avatar");
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Choose an image." }, { status: 400 });
    }
    if (file.size > PROFILE_AVATAR_MAX_BYTES) {
      return NextResponse.json({ message: "Image must be under 2 MB." }, { status: 400 });
    }

    const url = await saveProfileAvatar(userId, Buffer.from(await file.arrayBuffer()), file.type);
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save profile photo.";
    const status = /Use a JPG|under 2 MB|Choose/.test(message) ? 400 : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(request: Request) {
  const userId = await currentUserId(request);
  if (!userId) return NextResponse.json({ message: "Not authenticated." }, { status: 401 });

  try {
    await deleteProfileAvatar(userId);
    return NextResponse.json({ url: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not remove profile photo.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
