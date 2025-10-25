'use client';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Filter, Users, CheckCircle, X, ChevronDown, Code, Tag, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import axios from "axios";
import Link from 'next/link';
import toast from 'react-hot-toast';
import useStore from '@/store/store';
import useTagStore from '@/store/tagsStore';

interface QuestionTag {
  id: string;
  name: string;
}

interface Question {
  id: string;
  leetcodeUrl: string | null;
  codeforcesUrl: string | null;
  difficulty: string;
  points: number;
  inContest: boolean;
  inArena: boolean;
  slug: string;
  createdAt: string;
  updatedAt: string;
  questionTags: QuestionTag[];
}

interface Group {
  id: string;
  name: string;
  coordinatorId: string;
  groupPoints: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  leetcodeUsername: string;
  isComplete: boolean;
  codeforcesUsername: string;
  section: string;
  enrollmentNum: string;
  profileUrl: string | null;
  groupId: string;
  individualPoints: number;
  createdAt: string;
  updatedAt: string;
  group: Group;
}

interface Submission {
  id: string;
  userId: string;
  questionId: string;
  contestId: number;
  score: number;
  status: string;
  createdAt: string;
  user: User;
  question: Question;
}

interface FilterState {
  topics: string[];
  teams: string[];
  difficulties: string[];
}

interface Team {
  id: string;
  name: string;
}



