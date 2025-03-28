import React, { useState } from 'react';
import { MessageSquare, X, Reply, Trash2, Edit2, Check, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCommentStore } from '../store/commentStore';
import type { Comment } from '../types';

interface CommentSidebarProps {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
  selectedText?: {
    text: string;
    range: { start: number; end: number };
  };
}

export function CommentSidebar({ courseId, isOpen, onClose, selectedText }: CommentSidebarProps) {
  const { user } = useAuthStore();
  const { comments, loading, addComment, deleteComment, updateComment } = useCommentStore();
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment(
        courseId,
        newComment,
        selectedText ? {
          start: selectedText.range.start,
          end: selectedText.range.end,
          text: selectedText.text
        } : undefined,
        replyTo || undefined
      );
      setNewComment('');
      setReplyTo(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (id: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updateComment(id, editContent);
      setEditingId(null);
      setEditContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await deleteComment(id);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isEditing = editingId === comment.id;
    const isOwner = user?.id === comment.user?.id;

    return (
      <div key={comment.id} className={`${isReply ? 'ml-6' : ''} py-4 ${!isReply ? 'border-b border-gray-200/60' : ''}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-sm">
                <span className="text-sm font-medium bg-gradient-to-br from-indigo-600 to-purple-600 text-transparent bg-clip-text">
                  {comment.user?.full_name.charAt(0)}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {comment.user?.full_name}
              </p>
              {isEditing ? (
                <div className="mt-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                    rows={3}
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleEdit(comment.id)}
                      disabled={isSubmitting}
                      className="inline-flex items-center px-3 py-1.5 text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-md hover:from-indigo-600 hover:to-purple-600 shadow-sm disabled:opacity-50 transition-all duration-200"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-1 text-sm text-gray-600">{comment.content}</p>
                  {comment.selection_range && (
                    <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100">
                      "{comment.selection_range.text}"
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          {!isEditing && isOwner && (
            <div className="flex gap-1">
              <button
                onClick={() => startEdit(comment)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(comment.id)}
                className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        {!isReply && (
          <div className="mt-2">
            <button
              onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              className="inline-flex items-center px-2 py-1 text-xs text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-50"
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </button>
          </div>
        )}
        {replyTo === comment.id && (
          <form onSubmit={handleSubmit} className="mt-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a reply..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
              rows={3}
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-3 py-1.5 text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-md hover:from-indigo-600 hover:to-purple-600 shadow-sm disabled:opacity-50 transition-all duration-200"
              >
                {isSubmitting ? 'Replying...' : 'Reply'}
              </button>
            </div>
          </form>
        )}
        {comment.replies?.map((reply) => renderComment(reply, true))}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 w-[400px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Comments</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto px-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <MessageSquare className="h-8 w-8 mb-2" />
              <p className="text-sm">No comments yet</p>
            </div>
          ) : (
            <div className="py-4 divide-y divide-gray-200">
              {comments.map((comment) => renderComment(comment))}
            </div>
          )}
        </div>

        {/* Comment Form */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <form onSubmit={handleSubmit}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none bg-white"
              rows={3}
            />
            {selectedText && (
              <div className="mt-2 text-xs text-gray-500 bg-white p-3 rounded-lg border border-gray-200">
                Commenting on: "{selectedText.text}"
              </div>
            )}
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-sm transition-all duration-200 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post Comment'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}