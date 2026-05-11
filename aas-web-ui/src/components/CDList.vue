<template>
  <v-container fluid class="pa-0">
    <v-text-field
      v-model="search"
      class="mb-4"
      density="compact"
      hide-details
      label="Type to search for specific ConceptDescriptions..."
      variant="outlined"
    />
    <v-data-table :headers="headers" :items="filteredData"></v-data-table>
  </v-container>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue';
import { useCDRepositoryClient } from '@/composables/Client/CDRepositoryClient';


  const cdRepoClient = useCDRepositoryClient()
  const cdData = ref<any[]>([])
  const search = ref('')

  const headers = [
		{ title: 'ID Short', key: 'idShort', width: '1fr' },
		{ title: 'Unit', key: 'unit', width: '1fr' },
		{ title: 'Definition', key: 'definition', width: '5fr' },
    { title: 'ID', key: 'id', width: '2fr' },
	]

	onMounted(async () => {
		cdData.value = await cdRepoClient.fetchCdList()
	})

	const displayData = computed(() => {
		return cdData.value.map(item => ({
			...item,
			unit: getUnit(item),
			definition: getDefinition(item)
		}))
	})

  const filteredData = computed(() => {
    const query = search.value.trim().toLowerCase()

    if (!query) {
      return displayData.value
    }

    return displayData.value.filter((item) => {
      return [item.idShort, item.unit, item.definition, item.id]
        .filter((value) => value !== undefined && value !== null)
        .some((value) => String(value).toLowerCase().includes(query))
    })
  })

	function getUnit(item: any): string {
		for (const embeddedSpec in item.embeddedDataSpecifications) {
      const spec = item.embeddedDataSpecifications[embeddedSpec]
      if (spec.dataSpecificationContent && spec.dataSpecificationContent.unit) {
        return spec.dataSpecificationContent.unit
      }
    }
		return ''
	}

	function getDefinition(item: any): string {
		for (const embeddedSpec in item.embeddedDataSpecifications) {
      const spec = item.embeddedDataSpecifications[embeddedSpec]
      if (spec.dataSpecificationContent && spec.dataSpecificationContent.definition) {
        const definitions = spec.dataSpecificationContent.definition
        
        if (!Array.isArray(definitions)) return ''
        
        const enDef = definitions.find((def: any) => def.language === 'en')
        if (enDef?.text) {
          return enDef.text
        }

        if (definitions.length > 0 && definitions[0]?.text) {
          return definitions[0].text
        }
      }
    }
    return ''
	}

</script>