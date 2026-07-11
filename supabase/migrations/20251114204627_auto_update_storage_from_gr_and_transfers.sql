/*
  # Auto-Update Storage from GR and Transfers

  1. Triggers for Goods Receipt
    - When goods_receipt_items is inserted → create storage_batches
    - Store received items in storage automatically
    - Link to branch from goods_receipts table

  2. Triggers for Stock Transfers
    - When stock_transfer_items is inserted → move storage between branches
    - Deduct from source storage_batch
    - Create new storage_batch at destination

  3. Function to Return from Shelf to Storage
    - Manual function to move items back from shelf to storage
    - Increases storage qty, decreases shelf qty

  4. Validation
    - Prevent moving more than available in storage
    - Prevent moving more than available on shelf
    - All operations are atomic

  5. Notes
    - All triggers update storage_batches.last_movement_at
    - Track movements for audit purposes
*/

-- ============================================
-- 1. GOODS RECEIPT → STORAGE
-- ============================================

-- Function to create storage batch when goods are received
CREATE OR REPLACE FUNCTION create_storage_from_gr_item()
RETURNS trigger AS $$
DECLARE
  v_branch_name text;
  v_location text;
BEGIN
  -- Get branch name from goods_receipts table
  SELECT b.branch_name INTO v_branch_name
  FROM goods_receipts gr
  JOIN branches b ON b.id = gr.branch_id
  WHERE gr.id = NEW.gr_id;
  
  -- Use location from GR item or default to 'Main Storage'
  v_location := COALESCE(NEW.location, 'Main Storage');
  
  -- Create storage batch
  INSERT INTO storage_batches (
    branch_name,
    location_name,
    item_id,
    batch_number,
    qty_on_hand,
    expiry_date,
    notes,
    last_movement_at
  ) VALUES (
    v_branch_name,
    v_location,
    NEW.item_id,
    NEW.batch_number,
    NEW.quantity,
    NEW.expiry_date,
    NEW.notes,
    now()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on goods_receipt_items
DROP TRIGGER IF EXISTS trigger_create_storage_from_gr ON goods_receipt_items;

CREATE TRIGGER trigger_create_storage_from_gr
  AFTER INSERT ON goods_receipt_items
  FOR EACH ROW
  EXECUTE FUNCTION create_storage_from_gr_item();

COMMENT ON FUNCTION create_storage_from_gr_item IS 'Automatically creates storage_batches when goods are received';

-- ============================================
-- 2. STOCK TRANSFERS → STORAGE
-- ============================================

-- First, check if stock_transfer_items has the needed columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_transfer_items' AND column_name = 'storage_batch_id'
  ) THEN
    ALTER TABLE stock_transfer_items ADD COLUMN storage_batch_id uuid REFERENCES storage_batches(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_transfer_items' AND column_name = 'item_id'
  ) THEN
    ALTER TABLE stock_transfer_items ADD COLUMN item_id uuid REFERENCES items(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_transfer_items' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE stock_transfer_items ADD COLUMN quantity decimal(10,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Function to process stock transfer between branches
CREATE OR REPLACE FUNCTION process_stock_transfer_item()
RETURNS trigger AS $$
DECLARE
  v_from_branch text;
  v_to_branch text;
  v_to_location text;
  v_batch_number text;
  v_expiry_date date;
  v_source_batch_qty decimal;
BEGIN
  -- Get transfer details
  SELECT 
    fb.branch_name,
    tb.branch_name,
    st.to_location
  INTO v_from_branch, v_to_branch, v_to_location
  FROM stock_transfers st
  LEFT JOIN branches fb ON fb.id = st.from_branch_id
  LEFT JOIN branches tb ON tb.id = st.to_branch_id
  WHERE st.id = NEW.transfer_id;
  
  -- If storage_batch_id is provided, use that batch
  IF NEW.storage_batch_id IS NOT NULL THEN
    -- Get batch details
    SELECT batch_number, expiry_date, qty_on_hand
    INTO v_batch_number, v_expiry_date, v_source_batch_qty
    FROM storage_batches
    WHERE id = NEW.storage_batch_id;
    
    -- Validate sufficient quantity
    IF v_source_batch_qty < NEW.quantity THEN
      RAISE EXCEPTION 'Insufficient quantity in storage batch. Available: %, Requested: %', v_source_batch_qty, NEW.quantity;
    END IF;
    
    -- Deduct from source storage batch
    UPDATE storage_batches
    SET 
      qty_on_hand = qty_on_hand - NEW.quantity,
      last_movement_at = now(),
      updated_at = now()
    WHERE id = NEW.storage_batch_id;
    
    -- Create new storage batch at destination
    INSERT INTO storage_batches (
      branch_name,
      location_name,
      item_id,
      batch_number,
      qty_on_hand,
      expiry_date,
      notes,
      last_movement_at
    ) VALUES (
      v_to_branch,
      COALESCE(v_to_location, 'Main Storage'),
      NEW.item_id,
      v_batch_number,
      NEW.quantity,
      v_expiry_date,
      'Transferred from ' || v_from_branch,
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on stock_transfer_items
DROP TRIGGER IF EXISTS trigger_process_stock_transfer ON stock_transfer_items;

CREATE TRIGGER trigger_process_stock_transfer
  AFTER INSERT ON stock_transfer_items
  FOR EACH ROW
  EXECUTE FUNCTION process_stock_transfer_item();

COMMENT ON FUNCTION process_stock_transfer_item IS 'Moves inventory between branches in storage_batches';

-- ============================================
-- 3. RETURN FROM SHELF TO STORAGE
-- ============================================

-- Function to return items from shelf back to storage
CREATE OR REPLACE FUNCTION return_shelf_to_storage(
  p_shelf_item_id uuid,
  p_storage_location text,
  p_return_qty decimal
)
RETURNS jsonb AS $$
DECLARE
  v_shelf_qty decimal;
  v_item_id uuid;
  v_branch_name text;
  v_batch_number text;
BEGIN
  -- Validate shelf has enough quantity
  SELECT si.current_qty, si.item_id, s.branch_name
  INTO v_shelf_qty, v_item_id, v_branch_name
  FROM shelf_items si
  JOIN shelves s ON s.id = si.shelf_id
  WHERE si.id = p_shelf_item_id;
  
  IF v_shelf_qty IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shelf item not found');
  END IF;
  
  IF v_shelf_qty < p_return_qty THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient quantity on shelf');
  END IF;
  
  -- Generate a return batch number
  v_batch_number := 'RTN-' || to_char(now(), 'YYYYMMDD-HH24MISS');
  
  -- Deduct from shelf
  UPDATE shelf_items
  SET 
    current_qty = current_qty - p_return_qty,
    updated_at = now()
  WHERE id = p_shelf_item_id;
  
  -- Add to storage
  INSERT INTO storage_batches (
    branch_name,
    location_name,
    item_id,
    batch_number,
    qty_on_hand,
    notes,
    last_movement_at
  ) VALUES (
    v_branch_name,
    COALESCE(p_storage_location, 'Returns Storage'),
    v_item_id,
    v_batch_number,
    p_return_qty,
    'Returned from shelf',
    now()
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Items returned to storage successfully');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION return_shelf_to_storage IS 'Returns items from shelf back to storage with validation';

-- ============================================
-- 4. UPDATE move_storage_to_shelf WITH VALIDATION
-- ============================================

-- Update the existing function to add better validation
CREATE OR REPLACE FUNCTION move_storage_to_shelf(
  p_storage_batch_id uuid,
  p_shelf_item_id uuid,
  p_qty decimal
)
RETURNS jsonb AS $$
DECLARE
  v_storage_qty decimal;
  v_item_id uuid;
  v_branch_name text;
  v_shelf_max decimal;
  v_shelf_current decimal;
BEGIN
  -- Validate storage batch has enough quantity
  SELECT qty_on_hand, item_id, branch_name
  INTO v_storage_qty, v_item_id, v_branch_name
  FROM storage_batches
  WHERE id = p_storage_batch_id;
  
  IF v_storage_qty IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Storage batch not found');
  END IF;
  
  IF v_storage_qty < p_qty THEN
    RETURN jsonb_build_object('success', false, 'error', format('Insufficient quantity in storage. Available: %s, Requested: %s', v_storage_qty, p_qty));
  END IF;
  
  -- Validate shelf capacity
  SELECT max_capacity, current_qty
  INTO v_shelf_max, v_shelf_current
  FROM shelf_items
  WHERE id = p_shelf_item_id;
  
  IF v_shelf_max IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shelf item not found');
  END IF;
  
  IF (v_shelf_current + p_qty) > v_shelf_max THEN
    RETURN jsonb_build_object('success', false, 'error', format('Exceeds shelf capacity. Max: %s, Current: %s, Adding: %s', v_shelf_max, v_shelf_current, p_qty));
  END IF;
  
  -- Update storage batch
  UPDATE storage_batches
  SET 
    qty_on_hand = qty_on_hand - p_qty,
    last_movement_at = now(),
    updated_at = now()
  WHERE id = p_storage_batch_id;
  
  -- Update shelf item
  UPDATE shelf_items
  SET 
    current_qty = current_qty + p_qty,
    last_count_date = now(),
    updated_at = now()
  WHERE id = p_shelf_item_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'Stock moved successfully');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION move_storage_to_shelf IS 'Moves stock from storage to shelf with full validation';
