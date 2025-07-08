'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useParams } from 'next/navigation';
import { ExternalLink, Check, Loader2, CheckCircle, BookmarkPlus, Bookmark } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Difficulty } from '@prisma/client';
import { fetchLatestSubmissionsCodeForces, fetchLatestSubmissionsLeetCode } from '@/serverActions/fetch';
import axios from 'axios';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from './ui/skeleton';
import useStore from '@/store/store';
import useTagStore from '@/store/tagsStore';
import HintsComponent from './Modals/Hints';

interface Question {
  id: string;
  contestId: number;
  slug: string;
  difficulty: Difficulty;
  points: number;
  isSolved: boolean;
  isBookmarked: boolean; // Add this line
  leetcodeUrl: string | null;
  codeforcesUrl: string | null;
  questionTags: QuestionTag[];
  index: number;
  submissions?: {
    status: string;
    score: number;
  }[];
}

interface AnyTag {
  id: string,
  name: string
}

interface LeetCodeSubmission {
  titleSlug: string;
  statusDisplay: string;
  timestamp: string;
}

interface CodeForcesSubmission {
  problem: {
    name: string;
  };
  verdict: string;
  creationTimeSeconds: number;
}

interface QuestionTag {
  id: string;
  name: string;
}



const DIFFICULTIES = [
  { value: 'ALL', label: 'All Difficulties' },
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
  { value: 'VERYHARD', label: 'Very Hard' },
];

