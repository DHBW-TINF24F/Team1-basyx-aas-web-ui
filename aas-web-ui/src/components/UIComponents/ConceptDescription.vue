<template>
  <v-container class="pa-0" fluid>
    <v-card v-if="conceptDescriptionObject && Object.keys(conceptDescriptionObject).length > 0">
      <v-list nav>
        <!-- ConceptDescription Identification -->
        <IdentificationElement :identification-object="conceptDescriptionObject" />
        <v-divider
          v-if="conceptDescriptionObject.displayName && conceptDescriptionObject.displayName.length > 0
            || editorMode"
          class="mt-2"
        />
        <!-- ConceptDescription DisplayName -->
        <DisplayNameElement
          v-if="conceptDescriptionObject.displayName && conceptDescriptionObject.displayName.length > 0
            || editorMode"
          :display-name-array="conceptDescriptionObject.displayName"
          :display-name-title="'Display Name'"
          :editor-mode="editorMode"
          :lang-string-max-length="128"
          :small="false"
          @update:display-name="updateDisplayName"
        />
        <v-divider
          v-if="conceptDescriptionObject.description && conceptDescriptionObject.description.length > 0 || editorMode"
          class="mt-2"
        />
        <!-- ConceptDescription Description -->
        <DescriptionElement
          v-if="conceptDescriptionObject.description && conceptDescriptionObject.description.length > 0 || editorMode"
          :description-array="conceptDescriptionObject.description"
          :description-title="'Description'"
          :editor-mode="editorMode"
          :lang-string-max-length="1023"
          :small="false"
          @update:description="updateDescription"
        />
      </v-list>
      <v-divider
        v-if="
          conceptDescriptionObject.embeddedDataSpecifications &&
            conceptDescriptionObject.embeddedDataSpecifications.length > 0
        "
      />
      <v-list
        v-if="
          conceptDescriptionObject.embeddedDataSpecifications &&
            conceptDescriptionObject.embeddedDataSpecifications.length > 0
        "
        class="px-4 pt-2 pb-4"
        nav
      >
        <v-card
          v-for="(embeddedDataSpecification, i) in conceptDescriptionObject.embeddedDataSpecifications as Array<any>"
          :key="i"
          class="mt-2"
          color="elevatedCard"
        >
          <v-list class="bg-elevatedCard pt-0" nav>
            <!-- hasDataSpecification -->
            <SemanticID
              v-if="
                embeddedDataSpecification.dataSpecification &&
                  embeddedDataSpecification.dataSpecification.keys &&
                  embeddedDataSpecification.dataSpecification.keys.length > 0
              "
              class="mb-2"
              :semantic-id-object="embeddedDataSpecification.dataSpecification"
              :semantic-title="'Data Specification'"
              :small="false"
            />
            <v-divider v-if="embeddedDataSpecification.dataSpecificationContent" class="mt-2" />
            <!-- dataSpecificationContent -->
            <DataSpecificationContent
              v-if="embeddedDataSpecification.dataSpecificationContent"
              :data-specification-object="
                embeddedDataSpecification.dataSpecificationContent
              "
              :editor-mode="editorMode"
              :index="i"
              @update:embedded-data-specification-content="updateEmbeddedDataSpecificationContent"
            />
          </v-list>
        </v-card>
      </v-list>
      <!-- Last Sync -->
      <v-divider
        v-if="!editorMode"
      />
      <LastSync
        v-if="!editorMode"
        :timestamp="conceptDescriptionObject.timestamp"
      />
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import type { LangString } from '../ConceptDescriptionElements/EditorComposables/types'

  defineProps({
    small: {
      type: Boolean,
      default: false,
    },
    conceptDescriptionObject: {
      type: Object as any,
      default: {} as any,
    },
    editorMode: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits<{
    (event: 'update:concept-description', value: object, name: string): void
    (event: 'update:embedded-data-specification', value: object, name: string, index: number): void
  }>()

  function updateDisplayName (value: Array<LangString>) {
    emitValueAndName(value, 'displayName')
  }

  function updateDescription (value: Array<LangString>, name: string) {
    // name is passed down, as DescriptionElement.vue is used for more than just the description
    emitValueAndName(value, name)
  }

  function emitValueAndName (value: object, name: string) {
    emit('update:concept-description', value, name)
  }

  function updateEmbeddedDataSpecificationContent (value: any, index: number) {
    emitValueAndNameAndIndex(value, 'dataSpecificationContent', index)
  }

  function emitValueAndNameAndIndex (value: object, name: string, index: number) {
    emit('update:embedded-data-specification', value, name, index)
  }
</script>
