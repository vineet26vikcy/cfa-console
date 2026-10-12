import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useStore } from './store';
import { Session } from '@supabase/supabase-js';

export function useCloudSync() {
  const [session, setSession] = useState<Session | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>('Checking status...');
  const [isSyncing, setIsSyncing] = useState(false);
  const state = useStore();

  // Listen for login/logout and fetch current session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) pullData(session.user.id);
      else setSyncStatus('Signed out.');
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) pullData(session.user.id);
      else setSyncStatus('Signed out.');
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // Pull data from Supabase
  const pullData = async (userId: string) => {
    setIsSyncing(true);
    setSyncStatus('Fetching cloud data...');
    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // Ignore "No rows found"
      
      if (data && data.data) {
         state.importData(data.data);
         setSyncStatus('In sync with cloud.');
      } else {
         setSyncStatus('No cloud backup found. Ready to push.');
      }
    } catch (error: any) {
      console.error(error);
      setSyncStatus('Error fetching data.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Push data to Supabase
  const pushData = async () => {
    if (!session) return;
    setIsSyncing(true);
    setSyncStatus('Saving to cloud...');
    
    const dataToExport = {
      theme: state.theme, syllabusType: state.syllabusType,
      completedOfficial: state.completedOfficial, dailyOfficial: state.dailyOfficial, reviewsOfficial: state.reviewsOfficial,
      completedParth: state.completedParth, dailyParth: state.dailyParth, reviewsParth: state.reviewsParth,
      planTopics: state.planTopics, planDeadline: state.planDeadline
    };

    try {
      const { error } = await supabase
        .from('user_data')
        .upsert({ user_id: session.user.id, data: dataToExport, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      
      if (error) throw error;
      setSyncStatus('Cloud save successful.');
      setTimeout(() => setSyncStatus('In sync with cloud.'), 2500);
    } catch (error) {
      console.error(error);
      setSyncStatus('Error saving data.');
    } finally {
      setIsSyncing(false);
    }
  };

  return { session, login, logout, pushData, pullData, isSyncing, syncStatus };
}