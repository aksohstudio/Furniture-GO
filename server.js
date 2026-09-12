const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const {
  ProjectService,
} = require('./src/services/project-service');

const {
  RecognitionService,
} = require('./src/services/recognition-service');

const {
  EngineeringReviewService,
} = require('./src/services/engineering-review-service');

const {
  canPerformFromAccountContext,
} = require('./src/services/access-policy');

const {
  AccountService,
} = require('./src/services/account-service');

const {
  exportDwg,
} = require('./src/services/dwg-export-service');

const {
  exportDxf,
} = require('./src/services/dxf-export-service');

const {
  FurnitureObjectEngine,
} = require('./src/services/furniture-object-engine');

const {
  ProductionDrawingGenerationService,
} = require('./src/services/production-drawing-generation-service');

const {
  ProductionFormulaEngine,
} = require('./src/services/production-formula-engine');

const {
  exportProductionDrawingPdf,
} = require('./src/services/production-drawing-pdf-service');

const {
  exportProductionDrawingDwg,
} = require('./src/services/production-drawing-dwg-service');

const {
  generateCuttingList,
} = require('./src/services/cutting-list-generation-service');

const {
  generateBoardLayout,
} = require('./src/services/cutting-list-board-layout-service');

const {
  generateMaterialStatistics,
} = require('./src/services/cutting-list-material-statistics-service');

const {
  generateWasteAnalysis,
} = require('./src/services/cutting-list-waste-analysis-service');

const {
  generateInformationPanel,
} = require('./src/services/cutting-list-information-panel-service');

const {
  generatePartTrace,
} = require('./src/services/cutting-list-part-trace-service');
const {
  generatePurchaseList,
} = require('./src/services/purchase-list-generation-service');
const {
  buildCategoryManagement,
} = require('./src/services/category-management-service');
const {
  buildBoardMaterialList,
} = require('./src/services/board-material-list-service');
const {
  buildAccessoriesList,
} = require('./src/services/accessories-list-service');
const {
  buildHardwareList,
} = require('./src/services/hardware-list-service');
const {
  buildPurchaseSummary,
} = require('./src/services/purchase-summary-service');
const {
  buildPurchaseReports,
} = require('./src/services/purchase-report-service');
const {
  preparePurchaseListPrint,
} = require('./src/services/purchase-list-print-service');
const {
  exportPurchaseListPdf,
} = require('./src/services/purchase-list-pdf-service');
const {
  exportPurchaseListExcel,
} = require('./src/services/purchase-list-excel-service');

const {
  prepareCuttingListPrintDocument,
} = require('./src/services/cutting-list-print-service');
const {
  exportCuttingListPdf,
} = require('./src/services/cutting-list-pdf-service');
const {
  exportCuttingListExcel,
} = require('./src/services/cutting-list-excel-service');

const {
  createRevision,
  listRevisions,
  getRevision,
  compareRevision,
} = require('./src/services/production-drawing-revision-service');

const root = __dirname;

const port = Number(
  process.env.PORT || 4173
);

/*
 * =====================================================
 * Content Types
 * =====================================================
 */

const contentTypes = {
  '.css':
    'text/css; charset=utf-8',

  '.html':
    'text/html; charset=utf-8',

  '.js':
    'text/javascript; charset=utf-8',

  '.json':
    'application/json; charset=utf-8',

  '.svg':
    'image/svg+xml',

  '.png':
    'image/png',

  '.jpg':
    'image/jpeg',

  '.jpeg':
    'image/jpeg',

  '.ico':
    'image/x-icon',

  '.txt':
    'text/plain; charset=utf-8',
};

/*
 * =====================================================
 * Services
 * =====================================================
 */

const runtimeDirectory =
  process.env.FURNITURE_GO_DATA_DIR
    ? path.resolve(process.env.FURNITURE_GO_DATA_DIR)
    : path.join(
      root,
      '.runtime-data'
    );

const projectService =
  new ProjectService(
    runtimeDirectory
  );

const recognitionService =
  new RecognitionService(
    projectService
  );

const engineeringReviewService =
  new EngineeringReviewService(
    projectService
  );

const accountService =
  new AccountService(
    runtimeDirectory
  );

const furnitureObjectEngine =
  new FurnitureObjectEngine(
    projectService
  );

const productionDrawingGenerationService =
  new ProductionDrawingGenerationService(
    projectService,
    furnitureObjectEngine
  );

const productionFormulaEngine =
  new ProductionFormulaEngine(
    projectService.data.official
  );

function generateProductionDrawingForPayload(projectId, payload) {
  return payload.drawingType === 'assembly'
    ? productionDrawingGenerationService.generateAssembly(projectId, payload.objectId)
    : payload.drawingType === 'panel'
      ? productionDrawingGenerationService.generatePanel(projectId, payload.objectId, payload.panelId)
      : payload.drawingType === 'door'
        ? productionDrawingGenerationService.generateDoor(projectId, payload.objectId, payload.doorId)
        : payload.drawingType === 'drawer'
          ? productionDrawingGenerationService.generateDrawer(projectId, payload.objectId, payload.drawerId)
          : payload.drawingType === 'hardware'
            ? productionDrawingGenerationService.generateHardware(projectId, payload.objectId, payload.hardwareId)
            : productionDrawingGenerationService.generate(projectId, payload.objectId);
}

/*
 * =====================================================
 * JSON Response
 * =====================================================
 */

function json(
  response,
  status,
  value
) {
  if (response.writableEnded) {
    return;
  }

  response.writeHead(
    status,
    {
      'Content-Type':
        'application/json; charset=utf-8',

      'Access-Control-Allow-Origin':
        '*',

      'Cache-Control':
        'no-store',
    }
  );

  response.end(
    JSON.stringify(value)
  );
}

/*
 * =====================================================
 * Request Body
 * =====================================================
 */

function body(
  request
) {
  return new Promise(
    (resolve, reject) => {
      let data = '';

      request.on(
        'data',
        (chunk) => {
          data += chunk;
        }
      );

      request.on(
        'end',
        () => {
          if (!data) {
            resolve({});
            return;
          }

          try {
            resolve(
              JSON.parse(data)
            );
          } catch (error) {
            reject(error);
          }
        }
      );

      request.on(
        'error',
        reject
      );
    }
  );
}

/*
 * =====================================================
 * Authorization
 * =====================================================
 */

function authorize(
  action,
  project
) {
  const resource = {
    archiveStatus:
      project?.project
        ?.archiveStatus,

    lockStatus:
      project?.project
        ?.lockStatus,
  };

  const allowed =
    canPerformFromAccountContext(
      action,
      accountService.getContext(),
      resource
    );

  if (!allowed) {
    throw Object.assign(
      new Error(
        `Account role cannot perform ${action}`
      ),
      {
        statusCode: 403,
      }
    );
  }
}

/*
 * =====================================================
 * PDF Base64 Decoder
 * =====================================================
 */

function decodePdfBase64(
  value
) {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new Error(
      'PDF file data is required'
    );
  }

  const normalized =
    value.trim();

  if (
    normalized.length % 4 !== 0
  ) {
    throw new Error(
      'Invalid PDF file data'
    );
  }

  if (
    !/^[A-Za-z0-9+/]*={0,2}$/.test(
      normalized
    )
  ) {
    throw new Error(
      'Invalid PDF file data'
    );
  }

  const buffer =
    Buffer.from(
      normalized,
      'base64'
    );

  if (!buffer.length) {
    throw new Error(
      'PDF file data is empty'
    );
  }

  return buffer;
}

/*
 * =====================================================
 * Project PDF Resolver
 * =====================================================
 */

function getProjectPdf(
  projectId,
  pdfType
) {
  if (
    pdfType === 'original'
  ) {
    return projectService.getDesignerPdf(
      projectId
    );
  }

  if (
    pdfType === 'backup'
  ) {
    return projectService.getBackupPdf(
      projectId
    );
  }

  throw new Error(
    'Unsupported PDF type'
  );
}

/*
 * =====================================================
 * Account Context API
 * =====================================================
 */

async function handleAccountContext(
  request,
  response
) {
  try {
    if (
      request.method === 'GET'
    ) {
      return json(
        response,
        200,
        accountService.getContext()
      );
    }

    if (
      request.method === 'PUT'
    ) {
      const payload =
        await body(request);

      const displayName =
        typeof payload.displayName ===
          'string'
          ? payload.displayName.trim()
          : '';

      const selectedRole =
        payload.accountRole ===
          'Factory'
          ? 'Factory'
          : payload.accountRole ===
              'Designer'
            ? 'Designer'
            : payload.primaryRole ===
                'Factory'
              ? 'Factory'
              : payload.primaryRole ===
                  'Designer'
                ? 'Designer'
                : null;

      if (!selectedRole) {
        return json(
          response,
          400,
          {
            error:
              'Account role must be Designer or Factory',
          }
        );
      }

      const saved =
        accountService.saveContext({
          displayName:
            displayName ||
            'Local User',

          primaryRole:
            selectedRole,

          accountRole:
            selectedRole,
        });

      return json(
        response,
        200,
        saved
      );
    }

    return json(
      response,
      405,
      {
        error:
          'Method not allowed',
      }
    );
  } catch (error) {
    return json(
      response,
      error.statusCode || 400,
      {
        error:
          error.message ||
          'Account context error',
      }
    );
  }
}

