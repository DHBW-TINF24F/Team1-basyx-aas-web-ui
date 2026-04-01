import { describe, expect, it } from 'vitest';
import { useIecCddHtmlParser } from '@/composables/IecCddHtmlParser';

const { parseIecCddHtml } = useIecCddHtmlParser();

describe('IecCddHtmlParser.ts; table parsing', () => {
    it('should extract property from HTML table with label-value rows', () => {
        const html = `<!DOCTYPE html><html><body>
            <table>
                <tr><td>IRDI</td><td>0112/2///61360_4#AAE530#002</td></tr>
                <tr><td>Preferred Name</td><td>operating temperature</td></tr>
                <tr><td>Short Name</td><td>T_op</td></tr>
                <tr><td>Definition</td><td>temperature range</td></tr>
                <tr><td>Unit</td><td>degree Celsius</td></tr>
                <tr><td>Data Type</td><td>REAL_MEASURE_TYPE</td></tr>
                <tr><td>Version Number</td><td>002</td></tr>
                <tr><td>Source of Definition</td><td>IEC 61360-4</td></tr>
            </table>
        </body></html>`;

        const properties = parseIecCddHtml(html);
        expect(properties).toHaveLength(1);
        expect(properties[0].irdi).toBe('0112/2///61360_4#AAE530#002');
        expect(properties[0].preferredName).toBe('operating temperature');
        expect(properties[0].shortName).toBe('T_op');
        expect(properties[0].definition).toBe('temperature range');
        expect(properties[0].unit).toBe('degree Celsius');
        expect(properties[0].dataType).toBe('REAL_MEASURE_TYPE');
        expect(properties[0].versionNumber).toBe('002');
        expect(properties[0].sourceOfDefinition).toBe('IEC 61360-4');
    });

    it('should handle alternative label names (Code instead of IRDI)', () => {
        const html = `<html><body>
            <table>
                <tr><td>Code</td><td>0112/2///61360_7#AAE664#007</td></tr>
                <tr><td>Name</td><td>Rated voltage</td></tr>
                <tr><td>Unit of measure</td><td>V</td></tr>
            </table>
        </body></html>`;

        const properties = parseIecCddHtml(html);
        expect(properties).toHaveLength(1);
        expect(properties[0].irdi).toBe('0112/2///61360_7#AAE664#007');
        expect(properties[0].preferredName).toBe('Rated voltage');
        expect(properties[0].unit).toBe('V');
    });

    it('should return empty array for non-IEC HTML', () => {
        const html = `<!DOCTYPE html><html><body>
            <h1>Hello World</h1>
            <p>This is just a regular webpage with no IEC data.</p>
        </body></html>`;

        const properties = parseIecCddHtml(html);
        expect(properties).toHaveLength(0);
    });

    it('should return empty array for empty HTML', () => {
        const properties = parseIecCddHtml('');
        expect(properties).toHaveLength(0);
    });

    it('should handle table with header cells (th)', () => {
        const html = `<html><body>
            <table>
                <tr><th>IRDI</th><td>0112/2///61360_7#AAA437#007</td></tr>
                <tr><th>Preferred Name</th><td>Manufacturer name</td></tr>
                <tr><th>Data Type</th><td>STRING_TYPE</td></tr>
            </table>
        </body></html>`;

        const properties = parseIecCddHtml(html);
        expect(properties).toHaveLength(1);
        expect(properties[0].irdi).toBe('0112/2///61360_7#AAA437#007');
        expect(properties[0].preferredName).toBe('Manufacturer name');
        expect(properties[0].dataType).toBe('STRING_TYPE');
    });

    it('should extract IRDI from body text when not in table label', () => {
        const html = `<html><body>
            <p>0112/2///61360_7#AAB328#004</p>
            <table>
                <tr><td>Preferred Name</td><td>Degree of protection</td></tr>
                <tr><td>Data Type</td><td>STRING_TYPE</td></tr>
            </table>
        </body></html>`;

        const properties = parseIecCddHtml(html);
        expect(properties).toHaveLength(1);
        expect(properties[0].irdi).toBe('0112/2///61360_7#AAB328#004');
        expect(properties[0].preferredName).toBe('Degree of protection');
    });
});

describe('IecCddHtmlParser.ts; text-based fallback', () => {
    it('should extract from text content with colon-separated fields', () => {
        const html = `<html><body>
            <div>
                IRDI: 0112/2///61360_4#AAE530#002
                Preferred Name: operating temperature
                Unit: degree Celsius
                Data Type: REAL_MEASURE_TYPE
            </div>
        </body></html>`;

        const properties = parseIecCddHtml(html);
        expect(properties).toHaveLength(1);
        expect(properties[0].irdi).toBe('0112/2///61360_4#AAE530#002');
        expect(properties[0].preferredName).toBe('operating temperature');
    });
});
