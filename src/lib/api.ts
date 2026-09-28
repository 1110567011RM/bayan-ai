import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authOptions } from "@/lib/auth";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function requireUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new ApiError("Unauthorized", 401);
  }

  return session.user as {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== "ADMIN") {
    throw new ApiError("Forbidden", 403);
  }

  return user;
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: error.status }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: "بيانات الطلب غير صالحة.",
        details: error.flatten(),
      },
      { status: 400 }
    );
  }

  console.error(error);

  return NextResponse.json(
    {
      success: false,
      error: "حدث خطأ داخلي في الخادم.",
    },
    { status: 500 }
  );

