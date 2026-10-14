import type { ProjectListPage } from '../../../packages/contracts/project-browser';
import { operationErrorText } from './operation-error-text';
import { useEffect, useState, useRef } from 'react';
import type { WorkspaceState } from '../../../packages/contracts';
import type { Locale } from './locale';
import { words } from './StudentUI';
export function useProjectBrowser(projectId: string, locale: Locale, setStatus: (message: string) => void, query: string) {
    const w = (en: string, ru: string, kk: string) => words(locale, en, ru, kk);
    const [data, setData] = useState<WorkspaceState | null>(null), [versions, setVersions] = useState<{
        id: number;
        label: string;
        createdAt: string;
    }[]>([]);
    const [items, setItems] = useState<ProjectListPage['items']>([]), [total, setTotal] = useState(0);
    const loadedProject = useRef<string | null>(null);
    const request = useRef(0), [refreshing, setRefreshing] = useState(false);
    const refresh = async (append = false, metadata = true) => {
        const token = ++request.current;
        setRefreshing(true);
        const results = await Promise.allSettled([metadata ? Promise.resolve().then(() => window.jective.workspace()) : Promise.resolve(null), metadata ? Promise.resolve().then(() => window.jective.snapshots(projectId)) : Promise.resolve(null), Promise.resolve().then(() => window.jective.projectList({ query, offset: append ? items.length : 0, limit: 50 }))]);
        if (token !== request.current)
            return;
        const [workspace, snapshots, projects] = results;
        const errors: string[] = [];
        if (workspace.status === 'fulfilled') {
            if (workspace.value?.ok) {
                setData(workspace.value.value);
                loadedProject.current = projectId;
            }
            else if (workspace.value)
                errors.push(operationErrorText(workspace.value.error, locale));
        }
        else
            errors.push(w('Projects could not be loaded. Try Refresh.', '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u043f\u0440\u043e\u0435\u043a\u0442\u044b. \u041d\u0430\u0436\u043c\u0438 \u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c.', '\u0416\u043e\u0431\u0430\u043b\u0430\u0440\u0434\u044b \u0436\u04af\u043a\u0442\u0435\u0443 \u043c\u04af\u043c\u043a\u0456\u043d \u0431\u043e\u043b\u043c\u0430\u0434\u044b. \u0416\u0430\u04a3\u0430\u0440\u0442\u0443\u0434\u044b \u0431\u0430\u0441.'));
        if (snapshots.status === 'fulfilled') {
            if (snapshots.value?.ok)
                setVersions(snapshots.value.value);
            else if (snapshots.value)
                errors.push(operationErrorText(snapshots.value.error, locale));
        }
        else
            errors.push(w('Saved versions could not be loaded. Try Refresh.', '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0432\u0435\u0440\u0441\u0438\u0438. \u041d\u0430\u0436\u043c\u0438 \u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c.', '\u041d\u04b1\u0441\u049b\u0430\u043b\u0430\u0440\u0434\u044b \u0436\u04af\u043a\u0442\u0435\u0443 \u043c\u04af\u043c\u043a\u0456\u043d \u0431\u043e\u043b\u043c\u0430\u0434\u044b. \u0416\u0430\u04a3\u0430\u0440\u0442\u0443\u0434\u044b \u0431\u0430\u0441.'));
        if (projects.status === 'fulfilled') {
            if (projects.value.ok) {
                const page = projects.value.value;
                setItems(previous => {
                    if (!append)
                        return page.items;
                    const existing = new Set(previous.map(item => item.id));
                    return [...previous, ...page.items.filter(item => !existing.has(item.id))];
                });
                setTotal(page.total);
            }
            else
                errors.push(operationErrorText(projects.value.error, locale));
        }
        else
            errors.push(w('Projects could not be loaded. Try Refresh.', '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u043f\u0440\u043e\u0435\u043a\u0442\u044b.', '\u0416\u043e\u0431\u0430\u043b\u0430\u0440 \u0436\u04af\u043a\u0442\u0435\u043b\u043c\u0435\u0434\u0456.'));
        if (errors.length)
            setStatus(errors.join(' '));
        setRefreshing(false);
    };
    useEffect(() => {
        const metadata = loadedProject.current !== projectId;
        if (metadata) {
            setVersions([]);
            setData(null);
        }
        setItems([]);
        setTotal(0);
        setRefreshing(true);
        const timer = setTimeout(() => void refresh(false, metadata), metadata ? 0 : 180);
        return () => {
            clearTimeout(timer);
            request.current++;
        };
    }, [projectId, query]);
    return { data, versions, refresh: () => refresh(), refreshing, items, total, loadMore: () => refresh(true, false) };
}
