'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, Loader2, MessageSquare, User, Calendar, RefreshCw } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Feedback {
  id: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

const FeedbackManagement: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/feedback', {
        params: {
          limit: 100,
          offset: 0,
        },
      });

      if (response.data.success) {
        setFeedbacks(response.data.feedback);
        setTotalCount(response.data.pagination.total);
      }
    } catch (error: unknown) {
      console.error('Error fetching feedback:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error && 
                          error.response && typeof error.response === 'object' && 
                          'data' in error.response && error.response.data && 
                          typeof error.response.data === 'object' && 'error' in error.response.data
                          ? String(error.response.data.error)
                          : 'Failed to fetch feedback';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleDeleteClick = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedFeedback) return;

    setDeleting(selectedFeedback.id);
    try {
      const response = await axios.delete('/api/feedback', {
        data: { feedbackId: selectedFeedback.id },
      });

      if (response.data.success) {
        toast.success('Feedback deleted successfully');
        setFeedbacks(feedbacks.filter((f) => f.id !== selectedFeedback.id));
        setTotalCount(totalCount - 1);
      }
    } catch (error: unknown) {
      console.error('Error deleting feedback:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error && 
                          error.response && typeof error.response === 'object' && 
                          'data' in error.response && error.response.data && 
                          typeof error.response.data === 'object' && 'error' in error.response.data
                          ? String(error.response.data.error)
                          : 'Failed to delete feedback';
      toast.error(errorMessage);
    } finally {
      setDeleting(null);
      setDeleteDialogOpen(false);
      setSelectedFeedback(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                User Feedback
              </CardTitle>
              <CardDescription className="mt-2">
                Manage and review user feedback submissions
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-sm">
                {totalCount} Total
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchFeedback}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {feedbacks.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No feedback yet
              </h3>
              <p className="text-gray-500">
                User feedback will appear here when submitted
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">User</TableHead>
                    <TableHead className="w-[180px]">Date</TableHead>
                    <TableHead>Feedback</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbacks.map((feedback) => (
                    <TableRow key={feedback.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{feedback.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {formatDate(feedback.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-2xl">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {truncateText(feedback.content, 200)}
                          </p>
                          {feedback.content.length > 200 && (
                            <button
                              className="text-xs text-indigo-600 hover:text-indigo-800 mt-1"
                              onClick={() => {
                                toast.custom(
                                  (t) => (
                                    <div className="bg-white rounded-lg shadow-none p-6 max-w-2xl">
                                      <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                          <User className="h-4 w-4 text-gray-500" />
                                          <span className="font-medium">
                                            {feedback.username}
                                          </span>
                                        </div>
                                        <button
                                          onClick={() => toast.dismiss(t.id)}
                                          className="text-gray-400 hover:text-gray-600"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {feedback.content}
                                      </p>
                                    </div>
                                  ),
                                  { duration: 10000 }
                                );
                              }}
                            >
                              Read more
                            </button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(feedback)}
                          disabled={deleting === feedback.id}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          {deleting === feedback.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feedback?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this feedback from{' '}
              <strong>{selectedFeedback?.username}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FeedbackManagement;
