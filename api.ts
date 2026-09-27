import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function ok(data: unknown, init?: ResponseInit) {
  return Response.json(
    {
      success: true,
      data,
    },
    init
  );
}

export function fail(message: string, status = 400) {
  return Response.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

export async function requireUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new ApiError("Unauthorized", 401);
  }

  return session.user;
}

type ApiHandler = (
  request: Request
) => Promise<Response> | Response;

export function handler(fn: ApiHandler) {
  return async (request: Request) => {
    try {
      return await fn(request);
    } catch (error) {
      if (error instanceof ApiError) {
        return fail(error.message, error.status);
      }

      console.error(error);

      return fail("Internal server error", 500);
    }
  };
}
