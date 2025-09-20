
"use server"
import { LeetCode } from "leetcode-query";
import { CodeforcesAPI } from "codeforces-api-ts";
import axios from "axios";


export async function fetchLatestSubmissionsLeetCode(username: string){
    await new Promise((resolve) => (setTimeout((resolve), 1500)))
    try {
        const leetcode = new LeetCode()
        const userStats = await leetcode.user(username)
        return userStats
    } catch (error) {
        console.log("Error: ", error)
        return null
    }

} 




export async function fetchLatestSubmissionsCodeForces(username: string){
    
    if(process.env.CODEFORCES_API_KEY && process.env.CODEFORCES_SECRET){
        CodeforcesAPI.setCredentials({
            API_KEY: process.env.CODEFORCES_API_KEY,
            API_SECRET: process.env.CODEFORCES_SECRET,
          });
    }

    await new Promise((resolve) => (setTimeout((resolve), 500)))
    try {
       
        const userStats = await CodeforcesAPI.call("user.status", { handle: username });
        //@ts-expect-error : it important here
        return userStats.result
    } catch (error) {
        console.log("Error: ", error)
        return null
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
      }`
    };

    const response = await axios.post("https://leetcode.com/graphql", query, {
      headers: {
        "Content-Type": "application/json"
      }
    });


    const userData = response.data?.data?.matchedUser;
    if (!userData) {
      throw new Error("User not found on LeetCode");
    }
    const result = {
        leetcodeUsername: userData.username,
        //@ts-expect-error: do not know what to do here...
        totalSolved: userData.submitStats.acSubmissionNum.find((item) => item.difficulty === "All")?.count || 0,
        //@ts-expect-error: do not know what to do here...
        easySolved: userData.submitStats.acSubmissionNum.find((item) => item.difficulty === "Easy")?.count || 0,
        //@ts-expect-error: do not know what to do here...
        mediumSolved: userData.submitStats.acSubmissionNum.find((item) => item.difficulty === "Medium")?.count || 0,
        //@ts-expect-error: do not know what to do here...
        hardSolved: userData.submitStats.acSubmissionNum.find((item) => item.difficulty === "Hard")?.count || 0
      }


    return result;


  } catch (error) {
    console.error("Error fetching user stats:", error);
    return null;
  }
}
  

export async function fetchCodeforcesUserData(username: string) {
    if (process.env.CODEFORCES_API_KEY && process.env.CODEFORCES_SECRET) {
        CodeforcesAPI.setCredentials({
            API_KEY: process.env.CODEFORCES_API_KEY,
            API_SECRET: process.env.CODEFORCES_SECRET,
        });
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
        const userInfo = await CodeforcesAPI.call("user.info", { handles: username });
        //@ts-expect-error : it important here
        if (userInfo && userInfo.result && userInfo.result.length > 0) {
            //@ts-expect-error : it important here
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
        console.error("Error fetching user data:", error);
        return null;
    }
}

// CodeChef does not provide an official submissions API.
// We'll use a lightweight scraper endpoint if provided via env, else fallback to parsing profile HTML.
// Returns a set/list of solved problem identifiers suitable to compare with our `slug`.
export async function fetchLatestSubmissionsCodeChef(username: string) {
  try {
    const service = process.env.CODECHEF_SCRAPER_URL; // Optional custom microservice that returns recent AC submissions
    if (service) {
      const resp = await axios.get(`${service}/codechef/${encodeURIComponent(username)}`);
      return resp.data; // expected format: { solved: string[] } or array of slugs
    }

    // Fallback: basic scrape of CodeChef profile Recent AC activity (best-effort, may break if DOM changes)
    const profileUrl = `https://www.codechef.com/users/${encodeURIComponent(username)}`;
    const html = await axios.get(profileUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    const text: string = html.data as string;
    const solved = new Set<string>();
    // Heuristic: problem links often look like /problems/<CODE> or /viewsolution/...
    // Extract problem codes via regex for /problems/<CODE>
    const problemRegex = /\/problems\/([A-Z0-9_\-]+)/g;
    let match: RegExpExecArray | null;
    while ((match = problemRegex.exec(text)) !== null) {
      solved.add(match[1]);
    }
    return Array.from(solved);
  } catch (error) {
    console.error("Error fetching CodeChef submissions:", error);
    return null;
  }
}


