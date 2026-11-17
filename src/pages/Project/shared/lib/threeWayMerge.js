/**
 * Три-вей-мердж для оптимістичного конкурентного редагування (без React, без I/O).
 *
 * threeWayMerge(base, theirs, mine, options) порівнює три знімки одного й того ж
 * запису — спільного предка (base), поточний стан на сервері (theirs) і локальні
 * незбережені зміни (mine) — і повертає:
 *   - merged            — theirs + мої незбіжні зміни; конфліктні шляхи лишають theirs
 *   - conflicts         — [{ path, base, theirs, mine }]
 *   - appliedFromTheirs — шляхи, де застосовано значення theirs (для підсвітки "оновив інший користувач")
 *   - keptFromMine      — шляхи, де лишилось моє значення
 *
 * Правила (скалярні шляхи), base vs mine / base vs theirs:
 *   unchanged / unchanged      → base
 *   unchanged / changed        → theirs
 *   changed   / unchanged      → mine
 *   changed   / changed, рівні → те саме значення
 *   changed   / changed, різні → конфлікт (merged лишає theirs до вирішення)
 *
 * `options.itemArrayPaths` — список dot-шляхів полів-масивів об'єктів, які треба
 * мерджити поелементно за стабільним id (а не як єдине атомарне значення). Будь-який
 * інший масив (масив примітивів — id-и, чекбокси тощо) порівнюється як єдине ціле.
 * `id` і `version` на верхньому рівні знімка завжди ігноруються (не порівнюються).
 */

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function deepEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (typeof a !== typeof b) return false;

    if (Array.isArray(a) || Array.isArray(b)) {
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (!deepEqual(a[i], b[i])) return false;
        }
        return true;
    }

    if (typeof a === 'object') {
        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);
        if (aKeys.length !== bKeys.length) return false;
        for (const key of aKeys) {
            if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
            if (!deepEqual(a[key], b[key])) return false;
        }
        return true;
    }

    return false;
}

function deepClone(value) {
    if (value === null || typeof value !== 'object') return value;
    return JSON.parse(JSON.stringify(value));
}

function getPath(obj, path) {
    let cur = obj;
    for (const part of path.split('.')) {
        if (cur == null) return undefined;
        cur = cur[part];
    }
    return cur;
}

function setPath(obj, path, value) {
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        if (cur[key] == null || typeof cur[key] !== 'object') cur[key] = {};
        cur = cur[key];
    }
    cur[parts[parts.length - 1]] = value;
}

function collectScalarPaths(value, prefix, itemArrayPaths, ignoreKeys, out) {
    if (prefix && itemArrayPaths.has(prefix)) return;
    if (!isPlainObject(value)) {
        out.add(prefix);
        return;
    }
    for (const key of Object.keys(value)) {
        if (!prefix && ignoreKeys.has(key)) continue;
        collectScalarPaths(value[key], prefix ? `${prefix}.${key}` : key, itemArrayPaths, ignoreKeys, out);
    }
}

/**
 * @returns {{value: *, status: 'base'|'theirs'|'mine'|'same'|'conflict', base?: *, theirs?: *, mine?: *}}
 */
function mergeScalar(base, theirs, mine) {
    const baseEqMine = deepEqual(base, mine);
    const baseEqTheirs = deepEqual(base, theirs);

    if (baseEqMine && baseEqTheirs) return { value: base, status: 'base' };
    if (baseEqMine && !baseEqTheirs) return { value: theirs, status: 'theirs' };
    if (!baseEqMine && baseEqTheirs) return { value: mine, status: 'mine' };
    if (deepEqual(mine, theirs)) return { value: mine, status: 'same' };

    return { value: theirs, status: 'conflict', base, theirs, mine };
}

function defaultItemKey(item, index) {
    if (item && item.id != null) return String(item.id);
    if (item && item.uuid != null) return String(item.uuid);
    if (item && item.clientKey != null) return String(item.clientKey);
    return `__idx_${index}`;
}

function keyItems(arr, itemKeyFn) {
    const map = new Map();
    arr.forEach((item, index) => map.set(itemKeyFn(item, index), item));
    return map;
}

