import JSZip from 'jszip';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { extractCdsFromAasx } from '@/composables/AAS/AASXImport';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const IEC_IRI = 'https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0';

function makeEds(dataType: string, preferredName: string, unit?: string) {
    return {
        dataSpecification: {
            type: 'ExternalReference',
            keys: [{ type: 'GlobalReference', value: IEC_IRI }],
        },
        dataSpecificationContent: {
            modelType: 'DataSpecificationIec61360',
            preferredName: [{ language: 'en', text: preferredName }],
            dataType,
            ...(unit ? { unit } : {}),
        },
    };
}

function makeConceptDescription(id: string, displayName: string, dataType: string, unit?: string) {
    return {
        modelType: 'ConceptDescription',
        id,
        displayName: [{ language: 'en', text: displayName }],
        embeddedDataSpecifications: [makeEds(dataType, displayName, unit)],
    };
}

async function buildAasxFile(conceptDescriptions: object[]): Promise<File> {
    const zip = new JSZip();

    zip.file(
        '[Content_Types].xml',
        `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="json" ContentType="application/json"/>
</Types>`
    );

    zip.file(
        '_rels/.rels',
        `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Type="http://www.admin-shell.io/aasx/relationships/aasx-origin" Target="/aasx/aasx-origin" Id="r1"/>
</Relationships>`
    );

    zip.file('aasx/aasx-origin', '');

    zip.file(
        'aasx/_rels/aasx-origin.rels',
        `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Type="http://www.admin-shell.io/aasx/relationships/aas-spec" Target="/aasx/environment.json" Id="r2"/>
</Relationships>`
    );

    const environment = {
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions,
    };

    zip.file('aasx/environment.json', JSON.stringify(environment));

    const buffer = await zip.generateAsync({ type: 'arraybuffer' });
    return new File([buffer], 'test.aasx', { type: 'application/octet-stream' });
}

async function buildEmptyAasxFile(): Promise<File> {
    return buildAasxFile([]);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('extractCdsFromAasx', () => {
    it('extracts all Concept Descriptions from a valid AASX file', async () => {
        const file = await buildAasxFile([
            makeConceptDescription(
                'https://admin-shell.io/test/cd/RotationSpeed/1/0',
                'Rotation Speed',
                'INTEGER_MEASURE',
                '1/min'
            ),
            makeConceptDescription(
                'https://admin-shell.io/test/cd/Temperature/1/0',
                'Temperature',
                'REAL_MEASURE',
                '°C'
            ),
            makeConceptDescription('0173-1#02-AAO677#002', 'Manufacturer Name', 'STRING'),
        ]);

        const { cdById, warnings } = await extractCdsFromAasx(file);

        expect(warnings).toHaveLength(0);
        expect(cdById.size).toBe(3);
        expect(cdById.has('https://admin-shell.io/test/cd/RotationSpeed/1/0')).toBe(true);
        expect(cdById.has('https://admin-shell.io/test/cd/Temperature/1/0')).toBe(true);
        expect(cdById.has('0173-1#02-AAO677#002')).toBe(true);
    });

    it('returns correct core and json objects for each extracted CD', async () => {
        const file = await buildAasxFile([
            makeConceptDescription(
                'https://admin-shell.io/test/cd/Temperature/1/0',
                'Temperature',
                'REAL_MEASURE',
                '°C'
            ),
        ]);

        const { cdById } = await extractCdsFromAasx(file);
        const entry = cdById.get('https://admin-shell.io/test/cd/Temperature/1/0');

        expect(entry).toBeDefined();
        expect(entry!.json.id).toBe('https://admin-shell.io/test/cd/Temperature/1/0');
        expect(entry!.core).toBeDefined();
        // core is an aas-core ConceptDescription instance
        expect(typeof entry!.core.id).toBe('string');
    });

    it('returns an empty map and a warning when the AASX contains no CDs', async () => {
        const file = await buildEmptyAasxFile();

        const { cdById, warnings } = await extractCdsFromAasx(file);

        // No CDs found — map is empty, no warnings about parsing failures
        expect(cdById.size).toBe(0);
        expect(warnings).toHaveLength(0);
    });

    it('skips invalid CDs with a warning and still returns the valid ones', async () => {
        const file = await buildAasxFile([
            // Valid CD
            makeConceptDescription(
                'https://admin-shell.io/test/cd/Temperature/1/0',
                'Temperature',
                'REAL_MEASURE',
                '°C'
            ),
            // Invalid CD — unknown dataType value causes aas-core parse failure
            makeConceptDescription('https://admin-shell.io/test/cd/Bad/1/0', 'Bad CD', 'NOT_A_VALID_TYPE'),
        ]);

        const { cdById, warnings } = await extractCdsFromAasx(file);

        expect(cdById.size).toBe(1);
        expect(cdById.has('https://admin-shell.io/test/cd/Temperature/1/0')).toBe(true);
        expect(warnings.length).toBeGreaterThan(0);
        expect(warnings[0]).toContain('Skipped CD');
    });

    it('ignores AAS shells and submodels — only CDs are returned', async () => {
        // Build a file that has shells and submodels alongside CDs
        const zip = new JSZip();
        zip.file(
            '[Content_Types].xml',
            `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="json" ContentType="application/json"/>
</Types>`
        );
        zip.file(
            '_rels/.rels',
            `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Type="http://www.admin-shell.io/aasx/relationships/aasx-origin" Target="/aasx/aasx-origin" Id="r1"/>
</Relationships>`
        );
        zip.file('aasx/aasx-origin', '');
        zip.file(
            'aasx/_rels/aasx-origin.rels',
            `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Type="http://www.admin-shell.io/aasx/relationships/aas-spec" Target="/aasx/environment.json" Id="r2"/>
</Relationships>`
        );
        zip.file(
            'aasx/environment.json',
            JSON.stringify({
                assetAdministrationShells: [
                    {
                        modelType: 'AssetAdministrationShell',
                        id: 'https://example.com/aas/1',
                        assetInformation: { assetKind: 'Instance', globalAssetId: 'https://example.com/asset/1' },
                    },
                ],
                submodels: [
                    {
                        modelType: 'Submodel',
                        id: 'https://example.com/sm/1',
                        submodelElements: [],
                    },
                ],
                conceptDescriptions: [
                    makeConceptDescription(
                        'https://admin-shell.io/test/cd/Temperature/1/0',
                        'Temperature',
                        'REAL_MEASURE',
                        '°C'
                    ),
                ],
            })
        );

        const buffer = await zip.generateAsync({ type: 'arraybuffer' });
        const file = new File([buffer], 'mixed.aasx');

        const { cdById, warnings } = await extractCdsFromAasx(file);

        // Only the CD should be in the result — shells and submodels are ignored
        expect(cdById.size).toBe(1);
        expect(cdById.has('https://admin-shell.io/test/cd/Temperature/1/0')).toBe(true);
        expect(warnings).toHaveLength(0);
    });
});
