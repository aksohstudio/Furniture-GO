async function request(
  path,
  options = {}
) {
  const response =
    await fetch(
      path,
      {
        ...options,

        headers: {
          ...(options.body instanceof FormData
            ? {}
            : {
                'Content-Type':
                  'application/json',
              }),

          ...(options.headers || {}),
        },
      }
    );

  const contentType =
    response.headers.get(
      'content-type'
    ) || '';

  const data =
    contentType.includes(
      'application/json'
    )
      ? await response.json()
      : {
          error:
            `Project API returned non-JSON response (${response.status})`,
        };

  if (!response.ok) {
    throw new Error(
      data.error ||
        'Request failed'
    );
  }

  return data;
}

async function requestPdf(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'PDF Export failed');
  }
  const contentDisposition = response.headers.get('content-disposition') || '';
  const filenameMatch = contentDisposition.match(/filename="([^"]+)"/i);
  return { blob: await response.blob(), filename: filenameMatch?.[1] || 'FurnitureGO_Drawing.pdf' };
}

function readFileAsBase64(
  file
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const reader =
        new FileReader();

      reader.onload = () => {
        try {
          const result =
            String(
              reader.result || ''
            );

          const commaIndex =
            result.indexOf(',');

          if (
            commaIndex === -1
          ) {
            throw new Error(
              'Unable to read PDF file data'
            );
          }

          resolve(
            result.slice(
              commaIndex + 1
            )
          );
        } catch (
          error
        ) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(
          new Error(
            'Unable to read PDF file'
          )
        );
      };

      reader.readAsDataURL(
        file
      );
    }
  );
}

export const projectClient = {
  /*
   * =====================================================
   * Projects
   * =====================================================
   */

  listProjects: () =>
    request(
      '/api/projects'
    ),

  createProject: (
    name
  ) =>
    request(
      '/api/projects',
      {
        method: 'POST',

        body:
          JSON.stringify({
            name,
          }),
      }
    ),

  getProject: (
    id
  ) =>
    request(
      `/api/projects/${encodeURIComponent(
        id
      )}`
    ),

  /*
   * =====================================================
   * Sprint 03 — Engineering Review
   * =====================================================
   */

  getEngineeringIssues: (
    projectId
  ) =>
    request(
      `/api/projects/${encodeURIComponent(
        projectId
      )}/engineering-issues`
    ),

  getEngineeringIssue: (
    projectId,
    issueId
  ) =>
    request(
      `/api/projects/${encodeURIComponent(
        projectId
      )}/engineering-issues/${encodeURIComponent(
        issueId
      )}`
    ),

  getRecognitionSummary: (
    projectId
  ) =>
    request(
      `/api/projects/${encodeURIComponent(
        projectId
      )}/recognition-summary`
    ),

  /*
   * =====================================================
   * Project lifecycle
   * =====================================================
   */

  archiveProject: (
    id
  ) =>
    request(
      `/api/projects/${encodeURIComponent(
        id
      )}/archive`,
      {
        method: 'POST',
      }
    ),

  trashProject: (
    id
  ) =>
    request(
      `/api/projects/${encodeURIComponent(
        id
      )}/trash`,
      {
        method: 'POST',
      }
    ),

  restoreProject: (
    id
  ) =>
    request(
      `/api/projects/${encodeURIComponent(
        id
      )}/restore`,
      {
        method: 'POST',
      }
    ),

  listFurnitureObjects: (projectId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects`),

  generateProductionDrawing: (projectId, objectId, drawingType = 'basic', panelId = null, drawerId = null, hardwareId = null) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/production-drawings/generate`, {
      method: 'POST',
      body: JSON.stringify({ objectId, drawingType, ...(panelId ? { panelId } : {}), ...(drawerId ? { drawerId } : {}), ...(hardwareId ? { hardwareId } : {}) }),
    }),

  generateProductionPackage: (projectId, objectId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/production-drawings/generate`, {
      method: 'POST',
      body: JSON.stringify({ objectId, drawingType: 'package' }),
    }),

  generateCuttingList: (projectId, objectId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/cutting-list/generate`, {
      method: 'POST',
      body: JSON.stringify({ objectId }),
    }),

  generateCuttingListLayout: (projectId, objectId, cuttingListId = null) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/cutting-list/board-layout`, {
      method: 'POST',
      body: JSON.stringify({ objectId, ...(cuttingListId ? { cuttingListId } : {}) }),
    }),

  generateMaterialStats: (projectId, objectId, cuttingListId = null, boardLayoutId = null) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/cutting-list/material-statistics`, {
      method: 'POST',
      body: JSON.stringify({ objectId, ...(cuttingListId ? { cuttingListId } : {}), ...(boardLayoutId ? { boardLayoutId } : {}) }),
    }),

  generateWasteAnalysis: (projectId, objectId, cuttingListId = null, boardLayoutId = null, materialStatisticsId = null) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/cutting-list/waste-analysis`, {
      method: 'POST',
      body: JSON.stringify({ objectId, ...(cuttingListId ? { cuttingListId } : {}), ...(boardLayoutId ? { boardLayoutId } : {}), ...(materialStatisticsId ? { materialStatisticsId } : {}) }),
    }),

  generateInformationPanel: (projectId, objectId, cuttingListId = null, boardLayoutId = null, materialStatisticsId = null, wasteAnalysisId = null) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/cutting-list/information-panel`, {
      method: 'POST',
      body: JSON.stringify({ objectId, ...(cuttingListId ? { cuttingListId } : {}), ...(boardLayoutId ? { boardLayoutId } : {}), ...(materialStatisticsId ? { materialStatisticsId } : {}), ...(wasteAnalysisId ? { wasteAnalysisId } : {}) }),
    }),

  generatePartTrace: (projectId, objectId, partId, cuttingListId = null, boardLayoutId = null, materialStatisticsId = null, wasteAnalysisId = null) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/cutting-list/part-trace`, {
      method: 'POST',
      body: JSON.stringify({ objectId, partId, ...(cuttingListId ? { cuttingListId } : {}), ...(boardLayoutId ? { boardLayoutId } : {}), ...(materialStatisticsId ? { materialStatisticsId } : {}), ...(wasteAnalysisId ? { wasteAnalysisId } : {}) }),
    }),

  prepareCuttingListPrint: (projectId, objectId, printType = 'current-view', references = {}) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/cutting-list/print`, {
      method: 'POST',
      body: JSON.stringify({ objectId, printType, ...references }),
    }),

  exportCuttingListPdf: (projectId, objectId, printType = 'current-view', references = {}) =>
    requestPdf(`/api/projects/${encodeURIComponent(projectId)}/cutting-list/export-pdf`, {
      method: 'POST',
      body: JSON.stringify({ objectId, printType, ...references }),
    }),

  exportCuttingListExcel: (projectId, objectId, results) =>
    requestPdf(`/api/projects/${encodeURIComponent(projectId)}/cutting-list/export-excel`, {
      method: 'POST',
      body: JSON.stringify({ objectId, results }),
    }),

  generatePurchaseList: (projectId, cuttingListResult = null, cuttingListResults = null) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/purchase-list/generate`, {
      method: 'POST',
      body: JSON.stringify({ ...(cuttingListResult ? { cuttingListResult } : {}), ...(cuttingListResults ? { cuttingListResults } : {}) }),
    }),

  buildHardwareList: (projectId, purchaseListResult, objectId = null) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/purchase-list/hardware-list`, {
      method: 'POST',
      body: JSON.stringify({ purchaseListResult, ...(objectId ? { objectId } : {}) }),
    }),

  buildAccessoriesList: (projectId, purchaseListResult, objectId = null) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/purchase-list/accessories-list`, {
      method: 'POST',
      body: JSON.stringify({ purchaseListResult, ...(objectId ? { objectId } : {}) }),
    }),

  buildPurchaseSummary: (projectId, purchaseListResult) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/purchase-list/summary`, {
      method: 'POST',
      body: JSON.stringify({ purchaseListResult }),
    }),

  buildCategoryManagement: (projectId, purchaseListResult) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/purchase-list/categories`, {
      method: 'POST',
      body: JSON.stringify({ purchaseListResult }),
    }),

  buildPurchaseReports: (projectId, purchaseListResult) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/purchase-list/reports`, {
      method: 'POST',
      body: JSON.stringify({ purchaseListResult }),
    }),

  preparePurchaseListPrint: (projectId, purchaseListResult) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/purchase-list/print`, {
      method: 'POST',
      body: JSON.stringify({ purchaseListResult }),
    }),

  exportPurchaseListPdf: (projectId, purchaseListResult) =>
    requestPdf(`/api/projects/${encodeURIComponent(projectId)}/purchase-list/export-pdf`, {
      method: 'POST',
      body: JSON.stringify({ purchaseListResult }),
    }),

  exportPurchaseListExcel: (projectId, purchaseListResult) =>
    requestPdf(`/api/projects/${encodeURIComponent(projectId)}/purchase-list/export-excel`, {
      method: 'POST',
      body: JSON.stringify({ purchaseListResult }),
    }),

  exportProductionDrawingPdf: (projectId, objectId, drawingType = 'basic') =>
    requestPdf(`/api/projects/${encodeURIComponent(projectId)}/production-drawings/export-pdf`, {
      method: 'POST',
      body: JSON.stringify({ objectId, drawingType }),
    }),

  exportProductionDrawingDwg: async (projectId, objectId, drawingType = 'basic') => {
    const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/production-drawings/export-dwg`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objectId, drawingType }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'DWG Export failed');
    }
    const contentDisposition = response.headers.get('content-disposition') || '';
    const filenameMatch = contentDisposition.match(/filename="([^"]+)"/i);
    return { blob: await response.blob(), filename: filenameMatch?.[1] || 'FurnitureGO_Drawing.dwg' };
  },

  createProductionDrawingRevision: (projectId, objectId, drawingType = 'basic', changeSummary = '') =>
    request(`/api/projects/${encodeURIComponent(projectId)}/production-drawings/revisions`, {
      method: 'POST',
      body: JSON.stringify({ objectId, drawingType, ...(changeSummary ? { changeSummary } : {}) }),
    }),

  listProductionDrawingRevisions: (projectId, objectId, drawingId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/production-drawings/revisions?objectId=${encodeURIComponent(objectId)}&drawingId=${encodeURIComponent(drawingId)}`),

  getProductionDrawingRevision: (projectId, objectId, drawingId, revisionId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/production-drawings/revisions/${encodeURIComponent(revisionId)}?objectId=${encodeURIComponent(objectId)}&drawingId=${encodeURIComponent(drawingId)}`),

  compareProductionDrawingRevision: (projectId, objectId, drawingType, revisionId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/production-drawings/revisions/${encodeURIComponent(revisionId)}/compare`, {
      method: 'POST',
      body: JSON.stringify({ objectId, drawingType }),
    }),

  calculateProductionFormula: (projectId, objectId, ruleId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/production-formula/calculate`, {
      method: 'POST',
      body: JSON.stringify({ objectId, ruleId }),
    }),

  getFurnitureObject: (projectId, objectId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects/${encodeURIComponent(objectId)}`),

  createFurnitureObject: (projectId, object) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects`, {
      method: 'POST',
      body: JSON.stringify(object),
    }),

  updateFurnitureObject: (projectId, objectId, changes) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects/${encodeURIComponent(objectId)}`, {
      method: 'PATCH',
      body: JSON.stringify(changes),
    }),

  deleteFurnitureObject: (projectId, objectId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects/${encodeURIComponent(objectId)}`, {
      method: 'DELETE',
    }),

  setFurnitureObjectParent: (projectId, objectId, parentObjectId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects/${encodeURIComponent(objectId)}/parent`, {
      method: 'POST',
      body: JSON.stringify({ parentObjectId }),
    }),

  removeFurnitureObjectParent: (projectId, objectId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects/${encodeURIComponent(objectId)}/parent`, {
      method: 'DELETE',
    }),

  getFurnitureObjectParent: (projectId, objectId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects/${encodeURIComponent(objectId)}/parent`),

  getFurnitureObjectChildren: (projectId, objectId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects/${encodeURIComponent(objectId)}/children`),

  getFurnitureObjectHierarchy: (projectId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects/hierarchy`),

  getFurnitureObjectCadReferences: (projectId, objectId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects/${encodeURIComponent(objectId)}/cad-references`),

  syncFurnitureObjectCadReference: (projectId, objectId, reference) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects/${encodeURIComponent(objectId)}/cad-references`, {
      method: 'POST', body: JSON.stringify(reference),
    }),

  removeFurnitureObjectCadReference: (projectId, objectId, drawingId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects/${encodeURIComponent(objectId)}/cad-references/${encodeURIComponent(drawingId)}`, { method: 'DELETE' }),

  getFurnitureObjectFormulaReferences: (projectId, objectId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects/${encodeURIComponent(objectId)}/formula-references`),

  assignFurnitureObjectFormula: (projectId, objectId, formulaId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects/${encodeURIComponent(objectId)}/formula-references`, {
      method: 'POST', body: JSON.stringify({ formulaId }),
    }),

  removeFurnitureObjectFormula: (projectId, objectId, formulaId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects/${encodeURIComponent(objectId)}/formula-references/${encodeURIComponent(formulaId)}`, { method: 'DELETE' }),

  listOfficialMaterials: () => request('/api/materials'),

  getFurnitureObjectMaterials: (projectId, objectId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects/${encodeURIComponent(objectId)}/materials`),

  assignFurnitureObjectMaterial: (projectId, objectId, materialId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects/${encodeURIComponent(objectId)}/materials`, {
      method: 'POST', body: JSON.stringify({ materialId }),
    }),

  removeFurnitureObjectMaterial: (projectId, objectId, materialId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects/${encodeURIComponent(objectId)}/materials/${encodeURIComponent(materialId)}`, { method: 'DELETE' }),

  replaceFurnitureObjectMaterial: (projectId, objectId, oldMaterialId, materialId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects/${encodeURIComponent(objectId)}/materials/${encodeURIComponent(oldMaterialId)}`, {
      method: 'PUT', body: JSON.stringify({ materialId }),
    }),

  listOfficialHardware: () => request('/api/hardware'),

  getFurnitureObjectHardware: (projectId, objectId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects/${encodeURIComponent(objectId)}/hardware`),

  assignFurnitureObjectHardware: (projectId, objectId, hardwareId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects/${encodeURIComponent(objectId)}/hardware`, { method: 'POST', body: JSON.stringify({ hardwareId }) }),

  removeFurnitureObjectHardware: (projectId, objectId, hardwareId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects/${encodeURIComponent(objectId)}/hardware/${encodeURIComponent(hardwareId)}`, { method: 'DELETE' }),

  replaceFurnitureObjectHardware: (projectId, objectId, oldHardwareId, hardwareId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects/${encodeURIComponent(objectId)}/hardware/${encodeURIComponent(oldHardwareId)}`, { method: 'PUT', body: JSON.stringify({ hardwareId }) }),

  /*
   * =====================================================
   * Working State
   * =====================================================
   */

  saveWorkingState: (
    id,
    changes,
    accountRole
  ) =>
    request(
      `/api/projects/${encodeURIComponent(
        id
      )}`,
      {
        method: 'PATCH',

        body:
          JSON.stringify(
            accountRole
              ? {
                  ...changes,
                  accountRole,
                }
              : changes
          ),
      }
    ),

  getSiteSurvey: (id) =>
    request(
      `/api/projects/${encodeURIComponent(id)}/site-survey`,
      { method: 'GET' }
    ),

  saveSiteSurvey: (id, survey) =>
    request(
      `/api/projects/${encodeURIComponent(id)}/site-survey`,
      {
        method: 'PUT',
        body: JSON.stringify(survey),
      }
    ),

  getBackupPdfAnnotations: (id) =>
    request(
      `/api/projects/${encodeURIComponent(id)}/pdf/backup/annotations`,
      { method: 'GET' }
    ),

  saveBackupPdfAnnotations: (id, annotations) =>
    request(
      `/api/projects/${encodeURIComponent(id)}/pdf/backup/annotations`,
      {
        method: 'PUT',
        body: JSON.stringify({ annotations }),
      }
    ),

  getRecognitionReview: (id) =>
    request(
      `/api/projects/${encodeURIComponent(id)}/review`,
      { method: 'GET' }
    ),

  saveRecognitionReview: (id, review) =>
    request(
      `/api/projects/${encodeURIComponent(id)}/review`,
      {
        method: 'PUT',
        body: JSON.stringify(review),
      }
    ),

  /*
   * =====================================================
   * Sprint 03 — Designer PDF
   * =====================================================
   */

  importDesignerPdf:
    async (
      projectId,
      file
    ) => {
      if (
        !(file instanceof File)
      ) {
        throw new Error(
          'A PDF file is required'
        );
      }

      const isPdf =
        file.type ===
          'application/pdf' ||
        file.name
          .toLowerCase()
          .endsWith(
            '.pdf'
          );

      if (!isPdf) {
        throw new Error(
          'Please select a PDF file'
        );
      }

      const data =
        await readFileAsBase64(
          file
        );

      return request(
        `/api/projects/${encodeURIComponent(
          projectId
        )}`,
        {
          method: 'POST',

          body:
            JSON.stringify({
              action:
                'import-designer-pdf',

              fileName:
                file.name,

              data,
    }),

  getFurnitureObjectDimensions: (projectId, objectId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects/${encodeURIComponent(objectId)}/dimensions`),

  updateFurnitureObjectDimensions: (projectId, objectId, dimensions) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects/${encodeURIComponent(objectId)}/dimensions`, { method: 'PUT', body: JSON.stringify(dimensions) }),

  validateFurnitureObject: (projectId, objectId) =>
    request(`/api/projects/${encodeURIComponent(projectId)}/furniture-objects/${encodeURIComponent(objectId)}/validation`),
        }
      );
    },

  importDwg:
    async (
      projectId,
      file
    ) => {
      if (!(file instanceof File)) {
        throw new Error('A DWG file is required');
      }
      if (!file.name.toLowerCase().endsWith('.dwg')) {
        throw new Error('Please select a DWG file');
      }
      const data = await readFileAsBase64(file);
      return request(
        `/api/projects/${encodeURIComponent(projectId)}`,
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'import-dwg',
            fileName: file.name,
            data,
          }),
        }
      );
    },

  importDxf:
    async (
      projectId,
      file
    ) => {
      if (!(file instanceof File)) throw new Error('A DXF file is required');
      if (!file.name.toLowerCase().endsWith('.dxf')) throw new Error('Unsupported file format. Please select a DXF file');
      const data = await readFileAsBase64(file);
      return request(
        `/api/projects/${encodeURIComponent(projectId)}`,
        {
          method: 'POST',
          body: JSON.stringify({ action: 'import-dxf', fileName: file.name, data }),
        }
      );
    },

  exportDwg:
    async (
      projectId,
      drawingId
    ) => {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/cad/dwg/export`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ drawingId }),
        }
      );
      if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await response.json() : {};
        throw new Error(data.error || `DWG export failed (${response.status})`);
      }
      const disposition = response.headers.get('content-disposition') || '';
      const fileMatch = disposition.match(/filename="([^"]+)"/i);
      return {
        blob: await response.blob(),
        fileName: fileMatch ? decodeURIComponent(fileMatch[1]) : 'drawing_export.dwg',
        report: {
          format: response.headers.get('x-cad-format') || 'DWG',
          entityCount: Number(response.headers.get('x-cad-entity-count') || 0),
          exportedCount: Number(response.headers.get('x-cad-exported-count') || 0),
          unsupportedCount: Number(response.headers.get('x-cad-unsupported-count') || 0),
          layerCount: Number(response.headers.get('x-cad-layer-count') || 0),
        },
      };
    },

  getDesignerRevisions: (
    projectId
  ) =>
    request(
      `/api/projects/${encodeURIComponent(
        projectId
      )}/designer-revisions`
    ),

  getCurrentDesignerRevision: (
    projectId
  ) =>
    request(
      `/api/projects/${encodeURIComponent(
        projectId
      )}/designer-revisions/current`
    ),

  /*
   * =====================================================
   * Sprint 03 — Project PDF
   * =====================================================
   */

  getOriginalPdfUrl: (
    projectId
  ) =>
    `/api/projects/${encodeURIComponent(
      projectId
    )}/pdf/original`,

  getBackupPdfUrl: (
    projectId
  ) =>
    `/api/projects/${encodeURIComponent(
      projectId
    )}/pdf/backup`,

  /*
   * =====================================================
   * User Context
   * =====================================================
   *
   * Furniture GO has exactly two primary roles:
   *
   * - Designer
   * - Factory
   *
   * Both primaryRole and accountRole are persisted.
   *
   * accountRole MUST NOT be stripped from the request.
   *
   * The server is responsible for validating the
   * trusted account context.
   *
   * =====================================================
   */

  getUserContext: () =>
    request(
      '/api/account/context'
    ),

  saveUserContext: (
    context
  ) => {
    const safeContext =
      context || {};

    const normalizedRole =
      safeContext.accountRole ===
        'Factory'
        ? 'Factory'
        : 'Designer';

    return request(
      '/api/account/context',
      {
        method: 'PUT',

        body:
          JSON.stringify({
            displayName:
              String(
                safeContext.displayName ||
                  ''
              ).trim(),

            primaryRole:
              safeContext.primaryRole ===
                'Factory'
                ? 'Factory'
                : normalizedRole,

            accountRole:
              normalizedRole,
          }),
      }
    );
  },
};
