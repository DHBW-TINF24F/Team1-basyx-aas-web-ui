import type { IecCddProperty, IecCddValidationResult } from '@/types/IecCdd'

const IRDI_REGEX = /^\d{4}\/\d+\/\/\/\d+.*#[A-Z0-9]+#\d+$/

/**
 * Valid AAS DataTypeIec61360 values per IDTA-01003-a v3.1.1.
 */
const VALID_AAS_DATA_TYPES = new Set([
  'DATE',
  'STRING',
  'STRING_TRANSLATABLE',
  'INTEGER_MEASURE',
  'INTEGER_COUNT',
  'INTEGER_CURRENCY',
  'REAL_MEASURE',
  'REAL_COUNT',
  'REAL_CURRENCY',
  'BOOLEAN',
  'IRI',
  'IRDI',
  'RATIONAL',
  'RATIONAL_MEASURE',
  'TIME',
  'TIMESTAMP',
  'FILE',
  'HTML',
  'BLOB',
])

/**
 * Maps IEC CDD data type names to valid AAS DataTypeIec61360 values.
 * IEC CDD typically appends '_TYPE' (e.g. 'REAL_MEASURE_TYPE' → 'REAL_MEASURE').
 */
const IEC_CDD_TO_AAS_DATA_TYPE: Record<string, string> = {
  // Direct IEC CDD _TYPE suffix variants
  REAL_MEASURE_TYPE: 'REAL_MEASURE',
  REAL_COUNT_TYPE: 'REAL_COUNT',
  REAL_CURRENCY_TYPE: 'REAL_CURRENCY',
  INTEGER_MEASURE_TYPE: 'INTEGER_MEASURE',
  INTEGER_COUNT_TYPE: 'INTEGER_COUNT',
  INTEGER_CURRENCY_TYPE: 'INTEGER_CURRENCY',
  STRING_TYPE: 'STRING',
  STRING_TRANSLATABLE_TYPE: 'STRING_TRANSLATABLE',
  BOOLEAN_TYPE: 'BOOLEAN',
  DATE_TYPE: 'DATE',
  TIME_TYPE: 'TIME',
  TIMESTAMP_TYPE: 'TIMESTAMP',
  RATIONAL_TYPE: 'RATIONAL',
  RATIONAL_MEASURE_TYPE: 'RATIONAL_MEASURE',
  IRI_TYPE: 'IRI',
  IRDI_TYPE: 'IRDI',
  FILE_TYPE: 'FILE',
  HTML_TYPE: 'HTML',
  BLOB_TYPE: 'BLOB',
  // Abbreviated IEC CDD variants
  REAL_TYPE: 'REAL_MEASURE',
  INTEGER_TYPE: 'INTEGER_COUNT',
  INT_TYPE: 'INTEGER_COUNT',
  INT_MEASURE_TYPE: 'INTEGER_MEASURE',
  INT_COUNT_TYPE: 'INTEGER_COUNT',
  INT_CURRENCY_TYPE: 'INTEGER_CURRENCY',
  // IEC 61360 types without direct AAS equivalent (mapped to closest match)
  NUMBER_TYPE: 'REAL_COUNT',
  LEVEL_TYPE: 'STRING',
  ENUM_TYPE: 'STRING',
  SET_TYPE: 'STRING',
  BAG_TYPE: 'STRING',
  ARRAY_TYPE: 'STRING',
  LIST_TYPE: 'STRING',
  RANGE_TYPE: 'STRING',
  CURRENCY_TYPE: 'REAL_CURRENCY',
  // URI / URL / reference variants → IRI or IRDI
  URL_TYPE: 'IRI',
  URI_TYPE: 'IRI',
  URL: 'IRI',
  URI: 'IRI',
  REFERENCE_TYPE: 'IRI',
  CLASS_REFERENCE_TYPE: 'IRDI',
  IRDI_STRING: 'IRDI',
  // Alternative naming conventions from various IEC 61360 versions
  DATE_TIME_TYPE: 'TIMESTAMP',
  DATETIME_TYPE: 'TIMESTAMP',
  NON_TRANSLATABLE_STRING_TYPE: 'STRING',
  TRANSLATABLE_STRING_TYPE: 'STRING_TRANSLATABLE',
  BINARY_TYPE: 'BLOB',
  HTML5_TYPE: 'HTML',
}

