import { describe, expect, it } from 'vitest';
import { useIecCddValidator } from '@/composables/IecCddValidator';

const { validateAndExtractIecCddData } = useIecCddValidator();

const IRDI_REGEX = /^\d{4}\/\d+\/\/\/\d+.*#[A-Z0-9]+#\d+$/;

describe('IecCddValidator.ts; IRDI regex validation', () => {
    const validIrdis = [
        '0112/2///61360_7#AAE664#007',
        '0112/2///61360_7#AAA437#007',
        '0112/2///61360_7#AAB328#004',
    ];

    const invalidIrdis = [
        'R-1001',
        'abc/def',
        '0112/2///61360_7',
        'random-string',
        '',
    ];

    it.each(validIrdis)('should match valid IRDI: %s', (irdi) => {
        expect(IRDI_REGEX.test(irdi)).toBe(true);
    });

    it.each(invalidIrdis)('should not match invalid IRDI: "%s"', (irdi) => {
        expect(IRDI_REGEX.test(irdi)).toBe(false);
    });
});

describe('IecCddValidator.ts; OntoML XML validation', () => {
    it('should extract properties from valid OntoML XML payload', () => {
        const xmlPayload = {
            catalogue: {
                header: { identification: 'test' },
                contained_properties: {
                    property: [
                        {
                            code: '0112/2///61360_7#AAE664#007',
                            preferred_name: {
                                label: [
                                    { '@attributes': { language: 'en' }, '#text': 'Rated voltage' },
                                    { '@attributes': { language: 'de' }, '#text': 'Bemessungsspannung' },
                                ],
                            },
                            short_name: 'U_rated',
                            definition: {
                                text: { '@attributes': { language: 'en' }, '#text': 'Voltage value assigned by manufacturer' },
                            },
                            unit: { short_name: 'V' },
                            data_type: 'REAL_MEASURE_TYPE',
                        },
                        {
                            code: '0112/2///61360_7#AAE665#006',
                            preferred_name: {
                                label: { '@attributes': { language: 'en' }, '#text': 'Rated current' },
                            },
                            short_name: 'I_rated',
                            unit: { short_name: 'A' },
                            data_type: 'REAL_MEASURE_TYPE',
                        },
                    ],
                },
            },
        };

        const result = validateAndExtractIecCddData(xmlPayload, 'xml');

        expect(result.isValid).toBe(true);
        expect(result.detectedSchema).toBe('ontoml-xml');
        expect(result.properties).toHaveLength(2);
        expect(result.errors).toHaveLength(0);

        expect(result.properties[0].irdi).toBe('0112/2///61360_7#AAE664#007');
        expect(result.properties[0].preferredName).toBe('Rated voltage');
        expect(result.properties[0].shortName).toBe('U_rated');
        expect(result.properties[0].unit).toBe('V');
        expect(result.properties[0].dataType).toBe('REAL_MEASURE_TYPE');

        expect(result.properties[1].irdi).toBe('0112/2///61360_7#AAE665#006');
        expect(result.properties[1].preferredName).toBe('Rated current');
    });

    it('should reject XML without OntoML root element', () => {
        const payload = {
            randomRoot: { someData: 'value' },
        };

        const result = validateAndExtractIecCddData(payload, 'xml');
        expect(result.isValid).toBe(false);
        expect(result.detectedSchema).toBe('unknown');
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject XML with OntoML root but no properties', () => {
        const payload = {
            catalogue: {
                header: { identification: 'empty' },
            },
        };

        const result = validateAndExtractIecCddData(payload, 'xml');
        expect(result.isValid).toBe(false);
    });

    it('should handle single property (not array)', () => {
        const payload = {
            catalogue: {
                contained_properties: {
                    property: {
                        code: '0112/2///61360_7#AAA437#007',
                        preferred_name: {
                            label: { '@attributes': { language: 'en' }, '#text': 'Manufacturer name' },
                        },
                        data_type: 'STRING_TYPE',
                    },
                },
            },
        };

        const result = validateAndExtractIecCddData(payload, 'xml');
        expect(result.isValid).toBe(true);
        expect(result.properties).toHaveLength(1);
        expect(result.properties[0].preferredName).toBe('Manufacturer name');
    });
});

