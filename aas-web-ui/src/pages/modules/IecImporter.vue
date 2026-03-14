<template>
    <v-container max-width="1200">
        <v-card>
            <v-card-title align="center">IEC Importer</v-card-title>
            <v-divider />
            <v-card-text>
                <v-text-field
                    id="iec-url-input"
                    v-model="iecDatasetUrl"
                    density="compact"
                    variant="outlined"
                    label="IEC dataset URL (JSON, XML, CSV, YAML)"
                    prepend-inner-icon="mdi-link-variant"
                    :error="iecDatasetUrl.trim().length > 0 && !isValidDatasetUrl"
                    class="mb-2">
                </v-text-field>

                <v-row class="mb-2">
                    <v-col cols="12" md="6">
                        <v-btn variant="tonal" block color="info" @click="useSampleDatasetUrl">Use Sample URL</v-btn>
                    </v-col>
                    <v-col cols="12" md="6">
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
                </v-row>

                <v-alert density="compact" class="mb-3" type="info" variant="tonal">
                    For external URLs, the source server must allow browser CORS requests.
                </v-alert>

                <v-alert
                    v-if="importedDatasetFormat !== ''"
                    density="compact"
                    class="mb-3"
                    type="success"
                    variant="tonal">
                    Detected format: {{ importedDatasetFormat }}
                </v-alert>

                <v-textarea
                    v-if="importedDatasetJsonPreview !== ''"
                    v-model="importedDatasetJsonPreview"
                    label="Converted JSON Preview"
                    variant="outlined"
                    rows="12"
                    auto-grow
                    readonly
                    class="mb-2">
                </v-textarea>

                <v-btn
                    v-if="importedDatasetJsonPreview !== ''"
                    variant="outlined"
                    color="primary"
                    block
                    @click="downloadImportedDatasetJson"
                    >Download JSON</v-btn
                >
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script setup lang="ts">
    import { computed, ref } from 'vue';
    import { useUrlIecImport } from '@/composables/UrlIecImport';
    import { useNavigationStore } from '@/store/NavigationStore';

    defineOptions({
        moduleTitle: 'IEC Importer',
    });

    const navigationStore = useNavigationStore();
    const { fetchAndConvertUrlContentToJson } = useUrlIecImport();

    const iecDatasetUrl = ref<string>('');
    const datasetLoading = ref<boolean>(false);
    const importedDatasetJsonPreview = ref<string>('');
    const importedDatasetFormat = ref<string>('');

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
            if (!result.success || !result.data) {
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 8000,
                    color: 'error',
                    btnColor: 'buttonText',
                    text: 'URL import failed',
                    extendedError: result.error || 'Unknown conversion error',
                });
                return;
            }

            importedDatasetFormat.value = result.data.metadata.detectedFormat.toUpperCase();
            importedDatasetJsonPreview.value = JSON.stringify(result.data, null, 2);

            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 5000,
                color: 'success',
                btnColor: 'buttonText',
                text: `Dataset imported from URL and converted to JSON (${importedDatasetFormat.value}).`,
            });
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

    function downloadImportedDatasetJson(): void {
        if (importedDatasetJsonPreview.value === '') return;

        const blob = new Blob([importedDatasetJsonPreview.value], { type: 'application/json' });
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = 'imported-iec-dataset.json';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(objectUrl);
    }
</script>
