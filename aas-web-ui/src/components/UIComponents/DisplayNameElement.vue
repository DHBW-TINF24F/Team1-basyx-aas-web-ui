<template>
  <v-container class="pa-0" fluid>
    <v-list-item v-if="(localDisplayNameArray && Array.isArray(localDisplayNameArray) && localDisplayNameArray.length > 0) || editorMode">
      <!-- Tooltip with DisplayName -->
      <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
        <div v-for="(displayName, i) in localDisplayNameArray" :key="i" class="text-body-small">
          <span class="font-weight-bold">{{ displayName.language + ': ' }}</span>{{ displayName.text }}
        </div>
      </v-tooltip>
      <!-- DisplayName Title -->
      <template #title>
        <div class="mt-1" :class="small ? 'text-body-small' : 'text-title-small '">
          {{ displayNameTitle + ':' }}
        </div>
      </template>
      <!-- DisplayNames List (different Languages) -->
      <v-list-item-subtitle v-for="(displayName, i) in localDisplayNameArray" :key="i">
        <v-row v-if="!activeEdits.includes(displayName)">
          <v-col>
            <div class="pt-2">
              <v-chip border class="mr-2" label size="x-small">{{
                displayName.language ? displayName.language : 'no-lang'
              }}</v-chip>
              <span>{{ displayName.text }}</span>
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
              @click="toggleEdit(displayName, localDisplayNameArray, activeEdits)"
            />
          </v-col>
        </v-row>
        <v-form
          v-else
          v-model="formValid"
          @submit.prevent="submitForm(displayName)"
        >
          <v-row>
            <v-col cols="1">
              <v-text-field
                v-model="displayName.language"
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
                v-model="displayName.text"
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
                @click="cancelSubmit(displayName)"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-list-item-subtitle>
    </v-list-item>
    <!-- Add DisplayName Option -->
    <v-list-item v-if="showAddButton(editorMode, activeEdits)">
      <v-btn
        class="text-buttonText"
        color="green"
        density="comfortable"
        rounded="lg"
        text="Add new"
        variant="flat"
        @click="addLangString(localDisplayNameArray, activeEdits)"
      />
    </v-list-item>
  </v-container>
</template>

<script setup lang="ts">
  import type { LangString } from '../ConceptDescriptionElements/EditorComposables/types'
  import { addLangString, deleteItem, languageAlreadyExists, showAddButton, toggleEdit } from '../ConceptDescriptionElements/EditorComposables/cdEditorHandlings'

  // Props
  const props = defineProps({
    displayNameArray: {
      type: Array<LangString>,
      default: [] as Array<LangString>,
    },
    displayNameTitle: {
      type: String,
      default: 'Display Name',
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
      default: 128, // this does not work for all LangStrings but a default is definitely necessary
    },
  })

  const emit = defineEmits<{
    (event: 'update:displayName', value: Array<LangString>): void
  }>()

  const langCodeFixLength = 2
  const rules = {
    required: (value: string) => !!value || 'Field is required',
    language: (value: string) => value.length == langCodeFixLength || 'Language code must contain 2 letters',
    text: (value: string) => (value.length > 0 && value.length <= props.langStringMaxLength) || 'Text must have 1-' + props.langStringMaxLength + ' letters',
    duplicateLanguage: (value: string) => !languageAlreadyExists(value, localDisplayNameArray) || 'A display name with this language already exists',
  }

  const formValid = ref(false)
  const activeEdits: Array<LangString> = reactive([])
  const localDisplayNameArray: Array<LangString> = reactive([])

  function submitForm (displayName: LangString) {
    toggleEdit(displayName, localDisplayNameArray, activeEdits)
    emit('update:displayName', localDisplayNameArray)
  }

  function cancelSubmit (displayName: LangString) {
    deleteItem(displayName, localDisplayNameArray, activeEdits)
    emit('update:displayName', localDisplayNameArray)
  }

  // updates the DisplayNames passed by the parent
  watch(
    () => props.displayNameArray,
    newVal => {
      if (newVal) {
        Object.assign(localDisplayNameArray, structuredClone(toRaw(newVal)))
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
