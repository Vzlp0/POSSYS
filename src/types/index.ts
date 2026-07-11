export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'cashier' | 'staff';
  department?: string;
  phone?: string;
  isActive: boolean;
  isPending: boolean;
  createdAt: string;
  lastLogin?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface Item {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  price: number;
  cost: number;
  markupPercentage?: number;
  lastPriceUpdate?: string;
  isExpiryTracked: boolean;
  showInPOS: boolean;
  availableForOnlineOrder?: boolean;
  suppliers?: ItemSupplier[];
  createdAt: string;
  updatedAt: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  totalCost: number;
  notes: string;
  showInPOS: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeIngredient {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  quantity: number;
  unit: string;
  unitCost: number;
  lineCost: number;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: SignupData) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export interface SignupData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  department?: string;
  password: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  roles: string[];
}

export interface StockLocation {
  id: string;
  name: string;
  type: 'warehouse' | 'store' | 'display' | 'storage';
  description?: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  movementType: 'in' | 'out' | 'transfer';
  quantity: number;
  unit: string;
  fromLocationId?: string;
  fromLocationName?: string;
  toLocationId?: string;
  toLocationName?: string;
  reason: string;
  performedBy: string;
  performedAt: string;
  referenceNumber?: string;
}

export interface InternalTransfer {
  id: string;
  transferId: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  quantity: number;
  unit: string;
  fromLocation: 'Stock Room' | 'Shelves';
  toLocation: 'Stock Room' | 'Shelves';
  reason?: string;
  transferredBy: string;
  transferredAt: string;
  store: string;
}

export interface InterBranchTransfer {
  id: string;
  transferRequestId: string;
  sourceStore: string;
  destinationStore: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  quantity: number;
  unit: string;
  status: 'Pending' | 'Approved' | 'Delivery Issued' | 'In Transit' | 'Delivered' | 'GR Completed' | 'Rejected';
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  deliveryIssuedBy?: string;
  deliveryIssuedAt?: string;
  deliveryNote?: string;
  deliveredAt?: string;
  grCompletedBy?: string;
  grCompletedAt?: string;
  grNumber?: string;
  notes?: string;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  timestamp: string;
  cashierId: string;
  cashierName: string;
  items: TransactionItem[];
  subtotal: number;
  tax: number;
  total: number;
  payments: Payment[];
  status: 'completed' | 'voided' | 'returned' | 'exchanged';
  voidedBy?: string;
  voidedAt?: string;
  voidReason?: string;
}

export interface TransactionItem {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  returnedQuantity?: number;
  exchangedQuantity?: number;
}

export interface Payment {
  id?: string;
  method: 'cash' | 'card' | 'membership' | 'voucher';
  amount: number;
  timestamp?: string;
  isVoided?: boolean;
}

