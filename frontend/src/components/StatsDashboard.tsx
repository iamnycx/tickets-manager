import { useEffect, useState } from 'react';
import { getStats } from '../api';
import type { StatsData, TicketCategory, TicketPriority } from '../types';

interface StatsDashboardProps {
	refreshKey: number;
}

const PRIORITY_COLORS: Record<TicketPriority, string> = {
	low: 'var(--green)',
	medium: 'var(--yellow)',
	high: 'var(--orange)',
	critical: 'var(--red)',
};

const CATEGORY_COLORS: Record<TicketCategory, string> = {
	billing: 'var(--accent)',
	technical: 'var(--orange)',
	account: 'var(--green)',
	general: 'var(--text-secondary)',
};

export default function StatsDashboard({ refreshKey }: StatsDashboardProps) {
	const [stats, setStats] = useState<StatsData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		getStats()
			.then((data) => {
				if (!cancelled) setStats(data);
			})
			.catch((err) => console.error('Stats fetch failed:', err))
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [refreshKey]);

	if (loading && !stats) {
		return (
			<div className='stats-grid'>
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className='stat-card'>
						<div
							className='skeleton'
							style={{
								height: 10,
								width: '50%',
								marginBottom: 10,
							}}
						/>
						<div
							className='skeleton'
							style={{ height: 26, width: '40%' }}
						/>
					</div>
				))}
			</div>
		);
	}

	if (!stats) return null;

	const priorityTotal =
		Object.values(stats.priority_breakdown).reduce((a, b) => a + b, 0) || 1;
	const categoryTotal =
		Object.values(stats.category_breakdown).reduce((a, b) => a + b, 0) || 1;

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
			<div className='stats-grid'>
				<div className='stat-card'>
					<div className='stat-label'>Total Tickets</div>
					<div className='stat-value'>{stats.total_tickets}</div>
				</div>
				<div className='stat-card'>
					<div className='stat-label'>Open</div>
					<div
						className='stat-value'
						style={{ color: 'var(--accent)' }}
					>
						{stats.open_tickets}
					</div>
				</div>
				<div className='stat-card'>
					<div className='stat-label'>Avg / Day</div>
					<div className='stat-value'>
						{stats.avg_tickets_per_day.toFixed(1)}
					</div>
				</div>
				<div className='stat-card'>
					<div className='stat-label'>Resolution %</div>
					<div
						className='stat-value'
						style={{ color: 'var(--green)' }}
					>
						{stats.total_tickets > 0
							? Math.round(
									(((stats.priority_breakdown.low ?? 0) +
										(stats.priority_breakdown.medium ??
											0)) /
										stats.total_tickets) *
										100
							  )
							: 0}
						%
					</div>
					<div className='stat-sub'>low + medium priority</div>
				</div>
			</div>

			<div className='breakdown-grid'>
				<div className='breakdown-card'>
					<div className='breakdown-title'>Priority Breakdown</div>
					<div className='breakdown-rows'>
						{(
							Object.entries(stats.priority_breakdown) as [
								TicketPriority,
								number
							][]
						).map(([priority, count]) => (
							<div key={priority} className='breakdown-row'>
								<span className='br-label'>{priority}</span>
								<div className='br-bar-wrap'>
									<div
										className='br-bar'
										style={{
											width: `${Math.round(
												(count / priorityTotal) * 100
											)}%`,
											background:
												PRIORITY_COLORS[priority],
										}}
									/>
								</div>
								<span className='br-count'>{count}</span>
							</div>
						))}
					</div>
				</div>

				<div className='breakdown-card'>
					<div className='breakdown-title'>Category Breakdown</div>
					<div className='breakdown-rows'>
						{(
							Object.entries(stats.category_breakdown) as [
								TicketCategory,
								number
							][]
						).map(([cat, count]) => (
							<div key={cat} className='breakdown-row'>
								<span className='br-label'>{cat}</span>
								<div className='br-bar-wrap'>
									<div
										className='br-bar'
										style={{
											width: `${Math.round(
												(count / categoryTotal) * 100
											)}%`,
											background: CATEGORY_COLORS[cat],
										}}
									/>
								</div>
								<span className='br-count'>{count}</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
