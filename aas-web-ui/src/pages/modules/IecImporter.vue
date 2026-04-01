<template>
    <v-container max-width="1200">
        <v-card>
            <v-card-title align="center">IEC Importer</v-card-title>
            <v-divider />
            <v-card-text>
                <!-- URL Input -->
                <v-text-field
                    id="iec-url-input"
                    v-model="iecDatasetUrl"
                    density="compact"
                    variant="outlined"
                    label="IEC dataset URL (JSON, XML, CSV, YAML, XLSX)"
                    prepend-inner-icon="mdi-link-variant"
                    :error="iecDatasetUrl.trim().length > 0 && !isValidDatasetUrl"
                    class="mb-2">
                </v-text-field>

                <v-row class="mb-2">
                    <v-col cols="12" md="4">
                        <v-btn variant="tonal" block color="info" @click="useSampleDatasetUrl">Use Sample URL</v-btn>
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-btn
                            variant="flat"
                            block
                            color="secondary"
                            :loading="datasetLoading"
                            :disabled="!isValidDatasetUrl"
                            @click="importDatasetFromUrl"
                            >Fetch URL and Convert to JSON</v-btn
                        >
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-btn
                            variant="tonal"
                            block
                            color="primary"
                            prepend-icon="mdi-file-upload"
                            @click="triggerFileInput"
                            >Upload Local File</v-btn
                        >
                        <input
                            ref="fileInputRef"
                            type="file"
                            accept=".xml,.json,.csv,.yaml,.yml,.xlsx,.xls,.html,.htm"
                            style="display: none"
                            @change="handleFileUpload" />
                    </v-col>
                </v-row>

                <!-- Info Alerts -->
                <v-alert density="compact" class="mb-3" type="info" variant="tonal">
                    For cdd.iec.ch URLs: In development mode, requests are proxied automatically. In production, save the
                    webpage as HTML and use "Upload Local File". Other external URLs must allow browser CORS requests.
                </v-alert>

                <v-alert density="compact" class="mb-3" type="info" variant="tonal">
                    Supported formats: JSON, XML, CSV, YAML, XLSX/XLS, and HTML (saved cdd.iec.ch pages).
                </v-alert>

                <!-- Format Detection -->
                <v-alert
                    v-if="importedDatasetFormat !== ''"
                    density="compact"
                    class="mb-3"
                    type="success"
                    variant="tonal">
                    Detected format: {{ importedDatasetFormat }}
                </v-alert>

                <!-- Validation Feedback -->
                <v-alert
                    v-if="validationResult && validationResult.isValid"
                    density="compact"
                    class="mb-3"
                    type="success"
                    variant="tonal">
                    Valid IEC-CDD data detected ({{ validationResult.properties.length }} properties found, schema:
                    {{ validationResult.detectedSchema }})
                </v-alert>

                <v-alert
                    v-if="validationResult && !validationResult.isValid"
                    density="compact"
                    class="mb-3"
                    type="warning"
                    variant="tonal">
                    The data does not match the IEC-CDD format.
                    <ul v-if="validationResult.errors.length > 0" class="mt-1">
                        <li v-for="(err, i) in validationResult.errors" :key="i">{{ err }}</li>
                    </ul>
                </v-alert>

                <v-alert
                    v-if="validationResult && validationResult.warnings.length > 0"
                    density="compact"
                    class="mb-3"
                    type="info"
                    variant="tonal">
                    <strong>Warnings:</strong>
                    <ul class="mt-1">
                        <li v-for="(warn, i) in validationResult.warnings" :key="i">{{ warn }}</li>
                    </ul>
                </v-alert>

                <!-- Structured Properties Table -->
                <v-card v-if="validationResult && validationResult.isValid" variant="outlined" class="mb-3">
                    <v-card-title class="text-subtitle-1">IEC-CDD Properties</v-card-title>
                    <v-card-text>
                        <v-text-field
                            v-model="tableSearch"
                            density="compact"
                            variant="outlined"
                            label="Search properties..."
                            prepend-inner-icon="mdi-magnify"
                            clearable
                            class="mb-2">
                        </v-text-field>
                        <v-data-table
                            density="compact"
                            :headers="propertyTableHeaders"
                            :items="validationResult.properties"
                            :search="tableSearch"
                            items-per-page="10">
                        </v-data-table>
                    </v-card-text>
                </v-card>

                <!-- Download Buttons -->
                <v-row v-if="importedDatasetJsonPreview !== ''" class="mb-3">
                    <v-col cols="12" md="6">
                        <v-btn variant="outlined" color="primary" block @click="downloadImportedDatasetJson"
                            >Download JSON</v-btn
                        >
                    </v-col>
                    <v-col v-if="validationResult && validationResult.isValid" cols="12" md="6">
                        <v-btn variant="outlined" color="primary" block @click="downloadPropertiesCsv"
                            >Download Properties as CSV</v-btn
                        >
                    </v-col>
                </v-row>

                <!-- Raw JSON Fallback (collapsible) -->
                <v-expansion-panels v-if="importedDatasetJsonPreview !== ''" class="mb-2">
                    <v-expansion-panel title="Raw JSON Preview">
                        <v-expansion-panel-text>
                            <v-textarea
                                v-model="importedDatasetJsonPreview"
                                variant="outlined"
                                rows="12"
                                auto-grow
                                readonly>
                            </v-textarea>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script setup lang="ts">
    import { computed, ref } from 'vue';
    import type { IecCddValidationResult } from '@/types/IecCdd';
    import { useUrlIecImport } from '@/composables/UrlIecImport';
    import { useNavigationStore } from '@/store/NavigationStore';

    defineOptions({
        moduleTitle: 'IEC Importer',
    });

    const navigationStore = useNavigationStore();
    const { fetchAndConvertUrlContentToJson, importFileContent } = useUrlIecImport();

    const iecDatasetUrl = ref<string>('');
    const datasetLoading = ref<boolean>(false);
    const importedDatasetJsonPreview = ref<string>('');
    const importedDatasetFormat = ref<string>('');
    const validationResult = ref<IecCddValidationResult | null>(null);
    const tableSearch = ref<string>('');
    const fileInputRef = ref<HTMLInputElement | null>(null);

    const propertyTableHeaders = [
        { title: 'IRDI', key: 'irdi', sortable: true },
        { title: 'Preferred Name', key: 'preferredName', sortable: true },
        { title: 'Short Name', key: 'shortName', sortable: true },
        { title: 'Definition', key: 'definition', sortable: false },
        { title: 'Unit', key: 'unit', sortable: true },
        { title: 'Data Type', key: 'dataType', sortable: true },
    ];

    const isValidDatasetUrl = computed(() => {
        const value = iecDatasetUrl.value.trim();
        if (value === '') return false;
        try {
            const parsedUrl = new URL(value);
            return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
        } catch {
            return false;
        }
    });

    function useSampleDatasetUrl(): void {
        const samplePath = `${import.meta.env.BASE_URL}config/sample-iec-dataset.xml`;
        iecDatasetUrl.value = new URL(samplePath, window.location.origin).toString();
    }

    function triggerFileInput(): void {
        fileInputRef.value?.click();
    }

    async function handleFileUpload(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        datasetLoading.value = true;
        try {
            const result = await importFileContent(file);
            handleImportResult(result, `File "${file.name}" imported`);
        } finally {
            datasetLoading.value = false;
            input.value = '';
        }
    }

    async function importDatasetFromUrl(): Promise<void> {
        if (!isValidDatasetUrl.value) {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 5000,
                color: 'error',
                btnColor: 'buttonText',
                text: 'Please provide a valid dataset URL.',
            });
            return;
        }

        datasetLoading.value = true;
        try {
            const result = await fetchAndConvertUrlContentToJson(iecDatasetUrl.value);
            handleImportResult(result, 'Dataset imported from URL');
        } catch (error) {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 8000,
                color: 'error',
                btnColor: 'buttonText',
                text: 'URL import failed',
                extendedError: error instanceof Error ? error.message : 'Unknown error occurred',
            });
        } finally {
            datasetLoading.value = false;
        }
    }

    function handleImportResult(
        result: { success: boolean; data?: { metadata: { detectedFormat: string }; payload: unknown; validation: IecCddValidationResult }; error?: string },
        successPrefix: string
    ): void {
        if (!result.success || !result.data) {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 8000,
                color: 'error',
                btnColor: 'buttonText',
                text: 'Import failed',
                extendedError: result.error || 'Unknown conversion error',
            });
            return;
        }

        importedDatasetFormat.value = result.data.metadata.detectedFormat.toUpperCase();
        importedDatasetJsonPreview.value = JSON.stringify(result.data, null, 2);
        validationResult.value = result.data.validation;

        const validationInfo = result.data.validation.isValid
            ? ` — ${result.data.validation.properties.length} IEC-CDD properties found.`
            : ' — No IEC-CDD properties detected.';

        navigationStore.dispatchSnackbar({
            status: true,
            timeout: 5000,
            color: result.data.validation.isValid ? 'success' : 'warning',
            btnColor: 'buttonText',
            text: `${successPrefix} (${importedDatasetFormat.value})${validationInfo}`,
        });
    }

    function downloadImportedDatasetJson(): void {
        if (importedDatasetJsonPreview.value === '') return;
        downloadBlob(importedDatasetJsonPreview.value, 'imported-iec-dataset.json', 'application/json');
    }

    function downloadPropertiesCsv(): void {
        if (!validationResult.value || !validationResult.value.isValid) return;

        const headers = ['IRDI', 'PreferredName', 'ShortName', 'Definition', 'Unit', 'DataType', 'ValueFormat', 'SourceOfDefinition'];
        const rows = validationResult.value.properties.map((p) =>
            [p.irdi, p.preferredName, p.shortName ?? '', p.definition ?? '', p.unit ?? '', p.dataType ?? '', p.valueFormat ?? '', p.sourceOfDefinition ?? '']
                .map((v) => `"${v.replace(/"/g, '""')}"`)
                .join(',')
        );
        const csvContent = [headers.join(','), ...rows].join('\n');
        downloadBlob(csvContent, 'iec-cdd-properties.csv', 'text/csv');
    }

    function downloadBlob(content: string, filename: string, mimeType: string): void {
        const blob = new Blob([content], { type: mimeType });
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(objectUrl);
    }
</script>
