import { useCallback, useEffect, useRef, useState } from 'react';
import { getTickets } from '../api';
import type { Ticket, TicketFilters } from '../types';
import TicketCard from './TicketCard';

interface TicketListProps {
	refreshKey: number;
	onNewTicket?: (ticket: Ticket) => void;
	newTicket?: Ticket | null;
}

const EMPTY_FILTERS: TicketFilters = {
	category: '',
	priority: '',
	status: '',
	search: '',
};

export default function TicketList({ refreshKey, newTicket }: TicketListProps) {
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [filters, setFilters] = useState<TicketFilters>(EMPTY_FILTERS);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [pendingSearch, setPendingSearch] = useState('');

	const fetchTickets = useCallback(async (f: TicketFilters) => {
		setError(null);
		try {
			const data = await getTickets(f);
			setTickets(data);
		} catch (err) {
			setError('Failed to load tickets.');
			console.error(err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		setLoading(true);
		fetchTickets(filters);
	}, [filters, refreshKey, fetchTickets]);

	useEffect(() => {
		if (!newTicket) return;
		setTickets((prev) => {
			if (prev.find((t) => t.id === newTicket.id)) return prev;
			return [newTicket, ...prev];
		});
	}, [newTicket]);

	const handleSearchInput = (val: string) => {
		setPendingSearch(val);
		if (searchDebounce.current) clearTimeout(searchDebounce.current);
		searchDebounce.current = setTimeout(() => {
			setFilters((f) => ({ ...f, search: val }));
		}, 350);
	};

	const handleFilterChange = (key: keyof TicketFilters, val: string) => {
		setFilters((f) => ({ ...f, [key]: val }));
	};

	const handleUpdated = (updated: Ticket) => {
		setTickets((prev) =>
			prev.map((t) => (t.id === updated.id ? updated : t))
		);
	};

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
			<div className='filters-bar'>
				<div className='search-wrap'>
					<span className='search-icon'>⌕</span>
					<input
						placeholder='Search tickets...'
						value={pendingSearch}
						onChange={(e) => handleSearchInput(e.target.value)}
					/>
				</div>

				<select
					className='filter-select'
					value={filters.category}
					onChange={(e) =>
						handleFilterChange('category', e.target.value)
					}
				>
					<option value=''>All categories</option>
					<option value='billing'>Billing</option>
					<option value='technical'>Technical</option>
					<option value='account'>Account</option>
					<option value='general'>General</option>
				</select>

				<select
					className='filter-select'
					value={filters.priority}
					onChange={(e) =>
						handleFilterChange('priority', e.target.value)
					}
				>
					<option value=''>All priorities</option>
					<option value='low'>Low</option>
					<option value='medium'>Medium</option>
					<option value='high'>High</option>
					<option value='critical'>Critical</option>
				</select>

				<select
					className='filter-select'
					value={filters.status}
					onChange={(e) =>
						handleFilterChange('status', e.target.value)
					}
				>
					<option value=''>All statuses</option>
					<option value='open'>Open</option>
					<option value='in_progress'>In Progress</option>
					<option value='resolved'>Resolved</option>
					<option value='closed'>Closed</option>
				</select>
			</div>

			{loading && tickets.length === 0 ? (
				<div className='ticket-list'>
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className='ticket-card'
							style={{ cursor: 'default' }}
						>
							<div
								className='skeleton'
								style={{
									height: 14,
									width: '60%',
									marginBottom: 10,
								}}
							/>
							<div
								className='skeleton'
								style={{ height: 11, width: '90%' }}
							/>
						</div>
					))}
				</div>
			) : error ? (
				<div className='ticket-empty'>{error}</div>
			) : tickets.length === 0 ? (
				<div className='ticket-empty'>No tickets found</div>
			) : (
				<div className='ticket-list'>
					{tickets.map((t) => (
						<TicketCard
							key={t.id}
							ticket={t}
							onUpdated={handleUpdated}
						/>
					))}
				</div>
			)}
		</div>
	);
}