/**
 * Maps a raw IEC CDD data type string to a valid AAS DataTypeIec61360 value.
 * Returns the mapped value, or undefined if no mapping is found.
 */
export function mapIecDataTypeToAas (raw: string | undefined): string | undefined {
  if (!raw) {
    return undefined
  }
  const upper = raw.trim().toUpperCase()
  if (VALID_AAS_DATA_TYPES.has(upper)) {
    return upper
  }
  const mapped = IEC_CDD_TO_AAS_DATA_TYPE[upper]
  if (mapped) {
    return mapped
  }
  // Handle compound IEC 61360 expressions like "LEVEL(NOM) OF REAL_MEASURE_TYPE"
  // or "SET OF STRING_TYPE". Extract the base type after "OF ".
  const ofIndex = upper.lastIndexOf(' OF ')
  if (ofIndex !== -1) {
    const baseType = upper.slice(ofIndex + 4).trim()
    return mapIecDataTypeToAas(baseType)
  }
  // Try stripping _TYPE suffix as a generic fallback
  if (upper.endsWith('_TYPE')) {
    const stripped = upper.slice(0, -5)
    if (VALID_AAS_DATA_TYPES.has(stripped)) {
      return stripped
    }
  }
  // Fallback: unmapped IEC data types default to STRING to avoid
  // sending invalid data type values to the AAS server.
  return 'STRING'
}

const ONTOML_ROOT_ELEMENTS = new Set(['catalogue', 'dictionary'])
const ONTOML_PROPERTY_CONTAINERS = ['contained_properties', 'properties']

const CSV_IRDI_HEADERS = new Set(['irdi', 'code', 'property_name.en'])
const CSV_NAME_HEADERS = new Set(['preferredname', 'preferred_name', 'name', 'preferredname.en'])

export function useIecCddValidator () {
  function validateAndExtractIecCddData (
    payload: unknown,
    format: string,
  ): IecCddValidationResult {
    switch (format) {
      case 'xml': {
        return validateOntoMlXml(payload)
      }
      case 'json': {
        return validateIecJson(payload)
      }
      case 'csv': {
        return validateIecCsv(payload)
      }
      case 'xlsx': {
        const result = validateIecCsv(payload)
        if (result.detectedSchema !== 'unknown') {
          result.detectedSchema = 'iec-xlsx'
        }
        return result
      }
      default: {
        return {
          isValid: false,
          properties: [],
          warnings: [],
          errors: [`Format "${format}" is not supported for IEC-CDD validation.`],
          detectedSchema: 'unknown',
        }
      }
    }
  }

  return { validateAndExtractIecCddData }
}

function isIrdi (value: string): boolean {
  return IRDI_REGEX.test(value)
}

function validateOntoMlXml (payload: unknown): IecCddValidationResult {
  const result: IecCddValidationResult = {
    isValid: false,
    properties: [],
    warnings: [],
    errors: [],
    detectedSchema: 'ontoml-xml',
  }

  if (payload == null || typeof payload !== 'object') {
    result.errors.push('Payload is not a valid parsed XML object.')
    result.detectedSchema = 'unknown'
    return result
  }

  const root = payload as Record<string, unknown>
  const rootKey = Object.keys(root).find(key =>
    ONTOML_ROOT_ELEMENTS.has(key.toLowerCase()),
  )

  if (!rootKey) {
    result.errors.push(
      'No recognized OntoML root element found (expected: catalogue, dictionary).',
    )
    result.detectedSchema = 'unknown'
    return result
  }

  const rootContent = root[rootKey] as Record<string, unknown>
  if (!rootContent || typeof rootContent !== 'object') {
    result.errors.push('Root element content is empty or invalid.')
    return result
  }

  const propertiesContainer = findNestedKey(rootContent, ONTOML_PROPERTY_CONTAINERS)
  if (!propertiesContainer || typeof propertiesContainer !== 'object') {
    result.errors.push('No contained_properties or properties element found.')
    return result
  }

  const container = propertiesContainer as Record<string, unknown>
  const propertyNodes = normalizeToArray(container['property'] ?? container['Property'])

  if (propertyNodes.length === 0) {
    result.errors.push('No property elements found inside the properties container.')
    return result
  }

  for (const node of propertyNodes) {
    if (typeof node !== 'object' || node == null) {
      continue
    }
    const prop = extractOntoMlProperty(node as Record<string, unknown>)
    if (prop) {
      if (!isIrdi(prop.irdi)) {
        result.warnings.push(`Property "${prop.preferredName}" has a non-standard IRDI: "${prop.irdi}".`)
      }
      result.properties.push(prop)
    }
  }

  if (result.properties.length === 0) {
    result.errors.push('No valid properties could be extracted from the XML.')
    return result
  }

  result.isValid = true
  return result
}

