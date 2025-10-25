"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
  Code,
  BookOpen,
  Brain,
  ChevronRight,
  Target,
  Trophy,
} from "lucide-react";
import useTagStore from "@/store/tagsStore";
import useStore from "@/store/store";

// Topic categories for color assignment with specific types
type TopicCategory = "algorithms" | "dataStructures" | "concepts";

// Mapping for icons and categories - maintained in frontend
const topicMappings: Record<
  string,
  {
    category: TopicCategory;
    icon: React.ReactNode;
  }
> = {
  PrefixSum: { category: "algorithms", icon: <Code className="h-5 w-5" /> },
  TwoPointers: { category: "algorithms", icon: <Code className="h-5 w-5" /> },
  BinarySearch: { category: "algorithms", icon: <Brain className="h-5 w-5" /> },
  LinearSearch: {
    category: "algorithms",
    icon: <Target className="h-5 w-5" />,
  },
  Sorting: { category: "algorithms", icon: <Code className="h-5 w-5" /> },
  DP: { category: "algorithms", icon: <Brain className="h-5 w-5" /> },
  Recursion: { category: "algorithms", icon: <Brain className="h-5 w-5" /> },
  "1DArrays": {
    category: "dataStructures",
    icon: <Code className="h-5 w-5" />,
  },
  "2DArrays": {
    category: "dataStructures",
    icon: <Code className="h-5 w-5" />,
  },
  Graph: { category: "dataStructures", icon: <Code className="h-5 w-5" /> },
  TimeComplexity: { category: "concepts", icon: <Code className="h-5 w-5" /> },
  SpaceComplexity: { category: "concepts", icon: <Code className="h-5 w-5" /> },
  BasicMaths: { category: "concepts", icon: <BookOpen className="h-5 w-5" /> },
  Exponentiation: {
    category: "concepts",
    icon: <BookOpen className="h-5 w-5" />,
  },
};

// Default fallbacks for unknown topics
const defaultMapping = {
  category: "concepts" as TopicCategory,
  icon: <Code className="h-5 w-5" />,
};

// Color schemes based on category
const categoryColors: Record<
  TopicCategory,
  {
    bg: string;
    border: string;
    text: string;
    lightBg: string;
  }
> = {
  algorithms: {
    bg: "bg-zinc-800",
    border: "border-zinc-700",
    text: "text-zinc-800",
    lightBg: "bg-zinc-100",
  },
  dataStructures: {
    bg: "bg-zinc-800",
    border: "border-zinc-700",
    text: "text-zinc-800",
    lightBg: "bg-zinc-100",
  },
  concepts: {
    bg: "bg-zinc-800",
    border: "border-zinc-700",
    text: "text-zinc-800",
    lightBg: "bg-zinc-100",
  },
};

