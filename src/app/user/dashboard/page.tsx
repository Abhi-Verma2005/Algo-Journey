'use client'
import React, { JSX, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { 
  Trophy, 
  Users, 
  Target, 
  ChevronRight, 
  Award, 
  Clock, 
  ChevronDown, 
  Calendar, 
  Timer, 
  Check, 
  AlertTriangle,
  Code,
  Activity,
  ExternalLink,
  ArrowUpRight,
  Crown,
  Settings,
  UsersIcon,
} from "lucide-react"
import axios from 'axios';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { cn } from "@/lib/utils"
import { redirect } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { fetchCodeforcesUserData, fetchLatestSubmissionsLeetCode, fetchUserStats } from '@/serverActions/fetch';
import { useQuery } from '@tanstack/react-query';
import useStore from '@/store/store';

interface GroupMember {
  username: string;
  individualPoints: number;
}

interface Group {
  name: string;
  groupPoints: number;
  _count: {
    members: number;  
  }
}

interface User {
  individualPoints: number;
  group?: Group;
  coordinatedGroup?: Group;
}

interface UserStats {
  totalSubmissions: number;
  totalPoints: number;
  groupName: string | null;
  groupPoints: number | null;
  groupMembers: number | null;
  isCoordinator: boolean;
}

interface Contest {
  id: number;
  startTime: string;
  name: string
  duration: string;
  endTime: string;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
}

interface DashboardData {
  contests: Contest[];
  username: string;
  isAdmin: boolean;
  userStats: UserStats;
}

interface LeetCodeStats {
  totalSolved: number;
  totalQuestions: number;
  easySolved: number;
  totalEasy: number;
  mediumSolved: number;
  leetcodeUsername: string;
  totalMedium: number;
  hardSolved: number;
  totalHard: number;
  ranking: number;
}

interface CodeForcesStats {
  codeforcesUsername: string; 
  rating: number;
}

interface PlatformData {
  leetcodeData: LeetCodeStats | null;
  codeforcesData: CodeForcesStats | null;
}

// Fetch functions (same as before)



type StatusType = "ACTIVE" | "INACTIVE" | "COMPLETED";
const StatusBadge = ({ status }: { status: StatusType }) => {
  const statusConfig: Record<StatusType, { color: string; icon: JSX.Element }> = {
    ACTIVE: {
      color: "bg-green-100 text-green-800 border-green-200",
      icon: <Check className="h-3 w-3 mr-1" />,
    },
    INACTIVE: {
      color: "bg-purple-100 text-purple-800 border-purple-200",
      icon: <Clock className="h-3 w-3 mr-1" />,
    },
    COMPLETED: {
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: <AlertTriangle className="h-3 w-3 mr-1" />,
    },
  };

  const config = statusConfig[status] || statusConfig.INACTIVE;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      {config.icon}
      {status}
    </span>
  );
};


