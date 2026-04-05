import type { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript'
import { jsonization } from '@aas-core-works/aas-core3.1-typescript'
import { computed } from 'vue'
import { useRequestHandling } from '@/composables/RequestHandling'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { base64Encode } from '@/utils/EncodeDecodeUtils'
import { stripLastCharacter } from '@/utils/StringUtils'

export function useCDRepositoryClient () {
  // Stores
  const infrastructureStore = useInfrastructureStore()

  // Composables
  const { getRequest, postRequest, putRequest } = useRequestHandling()

  const endpointPath = '/concept-descriptions'

  // Computed Properties
  const conceptDescriptionRepoUrl = computed(() => infrastructureStore.getConceptDescriptionRepoURL)

  /**
   * Fetches a list of all available Concept Descriptions (CDs).
   *
   * @async
   * @returns {Promise<Array<any>>} A promise that resolves to an array of CDs.
   * An empty array is returned if the request fails or no CDs are found.
   */
  async function fetchCdList (): Promise<Array<any>> {
    const failResponse = [] as Array<any>

    if (conceptDescriptionRepoUrl.value.trim() === '') {
      return failResponse
    }

    let cdRepoUrl = conceptDescriptionRepoUrl.value
    if (cdRepoUrl.trim() === '') {
      return failResponse
    }
    if (cdRepoUrl.endsWith('/')) {
      cdRepoUrl = stripLastCharacter(cdRepoUrl)
    }
    if (!cdRepoUrl.endsWith(endpointPath)) {
      cdRepoUrl += endpointPath
    }

    const cdRepoPath = cdRepoUrl
    const cdRepoContext = 'retrieving all CDs'
    const disableMessage = false
    try {
      const cdRepoResponse = await getRequest(cdRepoPath, cdRepoContext, disableMessage)
      if (cdRepoResponse.success && cdRepoResponse.data.result && cdRepoResponse.data.result.length > 0) {
        return cdRepoResponse.data.result
      }
    } catch (error) {
      console.warn(error)
      return failResponse
    }

    return failResponse
  }

  /**
   * Fetches a Concept Description (CD) by the provided CD ID.
   *
   * @async
   * @param {string} cdId - The ID of the CD to fetch.
   * @returns {Promise<any>} A promise that resolves to a CD.
   */
  async function fetchCdById (cdId: string, endpoint?: string): Promise<any> {
    const failResponse = {} as any

    if (!cdId) {
      return failResponse
    }

    cdId = cdId.trim()

    if (cdId === '') {
      return failResponse
    }

    if (conceptDescriptionRepoUrl.value.trim() === '' && !endpoint) {
      return failResponse
    }

    let cdRepoUrl = endpoint || conceptDescriptionRepoUrl.value
    if (cdRepoUrl.trim() === '') {
      return failResponse
    }
    if (cdRepoUrl.endsWith('/')) {
      cdRepoUrl = stripLastCharacter(cdRepoUrl)
    }
    if (!cdRepoUrl.endsWith(endpointPath)) {
      cdRepoUrl += endpointPath
    }

    const cdEndpoint = cdRepoUrl + '/' + base64Encode(cdId)
    return fetchCd(cdEndpoint)
  }

  async function fetchCd (cdEndpoint: string): Promise<any> {
    const failResponse = {} as any

    if (!cdEndpoint) {
      return failResponse
    }

    cdEndpoint = cdEndpoint.trim()

    if (cdEndpoint === '') {
      return failResponse
    }

    const cdRepoPath = cdEndpoint
    const cdRepoContext = 'retrieving CD'
    const disableMessage = true
    try {
      const cdRepoResponse = await getRequest(cdRepoPath, cdRepoContext, disableMessage)
      if (cdRepoResponse?.success && cdRepoResponse?.data && Object.keys(cdRepoResponse?.data).length > 0) {
        const cd = cdRepoResponse.data
        cd.endpoints = [{ protocolInformation: { href: cdRepoPath }, interface: 'CONCEPTDESCRIPTION-3.0' }]
        return cd
      }
    } catch (error) {
      console.warn(error)
      return failResponse
    }

    return failResponse
  }

  async function isAvailableByIdInRepo (cdId: string): Promise<boolean> {
    const failResponse = false

    if (!cdId) {
      return failResponse
    }

    cdId = cdId.trim()

    if (cdId === '') {
      return failResponse
    }

    const cd = await fetchCdById(cdId)

    if (cd && Object.keys(cd).length > 0) {
      return true
    }

    return failResponse
  }

  async function isAvailable (cdEndpoint: string): Promise<boolean> {
    const failResponse = false

    if (!cdEndpoint) {
      return failResponse
    }

    cdEndpoint = cdEndpoint.trim()

    if (cdEndpoint === '') {
      return failResponse
    }

    const cdRepoPath = cdEndpoint
    const cdRepoContext = 'evaluating CD Status'
    const disableMessage = true

    try {
      const cdRepoResponse = await getRequest(cdRepoPath, cdRepoContext, disableMessage)
      if (cdRepoResponse?.success && cdRepoResponse?.data && Object.keys(cdRepoResponse?.data).length > 0) {
        return true
      }
    } catch (error) {
      console.warn(error)
      return failResponse
    }

    return failResponse
  }

  function getCdEndpointById (cdId: string): string {
    const failResponse = ''

    if (!cdId) {
      return failResponse
    }

    cdId = cdId.trim()

    if (cdId === '') {
      return failResponse
    }

    if (conceptDescriptionRepoUrl.value.trim() === '') {
      return failResponse
    }

    let cdRepoUrl = conceptDescriptionRepoUrl.value
    if (cdRepoUrl.trim() === '') {
      return failResponse
    }
    if (cdRepoUrl.endsWith('/')) {
      cdRepoUrl = stripLastCharacter(cdRepoUrl)
    }
    if (!cdRepoUrl.endsWith(endpointPath)) {
      cdRepoUrl += endpointPath
    }

    const cdEndpoint = cdRepoUrl + '/' + base64Encode(cdId)

    return cdEndpoint || failResponse
  }

  async function postConceptDescription (conceptDescription: aasTypes.ConceptDescription): Promise<boolean> {
    const failResponse = false

    let cdRepoUrl = conceptDescriptionRepoUrl.value.trim()
    if (cdRepoUrl === '') {
      return failResponse
    }
    if (cdRepoUrl.endsWith('/')) {
      cdRepoUrl = stripLastCharacter(cdRepoUrl)
    }
    if (!cdRepoUrl.endsWith(endpointPath)) {
      cdRepoUrl += endpointPath
    }

    const jsonConceptDescription = jsonization.toJsonable(conceptDescription)

    const context = 'creating Concept Description'
    const disableMessage = true
    const path = cdRepoUrl
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const body = JSON.stringify(jsonConceptDescription)

    const response = await postRequest(path, body, headers, context, disableMessage)
    if (response.success) {
      return true
    }

    const conceptDescriptionId = conceptDescription.id?.trim()
    if (conceptDescriptionId) {
      const alreadyExists = await isAvailableByIdInRepo(conceptDescriptionId)
      if (alreadyExists) {
        return true
      }
    }

    return failResponse
  }

  async function putConceptDescription (conceptDescription: aasTypes.ConceptDescription): Promise<boolean> {
    const failResponse = false

    let cdRepoUrl = conceptDescriptionRepoUrl.value.trim()
    if (cdRepoUrl === '') {
      return failResponse
    }
    if (cdRepoUrl.endsWith('/')) {
      cdRepoUrl = stripLastCharacter(cdRepoUrl)
    }
    if (!cdRepoUrl.endsWith(endpointPath)) {
      cdRepoUrl += endpointPath
    }

    const jsonConceptDescription = jsonization.toJsonable(conceptDescription)

    const context = 'updating Concept Description'
    const disableMessage = false
    const path = cdRepoUrl + '/' + base64Encode(conceptDescription.id)
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const body = JSON.stringify(jsonConceptDescription)

    const response = await putRequest(path, body, headers, context, disableMessage)
    return response.success
  }

  async function createCd (cd: any): Promise<{ success: boolean; data?: any }> {
    const failResponse = { success: false }

    if (!cd) return failResponse

    let cdRepoUrl = conceptDescriptionRepoUrl.value
    if (cdRepoUrl.trim() === '') return failResponse
    if (cdRepoUrl.endsWith('/')) cdRepoUrl = stripLastCharacter(cdRepoUrl)
    if (!cdRepoUrl.endsWith(endpointPath)) cdRepoUrl += endpointPath

    const headers = new Headers()
    headers.set('Content-Type', 'application/json')

    try {
      const response = await postRequest(cdRepoUrl, JSON.stringify(cd), headers, 'creating CD', false)
      return response ?? failResponse
    } catch (e) {
      console.warn(e)
      return failResponse
    }
  }

  async function updateCd (cdId: string, cd: any): Promise<{ success: boolean; data?: any }> {
    const failResponse = { success: false }

    if (!cdId || !cd) return failResponse

    let cdRepoUrl = conceptDescriptionRepoUrl.value
    if (cdRepoUrl.trim() === '') return failResponse
    if (cdRepoUrl.endsWith('/')) cdRepoUrl = stripLastCharacter(cdRepoUrl)
    if (!cdRepoUrl.endsWith(endpointPath)) cdRepoUrl += endpointPath

    const cdEndpoint = cdRepoUrl + '/' + base64Encode(cdId)

    const headers = new Headers()
    headers.set('Content-Type', 'application/json')

    try {
      const response = await putRequest(cdEndpoint, JSON.stringify(cd), headers, 'updating CD', false)
      return response ?? failResponse
    } catch (e) {
      console.warn(e)
      return failResponse
    }
  }

  return {
    endpointPath,
    fetchCdList,
    fetchCdById,
    fetchCd,
    isAvailableByIdInRepo,
    isAvailable,
    getCdEndpointById,
    postConceptDescription,
    putConceptDescription,
    createCd,
    updateCd,
  }
}
