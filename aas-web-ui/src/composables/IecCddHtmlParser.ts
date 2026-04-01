import type { IecCddProperty } from '@/types/IecCdd';

const IRDI_REGEX = /\d{4}\/\d+\/\/\/\d+.*#[A-Z0-9]+#\d+/;

const LABEL_MAP: Record<string, keyof IecCddProperty> = {
    irdi: 'irdi',
    code: 'irdi',
    identifier: 'irdi',
    'preferred name': 'preferredName',
    preferredname: 'preferredName',
    preferred_name: 'preferredName',
    name: 'preferredName',
    'short name': 'shortName',
    shortname: 'shortName',
    short_name: 'shortName',
    definition: 'definition',
    unit: 'unit',
    'unit of measure': 'unit',
    'data type': 'dataType',
    datatype: 'dataType',
    data_type: 'dataType',
    version: 'versionNumber',
    'version number': 'versionNumber',
    versionnumber: 'versionNumber',
    version_number: 'versionNumber',
    'source of definition': 'sourceOfDefinition',
    sourceofdefinition: 'sourceOfDefinition',
    source_of_definition: 'sourceOfDefinition',
    'value format': 'valueFormat',
    valueformat: 'valueFormat',
    value_format: 'valueFormat',
    symbol: 'unit',
};

export function useIecCddHtmlParser() {
    function parseIecCddHtml(htmlText: string): IecCddProperty[] {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        const propertiesFromTables = extractFromTables(doc);
        if (propertiesFromTables.length > 0) return propertiesFromTables;

        const propertyFromText = extractFromTextContent(doc);
        if (propertyFromText) return [propertyFromText];

        return [];
    }

    return { parseIecCddHtml };
}

function extractFromTables(doc: Document): IecCddProperty[] {
    const tables = doc.querySelectorAll('table');
    const properties: IecCddProperty[] = [];
    const fieldMaps: Map<string, string>[] = [];

    for (const table of tables) {
        const rows = table.querySelectorAll('tr');
        const fieldMap = new Map<string, string>();

        for (const row of rows) {
            const cells = row.querySelectorAll('td, th');
            if (cells.length >= 2) {
                const labelText = normalizeLabel(cells[0].textContent?.trim() || '');
                const valueText = cells[1].textContent?.trim() || '';
                if (labelText && valueText) {
                    const mappedField = LABEL_MAP[labelText];
                    if (mappedField && !fieldMap.has(mappedField)) {
                        fieldMap.set(mappedField, extractPreferredLanguage(valueText));
                    }
                }
            }
        }

        if (fieldMap.has('irdi') || fieldMap.has('preferredName')) {
            fieldMaps.push(fieldMap);
        }
    }

    if (fieldMaps.length === 0) {
        const allRows = doc.querySelectorAll('tr');
        const combinedMap = new Map<string, string>();
        for (const row of allRows) {
            const cells = row.querySelectorAll('td, th');
            if (cells.length >= 2) {
                const labelText = normalizeLabel(cells[0].textContent?.trim() || '');
                const valueText = cells[1].textContent?.trim() || '';
                if (labelText && valueText) {
                    const mappedField = LABEL_MAP[labelText];
                    if (mappedField && !combinedMap.has(mappedField)) {
                        combinedMap.set(mappedField, extractPreferredLanguage(valueText));
                    }
                }
            }
        }
        if (combinedMap.has('irdi') || combinedMap.has('preferredName')) {
            fieldMaps.push(combinedMap);
        }
    }

    for (const fieldMap of fieldMaps) {
        if (!fieldMap.has('irdi')) {
            const bodyText = doc.body?.textContent || '';
            const irdiMatch = bodyText.match(IRDI_REGEX);
            if (irdiMatch) {
                fieldMap.set('irdi', irdiMatch[0]);
            }
        }

        const irdi = fieldMap.get('irdi');
        const preferredName = fieldMap.get('preferredName');
        if (irdi || preferredName) {
            properties.push({
                irdi: irdi || 'unknown',
                preferredName: preferredName || irdi || 'unknown',
                shortName: fieldMap.get('shortName'),
                definition: fieldMap.get('definition'),
                unit: fieldMap.get('unit'),
                dataType: fieldMap.get('dataType'),
                versionNumber: fieldMap.get('versionNumber'),
                sourceOfDefinition: fieldMap.get('sourceOfDefinition'),
                valueFormat: fieldMap.get('valueFormat'),
            });
        }
    }

    return properties;
}

function extractFromTextContent(doc: Document): IecCddProperty | null {
    const bodyText = doc.body?.textContent || '';
    if (!bodyText.trim()) return null;

    const irdiMatch = bodyText.match(IRDI_REGEX);
    if (!irdiMatch) return null;

    const fieldMap = new Map<string, string>();
    fieldMap.set('irdi', irdiMatch[0]);

    const lines = bodyText.split(/\n/).map((l) => l.trim()).filter((l) => l);
    for (const line of lines) {
        const separators = [':', '=', '\t'];
        for (const sep of separators) {
            const sepIndex = line.indexOf(sep);
            if (sepIndex > 0 && sepIndex < line.length - 1) {
                const label = normalizeLabel(line.substring(0, sepIndex).trim());
                const value = line.substring(sepIndex + 1).trim();
                const mappedField = LABEL_MAP[label];
                if (mappedField && value && !fieldMap.has(mappedField)) {
                    fieldMap.set(mappedField, extractPreferredLanguage(value));
                }
                break;
            }
        }
    }

    const irdi = fieldMap.get('irdi') || irdiMatch[0];
    const preferredName = fieldMap.get('preferredName');

    if (!preferredName) return null;

    return {
        irdi,
        preferredName,
        shortName: fieldMap.get('shortName'),
        definition: fieldMap.get('definition'),
        unit: fieldMap.get('unit'),
        dataType: fieldMap.get('dataType'),
        versionNumber: fieldMap.get('versionNumber'),
        sourceOfDefinition: fieldMap.get('sourceOfDefinition'),
        valueFormat: fieldMap.get('valueFormat'),
    };
}

function normalizeLabel(raw: string): string {
    return raw
        .replace(/[:\-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function extractPreferredLanguage(text: string): string {
    const enMatch = text.match(/\ben[:\s]*["\u201C]?([^"\u201D\n]+)["\u201D]?/i);
    if (enMatch) return enMatch[1].trim();
    return text.split(/[,;|]/).map((s) => s.trim()).filter((s) => s)[0] || text;
}
