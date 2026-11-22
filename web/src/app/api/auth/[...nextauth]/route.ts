import { handlers } from "@/auth";

export const runtime = "nodejs"; // MongoDB adapter + scrypt need Node
export const { GET, POST } = handlers;