function extractOntoMlProperty (node: Record<string, unknown>): IecCddProperty | null {
  const code = extractTextValue(node['code'] ?? node['Code'])
  if (!code) {
    return null
  }

  const preferredNameNode = node['preferred_name'] ?? node['PreferredName'] ?? node['preferredName']
  const preferredName = extractLabelText(preferredNameNode) || code

  const definitionNode = node['definition'] ?? node['Definition']
  const definition = extractDefinitionText(definitionNode)

  const unitNode = node['unit'] ?? node['Unit']
  const unit = extractUnitText(unitNode)

  const rawDataType = extractTextValue(node['data_type'] ?? node['DataType'] ?? node['dataType'])

  return {
    irdi: code,
    preferredName,
    shortName: extractTextValue(node['short_name'] ?? node['ShortName'] ?? node['shortName']),
    definition,
    unit,
    dataType: mapIecDataTypeToAas(rawDataType) ?? rawDataType,
    valueFormat: extractTextValue(node['value_format'] ?? node['ValueFormat']),
    sourceOfDefinition: extractTextValue(node['source_of_definition'] ?? node['SourceOfDefinition']),
    versionNumber: extractTextValue(node['version_number'] ?? node['VersionNumber']),
  }
}

function normalizeNfc (str: string): string {
  return str.normalize('NFC')
}

function extractTextValue (value: unknown): string | undefined {
  if (value == null) {
    return undefined
  }
  if (typeof value === 'string') {
    return value ? normalizeNfc(value) : undefined
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if (typeof obj['#text'] === 'string') {
      return obj['#text'] ? normalizeNfc(obj['#text']) : undefined
    }
    if (typeof obj['short_name'] === 'string') {
      return obj['short_name'] ? normalizeNfc(obj['short_name']) : undefined
    }
  }
  return undefined
}

function extractLabelText (value: unknown): string | undefined {
  if (value == null) {
    return undefined
  }
  if (typeof value === 'string') {
    return value || undefined
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const labels = normalizeToArray(obj['label'] ?? obj['Label'])
    // Prefer English label
    for (const label of labels) {
      if (typeof label === 'string') {
        return label
      }
      if (typeof label === 'object' && label != null) {
        const labelObj = label as Record<string, unknown>
        const attrs = labelObj['@attributes'] as Record<string, string> | undefined
        if (attrs?.['language'] === 'en' || attrs?.['lang'] === 'en') {
          return extractTextValue(label)
        }
      }
    }
    // Fallback to first label
    if (labels.length > 0) {
      return extractTextValue(labels[0])
    }
    if (typeof obj['#text'] === 'string') {
      return obj['#text'] || undefined
    }
  }
  return undefined
}

