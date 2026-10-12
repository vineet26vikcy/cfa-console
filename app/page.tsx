"use client";

import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Calendar, ChevronRight, ChevronDown, Info, CalendarDays, CheckCircle2, Upload, Download, PieChart, Target, ListTodo, Settings, AlertTriangle, Printer, Link as LinkIcon, FileText, Trash2, Square } from 'lucide-react';
import * as XLSX from 'xlsx';
import LZString from 'lz-string';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- 1. HELPER FUNCTIONS ---
const getLocalYMD = (dateObj: Date) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const getTodayStr = () => getLocalYMD(new Date());
const getDaysDiff = (dateStr1: string, dateStr2: string) => {
  const d1 = new Date(dateStr1); const d2 = new Date(dateStr2);
  d1.setHours(0,0,0,0); d2.setHours(0,0,0,0);
  return Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
};

// --- 2. ZUSTAND MEMORY STORE ---
interface TrackerState {
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
  hardReset: () => void;
}

const useStore = create<TrackerState>()(
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
      hardReset: () => set(() => ({
        completedOfficial: {}, dailyOfficial: {}, reviewsOfficial: {},
        completedParth: {}, dailyParth: {}, reviewsParth: {},
        planTopics: [], planDeadline: null
      }))
    }),
    { name: 'cfa-mono-v9' }
  )
);

