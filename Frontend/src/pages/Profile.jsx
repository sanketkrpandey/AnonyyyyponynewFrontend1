import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, UserPlus, UserMinus, Users, Eye } from 'lucide-react';
import * as usersApi from '../services/users';
import * as postsApi from '../services/posts';
import PostCard from '../components/PostCard';
import Avatar from '../components/Avatar';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { anonymousName } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (anonymousName) {
      fetchProfile();
    }
  }, [anonymousName]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setPostsLoading(true);
      
      const userResponse = await usersApi.getUserByAnonymousName(anonymousName);
      setUser(userResponse.user);
      setFollowing(userResponse.user.isFollowing || false);

      const postsResponse = await postsApi.getUserPosts(userResponse.user._id);
      setPosts(postsResponse.posts || []);
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile');
      navigate('/');
    } finally {
      setLoading(false);
      setPostsLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const response = await usersApi.toggleFollow(user._id);
      setFollowing(response.following);
      setUser(prevUser => ({
        ...prevUser,
        followersCount: response.following 
          ? (prevUser.followersCount || 0) + 1 
          : Math.max((prevUser.followersCount || 0) - 1, 0)
      }));
      toast.success(response.following ? 'Following user' : 'Unfollowed user');
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      toast.error('Failed to update follow status');
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await postsApi.toggleLike(postId);
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId
            ? {
                ...post,
                isLiked: response.isLiked,
                likesCount: response.likesCount
              }
            : post
        )
      );
    } catch (error) {
      console.error('Failed to toggle like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleReport = async (postId) => {
    if (!window.confirm('Are you sure you want to report this post?')) {
      return;
    }

    try {
      await postsApi.reportPost(postId);
      toast.success('Post reported successfully');
    } catch (error) {
      console.error('Failed to report post:', error);
      toast.error('Failed to report post');
    }
  };

  if (loading) {
    return <Loader label="Loading profile..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            User not found
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

  const isOwnProfile = currentUser && currentUser.anonymousName === user.anonymousName;

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
            Profile
          </h1>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <Avatar 
              name={user.anonymousName} 
              src={user.avatar} 
              size={80} 
            />
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {user.anonymousName}
              </h2>
              
              {user.bio && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {user.bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 mb-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span><strong>{user.followersCount || 0}</strong> followers</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span><strong>{user.followingCount || 0}</strong> following</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {isOwnProfile ? (
                  <button
                    onClick={() => navigate('/settings')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={handleFollow}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      following
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {following ? (
                      <>
                        <UserMinus className="w-4 h-4" />
                        <span>Unfollow</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Posts {posts.length > 0 && `(${posts.length})`}
          </h3>
          
          {postsLoading ? (
            <Loader label="Loading posts..." />
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No posts yet
              </h4>
              <p className="text-gray-500 dark:text-gray-400">
                {isOwnProfile 
                  ? "You haven't shared anything yet. Create your first post!" 
                  : "This user hasn't shared anything yet."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onLike={handleLike}
                  onReport={handleReport}
                  onUserClick={(username) => navigate(`/profile/${username}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}