function extractDefinitionText (value: unknown): string | undefined {
  if (value == null) {
    return undefined
  }
  if (typeof value === 'string') {
    return value || undefined
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const texts = normalizeToArray(obj['text'] ?? obj['Text'])
    for (const text of texts) {
      if (typeof text === 'string') {
        return text
      }
      if (typeof text === 'object' && text != null) {
        const textObj = text as Record<string, unknown>
        const attrs = textObj['@attributes'] as Record<string, string> | undefined
        if (attrs?.['language'] === 'en' || attrs?.['lang'] === 'en') {
          return extractTextValue(text)
        }
      }
    }
    if (texts.length > 0) {
      return extractTextValue(texts[0])
    }
    if (typeof obj['#text'] === 'string') {
      return obj['#text'] || undefined
    }
  }
  return undefined
}

function extractUnitText (value: unknown): string | undefined {
  if (value == null) {
    return undefined
  }
  if (typeof value === 'string') {
    return value || undefined
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    return extractTextValue(obj['short_name'] ?? obj['ShortName'] ?? obj['#text'] ?? value)
  }
  return undefined
}

function validateIecJson (payload: unknown): IecCddValidationResult {
  const result: IecCddValidationResult = {
    isValid: false,
    properties: [],
    warnings: [],
    errors: [],
    detectedSchema: 'iec-json',
  }

  const items = findPropertyArray(payload)
  if (!items || items.length === 0) {
    result.errors.push('No array of IEC-CDD property objects found in the JSON data.')
    result.detectedSchema = 'unknown'
    return result
  }

  for (const item of items) {
    if (typeof item !== 'object' || item == null) {
      continue
    }
    const obj = item as Record<string, unknown>
    const prop = normalizeJsonProperty(obj)
    if (prop) {
      if (!isIrdi(prop.irdi)) {
        result.warnings.push(`Property "${prop.preferredName}" has a non-standard IRDI: "${prop.irdi}".`)
      }
      result.properties.push(prop)
    }
  }

  if (result.properties.length === 0) {
    result.errors.push('No valid IEC-CDD properties could be extracted from the JSON.')
    result.detectedSchema = 'unknown'
    return result
  }

  result.isValid = true
  return result
}

function findPropertyArray (payload: unknown): unknown[] | null {
  if (Array.isArray(payload)) {
    return payload
  }
  if (payload != null && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key]) && (obj[key] as unknown[]).length > 0) {
        const arr = obj[key] as unknown[]
        if (typeof arr[0] === 'object' && arr[0] != null) {
          const first = arr[0] as Record<string, unknown>
          if (hasIecFields(first)) {
            return arr
          }
        }
      }
    }
    // Recurse one level
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'object' && obj[key] != null && !Array.isArray(obj[key])) {
        const found = findPropertyArray(obj[key])
        if (found) {
          return found
        }
      }
    }
  }
  return null
}

function hasIecFields (obj: Record<string, unknown>): boolean {
  const keys = Object.keys(obj).map(k => k.toLowerCase())
  const hasIrdi = keys.some(k => k === 'irdi' || k === 'code' || k === 'property_name.en')
  const hasName = keys.some(
    k => k === 'preferredname' || k === 'preferred_name' || k === 'name' || k === 'preferredname.en',
  )
  return hasIrdi && hasName
}

function normalizeJsonProperty (obj: Record<string, unknown>): IecCddProperty | null {
  const irdi = getFieldCaseInsensitive(obj, ['irdi', 'code', 'PROPERTY_NAME.en'])
  const preferredName = getFieldCaseInsensitive(obj, [
    'preferredName', 'preferred_name', 'name',
    'PreferredName.EN', 'preferredname.en',
  ])
  if (!irdi || !preferredName) {
    return null
  }

  const rawDataType = stringOrUndefined(getFieldCaseInsensitive(obj, [
    'dataType', 'data_type', 'datatype', 'Data_type',
  ]))

  return {
    irdi: String(irdi).normalize('NFC'),
    preferredName: String(preferredName).normalize('NFC'),
    shortName: stringOrUndefined(getFieldCaseInsensitive(obj, [
      'shortName', 'short_name', 'ShortName.EN', 'shortname.en',
    ])),
    definition: stringOrUndefined(getFieldCaseInsensitive(obj, [
      'definition', 'Definition.EN', 'definition.en',
    ])),
    unit: stringOrUndefined(getFieldCaseInsensitive(obj, [
      'unit', 'PrimaryUnit', 'primaryunit', 'Symbol', 'symbol',
    ])),
    dataType: mapIecDataTypeToAas(rawDataType) ?? rawDataType,
    valueFormat: stringOrUndefined(getFieldCaseInsensitive(obj, [
      'valueFormat', 'value_format', 'Format', 'format',
    ])),
    sourceOfDefinition: stringOrUndefined(
      getFieldCaseInsensitive(obj, [
        'sourceOfDefinition', 'source_of_definition',
        'DefinitionSource', 'definitionsource',
      ]),
    ),
    versionNumber: stringOrUndefined(
      getFieldCaseInsensitive(obj, [
        'versionNumber', 'version_number', 'Version', 'version',
      ]),
    ),
  }
}

