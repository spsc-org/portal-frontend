import { useId, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { Link } from 'react-router';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import Button from '../../../components/Buttons/Button.jsx';
import { confirmToast } from '../../../components/confirmToast.jsx';
import { usePageTitle } from '../../../shared/hooks/usePageTitle.js';
import { useVM } from '../../../shared/mvvm/viewModelHooks.js';
import AvatarCropModal from './AvatarCropModal.jsx';

function SectionCard({ title, hint = null, children, ...props }) {
    return (
        <section
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
            {...props}
        >
            <header className="border-b border-gray-200 px-4 py-2.5 dark:border-neutral-700">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">{title}</h2>
                {hint && <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">{hint}</p>}
            </header>
            <div className="px-4 py-3">{children}</div>
        </section>
    );
}

function Field({ label, error, ...inputProps }) {
    const id = useId();
    const errorId = error ? `${id}-error` : undefined;

    return (
        <div className="flex flex-col gap-1">
            <label htmlFor={id} className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {label}
            </label>
            <input
                id={id}
                aria-invalid={Boolean(error)}
                aria-describedby={errorId}
                className={`h-9 w-full rounded-md border bg-white px-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none disabled:bg-gray-100 dark:bg-neutral-900 dark:text-gray-100 dark:placeholder:text-gray-400 dark:disabled:bg-neutral-800 ${
                    error
                        ? 'border-red-500'
                        : 'border-gray-200 focus:border-blue-500 dark:border-neutral-600 dark:focus:border-blue-400'
                }`}
                {...inputProps}
            />
            {error && (
                <p id={errorId} className="text-xs text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
}

const AvatarSection = observer(function AvatarSection() {
    const vm = useVM();
    const fileRef = useRef(null);

    const onFile = (event) => {
        vm.pickAvatar(event.target.files?.[0]);
        // Той самий файл можна обрати повторно після "Скасувати".
        event.target.value = '';
    };

    return (
        <SectionCard title="Аватар" hint="JPG, PNG або WebP до 5МБ. Після вибору файла зображення можна обрізати.">
            <div className="flex items-center gap-4">
                <span className="relative flex h-20 w-20 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-blue-600 text-2xl font-bold text-white">
                    {vm.initials}
                    {vm.avatarSrc && (
                        // Поверх ініціалів: якщо файл не віддається (404) — лишаються ініціали.
                        <img
                            key={vm.avatarSrc}
                            src={vm.avatarSrc}
                            alt="Аватар"
                            onError={(e) => (e.currentTarget.hidden = true)}
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                    )}
                </span>
                <div className="flex flex-wrap gap-2">
                    <Button
                        size="sm"
                        color="secondary"
                        disabled={vm.savingAvatar}
                        onClick={() => fileRef.current?.click()}
                        iconBefore={<i className="fa-regular fa-camera" aria-hidden="true" />}
                    >
                        Завантажити
                    </Button>
                    {vm.profile?.avatar && (
                        <Button
                            size="sm"
                            color="error"
                            variant="outlined"
                            disabled={vm.savingAvatar}
                            onClick={() => confirmToast('Видалити аватар?', vm.removeAvatar)}
                        >
                            Видалити
                        </Button>
                    )}
                </div>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={onFile}
                />
            </div>
            {vm.avatarError && !vm.cropSource && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">{vm.avatarError}</p>
            )}
        </SectionCard>
    );
});

const AssignmentsSection = observer(function AssignmentsSection() {
    const vm = useVM();

    return (
        <SectionCard title="Мої призначення" data-i-doc="widget:profile-my-assignments">
            {vm.assignmentsLoading && <p className="text-xs text-gray-600 dark:text-gray-400">Завантаження…</p>}
            {!vm.assignmentsLoading && vm.assignments.length === 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">Ви поки ні за що не відповідаєте.</p>
            )}
            {!vm.assignmentsLoading && vm.assignments.length > 0 && (
                <ul className="divide-y divide-gray-100 dark:divide-neutral-700">
                    {vm.assignments.map((a) => (
                        <li key={a.id} className="py-2.5 first:pt-0 last:pb-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">{a.function?.name || '—'}</p>
                            <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                                З {a.started_at ? format(new Date(a.started_at), 'd MMMM yyyy', { locale: uk }) : '—'}
                                {a.reason && <> · {a.reason}</>}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </SectionCard>
    );
});

const InfoSection = observer(function InfoSection() {
    const vm = useVM();
    const { form, infoErrors: errors } = vm;

    return (
        <SectionCard
            title="Інформація про профіль"
            hint="Оновіть інформацію профілю та адресу електронної пошти вашого облікового запису."
        >
            <form
                className="flex flex-col gap-3"
                onSubmit={(event) => {
                    event.preventDefault();
                    vm.saveInfo();
                }}
            >
                <Field
                    label="ПІБ"
                    name="name"
                    autoComplete="name"
                    required
                    value={form.name}
                    error={errors.name}
                    onChange={(e) => vm.setInfoField('name', e.target.value)}
                />
                <Field
                    label="Email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={form.email}
                    error={errors.email}
                    onChange={(e) => vm.setInfoField('email', e.target.value)}
                />
                <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={!vm.infoDirty || vm.savingInfo}>
                        {vm.savingInfo ? 'Збереження…' : 'Зберегти'}
                    </Button>
                    {vm.infoDirty && (
                        <Button type="button" size="sm" color="secondary" onClick={vm.resetInfo}>
                            Скасувати
                        </Button>
                    )}
                </div>
            </form>
        </SectionCard>
    );
});

const PasswordSection = observer(function PasswordSection() {
    const vm = useVM();
    const { password, passwordErrors: errors } = vm;

    return (
        <SectionCard
            title="Оновити пароль"
            hint="Переконайтеся, що ваш обліковий запис використовує довгий випадковий пароль для забезпечення безпеки."
        >
            <form
                className="flex flex-col gap-3"
                onSubmit={(event) => {
                    event.preventDefault();
                    vm.savePassword();
                }}
            >
                {/* Підказка менеджеру паролів, чий це пароль. */}
                <input type="text" name="username" autoComplete="username" value={vm.profile?.email ?? ''} readOnly hidden />
                <Field
                    label="Поточний пароль"
                    name="current_password"
                    type="password"
                    autoComplete="current-password"
                    value={password.current_password}
                    error={errors.current_password}
                    onChange={(e) => vm.setPasswordField('current_password', e.target.value)}
                />
                <Field
                    label="Новий пароль"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={password.password}
                    error={errors.password}
                    onChange={(e) => vm.setPasswordField('password', e.target.value)}
                />
                <Field
                    label="Підтвердити пароль"
                    name="password_confirmation"
                    type="password"
                    autoComplete="new-password"
                    value={password.password_confirmation}
                    error={errors.password_confirmation}
                    onChange={(e) => vm.setPasswordField('password_confirmation', e.target.value)}
                />
                <div>
                    <Button type="submit" size="sm" disabled={!vm.canSavePassword || vm.savingPassword}>
                        {vm.savingPassword ? 'Збереження…' : 'Зберегти'}
                    </Button>
                </div>
            </form>
        </SectionCard>
    );
});

function ProfileView() {
    const vm = useVM();
    usePageTitle('Мій профіль');

    if (vm.isLoading) {
        return <p className="mt-2.5 text-xs text-gray-600 dark:text-gray-400">Завантаження…</p>;
    }

    return (
        <div data-i-doc="page:profile" className="mt-2.5 flex max-w-2xl flex-col gap-3">
            <AvatarSection />
            <AssignmentsSection />
            <InfoSection />
            <PasswordSection />

            <SectionCard title="Тема та повідомлення" hint="Тема, повідомлення та інші особисті налаштування — на окремій сторінці.">
                <Link
                    to="/settings"
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
                >
                    <i className="fa-solid fa-gear" aria-hidden="true" />
                    Відкрити налаштування
                </Link>
            </SectionCard>

            <SectionCard title="Вихід з акаунту">
                <Button
                    size="sm"
                    color="error"
                    variant="outlined"
                    onClick={vm.logout}
                    iconBefore={<i className="fa-solid fa-right-from-bracket" aria-hidden="true" />}
                >
                    Вийти
                </Button>
            </SectionCard>

            <AvatarCropModal />
        </div>
    );
}

export default observer(ProfileView);
