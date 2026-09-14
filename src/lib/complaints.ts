export const COMPLAINT_TYPES = [
  { value: 'general', label: 'شكوى عامة' },
  { value: 'technical', label: 'مشكلة تقنية' },
  { value: 'billing', label: 'الفوترة والمدفوعات' },
  { value: 'account', label: 'مشكلة في الحساب' },
  { value: 'product', label: 'مشكلة في منتج' },
  { value: 'store', label: 'مشكلة في متجر أو مبدع' },
  { value: 'seller', label: 'شكوى ضد بائع' },
  { value: 'other', label: 'أخرى' },
] as const

export const COMPLAINT_STATUSES = [
  { value: 'PENDING', label: 'قيد المراجعة', badge: 'bg-amber-100 text-amber-700' },
  { value: 'IN_PROGRESS', label: 'قيد المعالجة', badge: 'bg-blue-100 text-blue-700' },
  { value: 'RESOLVED', label: 'تمت المعالجة', badge: 'bg-emerald-100 text-emerald-700' },
  { value: 'CLOSED', label: 'مغلقة', badge: 'bg-gray-100 text-gray-600' },
] as const

export const COMPLAINT_PRIORITIES = [
  { value: 'low', label: 'منخفضة' },
  { value: 'normal', label: 'عادية' },
  { value: 'high', label: 'عالية' },
  { value: 'urgent', label: 'عاجلة' },
] as const

export function complaintStatusLabel(status: string) {
  return COMPLAINT_STATUSES.find(s => s.value === status)?.label || status
}

export function complaintStatusBadge(status: string) {
  return COMPLAINT_STATUSES.find(s => s.value === status)?.badge || 'bg-gray-100 text-gray-600'
}

export function complaintTypeLabel(type: string) {
  return COMPLAINT_TYPES.find(t => t.value === type)?.label || type
}

export function complaintPriorityLabel(priority: string) {
  return COMPLAINT_PRIORITIES.find(p => p.value === priority)?.label || priority
}