<template>
    <v-container fluid class="pa-0">
        <!-- Eure komponenten hier einfügen z.B Komponente = MyComponent.vue, dann <MyComponent></MyComponent> hier rein packen-->
        <v-row>
            <v-col cols="6">
                <ConceptDescriptionTable></ConceptDescriptionTable>
            </v-col>
            <v-col cols="6">
                <ConceptDescriptionDetailView></ConceptDescriptionDetailView>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts" setup></script>
