import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// User approval status type
export type UserApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  user_id: string;
  email: string;
  username: string;
  approval_status: UserApprovalStatus;
  created_at: string;
  approved_at?: string;
  approved_by?: string;
}

// Create a new user with email verification
export async function registerUser(email: string, password: string, username: string) {
  try {
    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { username },
      // User must verify their email
      email_confirm: false,
    });

    if (authError) {
      console.error('Registration error during user creation:', authError);
      return { error: authError.message };
    }

    if (!authData.user) {
      console.error('Registration error: No user data returned');
      return { error: 'Failed to create user' };
    }

    // Store user profile with pending approval status
    const userProfile: UserProfile = {
      user_id: authData.user.id,
      email,
      username,
      approval_status: 'pending',
      created_at: new Date().toISOString(),
    };

    await kv.set(`user_profile:${authData.user.id}`, userProfile);

    console.log(`User registered: ${email}, status: pending approval`);
    return { data: { user: authData.user, profile: userProfile } };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error during registration' };
  }
}

// Check if user is approved
export async function checkUserApproval(userId: string): Promise<{ approved: boolean; status: UserApprovalStatus; emailVerified: boolean }> {
  try {
    // Get user from Supabase Auth to check email verification
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError || !authData.user) {
      console.error('Error checking user approval - auth lookup failed:', authError);
      return { approved: false, status: 'pending', emailVerified: false };
    }

    const emailVerified = authData.user.email_confirmed_at !== null;

    // Get user profile from KV store
    const profile = await kv.get<UserProfile>(`user_profile:${userId}`);
    
    if (!profile) {
      console.error(`User profile not found for user_id: ${userId}`);
      return { approved: false, status: 'pending', emailVerified };
    }

    const approved = profile.approval_status === 'approved' && emailVerified;
    
    return { 
      approved, 
      status: profile.approval_status,
      emailVerified 
    };
  } catch (error) {
    console.error('Error checking user approval:', error);
    return { approved: false, status: 'pending', emailVerified: false };
  }
}

// Approve a user (admin function)
export async function approveUser(userId: string, adminUserId: string) {
  try {
    const profile = await kv.get<UserProfile>(`user_profile:${userId}`);
    
    if (!profile) {
      console.error(`Cannot approve user: Profile not found for user_id: ${userId}`);
      return { error: 'User profile not found' };
    }

    const updatedProfile: UserProfile = {
      ...profile,
      approval_status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: adminUserId,
    };

    await kv.set(`user_profile:${userId}`, updatedProfile);

    console.log(`User approved: ${profile.email} by admin: ${adminUserId}`);
    return { data: updatedProfile };
  } catch (error) {
    console.error('Error approving user:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error during approval' };
  }
}

// Get all pending users (admin function)
export async function getPendingUsers() {
  try {
    const allProfiles = await kv.getByPrefix<UserProfile>('user_profile:');
    const pendingUsers = allProfiles.filter(profile => profile.approval_status === 'pending');
    
    console.log(`Retrieved ${pendingUsers.length} pending users`);
    return { data: pendingUsers };
  } catch (error) {
    console.error('Error getting pending users:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error getting pending users' };
  }
}

// Resend verification email
export async function resendVerificationEmail(email: string) {
  try {
    // Supabase will automatically send verification email when user tries to sign in
    // or we can use the resend endpoint
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      console.error('Error resending verification email:', error);
      return { error: error.message };
    }

    console.log(`Verification email resent to: ${email}`);
    return { data: { message: 'Verification email sent' } };
  } catch (error) {
    console.error('Error resending verification email:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error resending verification email' };
  }
}
