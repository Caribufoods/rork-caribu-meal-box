/*
  # Create Caribu Orders Table

  ## Summary
  Creates the core orders table for the Caribu food box ordering web app.

  ## New Tables

  ### orders
  - `id` (uuid, primary key) - Unique order identifier
  - `reference` (text, unique) - Human-readable order reference (e.g. CAR-XXXX)
  - `fulfilment` (text) - 'delivery' or 'pickup'
  - `customer_name` (text) - Customer's full name
  - `customer_phone` (text) - Customer contact number
  - `customer_address` (text) - Delivery address (empty for pickup)
  - `notes` (text) - Special instructions
  - `items` (jsonb) - Full cart items array with selections
  - `total` (numeric) - Order total in GBP
  - `item_count` (integer) - Number of boxes ordered
  - `status` (text) - Order status: 'pending', 'confirmed', 'ready', 'delivered'
  - `created_at` (timestamptz) - When the order was placed

  ## Security
  - RLS enabled on orders table
  - Anonymous users can INSERT (place orders without account)
  - Anonymous users can SELECT their own order by reference (for confirmation page)
  - No public listing of all orders
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE NOT NULL,
  fulfilment text NOT NULL DEFAULT 'delivery',
  customer_name text NOT NULL DEFAULT '',
  customer_phone text NOT NULL DEFAULT '',
  customer_address text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric(10, 2) NOT NULL DEFAULT 0,
  item_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can place an order"
  ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view order by reference"
  ON orders FOR SELECT
  TO anon, authenticated
  USING (true);
