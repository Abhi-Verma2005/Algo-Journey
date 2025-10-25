'use client'
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Target, X, Save, CheckCircle2, ExternalLink, AlertCircle } from "lucide-react";
import toast from 'react-hot-toast';
import axios from 'axios';
import useTagStore from '@/store/tagsStore';

interface Question {
  slug: string;
  leetcodeUrl: string;
  codeforcesUrl: string;
  difficulty: "BEGINNER" | "EASY" | "MEDIUM" | "HARD" | "VERYHARD";
  points: number;
  tags: string[];
  platform: "Leetcode" | "Codeforces";
}

const difficultyPoints = {
  BEGINNER: 2,
  EASY: 4,
  MEDIUM: 6,
  HARD: 8,
  VERYHARD: 10,
};



const getDifficultyColor = (difficulty: string) => {
  const colors = {
    BEGINNER: "bg-blue-500/10 text-blue-500 border-blue-500",
    EASY: "bg-green-500/10 text-green-500 border-green-500",
    MEDIUM: "bg-yellow-500/10 text-yellow-500 border-yellow-500",
    HARD: "bg-orange-500/10 text-orange-500 border-orange-500",
    VERYHARD: "bg-red-500/10 text-red-500 border-red-500"
  };
  return colors[difficulty as keyof typeof colors];
};

// Function to extract slug from URL
const extractSlugFromUrl = (url: string, platform: string): string => {
  if (!url) return "";
  
  try {
    if (platform === "Leetcode") {
      // Handle Leetcode URLs like: https://leetcode.com/problems/smallest-even-multiple/
      const match = url.match(/problems\/([^/]+)/);
      if (match && match[1]) {
        // Return the exact slug as it appears in the URL
        return match[1];
      }
    } else if (platform === "Codeforces") {
      // Handle Codeforces URLs like: https://codeforces.com/problemset/problem/1352/A
      const match = url.match(/problem\/(\d+)\/([A-Z\d]+)/);
      if (match && match[1] && match[2]) {
        return `${match[1]}${match[2]}`;
      }
    }
  } catch (error) {
    console.error("Error extracting slug:", error);
  }
  
  return "";
};

