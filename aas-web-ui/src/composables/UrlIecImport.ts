import { load as parseYaml } from 'js-yaml';
import type { IecCddValidationResult } from '@/types/IecCdd';
import { useIecCddValidator } from '@/composables/IecCddValidator';

export type DatasetFormat = 'json' | 'xml' | 'csv' | 'yaml' | 'html' | 'xlsx' | 'text';

export interface UrlImportPayload {
    metadata: {
        sourceUrl: string;
        contentType: string;
        detectedFormat: DatasetFormat;
        importedAt: string;
    };
    payload: unknown;
    validation: IecCddValidationResult;
}

export interface UrlImportResult {
    success: boolean;
    data?: UrlImportPayload;
    error?: string;
}

export function useUrlIecImport() {
    const { validateAndExtractIecCddData } = useIecCddValidator();

    async function importFileContent(file: File): Promise<UrlImportResult> {
        try {
            const fileName = file.name.toLowerCase();
            let detectedFormat: DatasetFormat = 'text';
            let convertedPayload: unknown;

            if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                detectedFormat = 'xlsx';
                const arrayBuffer = await file.arrayBuffer();
                convertedPayload = await parseXlsxToJson(arrayBuffer);
            } else {
                const rawText = await file.text();
                if (fileName.endsWith('.xml')) detectedFormat = 'xml';
                else if (fileName.endsWith('.json')) detectedFormat = 'json';
                else if (fileName.endsWith('.csv')) detectedFormat = 'csv';
                else if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) detectedFormat = 'yaml';
                else if (fileName.endsWith('.html') || fileName.endsWith('.htm')) detectedFormat = 'html';
                else detectedFormat = detectDatasetFormat('', fileName, rawText);

                convertedPayload = convertRawPayload(detectedFormat, rawText);
            }

            const validation = validateAndExtractIecCddData(convertedPayload, detectedFormat);

            return {
                success: true,
                data: {
                    metadata: {
                        sourceUrl: `file://${file.name}`,
                        contentType: file.type || '',
                        detectedFormat,
                        importedAt: new Date().toISOString(),
                    },
                    payload: convertedPayload,
                    validation,
                },
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: `Could not read file. ${errorMessage}`,
            };
        }
    }

    async function fetchAndConvertUrlContentToJson(url: string): Promise<UrlImportResult> {
        const sanitizedUrl = url.trim();
        if (sanitizedUrl === '') {
            return { success: false, error: 'Please provide a non-empty URL.' };
        }

        try {
            new URL(sanitizedUrl);
        } catch {
            return { success: false, error: 'The provided URL is not valid.' };
        }

        try {
            const fetchUrl = isCddIecUrl(sanitizedUrl)
                ? rewriteCddUrlForProxy(sanitizedUrl)
                : sanitizedUrl;

            const response = await fetch(fetchUrl, {
                method: 'GET',
                headers: {
                    Accept: 'application/json, application/xml, text/xml, text/csv, application/yaml, text/yaml, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/plain',
                },
            });

            if (!response.ok) {
                if (isCddIecUrl(sanitizedUrl)) {
                    return {
                        success: false,
                        error: `Could not fetch from cdd.iec.ch (HTTP ${response.status}). The IEC CDD server blocks direct browser requests (CORS). Please save the webpage as HTML and use "Upload Local File" to import it.`,
                    };
                }
                return {
                    success: false,
                    error: `Request failed with status ${response.status}.`,
                };
            }

            const contentType = response.headers.get('Content-Type')?.split(';')[0]?.toLowerCase() || '';

            const earlyFormat = detectFormatFromContentTypeAndUrl(contentType, sanitizedUrl);
            if (earlyFormat === 'xlsx') {
                const arrayBuffer = await response.arrayBuffer();
                const convertedPayload = await parseXlsxToJson(arrayBuffer);
                const validation = validateAndExtractIecCddData(convertedPayload, 'xlsx');
                return {
                    success: true,
                    data: {
                        metadata: {
                            sourceUrl: sanitizedUrl,
                            contentType,
                            detectedFormat: 'xlsx',
                            importedAt: new Date().toISOString(),
                        },
                        payload: convertedPayload,
                        validation,
                    },
                };
            }

            const rawText = await response.text();
            const detectedFormat = detectDatasetFormat(contentType, sanitizedUrl, rawText);

            if (detectedFormat === 'html' && !isCddIecUrl(sanitizedUrl)) {
                return {
                    success: false,
                    error: 'The URL returned an HTML page, not IEC-CDD data (JSON, XML, CSV, YAML, or XLSX). If you want to import from cdd.iec.ch, use the exact cdd.iec.ch URL or save the page as HTML and use "Upload Local File".',
                };
            }

            const convertedPayload = convertRawPayload(detectedFormat, rawText);
            const validation = validateAndExtractIecCddData(convertedPayload, detectedFormat);

            return {
                success: true,
                data: {
                    metadata: {
                        sourceUrl: sanitizedUrl,
                        contentType,
                        detectedFormat,
                        importedAt: new Date().toISOString(),
                    },
                    payload: convertedPayload,
                    validation,
                },
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (isCddIecUrl(sanitizedUrl)) {
                return {
                    success: false,
                    error: `Could not fetch from cdd.iec.ch. The server may block browser requests (CORS). Please save the webpage as HTML and use "Upload Local File" to import it. (${errorMessage})`,
                };
            }
            return {
                success: false,
                error: `Could not fetch URL content. ${errorMessage}. If this URL is external, the server may block browser CORS requests.`,
            };
        }
    }

    return {
        fetchAndConvertUrlContentToJson,
        importFileContent,
    };
}

function isCddIecUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.hostname === 'cdd.iec.ch' || parsed.hostname.endsWith('.cdd.iec.ch');
    } catch {
        return false;
    }
}

function rewriteCddUrlForProxy(url: string): string {
    const parsed = new URL(url);
    return '/api/iec-proxy' + parsed.pathname + parsed.search;
}

function detectFormatFromContentTypeAndUrl(contentType: string, url: string): DatasetFormat | null {
    if (contentType.includes('spreadsheetml') || contentType.includes('ms-excel')) return 'xlsx';
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.endsWith('.xlsx') || lowerUrl.endsWith('.xls')) return 'xlsx';
    return null;
}

function detectDatasetFormat(contentType: string, url: string, rawText: string): DatasetFormat {
    if (contentType.includes('json')) return 'json';
    if (contentType.includes('html')) return 'html';
    if (contentType.includes('xml')) return 'xml';
    if (contentType.includes('csv')) return 'csv';
    if (contentType.includes('yaml') || contentType.includes('yml')) return 'yaml';
    if (contentType.includes('spreadsheetml') || contentType.includes('ms-excel')) return 'xlsx';

    const lowerUrl = url.toLowerCase();
    if (lowerUrl.endsWith('.json')) return 'json';
    if (lowerUrl.endsWith('.html') || lowerUrl.endsWith('.htm')) return 'html';
    if (lowerUrl.endsWith('.xml')) return 'xml';
    if (lowerUrl.endsWith('.csv')) return 'csv';
    if (lowerUrl.endsWith('.yaml') || lowerUrl.endsWith('.yml')) return 'yaml';
    if (lowerUrl.endsWith('.xlsx') || lowerUrl.endsWith('.xls')) return 'xlsx';

    const trimmed = rawText.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        return 'json';
    }
    if (trimmed.startsWith('<')) {
        const lower = trimmed.substring(0, 200).toLowerCase();
        if (lower.includes('<!doctype html') || lower.includes('<html')) {
            return 'html';
        }
        return 'xml';
    }
    if (trimmed.includes('\n') && trimmed.includes(',')) {
        return 'csv';
    }

    return 'text';
}

function convertRawPayload(format: DatasetFormat, rawText: string): unknown {
    switch (format) {
        case 'json':
            return JSON.parse(rawText);
        case 'xml':
            return parseXmlToJson(rawText);
        case 'csv':
            return parseCsvToJson(rawText);
        case 'yaml':
            return parseYaml(rawText);
        case 'html':
            return { raw: rawText };
        case 'text':
        default:
            return { raw: rawText };
    }
}

async function parseXlsxToJson(data: ArrayBuffer): Promise<Array<Record<string, string>>> {
    const { read, utils } = await import('xlsx');
    const workbook = read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) throw new Error('Excel file contains no sheets.');
    const sheet = workbook.Sheets[firstSheetName];

    const rawRows = utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });

    const iecCddResult = parseIecCddExcelFormat(rawRows);
    if (iecCddResult) return iecCddResult;

    return utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
}

