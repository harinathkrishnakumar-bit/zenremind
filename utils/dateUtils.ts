
export const isToday = (dateStr: string) => {
  const d = new Date(dateStr);
  const today = new Date();
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
};

export const isThisWeek = (dateStr: string) => {
  const d = new Date(dateStr);
  const today = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(today.getDate() + 7);
  return d >= today && d <= weekFromNow;
};

export const isThisMonth = (dateStr: string) => {
  const d = new Date(dateStr);
  const today = new Date();
  return d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
};

export const isOverdue = (dateStr: string, completed: boolean) => {
  if (completed) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d < now;
};

export const formatNiceDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
