'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useSocket } from '@/hooks/SocketContext';
import useStore from '@/store/store';
import { Difficulty } from '@prisma/client';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Icons
import { 
  Clock, 
  X, 
  Save, 
  Loader2, 
  Search, 
  Users, 
  Calendar, 
  Tag, 
  AlertCircle, 
  Filter, 
  Plus, 
  Settings,
  ArrowLeft
} from 'lucide-react';

interface QuestionOnContest {
  questionId: string;
  question: Question;
}

export interface Question {
  id: string;
  leetcodeUrl: string | null;
  codeforcesUrl: string | null;
  questionTags: { id: string; name: string; }[];
  slug: string;
  points: number;
  isSolved: boolean;
  difficulty: Difficulty;
}

interface Group {
  id: string;
  name: string;
}

export interface Contest {
  id: string;
  questions: QuestionOnContest[];
  startTime: string;
  endTime: string;
  duration: number;
}

export default function UpdateContestPage({ dbQuestions }: { dbQuestions: Question[] }) {
  const [contestId, setContestId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingContest, setFetchingContest] = useState(false);
  const { contest, setContest } = useStore();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState(2);
  const [dateError, setDateError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { addedQuestions } = useStore();
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const { websocket } = useSocket();
  const [difficultyFilter, setDifficultyFilter] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('questions');

  const fetchContestDetails = async () => {
    if (!contestId.trim()) {
      toast.error('Please enter a contest ID');
      return;
    }

    setFetchingContest(true);
    try {
      const [contestResponse, groupsResponse, permissionsResponse] = await Promise.all([
        axios.post('/api/getContest', { contestId }),
        axios.post('/api/getGroups'),
        axios.post('/api/getGroupPermission', { contestId })
      ]);

      const contestData = contestResponse.data.contest;
      if (!contestData) {
        toast.error('Contest not found');
        setShowForm(false);
        setFetchingContest(false);
        return;
      }

      if (permissionsResponse.status === 204) {
        toast.error(permissionsResponse.data.message);
      }

      setContest(contestData);
      setStartTime(formatDateForInput(contestData.startTime));
      setEndTime(formatDateForInput(contestData.endTime));
      setDuration(contestData.duration);
      setShowForm(true);
      
      setAvailableQuestions(dbQuestions);
      setFilteredQuestions(dbQuestions);

      setAllGroups(groupsResponse.data.groups);
      setFilteredGroups(groupsResponse.data.groups);
      //@ts-expect-error: no need here...
      setSelectedGroups(permissionsResponse.data.permittedGroups.map((p) => p.id));

    } catch (error) {
      console.error('Error fetching contest details:', error);
      toast.error('Failed to fetch contest details');
    }
    setFetchingContest(false);
  };

  useEffect(() => {
    if (availableQuestions.length) {
      let filtered = availableQuestions.filter(q => 
        q.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (difficultyFilter.length > 0) {
        filtered = filtered.filter(q => difficultyFilter.includes(q.difficulty));
      }
      
      setFilteredQuestions(filtered);
    }
  }, [searchTerm, availableQuestions, difficultyFilter]);

  useEffect(() => {
    if (allGroups.length) {
      const filtered = allGroups.filter((group) => 
        group.name.toLowerCase().includes(groupSearchTerm.toLowerCase())
      );
      setFilteredGroups(filtered);
    }
  }, [groupSearchTerm, allGroups]);

  useEffect(() => {
    addedQuestions.forEach((p) => {
      const questionToAdd = dbQuestions.find((d) => d.id === p.question.id);
      if (!questionToAdd) return;
      addQuestionToContest(questionToAdd);
    });
  }, [addedQuestions, dbQuestions]);

  const handleAddinRealTime = (q: Question) => {
    const contestID = parseInt(contestId);
    const message = JSON.stringify({
      type: "addQuestion",
      data: { contest_id: contestID.toString(), q }
    })
    console.log("sent")
    websocket?.send(message);
  };

  const confirmAdd = (q: Question) => {
    toast((t) => (
      <div className="flex flex-col">
        <p className="font-semibold">How to Add?</p>
        <div className="flex gap-2 mt-2">
          <button 
            onClick={() => {
              toast.dismiss(t.id);
              handleAddinRealTime(q);
            }} 
            className="bg-indigo-500 text-white px-3 py-1 rounded"
          >
            Add in real time
          </button>
          <button 
            onClick={() => {
              toast.dismiss(t.id);
              addQuestionToContest(q);
            }} 
            className="bg-gray-300 px-3 py-1 rounded"
          >
            Add normally
          </button>
        </div>
      </div>
    ), { duration: 5000 }); 
  };

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  const formatDateForPrisma = (dateString: string) => {
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const utcDate = new Date(date.getTime() - (offset * 60000));
    return utcDate.toISOString();
  };

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const selectAllGroups = () => {
    const filteredGroupIds = filteredGroups.map(group => group.id);
    setSelectedGroups(prev => {
      const uniqueIds = new Set([...prev, ...filteredGroupIds]);
      return Array.from(uniqueIds);
    });
  };

  const deselectAllGroups = () => {
    const filteredGroupIds = new Set(filteredGroups.map(group => group.id));
    setSelectedGroups(prev => prev.filter(id => !filteredGroupIds.has(id)));
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setDuration(isNaN(value) ? 1 : Math.max(1, value));
  };

  const validateDates = () => {
    if (!startTime || !endTime) {
      setDateError('Please select both start and end times');
      return false;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      setDateError('End time must be after start time');
      return false;
    }

    setDateError('');
    return true;
  };

  const addQuestionToContest = (question: Question) => {
    if (!contest) return;
    
    setContest({
      ...contest,
      questions: [...contest.questions, { questionId: question.id, question: question }]
    });
    toast.success(`Added ${question.slug} to contest`);
  };

  const removeQuestionFromContest = (questionId: string) => {
    if (!contest) return;
    
    setContest({
      ...contest,
      questions: contest.questions.filter(q => q.questionId !== questionId)
    });
    toast.success('Question removed from contest');
  };

  const handleUpdateContest = async () => {
    if (!contest) return;
    
    if (!validateDates()) {
      return;
    }
    
    if (contest.questions.length === 0) {
      toast.error('Contest must have at least one question');
      return;
    }
    
    setLoading(true);
    try {
      const updateData = {
        contestId: contest.id,
        questions: contest.questions,
        startTime: formatDateForPrisma(startTime),
        endTime: formatDateForPrisma(endTime),
        duration,
        permittedGroups: selectedGroups
      };

      const response = await axios.post('/api/updateContest', updateData);
      if(response.status === 200){
        toast.success('Contest updated successfully!');
        setShowForm(false);
        setContest(null);
        setContestId('');
      }
      else{
        toast.error('Failed to update contest');
      }
    } catch (error) {
      console.error('Error updating contest:', error);
      toast.error('Failed to update contest');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string): string => {
    const colors: Record<string, string> = {
      BEGINNER: 'bg-green-500/10 text-green-500',
      EASY: 'bg-green-500/10 text-green-500',
      MEDIUM: 'bg-yellow-500/10 text-yellow-500',
      HARD: 'bg-red-500/10 text-red-500',
      VERYHARD: 'bg-red-700/10 text-red-700'
    };
    return colors[difficulty.toUpperCase()] || 'bg-gray-500/10 text-gray-500';
  };

  const toggleDifficultyFilter = (difficulty: string) => {
    setDifficultyFilter(prev => 
      prev.includes(difficulty)
        ? prev.filter(d => d !== difficulty)
        : [...prev, difficulty]
    );
  };

  const getTimeRemaining = () => {
    if (!endTime) return null;
    
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return "Contest ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}d ${hours}h ${minutes}m remaining`;
  };

  const totalPoints = contest 
    ? contest.questions.reduce((sum, q) => sum + q.question.points, 0)
    : 0;

  if (!showForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-none border-t-4 border-t-indigo-500">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <Clock className="w-6 h-6 text-indigo-500" />
              Contest Management
            </CardTitle>
            <CardDescription className="text-center">
              Update existing contest settings and questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="contest-id">
                Contest ID
              </label>
              <div className="flex gap-2">
                <Input
                  id="contest-id"
                  placeholder="Enter Contest ID"
                  value={contestId}
                  onChange={(e) => setContestId(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={fetchContestDetails}
                  disabled={fetchingContest}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {fetchingContest ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
                  {fetchingContest ? 'Loading...' : 'Fetch'}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 border-t pt-4">
            <p className="text-xs text-gray-500 text-center">
              Enter the ID of an existing contest to modify its settings, questions, and group permissions.
            </p>
            <Link href={'/admin/dashboard'}>
            <Button variant="outline" className="w-full">
              Back to Dashboard
            </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-14">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-600"
              onClick={() => {
                setShowForm(false);
                setContest(null);
                setContestId('');
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-800">
              Update Contest
              <span className="text-indigo-600 ml-2">#{contestId}</span>
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setContest(null);
                setContestId('');
              }}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateContest}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {loading ? 'Updating...' : 'Update Contest'}
            </Button>
          </div>
        </div>

        {/* Contest Summary Card */}
        {contest && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white shadow-none border-l-4 border-l-indigo-400">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-500" />
                  Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-800">{duration} min</p>
                <p className="text-xs text-gray-500 mt-1">Contest time limit</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-none border-l-4 border-l-green-400">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-gray-800 truncate">{getTimeRemaining()}</p>
                <p className="text-xs text-gray-500 mt-1">Based on end time</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-none border-l-4 border-l-amber-400">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-amber-500" />
                  Total Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-800">{totalPoints}</p>
                <p className="text-xs text-gray-500 mt-1">Across all questions</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-none border-l-4 border-l-blue-400">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Groups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-800">{selectedGroups.length}</p>
                <p className="text-xs text-gray-500 mt-1">Teams with access</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto bg-gray-100">
            <TabsTrigger value="settings" className="data-[state=active]:bg-white">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="questions" className="data-[state=active]:bg-white">
              <Tag className="h-4 w-4 mr-2" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="groups" className="data-[state=active]:bg-white">
              <Users className="h-4 w-4 mr-2" />
              Groups
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Settings className="h-5 w-5 text-indigo-500" />
                  Contest Settings
                </CardTitle>
                <CardDescription>
                  Configure timing and other contest parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Contest Duration (minutes)</label>
                  <Input
                    type="number"
                    min="1"
                    max="1440"
                    value={duration}
                    onChange={handleDurationChange}
                    className="max-w-xs"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Start Time</label>
                    <Input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">End Time</label>
                    <Input
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
                
                {dateError && (
                  <div className="bg-red-50 p-3 rounded-md flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{dateError}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current Questions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Tag className="h-5 w-5 text-indigo-500" />
                    Contest Questions ({contest?.questions.length || 0})
                  </CardTitle>
                  <CardDescription>
                    Questions currently in this contest
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contest?.questions.length === 0 ? (
                    <div className="border border-dashed rounded-lg p-8 text-center">
                      <p className="text-gray-500">No questions added to this contest yet.</p>
                      <p className="text-sm text-gray-400 mt-2">Add questions from the list on the right.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {contest?.questions.map((q) => (
                        <div 
                          key={q.questionId} 
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{q.question.slug}</span>
                              <Badge className={`${getDifficultyColor(q.question.difficulty)}`}>
                                {q.question.difficulty}
                              </Badge>
                            </div>
                            {q.question.questionTags.length !== 0 && <div className="text-xs text-gray-500 mt-1">
                              Points: {q.question.points} • Tags: {q.question.questionTags.map(tag => tag.name).join(', ')}
                            </div>}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestionFromContest(q.questionId)}
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

              {/* Available Questions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Plus className="h-5 w-5 text-indigo-500" />
                    Add Questions
                  </CardTitle>
                  <CardDescription>
                    Browse and add questions to the contest
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search questions by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {['BEGINNER', 'EASY', 'MEDIUM', 'HARD', 'VERYHARD'].map(diff => (
                      <Badge 
                        key={diff}
                        variant={difficultyFilter.includes(diff) ? "default" : "outline"}
                        className={`cursor-pointer ${difficultyFilter.includes(diff) ? getDifficultyColor(diff) : 'hover:bg-gray-100'}`}
                        onClick={() => toggleDifficultyFilter(diff)}
                      >
                        {diff.charAt(0) + diff.slice(1).toLowerCase()}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto border rounded-md p-2">
                    {filteredQuestions.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-gray-500">No questions found matching your criteria.</p>
                      </div>
                    ) : (
                      filteredQuestions.map((q) => {
                        const isAdded = contest?.questions.some(cq => cq.questionId === q.id);
                        return (
                          <div 
                            key={q.id} 
                            className={`flex items-center justify-between p-3 rounded-lg border ${isAdded ? 'bg-indigo-50' : 'hover:bg-gray-50'} transition-colors`}
                          >
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <Link href={q.leetcodeUrl ? q.leetcodeUrl : q.codeforcesUrl || ''} target='_blank'>
                                  <span className="font-medium text-indigo-600 hover:underline">{q.slug}</span>
                                </Link>
                                <Badge className={`${getDifficultyColor(q.difficulty)}`}>
                                  {q.difficulty}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Points: {q.points} • Tags: {q.questionTags.map(tag => tag.name).join(', ')}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className={isAdded ? 'bg-gray-200 text-gray-700' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}
                              onClick={() => !isAdded && confirmAdd(q)}
                              disabled={isAdded}
                            >
                              {isAdded ? 'Added' : 'Add'}
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="groups" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-500" />
                  Group Permissions
                </CardTitle>
                <CardDescription>
                  Manage which groups have access to this contest
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <Input
                    placeholder="Search groups..."
                    value={groupSearchTerm}
                    onChange={(e) => setGroupSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={selectAllGroups}
                      className="flex-1 md:flex-none"
                    >
                      Select All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={deselectAllGroups}
                      className="flex-1 md:flex-none"
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
                  {filteredGroups.map((group) => (
                    <div
                      key={group.id}
                      className={`flex items-center p-3 rounded-lg border ${
                        selectedGroups.includes(group.id)
                          ? 'bg-indigo-50 border-indigo-200'
                          : 'hover:bg-gray-50'
                      } transition-all cursor-pointer`}
                      onClick={() => toggleGroupSelection(group.id)}
                    >
                      <Checkbox
                        checked={selectedGroups.includes(group.id)}
                        onCheckedChange={() => toggleGroupSelection(group.id)}
                        id={`group-${group.id}`}
                        className="mr-3"
                      />
                      <label
                        htmlFor={`group-${group.id}`}
                        className="font-medium text-gray-700 cursor-pointer flex-1"
                      >
                        {group.name}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{selectedGroups.length}</span> groups selected
                </div>
                </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </div>
);
}