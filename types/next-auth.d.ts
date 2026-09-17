import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      username?: string | null;
      isComplete?: boolean;
      enrollmentNum?: string | null;
      githubAccessToken?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    username?: string | null;
    isComplete?: boolean;
    enrollmentNum?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string | null;
    enrollmentNum?: string | null;
    isComplete?: boolean;
    githubAccessToken?: string | null;
  }
}

