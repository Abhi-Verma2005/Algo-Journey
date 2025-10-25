'use client';
import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, User, Users, ChevronLeft, ChevronRight, Trophy, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import useStore from "@/store/store";

interface User {
  id: string;
  username: string;
  weeklyPoints: number;
  rank?: number;
  avatar?: string;
}

interface Group {
  id: string;
  name: string;
  groupPoints: number;
  coordinatorName: string;
  memberCount: number;
  rank?: number;
}

const fetchLeaderboardData = async (endpoint: string, weekOffset: number = 0) => {
  const response = await axios.post(endpoint, { weekOffset });
  return response.data;
};
const getRankColor = (rank: number) => {
  switch(rank) {
    case 1: return "bg-yellow-200 text-black";
    case 2: return "bg-pink-300 text-black";
    case 3: return "bg-blue-400 text-black";
    default: return "bg-zinc-500 text-white";
  }
};

const getTrophyColor = (rank: number) => {
  switch(rank) {
    case 1: return "text-yellow-200";
    case 2: return "text-pink-300";
    case 3: return "text-blue-400";
    default: return "text-zinc-500";
  }
};

const WeekSelector = ({ 
  weekOffset, 
  setWeekOffset,
  isLoading,
  isDarkMode
}: { 
  weekOffset: number;
  setWeekOffset: (offset: number) => void;
  isLoading: boolean;
  isDarkMode: boolean;
}) => {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - (weekOffset * 7));
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  
   return (
    <div className={`flex items-center rounded-2xl shadow-none justify-between mb-6 ${isDarkMode ? 'bg-[#262626]' : 'bg-white/90'} p-4`}>
      <Button
        variant={isDarkMode ? "outline" : "ghost"}
        size="sm"
        onClick={() => setWeekOffset(weekOffset + 1)}
        disabled={isLoading}
        className={`${isDarkMode ? 'bg-[#404040] text-white border-0 shadow-none' : 'hover:bg-zinc-100'}`}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Previous Week
      </Button>
      
      <div className={`flex items-center gap-3 text-sm ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
    <Calendar className={`h-5 w-5 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`} />
        <span className="font-medium">Week of {startOfWeek.toLocaleDateString()}</span>
      </div>

      <Button
        variant={isDarkMode ? "outline" : "ghost"}
        size="sm"
        onClick={() => setWeekOffset(weekOffset - 1)}
        disabled={weekOffset === 0 || isLoading}
        className={`${isDarkMode ? 'bg-[#404040] text-white border-0 shadow-none' : 'hover:bg-zinc-100'}`}
      >
        Next Week
        <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
};

const GroupRankings = ({ groups, isDarkMode }: { groups: Group[] | undefined; isDarkMode: boolean }) => {
  if (!groups || groups.length === 0) {
    return (
      <div className={`text-center py-8 ${isDarkMode ? 'text-zinc-400 bg-[#262626]' : 'text-zinc-500 bg-white/90'} rounded-lg shadow-none`}>
        <Trophy className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
        No group rankings available
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {groups.map((group, index) => (
        <div 
          key={group.id} 
          className={`flex items-center p-4 ${isDarkMode ? 'bg-[#262626]' : 'bg-white/90'} rounded-xl transition-all`}
        >
          <div 
            className={`${getRankColor(index + 1)} w-10 h-10 flex items-center justify-center rounded-full mr-4 text-lg font-bold`}
          >
            {index + 1}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Users className={`h-5 w-5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
              <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>{group.name}</p>
            </div>
            <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'} mt-1`}>
              Coordinator: {group.coordinatorName} • {group.memberCount} Members
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-zinc-400" />
            <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>
              {group.groupPoints} pts
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};


const WeeklyRankings = ({ users, isDarkMode }: { users: User[] | undefined; isDarkMode: boolean }) => {
  const { isAdmin } = useStore()
  if (!users || users.length === 0) {
    return (
      <div className={`text-center py-8 ${isDarkMode ? 'text-zinc-400 bg-[#262626]' : 'text-zinc-500 bg-white/90'} rounded-x`}>
  <Trophy className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
        No rankings available for this week
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user, index) => (
        <div 
          key={user.id} 
          className={`flex items-center p-4 ${isDarkMode ? 'bg-[#262626]' : 'bg-white/90'} rounded-xl transition-all`}
        >
          <div 
            className={`${getRankColor(index + 1)} w-10 h-10 flex items-center justify-center rounded-full mr-4 text-lg font-bold`}
          >
            {index + 1}
          </div>
          <div className="flex-1 flex items-center gap-3">
            {/* <User className={`h-5 w-5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} /> */}
            {isAdmin ? <Link href={`/user/updateProfile/${user.username}`} target="_blank">
              <p className={`font-semibold ${isDarkMode ? 'text-zinc-300 hover:text-zinc-200' : 'text-zinc-800 hover:text-zinc-900'} transition-colors`}>
                {user.username}
              </p>
            </Link> : <p className={`font-semibold ${isDarkMode ? 'text-zinc-300 hover:text-zinc-200' : 'text-zinc-800 hover:text-zinc-900'} transition-colors`}>
                {user.username}
              </p>}
          </div>
          <div className="flex items-center gap-2">
            <Trophy className={`h-5 w-5 ${isDarkMode ? getTrophyColor(index + 1) : 'text-indigo-500'}`} />
            <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#262626]'}`}>
              {user.weeklyPoints} pts
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

const LoadingState = ({ message, isDarkMode }: { message: string; isDarkMode: boolean }) => (
  <div className={`flex items-center justify-center py-8 ${isDarkMode ? 'bg-[#262626]' : 'bg-white/90'} rounded-lg shadow-none`}>
    <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-indigo-400' : 'border-indigo-500'} mr-3`}></div>
    <span className={`${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>{message}</span>
  </div>
);

const LeaderboardPage = () => {
  const { isDarkMode } = useStore()
  const [leaderboardType, setLeaderboardType] = useState("group");
  const [weekOffset, setWeekOffset] = useState(0);

  const { data: groupData, isLoading: groupLoading, error: groupError } = useQuery({
    queryKey: ["groupLeaderboard"],
    queryFn: () => fetchLeaderboardData("/api/leaderboard/groups"),
  });

  const { data: weeklyData, isLoading: weeklyLoading, error: weeklyError } = useQuery({
    queryKey: ["weeklyLeaderboard", weekOffset],
    queryFn: () => fetchLeaderboardData("/api/leaderboard/weekly", weekOffset),
  });

  const renderContent = (type: string, isDarkMode: boolean) => {
  if (type === "group") {
    if (groupLoading) return <LoadingState message="Loading group rankings..." isDarkMode={isDarkMode} />;
    if (groupError) return <div className={`text-center py-8 text-red-500 ${isDarkMode ? 'bg-red-900/50' : 'bg-red-50'} rounded-lg`}>Error loading group rankings</div>;
    return <GroupRankings groups={groupData} isDarkMode={isDarkMode} />;
  } else {
    if (weeklyLoading) return <LoadingState message="Loading weekly rankings..." isDarkMode={isDarkMode} />;
    if (weeklyError) return <div className={`text-center py-8 text-red-500 ${isDarkMode ? 'bg-red-900/50' : 'bg-red-50'} rounded-lg`}>Error loading weekly rankings</div>;
    return (
      <>
        <WeekSelector 
          weekOffset={weekOffset} 
          setWeekOffset={setWeekOffset}
          isLoading={weeklyLoading}
          isDarkMode={isDarkMode}
        />
        <WeeklyRankings users={weeklyData} isDarkMode={isDarkMode} />
      </>
    );
  }
};

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0A0A0A]' : 'bg-white'} transition-colors duration-300`}>
      <div className="container mx-auto px-4 py-8 md:py-30 pt-20 space-y-8">
        <Card className={`rounded-3xl shadow-none border-0 ${isDarkMode ? 'bg-[#191919]' : 'bg-zinc-100'}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Trophy className={`h-7 w-7 ${isDarkMode ? 'text-white' : 'text-black'}`} />
              <CardTitle className={`text-2xl ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
                Competitive Programming Leaderboard
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="group"
              value={leaderboardType}
              onValueChange={setLeaderboardType}
              className="w-full"
            >
              <TabsList className={`grid w-full grid-cols-2 mb-8 ${isDarkMode ? 'bg-[#262626]' : 'bg-zinc-300'}`}>
                <TabsTrigger 
                  value="group" 
                  className={`${isDarkMode ? 'data-[state=active]:bg-[#141414] data-[state=active]:text-white text-zinc-300' : 'data-[state=active]:bg-[#141414] data-[state=active]:text-white text-black'}`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Group Rankings
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="weekly" 
                  className={`${isDarkMode ? 'data-[state=active]:bg-[#141414] data-[state=active]:text-white text-zinc-300' : 'data-[state=active]:bg-[#141414] data-[state=active]:text-white text-black'}`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Weekly Rankings
                  </div>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="group">
                {renderContent("group", isDarkMode)}
              </TabsContent>

              <TabsContent value="weekly">
                {renderContent("weekly", isDarkMode)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeaderboardPage;