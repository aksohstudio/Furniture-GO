# Furniture Object Schema

Task 02 establishes the shared model consumed by the Furniture Object Engine. It is a normalized, persisted engineering object; it is not a CAD entity, production calculation result, or 3D mesh.

| Field | Type | Required | Default | PRD source / use |
|---|---|---:|---|---|
| `schemaVersion` | integer | no | `1` | Minimal compatibility version for the shared model |
| `id`, `objectId` | string | yes | none | PRD11/PRD30 stable Furniture Object identity; `id` preserves Task 01 storage compatibility |
| `projectId` | string | yes | none | PRD06 project ownership and traceability |
| `name` | string | yes | none | PRD30 editable object property |
| `objectType`, `furnitureType` | enum string | yes | none | PRD11 furniture types; `furnitureType` preserves Task 01 compatibility |
| `lifecycleStatus` | enum string | yes | `Created` | PRD30 lifecycle; current values are `Created`, `Modified`, `Archived` |
| `productionStatus` | enum string/null | no | `null` | PRD11 production status |
| `createdAt`, `updatedAt` | ISO timestamp/null | yes after persistence | `null` before creation | PRD11 traceability and Task 01 timestamp contract |
| `engineeringRecordId` | string/null | required for generated objects | `null` | PRD11 confirmed Engineering Record reference |
| `designerCabinetId` | string/null | no | `null` | PRD11 designer traceability |
| `factoryReferenceId` | string/null | no | `null` | PRD11 Factory Reference traceability |
| `dimensions` | object | no | `{width:null,height:null,depth:null,thickness:null,unit:null}` | PRD11 Cabinet Dimensions; Task 02 shape only, no calculation/editing |
| `materialReferences` | array | no | `[]` | PRD11/PRD30 material references; entries use `materialId` and optional metadata |
| `hardwareReferences` | array | no | `[]` | PRD11/PRD30 hardware references; entries use `hardwareId` and optional metadata |
| `relationshipReferences` | array | no | `[]` | PRD11 structural relationships / PRD30 parent-child references; no hierarchy engine |
| `cadReferences` | array | no | `[]` | PRD28 drawing references; entries require `drawingId`, optional `entityId`/`layerId` |
| `formulaReferences` | array | no | `[]` | PRD26 downstream calculation references; no formula execution |
| `engineeringRuleReferences` | array | no | `[]` | PRD11 engineering-rule traceability; no rule calculation |
| `validation` | object | no | `{isValid:false,errors:[]}` | Existing Project schema compatibility; Task 08 owns validation behavior |
| `floorId`, `roomId` | string/null | no | `null` | PRD06 project hierarchy traceability |
| `deletedAt` | ISO timestamp/null | no | `null` | Archived lifecycle traceability |

Normalization deep-clones data, supplies explicit defaults, preserves Task 01 objects, and does not create relationships, calculate dimensions, assign materials/hardware, synchronize CAD/formula/3D, or mutate the source object.
