'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button, Input } from "@/components/ui";
import { generateAnimalUsername } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Role {
  role_id: number;
  role_name: string;
  role_description: string;
}

export function UserProfileForm() {
  const [numberOfUsers, setNumberOfUsers] = useState<number>(1);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('role_id');
    
    if (data) {
      setRoles(data);
    }
  };

  useEffect(() => {
    const role = roles.find(r => r.role_id.toString() === selectedRole);
    setCurrentRole(role || null);
  }, [selectedRole, roles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const role = roles.find(r => r.role_id.toString() === selectedRole);
      if (!role) throw new Error('Please select a role');

      const users = Array.from({ length: numberOfUsers }, () => ({
        username: generateAnimalUsername(),
        persona: role.role_description
      }));

      const { data, error } = await supabase
        .from('agent_profiles')
        .insert(users)
        .select();

      if (error) throw error;

      toast.success(`Successfully created ${numberOfUsers} ${role.role_name}(s)!`);
      setNumberOfUsers(1);
      setSelectedRole('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user profiles');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto bg-card p-6 rounded-lg border">
      <div className="space-y-2">
        <label htmlFor="numberOfUsers" className="block text-sm font-medium">
          Number of Users to Create
        </label>
        <Input
          id="numberOfUsers"
          type="number"
          min="1"
          max="50"
          value={numberOfUsers}
          onChange={(e) => setNumberOfUsers(parseInt(e.target.value) || 1)}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="role" className="block text-sm font-medium">
          Select Role
        </label>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.role_id} value={role.role_id.toString()}>
                {role.role_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {currentRole && (
        <div className="bg-muted p-4 rounded-md space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{currentRole.role_name}</Badge>
            <span className="text-sm text-muted-foreground">Role Description:</span>
          </div>
          <p className="text-sm">{currentRole.role_description}</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading || !selectedRole}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Users...
          </>
        ) : (
          `Create ${numberOfUsers} User${numberOfUsers > 1 ? 's' : ''}`
        )}
      </Button>
    </form>
  );
} 