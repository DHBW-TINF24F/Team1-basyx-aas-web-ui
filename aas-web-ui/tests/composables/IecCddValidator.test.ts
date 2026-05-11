import { describe, expect, it } from 'vitest'
import { mapIecDataTypeToAas, useIecCddValidator } from '@/composables/IecCddValidator'

const { validateAndExtractIecCddData } = useIecCddValidator()

const IRDI_REGEX = /^\d{4}\/\d+\/\/\/\d+.*#[A-Z0-9]+#\d+$/

describe('IecCddValidator.ts; IRDI regex validation', () => {
  const validIrdis = [
    '0112/2///61360_7#AAE664#007',
    '0112/2///61360_7#AAA437#007',
    '0112/2///61360_7#AAB328#004',
  ]

  const invalidIrdis = [
    'R-1001',
    'abc/def',
    '0112/2///61360_7',
    'random-string',
    '',
  ]

  it.each(validIrdis)('should match valid IRDI: %s', irdi => {
    expect(IRDI_REGEX.test(irdi)).toBe(true)
  })

  it.each(invalidIrdis)('should not match invalid IRDI: "%s"', irdi => {
    expect(IRDI_REGEX.test(irdi)).toBe(false)
  })
})

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
    }

    const result = validateAndExtractIecCddData(xmlPayload, 'xml')

    expect(result.isValid).toBe(true)
    expect(result.detectedSchema).toBe('ontoml-xml')
    expect(result.properties).toHaveLength(2)
    expect(result.errors).toHaveLength(0)

    expect(result.properties[0].irdi).toBe('0112/2///61360_7#AAE664#007')
    expect(result.properties[0].preferredName).toBe('Rated voltage')
    expect(result.properties[0].shortName).toBe('U_rated')
    expect(result.properties[0].unit).toBe('V')
    expect(result.properties[0].dataType).toBe('REAL_MEASURE')

    expect(result.properties[1].irdi).toBe('0112/2///61360_7#AAE665#006')
    expect(result.properties[1].preferredName).toBe('Rated current')
  })

  it('should reject XML without OntoML root element', () => {
    const payload = {
      randomRoot: { someData: 'value' },
    }

    const result = validateAndExtractIecCddData(payload, 'xml')
    expect(result.isValid).toBe(false)
    expect(result.detectedSchema).toBe('unknown')
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should reject XML with OntoML root but no properties', () => {
    const payload = {
      catalogue: {
        header: { identification: 'empty' },
      },
    }

    const result = validateAndExtractIecCddData(payload, 'xml')
    expect(result.isValid).toBe(false)
  })

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
    }

    const result = validateAndExtractIecCddData(payload, 'xml')
    expect(result.isValid).toBe(true)
    expect(result.properties).toHaveLength(1)
    expect(result.properties[0].preferredName).toBe('Manufacturer name')
  })
})

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
    ]

    const result = validateAndExtractIecCddData(payload, 'json')
    expect(result.isValid).toBe(true)
    expect(result.detectedSchema).toBe('iec-json')
    expect(result.properties).toHaveLength(2)
  })

  it('should handle snake_case field names', () => {
    const payload = [
      {
        code: '0112/2///61360_7#AAE664#007',
        preferred_name: 'Rated voltage',
        data_type: 'REAL_MEASURE_TYPE',
      },
    ]

    const result = validateAndExtractIecCddData(payload, 'json')
    expect(result.isValid).toBe(true)
    expect(result.properties[0].preferredName).toBe('Rated voltage')
    expect(result.properties[0].dataType).toBe('REAL_MEASURE')
  })

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
    }

    const result = validateAndExtractIecCddData(payload, 'json')
    expect(result.isValid).toBe(true)
    expect(result.properties).toHaveLength(1)
  })

  it('should reject JSON without IEC fields', () => {
    const payload = { users: [{ name: 'Alice', age: 30 }] }

    const result = validateAndExtractIecCddData(payload, 'json')
    expect(result.isValid).toBe(false)
    expect(result.detectedSchema).toBe('unknown')
  })
})

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
    ]

    const result = validateAndExtractIecCddData(payload, 'csv')
    expect(result.isValid).toBe(true)
    expect(result.detectedSchema).toBe('iec-csv')
    expect(result.properties).toHaveLength(2)
  })

  it('should accept CSV with Code and Name headers', () => {
    const payload = [
      { Code: '0112/2///61360_7#AAA437#007', Name: 'Manufacturer name' },
    ]

    const result = validateAndExtractIecCddData(payload, 'csv')
    expect(result.isValid).toBe(true)
    expect(result.properties).toHaveLength(1)
  })

  it('should reject CSV without IRDI/Code column', () => {
    const payload = [
      { Name: 'Something', Unit: 'V' },
    ]

    const result = validateAndExtractIecCddData(payload, 'csv')
    expect(result.isValid).toBe(false)
    expect(result.detectedSchema).toBe('unknown')
  })

  it('should reject empty CSV', () => {
    const result = validateAndExtractIecCddData([], 'csv')
    expect(result.isValid).toBe(false)
  })
})

