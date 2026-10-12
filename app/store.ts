import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 1. Helper Functions (Exported)
export const getLocalYMD = (dateObj: Date) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayStr = () => getLocalYMD(new Date());

export const getDaysDiff = (dateStr1: string, dateStr2: string) => {
  const d1 = new Date(dateStr1); const d2 = new Date(dateStr2);
  d1.setHours(0,0,0,0); d2.setHours(0,0,0,0);
  return Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
};

// 2. Types (Exported)
export interface TrackerState {
  theme: 'light' | 'dark' | 'rgb';
  syllabusType: 'official' | 'parth';
  
  completedOfficial: Record<string, string>;
  dailyOfficial: Record<string, number>;
  reviewsOfficial: Record<string, { day4: boolean; day7: boolean }>;
  
  completedParth: Record<string, string>;
  dailyParth: Record<string, number>;
  reviewsParth: Record<string, { day4: boolean; day7: boolean }>;
  
  planTopics: string[];
  planDeadline: string | null;
  
  setTheme: (theme: 'light' | 'dark' | 'rgb') => void;
  setSyllabusType: (type: 'official' | 'parth') => void;
  toggleTopic: (topic: string) => void;
  markReview: (topic: string, dayType: 'day4' | 'day7') => void;
  importData: (data: any) => void;
  setPlan: (topics: string[], deadline: string) => void;
  clearPlan: () => void;
}

// 3. Zustand Store (Exported)
export const useStore = create<TrackerState>()(
  persist(
    (set) => ({
      theme: 'light',
      syllabusType: 'parth',
      completedOfficial: {}, dailyOfficial: {}, reviewsOfficial: {},
      completedParth: {}, dailyParth: {}, reviewsParth: {},
      planTopics: [],
      planDeadline: null,
      
      setTheme: (theme) => set(() => ({ theme })),
      setSyllabusType: (type) => set(() => ({ syllabusType: type, planTopics: [], planDeadline: null })),
      
      toggleTopic: (topic) => set((state) => {
        const todayStr = getTodayStr();
        const isOff = state.syllabusType === 'official';
        const completed = isOff ? state.completedOfficial : state.completedParth;
        const daily = isOff ? state.dailyOfficial : state.dailyParth;
        const reviews = isOff ? state.reviewsOfficial : state.reviewsParth;

        const isCompleted = !!completed[topic];
        const newCompleted = { ...completed };
        const newDaily = { ...daily };
        const newReviews = { ...reviews };

        if (isCompleted) {
          const dateCompleted = newCompleted[topic];
          delete newCompleted[topic];
          delete newReviews[topic];
          if (dateCompleted && newDaily[dateCompleted] > 0) newDaily[dateCompleted] -= 1;
        } else {
          newCompleted[topic] = todayStr;
          newDaily[todayStr] = (newDaily[todayStr] || 0) + 1;
          newReviews[topic] = { day4: false, day7: false };
        }
        
        return isOff 
          ? { completedOfficial: newCompleted, dailyOfficial: newDaily, reviewsOfficial: newReviews }
          : { completedParth: newCompleted, dailyParth: newDaily, reviewsParth: newReviews };
      }),
      
      markReview: (topic, dayType) => set((state) => {
        const isOff = state.syllabusType === 'official';
        const reviews = isOff ? state.reviewsOfficial : state.reviewsParth;
        const newReviews = { ...reviews, [topic]: { ...reviews[topic], [dayType]: true } };
        return isOff ? { reviewsOfficial: newReviews } : { reviewsParth: newReviews };
      }),
      
      importData: (data) => set(() => ({
        theme: data.theme || 'light',
        syllabusType: data.syllabusType || 'parth',
        completedOfficial: data.completedOfficial || {}, dailyOfficial: data.dailyOfficial || {}, reviewsOfficial: data.reviewsOfficial || {},
        completedParth: data.completedParth || {}, dailyParth: data.dailyParth || {}, reviewsParth: data.reviewsParth || {},
        planTopics: data.planTopics || [],
        planDeadline: data.planDeadline || null
      })),
      setPlan: (topics, deadline) => set(() => ({ planTopics: topics, planDeadline: deadline })),
      clearPlan: () => set(() => ({ planTopics: [], planDeadline: null })),
    }),
    { name: 'cfa-mono-v9' }
  )
);