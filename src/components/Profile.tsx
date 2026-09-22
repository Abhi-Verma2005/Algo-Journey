import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Leetcode from '@/images/leetcode-svgrepo-com.svg'
import Codeforces from '@/images/codeforces-svgrepo-com.svg'
import {
  Trophy,
  Users,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Medal,
  Key,
  Eye,
  EyeOff,
  Save,
  Loader2
} from 'lucide-react';
import { ContestStatus, SubmissionStatus, Difficulty } from '@prisma/client';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { toast } from '@/hooks/use-toast';

// Type definitions
type QuestionTag = {
  name: string;
};

type Question = {
  id: string;
  leetcodeUrl?: string | null;
  codeforcesUrl?: string | null;
  difficulty: Difficulty;
  points: number;
  slug: string;
  questionTags: QuestionTag[];
};

type Submission = {
  id: string;
  score: number;
  status: SubmissionStatus;
  createdAt: Date;
  question: Question;
  contest?: {
    id: number;
    name: string;
    startTime: Date;
    endTime: Date;
    status: ContestStatus;
  } | null;
};

type Group = {
  id: string;
  name: string;
  groupPoints: number;
  coordinator: {
    username: string;
    email: string;
  };
};

type User = {
  id: string;
  username: string;
  email: string;
  leetcodeUsername: string;
  codeforcesUsername: string;
  section: string;
  enrollmentNum: string;
  individualPoints: number;
  profileUrl?: string | null;
  createdAt: Date;
  group?: Group | null;
  groups?: Group[];
  submissions: Submission[];
};

type Contest = {
  id: number;
  name: string;
  startTime: Date;
  endTime: Date;
  status: ContestStatus;
  submissions: Array<{
    id: string;
    score: number;
    status: SubmissionStatus;
    question: {
      slug: string;
      difficulty: Difficulty;
      points: number;
    };
  }>;
  groupPerformance?: {
    score: number;
    rank?: number;
  } | null;
};

type Summary = {
  totalSubmissions: number;
  totalContests: number;
  averageScore: number;
  completedQuestions: number;
  bestRank?: number;
  problemsByDifficulty: {
    BEGINNER: number;
    EASY: number;
    MEDIUM: number;
    HARD: number;
    VERYHARD: number
  };
};

type ProfileData = {
  user: User;
  contests: Contest[];
  summary: Summary;
};

type ApiResponse = {
  success: boolean;
  data?: ProfileData;
  error?: string;
};

// Utility functions