/*
 * =====================================================
 * GET /api/projects
 * =====================================================
 */

function listProjects(
  response
) {
  authorize(
    'open',
    null
  );

  const index =
    projectService
      .index
      .projectIds
      .map(
        (id) =>
          projectService.readProject(
            id
          )
      )
      .filter(Boolean);

  return json(
    response,
    200,
    index
  );
}

/*
 * =====================================================
 * POST /api/projects
 * =====================================================
 */

async function createProject(
  request,
  response
) {
  const payload =
    await body(request);

  authorize(
    'create',
    null
  );

  if (
    typeof payload.name !==
      'string' ||
    !payload.name.trim()
  ) {
    return json(
      response,
      400,
      {
        error:
          'Project name is required',
      }
    );
  }

  const project =
    projectService.createProject(
      payload.name.trim()
    );

  return json(
    response,
    201,
    project
  );
}

/*
 * =====================================================
 * Sprint 03 — Backup PDF Creation
 * =====================================================
 *
 * POST
 *
 * /api/projects/:id/pdf/backup
 *
 * Rules:
 *
 * 1. A Current Designer Revision must exist.
 * 2. The Original Designer PDF is never modified.
 * 3. The Backup PDF is stored separately.
 * 4. The Backup PDF remains associated with the
 *    current Designer Revision.
 * 5. Existing Backup PDF cannot be accidentally
 *    recreated through the same request.
 *
 * =====================================================
 */

function handleBackupPdfCreation(
  request,
  response,
  parts
) {
  if (
    parts.length !== 5 ||
    parts[3] !== 'pdf' ||
    parts[4] !== 'backup'
  ) {
    return false;
  }

  /*
   * This route handles POST only.
   *
   * GET /pdf/backup is intentionally left for
   * handleProjectPdf().
   */

  if (
    request.method !== 'POST'
  ) {
    return false;
  }

  const projectId =
    parts[2];

  const project =
    projectService.readProject(
      projectId
    );

  if (!project) {
    json(
      response,
      404,
      {
        error:
          'Project not found',
      }
    );

    return true;
  }

  authorize(
    'edit',
    project
  );

  /*
   * ---------------------------------------------------
   * Prevent duplicate creation.
   * ---------------------------------------------------
   */

  const existingBackup =
    project
      .projectDocuments
      ?.backupPdf;

  if (
    existingBackup?.storageKey
  ) {
    json(
      response,
      409,
      {
        error:
          'Backup PDF already exists',
      }
    );

    return true;
  }

  /*
   * ---------------------------------------------------
   * Read the current Designer PDF.
   * ---------------------------------------------------
   */

  const source =
    projectService.getDesignerPdf(
      projectId
    );

  if (
    !source ||
    !source.buffer ||
    !Buffer.isBuffer(
      source.buffer
    )
  ) {
    json(
      response,
      404,
      {
        error:
          'Current Designer PDF not found',
      }
    );

    return true;
  }

  /*
   * ---------------------------------------------------
   * Create the real Backup PDF storage copy.
   * ---------------------------------------------------
   */

  const sourceFileName =
    source.metadata
      ?.fileName ||
    'Designer.pdf';

  const backupFileName =
    `Backup-${sourceFileName}`;

  const saved =
    projectService.createBackupPdf(
      projectId,
      source.buffer,
      {
        fileName:
          backupFileName,

        mimeType:
          'application/pdf',
      }
    );

  json(
    response,
    201,
    saved
  );

  return true;
}

/*
 * =====================================================
 * Project PDF Routes
 * =====================================================
 *
 * GET:
 *
 * /api/projects/:id/pdf/original
 * /api/projects/:id/pdf/backup
 *
 * POST /api/projects/:id/pdf/backup is handled by
 * handleBackupPdfCreation() before this function.
 *
 * =====================================================
 */

function handleProjectPdf(
  request,
  response,
  parts
) {
  if (
    parts.length !== 5 ||
    parts[3] !== 'pdf'
  ) {
    return false;
  }

  if (
    request.method !== 'GET'
  ) {
    json(
      response,
      405,
      {
        error:
          'Method not allowed',
      }
    );

    return true;
  }

  const projectId =
    parts[2];

  const pdfType =
    parts[4];

  if (
    ![
      'original',
      'backup',
    ].includes(pdfType)
  ) {
    json(
      response,
      400,
      {
        error:
          'Unsupported PDF type',
      }
    );

    return true;
  }

  const project =
    projectService.readProject(
      projectId
    );

  if (!project) {
    json(
      response,
      404,
      {
        error:
          'Project not found',
      }
    );

    return true;
  }

  authorize(
    'open',
    project
  );

  const result =
    getProjectPdf(
      projectId,
      pdfType
    );

  if (!result) {
    json(
      response,
      404,
      {
        error:
          'Project PDF not found',
      }
    );

    return true;
  }

  if (
    !result.buffer ||
    !Buffer.isBuffer(
      result.buffer
    )
  ) {
    json(
      response,
      500,
      {
        error:
          'Project PDF data is invalid',
      }
    );

    return true;
  }

  const fileName =
    result.metadata
      ?.fileName ||
    `${pdfType}.pdf`;

  response.writeHead(
    200,
    {
      'Content-Type':
        result.metadata
          ?.mimeType ||
        'application/pdf',

      'Content-Length':
        result.buffer.length,

      'Content-Disposition':
        `inline; filename="${encodeURIComponent(
          fileName
        )}"`,

      'Cache-Control':
        'no-store',
    }
  );

  response.end(
    result.buffer
  );

  return true;
}

async function handleDwgExport(request, response, parts) {
  if (parts.length !== 6 || parts[3] !== 'cad' || !['dwg', 'dxf'].includes(parts[4]) || parts[5] !== 'export') return false;
  if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });
  const projectId = parts[2];
  const project = projectService.readProject(projectId);
  if (!project) return json(response, 404, { error: 'Project not found' });
  authorize('open', project);
  const payload = await body(request);
  const drawingId = payload.drawingId;
  const drawing = project.projectDocuments?.documents?.find((item) =>
    ['DWG', 'DXF'].includes(item.sourceFormat || item.documentType) && (!drawingId || item.id === drawingId));
  if (!drawing) return json(response, 404, { error: 'CAD DWG drawing not found' });
  let result;
  const exportFormat = drawing.sourceFormat === 'DXF' || parts[4] === 'dxf' ? 'DXF' : 'DWG';
  try {
    result = exportFormat === 'DXF' ? await exportDxf(drawing) : await exportDwg(drawing);
  } catch (error) {
    return json(response, 400, { error: error.message || 'DWG export failed' });
  }
  const extension = exportFormat.toLowerCase();
  const fileName = `${String(drawing.fileName || 'drawing').replace(/\.(dwg|dxf)$/i, '')}_export.${extension}`;
  response.writeHead(200, {
    'Content-Type': exportFormat === 'DXF' ? 'application/dxf' : 'application/acad',
    'Content-Length': result.buffer.length,
    'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
    'X-CAD-Format': exportFormat,
    'X-CAD-Entity-Count': String(result.report.entityCount),
    'X-CAD-Exported-Count': String(result.report.exportedCount),
    'X-CAD-Unsupported-Count': String(result.report.unsupportedCount),
    'X-CAD-Layer-Count': String(result.report.layerCount),
    'Cache-Control': 'no-store',
  });
  response.end(result.buffer);
  return true;
}

/*
 * =====================================================
 * Designer Revisions
 * =====================================================
 */

function handleDesignerRevisions(
  request,
  response,
  projectId,
  project,
  parts
) {
  if (
    parts.length === 4 &&
    parts[3] ===
      'designer-revisions'
  ) {
    if (
      request.method !== 'GET'
    ) {
      json(
        response,
        405,
        {
          error:
            'Method not allowed',
        }
      );

      return true;
    }

    authorize(
      'open',
      project
    );

    const revisions =
      projectService.getDesignerRevisions(
        projectId
      );

    json(
      response,
      200,
      revisions
    );

    return true;
  }

  if (
    parts.length === 5 &&
    parts[3] ===
      'designer-revisions' &&
    parts[4] === 'current'
  ) {
    if (
      request.method !== 'GET'
    ) {
      json(
        response,
        405,
        {
          error:
            'Method not allowed',
        }
      );

      return true;
    }

    authorize(
      'open',
      project
    );

    const revision =
      projectService
        .getCurrentDesignerRevision(
          projectId
        );

    if (!revision) {
      json(
        response,
        404,
        {
          error:
            'Current Designer Revision not found',
        }
      );

      return true;
    }

    json(
      response,
      200,
      revision
    );

    return true;
  }

  return false;
}

/*
 * =====================================================
 * Recognition Summary
 * =====================================================
 */

