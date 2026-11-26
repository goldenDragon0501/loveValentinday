import { supabaseAdmin } from "./supabase";

export async function verifyAdmin(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const { data: admin } = await supabaseAdmin
    .from("admin_users")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  return admin?.id ?? null;
}