// --- 3. CUSTOM UI COMPONENTS ---
const RadarChart = ({ data }: { data: { subject: string, pct: number }[] }) => {
  const size = 500; 
  const center = size / 2;
  const radius = 190; // Hugely expanded radius so chart fills up the space

  const orderedSubjects = [
    "Ethics", "FSA", "Equity Investments", "Fixed Income", "Portfolio Management",
    "Alternative Investments", "Quants", "Economics", "Corporate Issuers", "Derivatives"
  ];

  const colorMap: Record<string, string> = {
    "Ethics": "#ef4444",                  
    "FSA": "#f97316",                     
    "Equity Investments": "#eab308",      
    "Fixed Income": "#84cc16",            
    "Portfolio Management": "#22c55e",    
    "Alternative Investments": "#14b8a6", 
    "Quants": "#3b82f6",                  
    "Economics": "#6366f1",               
    "Corporate Issuers": "#a855f7",       
    "Derivatives": "#ec4899"              
  };

  const getShortName = (name: string) => {
    const map: Record<string, string> = {
      "Alternative Investments": "Alternative Investments", 
      "Portfolio Management": "Portfolio Management",
      "Corporate Issuers": "Corporate Issuers", 
      "Equity Investments": "Equity Investments",
      "Quantitative Methods": "Quantitative Methods", 
      "Fixed Income": "Fixed Income",
      "Economics": "Economics", 
      "Derivatives": "Derivatives", 
      "Ethics": "Ethics", 
      "FSA": "FSA"
    };
    return map[name] || name;
  };

  const orderedData = orderedSubjects.map(sub => {
    const match = data.find(d => d.subject === sub);
    return match || { subject: sub, pct: 0 };
  });

  const angleStep = (Math.PI * 2) / orderedData.length;

  const getPoint = (val: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (val / 100) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const dataPoints = orderedData.map((d, i) => getPoint(d.pct, i));

  return (
    // ViewBox tightened to exact shape boundaries so it naturally stretches out
    <svg viewBox="-70 -60 640 640" className="w-full h-auto max-w-[650px] mx-auto overflow-visible font-sans drop-shadow-sm mt-4">
      {[20, 40, 60, 80, 100].map((level) => {
        const levelPoints = orderedData.map((_, i) => getPoint(level, i));
        const levelPath = levelPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
        return <path key={level} d={levelPath} fill="none" className="stroke-gray-300" strokeWidth="1" />;
      })}

      {orderedData.map((_, i) => {
        const p = getPoint(100, i);
        return <line key={`axis-${i}`} x1={center} y1={center} x2={p.x} y2={p.y} className="stroke-gray-300" strokeWidth="1" />
      })}

      {dataPoints.map((p, i) => {
        const nextI = (i + 1) % dataPoints.length;
        const pNext = dataPoints[nextI];
        const subjectColor = colorMap[orderedData[i].subject] || "#9ca3af";
        const pathData = `M ${center} ${center} L ${p.x} ${p.y} L ${pNext.x} ${pNext.y} Z`;
        return <path key={`slice-${i}`} d={pathData} fill={subjectColor} fillOpacity="0.25" />;
      })}

      {dataPoints.map((p, i) => {
        const nextI = (i + 1) % dataPoints.length;
        const pNext = dataPoints[nextI];
        const subjectColor = colorMap[orderedData[i].subject] || "#9ca3af";
        return <line key={`border-${i}`} x1={p.x} y1={p.y} x2={pNext.x} y2={pNext.y} stroke={subjectColor} strokeWidth="3" />;
      })}

      {dataPoints.map((p, i) => {
        const subjectColor = colorMap[orderedData[i].subject] || "#9ca3af";
        return <circle key={`dot-${i}`} cx={p.x} cy={p.y} r="6" fill={subjectColor} />;
      })}

      {orderedData.map((d, i) => {
        const labelP = getPoint(125, i); 
        let textAnchor: "middle" | "start" | "end" = "middle";
        const cosVal = Math.cos(i * angleStep - Math.PI / 2);
        
        if (Math.abs(cosVal) < 0.1) textAnchor = "middle";
        else if (cosVal > 0) textAnchor = "start";
        else textAnchor = "end";

        const sinVal = Math.sin(i * angleStep - Math.PI / 2);
        let yOffset = 0;
        if (sinVal < -0.8) yOffset = -5;
        if (sinVal > 0.8) yOffset = 15;

        return (
          <g key={`label-${i}`} transform={`translate(${labelP.x}, ${labelP.y + yOffset})`}>
            <text textAnchor={textAnchor} className="text-[14px] fill-gray-800 font-bold tracking-tight">{getShortName(d.subject)}</text>
            <text y="22" textAnchor={textAnchor} className="text-[18px] fill-black font-black">{d.pct}%</text>
          </g>
        )
      })}
    </svg>
  )
};

const formatDuration = (dur: string | null) => {
  if (!dur || !dur.includes(':')) return dur;
  const parts = dur.trim().split(':').map(Number);
  if (parts.length === 3) {
    let [h, m, s] = parts;
    if (s >= 30) m++;
    if (m >= 60) { h++; m -= 60; }
    if (h > 0) return `${h} hr ${m > 0 ? m + ' mins' : ''}`.trim();
    return `${m} mins`;
  }
  return dur;
};

const TopicLabel = ({ topic, isChecked, state, onToggle }: { topic: string, isChecked: boolean, state: any, onToggle: () => void }) => {
  const [topicName, rawDuration] = topic.includes(' | ') ? topic.split(' | ') : [topic, null];
  const duration = formatDuration(rawDuration);
  
  let labelClass = "flex items-start gap-3 py-3 px-2 sm:p-2 border border-transparent border-b-gray-200 cursor-pointer transition-colors bg-white hover:bg-gray-100";
  let textClass = "text-black";
  
  if (isChecked && state) {
    if (state.day7) { 
      labelClass = "flex items-start gap-3 py-3 px-2 sm:p-2 border-2 border-[#166534] bg-[#f0fdf4] cursor-pointer transition-colors mb-1 shadow-sm !border-[#166534] !bg-[#f0fdf4]"; 
      textClass = "text-[#166534] !text-[#166534]"; 
    }
    else if (state.day4) { 
      labelClass = "flex items-start gap-3 py-3 px-2 sm:p-2 border-2 border-[#854d0e] bg-[#fefce8] cursor-pointer transition-colors mb-1 shadow-sm !border-[#854d0e] !bg-[#fefce8]"; 
      textClass = "text-[#854d0e] !text-[#854d0e]"; 
    }
  }

  return (
    <label className={labelClass}>
      <div className="pt-[2px] sm:pt-0.5">
        <input type="checkbox" checked={isChecked} onChange={onToggle} className="w-4 h-4 sm:w-3.5 sm:h-3.5 accent-black border-black cursor-pointer rounded-none" />
      </div>
      <span className={`text-xs leading-snug flex-1 ${isChecked && !state?.day4 && !state?.day7 ? 'line-through opacity-50' : ''} ${textClass}`}>
        {topicName}
        {duration && <span className="text-[#ea580c] ml-2 font-bold whitespace-nowrap !text-[#ea580c]">[{duration}]</span>}
      </span>
      {isChecked && (
        <div className="relative group ml-2">
          <Info size={14} className="text-gray-400" />
          <div className="absolute right-0 bottom-full mb-1 hidden group-hover:block z-50 bg-black text-white text-[10px] px-2 py-1 whitespace-nowrap">Done</div>
        </div>
      )}
    </label>
  );
};

const getSubjectForTopic = (topicName: string, syllabusObj: any) => {
  for (const [subject, data] of Object.entries(syllabusObj)) {
    const sections = (data as any).sections;
    for (const sectionTopics of Object.values(sections)) {
      if ((sectionTopics as string[]).includes(topicName)) return subject;
    }
  }
  return "Unknown";
};

const getTotalTopicsCount = (syllabusObj: any) => {
  return Object.values(syllabusObj).reduce((acc: number, curr: any) => {
    const sectionTopicsCount = Object.values(curr.sections).reduce((secAcc: number, section: any) => secAcc + (section as string[]).length, 0);
    return acc + sectionTopicsCount;
  }, 0);
};

// --- MAIN COMPONENT ---
export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [officialSyllabus, setOfficialSyllabus] = useState<any>(null);
  const [parthSyllabus, setParthSyllabus] = useState<any>(null);
  const [isLoadingSyllabus, setIsLoadingSyllabus] = useState(true);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'tracker' | 'plan' | 'data'>('dashboard');
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [expandedTopicSections, setExpandedTopicSections] = useState<Record<string, boolean>>({});
  const [expandedPlanSubjects, setExpandedPlanSubjects] = useState<Record<string, boolean>>({});
  const [showThemeMenu, setShowThemeMenu] = useState(false); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [draftPlanTopics, setDraftPlanTopics] = useState<string[]>([]);
  const [draftDeadline, setDraftDeadline] = useState<string>('');

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [pastedLink, setPastedLink] = useState('');
  const [magicSyncStatus, setMagicSyncStatus] = useState<string | null>(null);
  const [incomingPayload, setIncomingPayload] = useState<string | null>(null);

  const state = useStore();

  useEffect(() => { 
    setMounted(true); 
    const d = new Date();
    const daysToSunday = d.getDay() === 0 ? 7 : 7 - d.getDay();
    d.setDate(d.getDate() + daysToSunday);
    setDraftDeadline(getLocalYMD(d));

    const urlObj = new URL(window.location.href);
    const syncParam = urlObj.searchParams.get('sync');
    if (syncParam) {
      setIncomingPayload(syncParam);
      setActiveTab('data'); 
    }

    const loadSyllabus = async () => {
      try {
        const res = await fetch('/cfa_syllabus.xlsx');
        const ab = await res.arrayBuffer();
        const wb = XLSX.read(ab, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws);

        const off: any = {};
        const prt: any = {};

        jsonData.forEach((row: any) => {
          const { Syllabus_Type, Subject, Weight, Section, Topic } = row;
          const target = Syllabus_Type === 'Official' ? off : prt;

          if (!target[Subject]) target[Subject] = { weight: Weight, sections: {} };
          if (!target[Subject].sections[Section]) target[Subject].sections[Section] = [];
          target[Subject].sections[Section].push(Topic);
        });

        setOfficialSyllabus(off);
        setParthSyllabus(prt);
        setIsLoadingSyllabus(false);
      } catch (error) {
        console.error("Failed to load or parse syllabus Excel file:", error);
        setIsLoadingSyllabus(false);
      }
    };

    loadSyllabus();
  }, []);

  const getSyncPayload = () => {
    const dataToExport = {
      theme: state.theme, syllabusType: state.syllabusType,
      completedOfficial: state.completedOfficial, dailyOfficial: state.dailyOfficial, reviewsOfficial: state.reviewsOfficial,
      completedParth: state.completedParth, dailyParth: state.dailyParth, reviewsParth: state.reviewsParth,
      planTopics: state.planTopics, planDeadline: state.planDeadline
    };
    return LZString.compressToBase64(JSON.stringify(dataToExport));
  };

  const handleGenerateLink = () => {
    const payload = getSyncPayload();
    const url = `${window.location.origin}/?sync=${encodeURIComponent(payload)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleCopyRawCode = () => {
    const payload = getSyncPayload();
    navigator.clipboard.writeText(payload);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const executeSync = (base64Payload: string) => {
    try {
      const decompressed = LZString.decompressFromBase64(base64Payload);
      if (decompressed) {
        const parsed = JSON.parse(decompressed);
        state.importData(parsed);
        setMagicSyncStatus("SUCCESS");
        setTimeout(() => window.location.replace('/'), 1200);
      } else {
        setMagicSyncStatus("INVALID_LINK");
        setTimeout(() => setMagicSyncStatus(null), 4000);
      }
    } catch (err) {
      setMagicSyncStatus("ERROR_PARSING");
      setTimeout(() => setMagicSyncStatus(null), 4000);
    }
  };

  const handleApplyPastedSync = () => {
    if (!pastedLink.trim()) return;
    let base64Payload = pastedLink.trim();
    try {
      if (base64Payload.startsWith('http')) {
        const urlObj = new URL(base64Payload);
        const extracted = urlObj.searchParams.get('sync');
        if (extracted) base64Payload = extracted;
      }
    } catch (e) {}
    executeSync(base64Payload);
  };

  const handleConfirmUrlSync = () => { if (incomingPayload) executeSync(incomingPayload); };
  const handleCancelUrlSync = () => { setIncomingPayload(null); window.history.replaceState({}, document.title, window.location.pathname); };

  const handleSyllabusToggle = (type: 'official' | 'parth') => {
    if (state.syllabusType === type) return;
    const confirmed = window.confirm("Switching curriculums will reset the consistency grid and clear your active plan (your previous data is saved securely in the background). Continue?");
    if (confirmed) state.setSyllabusType(type);
  };

  const handleHardReset = () => {
    const confirm1 = window.confirm("🚨 WARNING 🚨\n\nAre you absolutely sure you want to completely erase ALL your progress, history, and active plans? This action CANNOT be undone!");
    if (confirm1) {
      const confirm2 = window.confirm("Final check: Click OK to delete EVERYTHING and start fresh from today.");
      if (confirm2) {
        state.hardReset();
        alert("All data has been wiped. Good luck on your fresh start!");
        window.location.replace('/');
      }
    }
  };

  if (!mounted || isLoadingSyllabus) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center font-mono">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs uppercase font-bold tracking-widest text-black">Loading Database...</p>
      </div>
    );
  }

  const currentSyllabus = state.syllabusType === 'parth' ? parthSyllabus : officialSyllabus;
  const completedTopics = state.syllabusType === 'official' ? state.completedOfficial : state.completedParth;
  const dailyCompletions = state.syllabusType === 'official' ? state.dailyOfficial : state.dailyParth;
  const reviewStates = state.syllabusType === 'official' ? state.reviewsOfficial : state.reviewsParth;

  const toggleSubject = (subject: string) => { setExpandedSubjects(prev => ({ ...prev, [subject]: !prev[subject] })); };
  const toggleTopicSection = (section: string) => { setExpandedTopicSections(prev => ({ ...prev, [section]: !prev[section] })); };
  const togglePlanSubject = (subject: string) => { setExpandedPlanSubjects(prev => ({ ...prev, [subject]: !prev[subject] })); };

  const activeCompletedTopics = Object.keys(completedTopics).filter(topic => getSubjectForTopic(topic, currentSyllabus) !== 'Unknown');
  const totalCompleted = activeCompletedTopics.length;
  const completionPct = Math.round((totalCompleted / getTotalTopicsCount(currentSyllabus)) * 100) || 0;
  const todayCompletedCount = dailyCompletions[getTodayStr()] || 0;
  const maxDaily = Math.max(4, ...Object.values(dailyCompletions));

  const radarData = Object.entries(currentSyllabus).map(([subject, data]) => {
    const subjectTopics = Object.values((data as any).sections).flat() as string[];
    const subCompleted = subjectTopics.filter(t => completedTopics[t]).length;
    const subPct = subjectTopics.length > 0 ? Math.round((subCompleted / subjectTopics.length) * 100) : 0;
    return { subject, pct: subPct };
  });

  const generateHeatmapGrid = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    let startGridDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const dayOfWeek = startGridDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startGridDate.setDate(startGridDate.getDate() - daysToMonday);
    const cols = [];
    let currentDate = new Date(startGridDate);
    for (let w = 0; w < 52; w++) { 
      const colDays = [];
      for (let d = 0; d < 7; d++) {
        const isFuture = currentDate > today;
        const dateStr = getLocalYMD(currentDate);
        const count = dailyCompletions[dateStr] || 0;
        let colorClass = "bg-gray-200 border-gray-300"; 
        if (!isFuture) {
          if (count > 0) {
            if (count / maxDaily <= 0.25) colorClass = "bg-green-300 border-green-400";
            else if (count / maxDaily <= 0.50) colorClass = "bg-green-500 border-green-600";
            else if (count / maxDaily <= 0.75) colorClass = "bg-green-600 border-green-700";
            else colorClass = "bg-green-800 border-green-900";
          }
        }
        colDays.push({ date: new Date(currentDate), dateStr, colorClass, count, isFuture });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      cols.push(colDays);
    }
    return cols;
  };

  const heatmapCols = generateHeatmapGrid();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const getReviews = () => {
    const day4 = []; const day7 = [];
    const todayStr = getTodayStr();
    for (const topic of activeCompletedTopics) {
      const diffDays = getDaysDiff(todayStr, completedTopics[topic]);
      const st = reviewStates[topic] || { day4: false, day7: false };
      if (diffDays >= 3 && !st.day4) day4.push(topic);
      if (diffDays >= 6 && st.day4 && !st.day7) day7.push(topic);
    }
    return { day4, day7 };
  };
  const { day4: day4Reviews, day7: day7Reviews } = getReviews();

  const getUpcomingReviews = () => {
    const upcoming = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    for (let i = 1; i <= 6; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + i);
      const targetDateStr = getLocalYMD(targetDate);
      const d4 = []; const d7 = [];
      for (const topic of activeCompletedTopics) {
        const diffDays = getDaysDiff(targetDateStr, completedTopics[topic]);
        const st = reviewStates[topic] || { day4: false, day7: false };
        if (diffDays === 3 && !st.day4) d4.push(topic);
        if (diffDays === 6 && !st.day7) d7.push(topic);
      }
      upcoming.push({ date: targetDate, dateStr: targetDateStr, day4: d4, day7: d7 });
    }
    return upcoming;
  };
  const upcomingReviews = getUpcomingReviews();

  const getPlanDetails = () => {
    if (!state.planDeadline) return null;
    const todayStr = getTodayStr();
    const planTopicsActive = state.planTopics.filter(t => {
      if (!completedTopics[t]) return true; 
      if (completedTopics[t] === todayStr) return true; 
      return false; 
    });

    let daysLeft = getDaysDiff(state.planDeadline, todayStr);
    if (daysLeft < 1) daysLeft = 1; 

    const topicsPerDay = Math.ceil(planTopicsActive.length / daysLeft);
    const forecast = [];
    for(let i=0; i<4; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + i);
      const dayTopics = planTopicsActive.slice(i * topicsPerDay, (i + 1) * topicsPerDay);
      forecast.push({ date: targetDate, isToday: i === 0, isTomorrow: i === 1, topics: dayTopics });
    }

    const strictTopicsLeft = state.planTopics.filter(t => !completedTopics[t]).length;
    return { daysLeft, topicsLeft: strictTopicsLeft, topicsPerDay, forecast };
  };

  const handleCreatePlan = () => {
    if (!draftDeadline) return alert("Select a deadline.");
    if (draftPlanTopics.length === 0) return alert("Select at least one module for the plan.");
    state.setPlan(draftPlanTopics, draftDeadline);
  };

  const handleExport = () => {
    const dataToExport = {
      theme: state.theme, syllabusType: state.syllabusType,
      completedOfficial: state.completedOfficial, dailyOfficial: state.dailyOfficial, reviewsOfficial: state.reviewsOfficial,
      completedParth: state.completedParth, dailyParth: state.dailyParth, reviewsParth: state.reviewsParth,
      planTopics: state.planTopics, planDeadline: state.planDeadline
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `cfa_backup_${getTodayStr()}.json`);
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.completedOfficial || json.completedParth) {
          state.importData(json);
          alert("Data imported successfully!");
        } else {
          alert("Invalid backup file.");
        }
      } catch (err) {
        alert("Error parsing file.");
      }
    };
    reader.readAsText(file);
  };

  const planDetails = getPlanDetails();
  const draftDaysLeft = draftDeadline ? getDaysDiff(draftDeadline, getTodayStr()) : null;

  return (
    <div className={`theme-${state.theme}`}>
      
      {/* DYNAMIC THEME ENGINE & PRINT STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        .theme-dark .app-wrapper { background-color: #0a0a0a !important; color: #f3f4f6 !important; }
        .theme-dark .bg-\\[\\#fafafa\\] { background-color: #0a0a0a !important; }
        .theme-dark .bg-white { background-color: #171717 !important; }
        .theme-dark .text-black { color: #f3f4f6 !important; }
        .theme-dark .border-black { border-color: #404040 !important; }
        .theme-dark .bg-black { background-color: #f3f4f6 !important; color: #0a0a0a !important; }
        .theme-dark .text-white { color: #0a0a0a !important; }
        .theme-dark .shadow-\\[4px_4px_0px_0px_rgba\\(0\\,0\\,0\\,1\\)\\] { box-shadow: 4px 4px 0px 0px #404040 !important; }
        .theme-dark .shadow-\\[2px_2px_0px_0px_rgba\\(0\\,0\\,0\\,1\\)\\] { box-shadow: 2px 2px 0px 0px #404040 !important; }
        .theme-dark .shadow-\\[8px_8px_0px_0px_rgba\\(0\\,0\\,0\\,1\\)\\] { box-shadow: 8px 8px 0px 0px #404040 !important; }
        .theme-dark .bg-gray-50 { background-color: #262626 !important; }
        .theme-dark .bg-gray-100 { background-color: #262626 !important; }
        .theme-dark .bg-gray-200 { background-color: #404040 !important; }
        .theme-dark .border-gray-100 { border-color: #262626 !important; }
        .theme-dark .border-gray-200 { border-color: #404040 !important; }
        .theme-dark .border-gray-300 { border-color: #525252 !important; }
        .theme-dark .text-gray-500 { color: #a3a3a3 !important; }
        .theme-dark .hover\\:bg-gray-50:hover { background-color: #262626 !important; }
        .theme-dark .hover\\:bg-gray-100:hover { background-color: #404040 !important; }
        .theme-dark .hover\\:bg-gray-200:hover { background-color: #525252 !important; }
        .theme-dark .hover\\:text-black:hover { color: #ffffff !important; }
        .theme-dark .accent-black { accent-color: #f3f4f6 !important; }
        .theme-dark .bg-\\[\\#ebedf0\\] { background-color: #262626 !important; border-color: #404040 !important; }

        .theme-rgb .app-wrapper { background-color: #000000 !important; color: #ffffff !important; }
        .theme-rgb .bg-\\[\\#fafafa\\] { background-color: #000000 !important; }
        .theme-rgb .bg-white { background-color: #09090b !important; }
        .theme-rgb .text-black { color: #ffffff !important; }
        .theme-rgb .bg-black { background-color: #ffffff !important; color: #000000 !important; }
        .theme-rgb .text-white { color: #000000 !important; }
        .theme-rgb .bg-gray-50 { background-color: #18181b !important; }
        .theme-rgb .bg-gray-100 { background-color: #18181b !important; }
        .theme-rgb .bg-gray-200 { background-color: #27272a !important; }
        .theme-rgb .border-gray-100 { border-color: #18181b !important; }
        .theme-rgb .border-gray-200 { border-color: #27272a !important; }
        .theme-rgb .border-gray-300 { border-color: #3f3f46 !important; }
        .theme-rgb .text-gray-500 { color: #a1a1aa !important; }
        .theme-rgb .hover\\:bg-gray-50:hover { background-color: #18181b !important; }
        .theme-rgb .hover\\:bg-gray-100:hover { background-color: #27272a !important; }
        .theme-rgb .hover\\:bg-gray-200:hover { background-color: #3f3f46 !important; }
        .theme-rgb .bg-\\[\\#ebedf0\\] { background-color: #18181b !important; border-color: #27272a !important; }
        
        @keyframes rgb-border { 0% {border-color: #ef4444;} 33% {border-color: #22c55e;} 66% {border-color: #3b82f6;} 100% {border-color: #ef4444;} }
        @keyframes rgb-shadow { 0% {box-shadow: 4px 4px 0px 0px #ef4444;} 33% {box-shadow: 4px 4px 0px 0px #22c55e;} 66% {box-shadow: 4px 4px 0px 0px #3b82f6;} 100% {box-shadow: 4px 4px 0px 0px #ef4444;} }
        @keyframes rgb-accent { 0% {accent-color: #ef4444;} 33% {accent-color: #22c55e;} 66% {accent-color: #3b82f6;} 100% {accent-color: #ef4444;} }
        @keyframes rgb-text { 0% {background-position: 0% 50%;} 100% {background-position: 100% 50%;} }
        
        .theme-rgb .border-black { animation: rgb-border 4s linear infinite !important; }
        .theme-rgb .shadow-\\[4px_4px_0px_0px_rgba\\(0\\,0\\,0\\,1\\)\\] { animation: rgb-shadow 4s linear infinite !important; }
        .theme-rgb .shadow-\\[2px_2px_0px_0px_rgba\\(0\\,0\\,0\\,1\\)\\] { animation: rgb-shadow 4s linear infinite !important; }
        .theme-rgb .shadow-\\[8px_8px_0px_0px_rgba\\(0\\,0\\,0\\,1\\)\\] { animation: rgb-shadow 4s linear infinite !important; }
        .theme-rgb .accent-black { animation: rgb-accent 4s linear infinite !important; }
        .theme-rgb .logo-text { background: linear-gradient(to right, #ef4444, #22c55e, #3b82f6, #ef4444); background-size: 300%; -webkit-background-clip: text; color: transparent !important; animation: rgb-text 4s linear infinite; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* DYNAMIC PRINT STYLES - SWAPS ORIENTATION BASED ON TAB */
        @media print {
          body, html { background-color: white !important; margin: 0; padding: 0; }
          @page { 
            size: A4 ${activeTab === 'plan' ? 'landscape' : 'portrait'}; 
            margin: ${activeTab === 'plan' ? '10mm 15mm' : '15mm'}; 
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .page-break-inside-avoid { break-inside: avoid; }
        }
      `}} />

      {/* --- STANDARD WEB APP WRAPPER --- */}
      <div className="print:hidden app-wrapper min-h-screen bg-[#fafafa] text-black font-mono text-xs sm:text-sm selection:bg-black selection:text-white pb-20 transition-colors duration-300">
        
        {/* Top Navigation */}
        <nav className="bg-white border-b-2 border-black px-4 md:px-8 py-3 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-3 pr-4">
            <div className="flex-shrink-0 overflow-hidden rounded-sm border border-gray-800 bg-black">
              <img src="/logo.png" alt="CFA Console Logo" className="w-7 h-7 object-contain" />
            </div>
            <div className="relative">
              <span className="logo-text text-base font-bold uppercase tracking-tighter hidden sm:block cursor-pointer select-none whitespace-nowrap" onClick={() => setShowThemeMenu(!showThemeMenu)}>CFA_CONSOLE</span>
              <span className="block sm:hidden absolute inset-0 w-8 h-8 -ml-10" onClick={() => setShowThemeMenu(!showThemeMenu)}/>
              {showThemeMenu && (
                <div className="absolute top-full left-0 sm:left-auto mt-4 sm:mt-3 bg-white border-2 border-black p-2 flex gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50">
                  <button onClick={() => {state.setTheme('light'); setShowThemeMenu(false)}} className="w-6 h-6 sm:w-5 sm:h-5 rounded-full bg-[#fafafa] border-2 border-gray-400 hover:scale-110 transition-transform" title="Brutalist Light" />
                  <button onClick={() => {state.setTheme('dark'); setShowThemeMenu(false)}} className="w-6 h-6 sm:w-5 sm:h-5 rounded-full bg-[#0a0a0a] border-2 border-gray-600 hover:scale-110 transition-transform" title="Terminal Dark" />
                  <button onClick={() => {state.setTheme('rgb'); setShowThemeMenu(false)}} className="w-6 h-6 sm:w-5 sm:h-5 rounded-full bg-gradient-to-tr from-red-500 via-green-500 to-blue-500 border-2 border-black hover:scale-110 transition-transform" title="Gamer RGB" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 font-bold uppercase tracking-tight text-[10px] sm:text-xs overflow-x-auto hide-scrollbar w-full sm:w-auto justify-end">
            <span onClick={() => setActiveTab('dashboard')} className={`cursor-pointer transition-colors pb-1 whitespace-nowrap flex-shrink-0 ${activeTab === 'dashboard' ? 'border-b-2 border-black' : 'text-gray-400 hover:text-black'}`}>[Dashboard]</span>
            <span onClick={() => setActiveTab('tracker')} className={`cursor-pointer transition-colors pb-1 whitespace-nowrap flex-shrink-0 ${activeTab === 'tracker' ? 'border-b-2 border-black' : 'text-gray-400 hover:text-black'}`}>[1-4-7]</span>
            <span onClick={() => setActiveTab('plan')} className={`cursor-pointer transition-colors pb-1 whitespace-nowrap flex-shrink-0 ${activeTab === 'plan' ? 'border-b-2 border-black' : 'text-gray-400 hover:text-black'}`}>[Plan]</span>
            <span onClick={() => setActiveTab('data')} className={`cursor-pointer transition-colors pb-1 whitespace-nowrap flex-shrink-0 ${activeTab === 'data' ? 'border-b-2 border-black' : 'text-gray-400 hover:text-black'}`}>[Data]</span>
          </div>
        </nav>

        <main className="max-w-[1000px] mx-auto px-3 sm:px-4 mt-6 sm:mt-8 space-y-6 sm:space-y-8">
          
          {/* --- DASHBOARD VIEW --- */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
              
              {/* Heatmap Card */}
              <div className="bg-white border-2 border-black p-4 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} />
                    <h2 className="text-sm font-bold uppercase tracking-tight">Consistency_Grid</h2>
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">{state.syllabusType === 'parth' ? 'Parth Sir Mode' : 'Official Mode'}</span>
                </div>
                
                <div className="overflow-x-auto pb-4 pt-2">
                  <div className="flex text-[9px] text-gray-500 mb-2 ml-[24px] uppercase font-bold tracking-tighter h-3 relative">
                    {heatmapCols.map((col, i) => {
                      const isNewMonth = i === 0 || col[0].date.getMonth() !== heatmapCols[i-1][0].date.getMonth();
                      return (
                        <div key={i} className="w-[14px] flex-shrink-0 relative">
                          {isNewMonth && <span className="absolute left-0 bottom-0 z-10 bg-transparent pr-1">{months[col[0].date.getMonth()]}</span>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-row gap-[2px] min-w-max">
                    <div className="flex flex-col gap-[2px] text-[9px] text-gray-500 text-right pr-2 w-[24px] font-bold uppercase tracking-tighter leading-[12px]">
                      <span className="h-[12px]">Mon</span>
                      <span className="h-[12px]"></span>
                      <span className="h-[12px]">Wed</span>
                      <span className="h-[12px]"></span>
                      <span className="h-[12px]">Fri</span>
                      <span className="h-[12px]"></span>
                      <span className="h-[12px]"></span>
                    </div>
                    {heatmapCols.map((col, colIdx) => (
                      <div key={colIdx} className="flex flex-col gap-[2px] relative">
                        {col.map((day, dayIdx) => (
                          <div key={dayIdx} className={`w-[12px] h-[12px] rounded-[2px] ${day.colorClass} relative group cursor-pointer`}>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 bg-black text-white text-[10px] px-2 py-1 whitespace-nowrap rounded-sm shadow-xl">
                              {day.isFuture ? `Future: ${day.dateStr}` : `[${day.count}] on ${day.dateStr}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-end gap-2 mt-2 text-[9px] uppercase font-bold text-gray-500 tracking-tighter">
                  <span className="mr-1">Less</span>
                  <div className="w-[12px] h-[12px] rounded-[2px] bg-gray-200 border border-gray-300"></div>
                  <div className="w-[12px] h-[12px] rounded-[2px] bg-green-300 border border-green-400"></div>
                  <div className="w-[12px] h-[12px] rounded-[2px] bg-green-500 border border-green-600"></div>
                  <div className="w-[12px] h-[12px] rounded-[2px] bg-green-600 border border-green-700"></div>
                  <div className="w-[12px] h-[12px] rounded-[2px] bg-green-800 border border-green-900"></div>
                  <span className="ml-1">More</span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white border-2 border-black p-3 sm:p-4 flex flex-col items-center justify-center text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-[10px] sm:text-sm font-bold uppercase text-gray-500 mb-1">Topics</span>
                  <span className="text-xl sm:text-3xl font-bold">{totalCompleted}</span>
                </div>
                <div className="bg-black text-white border-2 border-black p-3 sm:p-4 flex flex-col items-center justify-center text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                  <span className="text-[10px] sm:text-sm font-bold uppercase text-gray-400 mb-1">Total_%</span>
                  <span className="text-xl sm:text-3xl font-bold">{completionPct}%</span>
                </div>
                <div className="bg-white border-2 border-black p-3 sm:p-4 flex flex-col items-center justify-center text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-[10px] sm:text-sm font-bold uppercase text-gray-500 mb-1">Today</span>
                  <span className="text-xl sm:text-3xl font-bold">{todayCompletedCount}</span>
                </div>
              </div>

              {/* Syllabus Grid */}
              <div className="grid grid-cols-1 gap-4 pt-4 items-start">
                {Object.entries(currentSyllabus).map(([subject, data]) => {
                  const subjectTopics = Object.values((data as any).sections).flat() as string[];
                  const subCompleted = subjectTopics.filter(t => completedTopics[t]).length;
                  const subPct = subjectTopics.length > 0 ? Math.round((subCompleted / subjectTopics.length) * 100) : 0;
                  const isExpanded = expandedSubjects[subject];

                  return (
                    <div key={subject} className={`bg-white border-2 transition-all flex flex-col ${isExpanded ? 'border-[#ea580c] shadow-[4px_4px_0px_0px_rgba(234,88,12,1)]' : 'border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}>
                      <div onClick={() => toggleSubject(subject)} className={`p-3 sm:p-4 border-b-2 cursor-pointer flex flex-col gap-2 transition-colors ${isExpanded ? 'bg-[#ea580c] border-[#ea580c] text-white' : 'bg-gray-50 border-transparent hover:border-black text-black'}`}>
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-xs sm:text-sm uppercase tracking-tight">{subject}</h3>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-bold px-2 py-0.5 ${isExpanded ? 'bg-white text-[#ea580c]' : 'bg-black text-white'}`}>{subPct}%</span>
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </div>
                        </div>
                        <div className={`w-full h-1 ${isExpanded ? 'bg-white/30' : 'bg-gray-200'}`}>
                          <div className={`h-full transition-all duration-300 ${isExpanded ? 'bg-white' : 'bg-black'}`} style={{ width: `${subPct}%` }} />
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="flex flex-col bg-white border-t-2 border-[#ea580c] p-2 sm:p-4 gap-3">
                          {Object.entries((data as any).sections).map(([sectionName, topics]) => {
                            const isSectionExpanded = expandedTopicSections[sectionName];
                            const secCompleted = (topics as string[]).filter((t: string) => completedTopics[t]).length;
                            const secPct = (topics as string[]).length > 0 ? Math.round((secCompleted / (topics as string[]).length) * 100) : 0;
                            
                            return (
                              <div key={sectionName} className="border-2 border-black flex flex-col">
                                <div onClick={() => toggleTopicSection(sectionName)} className="flex items-center justify-between p-2 sm:p-3 bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors border-b border-transparent hover:border-black">
                                  <span className="font-bold text-[11px] sm:text-xs uppercase">{sectionName}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] sm:text-xs font-bold text-gray-500">[{secCompleted}/{(topics as string[]).length}]</span>
                                    {isSectionExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                  </div>
                                </div>
                                
                                {/* GREEN MINIMAL SUBTOPIC PROGRESS BAR */}
                                <div className="w-full h-[3px] bg-gray-200">
                                  <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${secPct}%` }} />
                                </div>
                                
                                {isSectionExpanded && (
                                  <div className="flex flex-col border-t-2 border-black bg-white">
                                    {(topics as string[]).map((topic) => (
                                      <TopicLabel key={topic} topic={topic} isChecked={!!completedTopics[topic]} state={reviewStates[topic]} onToggle={() => state.toggleTopic(topic)} />
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* --- 1-4-7 TRACKER VIEW --- */}
          {activeTab === 'tracker' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="mb-6 border-b-2 border-black pb-4 flex flex-col items-start gap-4">
                <h1 className="text-lg font-bold uppercase tracking-tight mb-2">1-4-7_Spaced_Repetition</h1>
                <div className="bg-[#fff7ed] border border-[#ea580c] p-3 w-full shadow-[2px_2px_0px_0px_rgba(234,88,12,1)]">
                  <p className="text-[#ea580c] text-[11px] sm:text-xs font-bold uppercase tracking-tight leading-relaxed !text-[#ea580c]">
                    [ RULE ]: The 1-4-7 protocol guarantees memory retention. After completing a topic (Day 1), you review it 3 days later (Day 4) and again 3 days after that (Day 7). This system strictly auto-queues your reviews based on your historical completion timestamps.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="bg-[#fefce8] border-2 border-[#854d0e] shadow-[4px_4px_0px_0px_rgba(133,77,14,1)] p-4 sm:p-5 min-h-[250px] !bg-[#fefce8] !border-[#854d0e]">
                  <div className="flex justify-between items-center pb-3 border-b-2 border-[#854d0e] mb-3 !border-[#854d0e]">
                    <span className="font-bold text-sm uppercase tracking-tight text-[#854d0e] !text-[#854d0e]">Today's_Day_4_Review</span>
                    <span className="bg-[#854d0e] text-white px-2 py-0.5 text-xs font-bold !bg-[#854d0e] !text-white">{day4Reviews.length}</span>
                  </div>
                  {day4Reviews.length === 0 ? (
                    <div className="text-center text-[#854d0e]/60 py-10 text-xs uppercase tracking-widest !text-[#854d0e]/60">[ Queue_Empty ]</div>
                  ) : (
                    <div className="flex flex-col gap-0 border border-[#854d0e] bg-white !border-[#854d0e]">
                      {day4Reviews.map((topic, i) => {
                        const [topicName, rawDuration] = topic.includes(' | ') ? topic.split(' | ') : [topic, null];
                        const duration = formatDuration(rawDuration);
                        return (
                          <label key={topic} className={`flex items-start gap-3 py-3 px-2 sm:p-3 cursor-pointer hover:bg-amber-50 ${i !== day4Reviews.length - 1 ? 'border-b border-amber-200 !border-amber-200' : ''}`}>
                            <div className="pt-[2px] sm:pt-0.5">
                              <input type="checkbox" onChange={() => state.markReview(topic, 'day4')} className="w-4 h-4 sm:w-3.5 sm:h-3.5 accent-[#854d0e] rounded-none !accent-[#854d0e]" />
                            </div>
                            <span className="text-xs text-[#854d0e] font-bold leading-snug !text-[#854d0e] flex-1">
                              {topicName}
                              {duration && <span className="ml-2 whitespace-nowrap">[{duration}]</span>}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-[#f0fdf4] border-2 border-[#166534] shadow-[4px_4px_0px_0px_rgba(22,101,52,1)] p-4 sm:p-5 min-h-[250px] !bg-[#f0fdf4] !border-[#166534]">
                  <div className="flex justify-between items-center pb-3 border-b-2 border-[#166534] mb-3 !border-[#166534]">
                    <span className="font-bold text-sm uppercase tracking-tight text-[#166534] !text-[#166534]">Today's_Day_7_Review</span>
                    <span className="bg-[#166534] text-white px-2 py-0.5 text-xs font-bold !bg-[#166534] !text-white">{day7Reviews.length}</span>
                  </div>
                  {day7Reviews.length === 0 ? (
                    <div className="text-center text-[#166534]/60 py-10 text-xs uppercase tracking-widest !text-[#166534]/60">[ Queue_Empty ]</div>
                  ) : (
                    <div className="flex flex-col gap-0 border border-[#166534] bg-white !border-[#166534]">
                      {day7Reviews.map((topic, i) => {
                        const [topicName, rawDuration] = topic.includes(' | ') ? topic.split(' | ') : [topic, null];
                        const duration = formatDuration(rawDuration);
                        return (
                          <label key={topic} className={`flex items-start gap-3 py-3 px-2 sm:p-3 cursor-pointer hover:bg-emerald-50 ${i !== day7Reviews.length - 1 ? 'border-b border-emerald-200 !border-emerald-200' : ''}`}>
                            <div className="pt-[2px] sm:pt-0.5">
                              <input type="checkbox" onChange={() => state.markReview(topic, 'day7')} className="w-4 h-4 sm:w-3.5 sm:h-3.5 accent-[#166534] rounded-none !accent-[#166534]" />
                            </div>
                            <span className="text-xs text-[#166534] font-bold leading-snug !text-[#166534] flex-1">
                              {topicName}
                              {duration && <span className="ml-2 whitespace-nowrap">[{duration}]</span>}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* 6-DAY FORECAST ENGINE */}
              <div className="mt-12 border-t-4 border-black pt-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h2 className="text-sm font-bold uppercase tracking-tight flex items-center gap-2 text-[#ea580c] !text-[#ea580c]">
                    <CalendarDays size={20} /> Upcoming_Revision_Topics (Next 6 Days)
                  </h2>
                  <button onClick={() => window.print()} className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-tight hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                    <Printer size={16} /> Print_A4_Schedule
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingReviews.map((day, i) => {
                    const isEmpty = day.day4.length === 0 && day.day7.length === 0;
                    return (
                      <div key={i} className={`border-2 border-black p-3 flex flex-col min-h-[120px] ${isEmpty ? 'bg-gray-50 opacity-60' : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}>
                        <div className="font-bold text-xs uppercase border-b-2 border-black pb-2 mb-3 flex justify-between items-end">
                          <span className={i === 0 ? 'text-[#ea580c] !text-[#ea580c]' : ''}>{i === 0 ? "TOMORROW" : day.date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                          <span className="text-[10px] text-gray-500 font-bold">{day.date.getDate()} {day.date.toLocaleDateString('en-US', { month: 'short' })}</span>
                        </div>
                        
                        {isEmpty ? (
                          <div className="text-[10px] text-gray-400 uppercase tracking-widest text-center flex-1 flex items-center justify-center">[ CLEAR ]</div>
                        ) : (
                          <div className="space-y-3 flex-1">
                            {day.day4.length > 0 && (
                              <div>
                                <span className="text-[9px] font-bold text-[#854d0e] bg-[#fefce8] px-1 border border-[#854d0e] uppercase !text-[#854d0e] !border-[#854d0e] !bg-[#fefce8]">Day 4</span>
                                <div className="text-[10px] mt-1.5 space-y-1 text-black">
                                  {day.day4.map(t => {
                                    const [name, rawDur] = t.includes(' | ') ? t.split(' | ') : [t, null];
                                    const duration = formatDuration(rawDur);
                                    return (
                                      <div key={t} className="leading-tight border-b border-gray-100 pb-1 mb-1 last:border-0 last:pb-0 last:mb-0">
                                        • {name} {duration && <span className="text-[#ea580c] font-bold !text-[#ea580c]">[{duration}]</span>}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                            {day.day7.length > 0 && (
                              <div>
                                <span className="text-[9px] font-bold text-[#166534] bg-[#f0fdf4] px-1 border border-[#166534] uppercase !text-[#166534] !border-[#166534] !bg-[#f0fdf4]">Day 7</span>
                                <div className="text-[10px] mt-1.5 space-y-1 text-black">
                                  {day.day7.map(t => {
                                    const [name, rawDur] = t.includes(' | ') ? t.split(' | ') : [t, null];
                                    const duration = formatDuration(rawDur);
                                    return (
                                      <div key={t} className="leading-tight border-b border-gray-100 pb-1 mb-1 last:border-0 last:pb-0 last:mb-0">
                                        • {name} {duration && <span className="text-[#ea580c] font-bold !text-[#ea580c]">[{duration}]</span>}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          )}

          {/* --- PLAN VIEW --- */}
          {activeTab === 'plan' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-black pb-4">
                <div>
                  <h1 className="text-lg font-bold uppercase tracking-tight mb-1">Dynamic_Planner</h1>
                  <p className="text-gray-500 text-xs">Auto-schedules specific modules based on your deadline.</p>
                </div>
                {state.planDeadline && (
                  <button onClick={() => window.print()} className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-tight hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                    <Printer size={16} /> Print_A4_Landscape
                  </button>
                )}
              </div>

              {!state.planDeadline ? (
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6">
                  <h2 className="text-sm font-bold uppercase mb-6 flex items-center gap-2">
                    <Target size={18} /> Initialize_New_Plan
                  </h2>
                  
                  <div className="mb-6">
                    <label className="flex items-center text-xs font-bold uppercase mb-2">
                      1. Target_Deadline
                      {draftDaysLeft !== null && draftDaysLeft >= 0 && (
                        <span className="ml-2 text-blue-600 bg-blue-50 px-2 py-0.5 border border-blue-200">[{draftDaysLeft} DAYS AWAY]</span>
                      )}
                    </label>
                    <input type="date" value={draftDeadline} onChange={(e) => setDraftDeadline(e.target.value)} className="border-2 border-black p-3 sm:p-2 font-mono text-sm w-full sm:max-w-xs focus:outline-none focus:ring-0 rounded-none bg-white text-black" />
                  </div>

                  <div className="mb-8">
                    <label className="block text-xs font-bold uppercase mb-3 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-1">
                      <span>2. Select_Topics_To_Include</span>
                      <span className="text-gray-500 font-normal">[{draftPlanTopics.length} Queued]</span>
                    </label>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {Object.entries(currentSyllabus).map(([subject, data]) => {
                        const subjectTopics = Object.values((data as any).sections).flat() as string[];
                        const isAllSelected = subjectTopics.every(t => draftPlanTopics.includes(t));
                        const isSomeSelected = subjectTopics.some(t => draftPlanTopics.includes(t)) && !isAllSelected;
                        const isExpanded = expandedPlanSubjects[subject];

                        return (
                          <div key={subject} className={`border-2 transition-all flex flex-col bg-white ${isExpanded ? 'border-[#ea580c] shadow-[2px_2px_0px_0px_rgba(234,88,12,1)]' : 'border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}>
                            <div className={`flex items-center gap-3 p-3 sm:p-4 transition-colors ${isExpanded ? 'bg-[#ea580c] text-white border-b-2 border-[#ea580c]' : 'hover:bg-gray-50 border-b-2 border-transparent text-black'}`}>
                              <input
                                type="checkbox"
                                checked={isAllSelected}
                                ref={input => { if (input) input.indeterminate = isSomeSelected }}
                                onChange={() => {
                                  if (isAllSelected) {
                                    setDraftPlanTopics(prev => prev.filter(t => !subjectTopics.includes(t)));
                                  } else {
                                    setDraftPlanTopics(prev => Array.from(new Set([...prev, ...subjectTopics])));
                                  }
                                }}
                                className={`w-4 h-4 rounded-none cursor-pointer flex-shrink-0 ${isExpanded ? 'accent-white' : 'accent-black'}`}
                              />
                              <span className="font-bold text-xs sm:text-sm uppercase cursor-pointer flex-1 select-none leading-tight" onClick={() => togglePlanSubject(subject)}>
                                {subject}
                              </span>
                              <span className={`text-[10px] sm:text-xs font-bold whitespace-nowrap ${isExpanded ? 'text-white' : 'text-gray-500'}`}>
                                [{subjectTopics.filter(t => draftPlanTopics.includes(t)).length}/{subjectTopics.length}]
                              </span>
                              <button onClick={() => togglePlanSubject(subject)} className={`p-1 transition-colors flex-shrink-0 ${isExpanded ? 'text-white hover:bg-white/20' : 'hover:bg-gray-200 border border-transparent hover:border-black'}`}>
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </button>
                            </div>
                            
                            {isExpanded && (
                              <div className="p-1 sm:p-2 flex flex-col bg-gray-50 gap-2 border-t-2 border-[#ea580c]">
                                {Object.entries((data as any).sections).map(([sectionName, topics]) => (
                                  <div key={sectionName} className="border border-gray-300">
                                    <div className="bg-gray-200 p-2 text-[10px] font-bold uppercase">{sectionName}</div>
                                    <div className="bg-white flex flex-col">
                                      {(topics as string[]).map(topic => {
                                        const isTopicSelected = draftPlanTopics.includes(topic);
                                        const isDone = !!completedTopics[topic];
                                        const [topicName, rawDur] = topic.includes(' | ') ? topic.split(' | ') : [topic, null];
                                        
                                        return (
                                          <label key={topic} className={`flex items-start gap-3 py-2 px-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${isDone ? 'bg-gray-50 hover:bg-gray-100' : 'hover:bg-gray-100'}`}>
                                            <div className="pt-[2px] sm:pt-0.5">
                                              <input
                                                type="checkbox"
                                                checked={isTopicSelected}
                                                onChange={() => {
                                                  if (isTopicSelected) setDraftPlanTopics(prev => prev.filter(t => t !== topic));
                                                  else setDraftPlanTopics(prev => [...prev, topic]);
                                                }}
                                                className={`w-4 h-4 sm:w-3.5 sm:h-3.5 rounded-none cursor-pointer ${isDone ? 'accent-gray-400' : 'accent-black'}`}
                                              />
                                            </div>
                                            <span className={`text-xs leading-snug flex-1 ${isDone ? 'text-gray-400 line-through opacity-70' : 'text-black'}`}>
                                              {topicName} {rawDur && <span className={`${isDone ? 'text-gray-400' : 'text-[#ea580c] !text-[#ea580c]'} font-bold`}>[{formatDuration(rawDur)}]</span>}
                                            </span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button onClick={handleCreatePlan} className="bg-black text-white px-6 py-4 sm:py-3 text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors w-full flex justify-center items-center gap-2">
                    <CheckCircle2 size={18} /> GENERATE_SCHEDULE
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* On-Screen Dashboard View */}
                  <div className="bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] p-4 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <span className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase block mb-1">Target_Deadline</span>
                      <span className="text-xl sm:text-2xl font-bold text-emerald-400 !text-emerald-400">{state.planDeadline}</span>
                    </div>
                    <div className="flex flex-wrap gap-6 sm:gap-8 w-full sm:w-auto">
                      <div>
                        <span className="text-gray-400 text-[10px] font-bold uppercase block mb-1">Days_Left</span>
                        <span className="text-lg sm:text-xl font-bold">{planDetails?.daysLeft}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[10px] font-bold uppercase block mb-1">Items_Left</span>
                        <span className="text-lg sm:text-xl font-bold">{planDetails?.topicsLeft}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[10px] font-bold uppercase block mb-1">Required_Pace</span>
                        <span className="text-lg sm:text-xl font-bold text-blue-400 !text-blue-400">{planDetails?.topicsPerDay}/DAY</span>
                      </div>
                    </div>
                    <button onClick={state.clearPlan} className="w-full md:w-auto border border-gray-600 text-gray-300 px-3 py-2 sm:py-1 text-xs hover:bg-gray-800 uppercase font-bold transition-colors">
                      Reset_Plan
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                    {planDetails?.forecast.map((dayPlan, idx) => (
                      <div key={idx} className={`${dayPlan.isToday ? 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-black' : 'bg-gray-50 border-gray-300 border-dashed'} border-2 p-4`}>
                        <div className={`flex justify-between items-center pb-3 mb-3 ${dayPlan.isToday ? 'border-b-2 border-black' : 'border-b-2 border-gray-300'}`}>
                          <span className={`font-bold text-sm uppercase tracking-tight flex items-center gap-2 ${dayPlan.isToday ? 'text-black' : 'text-gray-500'}`}>
                            {dayPlan.isToday ? <ListTodo size={16}/> : null} 
                            {dayPlan.isToday ? "TODAY" : dayPlan.isTomorrow ? "TOMORROW" : dayPlan.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        
                        {dayPlan.topics.length === 0 ? (
                          <div className="text-center text-gray-400 py-6 text-xs uppercase tracking-widest">[ Empty ]</div>
                        ) : (
                          <div className="flex flex-col gap-3 sm:gap-2">
                            {dayPlan.topics.map((t, tIdx) => {
                              const subject = getSubjectForTopic(t, currentSyllabus);
                              const [topicName, rawDur] = t.includes(' | ') ? t.split(' | ') : [t, null];
                              const duration = formatDuration(rawDur);
                              const isDone = !!completedTopics[t];
                              
                              if (dayPlan.isToday) {
                                return (
                                  <label key={tIdx} className={`flex items-start gap-3 p-3 sm:p-2 border cursor-pointer transition-colors ${isDone ? 'bg-green-50 border-green-200 border-l-4 border-l-green-500 hover:bg-green-100' : 'bg-gray-50 border-gray-200 border-l-4 border-l-black hover:bg-gray-100'}`}>
                                    <div className="pt-[2px]">
                                      <input type="checkbox" checked={isDone} onChange={() => state.toggleTopic(t)} className={`w-4 h-4 sm:w-3.5 sm:h-3.5 rounded-none cursor-pointer ${isDone ? 'accent-green-600' : 'accent-black'}`} />
                                    </div>
                                    <div className={`flex flex-col flex-1 leading-tight font-bold ${isDone ? 'opacity-50 line-through text-green-900' : 'text-black'}`}>
                                      <span className={`mr-1 uppercase text-[10px] ${isDone ? 'text-green-700' : 'text-[#ea580c] !text-[#ea580c]'}`}>[{subject}]</span>
                                      <span className="mt-1">{topicName}</span>
                                      {duration && <span className={`font-bold mt-1 text-[10px] ${isDone ? 'text-green-700' : 'text-[#ea580c] !text-[#ea580c]'}`}>[{duration}]</span>}
                                    </div>
                                  </label>
                                );
                              }

                              return (
                                <div key={tIdx} className={`text-xs p-2 leading-tight font-bold flex flex-col ${isDone ? 'opacity-40 line-through border-l-2 border-l-gray-200 text-gray-400' : 'text-gray-500 border-l-2 border-l-gray-300'}`}>
                                  <span className={`mr-1 uppercase ${isDone ? 'text-gray-400' : 'text-[#ea580c] !text-[#ea580c]'}`}>[{subject}]</span>
                                  <span className="block mt-1">{topicName}</span>
                                  {duration && <span className={`font-bold block mt-1 ${isDone ? 'text-gray-400' : 'text-[#ea580c] !text-[#ea580c]'}`}>[{duration}]</span>}
                                </div>
                              );
                            })}
                            {dayPlan.isToday && <div className="text-[9px] text-gray-400 mt-2 italic">*Completed items will be removed at midnight.</div>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- DATA & WEIGHTAGE VIEW --- */}
          {activeTab === 'data' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* TOP ROW: Split screen layout for Desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                
                {/* LEFT HALF: The Vibrant Radar Chart */}
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6 flex flex-col h-full overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter leading-none">CFA Level I</h2>
                      <p className="text-[10px] sm:text-xs text-gray-500 font-bold tracking-widest uppercase mt-1">Study Progress</p>
                    </div>
                    <div className="border border-gray-200 bg-gray-50 px-4 py-2 text-right rounded-lg shadow-sm">
                      <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Average Completion</div>
                      <div className="text-2xl sm:text-3xl font-black leading-none mt-1">{completionPct}%</div>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center w-full">
                    <RadarChart data={radarData} />
                  </div>
                </div>

                {/* RIGHT HALF: Exam Weightage & Danger Zone */}
                <div className="flex flex-col gap-6">
                  {/* Exam Weightage */}
                  <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-5 flex-1">
                    <div className="flex items-center gap-2 mb-4 border-b-2 border-black pb-2">
                      <PieChart size={18} />
                      <h2 className="text-sm font-bold uppercase tracking-tight">Exam_Weightage</h2>
                    </div>
                    <div className="flex flex-col border border-black">
                      {Object.entries(currentSyllabus).sort((a: any,b: any) => parseInt(b[1].weight) - parseInt(a[1].weight)).map(([sub, data]: any, idx, arr) => (
                        <div key={sub} className={`flex justify-between p-3 sm:p-2 text-xs ${idx !== arr.length - 1 ? 'border-b border-gray-200' : ''}`}>
                          <span className="font-bold">{sub}</span>
                          <span className="bg-gray-100 px-1 border border-gray-300">{data.weight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Danger Zone (Hard Reset) */}
                  <div className="bg-red-50 border-2 border-red-600 shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-2 border-b-2 border-red-600 pb-2">
                      <AlertTriangle size={18} className="text-red-600" />
                      <h2 className="text-sm font-bold uppercase tracking-tight text-red-600">Danger_Zone</h2>
                    </div>
                    <p className="text-[10px] sm:text-xs text-red-800 font-bold mb-4 mt-2">
                      Clicking this will permanently erase all completed topics, review schedules, and active plans from this device.
                    </p>
                    <button 
                      onClick={handleHardReset} 
                      className="w-full bg-red-600 text-white border-2 border-red-800 px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(153,27,27,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(153,27,27,1)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none"
                    >
                      <Trash2 size={16} /> Delete Everything
                    </button>
                  </div>
                </div>

              </div>

              {/* SECOND ROW: Curriculum Mode & Legacy Backup */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Curriculum Mode */}
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-5 h-full">
                  <div className="flex items-center gap-2 mb-4 border-b-2 border-black pb-2">
                    <Settings size={18} />
                    <h2 className="text-sm font-bold uppercase tracking-tight">Curriculum_Mode</h2>
                  </div>
                  <div className="flex items-start gap-3 mb-4 p-3 bg-amber-50 border border-amber-200">
                    <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] sm:text-xs text-amber-800 font-bold leading-snug">
                      Warning: Switching modes will reset the consistency grid to match the selected syllabus and clear your active planner schedule. Your previous data is securely saved in the background.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row bg-gray-100 p-1 border-2 border-black gap-1 sm:gap-0 mt-auto">
                    <button onClick={() => handleSyllabusToggle('official')} className={`flex-1 py-3 sm:py-2 text-xs font-bold uppercase tracking-tight transition-colors ${state.syllabusType === 'official' ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-200'}`}>
                      Official Modules
                    </button>
                    <button onClick={() => handleSyllabusToggle('parth')} className={`flex-1 py-3 sm:py-2 text-xs font-bold uppercase tracking-tight transition-colors ${state.syllabusType === 'parth' ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-200'}`}>
                      Parth Sir Topics
                    </button>
                  </div>
                </div>

                {/* Legacy File Backup */}
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-5 h-full">
                  <div className="flex items-center gap-2 mb-4 border-b-2 border-black pb-2">
                    <Upload size={18} />
                    <h2 className="text-sm font-bold uppercase tracking-tight">Legacy_File_Backup</h2>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-600 mb-6 leading-relaxed">Download a hard copy of your save data as a .json file for permanent safekeeping, or upload an existing save file.</p>
                  <div className="flex flex-col gap-4 mt-auto">
                    <button onClick={handleExport} className="w-full bg-white border-2 border-black text-black px-4 py-3 text-xs font-bold uppercase tracking-tight hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none">
                      <Download size={16} /> Download_Backup.json
                    </button>
                    <div className="relative">
                      <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" />
                      <button onClick={() => fileInputRef.current?.click()} className="w-full bg-gray-50 border border-gray-300 text-gray-600 px-4 py-3 text-[10px] font-bold uppercase tracking-tight hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                        Upload_File_Backup
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* THIRD ROW: MAGIC LINK SYNC ENGINE */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-black pb-2 mb-4">
                  <div className="flex items-center gap-2">
                    <LinkIcon size={18} />
                    <h2 className="text-sm font-bold uppercase tracking-tight">Peer-to-Peer Magic Sync</h2>
                  </div>
                  <span className="bg-gray-200 text-gray-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">Serverless Offline Fallback</span>
                </div>
                
                {/* INCOMING URL SYNC POPUP */}
                {incomingPayload ? (
                   <div className="space-y-4">
                      <div className="bg-amber-50 border-2 border-amber-500 p-4">
                        <h2 className="text-amber-700 font-bold uppercase tracking-tight flex items-center gap-2 mb-2 text-sm">
                          <AlertTriangle size={20} /> Incoming Sync Detected
                        </h2>
                        <p className="text-xs text-amber-900 leading-relaxed font-bold opacity-80">
                          You opened a magic link. Proceeding will instantly overwrite this device's progress.
                        </p>
                      </div>

                      {magicSyncStatus === 'SUCCESS' ? (
                        <div className="bg-green-100 border-2 border-green-600 p-4 text-center">
                          <p className="text-green-800 font-bold uppercase text-sm flex items-center justify-center gap-2">
                            <CheckCircle2 size={18} /> Syncing & Reloading...
                          </p>
                        </div>
                      ) : magicSyncStatus === 'INVALID_LINK' || magicSyncStatus === 'ERROR_PARSING' ? (
                        <div className="bg-red-50 border-2 border-red-500 p-4 text-center">
                          <p className="text-red-700 font-bold uppercase text-sm">Corrupted Link</p>
                          <p className="text-xs text-red-600 mt-1 mb-4">The sync payload is broken or incomplete.</p>
                          <button onClick={handleCancelUrlSync} className="bg-white text-red-700 border-2 border-red-500 px-4 py-2 text-xs font-bold uppercase hover:bg-red-50">Clear Error</button>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-4">
                          <button onClick={handleConfirmUrlSync} className="flex-1 bg-black text-white px-4 py-4 sm:py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors flex justify-center items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
                            <CheckCircle2 size={16} /> Confirm Sync
                          </button>
                          <button onClick={handleCancelUrlSync} className="flex-1 bg-white text-black border-2 border-black px-4 py-4 sm:py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors flex justify-center items-center">
                            Cancel
                          </button>
                        </div>
                      )}
                   </div>
                ) : (
                   <div className="space-y-6">
                      <p className="text-[10px] sm:text-xs text-gray-500 leading-relaxed">
                        Manually sync your progress across devices without an account. <b>Device A:</b> Generate a link. <b>Device B:</b> Paste the link to instantly mirror your progress.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* DEVICE A */}
                        <div className="bg-gray-50 border-2 border-black p-4 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-xs uppercase mb-1 text-black">1. Export (Device A)</h3>
                            <p className="text-[10px] text-gray-500 mb-4">Compress your progress into a secure string.</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button 
                              onClick={handleGenerateLink} 
                              className={`w-full px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors flex justify-center items-center gap-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none ${copiedLink ? 'bg-green-500 text-white border-green-500' : 'bg-white text-black'}`}
                            >
                              {copiedLink ? <CheckCircle2 size={16} /> : <LinkIcon size={16} />}
                              {copiedLink ? "Link Copied!" : "Copy Magic Link"}
                            </button>
                            
                            <button 
                              onClick={handleCopyRawCode} 
                              className={`w-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors flex justify-center items-center gap-2 border-2 border-gray-300 hover:border-black hover:bg-gray-200 ${copiedCode ? 'bg-green-100 text-green-700 border-green-500' : 'bg-transparent text-gray-500'}`}
                            >
                              {copiedCode ? <CheckCircle2 size={14} /> : <FileText size={14} />}
                              {copiedCode ? "Raw Code Copied!" : "Copy Raw Code (Fallback)"}
                            </button>
                          </div>
                        </div>

                        {/* DEVICE B */}
                        <div className="bg-gray-50 border-2 border-black p-4 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-xs uppercase mb-1 text-black">2. Import (Device B)</h3>
                            <p className="text-[10px] text-gray-500 mb-4">Paste the link OR raw code here.</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <input 
                              type="text" 
                              placeholder="Paste URL or Raw Code..." 
                              value={pastedLink}
                              onChange={(e) => setPastedLink(e.target.value)}
                              className="w-full p-2 text-xs border-2 border-gray-300 focus:border-black focus:outline-none bg-white"
                            />
                            <button 
                              onClick={handleApplyPastedSync}
                              className="w-full bg-black text-white px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors flex justify-center items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
                            >
                              <Download size={14} /> Sync Data
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Manual Status Messenger */}
                      {magicSyncStatus && !incomingPayload && (
                        <div className={`mt-4 text-[10px] font-bold uppercase tracking-widest py-3 px-4 border-2 flex items-center justify-center gap-2 ${
                          magicSyncStatus === 'SUCCESS' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'
                        }`}>
                          {magicSyncStatus === 'SUCCESS' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                          {magicSyncStatus === 'SUCCESS' ? "Data Synced Successfully! Reloading..." : "Error: Invalid or corrupted sync payload."}
                        </div>
                      )}
                   </div>
                )}
              </div>

            </div>
          )}

        </main>
      </div>

      {/* --- PRINT ONLY VIEW (HIDDEN ON SCREEN, VISIBLE ON PAPER) --- */}
      <div className="hidden print:block print:bg-white print:text-black w-full min-h-screen font-sans">
        
        {/* 1. TRACKER PRINT LAYOUT (PORTRAIT) */}
        {activeTab === 'tracker' && (
          <div>
            <div className="border-b-4 border-black pb-4 mb-6 flex justify-between items-end">
              <h1 className="text-2xl font-bold uppercase tracking-tighter flex items-center gap-2">
                <CalendarDays size={28} /> CFA REVISION WEEKLY SCHEDULE
              </h1>
              <span className="text-sm font-bold text-gray-500 uppercase">
                Date From: {upcomingReviews[0].date.getDate()} {upcomingReviews[0].date.toLocaleDateString('en-US', { month: 'long' })} To: {upcomingReviews[5].date.getDate()} {upcomingReviews[5].date.toLocaleDateString('en-US', { month: 'long' })}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              {upcomingReviews.map((day, i) => {
                const isEmpty = day.day4.length === 0 && day.day7.length === 0;
                return (
                  <div key={i} className="border-2 border-black p-3 flex flex-col min-h-[100px] page-break-inside-avoid">
                    <div className="font-bold text-sm uppercase border-b-2 border-black pb-2 mb-3 flex justify-between items-end">
                      <span className="!text-[#ea580c]">{i === 0 ? "TOMORROW" : day.date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      <span className="text-xs text-gray-500 font-bold">{day.date.getDate()} {day.date.toLocaleDateString('en-US', { month: 'short' })}</span>
                    </div>
                    
                    {isEmpty ? (
                      <div className="text-xs text-gray-400 uppercase tracking-widest text-center flex-1 flex items-center justify-center">[ CLEAR ]</div>
                    ) : (
                      <div className="space-y-4 flex-1">
                        {day.day4.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold !text-[#854d0e] !bg-[#fefce8] px-1 border !border-[#854d0e] uppercase inline-block mb-1">Day 4</span>
                            <div className="text-xs space-y-1.5 text-black">
                              {day.day4.map(t => {
                                const [name, rawDur] = t.includes(' | ') ? t.split(' | ') : [t, null];
                                const duration = formatDuration(rawDur);
                                return (
                                  <div key={t} className="leading-snug border-b border-gray-100 pb-1.5 mb-1.5 last:border-0 last:pb-0 last:mb-0">
                                    • {name} {duration && <span className="!text-[#ea580c] font-bold">[{duration}]</span>}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                        {day.day7.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold !text-[#166534] !bg-[#f0fdf4] px-1 border !border-[#166534] uppercase inline-block mb-1">Day 7</span>
                            <div className="text-xs space-y-1.5 text-black">
                              {day.day7.map(t => {
                                const [name, rawDur] = t.includes(' | ') ? t.split(' | ') : [t, null];
                                const duration = formatDuration(rawDur);
                                return (
                                  <div key={t} className="leading-snug border-b border-gray-100 pb-1.5 mb-1.5 last:border-0 last:pb-0 last:mb-0">
                                    • {name} {duration && <span className="!text-[#ea580c] font-bold">[{duration}]</span>}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-8 pt-6 border-t-4 border-black page-break-inside-avoid">
              <h2 className="text-lg font-bold uppercase mb-4 tracking-tighter">Timeline Overview</h2>
              <div className="grid grid-cols-6 gap-2">
                {upcomingReviews.map((day, idx) => {
                  let blockClass = "bg-white text-black border-2 border-black";
                  if (idx === 0) blockClass = "bg-blue-600 !text-white border-2 border-blue-800";
                  else if (idx === 3 || idx === 4) blockClass = "bg-[#32cd32] !text-white border-2 border-[#166534]";
                  else if (idx === 5) blockClass = "bg-[#dc2626] !text-white border-2 border-[#991b1b]";
                  return (
                    <div key={idx} className={`flex flex-col items-center justify-center p-2 ${blockClass}`}>
                      <span className="text-[10px] font-bold uppercase mb-0.5">{day.date.toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-2xl font-black leading-none my-0.5">{day.date.getDate()}</span>
                      <span className="text-[10px] font-bold uppercase mt-0.5">{day.date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. PLANNER PRINT LAYOUT (LANDSCAPE - ULTRA COMPACT TO FIT ONE PAGE) */}
        {activeTab === 'plan' && planDetails && (
          <div className="font-sans print:text-[10px] print:scale-[0.98] print:origin-top w-full">
            
            {/* The Top Black Dashboard Block */}
            <div className="!bg-black !text-white border-[3px] !border-black p-3 flex justify-between items-center mb-3">
              <div>
                <span className="!text-gray-400 text-[9px] font-bold uppercase block mb-0.5">Target_Deadline</span>
                <span className="text-xl font-bold !text-[#34d399]">{state.planDeadline}</span>
              </div>
              <div className="flex gap-8 mr-6">
                <div>
                  <span className="!text-gray-400 text-[9px] font-bold uppercase block mb-0.5">Days_Left</span>
                  <span className="text-xl font-bold !text-white">{planDetails.daysLeft}</span>
                </div>
                <div>
                  <span className="!text-gray-400 text-[9px] font-bold uppercase block mb-0.5">Items_Left</span>
                  <span className="text-xl font-bold !text-white">{planDetails.topicsLeft}</span>
                </div>
                <div>
                  <span className="!text-gray-400 text-[9px] font-bold uppercase block mb-0.5">Required_Pace</span>
                  <span className="text-xl font-bold !text-[#60a5fa]">{planDetails.topicsPerDay}/DAY</span>
                </div>
              </div>
            </div>

            {/* The 4-Column Grid (Aggressively compacted) */}
            <div className="grid grid-cols-4 gap-2 items-start w-full">
              {planDetails.forecast.map((dayPlan, idx) => (
                <div key={idx} className={`${dayPlan.isToday ? 'bg-white border-[2px] !border-black' : 'bg-transparent border-gray-300 border-[2px] border-dashed'} p-2 page-break-inside-avoid min-h-[200px]`}>
                  
                  <div className={`flex justify-between items-center pb-2 mb-2 ${dayPlan.isToday ? 'border-b-[2px] border-black' : 'border-b border-gray-300'}`}>
                    <span className={`font-bold text-[11px] uppercase tracking-tight flex items-center gap-1.5 ${dayPlan.isToday ? 'text-black' : 'text-gray-600'}`}>
                      {dayPlan.isToday ? <ListTodo size={12}/> : null} 
                      {dayPlan.isToday ? "TODAY" : dayPlan.isTomorrow ? "TOMORROW" : dayPlan.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  
                  {dayPlan.topics.length === 0 ? (
                    <div className="text-center text-gray-400 py-4 text-[9px] uppercase tracking-widest">[ Empty ]</div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {dayPlan.topics.map((t, tIdx) => {
                        const subject = getSubjectForTopic(t, currentSyllabus);
                        const [topicName, rawDur] = t.includes(' | ') ? t.split(' | ') : [t, null];
                        const duration = formatDuration(rawDur);
                        const isDone = !!completedTopics[t];
                        
                        if (dayPlan.isToday) {
                          return (
                            <div key={tIdx} className={`flex items-start gap-2 p-1.5 border ${isDone ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-200 border-l-[4px] border-l-black'}`}>
                              <div className="pt-[1px]">
                                {isDone ? <CheckCircle2 size={12} className="text-gray-400"/> : <Square size={12} className="text-black"/>}
                              </div>
                              <div className={`flex flex-col flex-1 leading-[1.1] font-bold ${isDone ? 'opacity-40 line-through' : 'text-black'}`}>
                                <span className="uppercase text-[8px] !text-[#ea580c] tracking-tight">[{subject}]</span>
                                <span className="mt-0.5 text-[10px]">{topicName}</span>
                                {duration && <span className="font-bold mt-0.5 text-[8px] !text-[#ea580c]">[{duration}]</span>}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={tIdx} className="p-1 leading-[1.1] font-bold flex flex-col border-l-[1.5px] border-gray-300 pl-2">
                            <span className="uppercase text-[8px] !text-[#ea580c] tracking-tight">[{subject}]</span>
                            <span className="block mt-0.5 text-[9px] text-gray-800">{topicName}</span>
                            {duration && <span className="font-bold block mt-0.5 text-[8px] !text-[#ea580c]">[{duration}]</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}