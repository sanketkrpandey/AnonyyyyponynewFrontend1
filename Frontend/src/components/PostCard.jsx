import React, { useState } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Share, Flag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
import { timeAgo } from '../utils/formatDate';

export default function PostCard({ post, onLike, onUserClick, onReport }) {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  
  const author = post.author || { anonymousName: 'Anonymous' };
  
  const handleUserClick = () => {
    if (onUserClick) {
      onUserClick(author.anonymousName);
    } else {
      navigate(`/profile/${author.anonymousName}`);
    }
  };

  const handleLike = () => {
    if (onLike) {
      onLike(post._id);
    }
  };

  const handleReport = () => {
    if (onReport) {
      onReport(post._id);
    }
    setShowMenu(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={handleUserClick} className="flex-shrink-0">
            <Avatar 
              name={author.anonymousName} 
              src={author.avatar} 
              size={40} 
            />
          </button>
          <div>
            <button 
              onClick={handleUserClick}
              className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {author.anonymousName}
            </button>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {timeAgo(post.createdAt)}
            </div>
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <MoreHorizontal size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
              <button
                onClick={handleReport}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-600 text-red-600 dark:text-red-400"
              >
                <Flag size={16} />
                <span className="text-sm">Report Post</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <div className="mb-4">
          <p className="text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
        </div>
      )}

      {/* Images */}
      {Array.isArray(post.images) && post.images.length > 0 && (
        <div className="mb-4">
          <div className={`grid gap-2 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {post.images.map((imageUrl, index) => (
              <div key={index} className="relative overflow-hidden rounded-lg">
                <img
                  src={imageUrl}
                  alt={`Post attachment ${index + 1}`}
                  className="w-full h-64 object-cover hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-6">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 transition-colors ${
              post.isLiked 
                ? 'text-red-500' 
                : 'text-gray-600 dark:text-gray-300 hover:text-red-500'
            }`}
          >
            <Heart 
              size={20} 
              className={post.isLiked ? 'fill-current' : ''} 
            />
            <span className="text-sm font-medium">
              {post.likesCount || 0}
            </span>
          </button>
          
          <button
            onClick={() => navigate(`/post/${post._id}`)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"
          >
            <MessageCircle size={20} />
            <span className="text-sm font-medium">
              {post.commentsCount || 0}
            </span>
          </button>
        </div>
        
        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Share size={18} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>
      
      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}