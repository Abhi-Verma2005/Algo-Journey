'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Leetcode from '@/images/leetcode-svgrepo-com.svg'
import Codeforces from '@/images/codeforces-svgrepo-com.svg'
import { Plus, Trash2, X, Code, Target, Settings, Layers } from 'lucide-react';
import { Swords } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from 'next/link';
import ContestPermissionModal from './Modals/ContestPermissionModal';
import Image from 'next/image';
import useStore from '@/store/store';
import { useRouter } from 'next/navigation';
import UpdateQuestionComponent from './Modals/UpdateQuestion';
import SearchBar, { ClientSideSearchConfig, ServerSideSearchConfig } from './SearchBarGenX';
import TagManager from './Modals/TagManager';
import useTagStore from '@/store/tagsStore';
import HintsComponent from './Modals/Hints';
import LeetCodeStatsCollector from './Modals/Leetcode';

const DIFFICULTY_LEVELS = [
  { id: "all", value: "all", label: "All Difficulties" },
  { id: "beginner", value: "BEGINNER", label: "Beginner" },
  { id: "easy", value: "EASY", label: "Easy" },
  { id: "medium", value: "MEDIUM", label: "Medium" },
  { id: "hard", value: "HARD", label: "Hard" },
  { id: "veryhard", value: "VERYHARD", label: "Very Hard" }
];
type Difficulty = 'BEGINNER' | 'EASY' | 'MEDIUM' | 'HARD' | 'VERYHARD';

interface Question {
  id: string;
  leetcodeUrl: string;
  codeforcesUrl: string;
  questionTags: QuestionTag[];
  slug: string;
  points: number;
  inContest: boolean;
  inArena: boolean;
  difficulty: Difficulty
}

interface QuestionTag {
  id: string;
  name: string;
}

