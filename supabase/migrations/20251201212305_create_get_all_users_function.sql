/*
  # Create get_all_users RPC Function

  1. Purpose
    - Provides a function to fetch all users with basic information
    - Used by Purchase Requests and other modules that need user lists

  2. Function Details
    - Returns user id, email, username, first_name, last_name
    - Accessible to authenticated users
*/

CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  username text,
  first_name text,
  last_name text
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, email, username, first_name, last_name
  FROM users
  WHERE is_active = true
  ORDER BY first_name, last_name;
$$;