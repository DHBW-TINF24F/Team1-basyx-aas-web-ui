import { useRequestHandling } from '@/composables/RequestHandling'
import { stripLastCharacter } from '@/utils/StringUtils'

export const urlRegex
  = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00A1-\uFFFF][a-z0-9\u00A1-\uFFFF_-]{0,62})?[a-z0-9\u00A1-\uFFFF]\.)+(?:[a-z\u00A1-\uFFFF]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i

export function useUrlUtils () {
  const { getRequest } = useRequestHandling()

  /**
   * Retrieves a Blob object from the specified URL and returns its object URL.
   *
   * This function makes a GET request to the provided URL, and if successful,
   * it generates an object URL for the Blob received in the response.
   *
   * @param {string} url - The URL from which to retrieve the Blob.
   * @returns {string} An object URL representing the Blob, or an empty string if the request fails.
   */
  async function getBlobUrl (url: string, isExternal: boolean): Promise<string> {
    const failResponse = ''

    if (!url || url.trim() === '') {
      return failResponse
    }

    if (isExternal) {
      return url
    }

    const context = 'retrieving File'
    const disableMessage = false
    const response = await getRequest(url, context, disableMessage)
    if (response.success) {
      if (response.data instanceof Blob) {
        return URL.createObjectURL(response.data)
      } else {
        const jsonString = JSON.stringify(response.data)
        const blob = new Blob([jsonString], { type: 'application/json' })
        return URL.createObjectURL(blob)
      }
    }

    return failResponse
  }

  return { getBlobUrl }
}

export type QueryParam = {
  key: string
  value: string
}

/**
 * Adds provided query params to the url.
 * This function assumes that this url does not already have any query params added.
 * Strips away the urls trailing / if it exists.
 *
 * @param url the url to add query params to
 * @param queryParams the query params to add
 * @returns the url with added query params
 */
export function addQueryParams (url: string, queryParams: Array<QueryParam>): string {
  if (queryParams.length === 0) {
    return url
  }

  if (url.endsWith('/')) {
    url = stripLastCharacter(url)
  }

  let queryParamString = ''
  for (const queryParam of queryParams) {
    const paramDelimiter = queryParamString.length > 0 ? '&' : '?'
    queryParamString += paramDelimiter + encodeURIComponent(queryParam.key) + '=' + encodeURIComponent(queryParam.value)
  }

  return url + queryParamString
}
