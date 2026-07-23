import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest, findUserById } from "@/lib/server/db";

export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  const user = findUserById(auth.userId);
  if (!user) {
    return NextResponse.json(
      { message: "User not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      company: user.company,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
}
