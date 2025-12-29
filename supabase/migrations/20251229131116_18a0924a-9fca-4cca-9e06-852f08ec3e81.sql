-- Drop the insecure INSERT policy
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Create a new INSERT policy that requires authentication
CREATE POLICY "Authenticated users can create orders" 
ON public.orders 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Add a SELECT policy so customers can view their own orders by email
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));