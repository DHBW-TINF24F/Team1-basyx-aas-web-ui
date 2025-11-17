<template>
    <v-navigation-drawer v-model="drawer" :rail="rail" permanent @click="rail = false">
        <!-- Full drawer (expanded) -->
        <div v-if="!rail">
            <v-list>
                <v-list-item class="list-item">
                    <v-row no-gutters justify="space-around">
                        <v-col cols="2">
                            <v-dialog max-width="500px">
                                <template #activator="{ props: activatorProps }">
                                    <v-btn v-bind="activatorProps" icon="mdi-upload" variant="text" />
                                </template>

                                <template #default="{ isActive }">
                                    <v-card title="Upload Concept Description">
                                        <v-card-text
                                            >Buy the full product to unlock this section of the demo!</v-card-text
                                        >
                                        <v-card-actions>
                                            <v-spacer></v-spacer>
                                            <v-btn text="Close" @click="isActive.value = false" />
                                        </v-card-actions>
                                    </v-card>
                                </template>
                            </v-dialog>
                        </v-col>
                        <v-col cols="7" align-self="center">
                            <v-dialog max-width="500px">
                                <template #activator="{ props: activatorProps }">
                                    <v-btn v-bind="activatorProps" append-icon="mdi-layers-plus" variant="outlined"
                                        >clone repo</v-btn
                                    >
                                </template>

                                <template #default="{ isActive }">
                                    <v-card title="Clone Repo">
                                        <v-card-text
                                            >Buy the full product to unlock this section of the demo!</v-card-text
                                        >
                                        <v-card-actions>
                                            <v-spacer></v-spacer>
                                            <v-btn text="Close" @click="isActive.value = false" />
                                        </v-card-actions>
                                    </v-card>
                                </template>
                            </v-dialog>
                        </v-col>
                        <v-col cols="2">
                            <v-btn icon="mdi-chevron-left" variant="text" @click.stop="rail = !rail"></v-btn>
                        </v-col>
                    </v-row>
                </v-list-item>

                <v-divider />

                <v-list>
                    <v-list-item v-for="column in columns" :key="column">
                        <v-checkbox-btn v-model="selectedColumns" :label="column" :value="column" />
                    </v-list-item>
                </v-list>
            </v-list>
        </div>

        <!-- Rail mode (collapsed) -->
        <div v-else class="centered-grid">
            <v-btn icon="mdi-chevron-right" variant="text" @click.stop="rail = !rail" />
            <v-divider />
            <v-dialog max-width="500px">
                <template #activator="{ props: activatorProps }">
                    <v-btn v-bind="activatorProps" icon="mdi-upload" variant="text" />
                </template>

                <template #default="{ isActive }">
                    <v-card title="Upload Concept Description">
                        <v-card-text>Buy the full product to unlock this section of the demo!</v-card-text>
                        <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn text="Close" @click="isActive.value = false" />
                        </v-card-actions>
                    </v-card>
                </template>
            </v-dialog>
            <v-dialog max-width="500px">
                <template #activator="{ props: activatorProps }">
                    <v-btn v-bind="activatorProps" icon="mdi-layers-plus" variant="text" />
                </template>

                <template #default="{ isActive }">
                    <v-card title="Clone Repo">
                        <v-card-text>Buy the full product to unlock this section of the demo!</v-card-text>
                        <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn text="Close" @click="isActive.value = false" />
                        </v-card-actions>
                    </v-card>
                </template>
            </v-dialog>
        </div>
    </v-navigation-drawer>
</template>

<script setup lang="ts">
    import { ref } from 'vue';

    defineProps({
        columns: {
            type: Array as any,
            default: [
                'isCaseOf',
                'administration',
                'id',
                'idShort',
                'displayName',
                'description',
                'extension',
                'dataSpecification',
            ] as Array<string>,
        },
    });
    const drawer = ref(true);
    const rail = ref(true);
    const selectedColumns = ref([]);
</script>

<style lang="scss">
    .list-item {
        padding-left: 0px !important;
        padding-right: 0px !important;
    }
    .centered-grid {
        justify-content: center;
        display: grid;
    }
</style>
