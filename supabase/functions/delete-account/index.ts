/**
 * Deletes the caller's own account.
 *
 * Removing an auth user needs the service role, which must never reach the
 * browser, so this runs here. The caller is identified only by the verified
 * JWT on the request (verify_jwt stays on, and withSupabase checks it again):
 * nothing in the body can name another account.
 *
 * Files go first, because storage objects do not cascade from auth.users.
 * Deleting the user then removes the profile, notes, note links and pins
 * through their ON DELETE CASCADE foreign keys.
 *
 * Deploy:  npx supabase functions deploy delete-account
 */
import { withSupabase } from "npm:@supabase/server@^1";

const BUCKETS = ["avatars", "voice-notes"];
const PAGE = 1000;

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json({ error: "Use POST." }, { status: 405 });
    }
    const uid = ctx.userClaims?.id;
    if (!uid) {
      return Response.json({ error: "Not signed in." }, { status: 401 });
    }
    const admin = ctx.supabaseAdmin;

    for (const bucket of BUCKETS) {
      // Each person's files sit in a folder named for their uid.
      for (;;) {
        const { data, error } = await admin.storage.from(bucket).list(uid, { limit: PAGE });
        if (error) {
          console.error(`list ${bucket}:`, error.message);
          return Response.json({ error: "Your files could not be removed. Nothing was deleted." }, { status: 500 });
        }
        if (!data.length) break;
        const { error: removeError } = await admin.storage
          .from(bucket)
          .remove(data.map((f) => `${uid}/${f.name}`));
        if (removeError) {
          console.error(`remove ${bucket}:`, removeError.message);
          return Response.json({ error: "Your files could not be removed. Try again." }, { status: 500 });
        }
        if (data.length < PAGE) break;
      }
    }

    const { error } = await admin.auth.admin.deleteUser(uid);
    if (error) {
      console.error("deleteUser:", error.message);
      return Response.json({ error: "The account could not be deleted. Try again." }, { status: 500 });
    }
    return Response.json({ deleted: true });
  }),
};
