import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface UserRole {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'salesman';
  created_at: string;
}

export const useUserRole = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      // Early return if user is null
      if (!user) {
        console.log('No user found, skipping role fetch');
        setLoading(false);
        return;
      }

      // Check if Supabase client is available
      if (!supabase) {
        console.error('Supabase client is not available - environment variables are missing');
        console.log('Setting default role as salesman for demo purposes');
        setUserRole({
          id: 'demo-role',
          user_id: user.id,
          email: user.email || '',
          role: user.email === 'ilia@envaire.com' || user.email === 'javier@envaire.com' ? 'admin' : 'salesman',
          created_at: new Date().toISOString()
        });
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching user role for:', user.email);
        console.log('User ID:', user.id);
        console.log('User email confirmed:', user.email_confirmed_at);
        
        // First, try to get existing role
        let { data, error } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        console.log('Existing role data:', data, 'Error:', error);

        if (data) {
          // Role exists, use it
          console.log('Found existing role:', data.role);
          setUserRole(data);
        } else if (error?.code === 'PGRST116') {
          // No role exists, try to create one
          const role = user.email === 'ilia@envaire.com' || user.email === 'javier@envaire.com' 
            ? 'admin' 
            : 'salesman';

          console.log('Creating new role:', role, 'for user:', user.email);

          const { data: newRole, error: insertError } = await supabase
            .from('user_roles')
            .insert([{
              user_id: user.id,
              email: user.email || '',
              role: role
            }])
            .select()
            .single();

          console.log('New role created:', newRole, 'Error:', insertError);

          if (insertError) {
            // If insert failed due to duplicate, try to fetch again
            if (insertError.code === '23505') {
              console.log('Duplicate role detected, fetching existing...');
              const { data: existingRole } = await supabase
                .from('user_roles')
                .select('*')
                .eq('user_id', user.id)
                .single();
              
              if (existingRole) {
                console.log('Found existing role after duplicate:', existingRole.role);
                setUserRole(existingRole);
              } else {
                console.log('Setting fallback role due to duplicate error');
                setUserRole({
                  id: 'fallback-role',
                  user_id: user.id,
                  email: user.email || '',
                  role: user.email === 'ilia@envaire.com' || user.email === 'javier@envaire.com' ? 'admin' : 'salesman',
                  created_at: new Date().toISOString()
                });
              }
            } else {
              console.error('Insert error:', insertError);
              // Set fallback role instead of throwing
              setUserRole({
                id: 'fallback-role',
                user_id: user.id,
                email: user.email || '',
                role: user.email === 'ilia@envaire.com' || user.email === 'javier@envaire.com' ? 'admin' : 'salesman',
                created_at: new Date().toISOString()
              });
            }
          } else {
            console.log('Successfully created new role:', newRole.role);
            setUserRole(newRole);
          }
        } else {
          console.error('Database error:', error);
          // Set fallback role instead of throwing
          setUserRole({
            id: 'fallback-role',
            user_id: user.id,
            email: user.email || '',
            role: user.email === 'ilia@envaire.com' || user.email === 'javier@envaire.com' ? 'admin' : 'salesman',
            created_at: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Network/Connection error:', error);
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          console.error('Cannot connect to database. Please check your internet connection or contact support.');
        } else {
          console.error('Error fetching user role: ' + (error as Error).message);
        }
        console.log('Setting default role as salesman for demo purposes');
        // Set a default role for demo purposes
        setUserRole({
          id: 'demo-role',
          user_id: user.id,
          email: user.email || '',
          role: user.email === 'ilia@envaire.com' || user.email === 'javier@envaire.com' ? 'admin' : 'salesman',
          created_at: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const isAdmin = userRole?.role === 'admin';
  const isSalesman = userRole?.role === 'salesman';

  return {
    userRole,
    isAdmin,
    isSalesman,
    loading,
  };
};