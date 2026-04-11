import { and, desc, eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { auth } from "../auth";
import { db } from "../db";
import { posts } from "../db/schema/posts";

type PostBody = {
  id?: string;
  title?: string;
  design?: unknown;
};

const readJsonBody = async (request: Request) => {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return null;
  }

  return body as Record<string, unknown>;
};

const normalizeTitle = (value: unknown) => {
  if (typeof value !== "string") {
    return "Untitled project";
  }

  const title = value.trim();
  return title || "Untitled project";
};

const getSession = async (request: Request) =>
  auth.api.getSession({
    headers: request.headers,
  });

type PostUpdate = {
  title?: string;
  design?: unknown;
  updatedAt: Date;
};

export const postsRoutes = new Elysia({ name: "posts-routes" }).group(
  "/api/posts",
  (app) =>
    app
      .get("/", async ({ request, set }) => {
        const session = await getSession(request);

        if (!session) {
          set.status = 401;
          return { message: "Unauthorized" };
        }

        const items = await db
          .select()
          .from(posts)
          .where(eq(posts.userId, session.user.id))
          .orderBy(desc(posts.updatedAt));

        return { posts: items };
      })
      .post("/", async ({ request, set }) => {
        const session = await getSession(request);

        if (!session) {
          set.status = 401;
          return { message: "Unauthorized" };
        }

        const body = (await readJsonBody(request)) as PostBody | null;

        if (!body || body.design === undefined) {
          set.status = 400;
          return { message: "Post design is required" };
        }

        const title = normalizeTitle(body.title);
        const postId = typeof body.id === "string" && body.id.trim()
          ? body.id.trim()
          : crypto.randomUUID();

        const existing = await db
          .select()
          .from(posts)
          .where(eq(posts.id, postId))
          .limit(1);

        if (existing[0] && existing[0].userId !== session.user.id) {
          set.status = 409;
          return { message: "Post ID already belongs to another user" };
        }

        if (existing[0]) {
          const [updated] = await db
            .update(posts)
            .set({
              title,
              design: body.design,
              updatedAt: new Date(),
            })
            .where(and(eq(posts.id, postId), eq(posts.userId, session.user.id)))
            .returning();

          return { post: updated };
        }

        const [created] = await db
          .insert(posts)
          .values({
            id: postId,
            userId: session.user.id,
            title,
            design: body.design,
          })
          .returning();

        return { post: created };
      })
      .get("/:id", async ({ request, params, set }) => {
        const session = await getSession(request);

        if (!session) {
          set.status = 401;
          return { message: "Unauthorized" };
        }

        const [post] = await db
          .select()
          .from(posts)
          .where(and(eq(posts.id, params.id), eq(posts.userId, session.user.id)))
          .limit(1);

        if (!post) {
          set.status = 404;
          return { message: "Post not found" };
        }

        return { post };
      })
      .patch("/:id", async ({ request, params, set }) => {
        const session = await getSession(request);

        if (!session) {
          set.status = 401;
          return { message: "Unauthorized" };
        }

        const body = (await readJsonBody(request)) as PostBody | null;

        if (!body || (body.title === undefined && body.design === undefined)) {
          set.status = 400;
          return { message: "Nothing to update" };
        }

        const updates: PostUpdate = {
          updatedAt: new Date(),
        };

        if (body.title !== undefined) {
          updates.title = normalizeTitle(body.title);
        }

        if (body.design !== undefined) {
          updates.design = body.design;
        }

        const [updated] = await db
          .update(posts)
          .set(updates)
          .where(and(eq(posts.id, params.id), eq(posts.userId, session.user.id)))
          .returning();

        if (!updated) {
          set.status = 404;
          return { message: "Post not found" };
        }

        return { post: updated };
      })
      .delete("/:id", async ({ request, params, set }) => {
        const session = await getSession(request);

        if (!session) {
          set.status = 401;
          return { message: "Unauthorized" };
        }

        const [deleted] = await db
          .delete(posts)
          .where(and(eq(posts.id, params.id), eq(posts.userId, session.user.id)))
          .returning();

        if (!deleted) {
          set.status = 404;
          return { message: "Post not found" };
        }

        return { success: true };
      }),
);
