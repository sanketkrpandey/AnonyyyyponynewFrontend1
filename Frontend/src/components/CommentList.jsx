import React, { useEffect, useState } from 'react';
import { Heart, Reply, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as commentApi from '../services/comments';
import Avatar from './Avatar';
import { timeAgo } from '../utils/formatDate';
import { useAuth } from '../context/AuthContext';

export default function CommentList({ postId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await commentApi.getComments(postId);
      setComments(response.comments || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      setSubmitting(true);
      const response = await commentApi.createComment(postId, newComment.trim());
      setComments([response.comment, ...comments]);
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (commentId) => {
    try {
      const response = await commentApi.toggleCommentLike(commentId);
      setComments(prevComments =>
        prevComments.map(comment =>
          comment._id === commentId
            ? { 
                ...comment, 
                isLiked: response.isLiked, 
                likesCount: response.likesCount 
              }
            : comment
        )
      );
    } catch (error) {
      console.error('Failed to toggle like:', error);
      toast.error('Failed to update like');
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await commentApi.deleteComment(commentId);
      setComments(prevComments => 
        prevComments.filter(comment => comment._id !== commentId)
      );
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const addReply = async (commentId) => {
    if (!replyText.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }

    try {
      const response = await commentApi.addReply(commentId, replyText.trim());
      setComments(prevComments =>
        prevComments.map(comment =>
          comment._id === commentId
            ? {
                ...comment,
                replies: [...(comment.replies || []), response.reply]
              }
            : comment
        )
      );
      setReplyText('');
      setReplyingTo(null);
      toast.success('Reply added');
    } catch (error) {
      console.error('Failed to add reply:', error);
      toast.error('Failed to add reply');
    }
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Add Comment Form */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div className="flex gap-3">
          <Avatar 
            name={user?.anonymousName || 'Anonymous'} 
            src={user?.avatar} 
            size={36} 
          />
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, addComment)}
              placeholder="Write a comment..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="2"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Press Enter to submit, Shift+Enter for new line
              </span>
              <button
                onClick={addComment}
                disabled={submitting || !newComment.trim()}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Sending...' : 'Comment'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              <span>Loading comments...</span>
            </div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex gap-3">
                <Avatar 
                  name={comment.author?.anonymousName || 'Anonymous'} 
                  src={comment.author?.avatar} 
                  size={32} 
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {comment.author?.anonymousName || 'Anonymous'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {timeAgo(comment.createdAt)}
                    </span>
                  </div>
                  
                  <p className="text-gray-800 dark:text-gray-100 text-sm leading-relaxed whitespace-pre-wrap mb-3">
                    {comment.text}
                  </p>

                  {/* Comment Actions */}
                  <div className="flex items-center gap-4 text-xs">
                    <button
                      onClick={() => toggleLike(comment._id)}
                      className={`flex items-center gap-1 transition-colors ${
                        comment.isLiked 
                          ? 'text-red-500' 
                          : 'text-gray-500 hover:text-red-500'
                      }`}
                    >
                      <Heart size={14} className={comment.isLiked ? 'fill-current' : ''} />
                      <span>{comment.likesCount || 0}</span>
                    </button>
                    
                    <button
                      onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                      className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors"
                    >
                      <Reply size={14} />
                      <span>Reply</span>
                    </button>
                    
                    {comment.canDelete && (
                      <button
                        onClick={() => deleteComment(comment._id)}
                        className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>

                  {/* Reply Form */}
                  {replyingTo === comment._id && (
                    <div className="mt-3 ml-6">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyPress={(e) => handleKeyPress(e, () => addReply(comment._id))}
                          placeholder="Write a reply..."
                          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                        <button
                          onClick={() => addReply(comment._id)}
                          disabled={!replyText.trim()}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Reply
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                          className="px-3 py-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {Array.isArray(comment.replies) && comment.replies.length > 0 && (
                    <div className="mt-4 ml-6 space-y-3 border-l-2 border-gray-100 dark:border-gray-700 pl-4">
                      {comment.replies.map((reply, index) => (
                        <div key={reply._id || index} className="flex gap-2">
                          <Avatar 
                            name={reply.author?.anonymousName || 'Anonymous'} 
                            src={reply.author?.avatar} 
                            size={24} 
                          />
                          <div className="flex-1">
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm text-gray-900 dark:text-white">
                                  {reply.author?.anonymousName || 'Anonymous'}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {timeAgo(reply.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-800 dark:text-gray-100">
                                {reply.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}