import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      isComplete: boolean;
      enrollmentNum?: string | null;
      githubAccessToken?: string | null;
    };
  }

  interface JWT {
    githubAccessToken?: string | null;
  }
}