describe('IecCddValidator.ts; XLSX validation', () => {
  it('should validate XLSX data (same format as CSV) and set correct schema', () => {
    const payload = [
      {
        IRDI: '0112/2///61360_7#AAE664#007',
        PreferredName: 'Rated voltage',
        Unit: 'V',
        DataType: 'REAL_MEASURE_TYPE',
      },
    ]

    const result = validateAndExtractIecCddData(payload, 'xlsx')
    expect(result.isValid).toBe(true)
    expect(result.detectedSchema).toBe('iec-xlsx')
    expect(result.properties).toHaveLength(1)
  })

  it('should reject XLSX without IEC columns', () => {
    const payload = [
      { Name: 'Something', Value: '42' },
    ]

    const result = validateAndExtractIecCddData(payload, 'xlsx')
    expect(result.isValid).toBe(false)
  })
})

describe('IecCddValidator.ts; unsupported format', () => {
  it('should return unknown schema for unsupported formats', () => {
    const result = validateAndExtractIecCddData('some text', 'text')
    expect(result.isValid).toBe(false)
    expect(result.detectedSchema).toBe('unknown')
  })
})

describe('mapIecDataTypeToAas', () => {
  it.each([
    ['REAL_MEASURE_TYPE', 'REAL_MEASURE'],
    ['STRING_TYPE', 'STRING'],
    ['BOOLEAN_TYPE', 'BOOLEAN'],
    ['INTEGER_MEASURE_TYPE', 'INTEGER_MEASURE'],
    ['INTEGER_COUNT_TYPE', 'INTEGER_COUNT'],
    ['REAL_COUNT_TYPE', 'REAL_COUNT'],
    ['REAL_CURRENCY_TYPE', 'REAL_CURRENCY'],
    ['INTEGER_CURRENCY_TYPE', 'INTEGER_CURRENCY'],
    ['DATE_TYPE', 'DATE'],
    ['TIME_TYPE', 'TIME'],
    ['TIMESTAMP_TYPE', 'TIMESTAMP'],
    ['RATIONAL_TYPE', 'RATIONAL'],
    ['RATIONAL_MEASURE_TYPE', 'RATIONAL_MEASURE'],
    ['STRING_TRANSLATABLE_TYPE', 'STRING_TRANSLATABLE'],
    ['IRI_TYPE', 'IRI'],
    ['IRDI_TYPE', 'IRDI'],
    ['FILE_TYPE', 'FILE'],
    ['HTML_TYPE', 'HTML'],
    ['BLOB_TYPE', 'BLOB'],
    ['LEVEL_TYPE', 'STRING'],
    ['ENUM_TYPE', 'STRING'],
  ])('should map IEC CDD type "%s" to AAS type "%s"', (input, expected) => {
    expect(mapIecDataTypeToAas(input)).toBe(expected)
  })

  it.each([
    ['REAL_MEASURE', 'REAL_MEASURE'],
    ['STRING', 'STRING'],
    ['BOOLEAN', 'BOOLEAN'],
    ['DATE', 'DATE'],
  ])('should pass through already-valid AAS type "%s"', (input, expected) => {
    expect(mapIecDataTypeToAas(input)).toBe(expected)
  })

  it('should handle case-insensitive input', () => {
    expect(mapIecDataTypeToAas('real_measure_type')).toBe('REAL_MEASURE')
    expect(mapIecDataTypeToAas('String_Type')).toBe('STRING')
  })

  it('should fallback to STRING for unknown types', () => {
    expect(mapIecDataTypeToAas('UNKNOWN_FORMAT')).toBe('STRING')
  })

  it.each([
    ['LEVEL(NOM) OF REAL_MEASURE_TYPE', 'REAL_MEASURE'],
    ['LEVEL(MIN) OF REAL_MEASURE_TYPE', 'REAL_MEASURE'],
    ['LEVEL(MAX) OF REAL_MEASURE_TYPE', 'REAL_MEASURE'],
    ['LEVEL(TYP) OF REAL_MEASURE_TYPE', 'REAL_MEASURE'],
    ['LEVEL(NOM,MIN,MAX) OF REAL_MEASURE_TYPE', 'REAL_MEASURE'],
    ['LEVEL(NOM) OF INTEGER_MEASURE_TYPE', 'INTEGER_MEASURE'],
    ['SET OF STRING_TYPE', 'STRING'],
    ['BAG OF INTEGER_COUNT_TYPE', 'INTEGER_COUNT'],
    ['LIST OF BOOLEAN_TYPE', 'BOOLEAN'],
    ['LEVEL(NOM) OF REAL_COUNT_TYPE', 'REAL_COUNT'],
  ])('should handle compound IEC expression "%s" → "%s"', (input, expected) => {
    expect(mapIecDataTypeToAas(input)).toBe(expected)
  })

  it('should return undefined for empty or undefined input', () => {
    expect(mapIecDataTypeToAas('')).toBeUndefined()
    expect(mapIecDataTypeToAas(undefined)).toBeUndefined()
  })

  it.each([
    ['URL_TYPE', 'IRI'],
    ['URI_TYPE', 'IRI'],
    ['URL', 'IRI'],
    ['URI', 'IRI'],
    ['NUMBER_TYPE', 'REAL_COUNT'],
    ['DATE_TIME_TYPE', 'TIMESTAMP'],
    ['DATETIME_TYPE', 'TIMESTAMP'],
    ['BINARY_TYPE', 'BLOB'],
    ['HTML5_TYPE', 'HTML'],
    ['NON_TRANSLATABLE_STRING_TYPE', 'STRING'],
    ['TRANSLATABLE_STRING_TYPE', 'STRING_TRANSLATABLE'],
    ['CLASS_REFERENCE_TYPE', 'IRDI'],
    ['REFERENCE_TYPE', 'IRI'],
    ['SET_TYPE', 'STRING'],
    ['RANGE_TYPE', 'STRING'],
    ['INT_TYPE', 'INTEGER_COUNT'],
    ['IRDI_STRING', 'IRDI'],
    ['CURRENCY_TYPE', 'REAL_CURRENCY'],
  ])('should map additional IEC CDD type "%s" to AAS type "%s"', (input, expected) => {
    expect(mapIecDataTypeToAas(input)).toBe(expected)
  })
})

