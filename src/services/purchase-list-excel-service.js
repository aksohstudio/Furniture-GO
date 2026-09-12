const XLSX = require('xlsx');
const { preparePurchaseListPrint } = require('./purchase-list-print-service');
const { validatePrintModel } = require('./purchase-list-pdf-service');

const CONTRACT = 'purchase-list-excel-result';

function fail(message, code, details = {}) {
  throw Object.assign(new Error(message), { code, details });
}

function value(input) {
  if (input === undefined || input === null || input === '') return 'Not Available';
  if (typeof input === 'object') return JSON.stringify(input);
  return input;
}

function safeFilePart(value) {
  return String(value || 'Project').replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '') || 'Project';
}

function appendSheet(workbook, name, headers, rows) {
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  sheet['!cols'] = headers.map((header, index) => ({ wch: Math.min(40, Math.max(header.length + 2, ...rows.slice(0, 100).map((row) => String(row[index] ?? '').length + 2), 12)) }));
  XLSX.utils.book_append_sheet(workbook, sheet, name);
}

function summaryRows(model) {
  const summary = model.purchaseSummary || {};
  return [
    ['Furniture GO', 'Furniture GO'],
    ['Project Name', value(model.project?.name)],
    ['Project ID', value(model.project?.projectId)],
    ['Purchase List ID', value(model.purchaseList?.purchaseListId)],
    ['Purchase List Status', value(model.purchaseList?.status)],
    ['Validation', value(model.purchaseList?.validation?.status)],
    ['Read-only', 'Yes'],
    ['Furniture Object Count', model.furnitureObjects.length],
    ['Material Item Count', value(summary.materialItemCount)],
    ['Hardware Item Count', value(summary.hardwareItemCount)],
    ['Accessories Item Count', value(summary.accessoryItemCount)],
    ['Total Item Count', value(summary.totalItemCount)],
    ['Quantity Summary', value(summary.quantitySummary)],
    ['Category Summary', value(summary.categorySummary)],
    ['Unit Summary', value(summary.unitSummary)],
    ['Source', value(model.source)],
  ];
}

function materialRows(items) {
  return items.map((item) => [item.itemId, item.sourceObjectId, item.sourceComponentId, item.materialId, item.materialName, item.productCode, item.specification, item.thickness, item.quantity, item.unit, value(item.source), value(item.validation)]);
}

function hardwareRows(items) {
  return items.map((item) => [item.itemId, item.sourceObjectId, item.sourceComponentId, item.hardwareId, item.name, item.productCode, item.type, item.category, item.specification, item.quantity, item.unit, value(item.source), value(item.validation)]);
}

function accessoryRows(items) {
  return items.map((item) => [item.itemId, item.sourceObjectId, item.sourceComponentId, item.accessoryId, item.name, item.productCode, item.category, item.type, item.specification, item.quantity, item.unit, value(item.source), value(item.validation)]);
}

function categoryRows(model) {
  const rows = [];
  for (const [dimension, groups] of [['Category', model.categorySummary?.categories || []], ['Type', model.categorySummary?.types || []]]) {
    groups.forEach((group) => rows.push([dimension, group.categoryId, group.category || (dimension === 'Category' ? 'CATEGORY_UNAVAILABLE' : 'Not Available'), group.type || 'Not Available', group.itemCount, group.totalQuantity, value(group.units), value(group.source), value(group.validation)]));
  }
  return rows.length ? rows : [['Not Available', 'Not Available', 'CATEGORY_UNAVAILABLE', 'Not Available', 0, 'Not Available', 'Not Available', 'Not Available', 'Not Available']];
}

function exportPurchaseListExcel(input, projectId) {
  const printModel = input?.printId || input?.contract === 'purchase-list-print-model'
    ? validatePrintModel(input, projectId)
    : preparePurchaseListPrint({ purchaseList: input?.purchaseListResult || input?.purchaseList, boardMaterialList: input?.boardMaterialList, hardwareList: input?.hardwareList, accessoriesList: input?.accessoriesList, purchaseSummary: input?.purchaseSummary, categoryManagement: input?.categoryManagement }, projectId);
  if (!printModel || printModel.contract !== 'purchase-list-print-model') fail('Print Model is invalid', 'INVALID_PRINT_MODEL');
  const workbook = XLSX.utils.book_new();
  appendSheet(workbook, 'Purchase Summary', ['Field', 'Value'], summaryRows(printModel));
  appendSheet(workbook, 'Board Materials', ['Item ID', 'Source Object ID', 'Source Component ID', 'Material ID', 'Material Name', 'Product Code', 'Specification', 'Thickness', 'Quantity', 'Unit', 'Source', 'Validation'], materialRows(printModel.materialItems));
  appendSheet(workbook, 'Hardware', ['Item ID', 'Source Object ID', 'Source Component ID', 'Hardware ID', 'Hardware Name', 'Product Code', 'Type', 'Category', 'Specification', 'Quantity', 'Unit', 'Source', 'Validation'], hardwareRows(printModel.hardwareItems));
  appendSheet(workbook, 'Accessories', ['Item ID', 'Source Object ID', 'Source Component ID', 'Accessory ID', 'Accessory Name', 'Product Code', 'Category', 'Type', 'Specification', 'Quantity', 'Unit', 'Source', 'Validation'], accessoryRows(printModel.accessoryItems));
  appendSheet(workbook, 'Categories', ['Dimension', 'Category ID', 'Category', 'Type', 'Item Count', 'Total Quantity', 'Units', 'Source', 'Validation'], categoryRows(printModel));
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer', compression: true });
  return { contract: CONTRACT, excelId: `purchase-list-excel:${projectId}:${printModel.purchaseList.purchaseListId}`, project: printModel.project, furnitureObjects: printModel.furnitureObjects, purchaseList: printModel.purchaseList, materialItems: printModel.materialItems, hardwareItems: printModel.hardwareItems, accessoryItems: printModel.accessoryItems, purchaseSummary: printModel.purchaseSummary, categorySummary: printModel.categorySummary, source: printModel.source, validation: { valid: true, status: 'EXCEL_READY', issues: [] }, status: 'Excel Ready', readOnly: true, workbook, buffer, filename: `FurnitureGO_${safeFilePart(printModel.project?.name || projectId)}_Purchase_List.xlsx`, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
}

module.exports = { CONTRACT, exportPurchaseListExcel, appendSheet, summaryRows };
