import React, {useState} from "react";

const CMD_ROUTES = {
    "import-truth-source": "/develop/dossier/importTruthSource",
    "update-truth-source": "/develop/dossier/updateTruthSource",
    "link-projects": "/develop/dossier/linkProjects",
    "create-orphan-profiles": "/develop/dossier/createOrphanProfiles",
    "refresh-status": "/develop/dossier/refreshStatus",
    "process-drafts": "/develop/dossier/processDrafts",
};

const CMD_LABELS = {
    "import-truth-source": "Первинна генерація досьє з ДРС",
    "update-truth-source": "Оновлення з truth-джерела",
    "link-projects": "Звʼязування проєктів із досьє",
    "create-orphan-profiles": "Автоматичне створення досьє для всіх сиріт",
    "refresh-status": "Оновлення стану підсанкційності",
    "process-drafts": "Обробка драфт-проєктів (застаріле)",
};

const LOG_COLORS = {
    error: "text-red-400",
    success: "text-green-400",
    warning: "text-yellow-400",
    info: "text-gray-400",
};
// Чистий React-порт розробницької сторінки /develop/dossier (раніше resources/views/develop/dossier.blade.php,
// плейн Blade + vanilla JS) — 2026-08-05, за проханням користувача, з посиланням із /developer-debug.
// Функціональність НЕ змінена: ті самі 6 команд (кожна — окрема artisan-команда через
// DeveloperController::runX(), POST → JSON {status, output}), той самий консольний вивід
// знизу (append-only, кольоровий за типом, HTML від сервера — ansiToHtml() на бекенді формує
// готовий <span>-розмічений рядок, той самий підхід, що й у видаленому vanilla-JS оригіналі).
const cardButtonClasses = (color) =>
    `cmd-btn ${color} text-white font-bold py-2 px-4 rounded inline-flex items-center shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed`;

const ToolCard = ({step, color, icon, title, description, children, onRun, isRunning, disabled}) => (
    <div data-i-doc="page:develop-dossier" className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-2">
            <span className={`flex-none min-w-[1.5rem] h-6 px-1 rounded-full ${color} text-white text-xs font-bold flex items-center justify-center`}>
                {step}
            </span>
            <i className={`fas ${icon}`}></i> {title}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4" dangerouslySetInnerHTML={{__html: description}}/>

        {children}

        <button type="button" onClick={onRun} disabled={disabled || isRunning}
                className={cardButtonClasses(`${color} hover:brightness-95`)}>
            <i className={`fas ${isRunning ? "fa-spinner fa-spin" : "fa-play"} mr-2`}></i> Запустити
        </button>
    </div>
);

const NumberField = ({id, label, value, onChange, min, hint}) => (
    <div>
        <label htmlFor={id} className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">{label}</label>
        <input type="number" id={id} value={value} min={min}
               onChange={(e) => onChange(e.target.value)}
               className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
        {hint && <span className="block text-[11px] text-gray-400 mt-1">{hint}</span>}
    </div>
);

