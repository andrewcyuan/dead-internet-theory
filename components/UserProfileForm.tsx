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
  const [mode, setMode] = useState<'multi' | 'random'>('multi');
  const [numberOfUsers, setNumberOfUsers] = useState<number>(1);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [randomDistribution, setRandomDistribution] = useState<{[key: string]: number}>({});
  const [totalRandomAgents, setTotalRandomAgents] = useState<number>(1);

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
      // Initialize random distribution with 0 for each role
      const initialDistribution = data.reduce((acc, role) => {
        acc[role.role_id] = 0;
        return acc;
      }, {} as {[key: string]: number});
      setRandomDistribution(initialDistribution);
    }
  };

  useEffect(() => {
    const role = roles.find(r => r.role_id.toString() === selectedRole);
    setCurrentRole(role || null);
  }, [selectedRole, roles]);

  const generateRandomDistribution = (total: number, availableRoles: Role[]): {[key: string]: number} => {
    const distribution: {[key: string]: number} = {};
    let remaining = total;
    
    // Initialize all roles with 0
    availableRoles.forEach(role => {
      distribution[role.role_id] = 0;
    });
    
    // Randomly distribute agents
    while (remaining > 0) {
      const randomRoleIndex = Math.floor(Math.random() * availableRoles.length);
      const roleId = availableRoles[randomRoleIndex].role_id;
      distribution[roleId]++;
      remaining--;
    }
    
    return distribution;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'multi') {
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
      } else if (mode === 'random') {
        // Multi-role mode with specified distribution
        const totalAgents = Object.values(randomDistribution).reduce((a, b) => a + b, 0);
        if (totalAgents === 0) throw new Error('Please specify at least one agent to generate');

        const usersToCreate = [];
        for (const roleId in randomDistribution) {
          const count = randomDistribution[roleId];
          if (count > 0) {
            const role = roles.find(r => r.role_id.toString() === roleId);
            if (role) {
              for (let i = 0; i < count; i++) {
                usersToCreate.push({
                  username: generateAnimalUsername(),
                  persona: role.role_description
                });
              }
            }
          }
        }

        const { data, error } = await supabase
          .from('agent_profiles')
          .insert(usersToCreate)
          .select();

        if (error) throw error;

        toast.success(`Successfully created ${totalAgents} agents with specified role distribution!`);
        // Reset the distribution
        const resetDistribution = Object.keys(randomDistribution).reduce((acc, key) => {
          acc[key] = 0;
          return acc;
        }, {} as {[key: string]: number});
        setRandomDistribution(resetDistribution);
      } else {
        // Random distribution mode
        if (totalRandomAgents < 1) throw new Error('Please specify at least one agent to generate');
        
        const distribution = generateRandomDistribution(totalRandomAgents, roles);
        const usersToCreate = [];
        
        for (const roleId in distribution) {
          const count = distribution[roleId];
          if (count > 0) {
            const role = roles.find(r => r.role_id.toString() === roleId);
            if (role) {
              for (let i = 0; i < count; i++) {
                usersToCreate.push({
                  username: generateAnimalUsername(),
                  persona: role.role_description
                });
              }
            }
          }
        }

        const { data, error } = await supabase
          .from('agent_profiles')
          .insert(usersToCreate)
          .select();

        if (error) throw error;

        const distributionSummary = Object.entries(distribution)
          .map(([roleId, count]) => {
            const role = roles.find(r => r.role_id.toString() === roleId);
            return `${role?.role_name}: ${count}`;
          })
          .join(', ');

        toast.success(`Successfully created ${totalRandomAgents} agents with random distribution! (${distributionSummary})`);
        setTotalRandomAgents(1);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user profiles');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-5xl mx-auto bg-card p-6 rounded-lg border">
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Generation Mode
        </label>
        <Select value={mode} onValueChange={(value: 'multi' | 'random') => setMode(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Choose generation mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="multi">Multi-Role - Specify Distribution</SelectItem>
            <SelectItem value="random">Random - Auto Distribution</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {mode === 'multi' && (
        <div className="grid gap-4">
            <div className="text-sm font-medium mb-2 col-span-full">
            Specify number of agents per role:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 col-span-full">
            {roles.map((role) => (
                <div key={role.role_id} className="flex flex-col gap-2 p-3 rounded-md bg-muted h-full">
                <div className="flex flex-col gap-1 flex-1">
                    <Badge variant="secondary">{role.role_name}</Badge>
                    <p className="text-xs text-muted-foreground">{role.role_description}</p>
                </div>
                <Input
                    type="number"
                    min="0"
                    max="50"
                    value={randomDistribution[role.role_id] || 0}
                    onChange={(e) => setRandomDistribution(prev => ({
                    ...prev,
                    [role.role_id]: parseInt(e.target.value) || 0
                    }))}
                    className="w-full mt-auto"
                />
                </div>
            ))}
            </div>
            <div className="text-sm text-muted-foreground text-right col-span-full">
            Total agents to generate: {Object.values(randomDistribution).reduce((a, b) => a + b, 0)}
            </div>
        </div>
        )}


      {mode === 'random' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="totalRandomAgents" className="block text-sm font-medium">
              Total Number of Agents to Generate
            </label>
            <Input
              id="totalRandomAgents"
              type="number"
              min="1"
              max="100"
              value={totalRandomAgents}
              onChange={(e) => setTotalRandomAgents(parseInt(e.target.value) || 1)}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Roles will be randomly assigned to the specified number of agents
            </p>
          </div>
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full" 
        disabled={
          isLoading || 
          (mode === 'multi' && Object.values(randomDistribution).reduce((a, b) => a + b, 0) === 0) ||
          (mode === 'random' && totalRandomAgents < 1)
        }
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Agents...
          </>
        ) : mode === 'multi' ? (
          'Generate Multi-Role Distribution'
        ) : (
          'Generate Random Distribution'
        )}
      </Button>
    </form>
  );} 
