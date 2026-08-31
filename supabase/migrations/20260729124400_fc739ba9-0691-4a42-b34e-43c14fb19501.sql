DROP POLICY IF EXISTS "No one can delete orders" ON public.orders;

CREATE POLICY "Users delete own pending orders"
ON public.orders
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending');