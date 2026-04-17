import { defineStore } from 'pinia'

export const useCDStore = defineStore('CDStore', () => {
  const cdObject = ref({} as any)
  const selectedElement = ref({} as any)

  // Getters
  const getSelectedCD = computed(() => cdObject.value)
  const getSelectedElement = computed(() => selectedElement.value)

  // Actions
  function dispatchSelectedCD (cdValue: any): void {
    // If existing CD is replaced by another one, clear selectedElement.
    if (cdObject.value
      && Object.keys(cdObject.value).length > 0
      && cdObject.value?.id
      && cdValue
      && Object.keys(cdValue).length > 0
      && cdValue?.id
      && cdObject.value?.id !== cdValue?.id) {
      selectedElement.value = {}
    }

    if (!cdValue || Object.keys(cdValue).length === 0) {
      // If emtpy CD is dispatched, clear selectedElement
      selectedElement.value = {}
    }

    // If the same CD is dispatched, nothing happened with the selectedElement
    cdObject.value = cdValue
  }

  function dispatchSelectedElement (selectedElementValue: any): void {
    selectedElement.value = selectedElementValue
  }

  return {
    // Getters
    getSelectedCD,
    getSelectedElement,

    // Actions
    dispatchSelectedCD,
    dispatchSelectedElement,
  }
})
