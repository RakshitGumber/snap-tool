import { accounts, authSchema, sessions, users, verifications } from "./auth";
import { postRelations, posts } from "./posts";

export const schema = {
  ...authSchema,
  posts,
} as const;

export { accounts, authSchema, postRelations, posts, sessions, users, verifications };
