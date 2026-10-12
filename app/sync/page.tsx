"use client";

import React, { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '../store';
import LZString from 'lz-string';
import { Link as LinkIcon, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function SyncEngine() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const state = useStore();
  
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  
  // Is there a compressed URL string in the address bar?
  const incomingData = searchParams.get('data');

  const handleGenerateLink = () => {
    // 1. Grab everything we want to sync
    const dataToExport = {
      theme: state.theme,
      syllabusType: state.syllabusType,
      completedOfficial: state.completedOfficial, dailyOfficial: state.dailyOfficial, reviewsOfficial: state.reviewsOfficial,
      completedParth: state.completedParth, dailyParth: state.dailyParth, reviewsParth: state.reviewsParth,
      planTopics: state.planTopics, planDeadline: state.planDeadline
    };
    
    // 2. Compress and generate URL
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(dataToExport));
    const url = `${window.location.origin}/sync?data=${compressed}`;
    
    // 3. Copy to clipboard
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleApplySync = () => {
    if (!incomingData) return;
    try {
      // Decompress URL back into JSON
      const decompressed = LZString.decompressFromEncodedURIComponent(incomingData);
      if (decompressed) {
        const parsed = JSON.parse(decompressed);
        state.importData(parsed);
        setSyncStatus("SUCCESS");
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        setSyncStatus("INVALID_LINK");
      }
    } catch (err) {
      setSyncStatus("ERROR_PARSING");
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-black font-mono flex items-center justify-center p-4 selection:bg-black selection:text-white">
      <div className="w-full max-w-lg bg-white border-2 border-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase hover:underline mb-8 text-gray-500 hover:text-black transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        {incomingData ? (
          /* --- RECEIVING DEVICE UI --- */
          <div className="space-y-6">
            <div className="bg-amber-50 border-2 border-amber-500 p-4">
              <h2 className="text-amber-700 font-bold uppercase tracking-tight flex items-center gap-2 mb-2 text-sm">
                <AlertTriangle size={20} /> Incoming Sync Detected
              </h2>
              <p className="text-xs text-amber-900 leading-relaxed font-bold opacity-80">
                You opened a magic link. Proceeding will overwrite this device's current progress with the data contained in the URL.
              </p>
            </div>

            {syncStatus === 'SUCCESS' ? (
              <div className="bg-green-100 border-2 border-green-600 p-4 text-center">
                <p className="text-green-800 font-bold uppercase text-sm flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} /> Data Synced Successfully!
                </p>
                <p className="text-xs text-green-700 mt-2">Redirecting to dashboard...</p>
              </div>
            ) : syncStatus === 'INVALID_LINK' || syncStatus === 'ERROR_PARSING' ? (
              <div className="bg-red-50 border-2 border-red-500 p-4 text-center">
                <p className="text-red-700 font-bold uppercase text-sm">Corrupted Link</p>
                <p className="text-xs text-red-600 mt-1">The sync URL is broken or incomplete.</p>
              </div>
            ) : (
              <button onClick={handleApplySync} className="w-full bg-black text-white px-6 py-4 text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors flex justify-center items-center gap-2">
                <CheckCircle2 size={18} /> Confirm & Apply Sync
              </button>
            )}
          </div>
        ) : (
          /* --- SENDING DEVICE UI --- */
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tighter mb-2">Magic_Link_Sync</h1>
              <p className="text-gray-500 text-xs leading-relaxed">
                Compress your entire progress into a single URL. Copy the link below and open it on your second device (laptop, tablet, or phone) to instantly sync your data. No servers, no accounts.
              </p>
            </div>

            <div className="bg-gray-50 border-2 border-black p-4 mt-6">
              <button 
                onClick={handleGenerateLink} 
                className={`w-full px-6 py-4 text-sm font-bold uppercase tracking-widest transition-colors flex justify-center items-center gap-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none ${copied ? 'bg-green-500 text-white border-green-500' : 'bg-white text-black'}`}
              >
                {copied ? <CheckCircle2 size={18} /> : <LinkIcon size={18} />}
                {copied ? "Link Copied to Clipboard!" : "Generate & Copy Sync Link"}
              </button>
            </div>
            
            <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest mt-4">
              Paste the link in WhatsApp, Email, or iMessage.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrap in Suspense because we are using useSearchParams()
export default function SyncPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-mono font-bold text-xs uppercase">Loading Sync Engine...</div>}>
      <SyncEngine />
    </Suspense>
  );
}