export default function QuestionForm() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const { tags } = useTagStore()
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    slug: "",
    leetcodeUrl: "",
    codeforcesUrl: "",
    difficulty: "BEGINNER",
    points: 2,
    tags: [],
    platform: "Leetcode",
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<{
    slug?: string;
    tags?: string;
  }>({});

  const resetCurrentQuestion = () => {
    setCurrentQuestion({
      slug: "",
      leetcodeUrl: "",
      codeforcesUrl: "",
      difficulty: "BEGINNER",
      points: 2,
      tags: [],
      platform: "Leetcode",
    });
    setEditingIndex(null);
    setFormErrors({});
  };

  // Auto-extract slug when URL changes
  useEffect(() => {
    const platform = currentQuestion.platform;
    const url = platform === "Leetcode" ? currentQuestion.leetcodeUrl : currentQuestion.codeforcesUrl;
    
    if (url) {
      const extractedSlug = extractSlugFromUrl(url, platform);
      if (extractedSlug && (!currentQuestion.slug || currentQuestion.slug === "")) {
        setCurrentQuestion(prev => ({
          ...prev,
          slug: extractedSlug
        }));
      }
    }
  }, [currentQuestion.leetcodeUrl, currentQuestion.codeforcesUrl, currentQuestion.platform]);

  const updateCurrentQuestion = (field: keyof Question, value: string) => {
    setCurrentQuestion((prev) => {
      const updated = { ...prev, [field]: value };
      
      if (field === "platform") {
        updated.leetcodeUrl = value === "Leetcode" ? updated.leetcodeUrl : "";
        updated.codeforcesUrl = value === "Codeforces" ? updated.codeforcesUrl : "";
      } else if (field === "difficulty") {
        updated.points = difficultyPoints[value as keyof typeof difficultyPoints];
      }
      
      return updated;
    });
    
    // Clear related error when field is updated
    if (field === "slug") {
      setFormErrors(prev => ({ ...prev, slug: undefined }));
    }
  };

  const handleTagToggle = (tag: string) => {
    setCurrentQuestion((prev) => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags: newTags };
    });
    
    // Clear tags error when tags are updated
    setFormErrors(prev => ({ ...prev, tags: undefined }));
  };

  const validateForm = (): boolean => {
    const errors: {slug?: string; tags?: string} = {};
    
    if (!currentQuestion.slug) {
      errors.slug = "Question name is required";
    }
    
    if (currentQuestion.tags.length === 0) {
      errors.tags = "At least one tag must be selected";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveQuestion = () => {
    if (!validateForm()) {
      // Show toast for each error
      Object.values(formErrors).forEach(error => {
        if (error) toast.error(error);
      });
      return;
    }
    
    if (editingIndex !== null) {
      // Update existing question
      setQuestions(prev => 
        prev.map((q, i) => i === editingIndex ? currentQuestion : q)
      );
      toast.success("Question updated");
    } else {
      // Add new question
      setQuestions(prev => [...prev, currentQuestion]);
      toast.success("Question added");
    }
    
    resetCurrentQuestion();
  };

  const editQuestion = (index: number) => {
    setCurrentQuestion(questions[index]);
    setEditingIndex(index);
    setFormErrors({});
  };

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
    toast.success("Question removed");
    
    if (editingIndex === index) {
      resetCurrentQuestion();
    }
  };

  const handleSubmit = async () => {
    if (questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post("/api/questionsInput", {
        headers: {
          "Content-Type": "application/json",
        },
        body: questions,
      });

      if (response.status === 200) {
        toast.success("Questions Added Successfully");
        setQuestions([]);
      }
    } catch (error) {
      console.log(error);
      toast.error("Questions were not created!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 mt-11">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Panel - Question Editor */}
          <div className="md:col-span-5 lg:col-span-4">
            <Card className="sticky top-8 bg-white shadow-none">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-500" />
                  {editingIndex !== null ? "Edit Question" : "Add New Question"}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-6 space-y-4">
                {currentQuestion.platform === "Leetcode" ? (
                  <div className="space-y-2">
                    <Label htmlFor="leetcodeUrl">Leetcode URL</Label>
                    <Input
                      id="leetcodeUrl"
                      placeholder="Enter Leetcode URL"
                      value={currentQuestion.leetcodeUrl}
                      onChange={(e) => updateCurrentQuestion("leetcodeUrl", e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="codeforcesUrl">Codeforces URL</Label>
                    <Input
                      id="codeforcesUrl"
                      placeholder="Enter Codeforces URL"
                      value={currentQuestion.codeforcesUrl}
                      onChange={(e) => updateCurrentQuestion("codeforcesUrl", e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="questionName" className="flex justify-between">
                    <span>Question Name</span>
                    {formErrors.slug && (
                      <span className="text-red-500 text-xs flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" /> {formErrors.slug}
                      </span>
                    )}
                  </Label>
                  <Input
                    id="questionName"
                    placeholder="Enter question name"
                    value={currentQuestion.slug}
                    onChange={(e) => updateCurrentQuestion("slug", e.target.value)}
                    className={formErrors.slug ? "border-red-500 focus:ring-red-500" : ""}
                  />
                  {(currentQuestion.leetcodeUrl || currentQuestion.codeforcesUrl) && 
                   currentQuestion.slug && (
                    <p className="text-xs text-gray-500 mt-1">
                      Name auto-extracted from URL. You can edit if needed.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select
                    value={currentQuestion.platform}
                    onValueChange={(value) => updateCurrentQuestion("platform", value)}
                  >
                    <SelectTrigger id="platform">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Leetcode">Leetcode</SelectItem>
                      <SelectItem value="Codeforces">Codeforces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={currentQuestion.difficulty}
                    onValueChange={(value) => updateCurrentQuestion("difficulty", value)}
                  >
                    <SelectTrigger id="difficulty">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(difficultyPoints).map((level) => (
                        <SelectItem key={level} value={level}>
                          <span className={`inline-flex items-center px-2 py-1 rounded-md ${getDifficultyColor(level)}`}>
                            {level} ({difficultyPoints[level as keyof typeof difficultyPoints]} pts)
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex justify-between">
                    <span>Tags</span>
                    {formErrors.tags && (
                      <span className="text-red-500 text-xs flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" /> {formErrors.tags}
                      </span>
                    )}
                  </Label>
                  <div className={`flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 border rounded-md ${
                    formErrors.tags ? "border-red-500" : ""
                  }`}>
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={currentQuestion.tags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleTagToggle(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Select at least one tag for the question
                  </p>
                </div>
              </CardContent>
              
              <CardFooter className="border-t pt-4 flex space-x-2">
                <Button
                  variant="outline"
                  onClick={resetCurrentQuestion}
                  className="w-1/2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveQuestion}
                  className="w-1/2"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {editingIndex !== null ? "Update" : "Add"}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Right Panel - Questions List */}
          <div className="md:col-span-7 lg:col-span-8 space-y-6">
            <Card className="bg-white shadow-none">
              <CardHeader className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-800">
                    Contest Questions ({questions.length})
                  </CardTitle>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || questions.length === 0}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Submit All
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4">
                {questions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Target className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700">No questions added yet</h3>
                    <p className="text-gray-500 max-w-sm mt-1">
                      Fill out the form on the left to add questions to your contest
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((q, index) => (
                      <Card 
                        key={index} 
                        className={`border ${
                          editingIndex === index ? 'border-indigo-300 ring-1 ring-indigo-300' : 'border-gray-200'
                        } hover:shadow-none transition-all`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-gray-800">{q.slug}</h3>
                                <Badge className={getDifficultyColor(q.difficulty)}>
                                  {q.difficulty}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                <Badge variant="outline">{q.platform}</Badge>
                                {q.platform === "Leetcode" && q.leetcodeUrl && (
                                  <a 
                                    href={q.leetcodeUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-xs text-indigo-600 hover:underline"
                                  >
                                    View on Leetcode <ExternalLink className="ml-1 h-3 w-3" />
                                  </a>
                                )}
                                {q.platform === "Codeforces" && q.codeforcesUrl && (
                                  <a 
                                    href={q.codeforcesUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-xs text-indigo-600 hover:underline"
                                  >
                                    View on Codeforces <ExternalLink className="ml-1 h-3 w-3" />
                                  </a>
                                )}
                              </div>
                              
                              <div className="flex flex-wrap gap-1 mb-2">
                                {q.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex items-start space-x-2">
                              <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">
                                {q.points} points
                              </Badge>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => editQuestion(index)}
                                className="h-8 w-8 p-0"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeQuestion(index)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}