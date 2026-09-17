"use server";
import { LeetCode } from "leetcode-query";
import { CodeforcesAPI } from "codeforces-api-ts";
import axios from "axios";

interface CodeforcesCredentials {
  apiKey?: string | null;
  apiSecret?: string | null;
}

const LEETCODE_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Referer": "https://leetcode.com",
};

export async function fetchLatestSubmissionsLeetCode(username: string) {
  try {
    const leetcode = new LeetCode();
    const userPromise = leetcode.user(username);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("LeetCode request timed out")), 8000)
    );

    const userStats = (await Promise.race([userPromise, timeoutPromise])) as any;
    return userStats || null;
  } catch (error) {
    console.warn("Error fetching LeetCode user data for", username, ":", (error as Error).message);
    return null;
  }
}

export async function fetchLatestSubmissionsCodeForces(
  username: string,
  credentials?: CodeforcesCredentials
) {
  if (credentials?.apiKey && credentials?.apiSecret) {
    CodeforcesAPI.setCredentials({
      API_KEY: credentials.apiKey,
      API_SECRET: credentials.apiSecret,
    });
  } else if (process.env.CODEFORCES_API_KEY && process.env.CODEFORCES_SECRET) {
    CodeforcesAPI.setCredentials({
      API_KEY: process.env.CODEFORCES_API_KEY,
      API_SECRET: process.env.CODEFORCES_SECRET,
    });
  }

  try {
    const userStatsPromise = CodeforcesAPI.call("user.status", { handle: username });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Codeforces request timed out")), 6000)
    );

    const userStats = (await Promise.race([userStatsPromise, timeoutPromise])) as any;
    return userStats?.result || null;
  } catch (error) {
    console.warn("Error fetching Codeforces submissions for", username, ":", (error as Error).message);
    return null;
  }
}

export async function fetchUserStats(username: string) {
  try {
    const query = {
      query: `{
        matchedUser(username: "${username}") {
          username
          submitStats: submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
          }
        }
      }`,
    };

    const response = await axios.post("https://leetcode.com/graphql", query, {
      headers: LEETCODE_HEADERS,
      timeout: 6000,
    });

    const userData = response.data?.data?.matchedUser;
    if (!userData) {
      return null;
    }

    const result = {
      leetcodeUsername: userData.username,
      totalSolved:
        userData.submitStats?.acSubmissionNum?.find((item: any) => item.difficulty === "All")?.count || 0,
      easySolved:
        userData.submitStats?.acSubmissionNum?.find((item: any) => item.difficulty === "Easy")?.count || 0,
      mediumSolved:
        userData.submitStats?.acSubmissionNum?.find((item: any) => item.difficulty === "Medium")?.count || 0,
      hardSolved:
        userData.submitStats?.acSubmissionNum?.find((item: any) => item.difficulty === "Hard")?.count || 0,
    };

    return result;
  } catch (error) {
    console.warn("Error fetching LeetCode user stats for", username, ":", (error as Error).message);
    return null;
  }
}

export async function fetchCodeforcesUserData(
  username: string,
  credentials?: CodeforcesCredentials
) {
  if (credentials?.apiKey && credentials?.apiSecret) {
    CodeforcesAPI.setCredentials({
      API_KEY: credentials.apiKey,
      API_SECRET: credentials.apiSecret,
    });
  } else if (process.env.CODEFORCES_API_KEY && process.env.CODEFORCES_SECRET) {
    CodeforcesAPI.setCredentials({
      API_KEY: process.env.CODEFORCES_API_KEY,
      API_SECRET: process.env.CODEFORCES_SECRET,
    });
  }

  try {
    const userInfoPromise = CodeforcesAPI.call("user.info", { handles: username });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Codeforces user.info timed out")), 5000)
    );

    const userInfo = (await Promise.race([userInfoPromise, timeoutPromise])) as any;

    if (userInfo && userInfo.result && userInfo.result.length > 0) {
      const user = userInfo.result[0];
      return {
        codeforcesUsername: username,
        rating: user.rating ?? "Unrated",
        maxRating: user.maxRating ?? "Unrated",
        rank: user.rank ?? "N/A",
      };
    }

    return null;
  } catch (error) {
    console.warn("Error fetching Codeforces user data for", username, ":", (error as Error).message);
    return null;
  }
}

/**
 * Resilient check for platform accounts on signup.
 * Does NOT fail registration if external APIs are rate-limiting (e.g. Codeforces 429) or timing out.
 */
export async function validateExternalProfiles(
  leetcodeUsername: string,
  codeforcesUsername: string
): Promise<{ valid: boolean; message?: string }> {
  // 1. Basic format validation
  const lc = leetcodeUsername.trim();
  const cf = codeforcesUsername.trim();

  if (!lc || lc.length < 2) {
    return { valid: false, message: "Please provide a valid LeetCode username" };
  }
  if (!cf || cf.length < 2) {
    return { valid: false, message: "Please provide a valid Codeforces handle" };
  }

  return { valid: true };
}



