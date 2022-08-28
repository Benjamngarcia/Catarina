$(document).ready(function () {
    TableExport.prototype.formatConfig.xlsx = {
        defaultClass: 'btn btn-success xlsx mx-3 descargarExcel',
        buttonContent: 'Descargar Excel',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileExtension: '.xlsx'
    }
    // let caption = document.getElementsByTagName("caption")
    // let text = caption.item(0).innerHTML
    // console.log(caption)
    // let divexcel = document.getElementById("btn-excel")
    // caption.innerHTML = "caption"
    // document.getElementsByClassName('intentoexcel').innerHTML = "hola";
    // document.getElementsByClassName('descargarExcel').innerHTML = '<i class="fas fa-file-excel"></i>';
    // let boton = document.getElementsByClassName('descargarExcel');
    // let i = document.createElement("i")
    // i.innerHTML= "hola"
    // boton.appendChild(i)
    const table = TableExport(document.getElementById("tabla-historial"), {formats: ["xlsx"], filename: "Historial", bootstrap: true})
    let exportData = table.getExportData();
    let xlsxData = exportData.table.xlsx;
    
    table.export2file(xlsxData.data, xlsxData.mimeType, xlsxData.filename, xlsxData.fileExtension, xlsxData.merges, xlsxData.RTL, xlsxData.sheetname);
})