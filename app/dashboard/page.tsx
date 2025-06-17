'use client';

import { Suspense, useEffect, useState } from 'react';
import { UserProfileForm } from '@/components/UserProfileForm';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/lib/supabase';
import { StartButton } from '@/components/StartButton';

function UserProfilesList() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfiles() {
      try {
        const { data, error } = await supabase
          .from('agent_profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setProfiles(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProfiles();
  }, []);

  if (loading) {
    return <div>Loading profiles...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading profiles: {error}</div>;
  }

  return (
    <div className="flex flex-row gap-4">
      <div>
        <h2 className="text-xl font-semibold mb-4">Existing Profiles</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile: UserProfile) => (
            <div key={profile.id} className="p-4 rounded-lg border bg-card">
              <div className="font-medium">{profile.username}</div>
              <div className="text-sm text-muted-foreground mt-1">
                Created: {new Date(profile.created_at).toLocaleDateString()}
              </div>
              {profile.persona && (
                <div className="mt-2 text-sm">{profile.persona}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="py-8 px-4 md:px-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-8 text-center">User Profiles Dashboard</h1>

        <UserProfileForm />
        <UserProfilesList />
    </div>
  );
} 