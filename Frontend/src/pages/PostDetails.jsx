import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import * as postApi from '../services/posts';
import PostCard from '../components/PostCard';
import CommentList from '../components/CommentList';
import Loader from '../components/Loader';

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await postApi.getPost(postId);
      setPost(response.post);
    } catch (error) {
      console.error('Failed to load post:', error);
      toast.error('Failed to load post');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (id) => {
    try {
      const response = await postApi.toggleLike(id);
      setPost(prevPost => ({
        ...prevPost,
        isLiked: response.isLiked,
        likesCount: response.likesCount
      }));
    } catch (error) {
      console.error('Failed to toggle like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleReport = async (id) => {
    if (!window.confirm('Are you sure you want to report this post?')) {
      return;
    }

    try {
      await postApi.reportPost(id);
      toast.success('Post reported successfully');
    } catch (error) {
      console.error('Failed to report post:', error);
      toast.error('Failed to report post');
    }
  };

  if (loading) {
    return <Loader label="Loading post..." />;
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Post not found
          </h2>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go back to feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Post Details
          </h1>
        </div>

        {/* Post */}
        <div className="mb-6">
          <PostCard
            post={post}
            onLike={handleLike}
            onReport={handleReport}
            onUserClick={(username) => navigate(`/profile/${username}`)}
          />
        </div>

        {/* Comments */}
        <CommentList postId={postId} />
      </div>
    </div>
  );
}