const IEC_CDD_HEADER_MARKERS = ['code', 'preferredname', 'definition', 'primaryunit', 'data_type'];

function parseIecCddExcelFormat(rawRows: string[][]): Array<Record<string, string>> | null {
    let headerRowIndex = -1;
    let headers: string[] = [];

    for (let i = 0; i < Math.min(rawRows.length, 50); i++) {
        const row = rawRows[i];
        if (!row || row.length === 0) continue;

        const firstCell = String(row[0] || '').trim();
        if (firstCell.startsWith('#') && firstCell.toLowerCase().includes('property_name')) {
            headers = row.map((c) => String(c).replace(/^#/, '').trim());
            headerRowIndex = i;
            break;
        }

        const nonEmpty = row.filter((c) => String(c).trim() !== '' && String(c).trim() !== '#');
        const lowerCells = nonEmpty.map((c) => String(c).trim().toLowerCase());
        const matchCount = IEC_CDD_HEADER_MARKERS.filter((m) =>
            lowerCells.some((c) => c.includes(m))
        ).length;
        if (matchCount >= 2) {
            headers = row.map((c) => String(c).replace(/^#/, '').trim());
            headerRowIndex = i;
            break;
        }
    }

    if (headerRowIndex === -1 || headers.length === 0) return null;

    const dataRows: Array<Record<string, string>> = [];
    for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0) continue;

        const nonEmptyCells = row.filter((c: string) => {
            const val = String(c).trim();
            return val !== '' && val !== '#';
        });
        if (nonEmptyCells.length === 0) continue;

        const firstCell = String(row[0] || '').trim();
        if (firstCell.startsWith('#') && firstCell !== '#') continue;

        const obj: Record<string, string> = {};
        let hasData = false;
        for (let j = 0; j < headers.length; j++) {
            const header = headers[j];
            if (!header) continue;
            const value = String(row[j] ?? '').trim();
            obj[header] = value;
            if (value) hasData = true;
        }
        if (hasData) dataRows.push(obj);
    }

    return dataRows.length > 0 ? dataRows : null;
}

function parseXmlToJson(xmlString: string): unknown {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
        throw new Error('XML could not be parsed.');
    }

    const root = xmlDoc.documentElement;
    return {
        [root.nodeName]: xmlNodeToObject(root),
    };
}

function xmlNodeToObject(node: Element): unknown {
    const attributes: Record<string, string> = {};
    for (const attribute of Array.from(node.attributes)) {
        attributes[attribute.name] = attribute.value;
    }

    const elementChildren = Array.from(node.children);
    const textContent = Array.from(node.childNodes)
        .filter((child) => child.nodeType === Node.TEXT_NODE)
        .map((child) => child.textContent?.trim() || '')
        .filter((text) => text !== '')
        .join(' ');

    if (elementChildren.length === 0 && Object.keys(attributes).length === 0) {
        return textContent;
    }

    const childrenObject: Record<string, unknown> = {};

    for (const child of elementChildren) {
        const childObject = xmlNodeToObject(child);
        if (Object.prototype.hasOwnProperty.call(childrenObject, child.nodeName)) {
            const currentValue = childrenObject[child.nodeName];
            if (Array.isArray(currentValue)) {
                currentValue.push(childObject);
            } else {
                childrenObject[child.nodeName] = [currentValue, childObject];
            }
        } else {
            childrenObject[child.nodeName] = childObject;
        }
    }

    return {
        ...(Object.keys(attributes).length > 0 ? { '@attributes': attributes } : {}),
        ...(textContent !== '' ? { '#text': textContent } : {}),
        ...childrenObject,
    };
}

function parseCsvToJson(csvString: string): Array<Record<string, string>> {
    const lines = csvString
        .trim()
        .split(/\r?\n/)
        .filter((line) => line.trim() !== '');

    if (lines.length === 0) {
        return [];
    }

    const headers = splitCsvLine(lines[0]).map((header) => header.trim());

    return lines.slice(1).map((line) => {
        const values = splitCsvLine(line);
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
            const fallbackHeader = `column_${index + 1}`;
            row[header || fallbackHeader] = (values[index] || '').trim();
        });
        return row;
    });
}

function splitCsvLine(line: string): Array<string> {
    const result: Array<string> = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
            continue;
        }

        current += char;
    }

    result.push(current);
    return result;
}