const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const Profile = ({ isDarkMode = false }) => {
  const params = useParams();
  const { data: session } = useSession();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // API Key states
  const [apiKey, setApiKey] = useState<string>('');
  const [apiSecret, setApiSecret] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [showApiSecret, setShowApiSecret] = useState<boolean>(false);
  const [isEditingApi, setIsEditingApi] = useState<boolean>(false);
  const [isSavingApi, setIsSavingApi] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  
  // Check if the profile being viewed is the current user's
  const isOwnProfile = session?.user?.email === profileData?.user?.email;

 const getStatusColor = (status: SubmissionStatus) => {
    const colors = {
      COMPLETED: isDarkMode ? 'text-green-400' : 'text-green-600',
      PENDING: isDarkMode ? 'text-blue-400' : 'text-blue-600',
      FAILED: isDarkMode ? 'text-red-400' : 'text-red-600'
    };
    //@ts-expect-error: no need here...
    return colors[status] || (isDarkMode ? 'text-slate-400' : 'text-slate-600');
  };
  const getDifficultyColor = (difficulty: Difficulty) => {
    const colors = {
      BEGINNER: isDarkMode 
        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
        : 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
      EASY: isDarkMode 
        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
        : 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
      MEDIUM: isDarkMode 
        ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
        : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
      HARD: isDarkMode 
        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
        : 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
      VERYHARD: isDarkMode 
        ? 'bg-red-700/20 text-red-300 hover:bg-red-700/30' 
        : 'bg-red-700/10 text-red-700 hover:bg-red-700/20'
    };
    return colors[difficulty] || (isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700');
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get<ApiResponse>(`/api/getProfileDetails/${params.username}`);
        if (response.data.success && response.data.data) {
          setProfileData(response.data.data);
        } else {
          setError(response.data.error || 'Failed to load profile data');
        }
      } catch (error) {
        console.log(error)
        setError('An error occurred while fetching profile data');
      } finally {
        setLoading(false);
      }
    };

    if (params.username) {
      fetchProfile();
    }
  }, [params.username]);

  // Fetch API key status if viewing own profile
  useEffect(() => {
    const fetchApiKeyStatus = async () => {
      if (isOwnProfile) {
        try {
          const response = await axios.get('/api/user/codeforces-api');
          if (response.data.hasApiKey) {
            setHasApiKey(true);
            setApiKey(response.data.apiKey || '');
            setApiSecret(response.data.apiSecret || '');
          }
        } catch (error) {
          console.error('Error fetching API key status:', error);
        }
      }
    };

    fetchApiKeyStatus();
  }, [isOwnProfile]);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      toast({
        title: "Error",
        description: "Both API key and secret are required",
        variant: "destructive",
      });
      return;
    }

    setIsSavingApi(true);
    try {
      const response = await axios.post('/api/user/codeforces-api', {
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
      });

      if (response.data.hasApiKey) {
        setHasApiKey(true);
        setIsEditingApi(false);
        toast({
          title: "Success",
          description: "Codeforces API keys saved successfully",
        });
      }
    } catch (error) {
      console.error('Error saving API keys:', error);
      toast({
        title: "Error",
        description: "Failed to save API keys. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingApi(false);
    }
  };

  const handleRemoveApiKey = async () => {
    setIsSavingApi(true);
    try {
      await axios.post('/api/user/codeforces-api', {
        apiKey: null,
        apiSecret: null,
      });

      setHasApiKey(false);
      setApiKey('');
      setApiSecret('');
      setIsEditingApi(false);
      toast({
        title: "Success",
        description: "Codeforces API keys removed successfully",
      });
    } catch (error) {
      console.error('Error removing API keys:', error);
      toast({
        title: "Error",
        description: "Failed to remove API keys. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingApi(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (error || !profileData) return <div className="flex items-center justify-center min-h-screen">{error || 'Profile not found'}</div>;

  const { user, contests, summary } = profileData;

 return (
    <div className={`container mx-auto px-4 py-8 max-w-7xl ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex flex-col">
        {/* Profile Overview */}
        <Card className={`lg:col-span-1 ${isDarkMode ? 'bg-slate-800 border-slate-700' : ''}`}>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-slate-700' : 'bg-slate-100'
              }`}>
                <User className={`h-8 w-8 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`} />
              </div>
              <div>
                <CardTitle className={isDarkMode ? 'text-white' : ''}>{user.username}</CardTitle>
                <CardDescription className={isDarkMode ? 'text-slate-400' : ''}>{user.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-200' : ''}`}>Profile Info</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className={`h-4 w-4 ${isDarkMode ? 'text-slate-400' : ''}`} />
                  <span className={`text-sm ${isDarkMode ? 'text-slate-300' : ''}`}>{user.section} • {user.enrollmentNum}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <span className={`text-sm ${isDarkMode ? 'text-slate-300' : ''}`}>Points: {user.individualPoints}</span>
                </div>
              </div>
            </div>

            {((user.groups && user.groups.length > 0) || user.group) && (
              <div>
                <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-200' : ''}`}>
                  {(user.groups && user.groups.length > 1) ? 'Groups Information' : 'Group Information'}
                </h3>
                <div className="space-y-3">
                  {(user.groups && user.groups.length > 0 ? user.groups : user.group ? [user.group] : []).map((grp) => (
                    <div key={grp.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className={`h-4 w-4 ${isDarkMode ? 'text-slate-400' : ''}`} />
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : ''}`}>{grp.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Medal className={`h-4 w-4 ${isDarkMode ? 'text-slate-400' : ''}`} />
                        <span className={`text-sm ${isDarkMode ? 'text-slate-300' : ''}`}>Group Points: {grp.groupPoints}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className={`h-4 w-4 ${isDarkMode ? 'text-slate-400' : ''}`} />
                        <span className={`text-sm ${isDarkMode ? 'text-slate-300' : ''}`}>Coordinator: {grp.coordinator.username}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-200' : ''}`}>Problem Statistics</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className={`p-2 rounded-lg text-center ${
                  isDarkMode ? 'bg-green-900/30' : 'bg-green-50'
                }`}>
                  <div className={`text-xs ${isDarkMode ? 'text-green-400' : 'text-green-500'}`}>Beginner</div>
                  <div className={`font-medium ${isDarkMode ? 'text-white' : ''}`}>{summary.problemsByDifficulty.BEGINNER}</div>
                </div>
                <div className={`p-2 rounded-lg text-center ${
                  isDarkMode ? 'bg-green-800/30' : 'bg-green-100'
                }`}>
                  <div className={`text-xs ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>Easy</div>
                  <div className={`font-medium ${isDarkMode ? 'text-white' : ''}`}>{summary.problemsByDifficulty.EASY}</div>
                </div>
                <div className={`p-2 rounded-lg text-center ${
                  isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'
                }`}>
                  <div className={`text-xs ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>Medium</div>
                  <div className={`font-medium ${isDarkMode ? 'text-white' : ''}`}>{summary.problemsByDifficulty.MEDIUM}</div>
                </div>
                <div className={`p-2 rounded-lg text-center ${
                  isDarkMode ? 'bg-red-900/30' : 'bg-red-50'
                }`}>
                  <div className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>Hard</div>
                  <div className={`font-medium ${isDarkMode ? 'text-white' : ''}`}>{summary.problemsByDifficulty.HARD}</div>
                </div>
                <div className={`p-2 rounded-lg text-center ${
                  isDarkMode ? 'bg-red-800/30' : 'bg-red-100'
                }`}>
                  <div className={`text-xs ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>Very Hard</div>
                  <div className={`font-medium ${isDarkMode ? 'text-white' : ''}`}>{summary.problemsByDifficulty.VERYHARD}</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-200' : ''}`}>Platform Links</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Image src={Leetcode} alt='leetcodeImage' className='size-4'/>
                  <Link href={`https://leetcode.com/u/${user.leetcodeUsername}/`} target='_blank'>
                    <span className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>{user.leetcodeUsername}</span>
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                <Image src={Codeforces} alt='codeforcesImage' className='size-4'/>
                  <Link href={`https://codeforces.com/profile/${user.codeforcesUsername}`} target='_blank'>
                    <span className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>{user.codeforcesUsername}</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Codeforces API Configuration Section - Only for own profile */}
            {isOwnProfile && (
              <div className={`border-t pt-4 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-medium flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : ''}`}>
                    <Key className="h-4 w-4" />
                    Codeforces API Keys
                  </h3>
                  {hasApiKey && !isEditingApi && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingApi(true)}
                      className={isDarkMode ? 'border-slate-600 text-slate-300' : ''}
                    >
                      Edit
                    </Button>
                  )}
                </div>

                {!hasApiKey || isEditingApi ? (
                  <div className="space-y-3">
                    <div>
                      <label className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>API Key</label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type={showApiKey ? 'text' : 'password'}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="Enter your API key"
                          className={`flex-1 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className={isDarkMode ? 'border-slate-600' : ''}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>API Secret</label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type={showApiSecret ? 'text' : 'password'}
                          value={apiSecret}
                          onChange={(e) => setApiSecret(e.target.value)}
                          placeholder="Enter your API secret"
                          className={`flex-1 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowApiSecret(!showApiSecret)}
                          className={isDarkMode ? 'border-slate-600' : ''}
                        >
                          {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Get your API keys from{' '}
                      <Link href="https://codeforces.com/settings/api" target="_blank" className="text-blue-500 hover:underline">
                        Codeforces API Settings
                      </Link>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveApiKey}
                        disabled={isSavingApi}
                        className="flex-1"
                      >
                        {isSavingApi ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                      {isEditingApi && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsEditingApi(false);
                              // Reset to original values if they exist
                              if (!hasApiKey) {
                                setApiKey('');
                                setApiSecret('');
                              }
                            }}
                            className={isDarkMode ? 'border-slate-600' : ''}
                          >
                            Cancel
                          </Button>
                          {hasApiKey && (
                            <Button
                              variant="destructive"
                              onClick={handleRemoveApiKey}
                              disabled={isSavingApi}
                            >
                              Remove
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
                    <p className={`text-sm flex items-center gap-2 ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                      <CheckCircle className="h-4 w-4" />
                      API keys configured
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className='mt-2'>
          <Tabs defaultValue="submissions">
            <TabsList className={isDarkMode ? 'bg-slate-800 border-slate-700' : ''}>
              <TabsTrigger value="submissions" className={isDarkMode ? 'data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400' : ''}>Submissions</TabsTrigger>
              <TabsTrigger value="contests" className={isDarkMode ? 'data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400' : ''}>Contests</TabsTrigger>
            </TabsList>

            <TabsContent value="submissions" className="space-y-4">
              {user.submissions.map((submission) => (
                <Card key={submission.id} className={isDarkMode ? 'bg-slate-800 border-slate-700' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className={`text-base ${isDarkMode ? 'text-white' : ''}`}>{submission.question.slug}</CardTitle>
                        <Badge variant="secondary" className={getDifficultyColor(submission.question.difficulty)}>
                          {submission.question.difficulty}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {submission.status === 'ACCEPTED' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className={getStatusColor(submission.status)}>{submission.status}</span>
                      </div>
                    </div>
                    <CardDescription className={isDarkMode ? 'text-slate-400' : ''}>
                      Score: {submission.score} • {formatDate(submission.createdAt)}
                      {submission.question.questionTags.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {submission.question.questionTags.map(tag => (
                            <Badge key={tag.name} variant="outline" className={isDarkMode ? 'border-slate-600 text-slate-300' : ''}>{tag.name}</Badge>
                          ))}
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="contests" className="space-y-4">
              {contests.map((contest) => (
                <Card key={contest.id} className={isDarkMode ? 'bg-slate-800 border-slate-700' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-base ${isDarkMode ? 'text-white' : ''}`}>{contest.name}</CardTitle>
                      <Badge variant="secondary" className={isDarkMode ? 'bg-slate-700 text-slate-300' : ''}>
                        {contest.status}
                      </Badge>
                    </div>
                    <CardDescription className={isDarkMode ? 'text-slate-400' : ''}>
                      {formatDate(contest.startTime)} - {formatDate(contest.endTime)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-200' : ''}`}>Submissions</h4>
                        {contest.submissions.map((sub) => (
                          <div key={sub.id} className="flex items-center justify-between py-1">
                            <span className={`text-sm ${isDarkMode ? 'text-slate-300' : ''}`}>{sub.question.slug}</span>
                            <Badge variant="secondary" className={getDifficultyColor(sub.question.difficulty)}>
                              {sub.score}/{sub.question.points}
                            </Badge>
                          </div>
                        ))}
                      </div>
                      {contest.groupPerformance && (
                        <div>
                          <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-200' : ''}`}>Group Performance</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className={`text-sm ${isDarkMode ? 'text-slate-300' : ''}`}>Score</span>
                              <span className={`font-medium ${isDarkMode ? 'text-white' : ''}`}>{contest.groupPerformance.score}</span>
                            </div>
                            {contest.groupPerformance.rank && (
                              <div className="flex items-center justify-between">
                                <span className={`text-sm ${isDarkMode ? 'text-slate-300' : ''}`}>Rank</span>
                                <span className={`font-medium ${isDarkMode ? 'text-white' : ''}`}>#{contest.groupPerformance.rank}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};


export default Profile;