function mergeItemArray(arrayPath, baseArr, theirsArr, mineArr, itemKeyFn, conflicts, appliedFromTheirs, keptFromMine) {
    const baseMap = keyItems(baseArr, itemKeyFn);
    const theirsMap = keyItems(theirsArr, itemKeyFn);
    const mineMap = keyItems(mineArr, itemKeyFn);

    const allKeys = new Set([...baseMap.keys(), ...theirsMap.keys(), ...mineMap.keys()]);
    const resultItems = new Map();

    for (const key of allKeys) {
        const inBase = baseMap.has(key);
        const inTheirs = theirsMap.has(key);
        const inMine = mineMap.has(key);
        const baseItem = baseMap.get(key);
        const theirsItem = theirsMap.get(key);
        const mineItem = mineMap.get(key);
        const itemPath = `${arrayPath}.${key}`;

        if (!inBase && inMine && !inTheirs) {
            resultItems.set(key, mineItem);
            keptFromMine.push(itemPath);
            continue;
        }

        if (!inBase && !inMine && inTheirs) {
            resultItems.set(key, theirsItem);
            appliedFromTheirs.push(itemPath);
            continue;
        }

        if (!inBase && inMine && inTheirs) {
            // Незалежно додано з обох боків під тим самим ключем.
            if (deepEqual(mineItem, theirsItem)) {
                resultItems.set(key, theirsItem);
            } else {
                conflicts.push({ path: itemPath, base: null, theirs: theirsItem, mine: mineItem });
                resultItems.set(key, theirsItem);
            }
            continue;
        }

        if (inBase && !inMine && !inTheirs) {
            // Видалено з обох боків.
            continue;
        }

        if (inBase && !inMine && inTheirs) {
            // Я видалив, інший користувач лишив/змінив.
            if (deepEqual(baseItem, theirsItem)) {
                // Не змінювалось у theirs — моє видалення лишається в силі.
                continue;
            }
            conflicts.push({ path: itemPath, base: baseItem, theirs: theirsItem, mine: null });
            resultItems.set(key, theirsItem);
            continue;
        }

        if (inBase && inMine && !inTheirs) {
            // Інший користувач видалив, я лишив/змінив.
            if (deepEqual(baseItem, mineItem)) {
                // Я не змінював — приймаємо чуже видалення.
                continue;
            }
            conflicts.push({ path: itemPath, base: baseItem, theirs: null, mine: mineItem });
            // merged лишає theirs (видалення) до явного вирішення користувачем.
            continue;
        }

        // Присутній у всіх трьох — мердж по полях.
        const fieldKeys = new Set([
            ...Object.keys(baseItem || {}),
            ...Object.keys(theirsItem || {}),
            ...Object.keys(mineItem || {}),
        ]);
        const mergedItem = {};
        for (const field of fieldKeys) {
            const r = mergeScalar(baseItem?.[field], theirsItem?.[field], mineItem?.[field]);
            mergedItem[field] = r.value;
            const fieldPath = `${itemPath}.${field}`;
            if (r.status === 'conflict') {
                conflicts.push({ path: fieldPath, base: r.base, theirs: r.theirs, mine: r.mine });
            } else if (r.status === 'theirs') {
                appliedFromTheirs.push(fieldPath);
            } else if (r.status === 'mine') {
                keptFromMine.push(fieldPath);
            }
        }
        resultItems.set(key, mergedItem);
    }

    // Порядок: якщо елементи мають `position` — сортуємо за нею (тай-брейк за ключем).
    // Інакше — порядок theirs, потім елементи додані лише в mine (у порядку mine).
    const hasPosition = [...baseArr, ...theirsArr, ...mineArr]
        .some((item) => item && Object.prototype.hasOwnProperty.call(item, 'position'));

    const order = [];
    const seen = new Set();
    theirsArr.forEach((item, index) => {
        const key = itemKeyFn(item, index);
        if (resultItems.has(key) && !seen.has(key)) { order.push(key); seen.add(key); }
    });
    mineArr.forEach((item, index) => {
        const key = itemKeyFn(item, index);
        if (resultItems.has(key) && !seen.has(key)) { order.push(key); seen.add(key); }
    });
    for (const key of resultItems.keys()) {
        if (!seen.has(key)) { order.push(key); seen.add(key); }
    }

    if (hasPosition) {
        order.sort((a, b) => {
            const pa = resultItems.get(a)?.position ?? Number.POSITIVE_INFINITY;
            const pb = resultItems.get(b)?.position ?? Number.POSITIVE_INFINITY;
            if (pa !== pb) return pa - pb;
            return String(a).localeCompare(String(b));
        });
    }

    return order.map((key) => resultItems.get(key));
}

/**
 * @param {object} base
 * @param {object} theirs
 * @param {object} mine
 * @param {{itemArrayPaths?: string[], itemKey?: (item: object, index: number) => string, ignoreKeys?: string[]}} [options]
 */
export function threeWayMerge(base, theirs, mine, options = {}) {
    const itemArrayPaths = options.itemArrayPaths || [];
    const itemArrayPathSet = new Set(itemArrayPaths);
    const ignoreKeys = new Set(['id', 'version', ...(options.ignoreKeys || [])]);
    const itemKeyFn = options.itemKey || defaultItemKey;

    const merged = deepClone(theirs);
    const conflicts = [];
    const appliedFromTheirs = [];
    const keptFromMine = [];

    const scalarPaths = new Set();
    collectScalarPaths(base, '', itemArrayPathSet, ignoreKeys, scalarPaths);
    collectScalarPaths(theirs, '', itemArrayPathSet, ignoreKeys, scalarPaths);
    collectScalarPaths(mine, '', itemArrayPathSet, ignoreKeys, scalarPaths);

    for (const path of scalarPaths) {
        const r = mergeScalar(getPath(base, path), getPath(theirs, path), getPath(mine, path));
        setPath(merged, path, r.value);
        if (r.status === 'conflict') {
            conflicts.push({ path, base: r.base, theirs: r.theirs, mine: r.mine });
        } else if (r.status === 'theirs') {
            appliedFromTheirs.push(path);
        } else if (r.status === 'mine') {
            keptFromMine.push(path);
        }
    }

    for (const arrayPath of itemArrayPaths) {
        const baseArr = getPath(base, arrayPath) || [];
        const theirsArr = getPath(theirs, arrayPath) || [];
        const mineArr = getPath(mine, arrayPath) || [];
        const mergedArr = mergeItemArray(
            arrayPath, baseArr, theirsArr, mineArr, itemKeyFn, conflicts, appliedFromTheirs, keptFromMine
        );
        setPath(merged, arrayPath, mergedArr);
    }

    return { merged, conflicts, appliedFromTheirs, keptFromMine };
}
