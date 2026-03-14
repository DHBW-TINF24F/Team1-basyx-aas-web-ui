import { load as parseYaml } from 'js-yaml';

export type DatasetFormat = 'json' | 'xml' | 'csv' | 'yaml' | 'text';

export interface UrlImportPayload {
    metadata: {
        sourceUrl: string;
        contentType: string;
        detectedFormat: DatasetFormat;
        importedAt: string;
    };
    payload: unknown;
}

export interface UrlImportResult {
    success: boolean;
    data?: UrlImportPayload;
    error?: string;
}

export function useUrlIecImport() {
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
            const response = await fetch(sanitizedUrl, {
                method: 'GET',
                headers: {
                    Accept: 'application/json, application/xml, text/xml, text/csv, application/yaml, text/yaml, text/plain',
                },
            });

            if (!response.ok) {
                return {
                    success: false,
                    error: `Request failed with status ${response.status}.`,
                };
            }

            const contentType = response.headers.get('Content-Type')?.split(';')[0]?.toLowerCase() || '';
            const rawText = await response.text();
            const detectedFormat = detectDatasetFormat(contentType, sanitizedUrl, rawText);
            const convertedPayload = convertRawPayload(detectedFormat, rawText);

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
                },
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: `Could not fetch URL content. ${errorMessage}. If this URL is external, the server may block browser CORS requests.`,
            };
        }
    }

    return {
        fetchAndConvertUrlContentToJson,
    };
}

function detectDatasetFormat(contentType: string, url: string, rawText: string): DatasetFormat {
    if (contentType.includes('json')) return 'json';
    if (contentType.includes('xml')) return 'xml';
    if (contentType.includes('csv')) return 'csv';
    if (contentType.includes('yaml') || contentType.includes('yml')) return 'yaml';

    const lowerUrl = url.toLowerCase();
    if (lowerUrl.endsWith('.json')) return 'json';
    if (lowerUrl.endsWith('.xml')) return 'xml';
    if (lowerUrl.endsWith('.csv')) return 'csv';
    if (lowerUrl.endsWith('.yaml') || lowerUrl.endsWith('.yml')) return 'yaml';

    const trimmed = rawText.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        return 'json';
    }
    if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
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
        case 'text':
        default:
            return { raw: rawText };
    }
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
