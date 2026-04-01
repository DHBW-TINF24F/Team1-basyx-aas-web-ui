export interface IecCddProperty {
    irdi: string;
    preferredName: string;
    shortName?: string;
    definition?: string;
    unit?: string;
    dataType?: string;
    valueFormat?: string;
    sourceOfDefinition?: string;
    versionNumber?: string;
}

export interface IecCddValidationResult {
    isValid: boolean;
    properties: IecCddProperty[];
    warnings: string[];
    errors: string[];
    detectedSchema: 'ontoml-xml' | 'iec-json' | 'iec-csv' | 'iec-html' | 'iec-xlsx' | 'unknown';
}
