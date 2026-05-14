<template>
  <v-container class="pa-0" fluid>
    <v-list-item v-if="localDescriptionArray && Array.isArray(localDescriptionArray) && localDescriptionArray.length > 0 || editorMode">
      <!-- Tooltip with Description -->
      <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
        <div v-for="(description, i) in localDescriptionArray" :key="i" class="text-body-small">
          <span class="font-weight-bold">{{ description.language + ': ' }}</span>{{ description.text }}
        </div>
      </v-tooltip>
      <!-- Description Title -->
      <template #title>
        <div class="mt-1" :class="small ? 'text-body-small' : 'text-title-small '">
          {{ descriptionTitle + ':' }}
        </div>
      </template>
      <!-- Descriptions List (different Languages) -->
      <v-list-item-subtitle v-for="(description, i) in localDescriptionArray" :key="i">
        <v-row v-if="!activeEdits.includes(description)">
          <v-col cols="10">
            <div class="pt-2">
              <v-chip border class="mr-2" label size="x-small">{{
                description.language ? description.language : 'no-lang'
              }}</v-chip>
              <span>{{ description.text }}</span>
            </div>
          </v-col>
          <v-col v-if="editorMode" class="center-button" cols="2">
            <v-btn
              class="text-buttonText"
              color="primary"
              density="compact"
              rounded="lg"
              text="Edit"
              variant="flat"
              @click="toggleEdit(description, localDescriptionArray, activeEdits)"
            />
          </v-col>
        </v-row>
        <v-form
          v-else
          v-model="formValid"
          @submit.prevent="submitForm(description)"
        >
          <v-row>
            <v-col cols="1">
              <v-text-field
                v-model="description.language"
                density="compact"
                :maxlength="langCodeFixLength"
                placeholder="language"
                rounded="lg"
                :rules="[rules.required, rules.language, rules.duplicateLanguage]"
                variant="underlined"
              />
            </v-col>
            <v-col cols="8">
              <v-text-field
                v-model="description.text"
                density="compact"
                :maxlength="langStringMaxLength"
                placeholder="description"
                rounded="lg"
                :rules="[rules.required, rules.text]"
                variant="underlined"
              />
            </v-col>
            <v-col class="center-button">
              <v-btn
                class="text-buttonText"
                color="green"
                density="compact"
                :disabled="!formValid"
                rounded="lg"
                text="Save"
                type="submit"
                variant="flat"
              />
              <v-btn
                class="text-buttonText"
                color="red"
                density="compact"
                rounded="lg"
                text="Remove"
                variant="flat"
                @click="cancelSubmit(description)"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-list-item-subtitle>
    </v-list-item>
    <!-- Add Description Option -->
    <v-list-item v-if="showAddButton(editorMode, activeEdits)">
      <v-btn
        class="text-buttonText"
        color="green"
        density="comfortable"
        rounded="lg"
        text="Add new"
        variant="flat"
        @click="addLangString(localDescriptionArray, activeEdits)"
      />
    </v-list-item>
  </v-container>
</template>

<script setup lang="ts">
  import type { LangString } from '../ConceptDescriptionElements/EditorComposables/types'
  import { addLangString, deleteItem, languageAlreadyExists, showAddButton, toggleEdit } from '../ConceptDescriptionElements/EditorComposables/cdEditorHandlings'

  // Props
  const props = defineProps({
    descriptionArray: {
      type: Array<LangString>,
      default: [] as Array<LangString>,
    },
    descriptionTitle: {
      type: String,
      default: 'Description',
    },
    small: {
      type: Boolean,
      default: false,
    },
    editorMode: {
      type: Boolean,
      default: false,
    },
    langStringMaxLength: {
      type: Number,
      default: 256, // this does not work for all LangStrings but a default is definitely necessary
    },
    attributeName: {
      type: String,
      default: 'description',
    },
  })

  const emit = defineEmits<{
    (event: 'update:description', value: Array<LangString>, name: string): void
  }>()

  const langCodeFixLength = 2
  const rules = {
    required: (value: string) => !!value || 'Field is required',
    language: (value: string) => value.length == langCodeFixLength || 'Language code must contain 2 letters',
    text: (value: string) => (value.length > 0 && value.length <= props.langStringMaxLength) || 'Text must have 1-' + props.langStringMaxLength + ' letters',
    duplicateLanguage: (value: string) => !languageAlreadyExists(value, localDescriptionArray) || 'A description with this language already exists',
  }

  const formValid = ref(false)
  const activeEdits: Array<LangString> = reactive([])
  const localDescriptionArray: Array<LangString> = reactive([])

  function submitForm (description: LangString) {
    toggleEdit(description, localDescriptionArray, activeEdits)
    emit('update:description', localDescriptionArray, props.attributeName)
  }

  function cancelSubmit (description: LangString) {
    if (props.attributeName && props.attributeName === 'preferredName' && description.language && description.language === 'en') {
      return // this is a restriction explicitly mentioned here: https://industrialdigitaltwin.io/aas-specifications/IDTA-01003-a/v3.1/specification.html#DataSpecificationIec61360 -> preferredName attribute
    }
    deleteItem(description, localDescriptionArray, activeEdits)
    emit('update:description', localDescriptionArray, props.attributeName)
  }

  // updates the description passed by the parent
  watch(
    () => props.descriptionArray,
    newVal => {
      if (newVal) {
        Object.assign(localDescriptionArray, structuredClone(toRaw(newVal)))
      }
    },
    { immediate: true },
  )
</script>

<style>
.center-button {
  display: flex;
  justify-content: space-evenly;
}
</style>
