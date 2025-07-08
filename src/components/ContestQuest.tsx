'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Leetcode from '@/images/leetcode-svgrepo-com.svg'
import Codeforces from '@/images/codeforces-svgrepo-com.svg'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Timer,
  ExternalLink,
  CheckCircle,
  Check,
  Loader2,
  AlertTriangle,
  Play
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchLatestSubmissionsCodeForces, fetchLatestSubmissionsLeetCode } from '@/serverActions/fetch';
import axios from 'axios';
import CoordinatorContestPermissions from './CoordinatorContestPermissions';
import Image from 'next/image';
import { QuestionPar, useSocket } from '@/hooks/SocketContext';
import useStore from '@/store/store';

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

const ContestQuest: React.FC = () => {
  const router = useRouter();
  const { websocket } = useSocket();
  const { data: session } = useSession();
  const [show, setShow] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);
  const [showStartConfirmation, setShowStartConfirmation] = useState(false);
  const params = useParams();
  const id = params.num?.[0];
  const [loadingStartTest, setloadingStartTest] = useState(false)
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [verifiedProblems, setVerifiedProblems] = useState<Set<string>>(new Set());
  const [isScoreUpdating, setIsScoreUpdating] = useState<boolean>(false);
  const [isEndingTest, setIsEndingTest] = useState<boolean>(false);
  const [progress, setProgress] = useState(0);
  const [isCoord, setIsCoord] = useState<boolean>(false);
  const [lusername, setLUsername] = useState('')
  const [cusername, setCUsername] = useState('')
  const [isVerifying, setIsVerifying] = useState<Record<string, boolean>>({});
  const { isAdmin } = useStore()
  const { questions, setQuestions } = useSocket()

  const animateScoreUpdate = (oldScore: number, newScore: number) => {
    setIsScoreUpdating(true);
    let current = oldScore;
    const step = Math.ceil((newScore - oldScore) / 20); 
    
    const animate = () => {
      if (current < newScore) {
        current = Math.min(current + step, newScore);
        setScore(current);
        requestAnimationFrame(animate);
      } else {
        setIsScoreUpdating(false);
      }
    };
    
    requestAnimationFrame(animate);
  };

  const checkExistingSubmission = async (problemName: string) => {
    const response = await axios.post('/api/checkExistingSubmission', {
      problemName
    })

    return response.data.solved
  }

  const handleVerify = useCallback(async (
    platform: 'Leetcode' | 'Codeforces', 
    problemName: string, 
    questionId: string,
    points: number
  ): Promise<void> => {
    if (verifiedProblems.has(questionId)) {
      toast.error('Problem already verified!');
      return;
    }
    try {
      setIsVerifying({ ...isVerifying, [questionId]: true });
      if (platform === "Leetcode") {
        
        const res = await fetchLatestSubmissionsLeetCode(lusername);
        
        if (res?.recentSubmissionList) {
          let solved = res.recentSubmissionList.find(
            (p: LeetCodeSubmission) => p.titleSlug === problemName && p.statusDisplay === 'Accepted'
          );
          if(solved){
            const r = await checkExistingSubmission(problemName)
            if(r){
              solved = undefined
              toast.success('Already Attempted Question')
            } 
          }
          if (solved) {
            setVerifiedProblems(prev => new Set([...prev, questionId]));
            animateScoreUpdate(score, score + points);
            toast.success(`Problem verified! +${points} points`);
          } else {
            toast.error('No accepted submission found');
          }
        }
      } else {
        const res = await fetchLatestSubmissionsCodeForces(cusername);
        if (res) {
          let solved = res.find(
            (p: CodeForcesSubmission) => (p.problem.name === problemName && p.verdict === 'OK')
          );
          if(solved){
            const r = await checkExistingSubmission(problemName)
            if(r){
              solved = undefined
              toast.success('Already Attempted Question')
            } 
          }
          if (solved) {
            setVerifiedProblems(prev => new Set([...prev, questionId]));
            animateScoreUpdate(score, score + points);
            toast.success(`Problem verified! +${points} points`);
          } else {
            toast.error('No accepted submission found');
          }
        }
      }

    } catch (error) {
      toast.error('Error verifying submission');
      console.error('Verification error:', error);
    } finally {
      setIsVerifying({ ...isVerifying, [questionId]: false });
    }
  }, [cusername, lusername, isVerifying, score, verifiedProblems]);

  

  const handleEndTest = useCallback(async (): Promise<void> => {
    setIsEndingTest(true);
    const loader = toast.loading('Verifying all questions...');

    try {
      for (const question of questions) {
        if (!verifiedProblems.has(question.id)) {
          await new Promise(resolve => setTimeout(resolve, 500));
          await handleVerify(
            question.question.leetcodeUrl ? 'Leetcode' : 'Codeforces',
            question.question.slug,
            question.id,
            question.question.points
          );
        }
      }

      const res = await axios.post('/api/endContest', {
        contestId: id,
        userEmail: session?.user?.email,
        finalScore: score,
        timeLeft,
        questionsFromDb: questions,
        questions: Array.from(verifiedProblems)
      });

      if(res.data.status === 200) toast.success('Test ended successfully!');
      router.push('/user/dashboard');
    } catch (error) {
      toast.error('Error ending test');
      console.error('End test error:', error);
    } finally {
      setIsEndingTest(false);
      toast.dismiss(loader)
    }
  }, [handleVerify, id, questions, router, score, session?.user?.email, timeLeft, verifiedProblems]);

  useEffect(() => {
    const checkIfAdmin = async () => {
      try {
        const res = await axios.get('/api/user/username')
        setCUsername(res.data.codeforcesUsername)
        setLUsername(res.data.leetcodeUsername)
        const coordResponse = await axios.post('/api/checkIfCoordinator')
        if(!coordResponse.data.isCoordinator) setIsCoord(false);
        else {
          setIsCoord(true);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    checkIfAdmin()
    
  }, []);

  useEffect(() => {
    if (questions.length > 0) {
      const completedCount = verifiedProblems.size;
      const newProgress = (completedCount / questions.length) * 100;
      setProgress(newProgress);
    }
  }, [verifiedProblems, questions]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (show && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleEndTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [show, timeLeft, handleEndTest]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTestClick = () => {
    if (!lusername || !cusername) {
      toast.error('Please wait while we load your profile data');
      return;
    }
    setShowStartConfirmation(true);
  };

  const handleStartTest = async (): Promise<void> => {
    try {
      setShowStartConfirmation(false);
      setloadingStartTest(true);
      

      const loader = toast.loading('Initializing test environment...');
      
      const response = await axios.post(`/api/startContest/${id}`, 
        { user: session?.user, contestId: id },
        { 
          headers: { "Content-Type": "application/json" },
          validateStatus: (status) => status < 500 
        }
      );

      
      toast.dismiss(loader);

      console.log(response.data.contest.remainingTime)

      
      
      
      if (response.status === 200) {
        if(response.data.contest.remainingTime > 0){
          setTimeLeft(response.data.contest.remainingTime*60 + 10)
        } 
        

        else {
          toast.error("Your time has ended, cannot start test")
          return 
        }
        
        if (response.data.questions) {
          setShow(true);
          setQuestions(response.data.questions)

          response.data.questions.forEach((p: QuestionPar) => {
            if(p.question.isSolved){
              setScore((prev) => prev + p.question.points)
              setVerifiedProblems((prev) => new Set([...prev, p.questionId]))
            }
          })
          

          toast.success(`Test Started! You have ${response.data.contest.duration} min to complete it. Good luck!`, {
            duration: 5000,
            icon: '🚀'
          });
          const message = JSON.stringify({
            type: "joinContest",
            data: { contest_id: id }
          })
          websocket?.send(message)
        }
      }  
      else {
        const errorMessages: Record<number, string> = {
          420: 'Test Entry Closed!',
          403: 'User group is not allowed for this contest',
          407: 'Already attempted the test',
          440: 'Contest has not started yet!',
          430: 'User has already participated in the contest',
          404: 'To attempt Tests become member of a Group',
          490: 'You do not have permission to start the test',
          400: 'Not Authenticated, Please SignIn',
          401: 'Not Authenticated, Please SignIn'
        };
        

        if (response.status === 404) {
          toast.error(errorMessages[404], {
            duration: 4000,
            icon: '👥'
          });
        } else if (response.status === 440) {
          toast.error(errorMessages[440], {
            duration: 4000,
            icon: '⏰'
          });
        } else if (response.status === 400 || response.status === 401) {
          toast.error(errorMessages[response.status], {
            duration: 4000,
            icon: '🔒'
          });
        } else {
          toast.error(errorMessages[response.status] || "Unknown Error");
        }
        
        setTimeout(() => router.push('/user/dashboard'), 2000);
      }

    } catch (error) {
      toast.error('Server error encountered. Please try again later or contact support.', {
        duration: 6000,
        icon: '⚠️'
      });
      console.error('Start test error:', error);
    } finally {
      setloadingStartTest(false);
    }
  };


  
  return (
    <div className="min-h-screen bg-slate-50">
      {!show ? (
        <>
          
          <div className="container mx-auto p-4 pt-20">
            <Card className="max-w-2xl mx-auto border border-gray-100 hover:border-indigo-200 transition-all duration-300 hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-indigo-800">Welcome to the Contest</CardTitle>
                <CardDescription className="text-center text-gray-600">
                  Ready to test your algorithmic skills? Click start when you&apos;re ready.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="rounded-full bg-indigo-100 p-6">
                  <Play className="h-12 w-12 text-indigo-600" />
                </div>
                <Button 
                  size="lg" 
                  onClick={handleStartTestClick} 
                  className="w-full max-w-sm bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {loadingStartTest ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Starting...
                    </span>
                  ) : (
                    <span>Start Test</span>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Start Test Confirmation Dialog */}
          <AlertDialog open={showStartConfirmation}>
            <AlertDialogContent className="border border-indigo-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-indigo-800">
                  <Play className="h-5 w-5 text-indigo-600" />
                  Start Test?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600">
                  Are you ready to begin? Once started, the timer cannot be paused. Make sure you have enough time to complete the test.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowStartConfirmation(false)} className="border-gray-200 text-gray-700">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleStartTest} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Start Test
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {id && (isCoord || isAdmin) && <CoordinatorContestPermissions contestId={parseInt(id)}/>}
        </>
      ) : (
        <div className="container mx-auto p-4 pt-20 space-y-6">
          {/* Contest Status Bar */}
          <Card className="sticky top-16 z-10 bg-white border border-gray-100 shadow-sm">
            <CardContent className="py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-full bg-indigo-100">
                    <Timer className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Time Remaining</p>
                    <span className={`text-2xl font-bold ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-indigo-800'}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>
  
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium text-indigo-800">{Math.round(progress)}%</span>
                  </div>
                  {/* @ts-expect-error: don't know what to do here */}
                  <Progress value={progress} className="h-2 bg-indigo-100" indicatorClassName="bg-indigo-600" />
                </div>
  
                <div className="flex items-center justify-end space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Current Score</p>
                    <p className={`text-2xl font-bold transition-colors duration-200 ${
                      isScoreUpdating ? 'text-green-600' : 'text-indigo-800'
                    }`}>
                      {score}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setShowModal(true)}
                    disabled={isEndingTest}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    {isEndingTest ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ending Test...
                      </>
                    ) : (
                      'End Test'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
  
          {/* Question List */}
          <div className="grid gap-6">
            {questions.map((q) => {
              const isVerified = verifiedProblems.has(q.question.id);
              const difficultyColor = 
                q.question.difficulty === 'EASY' ? 'bg-green-500/10 text-green-500' :
                q.question.difficulty === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500' :
                'bg-red-500/10 text-red-500';
                
              return (
                <Card 
                  key={q.id}
                  className={`transition-all duration-300 hover:shadow-md ${
                    isVerified || q.question.isSolved
                      ? 'bg-green-50/50 border-green-200' 
                      : 'bg-white border-gray-100 hover:border-indigo-200'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className={`text-xl ${isVerified ? 'text-green-800' : 'text-indigo-800'}`}>
                          {q.question.slug}
                        </CardTitle>
                        {isVerified || q.question.isSolved && (
                          <div className="flex items-center gap-1">
                            <Check className="h-5 w-5 text-green-600" />
                            <span className="text-xs font-medium text-green-600">Solved</span>
                          </div>
                        )}
                        <div className="ml-2">
                          <Image src={q.question.leetcodeUrl ? Leetcode : Codeforces} alt="platform" className="size-5" />
                        </div>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={`${difficultyColor} ${
                          isVerified ? 'opacity-75' : ''
                        } px-3 py-1 rounded-full text-xs font-medium`}
                      >
                        {q.question.difficulty}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {q.question.questionTags?.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="text-xs bg-white border-gray-200 text-gray-600"
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          isVerified || q.question.isSolved ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'
                        }`}>
                          <span className="text-sm font-bold">{q.question.points}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Points
                        </p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Link 
                          href={q.question.leetcodeUrl || q.question.codeforcesUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto"
                        >
                          <Button 
                            variant={isVerified  || q.question.isSolved ? "outline" : "default"}
                            size="sm"
                            className={`w-full ${
                              isVerified  || q.question.isSolved 
                                ? 'border-green-200 text-green-700 hover:bg-green-50' 
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                          >
                            {isVerified  || q.question.isSolved ? 'View Problem' : 'Solve Now'} 
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                        {!isVerified && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerify(
                              q.question.leetcodeUrl ? 'Leetcode' : 'Codeforces',
                              q.question.slug,
                              q.id,
                              q.question.points
                            )}
                            disabled={isVerifying[q.id]}
                            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 w-full sm:w-auto"
                          >
                            {isVerifying[q.id] ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>Verify <CheckCircle className="ml-2 h-4 w-4" /></>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
  
          {/* Showing count */}
          {questions.length > 0 && (
            <div className="mt-6 text-center text-sm text-gray-600">
              Showing {questions.length} questions
            </div>
          )}
  
          {/* End Test Confirmation Dialog */}
          <AlertDialog open={showModal}>
            <AlertDialogContent className="border border-red-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  End Test?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600">
                  Are you sure you want to end this test? Your final score will be {score} points. All unsolved problems will be verified one last time before submission.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowModal(false)} className="border-gray-200 text-gray-700">Continue Test</AlertDialogCancel>
                <AlertDialogAction onClick={handleEndTest} className="bg-red-500 hover:bg-red-600 text-white">
                  End Test Now
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  )}
export default ContestQuest;