function handleRecognitionSummary(
  request,
  response,
  projectId,
  project,
  parts
) {
  if (
    parts.length !== 4 ||
    parts[3] !==
      'recognition-summary'
  ) {
    return false;
  }

  if (
    request.method !== 'GET'
  ) {
    json(
      response,
      405,
      {
        error:
          'Method not allowed',
      }
    );

    return true;
  }

  authorize(
    'open',
    project
  );

  const summary =
    recognitionService
      .getRecognitionSummary(
        projectId
      );

  json(
    response,
    200,
    summary
  );

  return true;
}

/*
 * =====================================================
 * Engineering Records
 * =====================================================
 */

async function handleEngineeringRecords(
  request,
  response,
  projectId,
  project,
  parts
) {
  if (
    parts.length === 4 &&
    parts[3] ===
      'engineering-records'
  ) {
    if (
      request.method === 'GET'
    ) {
      authorize(
        'open',
        project
      );

      const records =
        recognitionService
          .listEngineeringRecords(
            projectId
          );

      json(
        response,
        200,
        records
      );

      return true;
    }

    json(
      response,
      405,
      {
        error:
          'Method not allowed',
      }
    );

    return true;
  }

  if (
    parts.length < 5 ||
    parts[3] !==
      'engineering-records'
  ) {
    return false;
  }

  const recordId =
    parts[4];

  if (
    parts.length === 5 &&
    request.method === 'GET'
  ) {
    authorize(
      'open',
      project
    );

    const record =
      recognitionService
        .getEngineeringRecord(
          projectId,
          recordId
        );

    if (!record) {
      json(
        response,
        404,
        {
          error:
            'Engineering Record not found',
        }
      );

      return true;
    }

    json(
      response,
      200,
      record
    );

    return true;
  }

  if (
    parts.length === 5 &&
    request.method === 'PATCH'
  ) {
    authorize(
      'edit',
      project
    );

    const payload =
      await body(request);

    const existing =
      recognitionService
        .getEngineeringRecord(
          projectId,
          recordId
        );

    if (!existing) {
      json(
        response,
        404,
        {
          error:
            'Engineering Record not found',
        }
      );

      return true;
    }

    const updated =
      recognitionService
        .updateEngineeringRecord(
          projectId,
          {
            ...existing,
            ...payload,

            id:
              existing.id,

            projectId:
              existing.projectId,
          }
        );

    json(
      response,
      200,
      updated
    );

    return true;
  }

  if (
    parts.length === 6 &&
    parts[5] === 'supersede' &&
    request.method === 'POST'
  ) {
    authorize(
      'edit',
      project
    );

    const superseded =
      recognitionService
        .supersedeEngineeringRecord(
          projectId,
          recordId
        );

    json(
      response,
      200,
      superseded
    );

    return true;
  }

  return false;
}

/*
 * =====================================================
 * Engineering Issues
 * =====================================================
 */

async function handleEngineeringIssues(
  request,
  response,
  projectId,
  project,
  parts
) {
  if (
    parts.length < 4 ||
    parts[3] !==
      'engineering-issues'
  ) {
    return false;
  }

  if (
    parts.length === 4 &&
    request.method === 'GET'
  ) {
    authorize(
      'open',
      project
    );

    const issues =
      engineeringReviewService
        .listIssues(
          projectId
        );

    json(
      response,
      200,
      issues
    );

    return true;
  }

  if (
    parts.length === 4 &&
    request.method === 'POST'
  ) {
    authorize(
      'edit',
      project
    );

    const payload =
      await body(request);

    const issue =
      engineeringReviewService
        .createIssue(
          projectId,
          payload
        );

    json(
      response,
      201,
      issue
    );

    return true;
  }

  if (
    parts.length < 5
  ) {
    return true;
  }

  const issueId =
    parts[4];

  if (
    parts.length === 5 &&
    request.method === 'GET'
  ) {
    authorize(
      'open',
      project
    );

    const issue =
      engineeringReviewService
        .getIssue(
          projectId,
          issueId
        );

    if (!issue) {
      json(
        response,
        404,
        {
          error:
            'Engineering Issue not found',
        }
      );

      return true;
    }

    json(
      response,
      200,
      issue
    );

    return true;
  }

  const getReviewerId =
    (payload = {}) =>
      payload.reviewerId ||
      accountService
        .getContext()
        ?.userId ||
      accountService
        .getContext()
        ?.accountId ||
      accountService
        .getContext()
        ?.id ||
      'current-user';

  if (
    parts.length === 6 &&
    parts[5] ===
      'start-review' &&
    request.method === 'POST'
  ) {
    authorize(
      'edit',
      project
    );

    const payload =
      await body(request);

    const reviewerId =
      getReviewerId(
        payload
      );

    const reviewed =
      engineeringReviewService
        .startReview(
          projectId,
          issueId,
          reviewerId
        );

    json(
      response,
      200,
      reviewed
    );

    return true;
  }

  if (
    parts.length === 6 &&
    parts[5] === 'confirm' &&
    request.method === 'POST'
  ) {
    authorize(
      'edit',
      project
    );

    const payload =
      await body(request);

    const reviewerId =
      getReviewerId(
        payload
      );

    const confirmed =
      engineeringReviewService
        .confirmReview(
          projectId,
          issueId,
          reviewerId
        );

    json(
      response,
      200,
      confirmed
    );

    return true;
  }

  if (
    parts.length === 6 &&
    parts[5] === 'dismiss' &&
    request.method === 'POST'
  ) {
    authorize(
      'edit',
      project
    );

    const payload =
      await body(request);

    const reviewerId =
      getReviewerId(
        payload
      );

    const dismissed =
      engineeringReviewService
        .dismissIssue(
          projectId,
          issueId,
          reviewerId
        );

    json(
      response,
      200,
      dismissed
    );

    return true;
  }

  if (
    parts.length === 6 &&
    parts[5] === 'reopen' &&
    request.method === 'POST'
  ) {
    authorize(
      'edit',
      project
    );

    const reopened =
      engineeringReviewService
        .reopenIssue(
          projectId,
          issueId
        );

    json(
      response,
      200,
      reopened
    );

    return true;
  }

  return true;
}

/*
 * =====================================================
 * Engineering Issue Summary
 * =====================================================
 */

function handleEngineeringIssueSummary(
  request,
  response,
  projectId,
  project,
  parts
) {
  if (
    parts.length !== 4 ||
    parts[3] !==
      'engineering-issue-summary'
  ) {
    return false;
  }

  if (
    request.method !== 'GET'
  ) {
    json(
      response,
      405,
      {
        error:
          'Method not allowed',
      }
    );

    return true;
  }

  authorize(
    'open',
    project
  );

  const summary =
    engineeringReviewService
      .getReviewSummary(
        projectId
      );

  json(
    response,
    200,
    summary
  );

  return true;
}

/*
 * =====================================================
 * Start Project Recognition
 * =====================================================
 */

async function handleRecognition(
  request,
  response,
  projectId,
  project,
  parts
) {
  if (
    parts.length !== 4 ||
    parts[3] !==
      'recognition'
  ) {
    return false;
  }

  if (
    request.method !== 'POST'
  ) {
    json(
      response,
      405,
      {
        error:
          'Method not allowed',
      }
    );

    return true;
  }

  authorize(
    'edit',
    project
  );

  const payload =
    await body(request);

  const result =
    recognitionService
      .recognizeProject(
        projectId,
        payload
      );

  json(
    response,
    200,
    result
  );

  return true;
}

/*
 * =====================================================
 * Designer PDF Import
 * =====================================================
 */

