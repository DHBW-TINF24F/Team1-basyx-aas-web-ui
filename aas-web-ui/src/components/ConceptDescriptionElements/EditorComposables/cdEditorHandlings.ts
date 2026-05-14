import type { LangString } from './types'

// ------LangString Handlings------
export function languageAlreadyExists (value: LangString | string, localLangStrings: Array<LangString>) {
  if (typeof value === 'string') {
    let count = 0
    for (const element of localLangStrings) {
      if (element.language === value) {
        count++
      }
      if (count > 1) {
        return true
      }
    }
  } else {
    for (const element of localLangStrings) {
      if (element !== value && element.language === value.language) {
        return true
      }
    }
  }
  return false
}

export function addLangString (localLangStrings: Array<LangString>, activeEdits: Array<LangString>) {
  const newLangString = { language: '', text: '' }
  localLangStrings.push(newLangString)
  toggleEdit(newLangString, localLangStrings, activeEdits)
}

export function toggleEdit (langString: LangString, localLangStrings: Array<LangString>, activeEdits: Array<LangString>) {
  if (!langString) {
    return
  }
  if (activeEdits && activeEdits.includes(langString)) {
    // turn edit mode off
    if (!languageAlreadyExists(langString, localLangStrings)) {
      removeFromArray(langString, activeEdits)
    }
  } else {
    // turn edit mode on
    activeEdits.push(langString)
  }
}

export function deleteItem (item: LangString, localLangStrings: Array<LangString>, activeEdits: Array<LangString>) {
  removeFromArray(item, activeEdits)
  removeFromArray(item, localLangStrings)
}

export function removeFromArray (element: LangString, array: Array<LangString>) {
  if (array && array.includes(element)) {
    const indexPos = array.indexOf(element)
    if (indexPos != -1) {
      array.splice(indexPos, 1)
    }
  }
}

export function showAddButton (editorMode: boolean, activeEdits: Array<LangString>) {
  return (
    editorMode
    && activeEdits
    && activeEdits.length === 0
  )
}