function getFieldCaseInsensitive (
  obj: Record<string, unknown>,
  candidates: string[],
): unknown | undefined {
  for (const candidate of candidates) {
    const val = obj[candidate]
    if (val !== undefined && val !== '') {
      return val
    }
  }
  const lowerKeys = new Map(Object.keys(obj).map(k => [k.toLowerCase(), k]))
  for (const candidate of candidates) {
    const matchedKey = lowerKeys.get(candidate.toLowerCase())
    if (matchedKey) {
      const val = obj[matchedKey]
      if (val !== undefined && val !== '') {
        return val
      }
    }
  }
  return undefined
}

function stringOrUndefined (value: unknown): string | undefined {
  if (value == null) {
    return undefined
  }
  const str = String(value).normalize('NFC')
  return str || undefined
}

function validateIecCsv (payload: unknown): IecCddValidationResult {
  const result: IecCddValidationResult = {
    isValid: false,
    properties: [],
    warnings: [],
    errors: [],
    detectedSchema: 'iec-csv',
  }

  if (!Array.isArray(payload) || payload.length === 0) {
    result.errors.push('CSV data is empty or not in expected row format.')
    result.detectedSchema = 'unknown'
    return result
  }

  const firstRow = payload[0] as Record<string, string>
  if (typeof firstRow !== 'object') {
    result.errors.push('CSV rows are not in the expected object format.')
    result.detectedSchema = 'unknown'
    return result
  }

  const headers = Object.keys(firstRow).map(h => h.toLowerCase())
  const hasIrdi = headers.some(h => CSV_IRDI_HEADERS.has(h))
  const hasName = headers.some(h => CSV_NAME_HEADERS.has(h))

  if (!hasIrdi || !hasName) {
    result.errors.push(
      'CSV headers must include at least IRDI/Code and PreferredName/Name columns.',
    )
    result.detectedSchema = 'unknown'
    return result
  }

  for (const row of payload as Record<string, string>[]) {
    const prop = normalizeJsonProperty(row as Record<string, unknown>)
    if (prop) {
      if (!isIrdi(prop.irdi)) {
        result.warnings.push(`Property "${prop.preferredName}" has a non-standard IRDI: "${prop.irdi}".`)
      }
      result.properties.push(prop)
    }
  }

  if (result.properties.length === 0) {
    result.errors.push('No valid IEC-CDD properties could be extracted from the CSV.')
    return result
  }

  result.isValid = true
  return result
}

function findNestedKey (
  obj: Record<string, unknown>,
  candidates: string[],
): unknown | undefined {
  for (const key of candidates) {
    if (obj[key] !== undefined) {
      return obj[key]
    }
  }
  for (const key of Object.keys(obj)) {
    const lowerKey = key.toLowerCase()
    if (candidates.includes(lowerKey)) {
      return obj[key]
    }
  }
  // Search one level deeper
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object' && obj[key] != null && !Array.isArray(obj[key])) {
      const found = findNestedKey(obj[key] as Record<string, unknown>, candidates)
      if (found !== undefined) {
        return found
      }
    }
  }
  return undefined
}

function normalizeToArray (value: unknown): unknown[] {
  if (value == null) {
    return []
  }
  if (Array.isArray(value)) {
    return value
  }
  return [value]
}