describe('IecCddValidator.ts; dataType mapping in extraction', () => {
  it('should map REAL_MEASURE_TYPE to REAL_MEASURE in XML extraction', () => {
    const payload = {
      catalogue: {
        contained_properties: {
          property: {
            code: '0112/2///61360_4#AAF286#003',
            preferred_name: {
              label: { '@attributes': { language: 'en' }, '#text': 'max. torque' },
            },
            data_type: 'REAL_MEASURE_TYPE',
            unit: { short_name: 'N\u00B7m' },
          },
        },
      },
    }

    const result = validateAndExtractIecCddData(payload, 'xml')
    expect(result.isValid).toBe(true)
    expect(result.properties[0].dataType).toBe('REAL_MEASURE')
  })

  it('should map STRING_TYPE to STRING in JSON extraction', () => {
    const payload = [
      {
        irdi: '0112/2///61360_7#AAA437#007',
        preferredName: 'Manufacturer name',
        dataType: 'STRING_TYPE',
      },
    ]

    const result = validateAndExtractIecCddData(payload, 'json')
    expect(result.isValid).toBe(true)
    expect(result.properties[0].dataType).toBe('STRING')
  })

  it('should map data types in XLSX extraction', () => {
    const payload = [
      {
        IRDI: '0112/2///61360_4#AAF286#003',
        PreferredName: 'max. torque',
        DataType: 'REAL_MEASURE_TYPE',
        Unit: 'N\u00B7m',
      },
    ]

    const result = validateAndExtractIecCddData(payload, 'xlsx')
    expect(result.isValid).toBe(true)
    expect(result.properties[0].dataType).toBe('REAL_MEASURE')
  })

  it('should fallback unknown data types to STRING', () => {
    const payload = [
      {
        irdi: '0112/2///61360_7#AAE664#007',
        preferredName: 'Test property',
        dataType: 'CUSTOM_UNKNOWN',
      },
    ]

    const result = validateAndExtractIecCddData(payload, 'json')
    expect(result.isValid).toBe(true)
    expect(result.properties[0].dataType).toBe('STRING')
  })
})

describe('IecCddValidator.ts; Unicode NFC normalization', () => {
  it('should handle NFC-normalized strings from XLSX data', () => {
    // Simulate NFD decomposed 'ö' (o + combining umlaut) vs NFC 'ö'
    const nfdString = 'Gro\u0308sse' // 'Größe' in NFD
    const nfcString = 'Gr\u00F6sse' // 'Größe' in NFC

    const payload = [
      {
        IRDI: '0112/2///61360_7#AAE664#007',
        PreferredName: nfdString,
        Unit: 'V',
      },
    ]

    const result = validateAndExtractIecCddData(payload, 'xlsx')
    expect(result.isValid).toBe(true)
    // The validator processes strings as-is; NFC normalization happens in IecFileImport
    // This test verifies extraction still works with non-NFC strings
    expect(result.properties[0].preferredName).toBeDefined()
  })
})
