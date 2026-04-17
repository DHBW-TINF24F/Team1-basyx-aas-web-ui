<template>
    <v-container max-width="1200">
        <v-card>
            <v-card-title align="center">IEC Importer</v-card-title>
            <v-card-subtitle class="text-center pb-2">Import von lokalen Excel-Dateien (Mehrfachauswahl moeglich)</v-card-subtitle>
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
                    >Dateien hochladen</v-btn
                >
                <input
                    ref="fileInputRef"
                    type="file"
                    accept=".xml,.json,.csv,.yaml,.yml,.xlsx,.xls"
                    multiple
                    style="display: none"
                    @change="handleFileUpload" />

                <!-- Info Alerts -->
                <v-alert density="compact" class="mb-3" type="info" variant="tonal">
                    Der IEC Importer unterstuetzt ausschliesslich den Import ueber Datei-Upload. Laden Sie
                    IEC-CDD-Datensaetze als Excel-Dateien herunter und laden Sie diese hier hoch. Sie koennen mehrere
                    Dateien gleichzeitig auswaehlen.
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
                    Erkannte Formate: {{ importedDatasetFormat }}
                </v-alert>

                <!-- Validation Feedback -->
                <v-alert
                    v-if="validationResult && validationResult.isValid"
                    density="compact"
                    class="mb-3"
                    type="success"
                    variant="tonal">
                    {{ validationResult.properties.length }} IEC-CDD Properties gefunden
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
    import { jsonization } from '@aas-core-works/aas-core3.1-typescript';
    import { ref } from 'vue';
    import type { IecCddProperty, IecCddValidationResult } from '@/types/IecCdd';
    import { useIecFileImport } from '@/composables/IecFileImport';
    import { useCDRepositoryClient } from '@/composables/Client/CDRepositoryClient';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { useInfrastructureStore } from '@/store/InfrastructureStore';

    defineOptions({
        moduleTitle: 'IEC Importer',
    });

    const navigationStore = useNavigationStore();
    const infrastructureStore = useInfrastructureStore();
    const { importFileContent } = useIecFileImport();
    const { postConceptDescription, putConceptDescription, isAvailableByIdInRepo } = useCDRepositoryClient();

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
        const files = input.files;
        if (!files || files.length === 0) return;

        datasetLoading.value = true;
        const allProperties: IecCddProperty[] = [];
        const allResults: Array<{ metadata: { detectedFormat: string }; payload: unknown; validation: IecCddValidationResult }> = [];
        const formats = new Set<string>();
        let failedFiles: string[] = [];
        const warnings: string[] = [];

        try {
            for (const file of Array.from(files)) {
                const result = await importFileContent(file);
                if (!result.success || !result.data) {
                    failedFiles.push(file.name);
                    continue;
                }
                formats.add(result.data.metadata.detectedFormat.toUpperCase());
                allResults.push(result.data);
                if (result.data.validation.isValid) {
                    allProperties.push(...result.data.validation.properties);
                }
                if (result.data.validation.warnings.length > 0) {
                    warnings.push(...result.data.validation.warnings.map((w) => `${file.name}: ${w}`));
                }
            }

            importedDatasetFormat.value = Array.from(formats).join(', ');
            importedDatasetJsonPreview.value = JSON.stringify(allResults, null, 2);

            validationResult.value = {
                isValid: allProperties.length > 0,
                properties: allProperties,
                detectedSchema: allResults.length > 0 ? allResults[0].validation.detectedSchema : '',
                errors: failedFiles.map((f) => `Import fehlgeschlagen: ${f}`),
                warnings,
            };

            const totalProps = allProperties.length;
            const successCount = allResults.length;
            const failCount = failedFiles.length;

            let message = `${successCount} Datei(en) importiert — ${totalProps} IEC-CDD Properties gefunden.`;
            if (failCount > 0) message += ` ${failCount} Datei(en) fehlgeschlagen.`;

            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 5000,
                color: failCount > 0 ? 'warning' : totalProps > 0 ? 'success' : 'warning',
                btnColor: 'buttonText',
                text: message,
            });
        } finally {
            datasetLoading.value = false;
            input.value = '';
        }
    }

    function normalizeStr(value: string | undefined): string | undefined {
        return value ? value.normalize('NFC') : undefined;
    }

    function buildConceptDescription(property: IecCddProperty): Record<string, unknown> {
        const preferredName = [{ language: 'en', text: normalizeStr(property.preferredName) || property.preferredName }];

        const shortName = property.shortName ? [{ language: 'en', text: normalizeStr(property.shortName) }] : null;

        const definition = property.definition ? [{ language: 'en', text: normalizeStr(property.definition) }] : null;

        const dataSpecificationContent: Record<string, unknown> = {
            modelType: 'DataSpecificationIec61360',
            preferredName,
        };
        if (shortName) dataSpecificationContent.shortName = shortName;
        if (property.unit) dataSpecificationContent.unit = normalizeStr(property.unit);
        if (property.sourceOfDefinition) dataSpecificationContent.sourceOfDefinition = normalizeStr(property.sourceOfDefinition);
        if (property.dataType) dataSpecificationContent.dataType = property.dataType;
        if (definition) dataSpecificationContent.definition = definition;
        if (property.valueFormat) dataSpecificationContent.valueFormat = property.valueFormat;

        return {
            modelType: 'ConceptDescription',
            id: property.irdi,
            idShort: normalizeStr(property.shortName || property.preferredName),
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

        const cdRepoUrl = infrastructureStore.getConceptDescriptionRepoURL;
        if (!cdRepoUrl || cdRepoUrl.trim() === '') {
            saveResultType.value = 'error';
            saveResultMessage.value = 'Concept Description Repository URL ist nicht konfiguriert. Bitte in den Infrastruktur-Einstellungen setzen.';
            return;
        }

        savingCds.value = true;
        saveResultMessage.value = '';
        let created = 0;
        let updated = 0;
        let failed = 0;

        try {
            for (const property of validationResult.value.properties) {
                const cdJson = buildConceptDescription(property);
                const cdResult = jsonization.conceptDescriptionFromJsonable(cdJson);

                if (cdResult.error !== null) {
                    console.warn('Failed to deserialize CD for IRDI', property.irdi, cdResult.error);
                    failed++;
                    continue;
                }

                const cd = cdResult.mustValue();
                const exists = await isAvailableByIdInRepo(property.irdi);

                let success;
                if (exists) {
                    success = await putConceptDescription(cd);
                    if (success) updated++;
                    else failed++;
                } else {
                    success = await postConceptDescription(cd);
                    if (success) created++;
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
