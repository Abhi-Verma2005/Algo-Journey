import React, { useState, useEffect } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PencilIcon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Difficulty } from '@prisma/client';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import axios from 'axios';
import toast from 'react-hot-toast';
import useTagStore from '@/store/tagsStore';


const DIFFICULTY_LEVELS = [
  { id: "beginner", value: "BEGINNER", label: "Beginner" },
  { id: "easy", value: "EASY", label: "Easy" },
  { id: "medium", value: "MEDIUM", label: "Medium" },
  { id: "hard", value: "HARD", label: "Hard" },
  { id: "veryhard", value: "VERYHARD", label: "Very Hard" }
];

const DIFFICULTY_POINTS = {
  BEGINNER: 2,
  EASY: 4,
  MEDIUM: 6,
  HARD: 8,
  VERYHARD: 10,
};

// Define the form schema for updating a question
const questionUpdateSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  leetcodeUrl: z.union([
    z.string().url("Must be a valid URL if provided"),
    z.string().max(0), // Empty string
    z.literal(null)
  ]).optional(),
  codeforcesUrl: z.union([
    z.string().url("Must be a valid URL if provided"),
    z.string().max(0), // Empty string
    z.literal(null)
  ]).optional(),
  difficulty: z.enum(["BEGINNER", "EASY", "MEDIUM", "HARD", "VERYHARD"], {
    required_error: "Difficulty is required",
  }),
  points: z.coerce.number().min(1, "Points must be at least 1"),
  tags: z.array(z.string()).min(1, "At least one tag is required"),
  inArena: z.boolean().default(false),
});

type QuestionFormValues = z.infer<typeof questionUpdateSchema>;

// Define the question interface based on your data structure
interface Question {
  id: string;
  slug: string;
  leetcodeUrl: string | null;
  codeforcesUrl: string | null;
  difficulty: Difficulty;
  points: number;
  questionTags: { id: string; name: string }[];
  inArena: boolean;
}

interface UpdateQuestionComponentProps {
  questionId: string;
  questionSlug: string;
  isAdmin: boolean;
  question: Question;
  children: React.ReactNode;
}

const UpdateQuestionComponent: React.FC<UpdateQuestionComponentProps> = ({
  questionId,
  questionSlug,
  isAdmin,
  question,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { tags } = useTagStore()

  // Initialize the form
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionUpdateSchema),
    defaultValues: {
      slug: "",
      leetcodeUrl: "",
      codeforcesUrl: "",
      difficulty: "MEDIUM" as Difficulty,
      points: DIFFICULTY_POINTS.MEDIUM,
      tags: [],
      inArena: false,
    },
  });

  // Update points whenever difficulty changes
  useEffect(() => {
    const difficultyValue = form.watch("difficulty") as keyof typeof DIFFICULTY_POINTS;
    const newPoints = DIFFICULTY_POINTS[difficultyValue];
    form.setValue("points", newPoints);
  }, [form.watch("difficulty")]);

  // Initialize form with question data when modal opens
  const initializeForm = () => {
    // Get tags from question
    const currentTags = question.questionTags.map(tag => tag.name);
    setSelectedTags(currentTags);

    // Reset form with question data
    form.reset({
      slug: question.slug,
      leetcodeUrl: question.leetcodeUrl || "",
      codeforcesUrl: question.codeforcesUrl || "",
      difficulty: question.difficulty,
      points: question.points,
      tags: currentTags,
      inArena: question.inArena,
    });
  };

  const handleOpenModal = () => {
    if (!isAdmin) return;
    setIsOpen(true);
    initializeForm();
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag];
      
      form.setValue("tags", newTags);
      return newTags;
    });
  };

  const onSubmit = async (data: QuestionFormValues) => {
    if (!isAdmin) return;
    setIsLoading(true);

    try {
      // Convert empty strings to null for URLs
      const leetcodeUrl = data.leetcodeUrl && data.leetcodeUrl.trim() !== "" ? data.leetcodeUrl : null;
      const codeforcesUrl = data.codeforcesUrl && data.codeforcesUrl.trim() !== "" ? data.codeforcesUrl : null;

      const updateData = {
        ...data,
        leetcodeUrl,
        codeforcesUrl,
      };

      const response = await axios.put(`/api/questions/${questionId}`, { updateData });

      if (response.status !== 200) {
        throw new Error('Failed to update question');
      }

      toast.success('Question Updated')
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating question:", error);
      toast.error("Failed to update question.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isAdmin ? (
        <ContextMenu>
          <ContextMenuTrigger>{children}</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={handleOpenModal}>
              <PencilIcon className="h-4 w-4 mr-2" /> Edit Question
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ) : (
        children
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Update Question: {questionSlug}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="two-sum" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="leetcodeUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LeetCode URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://leetcode.com/problems/example" {...field} value={field.value || ''}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="codeforcesUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Codeforces URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://codeforces.com/problemset/problem/example" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DIFFICULTY_LEVELS.map((level) => (
                            <SelectItem key={level.id} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          {...field} 
                          disabled 
                          className="bg-muted cursor-not-allowed" 
                        />
                      </FormControl>
                      <FormDescription>
                        Points are automatically set based on difficulty
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="inArena"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-none">
                    <div className="space-y-0.5">
                      <FormLabel>Arena Status</FormLabel>
                      <FormDescription>
                        Toggle to include this question in the Arena
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={() => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormDescription>Select at least one tag that applies to this question</FormDescription>
                    <div className="border rounded-md p-2">
                      <ScrollArea className="h-48 w-full">
                        <div className="space-y-2">
                          {tags.map(tag => (
                            <div key={tag} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`tag-${tag}`} 
                                checked={selectedTags.includes(tag)}
                                onCheckedChange={() => handleTagToggle(tag)}
                              />
                              <label 
                                htmlFor={`tag-${tag}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {tag}
                              </label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                    
                    <div className="mt-2">
                      <div className="text-sm font-medium mb-1">Selected Tags:</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedTags.length === 0 ? (
                          <span className="text-muted-foreground text-sm">No tags selected</span>
                        ) : (
                          selectedTags.map(tag => (
                            <Badge 
                              key={tag} 
                              variant="secondary"
                              className="cursor-pointer"
                              onClick={() => handleTagToggle(tag)}
                            >
                              {tag} ×
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                    
                    {form.formState.errors.tags && (
                      <p className="text-sm font-medium text-destructive">
                        {form.formState.errors.tags.message}
                      </p>
                    )}
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Question"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UpdateQuestionComponent;