export default function Dashboard() {
  const [members, setMembers] = useState<GroupMember[]>([]);  
  const [loadingPlatformData, setLoadingPlatformData] = useState(false);
  const { isDarkMode } = useStore();
  const [loadingContest, setLoadingContest] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState<boolean>(false); 
  const router = useRouter();
  const { setPUsernames } = useStore()
  const { data: session, status } = useSession();
  const [showTeamMembers, setShowTeamMembers] = useState(false);
  const fetchDashboardData = async (): Promise<DashboardData> => {
    try {
      setLoadingContest(true)
      const contestsResponse = await axios.get<{
        latestContests: Contest[];
        submissionCount: number;
        user: User;
      }>('/api/getData');
      
      const usernameResponse = await axios.post<{
        username: string;
      }>('/api/getUsername');
      
      const adminResponse = await axios.post<{
        isAdmin: boolean;
      }>('/api/checkIfAdmin');
    
    
      return {
        contests: contestsResponse.data.latestContests,
        username: usernameResponse.data.username,
        isAdmin: adminResponse.data.isAdmin,
        userStats: {
          totalSubmissions: contestsResponse.data.submissionCount,
          totalPoints: contestsResponse.data.user.individualPoints,
          groupName: contestsResponse.data.user.group?.name || null,
          groupPoints: contestsResponse.data.user.group?.groupPoints || null,
          groupMembers: contestsResponse.data.user?.group?._count?.members || null,
          isCoordinator: contestsResponse.data.user?.coordinatedGroup ? true : false
        }
      };
    } catch (error) {
      console.log(error)
      return {
        contests: [],
        username: '',
        isAdmin: false,
        userStats: {
          totalSubmissions: 0,
          totalPoints: 0,
          groupName: null,
          groupPoints: null,
          groupMembers: null,
          isCoordinator: false
        }
      }
    } finally{
      setLoadingContest(false)
    }
  };

  const fetchPlatformData = async (): Promise<PlatformData> => {
    try{
      setLoadingPlatformData(true)

      const usernameRes = await axios.get<{ leetcodeUsername: string; codeforcesUsername: string }>("/api/user/username");
      setPUsernames({ leetcodeUsername: usernameRes.data.leetcodeUsername, codeforcesUsername: usernameRes.data.codeforcesUsername })
      
    
  
    if (!usernameRes.data.leetcodeUsername || !usernameRes.data.codeforcesUsername) {
      throw new Error('Usernames not set');
    }
  
    const [leetData, codeforcesData] = await Promise.all([
      fetchUserStats(usernameRes.data.leetcodeUsername),
      fetchCodeforcesUserData(usernameRes.data.codeforcesUsername),
    ]);


    const responseTotal = await fetchLatestSubmissionsLeetCode(usernameRes.data.leetcodeUsername)


    const leetcodeData = {
      totalSolved: leetData?.totalSolved,
      totalQuestions: responseTotal?.allQuestionsCount[0]?.count,
      easySolved: leetData?.easySolved,
      totalEasy: responseTotal?.allQuestionsCount[1]?.count,
      mediumSolved: leetData?.mediumSolved,
      leetcodeUsername: leetData?.leetcodeUsername,
      totalMedium: responseTotal?.allQuestionsCount[2].count,
      hardSolved: leetData?.hardSolved,
      totalHard: responseTotal?.allQuestionsCount[3]?.count,
      ranking: responseTotal?.matchedUser?.profile.ranking
  
    }
    return {
      //@ts-expect-error: dont know what to do here
      leetcodeData: leetcodeData || null,
      codeforcesData: codeforcesData || null
    };
    } catch(error) {
      console.log(error)
      return {
        leetcodeData: null,
        codeforcesData: null
      };
    } finally{
      setLoadingPlatformData(false)
    }
  };

  const { 
    data: dashboardData,
  } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
    enabled: !!session?.user?.email,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const {
    data: platformData,
  } = useQuery({
    queryKey: ['platformData'],
    queryFn: () => fetchPlatformData().catch((error) => {
      if (error.message === 'Usernames not set') {
        toast.error('Please set your leetcode and codeforces usernames in settings');
      }
      throw error;
    }),
    enabled: !!session?.user?.email,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    retry: false
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }
  }, [status]);


  const getLeetCodeDifficultyPercentage = (solved: number, total: number) => {
    return solved && total ? Math.round((solved / total) * 100) : 0;
  };

  const formatDate = (dateString: string) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    //@ts-expect-error: don't know about this 
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  

  // Format time function
  const formatTime = (timeString: string) => {
    const time = timeString.split('T')[1].split('.000Z')[0];
    return time;
  };


  return (
  <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
    <div className="container mx-auto p-8 pt-20 space-y-8">
      <>
        {/* Welcome header with avatar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              Welcome back, <span className={`${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{dashboardData?.username}</span>
            </h1>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>Let&apos;s continue your coding journey!</p>
          </div>
          {/* Dark mode toggle button */}
        </div>
        
        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loadingContest ? <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border rounded-lg shadow-sm p-4 animate-pulse`}>
    <div className="flex items-center gap-2 mb-2">
      <div className={`h-4 w-4 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
      <div className={`h-4 w-16 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
    </div>
    <div className={`h-8 w-12 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded mb-1`}></div>
    <div className={`h-3 w-24 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded`}></div>
  </div> : <Card className={`${
            isDarkMode 
              ? 'bg-gray-800 border-l-4 border-l-blue-400' 
              : 'bg-white border-l-4 border-l-blue-400'
          } shadow-sm hover:shadow-md transition-all`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} flex items-center gap-2`}>
                <Target className="h-4 w-4 text-blue-500" />
                Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{dashboardData?.userStats.totalSubmissions}</p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Total problems attempted</p>
            </CardContent>
          </Card>}

          {loadingContest ? <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border rounded-lg shadow-sm p-4 animate-pulse`}>
    <div className="flex items-center gap-2 mb-2">
      <div className={`h-4 w-4 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
      <div className={`h-4 w-16 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
    </div>
    <div className={`h-8 w-12 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded mb-1`}></div>
    <div className={`h-3 w-24 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded`}></div>
  </div> : <Card className={`${
            isDarkMode 
              ? 'bg-gray-800 border-l-4 border-l-teal-400' 
              : 'bg-white border-l-4 border-l-teal-400'
          } shadow-sm hover:shadow-md transition-all`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} flex items-center gap-2`}>
                <Trophy className="h-4 w-4 text-teal-500" />
                Individual Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{dashboardData?.userStats.totalPoints}</p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Your personal points</p>
            </CardContent>
          </Card>}

          {loadingContest ? <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border rounded-lg shadow-sm p-4 animate-pulse`}>
    <div className="flex items-center gap-2 mb-2">
      <div className={`h-4 w-4 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
      <div className={`h-4 w-16 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
    </div>
    <div className={`h-8 w-12 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded mb-1`}></div>
    <div className={`h-3 w-24 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded`}></div>
  </div> : <Card className={`${
            isDarkMode 
              ? 'bg-gray-800 border-l-4 border-l-amber-400' 
              : 'bg-white border-l-4 border-l-amber-400'
          } shadow-sm hover:shadow-md transition-all`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} flex items-center gap-2`}>
                <Users className="h-4 w-4 text-amber-500" />
                Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} truncate`}>
                {dashboardData?.userStats.groupName || 'No Team'}
              </p>
              {dashboardData?.userStats.groupName && (
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  {dashboardData.userStats.groupMembers} team members
                </p>
              )}
            </CardContent>
          </Card>}

          {loadingContest ? <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border rounded-lg shadow-sm p-4 animate-pulse`}>
    <div className="flex items-center gap-2 mb-2">
      <div className={`h-4 w-4 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
      <div className={`h-4 w-16 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
    </div>
    <div className={`h-8 w-12 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded mb-1`}></div>
    <div className={`h-3 w-24 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded`}></div>
  </div> : <Card className={`${
            isDarkMode 
              ? 'bg-gray-800 border-l-4 border-l-rose-400' 
              : 'bg-white border-l-4 border-l-rose-400'
          } shadow-sm hover:shadow-md transition-all`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} flex items-center gap-2`}>
                <Award className="h-4 w-4 text-rose-500" />
                Team Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {dashboardData?.userStats.groupPoints || 0}
              </p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Combined team points</p>
            </CardContent>
          </Card>}
        </div>

        {/* Platform Statistics */}
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {/* LeetCode card */}
          {loadingPlatformData ? <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border rounded-lg shadow-sm p-6 animate-pulse`}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className={`h-5 w-5 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
        <div className={`h-6 w-32 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
      </div>
      <div className={`h-4 w-4 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
    </div>
    <div className={`h-4 w-48 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded mb-6`}></div>
    
    <div className="flex justify-between items-center mb-4">
      <div className={`h-4 w-24 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
      <div className={`h-5 w-16 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
    </div>
    <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2.5 mb-4`}>
      <div className={`${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} h-2.5 rounded-full w-1/3`}></div>
    </div>
    
    <div className="grid grid-cols-3 gap-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
          <div className={`h-3 w-8 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded mb-1`}></div>
          <div className={`h-5 w-12 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded mb-1`}></div>
          <div className={`w-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-1.5`}>
            <div className={`${isDarkMode ? 'bg-gray-500' : 'bg-gray-300'} h-1.5 rounded-full w-1/2`}></div>
          </div>
        </div>
      ))}
    </div>
  </div> : <Card className={`${
            isDarkMode 
              ? 'bg-gray-800/90 border-gray-700' 
              : 'bg-white/90 border-gray-100'
          } shadow-sm hover:shadow-md transition-all`}>
            <CardHeader className={`${isDarkMode ? 'border-gray-700' : 'border-gray-100'} border-b pb-4`}>
              <div className="flex items-center justify-between">
                <CardTitle className={`text-xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} flex items-center gap-2`}>
                  <Code className="h-5 w-5 text-indigo-500" />
                  LeetCode Progress
                </CardTitle>
                <ExternalLink className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              <CardDescription className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Track your problem-solving journey
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Problems Solved
                  </span>
                  <span className={`text-lg font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {platformData?.leetcodeData?.totalSolved || 0} / {platformData?.leetcodeData?.totalQuestions || 0}
                  </span>
                </div>
                <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-full h-2.5`}>
                  {platformData?.leetcodeData && <div 
                    className="bg-indigo-500 h-2.5 rounded-full" 
                    style={{ width: `${(platformData?.leetcodeData?.totalSolved / platformData?.leetcodeData?.totalQuestions * 100) || 0}%` }}
                  ></div>}
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className={`p-3 ${
                    isDarkMode 
                      ? 'bg-green-500/20 border border-green-500/30' 
                      : 'bg-green-50'
                  } rounded-lg`}>
                    <div className={`text-xs ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>Easy</div>
                    <div className={`text-lg font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-800'}`}>
                      {platformData?.leetcodeData?.easySolved || 0} 
                      <span className={`text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>/{platformData?.leetcodeData?.totalEasy || 0}</span>
                    </div>
                    <div className={`w-full ${isDarkMode ? 'bg-green-900/30' : 'bg-green-200'} rounded-full h-1.5 mt-1`}>
                      {platformData?.leetcodeData && <div 
                        className="bg-green-500 h-1.5 rounded-full" 
                        style={{ width: `${getLeetCodeDifficultyPercentage(platformData?.leetcodeData?.easySolved, platformData?.leetcodeData?.totalEasy)}%` }}
                      ></div>}
                    </div>
                  </div>
                  <div className={`p-3 ${
                    isDarkMode 
                      ? 'bg-amber-500/20 border border-amber-500/30' 
                      : 'bg-amber-50'
                  } rounded-lg`}>
                    <div className={`text-xs ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>Medium</div>
                    <div className={`text-lg font-semibold ${isDarkMode ? 'text-amber-400' : 'text-amber-800'}`}>
                      {platformData?.leetcodeData?.mediumSolved || 0}
                      <span className={`text-xs ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>/{platformData?.leetcodeData?.totalMedium || 0}</span>
                    </div>
                    <div className={`w-full ${isDarkMode ? 'bg-amber-900/30' : 'bg-amber-200'} rounded-full h-1.5 mt-1`}>
                      {platformData?.leetcodeData && <div 
                        className="bg-amber-500 h-1.5 rounded-full" 
                        style={{ width: `${getLeetCodeDifficultyPercentage(platformData?.leetcodeData?.mediumSolved, platformData?.leetcodeData?.totalMedium)}%` }}
                      ></div>}
                    </div>
                  </div>
                  <div className={`p-3 ${
                    isDarkMode 
                      ? 'bg-red-500/20 border border-red-500/30' 
                      : 'bg-red-50'
                  } rounded-lg`}>
                    <div className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>Hard</div>
                    <div className={`text-lg font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-800'}`}>
                      {platformData?.leetcodeData?.hardSolved || 0}
                      <span className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>/{platformData?.leetcodeData?.totalHard || 0}</span>
                    </div>
                    <div className={`w-full ${isDarkMode ? 'bg-red-900/30' : 'bg-red-200'} rounded-full h-1.5 mt-1`}>
                      {platformData?.leetcodeData && <div 
                        className="bg-red-500 h-1.5 rounded-full" 
                        style={{ width: `${getLeetCodeDifficultyPercentage(platformData?.leetcodeData?.hardSolved, platformData?.leetcodeData?.totalHard)}%` }}
                      ></div>}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className={`${isDarkMode ? 'border-gray-700' : 'border-gray-100'} border-t pt-4`}>
              <div className="flex justify-between items-center w-full">
                <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span className="font-medium">Global Rank:</span> #{platformData?.leetcodeData?.ranking || 'N/A'}
                </div>
                <Link href={`https://leetcode.com/u/${platformData?.leetcodeData?.leetcodeUsername}/`} target='_blank'>
                <Button variant={!isDarkMode ? "outline" : "ghost"} size="sm" className={`${
                  isDarkMode 
                    ? 'border-gray-600 text-indigo-400 hover:bg-gray-700' 
                    : 'border-gray-200 hover:bg-indigo-50 text-indigo-600'
                }`}>
                  View Profile <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
                </Link>
              </div>
            </CardFooter>
          </Card>}

          {/* Codeforces card */}
         {loadingPlatformData ? <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border rounded-lg shadow-sm p-6 animate-pulse`}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className={`h-5 w-5 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
        <div className={`h-6 w-36 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
      </div>
      <div className={`h-4 w-4 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
    </div>
    <div className={`h-4 w-52 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded mb-6`}></div>
    
    <div className="flex flex-col items-center justify-center p-6">
      <div className={`w-32 h-32 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full mb-4`}></div>
      <div className={`h-4 w-40 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded mb-6`}></div>
      <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-1.5 mb-1`}>
        <div className={`${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} h-1.5 rounded-full w-1/4`}></div>
      </div>
      <div className="flex justify-between w-full mt-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`h-3 w-8 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded`}></div>
        ))}
      </div>
    </div>
  </div> :  <Card className={`${
           isDarkMode 
             ? 'bg-gray-800/90 border-gray-700' 
             : 'bg-white/90 border-gray-100'
         } shadow-sm hover:shadow-md transition-all`}>
            <CardHeader className={`${isDarkMode ? 'border-gray-700' : 'border-gray-100'} border-b pb-4`}>
              <div className="flex items-center justify-between">
                <CardTitle className={`text-xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} flex items-center gap-2`}>
                  <Activity className="h-5 w-5 text-teal-500" />
                  Codeforces Rating
                </CardTitle>
                <ExternalLink className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              <CardDescription className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Track your competitive programming progress
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col items-center justify-center p-6">
                <div className="relative w-32 h-32 rounded-full flex items-center justify-center mb-4">
                  {/* Outer ring */}
                  <div className={`absolute inset-0 border-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} rounded-full`}></div>
                  {/* Progress ring */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                    <circle 
                      cx="50" cy="50" r="46" 
                      fill="none" 
                      stroke="rgb(20, 184, 166)" 
                      strokeWidth="8" 
                      strokeDasharray="289.27"
                      strokeDashoffset={(289.27 * (1 - Math.min((platformData?.codeforcesData?.rating || 0) / 2000, 1)))}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  {/* Rating value */}
                  <div className={`text-3xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {platformData?.codeforcesData?.rating || 0}
                  </div>
                </div>

                <div className={`text-sm text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
                  Keep practicing to improve your rating!
                </div>

                <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-full h-1.5 mt-6`}>
                  <div 
                    className="bg-teal-500 h-1.5 rounded-full" 
                    style={{ width: `${Math.min((platformData?.codeforcesData?.rating || 0) / 20, 100)}%` }}
                  ></div>
                </div>

                <div className={`flex justify-between w-full text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  <span>0</span>
                  <span>500</span>
                  <span>1000</span>
                  <span>1500</span>
                  <span>2000+</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className={`${isDarkMode ? 'border-gray-700' : 'border-gray-100'} border-t pt-4`}>
            <Link href={`https://codeforces.com/profile/${platformData?.codeforcesData?.codeforcesUsername}`} target='_blank'>
              <Button variant={!isDarkMode ? "outline" : "ghost"} size="sm" className={`ml-auto ${
                isDarkMode 
                  ? 'border-gray-600 text-teal-400 hover:bg-teal-900/50' 
                  : 'border-gray-200 hover:bg-teal-50 text-teal-600'
              }`}>
                View Profile <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
            </CardFooter>
          </Card>}
        </div>

        {/* Latest Contests */}
        {loadingContest ?  <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border rounded-lg shadow-sm animate-pulse`}>
    <div className={`${isDarkMode ? 'border-gray-700' : 'border-gray-100'} border-b p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className={`h-5 w-5 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
            <div className={`h-6 w-32 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
          </div>
          <div className={`h-4 w-48 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded`}></div>
        </div>
        <div className={`h-8 w-8 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
      </div>
    </div>
    <div className="p-6">
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`rounded-lg ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} border overflow-hidden`}>
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} px-4 py-3 flex justify-between items-center`}>
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full`}></div>
                <div>
                  <div className={`h-4 w-32 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded mb-1`}></div>
                  <div className={`h-3 w-24 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded`}></div>
                </div>
              </div>
              <div className={`h-6 w-16 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full`}></div>
            </div>
            <div className={`px-4 py-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} flex justify-between items-center`}>
              <div className="flex items-center gap-3">
                <div className={`px-3 py-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
                  <div className={`h-3 w-12 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded mb-1`}></div>
                  <div className={`h-4 w-8 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
                </div>
              </div>
              <div className={`h-8 w-24 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div> : <Card className={`${
          isDarkMode 
            ? 'bg-gray-800/90 border-gray-700' 
            : 'bg-white/90 border-gray-100'
        } shadow-sm hover:shadow-md transition-all`}>
          <CardHeader className={`${isDarkMode ? 'border-gray-700' : 'border-gray-100'} border-b pb-4`}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className={`text-xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} flex items-center gap-2`}>
                  <Award className="h-5 w-5 text-indigo-500" />
                  Latest Contests
                </CardTitle>
                <CardDescription className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Ready for your next challenge?
                </CardDescription>
              </div>
              <Button variant={!isDarkMode ? "outline" : "ghost"} size="icon" className={`${
                isDarkMode 
                  ? 'border-gray-600 hover:bg-gray-700' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <Clock className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {dashboardData?.contests.map((contest) => (
                <div key={contest.id} className={`rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} overflow-hidden`}>
                  <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} px-4 py-3 flex justify-between items-center`}>
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-full ${
                        isDarkMode 
                          ? 'bg-indigo-900/50 text-indigo-400' 
                          : 'bg-indigo-100 text-indigo-600'
                      } flex items-center justify-center`}>
                        #{contest.id}
                      </div>
                      <div>
                        <h3 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{contest.name}</h3>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1`}>
                          <Calendar className="h-3 w-3" /> 
                          {formatDate(contest.startTime)}
                          <span className="mx-1">•</span>
                          <Timer className="h-3 w-3" /> 
                          {formatTime(contest.startTime)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={contest.status} />
                  </div>
                  <div className={`px-4 py-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} flex flex-wrap md:flex-nowrap justify-between items-center gap-4`}>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-2 ${
                        isDarkMode 
                          ? 'bg-blue-500/20 border border-blue-500/30' 
                          : 'bg-blue-50'
                      } rounded-lg`}>
                        <p className={`text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Duration</p>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>{contest.duration} min</p>
                      </div>
                      {contest.status === 'COMPLETED' && (
                        <div className={`px-3 py-2 ${
                          isDarkMode 
                            ? 'bg-green-500/20 border border-green-500/30' 
                            : 'bg-green-50'
                        } rounded-lg`}>
                          <p className={`text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>Completed</p>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}><Check className='size-5'/></p>
                        </div>
                      )}
                    </div>
                    
                    {contest.status === 'ACTIVE' && (
                      <Button 
                      variant={!isDarkMode ? "outline" : "ghost"}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-md transition-all"
                        onClick={() => router.push(`/contest/${contest.id}`)}
                      >
                        Start Contest <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    )}
                    {contest.status === 'COMPLETED' && (
                      <Button 
                        variant={!isDarkMode ? "outline" : "ghost"}
                        className={`${
                          isDarkMode 
                            ? 'border-gray-600 text-indigo-400 hover:bg-indigo-900/50' 
                            : 'border-gray-200 hover:bg-indigo-50 text-indigo-600'
                        }`}
                        onClick={() => router.push(`/contestsPage`)}
                      >
                        View Results <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    )}
                    {contest.status === 'INACTIVE' && (
                      <Button 
                        variant={!isDarkMode ? "outline" : "ghost"}
                        className={`${
                          isDarkMode 
                            ? 'border-gray-600 text-gray-400 opacity-50 cursor-not-allowed' 
                            : 'border-gray-200 hover:bg-gray-50 text-gray-600 opacity-50 cursor-not-allowed'
                        }`}
                        disabled
                      >
                        Coming Soon <Clock className="ml-1 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>}

        {/* Team Members */}
        {dashboardData?.userStats.groupName ? (
          <Card className={`${
            isDarkMode 
              ? 'bg-gray-800/90 border-gray-700' 
              : 'bg-white/90 border-gray-100'
          } shadow-sm hover:shadow-md transition-all`}>
            <CardHeader className={`${isDarkMode ? 'border-gray-700' : 'border-gray-100'} border-b pb-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={`text-xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} flex items-center gap-2`}>
                    <Users className="h-5 w-5 text-amber-500" />
                    Team: {dashboardData.userStats.groupName}
                  </CardTitle>
                  <CardDescription className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Team score: {dashboardData.userStats.groupPoints} points
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  className="p-0 hover:bg-transparent"
                  onClick={async () => {
                    try{
                      setLoadingMembers(true)
                      const response = await axios.get('/api/getGroupMembersForMember');
                      if(response.status !== 200){{
                        toast.error('Error fethcing members')
                      }}
                      setMembers(response.data.members);  
                      setShowTeamMembers(!showTeamMembers)

                    } catch (error){
                      console.error('Error fetching team members:', error);
                      toast.error('Failed to fetch team members');
                    } finally {
                      setShowTeamMembers(!showTeamMembers);
                      setLoadingMembers(false)
                    }
                  }}
                >
                  <ChevronDown className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} transition-transform ${showTeamMembers ? 'transform rotate-180' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            {loadingMembers ? <div className="pt-4">
    <div className={`overflow-hidden rounded-lg ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} border`}>
      <div className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'} border-b p-3`}>
        <div className="grid grid-cols-4 gap-4">
          <div className={`h-4 w-12 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
          <div className={`h-4 w-16 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
          <div className={`h-4 w-12 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded ml-auto`}></div>
          <div className={`h-4 w-20 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded ml-auto`}></div>
        </div>
      </div>
      <div>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className={`${isDarkMode ? 'border-gray-700' : 'border-gray-50'} border-b p-3 animate-pulse`}>
            <div className="grid grid-cols-4 gap-4 items-center">
              <div className="text-center">
                <div className={`h-5 w-5 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full mx-auto`}></div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full`}></div>
                <div className={`h-4 w-24 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
              </div>
              <div className="text-right">
                <div className={`h-4 w-12 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded mx-auto`}></div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <div className={`h-4 w-8 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded`}></div>
                <div className={`w-16 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-full h-1.5 overflow-hidden`}>
                  <div className={`${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} h-1.5 rounded-full w-1/2`}></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div> : showTeamMembers && (
            <CardContent className="pt-4">
              <div className={`overflow-hidden rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <Table>
                  <TableHeader>
                    <TableRow className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'} border-b`}>
                      <TableHead className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Rank</TableHead>
                      <TableHead className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Member</TableHead>
                      <TableHead className={`text-right ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Points</TableHead>
                      <TableHead className={`text-right ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Contribution</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members
                      .sort((a, b) => b.individualPoints - a.individualPoints)
                      .map((member, index) => {
                        const totalPoints = dashboardData.userStats.groupPoints || 1;
                        const contribution = Math.round((member.individualPoints / totalPoints) * 100);
                        
                        return (
                          <TableRow 
                            key={member.username} 
                            className={cn(
                              `${isDarkMode ? 'border-gray-700' : 'border-gray-50'} border-b`,
                              member.username === dashboardData.username ? (isDarkMode ? "bg-amber-900/30" : "bg-amber-50") : ""
                            )}
                          >
                            <TableCell className="py-3 text-center">
                              <div className="flex justify-center items-center">
                                {index === 0 ? (
                                  <Crown className="h-5 w-5 text-amber-500" />
                                ) : (
                                  <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                    {index + 1}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="flex items-center gap-2">
                                <div className={`h-8 w-8 ${isDarkMode ? 'bg-amber-900/50' : 'bg-amber-100'} rounded-full flex items-center justify-center ${isDarkMode ? 'text-amber-300' : 'text-amber-700'} font-bold`}>
                                  {member.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <Link href={`/user/updateProfile/${member.username}`} target='_blank'>
                                  <p className={`font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>{member.username}</p>
                                  </Link>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className={`py-3 text-right font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                              {member.individualPoints}
                            </TableCell>
                            <TableCell className="py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{contribution}%</span>
                                <div className={`w-16 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-full h-1.5`}>
                                  <div 
                                    className="bg-amber-500 h-1.5 rounded-full" 
                                    style={{ width: `${contribution}%` }}
                                  ></div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          )}
          <CardFooter className={`${isDarkMode ? 'border-gray-700' : 'border-gray-100'} border-t pt-4 flex justify-between`}>
            <Button onClick={() => {
              router.push('/groupCreation')
            }} variant={!isDarkMode ? "outline" : "ghost"} size="sm" className={`${
              isDarkMode 
                ? 'border-gray-600 text-amber-400 hover:bg-amber-900/50' 
                : 'border-gray-200 hover:bg-amber-50 text-amber-600'
            }`}>
              Team Settings <Settings className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className={`${
          isDarkMode 
            ? 'bg-gray-800/90 border-gray-700' 
            : 'bg-white/90 border-gray-100'
        } shadow-sm hover:shadow-md transition-all`}>
          <CardHeader className="pb-4">
            <CardTitle className={`text-xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} flex items-center gap-2`}>
              <Users className="h-5 w-5 text-blue-500" />
              Join a Team
            </CardTitle>
            <CardDescription className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Teams can earn more points and unlock special challenges
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col items-center justify-center p-8">
            <div className={`h-24 w-24 ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-50'} rounded-full flex items-center justify-center mb-4`}>
              <UsersIcon className={`h-12 w-12 ${isDarkMode ? 'text-blue-400' : 'text-blue-300'}`} />
            </div>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-2`}>Collaborate with others</h3>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-center mb-6 max-w-md`}>
              Join a team to collaborate with other developers, participate in team challenges, and climb the leaderboard together.
            </p>
          </CardContent>
        </Card>
      )}
    </>

  </div>
</div>
);
}