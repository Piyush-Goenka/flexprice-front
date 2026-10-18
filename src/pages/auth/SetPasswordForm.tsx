import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { EyeIcon, EyeOff, Link2Off } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@/components/atoms';
import AuthApi from '@/api/AuthApi';
import { newPasswordError } from '@/utils/auth/newPassword';
import { AuthTab } from './authTabs';
import { readPasswordLinkToken } from './passwordLink';

interface SetPasswordFormProps {
	switchTab: (tab: AuthTab) => void;
}

/** Sets a password through a one-time link an admin shared (self-hosted invites and resets). */
const SetPasswordForm: React.FC<SetPasswordFormProps> = ({ switchTab }) => {
	const { t } = useTranslation('auth');
	const navigate = useNavigate();
	const location = useLocation();
	// Read during the first render; the effect below then drops it from the address bar.
	const [token] = useState(() => readPasswordLinkToken(window.location.hash));
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	useEffect(() => {
		if (location.hash) {
			navigate({ pathname: location.pathname, search: location.search, hash: '' }, { replace: true });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const linkQuery = useQuery({
		queryKey: ['password-link', token],
		queryFn: () => AuthApi.CheckPasswordLink(token as string),
		enabled: !!token,
		retry: false,
		refetchOnWindowFocus: false,
	});

	const setPasswordMutation = useMutation({
		mutationFn: (newPassword: string) => AuthApi.SetPassword(token as string, newPassword),
		onSuccess: () => {
			toast.success(t('setPassword.success'));
			switchTab(AuthTab.LOGIN);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('setPassword.invalidDescription'));
			// The link may have been used meanwhile; checking again shows the expired state if so.
			linkQuery.refetch();
		},
	});

	const handleSubmit = () => {
		const problem = newPasswordError(password, confirmPassword);
		if (problem) {
			toast.error(t(`setPassword.${problem}`));
			return;
		}
		setPasswordMutation.mutate(password);
	};

	const backToLogin = (
		<p className='mt-6 text-center text-sm text-content-tertiary'>
			<button onClick={() => switchTab(AuthTab.LOGIN)} className='text-grey-600 underline font-medium hover:no-underline'>
				{t('links.backToLogin')}
			</button>
		</p>
	);

	if (token && linkQuery.isLoading) {
		return (
			<div className='flex flex-col items-center justify-center py-10'>
				<div className='h-10 w-10 animate-spin rounded-full border-2 border-line border-t-[#092E44]' />
				<p className='mt-4 text-sm text-content-muted'>{t('resetLink.checking')}</p>
			</div>
		);
	}

	if (!token || linkQuery.isError || !linkQuery.data) {
		return (
			<>
				<div className='rounded-xl border border-line/80 bg-surface-subtle/50 p-6 text-center shadow-sm'>
					<div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-warning-muted-strong'>
						<Link2Off className='h-6 w-6 text-warning' aria-hidden />
					</div>
					<h3 className='text-base font-medium text-content-heading'>{t('setPassword.invalidTitle')}</h3>
					<p className='mt-1.5 text-sm text-content-muted'>{t('setPassword.invalidDescription')}</p>
				</div>
				{backToLogin}
			</>
		);
	}

	const { purpose, email } = linkQuery.data;
	const isInvite = purpose === 'invite';

	return (
		<>
			<h2 className='text-3xl font-medium text-center text-content-heading mb-2'>
				{isInvite ? t('setPassword.inviteHeading') : t('setPassword.resetHeading')}
			</h2>
			<p className='text-center text-content-tertiary mb-8'>
				{isInvite ? t('setPassword.inviteSubheading', { email }) : t('setPassword.resetSubheading', { email })}
			</p>
			<form className='space-y-4' onSubmit={(e) => e.preventDefault()}>
				<div>
					<label htmlFor='new-password' className='block text-sm font-medium text-content-secondary mb-1'>
						{t('fields.newPassword')}
					</label>
					<Input
						id='new-password'
						name='new-password'
						autoComplete='new-password'
						type={showPassword ? 'text' : 'password'}
						placeholder={t('fields.newPasswordPlaceholder')}
						required
						onChange={(s) => setPassword(s)}
						value={password}
						suffix={
							<button
								type='button'
								onClick={() => setShowPassword(!showPassword)}
								className='cursor-pointer text-content-muted hover:text-content-secondary focus:outline-none'
								aria-label={showPassword ? 'Hide password' : 'Show password'}>
								{showPassword ? <EyeOff className='h-5 w-5' /> : <EyeIcon className='h-5 w-5' />}
							</button>
						}
					/>
				</div>
				<div>
					<label htmlFor='confirm-password' className='block text-sm font-medium text-content-secondary mb-1'>
						{t('fields.confirmNewPassword')}
					</label>
					<Input
						id='confirm-password'
						name='confirm-password'
						autoComplete='new-password'
						type={showConfirmPassword ? 'text' : 'password'}
						placeholder={t('fields.confirmNewPasswordPlaceholder')}
						required
						onChange={(s) => setConfirmPassword(s)}
						value={confirmPassword}
						suffix={
							<button
								type='button'
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								className='cursor-pointer text-content-muted hover:text-content-secondary focus:outline-none'
								aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
								{showConfirmPassword ? <EyeOff className='h-5 w-5' /> : <EyeIcon className='h-5 w-5' />}
							</button>
						}
					/>
				</div>
				<Button type='button' onClick={handleSubmit} className='w-full !mt-6 h-11' isLoading={setPasswordMutation.isPending}>
					{t('setPassword.submit')}
				</Button>
			</form>
			{backToLogin}
		</>
	);
};

export default SetPasswordForm;