async function handleProjectPost(
  request,
  response,
  id,
  project
) {
  const payload =
    await body(request);

  /*
   * ---------------------------------------------------
   * Designer PDF Import
   * ---------------------------------------------------
   */

  if (
    payload.action ===
    'import-designer-pdf'
  ) {
    if (!project) {
      return json(
        response,
        404,
        {
          error:
            'Project not found',
        }
      );
    }

    authorize(
      'edit',
      project
    );

    if (
      typeof payload.fileName !==
        'string' ||
      !payload.fileName.trim()
    ) {
      return json(
        response,
        400,
        {
          error:
            'PDF file name is required',
        }
      );
    }

    const fileName =
      payload.fileName.trim();

    if (
      !fileName
        .toLowerCase()
        .endsWith('.pdf')
    ) {
      return json(
        response,
        400,
        {
          error:
            'Designer PDF must be a PDF file',
        }
      );
    }

    let buffer;

    try {
      buffer =
        decodePdfBase64(
          payload.data
        );
    } catch (error) {
      return json(
        response,
        400,
        {
          error:
            error.message,
        }
      );
    }

    const pdfHeader =
      buffer
        .subarray(
          0,
          4
        )
        .toString(
          'ascii'
        );

    if (
      pdfHeader !== '%PDF'
    ) {
      return json(
        response,
        400,
        {
          error:
            'Selected file is not a valid PDF document',
        }
      );
    }

    const saved =
      projectService
        .importDesignerPdf(
          id,
          {
            fileName,
            buffer,
          }
        );

    return json(
      response,
      200,
      saved
    );
  }

  if (payload.action === 'import-dwg') {
    if (!project) {
      return json(response, 404, { error: 'Project not found' });
    }

    authorize('edit', project);

    if (typeof payload.fileName !== 'string' || !payload.fileName.trim()) {
      return json(response, 400, { error: 'DWG file name is required' });
    }

    const fileName = payload.fileName.trim();
    if (!fileName.toLowerCase().endsWith('.dwg')) {
      return json(response, 400, { error: 'DWG import requires a .dwg file' });
    }

    let buffer;
    try {
      buffer = decodePdfBase64(payload.data);
    } catch (error) {
      return json(response, 400, { error: error.message });
    }

    try {
      const saved = await projectService.importDwg(id, { fileName, buffer });
      return json(response, 201, saved);
    } catch (error) {
      return json(response, 400, { error: error.message || 'Unable to import DWG' });
    }
  }

  if (payload.action === 'import-dxf') {
    if (!project) return json(response, 404, { error: 'Project not found' });
    authorize('edit', project);
    if (typeof payload.fileName !== 'string' || !payload.fileName.trim()) return json(response, 400, { error: 'DXF file name is required' });
    const fileName = payload.fileName.trim();
    if (!fileName.toLowerCase().endsWith('.dxf')) return json(response, 400, { error: 'DXF import requires a .dxf file' });
    let buffer;
    try { buffer = decodePdfBase64(payload.data); } catch (error) { return json(response, 400, { error: error.message }); }
    try {
      const saved = await projectService.importDxf(id, { fileName, buffer });
      return json(response, 201, saved);
    } catch (error) {
      return json(response, 400, { error: error.message || 'Unable to import DXF' });
    }
  }

  /*
   * ---------------------------------------------------
   * Existing Project Actions
   * ---------------------------------------------------
   */

  const action =
    payload.action;

  if (
    action === 'archive' ||
    action === 'trash' ||
    action === 'restore'
  ) {
    if (!project) {
      return json(
        response,
        404,
        {
          error:
            'Project not found',
        }
      );
    }

    const authorizationAction =
      action === 'archive'
        ? 'archive'
        : action === 'restore'
          ? 'restore'
          : 'delete';

    authorize(
      authorizationAction,
      project
    );

    if (
      action === 'archive'
    ) {
      return json(
        response,
        200,
        projectService
          .archiveProject(
            id
          )
      );
    }

    if (
      action === 'trash'
    ) {
      return json(
        response,
        200,
        projectService
          .moveToTrash(
            id
          )
      );
    }

    if (
      action === 'restore'
    ) {
      return json(
        response,
        200,
        projectService
          .restoreProject(
            id
          )
      );
    }
  }

  return json(
    response,
    400,
    {
      error:
        'Unsupported project action',
    }
  );
}

/*
 * =====================================================
 * Project GET / PATCH
 * =====================================================
 */

async function handleProjectResource(
  request,
  response,
  id,
  project
) {
  if (
    request.method === 'GET'
  ) {
    if (!project) {
      return json(
        response,
        404,
        {
          error:
            'Project not found',
        }
      );
    }

    authorize(
      'open',
      project
    );

    return json(
      response,
      200,
      projectService.openProject(
        id
      )
    );
  }

  if (
    request.method === 'POST'
  ) {
    return handleProjectPost(
      request,
      response,
      id,
      project
    );
  }

  if (
    request.method === 'PATCH'
  ) {
    if (!project) {
      return json(
        response,
        404,
        {
          error:
            'Project not found',
        }
      );
    }

    const payload =
      await body(request);

    authorize(
      'edit',
      project
    );

    const {
      accountRole,
      ...changes
    } = payload;

    return json(
      response,
      200,
      projectService
        .saveWorkingState(
          id,
          changes
        )
    );
  }

  return false;
}

/*
 * =====================================================
 * Existing Project Action Routes
 * =====================================================
 */

function handleProjectActionRoute(
  request,
  response,
  parts
) {
  if (
    parts.length !== 4 ||
    request.method !== 'POST'
  ) {
    return false;
  }

  const id =
    parts[2];

  const action =
    parts[3];

  if (
    ![
      'archive',
      'trash',
      'restore',
    ].includes(action)
  ) {
    return false;
  }

  const project =
    projectService.readProject(
      id
    );

  if (!project) {
    json(
      response,
      404,
      {
        error:
          'Project not found',
      }
    );

    return true;
  }

  const authorizationAction =
    action === 'archive'
      ? 'archive'
      : action === 'restore'
        ? 'restore'
        : 'delete';

  authorize(
    authorizationAction,
    project
  );

  if (
    action === 'archive'
  ) {
    json(
      response,
      200,
      projectService
        .archiveProject(
          id
        )
    );

    return true;
  }

  if (
    action === 'trash'
  ) {
    json(
      response,
      200,
      projectService
        .moveToTrash(
          id
        )
    );

    return true;
  }

  if (
    action === 'restore'
  ) {
    json(
      response,
      200,
      projectService
        .restoreProject(
          id
        )
    );

    return true;
  }

  return false;
}

/*
 * =====================================================
 * Project Scoped API
 * =====================================================
 */

async function handleFurnitureObjects(request, response, projectId, project, parts) {
  if (parts[3] !== 'furniture-objects') return false;
  const objectId = parts.length >= 5 ? parts[4] : null;

  if (parts.length === 6 && objectId && parts[5] === 'materials') {
    if (request.method === 'GET') {
      authorize('open', project);
      return json(response, 200, { materialReferences: furnitureObjectEngine.getMaterials(projectId, objectId) });
    }
    authorize('edit', project);
    if (request.method === 'POST') {
      const payload = await body(request);
      return json(response, 201, { furnitureObject: furnitureObjectEngine.assignMaterial(projectId, objectId, payload) });
    }
    return json(response, 405, { error: 'Method not allowed' });
  }

  if (parts.length === 7 && objectId && parts[5] === 'materials') {
    authorize('edit', project);
    const materialId = decodeURIComponent(parts[6]);
    if (request.method === 'DELETE') {
      return json(response, 200, { furnitureObject: furnitureObjectEngine.removeMaterial(projectId, objectId, materialId) });
    }
    if (request.method === 'PUT') {
      const payload = await body(request);
      return json(response, 200, { furnitureObject: furnitureObjectEngine.replaceMaterial(projectId, objectId, materialId, payload) });
    }
    return json(response, 405, { error: 'Method not allowed' });
  }

  if (parts.length === 6 && objectId && parts[5] === 'hardware') {
    if (request.method === 'GET') {
      authorize('open', project);
      return json(response, 200, { hardwareReferences: furnitureObjectEngine.getHardware(projectId, objectId) });
    }
    authorize('edit', project);
    if (request.method === 'POST') {
      const payload = await body(request);
      return json(response, 201, { furnitureObject: furnitureObjectEngine.assignHardware(projectId, objectId, payload) });
    }
    return json(response, 405, { error: 'Method not allowed' });
  }

  if (parts.length === 7 && objectId && parts[5] === 'hardware') {
    authorize('edit', project);
    const hardwareId = decodeURIComponent(parts[6]);
    if (request.method === 'DELETE') {
      return json(response, 200, { furnitureObject: furnitureObjectEngine.removeHardware(projectId, objectId, hardwareId) });
    }
    if (request.method === 'PUT') {
      const payload = await body(request);
      return json(response, 200, { furnitureObject: furnitureObjectEngine.replaceHardware(projectId, objectId, hardwareId, payload) });
    }
    return json(response, 405, { error: 'Method not allowed' });
  }

  if (parts.length === 6 && objectId && parts[5] === 'dimensions') {
    if (request.method === 'GET') {
      authorize('open', project);
      return json(response, 200, { dimensions: furnitureObjectEngine.getDimensions(projectId, objectId) });
    }
    authorize('edit', project);
    if (request.method === 'PUT') {
      const payload = await body(request);
      return json(response, 200, { furnitureObject: furnitureObjectEngine.updateDimensions(projectId, objectId, payload) });
    }
    return json(response, 405, { error: 'Method not allowed' });
  }

  if (parts.length === 6 && objectId && parts[5] === 'validation' && request.method === 'GET') {
    authorize('open', project);
    return json(response, 200, { validation: furnitureObjectEngine.validateObject(projectId, objectId) });
  }

  if (parts.length === 6 && objectId && parts[5] === 'cad-references') {
    if (request.method === 'GET') {
      authorize('open', project);
      return json(response, 200, { cadReferences: furnitureObjectEngine.getCadReferences(projectId, objectId) });
    }
    authorize('edit', project);
    if (request.method === 'POST') {
      const payload = await body(request);
      return json(response, 200, { furnitureObject: furnitureObjectEngine.syncCadReference(projectId, objectId, payload) });
    }
    return json(response, 405, { error: 'Method not allowed' });
  }

  if (parts.length === 7 && objectId && parts[5] === 'cad-references' && request.method === 'DELETE') {
    authorize('edit', project);
    return json(response, 200, { furnitureObject: furnitureObjectEngine.removeCadReference(projectId, objectId, decodeURIComponent(parts[6])) });
  }

  if (parts.length === 6 && objectId && parts[5] === 'formula-references') {
    if (request.method === 'GET') {
      authorize('open', project);
      return json(response, 200, { formulaReferences: furnitureObjectEngine.getFormulaReferences(projectId, objectId) });
    }
    authorize('edit', project);
    if (request.method === 'POST') {
      const payload = await body(request);
      return json(response, 200, { furnitureObject: furnitureObjectEngine.assignFormula(projectId, objectId, payload) });
    }
    return json(response, 405, { error: 'Method not allowed' });
  }

  if (parts.length === 7 && objectId && parts[5] === 'formula-references' && request.method === 'DELETE') {
    authorize('edit', project);
    return json(response, 200, { furnitureObject: furnitureObjectEngine.removeFormula(projectId, objectId, decodeURIComponent(parts[6])) });
  }

  if (parts.length === 5 && objectId === 'hierarchy' && request.method === 'GET') {
    authorize('open', project);
    return json(response, 200, { hierarchy: furnitureObjectEngine.buildTree(projectId) });
  }

  if (parts.length === 6 && objectId && parts[5] === 'parent') {
    if (request.method === 'GET') {
      authorize('open', project);
      return json(response, 200, { parent: furnitureObjectEngine.getParent(projectId, objectId) });
    }
    authorize('edit', project);
    if (request.method === 'POST') {
      const payload = await body(request);
      return json(response, 200, { furnitureObject: furnitureObjectEngine.setParent(projectId, objectId, payload.parentObjectId) });
    }
    if (request.method === 'DELETE') {
      return json(response, 200, { furnitureObject: furnitureObjectEngine.removeParent(projectId, objectId) });
    }
    return json(response, 405, { error: 'Method not allowed' });
  }

  if (parts.length === 6 && objectId && parts[5] === 'children' && request.method === 'GET') {
    authorize('open', project);
    return json(response, 200, { children: furnitureObjectEngine.getChildren(projectId, objectId) });
  }

  if (parts.length === 6 && objectId && parts[5] === 'ancestors' && request.method === 'GET') {
    authorize('open', project);
    return json(response, 200, { ancestors: furnitureObjectEngine.getAncestors(projectId, objectId) });
  }

  if (parts.length === 6 && objectId && parts[5] === 'descendants' && request.method === 'GET') {
    authorize('open', project);
    return json(response, 200, { descendants: furnitureObjectEngine.getDescendants(projectId, objectId) });
  }

  if (parts.length === 6 && objectId && parts[5] === 'root' && request.method === 'GET') {
    authorize('open', project);
    return json(response, 200, { root: furnitureObjectEngine.getRoot(projectId, objectId) });
  }

  if (parts.length !== 4 && parts.length !== 5) return false;
  if (request.method === 'GET') {
    authorize('open', project);
    return json(response, 200, objectId
      ? { furnitureObject: furnitureObjectEngine.getObject(projectId, objectId) }
      : { furnitureObjects: furnitureObjectEngine.listObjects(projectId) });
  }
  authorize('edit', project);
  if (request.method === 'POST' && !objectId) {
    const payload = await body(request);
    return json(response, 201, { furnitureObject: furnitureObjectEngine.createObject(projectId, payload) });
  }
  if (request.method === 'PATCH' && objectId) {
    const payload = await body(request);
    return json(response, 200, { furnitureObject: furnitureObjectEngine.updateObject(projectId, objectId, payload) });
  }
  if (request.method === 'DELETE' && objectId) {
    return json(response, 200, { furnitureObject: furnitureObjectEngine.deleteObject(projectId, objectId) });
  }
  return json(response, 405, { error: 'Method not allowed' });
}

