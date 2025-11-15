-- Add a unique constraint to stripe_payment_intent_id
ALTER TABLE bookings
ADD CONSTRAINT unique_stripe_payment_intent_id UNIQUE (stripe_payment_intent_id);

-- Add an index to stripe_payment_intent_id for faster lookups
CREATE INDEX idx_stripe_payment_intent_id ON bookings (stripe_payment_intent_id);
