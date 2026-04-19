import { describe, expect, it } from 'vitest';

describe('IEC Excel NFC normalization', () => {
    it('should normalize NFD strings to NFC', () => {
        // Simulate what IecFileImport does with Excel cell values
        const nfdString = 'Gro\u0308sse'; // 'Größe' in NFD (o + combining umlaut)
        const nfcString = 'Gr\u00f6sse';  // 'Größe' in NFC (precomposed ö)

        const normalized = nfdString.normalize('NFC');
        expect(normalized).toBe(nfcString);
        expect(normalized.length).toBe(nfcString.length);
    });

    it('should normalize common IEC CDD special characters', () => {
        // Middle dot (·) used in units like N·m
        const middleDot = 'N\u00b7m';
        expect(middleDot.normalize('NFC')).toBe('N·m');

        // Degree sign (°) used in temperature units
        const degree = '\u00b0C';
        expect(degree.normalize('NFC')).toBe('°C');

        // Micro sign (µ) used in µm, µA etc.
        const micro = '\u00b5m';
        expect(micro.normalize('NFC')).toBe('µm');

        // Ohm sign (Ω) vs Greek capital omega
        const ohm = '\u2126';
        const omega = '\u03A9';
        expect(ohm.normalize('NFC')).toBe(omega);
    });

    it('should keep ASCII strings unchanged after NFC normalization', () => {
        const ascii = 'REAL_MEASURE_TYPE';
        expect(ascii.normalize('NFC')).toBe(ascii);
    });

    it('should handle strings with combining diacritical marks from Excel', () => {
        // e + combining acute accent → é (precomposed)
        const nfd = 'e\u0301';
        const nfc = '\u00e9';
        expect(nfd.normalize('NFC')).toBe(nfc);

        // a + combining umlaut → ä (precomposed)
        const nfdUmlaut = 'a\u0308';
        const nfcUmlaut = '\u00e4';
        expect(nfdUmlaut.normalize('NFC')).toBe(nfcUmlaut);
    });
});