async function handleProjectScopedApi(
  request,
  response,
  parts
) {
  if (
    parts.length < 3
  ) {
    return false;
  }

  const projectId =
    parts[2];

  const project =
    projectService.readProject(
      projectId
    );

  if (!project) {
    json(
      response,
      404,
      {
        error:
          'Project not found',
      }
    );

    return true;
  }

  if (
    parts.length === 5 &&
    parts[3] === 'production-drawings' &&
    parts[4] === 'generate'
  ) {
    if (request.method !== 'POST') {
      return json(response, 405, { error: 'Method not allowed' });
    }
    authorize('open', project);
    const payload = await body(request);
    const drawing = payload.drawingType === 'assembly'
      ? productionDrawingGenerationService.generateAssembly(projectId, payload.objectId)
      : payload.drawingType === 'panel'
        ? productionDrawingGenerationService.generatePanel(projectId, payload.objectId, payload.panelId)
        : payload.drawingType === 'door'
          ? productionDrawingGenerationService.generateDoor(projectId, payload.objectId, payload.doorId)
          : payload.drawingType === 'drawer'
          ? productionDrawingGenerationService.generateDrawer(projectId, payload.objectId, payload.drawerId)
          : payload.drawingType === 'hardware'
            ? productionDrawingGenerationService.generateHardware(projectId, payload.objectId, payload.hardwareId)
          : payload.drawingType === 'package'
            ? productionDrawingGenerationService.generatePackage(projectId, payload.objectId)
        : productionDrawingGenerationService.generate(projectId, payload.objectId);
    return json(response, 200, { drawing });
  }

  if (parts.length === 5 && parts[3] === 'cutting-list' && parts[4] === 'generate') {
    if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });
    authorize('open', project);
    const payload = await body(request);
    return json(response, 200, { cuttingList: generateCuttingList(projectService, furnitureObjectEngine, projectId, payload.objectId) });
  }

  if (parts.length === 5 && parts[3] === 'purchase-list' && parts[4] === 'generate') {
    if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });
    authorize('open', project);
    const payload = await body(request);
    return json(response, 200, { purchaseList: generatePurchaseList(projectService, furnitureObjectEngine, projectId, { cuttingListResult: payload.cuttingListResult, cuttingListResults: payload.cuttingListResults }) });
  }

  if (parts.length === 5 && parts[3] === 'purchase-list' && parts[4] === 'hardware-list') {
    if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });
    authorize('open', project);
    const payload = await body(request);
    return json(response, 200, { hardwareList: buildHardwareList(payload.purchaseListResult, projectId, payload.objectId || null) });
  }

  if (parts.length === 5 && parts[3] === 'purchase-list' && parts[4] === 'accessories-list') {
    if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });
    authorize('open', project);
    const payload = await body(request);
    return json(response, 200, { accessoriesList: buildAccessoriesList(payload.purchaseListResult, projectId, payload.objectId || null) });
  }

  if (parts.length === 5 && parts[3] === 'purchase-list' && parts[4] === 'summary') {
    if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });
    authorize('open', project);
    const payload = await body(request);
    return json(response, 200, { summary: buildPurchaseSummary(payload.purchaseListResult, projectId) });
  }

  if (parts.length === 5 && parts[3] === 'purchase-list' && parts[4] === 'categories') {
    if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });
    authorize('open', project);
    const payload = await body(request);
    return json(response, 200, { categories: buildCategoryManagement(payload.purchaseListResult, projectId) });
  }

  if (parts.length === 5 && parts[3] === 'purchase-list' && parts[4] === 'reports') {
    if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });
    authorize('open', project);
    const payload = await body(request);
    const purchaseList = payload.purchaseListResult;
    const boardMaterialList = buildBoardMaterialList(purchaseList, projectId);
    const hardwareList = buildHardwareList(purchaseList, projectId);
    const accessoriesList = buildAccessoriesList(purchaseList, projectId);
    const purchaseSummary = buildPurchaseSummary(purchaseList, projectId);
    const categoryManagement = buildCategoryManagement(purchaseList, projectId);
    return json(response, 200, { reports: buildPurchaseReports({ purchaseListResult: purchaseList, boardMaterialList, hardwareList, accessoriesList, purchaseSummary, categoryManagement }, projectId) });
  }

  if (parts.length === 5 && parts[3] === 'purchase-list' && parts[4] === 'print') {
    if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });
    authorize('open', project);
    const payload = await body(request);
    const purchaseList = payload.purchaseListResult;
    const boardMaterialList = buildBoardMaterialList(purchaseList, projectId);
    const hardwareList = buildHardwareList(purchaseList, projectId);
    const accessoriesList = buildAccessoriesList(purchaseList, projectId);
    const purchaseSummary = buildPurchaseSummary(purchaseList, projectId);
    const categoryManagement = buildCategoryManagement(purchaseList, projectId);
    return json(response, 200, { printModel: preparePurchaseListPrint({ purchaseList, boardMaterialList, hardwareList, accessoriesList, purchaseSummary, categoryManagement }, projectId) });
  }

  if (parts.length === 5 && parts[3] === 'purchase-list' && parts[4] === 'export-pdf') {
    if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });
    authorize('open', project);
    const payload = await body(request);
    const purchaseList = payload.purchaseListResult;
    const boardMaterialList = buildBoardMaterialList(purchaseList, projectId);
    const hardwareList = buildHardwareList(purchaseList, projectId);
    const accessoriesList = buildAccessoriesList(purchaseList, projectId);
    const purchaseSummary = buildPurchaseSummary(purchaseList, projectId);
    const categoryManagement = buildCategoryManagement(purchaseList, projectId);
    const printModel = preparePurchaseListPrint({ purchaseList, boardMaterialList, hardwareList, accessoriesList, purchaseSummary, categoryManagement }, projectId);
    const pdf = exportPurchaseListPdf(printModel, projectId);
    response.writeHead(200, { 'Content-Type': pdf.contentType, 'Content-Length': pdf.buffer.length, 'Content-Disposition': `attachment; filename="${pdf.filename}"` });
    return response.end(pdf.buffer);
  }

  if (parts.length === 5 && parts[3] === 'purchase-list' && parts[4] === 'export-excel') {
    if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });
    authorize('open', project);
    const payload = await body(request);
    const purchaseList = payload.purchaseListResult;
    const boardMaterialList = buildBoardMaterialList(purchaseList, projectId);
    const hardwareList = buildHardwareList(purchaseList, projectId);
    const accessoriesList = buildAccessoriesList(purchaseList, projectId);
    const purchaseSummary = buildPurchaseSummary(purchaseList, projectId);
    const categoryManagement = buildCategoryManagement(purchaseList, projectId);
    const exported = exportPurchaseListExcel({ purchaseListResult: purchaseList, boardMaterialList, hardwareList, accessoriesList, purchaseSummary, categoryManagement }, projectId);
    response.writeHead(200, { 'Content-Type': exported.contentType, 'Content-Length': exported.buffer.length, 'Content-Disposition': `attachment; filename="${exported.filename}"` });
    return response.end(exported.buffer);
  }

  if (parts.length === 5 && parts[3] === 'cutting-list' && parts[4] === 'board-layout') {
    if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });
    authorize('open', project);
    const payload = await body(request);
    const cuttingList = generateCuttingList(projectService, furnitureObjectEngine, projectId, payload.objectId);
    return json(response, 200, { boardLayout: generateBoardLayout(cuttingList, projectService.data.official, projectId, payload.objectId, payload.cuttingListId || null) });
  }

  if (parts.length === 5 && parts[3] === 'cutting-list' && parts[4] === 'material-statistics') {
    if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });
    authorize('open', project);
    const payload = await body(request);
    const cuttingList = generateCuttingList(projectService, furnitureObjectEngine, projectId, payload.objectId);
    let boardLayout = null;
    if (payload.boardLayoutId) boardLayout = generateBoardLayout(cuttingList, projectService.data.official, projectId, payload.objectId, payload.cuttingListId || null);
    return json(response, 200, { statistics: generateMaterialStatistics(cuttingList, projectService.data.official, boardLayout, projectId, payload.objectId, payload.cuttingListId || null, payload.boardLayoutId || null) });
  }

  if (parts.length === 5 && parts[3] === 'cutting-list' && parts[4] === 'waste-analysis') {
    if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });
    authorize('open', project);
    const payload = await body(request);
    const cuttingList = generateCuttingList(projectService, furnitureObjectEngine, projectId, payload.objectId);
    if (!payload.boardLayoutId) return json(response, 200, { analysis: generateWasteAnalysis(cuttingList, null, projectService.data.official, payload.materialStatisticsId || null, projectId, payload.objectId, payload.cuttingListId || null) });
    const boardLayout = generateBoardLayout(cuttingList, projectService.data.official, projectId, payload.objectId, payload.cuttingListId || null);
    return json(response, 200, { analysis: generateWasteAnalysis(cuttingList, boardLayout, projectService.data.official, payload.materialStatisticsId || null, projectId, payload.objectId, payload.cuttingListId || null, payload.boardLayoutId) });
  }

  if (parts.length === 5 && parts[3] === 'cutting-list' && parts[4] === 'information-panel') {
    if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });
    authorize('open', project);
    const payload = await body(request);
    const cuttingList = generateCuttingList(projectService, furnitureObjectEngine, projectId, payload.objectId);
    const official = projectService.data.official;
    const boardLayout = payload.boardLayoutId ? generateBoardLayout(cuttingList, official, projectId, payload.objectId, payload.cuttingListId || null) : null;
    const materialStatistics = payload.materialStatisticsId ? generateMaterialStatistics(cuttingList, official, boardLayout, projectId, payload.objectId, payload.cuttingListId || null, payload.boardLayoutId || null) : null;
    const wasteAnalysis = payload.wasteAnalysisId ? generateWasteAnalysis(cuttingList, boardLayout, official, payload.materialStatisticsId || null, projectId, payload.objectId, payload.cuttingListId || null, payload.boardLayoutId || null) : null;
    return json(response, 200, { panel: generateInformationPanel(cuttingList, boardLayout, materialStatistics, wasteAnalysis, projectId, payload.objectId, payload.cuttingListId || null, payload.boardLayoutId || null, payload.materialStatisticsId || null, payload.wasteAnalysisId || null) });
  }

  if (parts.length === 5 && parts[3] === 'cutting-list' && parts[4] === 'part-trace') {
    if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });
    authorize('open', project);
    const payload = await body(request);
    const cuttingList = generateCuttingList(projectService, furnitureObjectEngine, projectId, payload.objectId);
    const object = furnitureObjectEngine.getObject(projectId, payload.objectId);
    const official = projectService.data.official;
    const boardLayout = payload.boardLayoutId ? generateBoardLayout(cuttingList, official, projectId, payload.objectId, payload.cuttingListId || null) : null;
    const materialStatistics = payload.materialStatisticsId ? generateMaterialStatistics(cuttingList, official, boardLayout, projectId, payload.objectId, payload.cuttingListId || null, payload.boardLayoutId || null) : null;
    const wasteAnalysis = payload.wasteAnalysisId ? generateWasteAnalysis(cuttingList, boardLayout, official, payload.materialStatisticsId || null, projectId, payload.objectId, payload.cuttingListId || null, payload.boardLayoutId || null) : null;
    return json(response, 200, { trace: generatePartTrace(cuttingList, object, official, boardLayout, materialStatistics, wasteAnalysis, projectId, payload.objectId, payload.cuttingListId || null, payload.partId, payload.boardLayoutId || null, payload.materialStatisticsId || null, payload.wasteAnalysisId || null) });
  }

  if (parts.length === 5 && parts[3] === 'cutting-list' && parts[4] === 'print') {
    if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });
    authorize('open', project);
    const payload = await body(request);
    const printType = payload.printType || 'current-view';
    const cuttingList = generateCuttingList(projectService, furnitureObjectEngine, projectId, payload.objectId);
    const object = furnitureObjectEngine.getObject(projectId, payload.objectId);
    const official = projectService.data.official;
    const boardLayout = payload.boardLayoutId ? generateBoardLayout(cuttingList, official, projectId, payload.objectId, payload.cuttingListId || null) : null;
    const materialStatistics = payload.materialStatisticsId ? generateMaterialStatistics(cuttingList, official, boardLayout, projectId, payload.objectId, payload.cuttingListId || null, payload.boardLayoutId || null) : null;
    const wasteAnalysis = payload.wasteAnalysisId ? generateWasteAnalysis(cuttingList, boardLayout, official, payload.materialStatisticsId || null, projectId, payload.objectId, payload.cuttingListId || null, payload.boardLayoutId || null) : null;
    const informationPanel = payload.informationPanelId ? generateInformationPanel(cuttingList, boardLayout, materialStatistics, wasteAnalysis, projectId, payload.objectId, payload.cuttingListId || null, payload.boardLayoutId || null, payload.materialStatisticsId || null, payload.wasteAnalysisId || null) : null;
    const partTrace = payload.partTraceId ? generatePartTrace(cuttingList, object, official, boardLayout, materialStatistics, wasteAnalysis, projectId, payload.objectId, payload.cuttingListId || null, payload.partId, payload.boardLayoutId || null, payload.materialStatisticsId || null, payload.wasteAnalysisId || null) : null;
    return json(response, 200, { print: prepareCuttingListPrintDocument({ cuttingList, boardLayout, materialStatistics, wasteAnalysis, informationPanel, partTrace }, projectId, payload.objectId, printType) });
  }

  if (parts.length === 5 && parts[3] === 'cutting-list' && parts[4] === 'export-pdf') {
    if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });
    authorize('open', project);
    const payload = await body(request);
    const printType = payload.printType || 'current-view';
    const cuttingList = generateCuttingList(projectService, furnitureObjectEngine, projectId, payload.objectId);
    const object = furnitureObjectEngine.getObject(projectId, payload.objectId);
    const official = projectService.data.official;
    const boardLayout = payload.boardLayoutId ? generateBoardLayout(cuttingList, official, projectId, payload.objectId, payload.cuttingListId || null) : null;
    const materialStatistics = payload.materialStatisticsId ? generateMaterialStatistics(cuttingList, official, boardLayout, projectId, payload.objectId, payload.cuttingListId || null, payload.boardLayoutId || null) : null;
    const wasteAnalysis = payload.wasteAnalysisId ? generateWasteAnalysis(cuttingList, boardLayout, official, payload.materialStatisticsId || null, projectId, payload.objectId, payload.cuttingListId || null, payload.boardLayoutId || null) : null;
    const informationPanel = payload.informationPanelId ? generateInformationPanel(cuttingList, boardLayout, materialStatistics, wasteAnalysis, projectId, payload.objectId, payload.cuttingListId || null, payload.boardLayoutId || null, payload.materialStatisticsId || null, payload.wasteAnalysisId || null) : null;
    const partTrace = payload.partTraceId ? generatePartTrace(cuttingList, object, official, boardLayout, materialStatistics, wasteAnalysis, projectId, payload.objectId, payload.cuttingListId || null, payload.partId, payload.boardLayoutId || null, payload.materialStatisticsId || null, payload.wasteAnalysisId || null) : null;
    const printDocument = prepareCuttingListPrintDocument({ cuttingList, boardLayout, materialStatistics, wasteAnalysis, informationPanel, partTrace }, projectId, payload.objectId, printType);
    const pdf = exportCuttingListPdf(printDocument, projectId, payload.objectId);
    response.writeHead(200, { 'Content-Type': pdf.contentType, 'Content-Length': pdf.buffer.length, 'Content-Disposition': `attachment; filename="${pdf.filename}"` });
    return response.end(pdf.buffer);
  }

  if (parts.length === 5 && parts[3] === 'cutting-list' && parts[4] === 'export-excel') {
    if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });
    authorize('open', project);
    const payload = await body(request);
    const exported = exportCuttingListExcel(payload.results, projectId, payload.objectId);
    response.writeHead(200, { 'Content-Type': exported.contentType, 'Content-Length': exported.buffer.length, 'Content-Disposition': `attachment; filename="${exported.filename}"` });
    return response.end(exported.buffer);
  }

  if (parts.length === 5 && parts[3] === 'production-drawings' && parts[4] === 'revisions') {
    if (request.method === 'GET') {
      authorize('open', project);
      const query = new URL(request.url || '/', 'http://localhost').searchParams;
      const objectId = query.get('objectId');
      const drawingId = query.get('drawingId');
      if (!objectId || !drawingId) return json(response, 400, { error: 'objectId and drawingId are required' });
      return json(response, 200, { revisions: listRevisions(projectId, objectId, drawingId) });
    }
    if (request.method === 'POST') {
      authorize('open', project);
      const payload = await body(request);
      const drawing = generateProductionDrawingForPayload(projectId, payload);
      const revision = createRevision(drawing, projectId, payload.objectId, payload.changeSummary);
      return json(response, 201, { revision });
    }
    return json(response, 405, { error: 'Method not allowed' });
  }

  if (parts.length === 6 && parts[3] === 'production-drawings' && parts[4] === 'revisions') {
    if (request.method !== 'GET') return json(response, 405, { error: 'Method not allowed' });
    authorize('open', project);
    const query = new URL(request.url || '/', 'http://localhost').searchParams;
    const objectId = query.get('objectId');
    const drawingId = query.get('drawingId');
    if (!objectId || !drawingId) return json(response, 400, { error: 'objectId and drawingId are required' });
    return json(response, 200, { revision: getRevision(projectId, objectId, drawingId, decodeURIComponent(parts[5])) });
  }

  if (parts.length === 7 && parts[3] === 'production-drawings' && parts[4] === 'revisions' && parts[6] === 'compare') {
    if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });
    authorize('open', project);
    const payload = await body(request);
    const drawing = generateProductionDrawingForPayload(projectId, payload);
    return json(response, 200, { comparison: compareRevision(projectId, payload.objectId, drawing.drawingId, decodeURIComponent(parts[5]), drawing) });
  }

  if (
    parts.length === 5 &&
    parts[3] === 'production-drawings' &&
    parts[4] === 'export-pdf'
  ) {
    if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });
    authorize('open', project);
    const payload = await body(request);
    const drawing = payload.drawingType === 'package'
      ? productionDrawingGenerationService.generatePackage(projectId, payload.objectId)
      : payload.drawingType === 'assembly'
        ? productionDrawingGenerationService.generateAssembly(projectId, payload.objectId)
        : payload.drawingType === 'panel'
          ? productionDrawingGenerationService.generatePanel(projectId, payload.objectId, payload.panelId)
          : payload.drawingType === 'door'
            ? productionDrawingGenerationService.generateDoor(projectId, payload.objectId, payload.doorId)
            : payload.drawingType === 'drawer'
              ? productionDrawingGenerationService.generateDrawer(projectId, payload.objectId, payload.drawerId)
              : payload.drawingType === 'hardware'
                ? productionDrawingGenerationService.generateHardware(projectId, payload.objectId, payload.hardwareId)
                : productionDrawingGenerationService.generate(projectId, payload.objectId);
    const pdf = exportProductionDrawingPdf(drawing, projectId, payload.objectId);
    response.writeHead(200, {
      'Content-Type': pdf.contentType,
      'Content-Length': pdf.buffer.length,
      'Content-Disposition': `attachment; filename="${pdf.filename}"`,
      'Cache-Control': 'no-store',
    });
    response.end(pdf.buffer);
    return true;
  }

  if (
    parts.length === 5 &&
    parts[3] === 'production-drawings' &&
    parts[4] === 'export-dwg'
  ) {
    if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });
    authorize('open', project);
    const payload = await body(request);
    const drawing = payload.drawingType === 'package'
      ? productionDrawingGenerationService.generatePackage(projectId, payload.objectId)
      : payload.drawingType === 'assembly'
        ? productionDrawingGenerationService.generateAssembly(projectId, payload.objectId)
        : payload.drawingType === 'panel'
          ? productionDrawingGenerationService.generatePanel(projectId, payload.objectId, payload.panelId)
          : payload.drawingType === 'door'
            ? productionDrawingGenerationService.generateDoor(projectId, payload.objectId, payload.doorId)
            : payload.drawingType === 'drawer'
              ? productionDrawingGenerationService.generateDrawer(projectId, payload.objectId, payload.drawerId)
              : payload.drawingType === 'hardware'
                ? productionDrawingGenerationService.generateHardware(projectId, payload.objectId, payload.hardwareId)
                : productionDrawingGenerationService.generate(projectId, payload.objectId);
    const dwg = await exportProductionDrawingDwg(drawing, projectId, payload.objectId);
    response.writeHead(200, {
      'Content-Type': dwg.contentType,
      'Content-Length': dwg.buffer.length,
      'Content-Disposition': `attachment; filename="${dwg.filename}"`,
      'Cache-Control': 'no-store',
      'X-DWG-Format': 'AC1032',
    });
    response.end(dwg.buffer);
    return true;
  }

  if (
    parts.length === 5 &&
    parts[3] === 'production-formula' &&
    parts[4] === 'calculate'
  ) {
    if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });
    authorize('open', project);
    const payload = await body(request);
    const object = furnitureObjectEngine.getObject(projectId, payload.objectId);
    const result = productionFormulaEngine.calculateFurnitureObject(projectId, object, payload.ruleId);
    return json(response, 200, { productionResult: result });
  }

  if (await handleFurnitureObjects(request, response, projectId, project, parts)) return true;

  if (
    parts.length === 6 &&
    parts[3] === 'pdf' &&
    parts[4] === 'backup' &&
    parts[5] === 'annotations'
  ) {
    authorize(request.method === 'GET' ? 'open' : 'edit', project);

    if (request.method === 'GET') {
      return json(response, 200, {
        projectId,
        revisionId: project.projectDocuments?.backupPdf?.sourceDesignerRevisionId || null,
        annotations: projectService.getBackupPdfAnnotations(projectId),
      });
    }

    if (request.method === 'PUT') {
      const payload = await body(request);
      const saved = projectService.saveBackupPdfAnnotations(
        projectId,
        payload.annotations
      );
      return json(response, 200, {
        projectId,
        revisionId: project.projectDocuments?.backupPdf?.sourceDesignerRevisionId || null,
        annotations: saved,
      });
    }

    return json(response, 405, { error: 'Method not allowed' });
  }

  if (parts.length === 4 && parts[3] === 'site-survey') {
    if (request.method === 'GET') {
      authorize('open', project);
      return json(response, 200, {
        siteSurvey: projectService.getSiteSurvey(projectId),
      });
    }
    if (request.method === 'PUT') {
      authorize('edit', project);
      const payload = await body(request);
      const saved = projectService.saveSiteSurvey(projectId, payload);
      return json(response, 200, { siteSurvey: saved.siteSurvey });
    }
    return json(response, 405, { error: 'Method not allowed' });
  }

  if (parts.length === 4 && parts[3] === 'review') {
    if (request.method === 'GET') {
      authorize('open', project);
      return json(response, 200, {
        review: projectService.getRecognitionReview(projectId),
      });
    }
    if (request.method === 'PUT') {
      authorize('edit', project);
      const payload = await body(request);
      const saved = projectService.saveRecognitionReview(projectId, payload);
      return json(response, 200, { review: saved.recognitionReview });
    }
    return json(response, 405, { error: 'Method not allowed' });
  }

  /*
   * ---------------------------------------------------
   * Designer Revisions
   * ---------------------------------------------------
   */

  if (
    handleDesignerRevisions(
      request,
      response,
      projectId,
      project,
      parts
    )
  ) {
    return true;
  }

  /*
   * ---------------------------------------------------
   * Recognition Summary
   * ---------------------------------------------------
   */

  if (
    handleRecognitionSummary(
      request,
      response,
      projectId,
      project,
      parts
    )
  ) {
    return true;
  }

  /*
   * ---------------------------------------------------
   * Engineering Records
   * ---------------------------------------------------
   */

  if (
    await handleEngineeringRecords(
      request,
      response,
      projectId,
      project,
      parts
    )
  ) {
    return true;
  }

  /*
   * ---------------------------------------------------
   * Engineering Issues
   * ---------------------------------------------------
   */

  if (
    await handleEngineeringIssues(
      request,
      response,
      projectId,
      project,
      parts
    )
  ) {
    return true;
  }

  /*
   * ---------------------------------------------------
   * Engineering Issue Summary
   * ---------------------------------------------------
   */

  if (
    handleEngineeringIssueSummary(
      request,
      response,
      projectId,
      project,
      parts
    )
  ) {
    return true;
  }

  /*
   * ---------------------------------------------------
   * Recognition
   * ---------------------------------------------------
   */

  if (
    await handleRecognition(
      request,
      response,
      projectId,
      project,
      parts
    )
  ) {
    return true;
  }

  /*
   * ---------------------------------------------------
   * /api/projects/:id
   * ---------------------------------------------------
   */

  if (
    parts.length === 3
  ) {
    const handled =
      await handleProjectResource(
        request,
        response,
        projectId,
        project
      );

    if (
      handled !== false
    ) {
      return true;
    }
  }

  /*
   * ---------------------------------------------------
   * Action routes
   * ---------------------------------------------------
   */

  if (
    handleProjectActionRoute(
      request,
      response,
      parts
    )
  ) {
    return true;
  }

  return false;
}

