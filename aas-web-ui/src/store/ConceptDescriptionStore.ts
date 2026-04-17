import { defineStore } from 'pinia'

export const useCDStore = defineStore('CDStore', () => {
  const cdObject = ref({} as any)

  // Getters
  const getSelectedCD = computed(() => cdObject.value)

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
      cdObject.value = {}
    }

    if (!cdValue || Object.keys(cdValue).length === 0) {
      // If emtpy CD is dispatched, clear selectedElement
      cdObject.value = {}
    }

    // If the same CD is dispatched, nothing happened with the selectedElement
    cdObject.value = cdValue
  }

  return {
    // Getters
    getSelectedCD,

    // Actions
    dispatchSelectedCD,
  }
})