export default function AllQuestions() {
  const { tags } = useTagStore()
  const [questions, setQuestions] = useState<Question[]>([]);
  const [numberofArenaQuestions, setNumberofArenaQuestions] = useState(0)
  const [dbQuestionsCount, setDbQuestionsCount] = useState(0)
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [dateError, setDateError] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [duration, setDuration] = useState(120);
  const [contestName, setContestName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dbSearch, setDBSearch] = useState(true)
  const { isAdmin } = useStore()
  const Router = useRouter()


  useEffect(() => {
    if (isAdmin) {
      fetchQuestions();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const fetchQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.post<{ questions: Question[], questionsCount: number, questionsInArena: number }>("/api/getQuestions");
      if (response.status === 200) {
        setQuestions(response.data.questions);
        setDbQuestionsCount(response.data.questionsCount)
        setNumberofArenaQuestions(response.data.questionsInArena)
        setFilteredQuestions(response.data.questions);
      } else {
        toast.error("Failed to fetch questions");
      }
      
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Failed to fetch questions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDifficultyColor = (difficulty: string): string => {
    const colors: Record<string, string> = {
      BEGINNER: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
      EASY: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
      MEDIUM: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
      HARD: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
      VERYHARD: 'bg-red-700/10 text-red-700 hover:bg-red-700/20'
    };
    return colors[difficulty.toUpperCase()] || 'bg-gray-500/10 text-gray-500';
  };

  const getDifficultyBgColor = (difficulty: string): string => {
    const colors: Record<string, string> = {
      BEGINNER: 'bg-green-50',
      EASY: 'bg-green-50',
      MEDIUM: 'bg-amber-50',
      HARD: 'bg-red-50',
      VERYHARD: 'bg-red-50'
    };
    return colors[difficulty.toUpperCase()] || 'bg-gray-50';
  };

  useEffect(() => {

    if(selectedDifficulty === "all"){
      setDBSearch(true)
    } else {
      setDBSearch(false)
    }
    if (questions.length > 0) {
      let filtered = questions;

      if (selectedDifficulty !== "all") {
        filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
      }

      if (selectedTags?.length > 0) {
        filtered = filtered.filter(q => {
          const questionTagNames = q.questionTags.map(tag => tag.name);
          return selectedTags.some(selectedTag => questionTagNames.includes(selectedTag));
        });
      }

      setFilteredQuestions(filtered);
    }
  }, [selectedTags, selectedDifficulty, questions]);

  // Updated handleDifficultyChange function
const handleDifficultyChange = async (value: string) => {
  try {
    setIsLoading(true);
    setSelectedDifficulty(value);
    
    // Call the API with the selected difficulty
    const response = await axios.post("/api/questions/filterByDifficulty", {
      difficulty: value
    });
    
    if (response.status === 200) {
      setQuestions(response.data.questions);
      setDbQuestionsCount(response.data.questionsCount);
      setNumberofArenaQuestions(response.data.questionsInArena);
      
      // Apply any tag filters if necessary
      if (selectedTags?.length > 0) {
        const filtered = response.data.questions.filter((q: Question) => {
          const questionTagNames = q.questionTags.map((tag: QuestionTag) => tag.name);
          return selectedTags.some(selectedTag => questionTagNames.includes(selectedTag));
        });
        setFilteredQuestions(filtered);
      } else {
        setFilteredQuestions(response.data.questions);
      }
    } else {
      toast.error("Failed to filter questions");
    }
  } catch (error) {
    console.error("Error filtering questions:", error);
    toast.error("Failed to filter questions");
  } finally {
    setIsLoading(false);
  }
};

  const addToTest = (question: Question) => {
    if (selectedQuestions?.some(q => q.id === question.id)) {
      toast.error("Question already added to test");
      return;
    }
    setSelectedQuestions(prev => [...prev, { ...question }]);
    toast.success("Question added to test");
  };

  const removeFromTest = (questionId: string) => {
    setSelectedQuestions(prev => prev.filter(q => q.id !== questionId));
    toast.success("Question removed from test");
  };


  const validateDates = () => {
    if (!startTime || !endTime) {
      setDateError("Please select both start and end times");
      return false;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start < now) {
      setDateError("Start time cannot be in the past");
      return false;
    }

    if (end <= start) {
      setDateError("End time must be after start time");
      return false;
    }

    setDateError("");
    return true;
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const formatDateForPrisma = (dateString: string) => {
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const utcDate = new Date(date.getTime() - (offset * 60000));
    return utcDate.toISOString();
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setDuration(isNaN(value) ? 1 : Math.max(1, value));
  };

  const handleCreateTest = async () => {
    if (selectedQuestions.length === 0) {
      toast.error("Please select at least one question to create a test.");
      return 0;
    }

    if (!validateDates()) {
      return 0;
    }

    setLoading(true);
    try {
      const testData = {
        questions: selectedQuestions,
        name: contestName,
        startTime: formatDateForPrisma(startTime),
        duration,
        endTime: formatDateForPrisma(endTime)
      };

      const response = await axios.post("/api/createTest", testData);
      const contestId = response.data.contestId;
      
      return contestId;
    } catch (error) {
      console.error("Error creating test:", error);
      toast.error("Failed to create test.");
      return 0;
    } finally {
      setLoading(false);
    }
  };

  const confirm = (id: string) => {
    toast((t) => (
      <div className="flex flex-col">
        <p className="font-semibold">Are you sure?</p>
        <div className="flex gap-2 mt-2">
          <button 
            onClick={() => {
              toast.dismiss(t.id);
              handleDeleteQuestion(id);
            }} 
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Yes
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)} 
            className="bg-gray-300 px-3 py-1 rounded"
          >
            No
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      const response = await axios.post('/api/deleteQuestion', { questionId: id });
      if (response.status === 200) {
        setQuestions(prev => prev.filter(q => q.id !== id));
        toast.success("Deleted");
      } else {
        toast.error(response.data.message || "Failed to delete question");
      }
    } catch (error) {
      console.error('Error while deleting question: ', error);
      toast.error("Some unexpected error occurred!");
    }
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }


  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-xl font-bold mb-4">Access Denied</div>
        <p className="text-gray-500">You need admin privileges to access this page.</p>
      </div>
    );
  }


  const handleAddToArena = async (questionId: string) => {
    let loadingToast;
    try {
      // Show loading toast
      loadingToast = toast.loading('Adding question to arena...');
      
      // Make API call to add question to arena
      const response = await axios.post('/api/questions/add-to-arena', {
        questionId
      });
      
      // Show success toast
      if (response.data.success) {
        toast.success('Question successfully added to arena!');
        // Optional: Refresh data or update UI state if needed
      } else {
        toast.error(response.data.message || 'Failed to add question to arena');
      }
    } catch (error) {
      // Handle error cases
      toast.error(
        'An error occurred while adding question to arena'
      );
      console.error('Error adding question to arena:', error);
    } finally {
      // Ensure loading toast is dismissed in all cases
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }
    }
  };


const clientConfig: ClientSideSearchConfig<Question> = {
  mode: "clientSide",
  data: questions,
  filterFn: (item, query) => {
    const lowercaseQuery = query.toLowerCase();
    
    // Search by slug (name)
    if (item.slug.toLowerCase().includes(lowercaseQuery)) {
      return true;
    }
    
    // Search by difficulty
    if (item.difficulty.toLowerCase().includes(lowercaseQuery)) {
      return true;
    }
    
    // Search by tags
    if (item.questionTags.some(tag => tag.name.toLowerCase().includes(lowercaseQuery))) {
      return true;
    }
    
    return false;
  },
  placeholder: "Search questions...",
  debounceMs: 300,
  minQueryLength: 2,
  onResultSelect: (item) => {
    setFilteredQuestions([item]);
  },
  renderItem: (item) => (
    <div className="flex flex-col">
      <span className="font-medium">{item.slug}</span>
      <div className="flex items-center gap-2 mt-1">
        <Badge className={getDifficultyColor(item.difficulty)}>
          {item.difficulty.charAt(0) + item.difficulty.slice(1).toLowerCase()}
        </Badge>
        {item.questionTags.slice(0, 2).map(tag => (
          <Badge key={tag.id} variant="outline" className="bg-gray-50 text-xs">
            {tag.name}
          </Badge>
        ))}
      </div>
    </div>
  )
};

  const serverConfig: ServerSideSearchConfig<string> = {
    mode: "serverSide",
    endpoint: '/api/questions/search',
    debounceMs: 300,
    minQueryLength: 2,
    responsePath: "slugs",
    placeholder: 'Search questions...',
    onResultSelect: async (questionSlug: string) => {
      try {
        const res = await axios.post('/api/questions/search/result', { query: questionSlug })
        if(res.status !== 200) {
          toast.error('Some error occured while searching')
        }
        setFilteredQuestions(res.data.question)
      } catch (error) {
        console.error('Error in onResultSelect function in allquestions: ', error)
      }
    },
  renderItem: (questionSlug: string) => (
    <div className="flex flex-col">
      <span className="font-medium">{questionSlug}</span>
    </div>
  )
}
 

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-8 pt-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Question <span className="text-indigo-600">Management</span>
            </h1>
            <p className="text-gray-600 mt-1">Manage contest questions and create tests</p>
          </div>
            <div>
            <Button variant="link" className='bg-indigo-600 mx-1 text-white' onClick={() => Router.push('/admin/dashboard/updateContest')}>Update Contest</Button>
            <Button variant="link" className='bg-indigo-600 mx-1 text-white' onClick={() => Router.push('/admin/dashboard/addQuestions')}>Add Questions</Button>
            </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-white border-l-4 border-l-blue-400 shadow-none hover:shadow-none transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                Available Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-800">{dbQuestionsCount}</p>
              <p className="text-xs text-gray-500 mt-1">Total questions in database</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-teal-400 shadow-none hover:shadow-none transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Code className="h-4 w-4 text-teal-500" />
                Arena Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-800">
                {numberofArenaQuestions}
              </p>
              <p className="text-xs text-gray-500 mt-1">Questions in practice arena</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-amber-400 shadow-none hover:shadow-none transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Layers className="h-4 w-4 text-amber-500" />
                Test Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-800">{selectedQuestions.length}</p>
              <p className="text-xs text-gray-500 mt-1">Questions selected for test</p>
            </CardContent>
          </Card>

        </div>

        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-12">
          {/* Sidebar */}
          <div className="md:col-span-4 space-y-6">
            {/* Test Configuration */}
            <Card className="bg-white shadow-none hover:shadow-none transition-all">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-indigo-500" />
                  Test Configuration
                </CardTitle>
                <CardDescription className="text-gray-500">Set up your contest parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Contest Name</label>
                  <Input
                    type="text"
                    value={contestName}
                    placeholder="Enter Contest Name"
                    onChange={(e) => setContestName(e.target.value)}
                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={handleDurationChange}
                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <Input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <Input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    min={startTime}
                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                {dateError && (
                  <p className="text-sm text-red-500">{dateError}</p>
                )}
              </CardContent>
              <CardFooter className="border-t border-gray-100 pt-4">
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => setIsPermissionModalOpen(true)}
                  disabled={loading}
                >
                  {loading ? "Creating Test..." : "Create Test"}
                </Button>
              </CardFooter>
            </Card>

            {/* Selected Questions */}
            <Card className="bg-white shadow-none hover:shadow-none transition-all">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-500" />
                  Selected Questions
                </CardTitle>
                <CardDescription className="text-gray-500">Questions for your test</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {selectedQuestions.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No questions selected yet</p>
                    <p className="text-sm text-gray-400 mt-2">Add questions from the list on the right</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedQuestions.map((q) => (
                      <div key={q.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${q.difficulty === 'EASY' || q.difficulty === 'BEGINNER' ? 'bg-green-500' : q.difficulty === 'MEDIUM' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                          <Link href={q.leetcodeUrl ? q.leetcodeUrl : q.codeforcesUrl || ''} target='_blank'>
                            <span className="font-medium text-indigo-700 hover:text-indigo-900 transition-colors">{q.slug}</span>
                          </Link>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromTest(q.id)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <TagManager/>
            {/* <MigrationButton/> */}
            <LeetCodeStatsCollector/>
          </div>

          {/* Main Content */}
          <div className="md:col-span-8">
            <Card className="bg-white shadow-none hover:shadow-none transition-all">
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Code className="h-5 w-5 text-indigo-500" />
                    Available Questions
                  </CardTitle>
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                   {
                    dbSearch ? <SearchBar
                    config={serverConfig}
                    /> : <SearchBar config={clientConfig}/> 
                   }
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Filters */}
                <div className="mb-6 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-1/3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                      <Select
                        value={selectedDifficulty}
                        onValueChange={handleDifficultyChange}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          {DIFFICULTY_LEVELS.map((level) => (
                            <SelectItem 
                              key={level.id} 
                              value={level.value}
                              className={level.value !== "all" ? getDifficultyColor(level.value) : ""}
                            >
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-full sm:w-2/3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                      <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md bg-white max-h-20 overflow-y-auto">
                        {tags.map(tag => (
                          <Badge
                            key={tag}
                            variant={selectedTags.includes(tag) ? "default" : "outline"}
                            className={`cursor-pointer ${selectedTags.includes(tag) ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200' : 'hover:bg-gray-100'}`}
                            onClick={() => toggleTag(tag)}
                          >
                            {tag}
                            {selectedTags.includes(tag) && (
                              <X className="ml-1 h-3 w-3" />
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Questions List */}
                {filteredQuestions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No questions found matching your filters</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        setSelectedTags([]);
                        setSelectedDifficulty("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredQuestions.map((q) => (
                      <UpdateQuestionComponent 
                        key={q.id}
                        questionId={q.id} 
                        questionSlug={q.slug} 
                        isAdmin={isAdmin}
                        question={q}
                        >
                      <HintsComponent questionId={q.id} key={q.id} questionSlug={q.slug} isAdmin={true}>
                      <Card key={q.id} className="border border-gray-200 hover:border-gray-300 transition-colors">
                        <CardContent className="p-4">
                                {q.inArena && (
                                  <div className="w-2 h-2 rounded-full bg-purple-500" title="In Arena"></div>
                                )}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                              <div className={`${getDifficultyBgColor(q.difficulty)} p-3 rounded-lg`}>
                                {q.leetcodeUrl ? (
                                  <Image src={Leetcode} alt="LeetCode" className="w-6 h-6" />
                                ) : (
                                  <Image src={Codeforces} alt="Codeforces" 
                                  className="w-6 h-6" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium">
                                    <Link href={q.leetcodeUrl ? q.leetcodeUrl : q.codeforcesUrl || ''} target='_blank'>
                                      <span className="text-blue-600 hover:text-blue-800 transition-colors">{q.slug}</span>
                                    </Link>
                                  </h3>
                                  <Badge className={getDifficultyColor(q.difficulty)}>
                                    {q.difficulty.charAt(0) + q.difficulty.slice(1).toLowerCase()}
                                  </Badge>
                                  
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {q.questionTags.map((tag) => (
                                    <Badge key={tag.id} variant="outline" className="bg-gray-50">
                                      {tag.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-indigo-500 text-indigo-500 hover:bg-indigo-50"
                                onClick={() => addToTest(q)}
                              >
                                <Plus className="h-4 w-4 mr-1" /> Add to Test
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-amber-500 text-amber-500 hover:bg-amber-50"
                                onClick={() => handleAddToArena(q.id)}
                              >
                                <Swords className="h-4 w-4 mr-1" /> Add to Arena
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500 text-red-500 hover:bg-red-50"
                                onClick={() => confirm(q.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                        <CardContent>
                        </CardContent>
                      </Card>
                      </HintsComponent>
                      </UpdateQuestionComponent>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Permission Modal */}
      {isPermissionModalOpen && (
        <ContestPermissionModal
          isOpen={isPermissionModalOpen}
          onClose={() => setIsPermissionModalOpen(false)}
          onCreateTest={handleCreateTest}
        />
      )}
    </div>
  );
}
                                  