/*
 * =====================================================
 * API Handler
 * =====================================================
 */

async function handleApi(
  request,
  response,
  pathname
) {
  const parts =
    pathname
      .split('/')
      .filter(Boolean);

  try {
    /*
     * ===================================================
     * Account Context
     * ===================================================
     */

    if (
      parts[0] === 'api' &&
      parts[1] === 'account' &&
      parts.length === 3 &&
      parts[2] === 'context'
    ) {
      return handleAccountContext(
        request,
        response
      );
    }

    /*
     * ===================================================
     * Project API Boundary
     * ===================================================
     */

    if (parts[0] === 'api' && parts[1] === 'materials' && parts.length === 2 && request.method === 'GET') {
      return json(response, 200, { materials: projectService.data.official.listMaterials() });
    }

    if (parts[0] === 'api' && parts[1] === 'hardware' && parts.length === 2 && request.method === 'GET') {
      return json(response, 200, { hardware: projectService.data.official.listHardware() });
    }

    if (
      parts[0] !== 'api' ||
      parts[1] !== 'projects'
    ) {
      return false;
    }

    /*
     * ===================================================
     * GET /api/projects
     * ===================================================
     */

    if (
      parts.length === 2 &&
      request.method === 'GET'
    ) {
      return listProjects(
        response
      );
    }

    /*
     * ===================================================
     * POST /api/projects
     * ===================================================
     */

    if (
      parts.length === 2 &&
      request.method === 'POST'
    ) {
      return createProject(
        request,
        response
      );
    }

    /*
     * ===================================================
     * Sprint 03 — Backup PDF Creation
     * ===================================================
     *
     * IMPORTANT:
     *
     * This MUST execute before handleProjectPdf().
     *
     * POST:
     *
     * /api/projects/:id/pdf/backup
     *
     * is handled here.
     *
     * GET:
     *
     * /api/projects/:id/pdf/backup
     *
     * falls through to handleProjectPdf().
     */

    if (
      handleBackupPdfCreation(
        request,
        response,
        parts
      )
    ) {
      return true;
    }

    /*
     * ===================================================
     * Project PDF
     * ===================================================
     */

    if (await handleDwgExport(request, response, parts)) return true;

    if (
      handleProjectPdf(
        request,
        response,
        parts
      )
    ) {
      return true;
    }

    /*
     * ===================================================
     * Project Scoped API
     * ===================================================
     */

    if (
      await handleProjectScopedApi(
        request,
        response,
        parts
      )
    ) {
      return true;
    }

    /*
     * ===================================================
     * Unknown Project API Route
     * ===================================================
     */

    return json(
      response,
      404,
      {
        error:
          'API route not found',
      }
    );
  } catch (error) {
    const status =
      error.statusCode ||
      (
        error instanceof
        SyntaxError
          ? 400
          : 500
      );

    return json(
      response,
      status,
      {
        error:
          error.message ||
          'Project API error',
        ...(error.code ? { code: error.code } : {}),
        ...(error.details && Object.keys(error.details).length ? { details: error.details } : {}),
      }
    );
  }
}

