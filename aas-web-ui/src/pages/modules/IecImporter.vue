<template>
    <v-container max-width="1200">
        <v-card>
            <v-card-title align="center">IEC Importer</v-card-title>
            <v-card-subtitle class="text-center pb-2">Import von lokalen Excel-Dateien</v-card-subtitle>
            <v-divider />
            <v-card-text>
                <!-- File Upload Button -->
                <v-btn
                    variant="flat"
                    block
                    color="primary"
                    size="large"
                    prepend-icon="mdi-file-upload"
                    class="mb-3"
                    :loading="datasetLoading"
                    @click="triggerFileInput"
                    >Datei hochladen</v-btn
                >
                <input
                    ref="fileInputRef"
                    type="file"
                    accept=".xml,.json,.csv,.yaml,.yml,.xlsx,.xls"
                    style="display: none"
                    @change="handleFileUpload" />

                <!-- Info Alerts -->
                <v-alert density="compact" class="mb-3" type="info" variant="tonal">
                    Der IEC Importer unterstuetzt ausschliesslich den Import ueber Datei-Upload. Laden Sie
                    IEC-CDD-Datensaetze als Excel-Datei herunter und laden Sie diese hier hoch.
                </v-alert>

                <v-alert density="compact" class="mb-3" type="info" variant="tonal">
                    Unterstuetzte Formate: XLSX/XLS (Excel), sowie JSON, XML, CSV und YAML.
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

                <!-- Save to CD Repository -->
                <v-btn
                    v-if="validationResult && validationResult.isValid"
                    variant="flat"
                    block
                    color="success"
                    size="large"
                    prepend-icon="mdi-content-save"
                    class="mb-3"
                    :loading="savingCds"
                    @click="saveAsConceptDescriptions"
                    >Als Concept Descriptions speichern</v-btn
                >

                <!-- Save Result -->
                <v-alert
                    v-if="saveResultMessage !== ''"
                    density="compact"
                    class="mb-3"
                    :type="saveResultType"
                    variant="tonal">
                    {{ saveResultMessage }}
                </v-alert>

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
    import { ref } from 'vue';
    import type { IecCddProperty, IecCddValidationResult } from '@/types/IecCdd';
    import { useIecFileImport } from '@/composables/IecFileImport';
    import { useCDRepositoryClient } from '@/composables/Client/CDRepositoryClient';
    import { useNavigationStore } from '@/store/NavigationStore';

    defineOptions({
        moduleTitle: 'IEC Importer',
    });

    const navigationStore = useNavigationStore();
    const { importFileContent } = useIecFileImport();
    const { createCd, updateCd, isAvailableByIdInRepo } = useCDRepositoryClient();

    const datasetLoading = ref<boolean>(false);
    const savingCds = ref<boolean>(false);
    const importedDatasetJsonPreview = ref<string>('');
    const importedDatasetFormat = ref<string>('');
    const validationResult = ref<IecCddValidationResult | null>(null);
    const tableSearch = ref<string>('');
    const fileInputRef = ref<HTMLInputElement | null>(null);
    const saveResultMessage = ref<string>('');
    const saveResultType = ref<'success' | 'error' | 'info'>('success');

    const propertyTableHeaders = [
        { title: 'IRDI', key: 'irdi', sortable: true },
        { title: 'Preferred Name', key: 'preferredName', sortable: true },
        { title: 'Short Name', key: 'shortName', sortable: true },
        { title: 'Definition', key: 'definition', sortable: false },
        { title: 'Unit', key: 'unit', sortable: true },
        { title: 'Data Type', key: 'dataType', sortable: true },
    ];

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

    function buildConceptDescription(property: IecCddProperty): Record<string, unknown> {
        const preferredName = [{ language: 'en', text: property.preferredName }];

        const shortName = property.shortName ? [{ language: 'en', text: property.shortName }] : null;

        const definition = property.definition ? [{ language: 'en', text: property.definition }] : null;

        const dataSpecificationContent: Record<string, unknown> = {
            modelType: 'DataSpecificationIec61360',
            preferredName,
        };
        if (shortName) dataSpecificationContent.shortName = shortName;
        if (property.unit) dataSpecificationContent.unit = property.unit;
        if (property.sourceOfDefinition) dataSpecificationContent.sourceOfDefinition = property.sourceOfDefinition;
        if (property.dataType) dataSpecificationContent.dataType = property.dataType;
        if (definition) dataSpecificationContent.definition = definition;
        if (property.valueFormat) dataSpecificationContent.valueFormat = property.valueFormat;

        return {
            modelType: 'ConceptDescription',
            id: property.irdi,
            idShort: property.shortName || property.preferredName,
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIec61360/3/0',
                            },
                        ],
                    },
                    dataSpecificationContent,
                },
            ],
        };
    }

    async function saveAsConceptDescriptions(): Promise<void> {
        if (!validationResult.value || !validationResult.value.isValid) return;

        savingCds.value = true;
        saveResultMessage.value = '';
        let created = 0;
        let updated = 0;
        let failed = 0;

        try {
            for (const property of validationResult.value.properties) {
                const cd = buildConceptDescription(property);
                const exists = await isAvailableByIdInRepo(property.irdi);

                let result;
                if (exists) {
                    result = await updateCd(property.irdi, cd);
                    if (result.success) updated++;
                    else failed++;
                } else {
                    result = await createCd(cd);
                    if (result.success) created++;
                    else failed++;
                }
            }

            if (failed === 0) {
                saveResultType.value = 'success';
                saveResultMessage.value = `Erfolgreich gespeichert: ${created} erstellt, ${updated} aktualisiert.`;
            } else {
                saveResultType.value = 'error';
                saveResultMessage.value = `${created} erstellt, ${updated} aktualisiert, ${failed} fehlgeschlagen.`;
            }
        } catch (e) {
            saveResultType.value = 'error';
            saveResultMessage.value = `Fehler beim Speichern: ${e instanceof Error ? e.message : 'Unbekannter Fehler'}`;
        } finally {
            savingCds.value = false;
        }
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
