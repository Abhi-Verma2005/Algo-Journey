import React, { useState, useEffect, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Edit, Sparkles, Tag as TagIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";
import axios from "axios";
import useStore from "@/store/store";

interface HintsComponentProps {
  questionId: string;
  questionSlug: string;
  primaryTagName?: string; 
  isAdmin?: boolean;
  children?: ReactNode;
  onSave?: () => void;
  isDarkMode?: boolean;
}

interface TagOption {
  id: string;
  name: string;
}

// Add these interfaces at the top of your file, after the existing interfaces

interface RatingData {
  likes: number;
  dislikes: number;
  userRating: boolean | null; // true for like, false for dislike, null for no rating
}

interface RatingsState {
  [tagHintId: string]: RatingData;
}

// Replace your existing TagHint interface with this updated version
interface TagHint {
  id: string;
  tagId: string;
  tagName: string;
  hints: {
    id: string;
    content: string;
    sequence: number;
  }[];
  ratings?: RatingData; // Optional since it might not always be included
}




interface Hint {
  hint1: string;
  hint2: string;
  hint3: string;
}

interface TagHint {
  id: string;
  tagId: string;
  tagName: string;
  hints: {
    id: string;
    content: string;
    sequence: number;
  }[];
}

export default function HintsComponent({
  questionId,
  questionSlug,
  primaryTagName,
  isAdmin = false,
  children,
  onSave,
}: HintsComponentProps) {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState<Hint>({
    hint1: "",
    hint2: "",
    hint3: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { isDarkMode } = useStore()
  const [activeTab, setActiveTab] = useState("hint1");
  const [ratings, setRatings] = useState<RatingsState>({});
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalHint, setOriginalHint] = useState<Hint>({
    hint1: "",
    hint2: "",
    hint3: "",
  });
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string>("");
  const [primaryTagId, setPrimaryTagId] = useState<string>("");
  const [tagHints, setTagHints] = useState<TagHint[]>([]);
  
  // Replace your existing useEffect with this fixed version:

useEffect(() => {
  if (!open) return;
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const tagsResponse = await axios.get(`/api/questions/${questionId}/tags`);
      if (tagsResponse.data) {
        setAvailableTags(tagsResponse.data);
        
        let tagToUse = null;
        
        if (primaryTagName) {
          tagToUse = tagsResponse.data.find((tag: TagOption) => 
            tag.name.toLowerCase() === primaryTagName.toLowerCase()
          );
        }
        
        if (!tagToUse) {
          tagToUse = tagsResponse.data.find((tag: TagOption) => 
            tag.name === "Two Pointers"
          ) || (tagsResponse.data.length > 0 ? tagsResponse.data[0] : null);
        }
        
        if (tagToUse) {
          setPrimaryTagId(tagToUse.id);
          setSelectedTagId(tagToUse.tagId);
        }
      }
      
      const hintsResponse = await axios.get(`/api/tag-hints/${questionId}`);
      
      if (hintsResponse.data && hintsResponse.data.length > 0) {
        setTagHints(hintsResponse.data);
        
        
        const ratingsData: RatingsState = {};
        let primaryTagHintId = '';
        
        //@ts-expect-error: no need here 
        hintsResponse.data.forEach((tagHint) => {
          ratingsData[tagHint.id] = tagHint.ratings;
          
         
          if (primaryTagName && tagHint.tagName.toLowerCase() === primaryTagName.toLowerCase()) {
            primaryTagHintId = tagHint.id;
          } else if (!primaryTagName && tagHint.tagName === "Two Pointers") {
            primaryTagHintId = tagHint.id;
          }
        });
        
        
        if (!primaryTagHintId && hintsResponse.data.length > 0) {
          primaryTagHintId = hintsResponse.data[0].id;
        }
        
        setRatings(ratingsData);
        
        //@ts-expect-error: no need here
        const tagHintForPrimary = hintsResponse.data.find((th) => 
          primaryTagName ? 
            th.tagName.toLowerCase() === primaryTagName.toLowerCase() :
            th.tagName === "Two Pointers"
        ) || hintsResponse.data[0];
        
        if (tagHintForPrimary) {
         
          setPrimaryTagId(primaryTagHintId); 
          setSelectedTagId(tagHintForPrimary.tagId); 
          
          const hintData = {
            //@ts-expect-error: no need here 
            hint1: tagHintForPrimary.hints.find((h) => h.sequence === 1)?.content || "",
            //@ts-expect-error: no need here 
            hint2: tagHintForPrimary.hints.find((h) => h.sequence === 2)?.content || "",
            //@ts-expect-error: no need here 
            hint3: tagHintForPrimary.hints.find((h) => h.sequence === 3)?.content || "",
          };
          setHint(hintData);
          setOriginalHint(JSON.parse(JSON.stringify(hintData)));
        }
      } 
      else {
        // If no tag hints exist, fall back to legacy hints
        await fetchLegacyHints();
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load hints data");
      await fetchLegacyHints();
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchLegacyHints = async () => {
    try {
      const response = await axios.get(`/api/hints/${questionId}`);
      if (response.data) {
        const hintData = {
          hint1: response.data.hint1 || "",
          hint2: response.data.hint2 || "",
          hint3: response.data.hint3 || "",
        };
        setHint(hintData);
        setOriginalHint(JSON.parse(JSON.stringify(hintData)));
      }
    } catch (error) {
      console.error("Error fetching legacy hints:", error);
    }
  };
  
  fetchData();
}, [questionId, open, primaryTagName]);
  
  // Update hints when tag selection changes (only for admin in edit mode)
  useEffect(() => {
    if (!selectedTagId || !open || tagHints.length === 0) return;
    
    const selectedTagHint = tagHints.find(th => th.tagId === selectedTagId);
    
    if (selectedTagHint) {
      const hintData = {
        hint1: selectedTagHint.hints.find(h => h.sequence === 1)?.content || "",
        hint2: selectedTagHint.hints.find(h => h.sequence === 2)?.content || "",
        hint3: selectedTagHint.hints.find(h => h.sequence === 3)?.content || "",
      };
      setHint(hintData);
      setOriginalHint(JSON.parse(JSON.stringify(hintData)));
    } else {
      // Reset hints if switching to a tag with no hints yet
      setHint({
        hint1: "",
        hint2: "",
        hint3: "",
      });
      setOriginalHint({
        hint1: "",
        hint2: "",
        hint3: "",
      });
    }
  }, [selectedTagId, tagHints, open, isEditMode]);
  
  const handleInputChange = (field: keyof Hint, value: string) => {
    setHint(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const handleTagChange = (tagId: string) => {
    if (!isEditMode) return;
    
    if (JSON.stringify(hint) !== JSON.stringify(originalHint)) {
      const confirmed = window.confirm(
        "Changing tags will discard any unsaved changes. Continue?"
      );
      if (!confirmed) return;
    }
    
    setSelectedTagId(tagId);
  };
  
  const handleSubmit = async () => {
    if (!hint.hint1.trim() || !hint.hint2.trim() || !hint.hint3.trim()) {
      toast.error("All three hints are required.");
      return;
    }
    
    try {
      setIsSaving(true);
      
      if (!selectedTagId) {
        toast.error("Please select a tag first.");
        return;
      }
      
      await axios.post("/api/tag-hints", {
        questionId,
        tagId: selectedTagId,
        hints: [
          { content: hint.hint1, sequence: 1 },
          { content: hint.hint2, sequence: 2 },
          { content: hint.hint3, sequence: 3 },
        ],
      });
      
      const updatedTagHints = [...tagHints];
      const existingIndex = updatedTagHints.findIndex(th => th.tagId === selectedTagId);
      
      if (existingIndex >= 0) {
        updatedTagHints[existingIndex].hints = [
          { id: updatedTagHints[existingIndex].hints.find(h => h.sequence === 1)?.id || "", content: hint.hint1, sequence: 1 },
          { id: updatedTagHints[existingIndex].hints.find(h => h.sequence === 2)?.id || "", content: hint.hint2, sequence: 2 },
          { id: updatedTagHints[existingIndex].hints.find(h => h.sequence === 3)?.id || "", content: hint.hint3, sequence: 3 },
        ];
      } else {
        const tagName = availableTags.find(t => t.id === selectedTagId)?.name || "";
        updatedTagHints.push({
          id: "",
          tagId: selectedTagId,
          tagName,
          hints: [
            { id: "", content: hint.hint1, sequence: 1 },
            { id: "", content: hint.hint2, sequence: 2 },
            { id: "", content: hint.hint3, sequence: 3 },
          ],
        });
      }
      
      setTagHints(updatedTagHints);
      setOriginalHint(JSON.parse(JSON.stringify(hint)));
      
      toast.success("Hints saved successfully!");
      
      if (onSave) {
        onSave();
      }
      
      setIsEditMode(false);
    } catch (error) {
      console.error("Error saving hints:", error);
      toast.error("Failed to save hints. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRating = async (tagHintId: string, isHelpful: boolean) => {
  if (!tagHintId) return;
  
  setIsRatingLoading(true);
  try {
    const response = await axios.post('/api/tag-hints/rating', {
      tagHintId,
      isHelpful
    });
    
    if (response.data.success) {
      // Update local state with new counts and user rating
      setRatings(prev => ({
        ...prev,
        [tagHintId]: {
          likes: response.data.counts.likes,
          dislikes: response.data.counts.dislikes,
          userRating: response.data.userRating
        }
      }));
      
      toast.success(response.data.userRating === null ? 'Rating removed' : 
                   response.data.userRating ? 'Marked as helpful!' : 'Feedback received');
    }
  } catch (error) {
    console.error('Rating error:', error);
    toast.error('Failed to submit rating');
  } finally {
    setIsRatingLoading(false);
  }
};

const renderTagRatings = () => (
  <div className={`mb-6 space-y-3 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} p-4 rounded-lg`}>
    <h3 className={`text-sm font-medium flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
      <TagIcon className="h-4 w-4 mr-2 text-indigo-500" />
      Ratings by Tag
    </h3>
    {tagHints.map(tagHint => (
      <div key={tagHint.id} className={`flex items-center justify-between p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          {tagHint.tagName}
        </span>
        <div className="flex items-center gap-4">
          <span className="text-green-600 flex items-center text-sm">
            👍 {ratings[tagHint.id]?.likes || 0}
          </span>
          <span className="text-red-600 flex items-center text-sm">
            👎 {ratings[tagHint.id]?.dislikes || 0}
          </span>
        </div>
      </div>
    ))}
  </div>
);

  const renderEditableTabs = () => (
    <div className="space-y-6">
      <div className="mb-4">
        <label className={`block text-sm font-medium mb-2 items-center ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          <TagIcon className="h-4 w-4 mr-2 text-indigo-500" />
          Tag for these hints:
        </label>
        <Select value={selectedTagId} onValueChange={handleTagChange}>
          <SelectTrigger className={`w-full border-gray-200 hover:border-indigo-300 transition-colors ${
            isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-100 hover:border-indigo-400' : 'bg-white'
          }`}>
            <SelectValue placeholder="Select a tag" />
          </SelectTrigger>
          <SelectContent className={isDarkMode ? 'bg-gray-800 border-gray-600' : ''}>
            {availableTags.map((tag) => (
              <SelectItem 
                key={tag.id} 
                value={tag.id}
                className={isDarkMode ? 'text-gray-100 hover:bg-gray-700 focus:bg-gray-700' : ''}
              >
                {tag.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid grid-cols-3 mb-4 ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
          <TabsTrigger 
            value="hint1" 
            className={`${
              isDarkMode 
                ? 'data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-gray-300' 
                : 'data-[state=active]:bg-indigo-500 data-[state=active]:text-white'
            }`}
          >
            Hint 1
          </TabsTrigger>
          <TabsTrigger 
            value="hint2" 
            className={`${
              isDarkMode 
                ? 'data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-gray-300' 
                : 'data-[state=active]:bg-indigo-500 data-[state=active]:text-white'
            }`}
          >
            Hint 2
          </TabsTrigger>
          <TabsTrigger 
            value="hint3" 
            className={`${
              isDarkMode 
                ? 'data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-gray-300' 
                : 'data-[state=active]:bg-indigo-500 data-[state=active]:text-white'
            }`}
          >
            Solution Approach
          </TabsTrigger>
        </TabsList>
        
        <Card className={`shadow-none ${
          isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100'
        }`}>
          <CardContent className="p-6">
            <TabsContent value="hint1">
              <Textarea
                id="hint1"
                placeholder="Enter the first hint (basic direction)"
                value={hint.hint1}
                onChange={(e) => handleInputChange("hint1", e.target.value)}
                className={`min-h-32 h-64 whitespace-pre-wrap focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-indigo-400' 
                    : 'border-gray-200 focus:border-indigo-300'
                }`}
              />
            </TabsContent>
            
            <TabsContent value="hint2">
              <Textarea
                id="hint2"
                placeholder="Enter the second hint (more specific approach)"
                value={hint.hint2}
                onChange={(e) => handleInputChange("hint2", e.target.value)}
                className={`min-h-32 h-64 whitespace-pre-wrap focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-indigo-400' 
                    : 'border-gray-200 focus:border-indigo-300'
                }`}
              />
            </TabsContent>
            
            <TabsContent value="hint3">
              <Textarea
                id="hint3"
                placeholder="Enter the third hint (almost solution)"
                value={hint.hint3}
                onChange={(e) => handleInputChange("hint3", e.target.value)}
                className={`min-h-32 h-64 whitespace-pre-wrap focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-indigo-400' 
                    : 'border-gray-200 focus:border-indigo-300'
                }`}
              />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );

  const renderReadOnlyTabs = () => (
    <div className="space-y-4">
      {isAdmin && tagHints.length > 0 && renderTagRatings()}
      {isAdmin && ratings[primaryTagId] && (
  <div className={`mb-4 p-3 rounded-lg ${
    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
  }`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <TagIcon className="h-4 w-4 mr-2 text-indigo-500" />
        <span className={`text-sm font-medium ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Tag: {availableTags.find(tag => tag.id === primaryTagId)?.name || "N/A"}
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-green-600 flex items-center">
          👍 {ratings[primaryTagId]?.likes || 0}
        </span>
        <span className="text-red-600 flex items-center">
          👎 {ratings[primaryTagId]?.dislikes || 0}
        </span>
      </div>
    </div>
  </div>
)}
    
      <Tabs defaultValue="hint1" className="w-full">
        <TabsList className={`grid grid-cols-3 mb-4 ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
          <TabsTrigger 
            value="hint1" 
            className={`${
              isDarkMode 
                ? 'data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-gray-300' 
                : 'data-[state=active]:bg-indigo-500 data-[state=active]:text-white'
            }`}
          >
            Hint 1
          </TabsTrigger>
          <TabsTrigger 
            value="hint2" 
            className={`${
              isDarkMode 
                ? 'data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-gray-300' 
                : 'data-[state=active]:bg-indigo-500 data-[state=active]:text-white'
            }`}
          >
            Hint 2
          </TabsTrigger>
          <TabsTrigger 
            value="hint3" 
            className={`${
              isDarkMode 
                ? 'data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-gray-300' 
                : 'data-[state=active]:bg-indigo-500 data-[state=active]:text-white'
            }`}
          >
            Solution Approach
          </TabsTrigger>
        </TabsList>
        
        <Card className={`shadow-none ${
          isDarkMode ? 'border-gray-600' : 'border-amber-100'
        }`}>
          <CardContent className="p-0">
            <TabsContent value="hint1" className={`p-6 rounded-md m-0 max-h-64 overflow-y-auto ${
              isDarkMode ? 'bg-gray-700' : 'bg-amber-50'
            }`}>
              <p className={`whitespace-pre-wrap ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{hint.hint1 || "No hint available."}</p>
            </TabsContent>
            <TabsContent value="hint2" className={`p-6 rounded-md m-0 max-h-64 overflow-y-auto ${
              isDarkMode ? 'bg-gray-700' : 'bg-amber-50'
            }`}>
              <p className={`whitespace-pre-wrap ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{hint.hint2 || "No hint available."}</p>
            </TabsContent>
            <TabsContent value="hint3" className={`p-6 rounded-md m-0 max-h-64 overflow-y-auto ${
              isDarkMode ? 'bg-gray-700' : 'bg-amber-50'
            }`}>
              <p className={`whitespace-pre-wrap ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{hint.hint3 || "No hint available."}</p>

            </TabsContent>
          </CardContent>
          
        </Card>
        {!isAdmin && (
  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
    <div className="flex items-center gap-2">
      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Was this helpful?
      </span>
    </div>
    <div className="flex items-center gap-4">
      <button
        onClick={() => handleRating(primaryTagId, true)}
        disabled={isRatingLoading}
        className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors ${
          ratings[primaryTagId]?.userRating === true
            ? 'bg-green-100 text-green-700 border border-green-300'
            : isDarkMode 
              ? 'text-gray-400 hover:text-green-400 hover:bg-gray-700' 
              : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
        }`}
      >
        👍 {ratings[primaryTagId]?.likes || 0}
      </button>
      <button
        onClick={() => handleRating(primaryTagId, false)}
        disabled={isRatingLoading}
        className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors ${
          ratings[primaryTagId]?.userRating === false
            ? 'bg-red-100 text-red-700 border border-red-300'
            : isDarkMode 
              ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700' 
              : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
        }`}
      >
        👎 {ratings[primaryTagId]?.dislikes || 0}
      </button>
    </div>
  </div>
)}
      </Tabs>
    </div>
  );

  const handleAdminOpen = () => {
    setIsEditMode(false);
    setOpen(true);
  };

  const handleCancel = () => {
    setHint(JSON.parse(JSON.stringify(originalHint))); // Restore from original values
    setIsEditMode(false);
    if (!originalHint.hint1 && !originalHint.hint2 && !originalHint.hint3) {
      setOpen(false);
    }
  };

  // Default button if no children provided
  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className={`transition-colors ${
        isDarkMode 
          ? 'border-amber-600 bg-amber-900/20 text-amber-400 hover:bg-amber-800/30' 
          : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
      }`}
    >
      <Sparkles className="mr-2 h-4 w-4" />
      Hints
    </Button>
  );

  return (
    <>
      {/* For admin double-click functionality */}
      {isAdmin && children && (
        <div
          onDoubleClick={handleAdminOpen}
          className="cursor-pointer"
          title="Double-click to edit hints"
        >
          {children}
        </div>
      )}
      
      {/* Regular dialog with trigger */}
      <Dialog open={open} onOpenChange={(newOpen) => {
        // If closing and in edit mode, reset to original values
        if (!newOpen && isEditMode) {
          handleCancel();
        }
        setOpen(newOpen);
      }}>
        {/* Only render DialogTrigger when we have no direct open method (non-admin or no children) */}
        {(!isAdmin || !children) && (
          <DialogTrigger asChild>
            {children || defaultTrigger}
          </DialogTrigger>
        )}
        
        <DialogContent className={`sm:max-w-2xl backdrop-blur-sm shadow-none max-h-[90vh] flex flex-col ${
          isDarkMode 
            ? 'bg-gray-800/95 border-gray-600 text-gray-100' 
            : 'bg-white/95 border-gray-100'
        }`}>
          <DialogHeader className={`border-b pb-4 ${
            isDarkMode ? 'border-gray-600' : 'border-gray-100'
          }`}>
            <div className="flex justify-between items-center">
              <DialogTitle className={`text-xl font-bold flex items-center gap-2 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>
                {isEditMode ? (
                  <>
                    <Edit className="h-5 w-5 text-indigo-500" />
                    Edit Hints: {questionSlug}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Hints for {questionSlug}
                  </>
                )}
              </DialogTitle>
              {isAdmin && !isEditMode && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditMode(true)}
                  className={`${
                    isDarkMode 
                      ? 'text-indigo-400 hover:bg-indigo-900/20' 
                      : 'text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </DialogHeader>

          {(isLoading || isRatingLoading) ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className={`ml-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Loading hints...</span>
            </div>
          ) : (
            <div className="py-4 overflow-y-auto flex-1">
              {isEditMode ? renderEditableTabs() : renderReadOnlyTabs()}
              
              {isEditMode && (
                <div className={`flex justify-end gap-3 mt-6 pt-4 border-t ${
                  isDarkMode ? 'border-gray-600' : 'border-gray-100'
                }`}>
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    className={`${
                      isDarkMode 
                        ? 'border-gray-600 hover:bg-gray-700 text-gray-300' 
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSaving}
                    className={`text-white ${
                      isDarkMode 
                        ? 'bg-indigo-600 hover:bg-indigo-700' 
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Hints
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}