/*
 * =====================================================
 * Static File Security
 * =====================================================
 */

function safePath(
  urlPath
) {
  const requested =
    urlPath === '/'
      ? '/index.html'
      : urlPath;

  let decoded;

  try {
    decoded =
      decodeURIComponent(
        requested
      );
  } catch {
    return null;
  }

  const normalized =
    path.normalize(
      decoded
    );

  const absolute =
    path.resolve(
      root,
      `.${normalized}`
    );

  const rootPrefix =
    `${root}${path.sep}`;

  if (
    absolute === root
  ) {
    return absolute;
  }

  if (
    absolute.startsWith(
      rootPrefix
    )
  ) {
    return absolute;
  }

  return null;
}

/*
 * =====================================================
 * Static File Response
 * =====================================================
 */

function serveStatic(
  request,
  response
) {
  const rawPath =
    String(
      request.url || '/'
    ).split('?')[0];

  const filePath =
    safePath(
      rawPath
    );

  if (!filePath) {
    response.writeHead(
      400,
      {
        'Content-Type':
          'text/plain; charset=utf-8',
      }
    );

    response.end(
      'Bad request'
    );

    return;
  }

  fs.readFile(
    filePath,
    (
      error,
      data
    ) => {
      if (error) {
        response.writeHead(
          error.code ===
            'ENOENT'
            ? 404
            : 500,
          {
            'Content-Type':
              'text/plain; charset=utf-8',
          }
        );

        response.end(
          error.code ===
            'ENOENT'
            ? 'Not found'
            : 'Server error'
        );

        return;
      }

      const extension =
        path.extname(
          filePath
        ).toLowerCase();

      response.writeHead(
        200,
        {
          'Content-Type':
            contentTypes[
              extension
            ] ||
            'application/octet-stream',

          'Cache-Control':
            'no-cache',
        }
      );

      response.end(
        data
      );
    }
  );
}

