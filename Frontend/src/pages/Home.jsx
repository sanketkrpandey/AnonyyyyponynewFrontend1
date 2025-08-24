import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Menu, X, Search, ImagePlus, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PostCard from '../components/PostCard';
import AppSidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import * as postApi from '../services/posts';
import * as usersApi from '../services/users';
import useDebounce from '../hooks/useDebounce';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const navigate = useNavigate();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await postApi.getPosts();
      setPosts(response.posts || []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      setSearchLoading(true);
      const response = await usersApi.searchUsers(debouncedSearchQuery);
      setSearchResults(response.users || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 4) {
      toast.error('Maximum 4 images allowed');
      return;
    }

    setImageFiles(files);
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(previews);
  };

  const removeImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = previewImages.filter((_, i) => i !== index);
    
    // Clean up URL
    URL.revokeObjectURL(previewImages[index]);
    
    setImageFiles(newFiles);
    setPreviewImages(newPreviews);
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleCreatePost = async () => {
    const content = newPostContent.trim();
    
    if (!content && imageFiles.length === 0) {
      toast.error('Post must have content or images');
      return;
    }

    if (content.length > 500) {
      toast.error('Post content is too long (max 500 characters)');
      return;
    }

    try {
      setPosting(true);
      
      // Convert images to base64
      const imagesBase64 = await Promise.all(
        imageFiles.map(file => convertToBase64(file))
      );

      const response = await postApi.createPost({
        content,
        images: imagesBase64,
        isAnonymous: true
      });

      // Add new post to the top of the list
      setPosts(prevPosts => [response.post, ...prevPosts]);
      
      // Reset form
      setNewPostContent('');
      setImageFiles([]);
      setPreviewImages([]);
      
      // Clean up preview URLs
      previewImages.forEach(url => URL.revokeObjectURL(url));
      
      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Failed to create post:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create post';
      toast.error(errorMessage);
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await postApi.toggleLike(postId);
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
      await postApi.reportPost(postId);
      toast.success('Post reported successfully');
    } catch (error) {
      console.error('Failed to report post:', error);
      toast.error('Failed to report post');
    }
  };

  const handleUserClick = (username) => {
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/profile/${username}`);
  };

  if (loading) {
    return <Loader label="Loading your feed..." />;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors overflow-hidden">
      {/* Sidebar */}
      <div className="hidden md:block">
        <AppSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative">
            <AppSidebar open={true} setOpen={setSidebarOpen} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Anon<span className="text-blue-600">Feed</span>
            </h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => handleUserClick(user.anonymousName)}
                      className="flex items-center w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.anonymousName}&background=0A70F2&color=fff&size=40`}
                        alt="avatar"
                        className="w-8 h-8 rounded-full mr-3 flex-shrink-0"
                      />
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {user.anonymousName}
                        </div>
                        {user.bio && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.bio}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchLoading && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    <span>Searching...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Create Post */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="What's on your mind? Share anonymously..."
                  className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                  rows="3"
                  maxLength={500}
                />

                {/* Image Previews */}
                {previewImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {previewImages.map((src, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={src}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Post Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                        disabled={posting}
                      />
                      <ImagePlus size={20} />
                      <span className="text-sm">Add Photos</span>
                    </label>
                    
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {newPostContent.length}/500
                    </span>
                  </div>

                  <button
                    onClick={handleCreatePost}
                    disabled={posting || (!newPostContent.trim() && imageFiles.length === 0)}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {posting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Posting...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Post</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No posts yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Be the first to share something with the community!
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onLike={handleLike}
                    onReport={handleReport}
                    onUserClick={handleUserClick}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close search results */}
      {searchResults.length > 0 && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setSearchQuery('');
            setSearchResults([]);
          }}
        />
      )}
    </div>
  );
}