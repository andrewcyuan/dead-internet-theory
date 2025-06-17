import { Suspense } from 'react';
import { UserProfileForm } from '@/components/UserProfileForm';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/lib/supabase';

async function UserProfilesList() {
  const { data: profiles, error } = await supabase
    .from('agent_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return <div className="text-red-500">Error loading profiles: {error.message}</div>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Existing Profiles</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {profiles?.map((profile: UserProfile) => (
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
  );
}

export default function DashboardPage() {
  return (
    <div className="container py-8 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-8">User Profiles Dashboard</h1>
      
      <div className="max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create New Profile</h2>
        <UserProfileForm />
      </div>

      <Suspense fallback={<div>Loading profiles...</div>}>
        <UserProfilesList />
      </Suspense>
    </div>
  );
} 