import { useState } from 'react';
import TicketForm from './components/TicketForm';

import type { Ticket } from './types';
import TicketList from './components/TicketList';
import StatsDashboard from './components/StatsDashboard';

type View = 'tickets' | 'stats';

export default function App() {
	const [view, setView] = useState<View>('tickets');
	const [refreshKey, setRefreshKey] = useState(0);
	const [latestTicket, setLatestTicket] = useState<Ticket | null>(null);

	const handleCreated = (ticket: Ticket) => {
		setLatestTicket(ticket);
		setRefreshKey((k) => k + 1);
		setView('tickets');
	};

	return (
		<div className='app-shell'>
			<header className='app-header'>
				<span className='app-logo'>
					SUPPORT<span>/</span>OPS
				</span>
				<nav className='app-nav'>
					<button
						className={`nav-btn ${
							view === 'tickets' ? 'active' : ''
						}`}
						onClick={() => setView('tickets')}
					>
						Tickets
					</button>
					<button
						className={`nav-btn ${
							view === 'stats' ? 'active' : ''
						}`}
						onClick={() => setView('stats')}
					>
						Stats
					</button>
				</nav>
			</header>

			<main className='app-main'>
				<aside className='sidebar'>
					<p className='section-title'>New Ticket</p>
					<TicketForm onCreated={handleCreated} />
				</aside>

				<section className='main-content'>
					{view === 'tickets' ? (
						<>
							<p className='section-title'>All Tickets</p>
							<TicketList
								refreshKey={refreshKey}
								newTicket={latestTicket}
							/>
						</>
					) : (
						<>
							<p className='section-title'>Dashboard</p>
							<StatsDashboard refreshKey={refreshKey} />
						</>
					)}
				</section>
			</main>
		</div>
	);
}