const TopicGrid: React.FC = () => {
  const { tags, setTags } = useTagStore();
  const [loading, setLoading] = useState<boolean>(false);
  const [currentTopic, setCurrentTopic] = useState<string>("");
  const { isDarkMode } = useStore();
  const [progress, setProgress] = useState<number>(0);
  const [topicProgress, setTopicProgress] = useState<
    Record<
      string,
      {
        total: number;
        solved: number;
        percentage: number;
      }
    >
  >({});
  const [shimmerLoading, setShimmerLoading] = useState<boolean>(true);

  const fn = async () => {
    const res = await axios.get("/api/getTags");
    console.log(res);
    //@ts-expect-error: not needed here.
    const tags = res.data.map((p) => p.name);
    setTags(tags);
  };

  useEffect(() => {
    fn();
  }, []);

  useEffect(() => {
    fetchTopicProgress();
    // Simulate initial loading
    setTimeout(() => {
      setShimmerLoading(false);
    }, 1500);
  }, []);

  const fetchTopicProgress = async (): Promise<void> => {
    try {
      const response = await axios.get("/api/getProgress");
      if (!response.data) return;
      setTopicProgress(response.data.topicProgress);
    } catch (error) {
      console.error("Error fetching topic progress:", error);
    }
  };

  const handleTopicClick = async (topic: string): Promise<void> => {
    setLoading(true);
    setCurrentTopic(topic);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    try {
      const response = await axios.post("/api/getTopicQuestions", {
        topic: topic,
      });
      console.log("Response:", response.data);
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setLoading(false);
      clearInterval(progressInterval);
      setProgress(0);
    }
  };

  // Helper function to get styling for a topic
  const getTopicStyling = (topic: string) => {
    const mapping = topicMappings[topic] || defaultMapping;
    return {
      icon: mapping.icon,
      colors: categoryColors[mapping.category],
    };
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? "bg-[#0A0A0A]" : "bg-white"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 space-t-8">
        {/* Loading progress indicator */}
        {loading && (
          <div className="fixed top-0 left-0 w-full z-50">
            <Progress value={progress} className="w-full h-1" />
          </div>
        )}

        <Card
          className={`p-3 rounded-t-4xl rounded-b-none border-0 ${
            isDarkMode ? "bg-[#181818]" : "bg-zinc-100"
          }`}
        >
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle
                  className={`text-3xl font-bold ${
                    isDarkMode ? "text-gray-200" : "text-gray-800"
                  }`}
                >
                  DSA <span className={isDarkMode ? 'text-zinc-300' : 'text-zinc-900'}>Topics</span>
                </CardTitle>
                <p
                  className={`mt-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Master these topics to ace your technical interviews!
                </p>
              </div>
              <div className="flex p-2 justify-center items-center">
                <Trophy className={`h-10 w-10 mx-3 ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`} />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Topics grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {shimmerLoading
                ? // Shimmer loading effect for cards
                  Array(8)
                    .fill(0)
                    .map((_, index) => (
                      <Card
                        key={index}
                        className={`h-48 animate-pulse ${
                          isDarkMode
                            ? "bg-[#262626]"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div
                              className={`h-4 w-24 rounded ${
                                isDarkMode ? "bg-[#333333]" : "bg-gray-200"
                              }`}
                            ></div>
                            <div
                              className={`h-6 w-6 rounded-full ${
                                isDarkMode ? "bg-[#333333]" : "bg-gray-200"
                              }`}
                            ></div>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="space-y-4">
                            <div
                              className={`h-2 w-full rounded-full ${
                                isDarkMode ? "bg-[#333333]" : "bg-gray-200"
                              }`}
                            ></div>
                            <div className="flex justify-between">
                              <div
                                className={`h-4 w-16 rounded ${
                                  isDarkMode ? "bg-[#333333]" : "bg-gray-200"
                                }`}
                              ></div>
                              <div
                                className={`h-4 w-12 rounded ${
                                  isDarkMode ? "bg-[#333333]" : "bg-gray-200"
                                }`}
                              ></div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <div
                            className={`h-8 w-full rounded-md ${
                              isDarkMode ? "bg-[#333333]" : "bg-gray-200"
                            }`}
                          ></div>
                        </CardFooter>
                      </Card>
                    ))
                : tags.map((topic) => {
                    const { colors, icon } = getTopicStyling(topic);
                    const topicData = topicProgress[topic] || {
                      total: 0,
                      solved: 0,
                      percentage: 0,
                    };

                    // Dark mode color variations for categories
                    const getDarkModeColors = () => {
                      const darkColorSchemes: Record<
                        TopicCategory,
                        {
                          bg: string;
                          border: string;
                          text: string;
                          lightBg: string;
                        }
                      > = {
                        algorithms: {
                          bg: "bg-zinc-800",
                          border: "border-zinc-700/50",
                          text: isDarkMode ? "text-zinc-200" : "text-zinc-800",
                          lightBg: isDarkMode ? "bg-[#111111]" : "bg-zinc-100",
                        },
                        dataStructures: {
                          bg: "bg-zinc-800",
                          border: "border-zinc-700/50",
                          text: isDarkMode ? "text-zinc-200" : "text-zinc-800",
                          lightBg: isDarkMode ? "bg-[#111111]" : "bg-zinc-100",
                        },
                        concepts: {
                          bg: isDarkMode ? "bg-green-400" :"bg-green-600",
                          border: "border-zinc-700/50",
                          text: isDarkMode ? "text-zinc-200" : "text-zinc-800",
                          lightBg: isDarkMode ? "bg-[#111111]" : "bg-zinc-100",
                        },
                      };

                      const mapping = topicMappings[topic] || defaultMapping;
                      return darkColorSchemes[mapping.category];
                    };

                    const adaptiveColors = getDarkModeColors();

                    return (
                      <Link
                        key={topic}
                        href={`/topicwiseQuestions/s/${topic}/s/BEGINNER/EASY/MEDIUM/HARD/VERYHARD`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <Card
                          className={`
                    transform
                    transition-all 
                    duration-300
                    shadow-none
                    border-0
                    rounded-2xl
                    overflow-hidden ${
                      isDarkMode ? adaptiveColors.border : colors.border
                    }
                    ${
                      isDarkMode
                        ? "bg-[#262626]"
                        : "bg-zinc-200"
                    }
                    ${
                      loading && currentTopic === topic
                        ? adaptiveColors.lightBg
                        : isDarkMode
                        ? "bg-[#262626]"
                        : "bg-white"
                    }
                  `}
                          onClick={() => handleTopicClick(topic)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-1 rounded ${isDarkMode ? 'bg-[#111111] text-white/50' : 'bg-zinc-100 text-black/50'} `}>{icon}</div>
                                <h3 className={`text-lg font-semibold ${adaptiveColors.text}`}>{topic}</h3>
                              </div>
                              <div className={`${adaptiveColors.lightBg} ${isDarkMode ? 'text-green-400' : 'text-green-500 font-bold'} px-3 py-0.5 text-xs rounded-full`}>
                                {topicData.solved || 0}/{topicData.total || 0}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-4">
                            <div className="space-y-3">
                              <div className="relative">
                                <div
                                  className={`w-full rounded-full h-2.5 ${
                                    isDarkMode ? "bg-[#333333]" : "bg-gray-100"
                                  }`}
                                >
                                  <div
                                    className={`${adaptiveColors.bg} h-2.5 rounded-full`}
                                    style={{
                                      width: `${topicData.percentage}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                              {/* <div
                                className={`flex justify-between items-center text-sm ${
                                  isDarkMode ? "text-zinc-500" : "text-zinc-600"
                                }`}
                              >
                                <span>Progress</span>
                                <span className="font-medium">
                                  {topicData.solved || 0}/{topicData.total || 0}
                                </span>
                              </div> */}
                            </div>
                          </CardContent>
                          <CardFooter>
                            <div
                              className={`w-full px-3 py-2 rounded-lg flex items-center justify-center ${adaptiveColors.lightBg} ${adaptiveColors.text} text-sm font-medium`}
                            >
                              Practice Questions{" "}
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </div>
                          </CardFooter>
                        </Card>
                      </Link>
                    );
                  })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TopicGrid;
