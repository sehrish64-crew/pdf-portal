import type { Report } from '../types';

const STORAGE_KEY = 'vehicle-inspector-reports';

function readReports(): Report[] {
  try {
    const storedReports = localStorage.getItem(STORAGE_KEY);
    if (!storedReports) return [];

    const parsedReports: unknown = JSON.parse(storedReports);
    return Array.isArray(parsedReports) ? parsedReports as Report[] : [];
  } catch {
    return [];
  }
}

export function getLocalReport(id: string): Report | null {
  return readReports().find((report) => report.id === id) ?? null;
}

export function getLocalReports(): Report[] {
  return readReports().sort(
    (first, second) => Date.parse(second.updated_at) - Date.parse(first.updated_at)
  );
}

export function saveLocalReport(report: Report): void {
  const reports = readReports();
  const existingIndex = reports.findIndex((item) => item.id === report.id);

  if (existingIndex === -1) {
    reports.unshift(report);
  } else {
    reports[existingIndex] = report;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

export function deleteLocalReport(id: string): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(readReports().filter((report) => report.id !== id))
  );
}