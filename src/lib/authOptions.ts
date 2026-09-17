import prisma from "@/lib/prisma";
import { AuthOptions, Session, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcrypt";

const githubClientId = process.env.GITHUB_CLIENT_ID || "";
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET || "";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          isComplete: false,
        };
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username or Email", type: "text", placeholder: "username or college email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const identifier = credentials.username.trim();

        // Support login with either username or college email, case-insensitively
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: { equals: identifier, mode: "insensitive" } },
              { email: { equals: identifier, mode: "insensitive" } },
            ],
          },
        });

        if (!user || !user.password) return null;

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          isComplete: user.isComplete,
          enrollmentNum: user.enrollmentNum,
        };
      },
    }),
    GitHubProvider({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
      authorization: { params: { scope: "repo" } },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          if (!user?.email) {
            console.error("Google account has no email");
            return false;
          }

          const existingUser = await prisma.user.findFirst({
            where: {
              email: { equals: user.email.trim(), mode: "insensitive" },
            },
          });

          if (!existingUser?.isComplete) {
            console.log("Redirecting user to complete signup...");
            return `/auth/signup?email=${encodeURIComponent(user.email.trim().toLowerCase())}`;
          }

          console.log("User successfully signed in via Google.");
          return true;
        } catch (error) {
          console.error("Error during Google sign-in:", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email || token.email;
        token.username = user.username;
        token.enrollmentNum = user.enrollmentNum;
        token.isComplete = user.isComplete;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token?.id as string) || (token?.sub as string) || session.user.id;
        session.user.username = (token?.username as string) || session.user.username;
        session.user.enrollmentNum = (token?.enrollmentNum as string) || session.user.enrollmentNum;
        session.user.isComplete = (token?.isComplete as boolean) ?? session.user.isComplete;

        if (!session.user.id || session.user.isComplete === undefined) {
          const dbUser = await prisma.user.findFirst({
            where: {
              email: { equals: session.user.email || "", mode: "insensitive" },
            },
          });

          if (dbUser) {
            session.user.id = dbUser.id;
            session.user.username = dbUser.username;
            session.user.isComplete = dbUser.isComplete;
            session.user.enrollmentNum = dbUser.enrollmentNum;
          }
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const getServerAuthSession = () => getServerSession(authOptions);