const QuestionSolving = () => {
  const { setTags } = useTagStore()
  const { isDarkMode } = useStore();
  const [localTags, setLocalTags] = useState<string[]>([]); 
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState<boolean>(false);
  const { array } = useParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [isBookmarking, setIsBookmarking] = useState<{ [key: string]: boolean }>({});
  const [solvedProblems, setSolvedProblems] = useState<Set<string>>(new Set());
  const { pUsernames, setPUsernames } = useStore()
  const [selectSolved, setSelectSolved] = useState<boolean>(false); 
  const [score, setScore] = useState<number>(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  let newString = Array.isArray(array) ? array.join('/') : null;
  newString = "/" + newString
  const newArray = newString ? newString.split('/s/') : null;
  const topics = newArray ? newArray[1].split('/') : null;
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const difficulties = newArray ? newArray[2].split('/') : null;
  const [isVerifying, setIsVerifying] = useState<{ [key: string]: boolean }>({}); 
  const fn = async () => {
    const res = await axios.get('/api/getTags')
    //@ts-expect-error: not needed here.
    const tags = res.data.map((p) => p.name)
    setTags(tags)
  }

  useEffect(() => {
    fn()
  }, []);


  const verifySubmission = async (
    platform: 'Leetcode' | 'Codeforces',
    problemName: string,
    username: string,
    questionId: string
  ): Promise<boolean> => {
    setIsVerifying(prev => ({ ...prev, [questionId]: true }));
    try {
      if (platform === "Leetcode") {
        const res = await fetchLatestSubmissionsLeetCode(username);
        return res?.recentSubmissionList?.some(
          (p: LeetCodeSubmission) => 
            p.titleSlug === problemName && 
            p.statusDisplay === 'Accepted'
        ) || false;
      } else {
        const res = await fetchLatestSubmissionsCodeForces(username);
        return res?.some(
          (p: CodeForcesSubmission) => 
            p.problem.name === problemName && 
            p.verdict === 'OK'
        ) || false;
      }
    } catch (error) {
      console.error('Verification error:', error);
      return false;
    } finally{
      setIsVerifying(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const toggleBookmark = async (questionId: string, currentBookmarkStatus: boolean) => {
    setIsBookmarking(prev => ({ ...prev, [questionId]: true }));
    
    try {
      const action = currentBookmarkStatus ? 'remove' : 'add';
      const response = await axios.post('/api/bookmark', {
        questionId,
        action
      });
      
      if (response.status === 200) {
        // Update local state to reflect the change
        setQuestions(prev => 
          prev.map(q => 
            q.id === questionId ? { ...q, isBookmarked: !currentBookmarkStatus } : q
          )
        );
        
        toast.success(currentBookmarkStatus ? 'Bookmark removed' : 'Question bookmarked');
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      toast.error('Failed to update bookmark');
    } finally {
      setIsBookmarking(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const updateScoreInDatabase = async (questionId: string, contestId: number | null, points: number) => {
    try {
      const response = await axios.post('/api/updatePracticeScore', {
        questionId,
        contestId,
        score: points,
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.status === 200) {
        solvedProblems.add(questionId);
        setSolvedProblems(new Set(solvedProblems));
        setScore(prev => prev + points);
        toast.success('Score Updated');
      }
    } catch (error) {
      console.error('Failed to update score on server:', error);
      toast.error('Score not Updated');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if(pUsernames.codeforcesUsername === "" || pUsernames.leetcodeUsername === ""){
          const usernames = await axios.get<{
            leetcodeUsername: string | null;
            codeforcesUsername: string | null;  
          }>('/api/user/username');
        
          setPUsernames({
            leetcodeUsername: usernames.data.leetcodeUsername || '',
            codeforcesUsername: usernames.data.codeforcesUsername || ''
          });
        }

        const newTopics = topics?.map((topic) => {
          return decodeURIComponent(topic)
        }) 

        const questionsRes = await axios.post('/api/questions', newTopics && difficulties ? { topics: [...newTopics], difficulties: [...difficulties] } : {})
        questionsRes.data.questionsWithSolvedStatus.forEach((q: Question) => {
          setLocalTags((prev) => {
            return [...new Set([...prev, ...q.questionTags.map((tags: QuestionTag) => tags.name)])];
          })
        })
        setQuestions(questionsRes.data.questionsWithSolvedStatus);
        
        setScore(questionsRes.data.individualPoints);
      } catch (error) {
        console.error(error);
        toast.error('Error fetching questions');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...questions]; // Create a copy first
    
    // Sort by index before applying any filters
    filtered.sort((a, b) => a.index - b.index);
    
    // Apply bookmark filter if enabled
    if (showBookmarkedOnly) {
      filtered = filtered.filter(q => q.isBookmarked);
    }
    
    // Existing filters
    if (selectSolved) {
      filtered = filtered.filter(q => !q.isSolved && !solvedProblems.has(q.id));
    }
  
    if (selectedDifficulty !== 'ALL') {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    }
   
    if (selectedTags.length > 0) {
      filtered = filtered.filter(q => {
        const questionTagNames = q.questionTags.map(tag => tag.name);
        return selectedTags.every(selectedTag => questionTagNames.includes(selectedTag));
      });
    }
  
    setFilteredQuestions(filtered);
  }, [selectedTags, selectedDifficulty, questions, selectSolved, solvedProblems, showBookmarkedOnly]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  if (loading) {
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <div className={`container mx-auto p-4 mt-16 max-w-6xl ${isDarkMode ? 'dark' : ''}`}>
        <Card className={`mb-6 ${isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-indigo-50/90 border-indigo-100'} shadow-sm`}>
          <CardContent className="py-6">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className={`h-8 w-48 ${isDarkMode ? 'bg-gray-700' : ''}`} />
              <div className="text-right">
                <Skeleton className={`h-4 w-24 mb-1 ${isDarkMode ? 'bg-gray-700' : ''}`} />
                <Skeleton className={`h-8 w-16 ${isDarkMode ? 'bg-gray-700' : ''}`} />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className={`h-4 w-32 ${isDarkMode ? 'bg-gray-700' : ''}`} />
                <Skeleton className={`h-10 w-48 ${isDarkMode ? 'bg-gray-700' : ''}`} />
              </div>
              <div className="space-y-2">
                <Skeleton className={`h-4 w-24 ${isDarkMode ? 'bg-gray-700' : ''}`} />
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className={`h-8 w-24 rounded-full ${isDarkMode ? 'bg-gray-700' : ''}`} />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className={`h-6 w-48 ${isDarkMode ? 'bg-gray-700' : ''}`} />
                  <Skeleton className={`h-6 w-20 ${isDarkMode ? 'bg-gray-700' : ''}`} />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[1, 2, 3].map(j => (
                    <Skeleton key={j} className={`h-5 w-16 ${isDarkMode ? 'bg-gray-700' : ''}`} />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Skeleton className={`h-4 w-32 ${isDarkMode ? 'bg-gray-700' : ''}`} />
                  <Skeleton className={`h-9 w-24 ${isDarkMode ? 'bg-gray-700' : ''}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

  return (
  <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
    <div className={`container mx-auto p-4 max-w-6xl ${isDarkMode ? 'dark' : ''}`}>
    <Card className={`mb-6 mt-16 ${isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-indigo-50/90 border-indigo-100'} shadow-sm`}>
      <CardContent className="py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-indigo-300' : 'text-indigo-800'}`}>Practice Questions</h2>
            <p className={`text-sm ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'} mt-1`}>Master algorithms through consistent practice</p>
          </div>
          <div className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-indigo-100'} p-4 rounded-lg shadow-sm border`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>Total Score</p>
            <p className={`text-3xl font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-700'}`}>{score}</p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-100'} p-4 rounded-lg border`}>
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Filter by difficulty:</p>
              <Select
                value={selectedDifficulty}
                onValueChange={setSelectedDifficulty}
              >
                <SelectTrigger className={`w-full md:w-48 ${isDarkMode ? 'bg-gray-600 border-gray-500 text-gray-200' : 'bg-white border-indigo-200 text-indigo-700'}`}>
                  <SelectValue placeholder="Select Difficulty" />
                </SelectTrigger>
                <SelectContent className={isDarkMode ? 'bg-gray-700 border-gray-600' : ''}>
                  {DIFFICULTIES.map(difficulty => (
                    <SelectItem key={difficulty.value} value={difficulty.value} className={isDarkMode ? 'text-gray-200 hover:bg-gray-600' : ''}>
                      {difficulty.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                className={`${
                  showBookmarkedOnly 
                    ? 'bg-yellow-500 hover:bg-yellow-600' 
                    : `${isDarkMode ? 'bg-indigo-500 hover:bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-500'}`
                } text-white`} 
                onClick={() => setShowBookmarkedOnly((prev) => !prev)}
              >
                {showBookmarkedOnly ? (
                  <>
                    <Bookmark className="mr-2 h-4 w-4 fill-white" />
                    Showing Bookmarked
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="mr-2 h-4 w-4" />
                    Show Bookmarked Only
                  </>
                )}
              </Button>
              <Button className={`${isDarkMode ? 'bg-indigo-500 hover:bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-500'}`} onClick={() => setSelectSolved((p) => !p)}>Toggle not Solved</Button>
            </div>

            <div className="space-y-3">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Filter by tags:</p>
              <div className="flex flex-wrap gap-2">
                {localTags.map(tag => (
                  <Button
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full text-xs px-3 py-1 h-auto ${
                      selectedTags.includes(tag) 
                        ? `${isDarkMode ? 'bg-indigo-500 hover:bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`
                        : `${isDarkMode ? 'border-gray-500 text-gray-300 hover:bg-gray-600' : 'border-indigo-200 text-indigo-700 hover:bg-indigo-50'}`
                    }`}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {filteredQuestions.length === 0 ? (
      <div className={`text-center py-12 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-lg border shadow-sm`}>
        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No questions match your current filters.</p>
        <Button 
          variant="outline"
          className={`mt-4 ${isDarkMode ? 'border-gray-500 text-gray-300 hover:bg-gray-700' : 'border-indigo-200 text-indigo-700 hover:bg-indigo-50'}`}
          onClick={() => {
            setSelectedTags([]);
            setSelectedDifficulty("ALL");
            setShowBookmarkedOnly(false);
            setSelectSolved(false);
          }}
        >
          Clear filters
        </Button>
      </div>
    ) : (
      <div className="grid gap-6">
        {filteredQuestions.map((q) => {
          // Get difficulty color
          let difficultyColor = "";
          switch (q.difficulty) {
            case "BEGINNER":
            case "EASY":
              difficultyColor = isDarkMode 
                ? "bg-green-500/20 text-green-400 border-green-500/30" 
                : "bg-green-500/10 text-green-700 border-green-200";
              break;
            case "MEDIUM":
              difficultyColor = isDarkMode 
                ? "bg-amber-500/20 text-amber-400 border-amber-500/30" 
                : "bg-amber-500/10 text-amber-700 border-amber-200";
              break;
            case "HARD":
            case "VERYHARD":
              difficultyColor = isDarkMode 
                ? "bg-red-500/20 text-red-400 border-red-500/30" 
                : "bg-red-500/10 text-red-700 border-red-200";
              break;
            default:
              difficultyColor = isDarkMode 
                ? "bg-gray-500/20 text-gray-400 border-gray-500/30" 
                : "bg-gray-500/10 text-gray-700 border-gray-200";
          }
          
          // Get primary tag (first tag, or Two Pointers if it exists)
          //@ts-expect-error: not needed here.  
          const primaryTag = topics[1]

          console.log(primaryTag)
          
          return (
            <Card 
              key={q.id}
              className={`transition-all duration-300 hover:shadow-md ${
                q.isSolved || solvedProblems.has(q.id) 
                  ? `${isDarkMode ? 'bg-green-900/20 border-green-700/50' : 'bg-green-50/50 border-green-200'}`
                  : `${isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-indigo-500/50' : 'bg-white border-gray-100 hover:border-indigo-200'}`
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className={`text-xl ${
                      q.isSolved ? 
                        (isDarkMode ? 'text-green-400' : 'text-green-800') :
                        (isDarkMode ? 'text-indigo-300' : 'text-indigo-800')
                    }`}>
                      {q.slug}
                    </CardTitle>
                    {q.isSolved || solvedProblems.has(q.id) && (
                      <div className="flex items-center gap-1">
                        <Check className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>Solved</span>
                      </div>
                    )}
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${difficultyColor} ${
                      q.isSolved || solvedProblems.has(q.id) ? 'opacity-75' : ''
                    } px-3 py-1 rounded-full text-xs font-medium`}
                  >
                    {q.difficulty}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {q.questionTags.map((tag: AnyTag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className={`text-xs ${
                        isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-600'
                      } ${
                        selectedTags.includes(tag.name) 
                          ? (isDarkMode ? 'bg-indigo-900/50 border-indigo-500/50 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700')
                          : ''
                      } ${
                        primaryTag && tag.name === primaryTag
                          ? (isDarkMode ? 'bg-blue-900/50 border-blue-500/50 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700')
                          : ''
                      }`}
                    >
                      {tag.name}
                      {primaryTag && tag.name === primaryTag && (
                        <span className="ml-1 text-xs">(Primary)</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      q.isSolved || solvedProblems.has(q.id) ? 
                        (isDarkMode ? 'bg-green-800/50 text-green-400' : 'bg-green-100 text-green-600') :
                        (isDarkMode ? 'bg-indigo-800/50 text-indigo-400' : 'bg-indigo-100 text-indigo-600')
                    }`}>
                      <span className="text-sm font-bold">{Math.floor(q.points / 2)}</span>
                    </div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Practice Points
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <HintsComponent
                      questionId={q.id} 
                      questionSlug={q.slug} 
                      primaryTagName={primaryTag}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleBookmark(q.id, q.isBookmarked)}
                      disabled={isBookmarking[q.id]}
                      className={`${isDarkMode ? 'border-gray-600' : 'border-indigo-200'} ${
                        q.isBookmarked 
                          ? (isDarkMode ? 'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100')
                          : (isDarkMode ? 'text-indigo-400 hover:bg-gray-700' : 'text-indigo-700 hover:bg-indigo-50')
                      } w-full sm:w-auto`}
                    >
                      {isBookmarking[q.id] ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : q.isBookmarked ? (
                        <>
                          <Bookmark className="mr-2 h-4 w-4 fill-yellow-500" />
                          Bookmarked
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="mr-2 h-4 w-4" />
                          Bookmark
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if(q.isSolved || solvedProblems.has(q.id)){
                          toast.error('Already verified');
                          return;
                        }
                        const response = await verifySubmission(q.leetcodeUrl ? 'Leetcode' : 'Codeforces', q.slug, q.leetcodeUrl ? pUsernames.leetcodeUsername : pUsernames.codeforcesUsername, q.id); 
                        if(response){
                          updateScoreInDatabase(q.id, null, Number(q.points / 2));  
                        } else {
                          toast.error('Submission not verified');
                        }
                      }}
                      disabled={isVerifying[q.id]}
                      className={`${isDarkMode ? 'border-gray-600 text-indigo-400 hover:bg-gray-700' : 'border-indigo-200 text-indigo-700 hover:bg-indigo-50'} w-full sm:w-auto`}
                    >
                      {isVerifying[q.id] ? 
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      : q.isSolved || solvedProblems.has(q.id) ? 
                        <>Verified <CheckCircle className={`ml-2 h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-400'}`} /></>
                       : <>Verify <CheckCircle className="ml-2 h-4 w-4" /></>}
                    </Button>
                    
                    
                    <Link 
                      href={q.leetcodeUrl || q.codeforcesUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto"
                    >
                      <Button 
                        variant={q.isSolved ? "outline" : "default"}
                        size="sm"
                        className={`w-full ${
                          q.isSolved || solvedProblems.has(q.id) 
                            ? (isDarkMode ? 'border-green-500/50 text-green-400 hover:bg-green-900/30' : 'border-green-200 text-green-700 hover:bg-green-50')
                            : (isDarkMode ? 'bg-indigo-500 hover:bg-indigo-400 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white')
                        }`}
                      >
                        {q.isSolved || solvedProblems.has(q.id) ? 'View Problem' : 'Solve Now'} 
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    )}
    
    {questions.length > 0 && (
      <div className={`mt-6 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Showing {filteredQuestions.length} of {questions.length} questions
        {showBookmarkedOnly && (
          <span className="ml-1">
            (Bookmarked only)
          </span>
        )}
      </div>
    )}
    </div>
  </div>
);}
export default QuestionSolving;