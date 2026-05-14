# Done
- CD
	- Identifiable
		- Referable
			- HasExtensions
	- HasDataSpecification


# HasDataSpecification
- dataSpecification -> Reference

# HasExtensions
- extension -> Extension

# Referable
- category (Deprecated) -> NameType
- idShort -> NameType
- displayName -> MultiLanguageNameType
- description -> MultiLanguageTextType

# Identifiable
- administration -> AdministrativeInformation
- id -> Identifier

# Reference
- type -> ReferenceTypes
- referredSemanticId -> Reference
- key (ordered) -> Key

# ReferenceTypes
- ExternalReference -> #TBD
- ModelReference -> #TBD 

# Key
- type -> KeyTypes
- value -> Identifier

# KeyTypes #TBD
- AnnotatedRelationshipElement -> #TBD
- AssetAdministrationShell -> #TBD
- BasicEventElement -> #TBD
- Blob -> #TBD
- Capability -> #TBD
- ConceptDescription -> #TBD
- DataElement -> #TBD
- Entity -> #TBD
- EventElement -> #TBD
- File -> #TBD
- FragmentReference -> #TBD
- GlobalReference -> #TBD
- Identifiable -> #TBD
- MultiLanguageProperty -> #TBD
- Operation -> #TBD
- Property -> #TBD
- Range -> #TBD
- Referable -> #TBD
- ReferenceElement -> #TBD
- RelationshipElement -> #TBD
- Submodel -> #TBD
- SubmodelElement -> #TBD
- SubmodelElementCollection -> #TBD
- SubmodelElementList -> #TBD

