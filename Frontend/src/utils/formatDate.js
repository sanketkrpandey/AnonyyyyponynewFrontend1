export const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = Date.now();
  const diff = (now - date.getTime()) / 1000;
  
  const minutes = Math.floor(diff / 60);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};