describe('IecCddValidator.ts; JSON validation', () => {
    it('should extract properties from JSON array with IEC fields', () => {
        const payload = [
            {
                irdi: '0112/2///61360_7#AAE664#007',
                preferredName: 'Rated voltage',
                unit: 'V',
                dataType: 'REAL_MEASURE_TYPE',
            },
            {
                irdi: '0112/2///61360_7#AAE665#006',
                preferredName: 'Rated current',
                unit: 'A',
                dataType: 'REAL_MEASURE_TYPE',
            },
        ];

        const result = validateAndExtractIecCddData(payload, 'json');
        expect(result.isValid).toBe(true);
        expect(result.detectedSchema).toBe('iec-json');
        expect(result.properties).toHaveLength(2);
    });

    it('should handle snake_case field names', () => {
        const payload = [
            {
                code: '0112/2///61360_7#AAE664#007',
                preferred_name: 'Rated voltage',
                data_type: 'REAL_MEASURE_TYPE',
            },
        ];

        const result = validateAndExtractIecCddData(payload, 'json');
        expect(result.isValid).toBe(true);
        expect(result.properties[0].preferredName).toBe('Rated voltage');
        expect(result.properties[0].dataType).toBe('REAL_MEASURE_TYPE');
    });

    it('should find nested property arrays', () => {
        const payload = {
            data: {
                properties: [
                    {
                        irdi: '0112/2///61360_7#AAE664#007',
                        preferredName: 'Rated voltage',
                    },
                ],
            },
        };

        const result = validateAndExtractIecCddData(payload, 'json');
        expect(result.isValid).toBe(true);
        expect(result.properties).toHaveLength(1);
    });

    it('should reject JSON without IEC fields', () => {
        const payload = { users: [{ name: 'Alice', age: 30 }] };

        const result = validateAndExtractIecCddData(payload, 'json');
        expect(result.isValid).toBe(false);
        expect(result.detectedSchema).toBe('unknown');
    });
});

describe('IecCddValidator.ts; CSV validation', () => {
    it('should extract properties from CSV with correct headers', () => {
        const payload = [
            {
                IRDI: '0112/2///61360_7#AAE664#007',
                PreferredName: 'Rated voltage',
                Unit: 'V',
                DataType: 'REAL_MEASURE_TYPE',
            },
            {
                IRDI: '0112/2///61360_7#AAE665#006',
                PreferredName: 'Rated current',
                Unit: 'A',
                DataType: 'REAL_MEASURE_TYPE',
            },
        ];

        const result = validateAndExtractIecCddData(payload, 'csv');
        expect(result.isValid).toBe(true);
        expect(result.detectedSchema).toBe('iec-csv');
        expect(result.properties).toHaveLength(2);
    });

    it('should accept CSV with Code and Name headers', () => {
        const payload = [
            { Code: '0112/2///61360_7#AAA437#007', Name: 'Manufacturer name' },
        ];

        const result = validateAndExtractIecCddData(payload, 'csv');
        expect(result.isValid).toBe(true);
        expect(result.properties).toHaveLength(1);
    });

    it('should reject CSV without IRDI/Code column', () => {
        const payload = [
            { Name: 'Something', Unit: 'V' },
        ];

        const result = validateAndExtractIecCddData(payload, 'csv');
        expect(result.isValid).toBe(false);
        expect(result.detectedSchema).toBe('unknown');
    });

    it('should reject empty CSV', () => {
        const result = validateAndExtractIecCddData([], 'csv');
        expect(result.isValid).toBe(false);
    });
});

describe('IecCddValidator.ts; XLSX validation', () => {
    it('should validate XLSX data (same format as CSV) and set correct schema', () => {
        const payload = [
            {
                IRDI: '0112/2///61360_7#AAE664#007',
                PreferredName: 'Rated voltage',
                Unit: 'V',
                DataType: 'REAL_MEASURE_TYPE',
            },
        ];

        const result = validateAndExtractIecCddData(payload, 'xlsx');
        expect(result.isValid).toBe(true);
        expect(result.detectedSchema).toBe('iec-xlsx');
        expect(result.properties).toHaveLength(1);
    });

    it('should reject XLSX without IEC columns', () => {
        const payload = [
            { Name: 'Something', Value: '42' },
        ];

        const result = validateAndExtractIecCddData(payload, 'xlsx');
        expect(result.isValid).toBe(false);
    });
});

describe('IecCddValidator.ts; unsupported format', () => {
    it('should return unknown schema for unsupported formats', () => {
        const result = validateAndExtractIecCddData('some text', 'text');
        expect(result.isValid).toBe(false);
        expect(result.detectedSchema).toBe('unknown');
    });
});