# Identifier
- string with max 2048 and min 1 characters
- Note: For Identifier it is recommended to use existing standards, for example ID-Link (IEC 61406) may be used for the [globalAssetId](https://industrialdigitaltwin.io/aas-specifications/IDTA-01001/v3.2/spec-metamodel/core.html#AssetInformation). Typically, identifier strings do not contain blanks, emoticons or carriage returns because they are not representable in existing systems.
- Examlpe value: https://cust/1234560173-1#02-BAA120#008

# AdministrativeInformation
- version -> VersionType
- revision -> RevisionType
- creator -> Reference
- createdAt -> dateTime #TimeFormat
- updatedAt -> dateTime #TimeFormat
- templateId -> Identifier

# VersionType
string with max 4 and min 1 characters following the following regular expression:
`^([0-9][1-9][0-9]*)$`

# RevisionType
string with max 4 and min 1 characters following the following regular expression:
`^([0-9][1-9][0-9]*)$`

# NameType
string with max 128 and min 1 characters

# LangStringSet
[LangStringSet](https://industrialdigitaltwin.io/aas-specifications/IDTA-01001/v3.2/spec-metamodel/datatypes.html#LangStringSet)
```json
[
	{
		"language": "en",
		"text": "This is a multi-language value in English"
	},
	{
	    "language":"de",
	    "text": "Das ist ein Multi-Language-Wert in Deutsch."
	}
]
```

# MultiLanguageNameType 
-> LangStringSet
Each LangString within the array of strings has a max 128 of and a min of 1 characters (as for NameType).

# MultiLanguageTextType 
-> LangStringSet
Each string within langString has a max of 1,023 and min of 1 characters.

# Extension
- name -> NameType
- valueType -> DataTypeDefXsd
- value -> ValueDataType
- refersTo -> ModelReference(Referable) #CheckIfRelevant

# ValueDataType
any xsd atomic type as specified via DataTypeDefXsd

# DataTypeDefXsd
- xs:anyURI -> see: [https://www.w3.org/TR/xmlschema-2/#anyURI](https://www.w3.org/TR/xmlschema-2/#anyURI)
- xs:base64Binary -> see: [https://www.w3.org/TR/xmlschema-2/#base64Binary](https://www.w3.org/TR/xmlschema-2/#base64Binary)
- xs:boolean -> see [https://www.w3.org/TR/xmlschema-2/#boolean](https://www.w3.org/TR/xmlschema-2/#boolean)
- xs:byte -> see [https://www.w3.org/TR/xmlschema-2/#byte](https://www.w3.org/TR/xmlschema-2/#byte)
- xs:date -> see [https://www.w3.org/TR/xmlschema-2/#date](https://www.w3.org/TR/xmlschema-2/#date)
- xs:dateTime -> see [https://www.w3.org/TR/xmlschema-2/#dateTime](https://www.w3.org/TR/xmlschema-2/#dateTime)
- xs:decimal -> see [https://www.w3.org/TR/xmlschema-2/#decimal](https://www.w3.org/TR/xmlschema-2/#decimal)
- xs:double -> see [https://www.w3.org/TR/xmlschema-2/#double](https://www.w3.org/TR/xmlschema-2/#double)
- xs:duration -> see [https://www.w3.org/TR/xmlschema-2/#duration](https://www.w3.org/TR/xmlschema-2/#duration)
- xs:float -> see [https://www.w3.org/TR/xmlschema-2/#float](https://www.w3.org/TR/xmlschema-2/#float)
- xs:gDay -> see [https://www.w3.org/TR/xmlschema-2/#gDay](https://www.w3.org/TR/xmlschema-2/#gDay)
- xs:gMonth -> see [https://www.w3.org/TR/xmlschema-2/#gMonth](https://www.w3.org/TR/xmlschema-2/#gMonth)
- xs:gMonthDay -> see [https://www.w3.org/TR/xmlschema-2/#gMonthDay](https://www.w3.org/TR/xmlschema-2/#gMonthDay)
- xs:gYear -> see [https://www.w3.org/TR/xmlschema-2/#gYear](https://www.w3.org/TR/xmlschema-2/#gYear)
- xs:gYearMonth -> see [https://www.w3.org/TR/xmlschema-2/#gYearMonth](https://www.w3.org/TR/xmlschema-2/#gYearMonth)
- xs:hexBinary -> see [https://www.w3.org/TR/xmlschema-2/#hexBinary](https://www.w3.org/TR/xmlschema-2/#hexBinary)
- xs:int -> see [https://www.w3.org/TR/xmlschema-2/#int](https://www.w3.org/TR/xmlschema-2/#int)
- xs:integer -> see [https://www.w3.org/TR/xmlschema-2/#integer](https://www.w3.org/TR/xmlschema-2/#integer)
- xs:long -> see [https://www.w3.org/TR/xmlschema-2/#long](https://www.w3.org/TR/xmlschema-2/#long)
- xs:negativeInteger -> see [https://www.w3.org/TR/xmlschema-2/#negativeInteger](https://www.w3.org/TR/xmlschema-2/#negativeInteger)
- xs:nonNegativeInteger -> see: [https://www.w3.org/TR/xmlschema-2/#nonNegativeInteger](https://www.w3.org/TR/xmlschema-2/#nonNegativeInteger)
- xs:nonPositiveInteger -> see: [https://www.w3.org/TR/xmlschema-2/#nonPositiveInteger](https://www.w3.org/TR/xmlschema-2/#nonPositiveInteger)
- xs:positiveInteger -> see: [https://www.w3.org/TR/xmlschema-2/#positiveInteger](https://www.w3.org/TR/xmlschema-2/#positiveInteger)
- xs:short -> see: [https://www.w3.org/TR/xmlschema-2/#short](https://www.w3.org/TR/xmlschema-2/#short)
- xs:string -> see: [https://www.w3.org/TR/xmlschema-2/#string](https://www.w3.org/TR/xmlschema-2/#string)
- xs:time -> see: [https://www.w3.org/TR/xmlschema-2/#time](https://www.w3.org/TR/xmlschema-2/#time)
- xs:unsignedByte -> see: [https://www.w3.org/TR/xmlschema-2/#unsignedShort](https://www.w3.org/TR/xmlschema-2/#unsignedShort)
- xs:unsignedInt -> see: [https://www.w3.org/TR/xmlschema-2/#unsignedInt](https://www.w3.org/TR/xmlschema-2/#unsignedInt)
- xs:unsignedLong -> see: [https://www.w3.org/TR/xmlschema-2/#unsignedLong](https://www.w3.org/TR/xmlschema-2/#unsignedLong)
- xs:unsignedShort -> see: [https://www.w3.org/TR/xmlschema-2/#unsignedShort](https://www.w3.org/TR/xmlschema-2/#unsignedShort)