const ArenaLeaderboardPage = () => {
  const [filters, setFilters] = useState<FilterState>({
    topics: [],
    teams: [],
    difficulties: []
  });
  const [teams, setTeams] = useState<Team[]>([]);
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);
  const { isAdmin } = useStore()
  const { tags } = useTagStore()

  // Predefined topics
  const availableTopics = tags;

  // Predefined difficulties
  const availableDifficulties = [
    { id: "BEGINNER", name: "Beginner" },
    { id: "EASY", name: "Easy" },
    { id: "MEDIUM", name: "Medium" },
    { id: "HARD", name: "Hard" },
    { id: "VERYHARD", name: "Very Hard" }
  ];

  // Query for leaderboard data
  const { data, isLoading, error } = useQuery({
    queryKey: ['arenaLeaderboard', filters, hasAppliedFilters],
    queryFn: async () => {
        if(!isAdmin) {
            toast.error('You are not authorized to view this page');
            return [];
        }
      const response = await axios.post('/api/getArenaLeaderboard', {
        topics: filters.topics.join(','),
        teams: filters.teams.join(','),
        difficulties: filters.difficulties.join(',')
      });
      return response.data.submissions as Submission[];
    },
    enabled: hasAppliedFilters, 
  });

  const applyFilters = () => {
    setHasAppliedFilters(true);
  };

  const resetFilters = () => {
    setFilters({
      topics: [],
      teams: [],
      difficulties: []
    });
    setHasAppliedFilters(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'BEGINNER': return 'bg-blue-100 text-blue-800';
      case 'EASY': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-amber-100 text-amber-800';
      case 'HARD': return 'bg-rose-100 text-rose-800';
      case 'VERYHARD': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status?: string) => {
    if (!status) {
      return <X className="h-4 w-4 text-gray-400" />;
    }
    
    switch(status) {
      case 'ACCEPTED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'PENDING':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <X className="h-4 w-4 text-red-500" />;
    }
  };

  const formatDifficulty = (diff: string) => {
    return diff.charAt(0) + diff.slice(1).toLowerCase();
  };

  // Filter toggle handlers
  const toggleTopic = (topicId: string) => {
    setFilters(prev => ({
      ...prev,
      topics: prev.topics.includes(topicId)
        ? prev.topics.filter(id => id !== topicId)
        : [...prev.topics, topicId]
    }));
  };

  const toggleTeam = (teamId: string) => {
    setFilters(prev => ({
      ...prev,
      teams: prev.teams.includes(teamId)
        ? prev.teams.filter(id => id !== teamId)
        : [...prev.teams, teamId]
    }));
  };

  const toggleDifficulty = (difficulty: string) => {
    setFilters(prev => ({
      ...prev,
      difficulties: prev.difficulties.includes(difficulty)
        ? prev.difficulties.filter(d => d !== difficulty)
        : [...prev.difficulties, difficulty]
    }));
  };

  // Extract unique users and questions from submissions
  const getUniqueUsers = () => {
    if (!data) return [];
    const uniqueUsers = Array.from(new Map(data.map(item => [item.user.id, item.user])).values());
    return uniqueUsers.sort((a, b) => b.individualPoints - a.individualPoints);
  };

  const getUniqueQuestions = () => {
    if (!data) return [];
    return Array.from(new Map(data.map(item => [item.question.id, item.question])).values());
  };


  if (error) {
    return (
      <div className="container mx-auto p-8 pt-20 space-y-8">
        <Card className="bg-white shadow-none border-gray-100">
          <CardContent className="text-center py-12">
            <X className="h-12 w-12 mx-auto mb-3 text-rose-300" />
            <h3 className="text-xl font-medium text-gray-700 mb-1">Error loading arena leaderboard</h3>
            <p className="text-gray-500">Please try again later</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const uniqueUsers = getUniqueUsers();
  const uniqueQuestions = getUniqueQuestions();

  return (
    <div className="container mx-auto p-8 pt-20 space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Arena <span className="text-indigo-600">Leaderboard</span></h1>
          <p className="text-gray-600 mt-1">Track problem-solving progress across all users</p>
        </div>
      </div>

      {/* Selection Form Section */}
      <Card className="bg-white shadow-none border-gray-100 mb-8">
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Filter className="h-5 w-5 text-indigo-500" />
            Select Filters
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Topic Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Topics</label>
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Tag className="h-5 w-5 text-indigo-500" />
                      <div>
                        <p className="text-sm text-gray-700">
                          {filters.topics.length ? `${filters.topics.length} selected` : 'Select topics'}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2 max-h-64 overflow-y-auto" align="start">
                  <div className="space-y-2">
                    {availableTopics.map(topic => (
                      <div key={topic} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`topic-${topic}`}
                          checked={filters.topics.includes(topic)}
                          onCheckedChange={() => toggleTopic(topic)}
                        />
                        <label 
                          htmlFor={`topic-${topic}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {topic}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Team Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teams</label>
              <Popover>
                <PopoverTrigger asChild>
                  <div onClick={async() => {
                            try{
                                if(teams.length !== 0) return;  
                                const response = await axios.post('/api/getGroups');
                                if(response.status !== 200){
                                    toast.error('Error fetching teams');
                                }
                                setTeams(response.data.groups);
                            } catch(error){
                                console.error('Error fetching teams:', error);
                            }
                        }} className="flex items-center justify-between p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-indigo-500" />
                      <div>
                        <p className="text-sm text-gray-700">
                          {filters.teams.length !== 0 ? `${filters.teams.length} selected` : 'Select teams'}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2 max-h-64 overflow-y-auto" align="start">
                  <div className="space-y-2">
                    {teams.length > 0 ? (
                      teams.map(team => (
                        <div key={team.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`team-${team.id}`}
                            checked={filters.teams.includes(team.name)}
                            onCheckedChange={() => toggleTeam(team.name)}
                          />
                          <label 
                            htmlFor={`team-${team.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {team.name}
                          </label>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 py-2">Loading teams...</div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Filter className="h-5 w-5 text-indigo-500" />
                      <div>
                        <p className="text-sm text-gray-700">
                          {filters.difficulties.length ? `${filters.difficulties.length} selected` : 'Select difficulties'}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <div className="space-y-2">
                    {availableDifficulties.map(difficulty => (
                      <div key={difficulty.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`difficulty-${difficulty.id}`}
                          checked={filters.difficulties.includes(difficulty.id)}
                          onCheckedChange={() => toggleDifficulty(difficulty.id)}
                        />
                        <label 
                          htmlFor={`difficulty-${difficulty.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {difficulty.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={resetFilters}
              className="text-gray-600"
            >
              Reset
            </Button>
            <Button
              onClick={applyFilters}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {!hasAppliedFilters ? (
        <Card className="bg-white shadow-none border-gray-100">
          <CardContent className="text-center py-16">
            <Filter className="h-12 w-12 mx-auto mb-3 text-indigo-300" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">Please Select Filters</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Select your preferred topic, team, and difficulty level filters above and click &quot;Apply Filters&quot; to view the leaderboard.
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) :
      
      
      data && data.length > 0 ? (
        <Card className="bg-white shadow-none hover:shadow-none transition-all border-gray-100">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Trophy className="h-5 w-5 text-amber-500" />
              Arena Leaderboard
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-6 pb-2">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-16 py-3">Rank</TableHead>
                    <TableHead className="w-32 py-3">User</TableHead>
                    <TableHead className="w-32 py-3">Team</TableHead>
                    {uniqueQuestions.map((question) => (
                      <TableHead key={question.id} className="text-center py-3">
                        <Popover>
                          <PopoverTrigger asChild>
                            <div className="cursor-pointer font-semibold flex flex-col items-center">
                              <span>{question.slug}</span>
                              <Badge className={`mt-1 text-xs ${getDifficultyColor(question.difficulty)}`}>
                                {formatDifficulty(question.difficulty)}
                              </Badge>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-3">
                            <div className="space-y-2">
                              <h3 className="font-bold">{question.slug}</h3>
                              <div className="flex items-center space-x-2">
                                <Badge className={getDifficultyColor(question.difficulty)}>
                                  {formatDifficulty(question.difficulty)}
                                </Badge>
                                <span className="text-sm font-medium">{question.points} points</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {question.questionTags?.map(tag => (
                                  <Badge key={tag.id} variant="outline" className="text-xs">
                                    {tag.name}
                                  </Badge>
                                ))}
                              </div>
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                <Link 
                                  href={question.leetcodeUrl || question.codeforcesUrl || '#'} 
                                  target="_blank"
                                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                >
                                  View problem
                                  <Code className="h-3 w-3" />
                                </Link>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                    ))}
                    <TableHead className="text-right py-3 pr-6">Total Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uniqueUsers.map((user, index) => (
                    <TableRow key={user.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-medium py-3">{index + 1}</TableCell>
                      <Link href={`/user/updateProfile/${user.username}`} target='_blank'>
                        <TableCell className="font-medium py-3 text-blue-700">{user.username}</TableCell>
                      </Link>
                      <TableCell className="py-3">{user.group?.name || 'No Team'}</TableCell>
                      {uniqueQuestions.map((question) => {
                        const submission = data?.find(
                          (s) => s.userId === user.id && s.questionId === question.id
                        );
                        
                        return (
                          <TableCell key={question.id} className="text-center py-3">
                            <div className="flex flex-col items-center">
                              {getStatusIcon(submission?.status)}
                              <span className={`text-sm font-medium mt-1 ${submission?.status === 'ACCEPTED' ? 'text-green-600' : 'text-gray-400'}`}>
                                {submission?.score || 0}
                              </span>
                              {submission && (
                                <span className="text-xs text-gray-500">
                                  {new Date(submission.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right font-bold py-3 pr-6">
                        {user.individualPoints}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white shadow-none border-gray-100">
          <CardContent className="text-center py-16">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">No Data Found</h3>
            <p className="text-gray-500">
              No users found based on the selected filters. Try adjusting your filter criteria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ArenaLeaderboardPage;
