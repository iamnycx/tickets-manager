import { useEffect, useRef, useState } from 'react';
import { classifyTicket, createTicket } from '../api';
import type {
	ClassificationResult,
	Ticket,
	TicketCategory,
	TicketFormData,
	TicketPriority,
} from '../types';

interface TicketFormProps {
	onCreated: (ticket: Ticket) => void;
}

const EMPTY_FORM: TicketFormData = {
	title: '',
	description: '',
	category: 'general',
	priority: 'medium',
};

interface FormState {
	fields: TicketFormData;
	classifying: boolean;
	suggested: ClassificationResult | null;
}

export default function TicketForm({ onCreated }: TicketFormProps) {
	const [formState, setFormState] = useState<FormState>({
		fields: EMPTY_FORM,
		classifying: false,
		suggested: null,
	});
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const abortRef = useRef<AbortController | null>(null);

	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
			if (abortRef.current) abortRef.current.abort();
		};
	}, []);

	const handleDescriptionChange = (val: string) => {
		setFormState((s) => ({
			...s,
			fields: { ...s.fields, description: val },
		}));

		if (debounceRef.current) clearTimeout(debounceRef.current);
		if (abortRef.current) abortRef.current.abort();

		if (val.trim().length <= 20) {
			setFormState((s) => ({
				...s,
				classifying: false,
				suggested: null,
			}));
			return;
		}

		debounceRef.current = setTimeout(() => {
			abortRef.current = new AbortController();
			const signal = abortRef.current.signal;

			setFormState((s) => ({ ...s, classifying: true }));

			classifyTicket(val)
				.then((res) => {
					if (signal.aborted) return;
					if (res?.suggested_category && res?.suggested_priority) {
						setFormState((s) => ({
							...s,
							classifying: false,
							suggested: res,
							fields: {
								...s.fields,
								category: res.suggested_category,
								priority: res.suggested_priority,
							},
						}));
					} else {
						setFormState((s) => ({ ...s, classifying: false }));
					}
				})
				.catch((err) => {
					if (signal.aborted) return;
					console.warn('Classification failed:', err);
					setFormState((s) => ({ ...s, classifying: false }));
				});
		}, 500);
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSubmitError(null);
		setSuccessMsg(null);
		setSubmitting(true);

		try {
			const ticket = await createTicket({
				...formState.fields,
				status: 'open',
			});
			onCreated(ticket);
			setFormState({
				fields: EMPTY_FORM,
				classifying: false,
				suggested: null,
			});
			setSuccessMsg(`Ticket #${ticket.id} created successfully`);
			setTimeout(() => setSuccessMsg(null), 3500);
		} catch (err) {
			console.error('Failed to create ticket:', err);
			setSubmitError('Failed to submit ticket. Please try again.');
		} finally {
			setSubmitting(false);
		}
	};

	const { fields, classifying, suggested } = formState;

	return (
		<form onSubmit={handleSubmit} className='ticket-form'>
			<div className='form-group'>
				<label htmlFor='title'>Title</label>
				<input
					id='title'
					placeholder='Brief summary of the issue...'
					maxLength={200}
					required
					value={fields.title}
					onChange={(e) =>
						setFormState((s) => ({
							...s,
							fields: { ...s.fields, title: e.target.value },
						}))
					}
				/>
			</div>

			<div className='form-group'>
				<label htmlFor='description'>Description</label>
				<textarea
					id='description'
					placeholder='Describe the issue in detail...'
					required
					value={fields.description}
					onChange={(e) => handleDescriptionChange(e.target.value)}
				/>
			</div>

			{classifying && (
				<div className='ai-bar classifying'>
					<span className='spinner' />
					<span className='ai-label'>Classifying with AI...</span>
				</div>
			)}
			{suggested && !classifying && (
				<div className='ai-bar suggested'>
					<span className='ai-icon'>&#10022;</span>
					<span className='ai-label'>AI suggested</span>
					<span className='ai-value'>
						{suggested.suggested_category} /{' '}
						{suggested.suggested_priority}
					</span>
				</div>
			)}

			<div className='form-row'>
				<div className='form-group'>
					<label htmlFor='category'>Category</label>
					<select
						id='category'
						value={fields.category}
						onChange={(e) =>
							setFormState((s) => ({
								...s,
								fields: {
									...s.fields,
									category: e.target.value as TicketCategory,
								},
							}))
						}
					>
						<option value='billing'>Billing</option>
						<option value='technical'>Technical</option>
						<option value='account'>Account</option>
						<option value='general'>General</option>
					</select>
				</div>

				<div className='form-group'>
					<label htmlFor='priority'>Priority</label>
					<select
						id='priority'
						value={fields.priority}
						onChange={(e) =>
							setFormState((s) => ({
								...s,
								fields: {
									...s.fields,
									priority: e.target.value as TicketPriority,
								},
							}))
						}
					>
						<option value='low'>Low</option>
						<option value='medium'>Medium</option>
						<option value='high'>High</option>
						<option value='critical'>Critical</option>
					</select>
				</div>
			</div>

			{submitError && <div className='form-error'>{submitError}</div>}
			{successMsg && <div className='success-flash'>{successMsg}</div>}

			<button type='submit' className='submit-btn' disabled={submitting}>
				{submitting ? 'Submitting...' : 'Submit Ticket'}
			</button>
		</form>
	);
}
