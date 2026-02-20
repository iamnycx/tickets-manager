export type TicketCategory = 'billing' | 'technical' | 'account' | 'general';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface TicketFormData {
	title: string;
	description: string;
	category: TicketCategory;
	priority: TicketPriority;
}

export interface Ticket extends TicketFormData {
	id: number;
	status: TicketStatus;
	created_at: string;
}

export interface ClassificationResult {
	suggested_category: TicketCategory;
	suggested_priority: TicketPriority;
}

export interface StatsData {
	total_tickets: number;
	open_tickets: number;
	avg_tickets_per_day: number;
	priority_breakdown: Record<TicketPriority, number>;
	category_breakdown: Record<TicketCategory, number>;
}

export interface TicketFilters {
	category: string;
	priority: string;
	status: string;
	search: string;
}