/*
 * =====================================================
 * HTTP Server
 * =====================================================
 */

const server =
  http.createServer(
    async (
      request,
      response
    ) => {
      try {
        const requestUrl =
          new URL(
            request.url || '/',
            `http://${
              request.headers.host ||
              'localhost'
            }`
          );

        const pathname =
          requestUrl.pathname;

        /*
         * -------------------------------------------------
         * API Routing
         * -------------------------------------------------
         */

        if (
          pathname ===
            '/api/projects' ||
          pathname ===
            '/api/materials' ||
          pathname ===
            '/api/hardware' ||
          pathname.startsWith(
            '/api/projects/'
          ) ||
          pathname ===
            '/api/account/context'
        ) {
          await handleApi(
            request,
            response,
            pathname
          );

          return;
        }

        /*
         * -------------------------------------------------
         * Unknown API
         * -------------------------------------------------
         */

        if (
          pathname.startsWith(
            '/api/'
          )
        ) {
          json(
            response,
            404,
            {
              error:
                'API route not found',
            }
          );

          return;
        }

        /*
         * -------------------------------------------------
         * Static Files
         * -------------------------------------------------
         */

        serveStatic(
          request,
          response
        );
      } catch (error) {
        if (
          response.writableEnded
        ) {
          return;
        }

        json(
          response,
          error.statusCode || 500,
          {
            error:
              error.message ||
              'Internal server error',
          }
        );
      }
    }
  );

/*
 * =====================================================
 * Server Error Handling
 * =====================================================
 */

server.on(
  'error',
  (error) => {
    console.error(
      'Furniture GO server error:',
      error
    );
  }
);

/*
 * =====================================================
 * Start
 * =====================================================
 */

server.listen(
  port,
  '127.0.0.1',
  () => {
    console.log(
      `Furniture GO foundation running at http://127.0.0.1:${port}`
    );
  }
);
