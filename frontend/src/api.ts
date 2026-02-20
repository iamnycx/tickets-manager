import type {
	ClassificationResult,
	Ticket,
	TicketFilters,
	StatsData,
} from './types';

const BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
	if (!res.ok) {
		const text = await res.text().catch(() => res.statusText);
		throw new Error(`HTTP ${res.status}: ${text}`);
	}
	return res.json() as Promise<T>;
}

export const getTickets = (
	filters: Partial<TicketFilters> = {}
): Promise<Ticket[]> => {
	const params = new URLSearchParams();
	Object.entries(filters).forEach(([k, v]) => {
		if (v) params.set(k, v);
	});
	const qs = params.toString();
	return fetch(`${BASE}/tickets/${qs ? `?${qs}` : ''}`).then((res) =>
		handleResponse<Ticket[]>(res)
	);
};

export const createTicket = (
	data: Omit<Ticket, 'id' | 'created_at'>
): Promise<Ticket> =>
	fetch(`${BASE}/tickets/`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	}).then((res) => handleResponse<Ticket>(res));

export const updateTicket = (
	id: number,
	data: Partial<Ticket>
): Promise<Ticket> =>
	fetch(`${BASE}/tickets/${id}/`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	}).then((res) => handleResponse<Ticket>(res));

export const getStats = (): Promise<StatsData> =>
	fetch(`${BASE}/tickets/stats/`).then((res) =>
		handleResponse<StatsData>(res)
	);

export const classifyTicket = (
	description: string
): Promise<ClassificationResult> =>
	fetch(`${BASE}/tickets/classify/`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ description }),
	}).then((res) => handleResponse<ClassificationResult>(res));
