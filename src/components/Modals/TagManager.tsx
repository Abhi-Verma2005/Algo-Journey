"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tag, Plus, X, Save, Loader } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
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

const TagManager = () => {
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // ✅ Fetch tags safely
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get("/api/getTags");

        if (res.status === 200 && Array.isArray(res.data)) {
          setTags(res.data.map((tag: { name: string }) => tag.name));
        } else {
          toast.error("Invalid data received");
        }
      } catch (error) {
        console.error("Error fetching tags:", error);
        toast.error("Failed to load tags");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTags();
  }, []);

  // ✅ Safe method to add a tag
  const addTag = () => {
    const trimmedTag = newTag.trim().toLowerCase(); // Normalize tags

    if (!trimmedTag) {
      toast.error("Tag cannot be empty");
      return;
    }
    if (tags.includes(trimmedTag)) {
      toast.error("Tag already exists");
      return;
    }

    setTags([...tags, trimmedTag]);
    setNewTag("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTag();
    }
  };

  // ✅ Safe method to remove a tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // ✅ Safe method to save tags
  const saveTags = async () => {
    setIsSaving(true);
    try {
      const res = await axios.post("/api/updateTags", { tags });

      if (res.status === 200) {
        toast.success("Tags updated successfully");
        setShowConfirmation(false);
      } else {
        toast.error("Unable to update tags");
      }
    } catch (error) {
      console.error("Error updating tags:", error);
      toast.error("Failed to update tags");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-8 pt-20 space-y-8">
      <Card className="bg-white/90 shadow-none hover:shadow-none transition-all border-gray-100">
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Tag className="h-5 w-5 text-indigo-500" />
                Manage Tags
              </CardTitle>
              <CardDescription className="text-gray-500">
                Add, remove, and organize problem tags
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex gap-2 mb-6">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Enter a tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                disabled={isLoading || isSaving}
              />
            </div>
            <Button
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
              onClick={addTag}
              disabled={isLoading || isSaving}
            >
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 min-h-32">
            {isLoading ? (
              <div className="w-full flex justify-center items-center py-8">
                <Loader className="animate-spin h-6 w-6 text-indigo-500" />
              </div>
            ) : tags.length > 0 ? (
              tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md flex items-center gap-1 hover:bg-indigo-200 transition-colors"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-indigo-500 hover:text-indigo-700"
                    aria-label="Remove tag"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            ) : (
              <div className="w-full text-center py-8 text-gray-500">
                No tags added yet. Add your first tag above.
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t border-gray-100 pt-4 flex justify-end">
          <Button
            className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-none flex items-center"
            onClick={() => setShowConfirmation(true)}
            disabled={isLoading || isSaving}
          >
            {isSaving ? (
              <Loader className="animate-spin h-4 w-4 mr-2" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            Save Tags
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-800">Save Tags</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to save these changes? This will update all tags in the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-gray-600 border-gray-200 hover:bg-gray-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-indigo-500 text-white hover:bg-indigo-600 flex items-center"
              onClick={saveTags}
              disabled={isSaving}
            >
              {isSaving ? <Loader className="animate-spin h-4 w-4 mr-2" /> : <Save className="mr-1 h-4 w-4" />}
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TagManager;