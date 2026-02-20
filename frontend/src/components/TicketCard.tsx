import { useState } from 'react';
import type { Ticket, TicketStatus } from '../types';
import { updateTicket } from '../api';

interface TicketCardProps {
	ticket: Ticket;
	onUpdated: (ticket: Ticket) => void;
}

const STATUS_FLOW: TicketStatus[] = [
	'open',
	'in_progress',
	'resolved',
	'closed',
];

function formatDate(iso: string): string {
	const d = new Date(iso);
	const now = new Date();
	const diffMs = now.getTime() - d.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	if (diffMins < 1) return 'just now';
	if (diffMins < 60) return `${diffMins}m ago`;
	const diffHrs = Math.floor(diffMins / 60);
	if (diffHrs < 24) return `${diffHrs}h ago`;
	const diffDays = Math.floor(diffHrs / 24);
	if (diffDays < 7) return `${diffDays}d ago`;
	return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function statusLabel(s: TicketStatus): string {
	return s === 'in_progress'
		? 'In Progress'
		: s.charAt(0).toUpperCase() + s.slice(1);
}

export default function TicketCard({ ticket, onUpdated }: TicketCardProps) {
	const [expanded, setExpanded] = useState(false);
	const [updating, setUpdating] = useState(false);

	const handleStatusChange = async (
		e: React.MouseEvent,
		status: TicketStatus
	) => {
		e.stopPropagation();
		if (status === ticket.status || updating) return;
		setUpdating(true);
		try {
			const updated = await updateTicket(ticket.id, { status });
			onUpdated(updated);
		} catch (err) {
			console.error('Failed to update status:', err);
		} finally {
			setUpdating(false);
		}
	};

	return (
		<div
			className={`ticket-card ${expanded ? 'expanded' : ''}`}
			onClick={() => setExpanded((x) => !x)}
		>
			<div className='tc-header'>
				<span className='tc-id'>#{ticket.id}</span>
				<span className='tc-title'>{ticket.title}</span>
				<div className='tc-badges'>
					<span className={`badge badge-priority-${ticket.priority}`}>
						{ticket.priority}
					</span>
					<span className={`badge badge-status-${ticket.status}`}>
						{statusLabel(ticket.status)}
					</span>
				</div>
			</div>

			<div className='tc-meta'>
				<span className='tc-desc'>{ticket.description}</span>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						flexShrink: 0,
					}}
				>
					<span className='badge badge-cat'>{ticket.category}</span>
					<span className='tc-time'>
						{formatDate(ticket.created_at)}
					</span>
				</div>
			</div>

			{expanded && (
				<div
					className='tc-expanded'
					onClick={(e) => e.stopPropagation()}
				>
					<p className='tc-full-desc'>{ticket.description}</p>
					<div className='tc-actions'>
						<span className='tc-actions-label'>Status</span>
						{STATUS_FLOW.map((s) => (
							<button
								key={s}
								className={`status-btn ${
									ticket.status === s ? 'current' : ''
								}`}
								onClick={(e) => handleStatusChange(e, s)}
								disabled={updating}
							>
								{statusLabel(s)}
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