const Index = () => {
    const [log, setLog] = useState([]);
    const [runningCmd, setRunningCmd] = useState(null);
    const [showLegacy, setShowLegacy] = useState(false);

    const [importType, setImportType] = useState("");
    const [importChunk, setImportChunk] = useState("500");
    const [importFresh, setImportFresh] = useState(false);
    const [importFreshConfirm, setImportFreshConfirm] = useState(false);

    const [linkChunk, setLinkChunk] = useState("1000");
    const [linkUseDrsId, setLinkUseDrsId] = useState(true);
    const [linkUseIdentifiers, setLinkUseIdentifiers] = useState(false);
    const [linkUseSubjectId, setLinkUseSubjectId] = useState(true);

    const [orphansChunk, setOrphansChunk] = useState("500");
    const [statusChunk, setStatusChunk] = useState("500");

    const [updateType, setUpdateType] = useState("");
    const [updateChunk, setUpdateChunk] = useState("500");

    const [processChunk, setProcessChunk] = useState("500");

    const toChunk = (value, fallback) => {
        const parsed = parseInt(value, 10);
        return Number.isNaN(parsed) ? fallback : parsed;
    };

    const appendLog = (html, type = "info") => {
        setLog((prev) => [...prev, {id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), html, type}]);
    };

    const runCommand = async (cmd, body = {}) => {
        appendLog(`<span class="text-yellow-400">⏳ Запуск: ${CMD_LABELS[cmd]}...</span>`, "warning");
        setRunningCmd(cmd);
        try {
            const response = await axios.post(CMD_ROUTES[cmd], body);
            const data = response.data;
            if (data.status === "success") {
                appendLog(data.output || "Виконано.", "success");
            } else {
                appendLog(`<span class="text-red-400">Помилка:</span><br>${data.output || "Невідома помилка"}`, "error");
            }
        } catch (err) {
            const message = err?.response?.data?.output || err?.message || "Невідома помилка";
            appendLog(`<span class="text-red-400">Помилка запиту: ${message}</span>`, "error");
        } finally {
            setRunningCmd(null);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Досьє — інструменти дедуплікації</h1>
                <a href="/develop" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center">
                    <i className="fas fa-arrow-left mr-2"></i> Назад до інструментів
                </a>
            </div>

            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3">Поточні інструменти</h2>

            {/* Крок 1: Import Truth Source */}
            <ToolCard step="1" color="bg-blue-600" icon="fa-database text-blue-500"
                      title="Первинна генерація досьє з ДРС"
                      description="Стартова точка: створює базові досьє з <code>register_consolidated</code>
                          (<code>ds_uk_nsdc_sanc_p/l/vessel</code>) у <code>sanction_profile</code> на основі санкційних дій ДРС.
                          Ідемпотентно для нових записів — повторний запуск не дублює наявні звʼязки."
                      isRunning={runningCmd === "import-truth-source"}
                      disabled={importFresh && !importFreshConfirm}
                      onRun={() => runCommand("import-truth-source", {
                          type: importType || null,
                          chunk: toChunk(importChunk, 500),
                          fresh: importFresh,
                      })}>
                <div className="flex flex-wrap items-end gap-4 mb-4">
                    <div>
                        <label htmlFor="importType" className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Тип</label>
                        <select id="importType" value={importType} onChange={(e) => setImportType(e.target.value)}
                                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-400">
                            <option value="">Усі (p, l, vessel)</option>
                            <option value="p">Фізособи (p)</option>
                            <option value="l">Юрособи (l)</option>
                            <option value="vessel">Судна (vessel)</option>
                        </select>
                    </div>
                    <NumberField id="importChunk" label="Розмір чанка" value={importChunk} onChange={setImportChunk} min={0}
                                 hint="0 = без чанків (усе одразу)"/>
                </div>

                <div className="mb-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                        <input type="checkbox" checked={importFresh}
                               onChange={(e) => {
                                   setImportFresh(e.target.checked);
                                   if (!e.target.checked) setImportFreshConfirm(false);
                               }}
                               className="rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500"/>
                        <span>Fresh — видалити ВСІ досьє обраного типу (субʼєкта) і ВСІ їхні звʼязки перед імпортом (повна очистка й перегенерація)</span>
                    </label>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 ml-6">
                        ⚠️ Деструктивна дія, незворотна. Видаляє <strong>усі</strong> досьє обраного типу субʼєкта (фізособи/юрособи/судна) —
                        незалежно від різновиду звʼязку (не лише ДРС-якірні; включно з ручними й будь-якими іншими) — та всі їхні звʼязки,
                        після чого перегенеровує з нуля. Для звичайного оновлення вже наявних досьє використовуйте крок 4 (Оновлення) — він нічого не видаляє.
                    </p>
                    {importFresh &&
                        <div className="mt-3 ml-6 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded p-3">
                            <label className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                                <input type="checkbox" checked={importFreshConfirm}
                                       onChange={(e) => setImportFreshConfirm(e.target.checked)}
                                       className="rounded border-red-400 text-red-600 focus:ring-red-500"/>
                                <span>Я розумію, що це видалить існуючі профілі/звʼязки, і підтверджую</span>
                            </label>
                        </div>
                    }
                </div>
            </ToolCard>

            {/* Крок 2: Link Projects */}
            <ToolCard step="2" color="bg-purple-600" icon="fa-link text-purple-500"
                      title="Звʼязування проєктів із досьє"
                      description="Прогін по всіх проєктах (<code>register.project</code>): точне (не нечітке) звʼязування з уже наявними
                          досьє за <code>drs_id</code> та формалізованими ідентифікаторами субʼєкта (tax_id/reg_id/identity_docs).
                          <strong>Нових досьє не створює</strong> — лише звʼязує з уже наявними. Заодно збагачує ідентифікатори
                          досьє, файли/аватар із вкладень проєкту, і позначає конфліктні/застарілі звʼязки.
                          Періодична, ідемпотентна команда — можна запускати повторно."
                      isRunning={runningCmd === "link-projects"}
                      onRun={() => runCommand("link-projects", {
                          chunk: toChunk(linkChunk, 1000),
                          drs_id: linkUseDrsId,
                          identifiers: linkUseIdentifiers,
                          subject_id: linkUseSubjectId,
                      })}>
                <div className="flex flex-wrap items-end gap-4 mb-4">
                    <NumberField id="linkChunk" label="Розмір чанка" value={linkChunk} onChange={setLinkChunk} min={1}/>
                </div>
                <div className="mb-4">
                    <span className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Незалежні проходи (кожен можна вимкнути окремо для тестування)</span>
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                            <input type="checkbox" checked={linkUseDrsId} onChange={(e) => setLinkUseDrsId(e.target.checked)}
                                   className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"/>
                            <span>1. Через drs_id проєкту</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                            <input type="checkbox" checked={linkUseIdentifiers} onChange={(e) => setLinkUseIdentifiers(e.target.checked)}
                                   className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"/>
                            <span>3. Через ідентифікатори проєкту (projectToIdentifier) — експеримент, без аналізу типу</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                            <input type="checkbox" checked={linkUseSubjectId} onChange={(e) => setLinkUseSubjectId(e.target.checked)}
                                   className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"/>
                            <span>2. Через легасі project.subjectId</span>
                        </label>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        Позначення "застарілих" звʼязків (reconcileStale) виконується лише коли проходи 1 і 2 обидва увімкнені.
                    </p>
                </div>
            </ToolCard>

            {/* Крок 2.2: автоматичне створення досьє для всіх сиріт */}
            <ToolCard step="2.2" color="bg-teal-600" icon="fa-user-plus text-teal-500"
                      title="Автоматичне створення досьє для всіх сиріт"
                      description='Після кроку 2 частина проєктів лишається без жодного звʼязку з досьє ("сироти" —
                          панель "Список сирот" на <code>/dossier</code>). Ця дія створює нове досьє для
                          КОЖНОГО поточного сироти одразу, без ручного відбору сторінки модератором — той
                          самий шлях, що й ручне пакетне створення в панелі "Список сирот"
                          (<code>OrphanProjectService::createManyFromProjects</code>), лише на повному наборі
                          сиріт. Кожен проєкт — окрема транзакція; помилка на одному не зупиняє решту.
                          Ідемпотентно — повторний запуск не дублює (проєкт, що вже отримав досьє, більше не
                          сирота). Ручний потік у панелі "Список сирот" ця дія не змінює і не замінює.'
                      isRunning={runningCmd === "create-orphan-profiles"}
                      onRun={() => runCommand("create-orphan-profiles", {chunk: toChunk(orphansChunk, 500)})}>
                <div className="flex flex-wrap items-end gap-4 mb-4">
                    <NumberField id="orphansChunk" label="Розмір чанка" value={orphansChunk} onChange={setOrphansChunk} min={1}/>
                </div>
            </ToolCard>

            {/* Крок 3: Refresh Sanction Status */}
            <ToolCard step="3" color="bg-amber-600" icon="fa-shield-halved text-amber-500"
                      title="Оновлення стану підсанкційності (Україна)"
                      description="Перераховує <code>ua_sanctions_status</code>/<code>ua_sanctions_days_remaining</code> для всіх досьє
                          на основі дій ДРС (враховує ланцюжок <code>affected_decree</code> — зміни/скасування конкретних указів).
                          <strong>Нічого не створює й не видаляє</strong>, лише оновлює два поля. Запускається щоночі за розкладом
                          (04:00) — цей запуск лише для ручної перевірки поза графіком."
                      isRunning={runningCmd === "refresh-status"}
                      onRun={() => runCommand("refresh-status", {chunk: toChunk(statusChunk, 500)})}>
                <div className="flex flex-wrap items-end gap-4 mb-4">
                    <NumberField id="statusChunk" label="Розмір чанка" value={statusChunk} onChange={setStatusChunk} min={1}/>
                </div>
            </ToolCard>

            {/* Крок 4: Update Truth Source */}
            <ToolCard step="4" color="bg-green-600" icon="fa-rotate text-green-500"
                      title="Оновлення з truth-джерела"
                      description="Підтримка в актуальному стані: оновлює <code>search_index</code>/<code>drs_id</code> вже підключених досьє,
                          якщо дані в truth-джерелі змінились після імпорту. <strong>Нічого не створює і не видаляє</strong>,
                          <code>view_caption</code> не чіпає (захищає ручні правки назви) — звʼязки (зокрема ручні) також не чіпаються.
                          Джерела без звʼязку пропускаються."
                      isRunning={runningCmd === "update-truth-source"}
                      onRun={() => runCommand("update-truth-source", {type: updateType || null, chunk: toChunk(updateChunk, 500)})}>
                <div className="flex flex-wrap items-end gap-4 mb-4">
                    <div>
                        <label htmlFor="updateType" className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Тип</label>
                        <select id="updateType" value={updateType} onChange={(e) => setUpdateType(e.target.value)}
                                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-green-400">
                            <option value="">Усі (p, l, vessel)</option>
                            <option value="p">Фізособи (p)</option>
                            <option value="l">Юрособи (l)</option>
                            <option value="vessel">Судна (vessel)</option>
                        </select>
                    </div>
                    <NumberField id="updateChunk" label="Розмір чанка" value={updateChunk} onChange={setUpdateChunk} min={0}
                                 hint="0 = без чанків (усе одразу)"/>
                </div>
            </ToolCard>

            {/* Легасі */}
            <div className="mt-10 mb-6">
                <button type="button" onClick={() => setShowLegacy((prev) => !prev)}
                        className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                    <i className={`fas fa-chevron-right text-xs transition-transform ${showLegacy ? "rotate-90" : ""}`}></i>
                    Легасі (застаріле, не для звичайного використання)
                </button>
            </div>

            {showLegacy &&
                <div className="bg-gray-50 dark:bg-gray-900/50 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 mb-6">
                    <div className="flex items-start gap-3 mb-4 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-3">
                        <i className="fas fa-triangle-exclamation mt-0.5"></i>
                        <p className="text-sm">
                            Ця команда — з попередньої архітектури дедуплікації. Гілка "немає точного збігу → створити нове
                            досьє" (<code>AutoLinkService::createSelfProfile()</code>) конфліктує з поточним правилом
                            "<strong>звʼязування проєктів ніколи не створює нових досьє</strong>" (крок 2 вище). Використання
                            цієї команди на продакшені створює по одному зайвому досьє на кожен непривʼязаний проєкт.
                            Не запускайте без чіткого розуміння наслідків.
                        </p>
                    </div>

                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-2">
                        <i className="fas fa-link text-gray-400"></i> Обробка драфт-проєктів (застаріле)
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Обробка драфт-проєктів через AutoLinker — привʼязка до існуючих профілів АБО створення нових.
                    </p>

                    <div className="flex flex-wrap items-end gap-4 mb-4">
                        <NumberField id="processChunk" label="Розмір чанка" value={processChunk} onChange={setProcessChunk} min={0}
                                     hint="0 = без чанків (усе одразу)"/>
                    </div>

                    <button type="button" onClick={() => runCommand("process-drafts", {chunk: toChunk(processChunk, 500)})}
                            disabled={runningCmd === "process-drafts"}
                            className={cardButtonClasses("bg-gray-500 hover:bg-gray-600")}>
                        <i className={`fas ${runningCmd === "process-drafts" ? "fa-spinner fa-spin" : "fa-play"} mr-2`}></i> Запустити (застаріле)
                    </button>
                </div>
            }

            <div className="flex justify-end mb-2">
                <button type="button" onClick={() => setLog([])}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded inline-flex items-center shadow-sm transition">
                    <i className="fas fa-eraser mr-2"></i> Очистити консоль
                </button>
            </div>

            {log.length > 0 &&
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Термінал:</h3>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto whitespace-pre-wrap max-h-[600px] overflow-y-auto">
                        {log.map((entry) => (
                            <div key={entry.id} className="mb-4 border-b border-gray-700 pb-2 last:border-0 last:pb-0 last:mb-0">
                                <div className={`text-xs ${LOG_COLORS[entry.type] ?? "text-gray-400"} mb-1`}>[{entry.time}]</div>
                                <div dangerouslySetInnerHTML={{__html: entry.html}}/>
                            </div>
                        ))}
                    </div>
                </div>
            }
        </div>
    );
};

export default Index;
