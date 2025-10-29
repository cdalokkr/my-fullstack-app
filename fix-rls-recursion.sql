-- Fix infinite recursion in RLS policies
-- Run this in your Supabase SQL Editor

-- Drop the problematic recursive admin policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Create non-recursive admin policies using a custom function
-- This function checks admin status without causing recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Now create policies that use the function
-- The function runs with SECURITY DEFINER which bypasses RLS
CREATE POLICY "Admins can view all profiles v2"
ON profiles FOR SELECT
TO public
USING (
  auth.uid() = id  -- Users can view their own profile
  OR 
  is_admin()  -- Or if they're an admin (checked via function)
);

CREATE POLICY "Admins can update all profiles v2"
ON profiles FOR UPDATE
TO public
USING (
  auth.uid() = id  -- Users can update their own profile
  OR 
  is_admin()  -- Or if they're an admin (checked via function)
);

CREATE POLICY "Admins can delete profiles v2"
ON profiles FOR DELETE
TO public
USING (
  is_admin()  -- Only admins can delete profiles
);

-- Verify policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;