export interface HeldOrder {
  id: string;
  hold_number: string;
  cashier_id: string;
  cashier_name: string;
  customer_name?: string;
  customer_phone?: string;
  customer_notes?: string;
  cart_items: any[];
  subtotal: number;
  discount_type: 'none' | 'percent' | 'amount';
  discount_value: number;
  total: number;
  collect_method: 'pickup' | 'delivery';
  order_notes?: string;
  status: 'active' | 'resumed' | 'cancelled' | 'expired';
  held_at: string;
  resumed_at?: string;
  resumed_by?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateHeldOrderData {
  cashier_id: string;
  cashier_name: string;
  customer_name?: string;
  customer_phone?: string;
  customer_notes?: string;
  cart_items: any[];
  subtotal: number;
  discount_type: 'none' | 'percent' | 'amount';
  discount_value: number;
  total: number;
  collect_method: 'pickup' | 'delivery';
  order_notes?: string;
}

export interface Client {
  id: string;
  client_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  notes?: string;
  total_visits: number;
  total_spent: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface LoyaltyCard {
  id: string;
  card_number: string;
  client_id: string;
  program_type: string;
  stamps_required: number;
  current_stamps: number;
  completed_cards: number;
  last_stamp_at?: string;
  status: 'active' | 'completed' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  loyalty_card_id: string;
  client_id: string;
  transaction_id?: string;
  transaction_type: 'stamp_earned' | 'reward_redeemed';
  stamps_added: number;
  item_name: string;
  transaction_date: string;
  cashier_name: string;
  notes?: string;
  created_at: string;
}

export interface ClientOrder {
  id: string;
  client_id: string;
  order_number: string;
  order_date: string;
  items: any[];
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  cashier_name: string;
  loyalty_stamps_earned: number;
  notes?: string;
  created_at: string;
}

export interface LoyaltySettings {
  id: string;
  points_enabled: boolean;
  points_per_sar: number;
  points_redemption_value: number;
  min_points_redemption: number;
  cashback_enabled: boolean;
  cashback_percentage: number;
  tiers_enabled: boolean;
  subscription_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface MembershipTier {
  id: string;
  tier_name: string;
  tier_level: number;
  min_spending: number;
  discount_percentage: number;
  points_multiplier: number;
  benefits: any;
  tier_color: string;
  is_active: boolean;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  plan_name: string;
  duration_type: 'monthly' | 'yearly';
  price: number;
  benefits: any;
  is_active: boolean;
  created_at: string;
}

export interface ClientLoyalty {
  id: string;
  client_id: string;
  loyalty_type: 'points' | 'cashback' | 'tier' | 'subscription' | 'all';
  points_balance: number;
  points_earned_total: number;
  points_redeemed_total: number;
  cashback_balance: number;
  cashback_earned_total: number;
  cashback_used_total: number;
  tier_id?: string;
  tier_since?: string;
  subscription_plan_id?: string;
  subscription_start?: string;
  subscription_end?: string;
  subscription_status?: 'active' | 'expired' | 'cancelled';
  subscription_usage: any;
  created_at: string;
  updated_at: string;
  tier?: MembershipTier;
  subscription_plan?: SubscriptionPlan;
}

export interface LoyaltyTransactionHistory {
  id: string;
  client_id: string;
  transaction_type: 'points_earned' | 'points_redeemed' | 'cashback_earned' | 'cashback_used' | 'tier_upgrade' | 'subscription_purchase' | 'subscription_renewal';
  order_id?: string;
  points_change: number;
  cashback_change: number;
  amount: number;
  description?: string;
  previous_balance?: string;
  new_balance?: string;
  created_by: string;
  created_at: string;
}

export interface ReturnRecord {
  id: string;
  originalTransactionId: string;
  originalInvoiceNumber: string;
  returnNumber: string;
  items: ReturnItem[];
  totalRefund: number;
  refundMethod: 'cash' | 'network';
  reason: string;
  processedBy: string;
  processedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  hire_date?: string;
  status: 'active' | 'inactive';
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  task_number: string;
  title: string;
  description?: string;
  assigned_to?: string;
  assigned_by: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  deadline?: string;
  started_at?: string;
  completed_at?: string;
  is_daily_task: boolean;
  task_date?: string;
  created_at: string;
  updated_at: string;
  employee?: Employee;
  comments?: TaskComment[];
}

export interface TaskComment {
  id: string;
  task_id: string;
  comment: string;
  created_by: string;
  created_at: string;
}

export interface TaskStep {
  id: string;
  task_id: string;
  step_number: number;
  description: string;
  is_completed: boolean;
  completed_by?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  uploaded_by: string;
  created_at: string;
}

export interface TaskTemplate {
  id: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  estimated_duration: number;
  is_daily: boolean;
  assigned_to?: string;
  is_active: boolean;
  created_at: string;
  employee?: Employee;
}

export interface ReturnItem {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  originalQuantity: number;
  returnQuantity: number;
  unitPrice: number;
  refundAmount: number;
}

export interface ExchangeRecord {
  id: string;
  originalTransactionId: string;
  originalInvoiceNumber: string;
  exchangeNumber: string;
  returnedItems: ReturnItem[];
  newItems: TransactionItem[];
  totalReturned: number;
  totalNew: number;
  difference: number;
  differenceType: 'refund' | 'payment' | 'even';
  reason: string;
  processedBy: string;
  processedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface VoidRecord {
  id: string;
  originalTransactionId: string;
  originalInvoiceNumber: string;
  voidNumber: string;
  totalAmount: number;
  reason: string;
  processedBy: string;
  processedAt: string;
  approvedBy: string;
  approvedAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'return' | 'exchange' | 'void' | 'sale' | 'refund';
  entityType: 'transaction' | 'item' | 'payment';
  entityId: string;
  details: any;
  ipAddress?: string;
}

export interface ISTO {
  id: string;
  istoNumber: string;
  sourceStore: string;
  targetStore: string;
  status: 'Draft' | 'Requested' | 'Approved' | 'Picked' | 'In Transit' | 'Delivered' | 'Received' | 'Cancelled';
  deliveryNumber?: string;
  lastAction: string;
  lastActionAt: string;
  createdBy: string;
  createdAt: string;
  notes?: string;
  attachments?: string[];
  lines: ISTOLine[];
  driverName?: string;
  vehicleInfo?: string;
  deliveryNotes?: string;
}

export interface ISTOLine {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  unit: string;
  batchNumber?: string;
  expiryDate?: string;
  requestedQty: number;
  pickedQty?: number;
  receivedQty?: number;
  status: 'Open' | 'Picked' | 'Received';
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  movementType: 'Transfer-In' | 'Transfer-Out';
  quantity: number;
  unit: string;
  batchNumber: string;
  expiryDate?: string;
  fromLocation?: string;
  toLocation?: string;
  referenceNumber: string; // ISTO number
  performedBy: string;
  performedAt: string;
}

export interface ItemSupplier {
  id: string;
  supplierId: string;
  supplierName: string;
  cost: number;
  unit: string;
  supplierBarcode?: string;
  isMarketRange: boolean;
  leadTimeDays?: number;
  paymentTerms?: string;
  deliveryTerms?: string;
  isPreferred: boolean;
  isMotherSupplier: boolean;
}

export interface PRLine {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  unit: string;
  requestedQty: number;
  allocatedQtyToPOs: number;
  remainingQty: number;
  notes?: string;
}

export interface PurchaseRequisition {
  id: string;
  prNumber: string;
  requestDate: string;
  store: string;
  requestedBy: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Partially Allocated' | 'Allocated' | 'Rejected';
  urgency: 'Normal' | 'Urgent' | 'Critical';
  lines: PRLine[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface POLine {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  lineTotal: number;
  prId?: string;
  prLineId?: string;
  requestedQty?: number;
  allocatedQtyInThisPO?: number;
  expectedDelivery?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  orderDate: string;
  expectedDelivery: string;
  supplierId: string;
  supplierName: string;
  deliveryLocation: string;
  priority: 'Low' | 'Normal' | 'Urgent';
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Sent' | 'Partially Received' | 'Completed' | 'Cancelled';
  lines: POLine[];
  subtotal: number;
  tax: number;
  grandTotal: number;
  notes?: string;
  attachments?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  prId?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
}

export interface OnlineOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  status: 'Pending' | 'Approved' | 'In Progress' | 'Ready' | 'Completed' | 'Cancelled';
  items: OnlineOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  orderDate: string;
  requestedTime?: string;
  approvedBy?: string;
  approvedAt?: string;
  completedAt?: string;
  posInvoiceNumber?: string;
}

export interface OnlineOrderItem {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  itemType: 'item' | 'recipe';
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes?: string;
}

// Screen Management Types
export interface Screen {
  id: string;
  name: string;
  location: string;
  screenCode: string;
  isActive: boolean;
  theme: 'light' | 'dark' | 'blue' | 'green';
  language: 'en' | 'ar' | 'fr';
  currency: 'USD' | 'SAR' | 'EUR';
  showPrices: boolean;
  rotationSeconds: number;
  lastPingAt?: string;
  isOnline: boolean;
  assignedPlaylistId?: string;
  assignedPlaylistName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScreenPlaylist {
  id: string;
  screenId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScreenPlaylistItem {
  id: string;
  playlistId: string;
  screenGroup: string;
  sortIndex: number;
}

export interface ScreenOverride {
  id: string;
  screenId: string;
  itemId: string;
  hide: boolean;
  createdAt: string;
}

export interface MenuItemData {
  id: string;
  nameEn: string;
  price: number;
  imageUrl?: string;
  minDisplayThreshold: number;
  category: string;
  isExpiryTracked: boolean;
  showInPOS: boolean;
  availableForOnlineOrder: boolean;
}

export interface MenuItemDisplay {
  id: string;
  itemId: string;
  isMenuEnabled: boolean;
  screenGroup: string;
  sortOrder: number;
  showPrice: boolean;
}

export interface OOSOverride {
  id: string;
  itemId: string;
  isOOS: boolean;
  reason: string;
  untilAt?: string;
  createdAt: string;
  clearedAt?: string;
}

export interface MenuStatus {
  itemId: string;
  availableQty: number;
  autoOOS: boolean;
  manualOOS: boolean;
  isOOS: boolean;
}

// Menu Screens System Types
export interface Branch {
  id: string;
  name: string;
  code: string;
}

export interface MenuScreen {
  id: string;
  name: string;
  branchId: string;
  groupId?: string;
  orientation: 'landscape' | 'portrait';
  resolutionW: number;
  resolutionH: number;
  currentPlaylistId?: string;
  deviceToken: string;
  isActive: boolean;
  lastHeartbeatAt?: string;
  theme: 'light' | 'dark' | 'blue' | 'green';
  language: 'en' | 'ar' | 'fr';
  currency: 'USD' | 'SAR' | 'EUR';
  showPrices: boolean;
  rotationSeconds: number;
}

export interface ScreenGroup {
  id: string;
  name: string;
  branchId: string;
}

export interface MediaAsset {
  id: string;
  title: string;
  type: 'image' | 'video';
  fileUrl: string;
  durationSec?: number;
  aspect: '16:9' | '9:16' | '4:3' | '1:1' | 'other';
  branchId: string;
}

export interface MenuTemplate {
  id: string;
  name: string;
  branchId: string;
  bgMode: 'color' | 'image' | 'video';
  bgColor?: string;
  bgMediaId?: string;
  zones: TemplateZone[];
}

export interface TemplateZone {
  id: string;
  type: 'text' | 'list' | 'priceboard' | 'qr' | 'image' | 'video';
  x: number;
  y: number;
  w: number;
  h: number;
  style: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    textAlign?: 'left' | 'center' | 'right';
    color?: string;
    backgroundColor?: string;
    padding?: number;
    borderRadius?: number;
    shadow?: boolean;
  };
  bindings?: {
    categories?: string[];
    itemsFilter?: string;
    hideOOS?: boolean;
    showKcal?: boolean;
    url?: string; // for QR zones
    mediaId?: string; // for image/video zones
  };
}

export interface MenuItemData {
  id: string;
  branchId: string;
  sku: string;
  nameEn: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isActive: boolean;
  isOutOfStock: boolean;
  lastSyncAt?: string;
  minDisplayThreshold: number;
}

export interface MenuItemDisplay {
  id: string;
  itemId: string;
  isMenuEnabled: boolean;
  screenGroup: string;
  sortOrder: number;
  showPrice: boolean;
}

export interface OOSOverride {
  id: string;
  itemId: string;
  isOOS: boolean;
  reason: string;
  untilAt?: string;
  createdAt: string;
  clearedAt?: string;
}

export interface Daypart {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  branchId: string;
}

export interface Playlist {
  id: string;
  name: string;
  branchId: string;
  templateId: string;
  rotation: PlaylistSlide[];
}

export interface PlaylistSlide {
  id: string;
  templateOverride?: Partial<MenuTemplate>;
  itemsFilter?: string;
  mediaBgOverride?: string;
  durationSec?: number;
}

export interface POSLink {
  id: string;
  branchId: string;
  sku: string;
  posSku: string;
  syncMode: 'manual' | 'hourly' | 'realtime';
}

export interface ScheduleRule {
  id: string;
  branchId: string;
  targetType: 'screen' | 'group' | 'branch';
  targetId: string;
  playlistId: string;
  daypartId?: string;
  weekdays: number[];
  startDate?: string;
  endDate?: string;
  priority: number;
}

export interface ScreenOverride {
  id: string;
  screenId: string;
  itemId: string;
  hide: boolean;
}

// Camera Integration Types
export interface Branch {
  id: string;
  name: string;
  code: string;
  timezone: string;
}

export interface NVR {
  id: string;
  branchId: string;
  vendor: 'Hikvision' | 'Dahua' | 'UNV' | 'Axis' | 'Other';
  name: string;
  host: string;
  apiPort: number;
  rtspPort: number;
  username: string;
  secret: string;
  timezone: string;
  clockDriftSec: number;
  defaultPreSec: number;
  defaultPostSec: number;
  retentionDays: number;
  storageTarget: 'Local' | 'S3';
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Camera {
  id: string;
  branchId: string;
  nvrId: string;
  name: string;
  channel: number;
  rtspUrl?: string;
  onvifProfile?: string;
  tags: string[];
  isEnabled: boolean;
  lastHeartbeatAt?: string;
  healthStatus: 'Online' | 'Offline' | 'Error';
  createdAt: string;
  updatedAt: string;
}

export interface POSEvent {
  id: string;
  createdAt: string;
  branchId: string;
  registerId: string;
  cashierId: string;
  eventType: 'sale' | 'refund' | 'void' | 'discount' | 'price_override' | 'cash_drawer_open' | 'no_sale';
  invoiceNo?: string;
  amount: number;
  currency: string;
  payloadJson: any;
  status: 'processed' | 'failed';
}

export interface CameraEvent {
  id: string;
  createdAt: string;
  posEventId: string;
  branchId: string;
  cameraId: string;
  captureStatus: 'pending' | 'captured' | 'failed';
  snapshotUrl?: string;
  clipUrl?: string;
  startedAt: string;
  endedAt: string;
  preSec: number;
  postSec: number;
  overlayApplied: boolean;
  errorMessage?: string;
  attempts: number;
  metadataJson: any;
}

export interface CameraSettings {
  defaultPreSec: number;
  defaultPostSec: number;
  maxClipLength: number;
  retries: number;
  timeoutSec: number;
  watermarkEnabled: boolean;
  watermarkText: string;
  posOverlayEnabled: boolean;
  storagePath: string;
  cloudBucket?: string;
  folderPattern: string;
  retentionDays: number;
  thumbnailRetentionDays: number;
  autoPurgeEnabled: boolean;
  webhookSecret: string;
  outboundWebhookUrls: string[];
  hmacSigningKey: string;
}

export interface AuditLog {
  id: string;
  createdAt: string;
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  detailsJson: any;
}

export interface DayOpening {
  id: string;
  date: string;
  floatCashOnHand: number;
  pettyCashOnHand: number;
  openedBy: string;
  openedAt: string;
  status: 'Active' | 'Closed';
}

export interface DayClosing {
  id: string;
  date: string;
  totalSalesCash: number;
  totalSalesNetwork: number;
  totalPettyCash: number;
  totalDeposits: number;
  cashOnHandBalance: number;
  variances: {
    cash: number;
    network: number;
    petty: number;
  };
  closedBy: string;
  closedAt: string;
}