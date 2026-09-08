import { Modal } from "react-bootstrap";
import React, { useState, useEffect, useRef } from "react";
import {
  angkaKeHuruf,
  checkNotAuthorized,
  initAccessMethod,
} from "pages/Utils";
import Button from "components/Button";
import { DownloadTableExcel } from "react-export-table-to-excel";
import { api_services } from "hooks/api_services";
import axios, { CancelToken } from "lib/axios";
import * as htmlToImage from "html-to-image";
import { toPng, toJpeg, toBlob, toPixelData, toSvg } from "html-to-image";
import ExcelJS from "exceljs";
import { headers } from "pages/(app)/progress_efektifitas/page";

const css = `
<style>
.border {
    border: 1px solid #ddd;
    }
    .border-collapse {
          border-collapse: collapse;
      }
          .w-full {
              width: 100%;
          }

          .table-auto {
    table-layout: auto;
}

#rowterakhir{
    display:none !important; 
}

th{
    background-color:#2b2a4c;
    color:#ffffff !important;
}

.table , h3{
    display: table;
     font-family: 'Aptos', sans-serif;
}

.mt-3 {
    margin-top: 1rem !important;
}

.d-flex {
display: flex;
    flex-direction: row;
}

.me-2 {
    margin-inline-end: 0.5rem;
}


.me-2 {
    margin-right: .5rem !important;
}

.align-items-center {
    align-items: center !important;
}

.dot {
    width: 15px;
    height: 15px;
    border-radius: 20px;
}

img {
display: block;
}

#matrix_table {
margin-top: 20px;
}

.text-center {
text-align: center;
}

.css-b62m3t-container {
display:none;
}

#sebaran_risiko_table {
margin-top: 30px;
}

.tr-filter {
display: none;
}
    </style>

`;

export default ({ ...props }) => {
  // Array.prototype.forEach.call(window.parent.document.querySelectorAll("link[rel=stylesheet]"), function (link) {
  //     var newLink = document.createElement("link");
  //     newLink.rel = link.rel;
  //     newLink.href = link.href;
  //     document.head.appendChild(newLink);
  // });

  const { postapi_services } = api_services();
  const [errors, setErrors] = useState({});

  // const iframeRef = useRef(null);
  const [content, setcontent] = useState("");
  const [show, setShow] = useState(false);
  const [btn_loading, setbtn_loading] = useState(false);

  // useEffect(() => {
  //     if (props.show && !props.is_matrix) {
  //         handlepreview()
  //     }
  // }, [props.show])

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleHtmlToImage = (node, to) => {
    let response = new Promise((resolve, reject) => {
      htmlToImage[to](node)
        .then(function (dataUrl) {
          // var img = new Image();
          // img.src = dataUrl;
          // resolve(img)

          var img = new Image();
          img.src = dataUrl;
          resolve({ img, base64: dataUrl });
        })
        .catch(function (error) {
          resolve(false);
        });
    });
    return response.then((m) => m);
  };

  const handlepreview = async () => {
    console.log("props.warna");
    console.log(props.warna);
    // const body = props.data

    setbtn_loading(true);
    // // const response = await postapi_services({ setErrors, ...body, api_path: props.url })

    const nodematrix = document.getElementById("matrix");
    const nodematrixlabel = document.getElementById("matrix_label");
    const nodedoughnutgrafik = document.getElementById("doughnut_grafik");
    const nodebargrafik = document.getElementById("bar_grafik");

    let matriximg = "";
    let matrixlabelimg = "";
    if (props.is_matrix) {
      matriximg = await handleHtmlToImage(nodematrix, "toPng");
      matrixlabelimg = await handleHtmlToImage(nodematrixlabel, "toPng");
    }

    let grafikimg = "";
    if (props.is_grafik) {
      grafikimg = await handleHtmlToImage(
        props.is_doughnut ? nodedoughnutgrafik : nodebargrafik,
        "toPng"
      );
    }

    // console.log(" if (!props.is_matrix)s")
    if (!props.is_matrix && !props.is_grafik) {
      await sleep(1000);
      // console.log(" if (!props.is_matrix)s =====>")
    }
    // console.log('image')
    // console.log(img)
    // console.log(base64)

    // console.log('props.is_matrix')
    // console.log(props.is_matrix)
    // console.log(iframeRef.current)

    if (iframeRef.current) {
      var iframedoc =
        iframeRef.current.contentDocument ||
        iframeRef.current.contentWindow.document;

      let htmlstr = "";
      if (props.is_matrix) {
        htmlstr += matriximg.img.outerHTML;
        htmlstr += matrixlabelimg.img.outerHTML;
      }
      if (props.is_grafik) {
        htmlstr += grafikimg.img.outerHTML;
      }
      htmlstr += props.data;
      htmlstr += css;

      iframedoc.body.innerHTML = htmlstr;

      console.log(iframedoc);
    }

    setbtn_loading(false);

    // setcontent('response');
    // console.log(iframeRef.current);
    // setcontent(response);

    // var iframedoc = iframeRef.contentDocument || iframeRef.contentWindow.document;
    // iframedoc.body.innerHTML = 'Hello world';
  };

  const handleExportMatrix = async () => {
    const nodematrix = document.getElementById("matrix");
    let matriximg = await handleHtmlToImage(nodematrix, "toPng");

    const nodematrixlabel = document.getElementById("matrix_label");
    let matrixlabelimg = await handleHtmlToImage(nodematrixlabel, "toPng");

    let workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("My Sheet");

    const image = workbook.addImage({
      base64: matriximg.base64,
      extension: "png",
    });

    sheet.addImage(image, {
      tl: { col: 1, row: 1 },
      ext: { width: 500, height: 500 },
    });

    const imagelabel = workbook.addImage({
      base64: matrixlabelimg.base64,
      extension: "png",
    });

    sheet.addImage(imagelabel, {
      tl: { col: 1, row: 27 },
      ext: { width: 500, height: 55 },
    });

    const start = 33;

    sheet.getRow(start - 1).values = [
      "No",
      "Peristiwa Risiko",
      "Unit",
      "Risk Register",
      "Inheren",
      "Target Residual",
      "Realisasi Residual",
    ];

    sheet.getRow(start - 1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2b2a4c" },
      color: { argb: "FFFFFF" },
    };

    props.data_table.map((m, i) => {
      const row = start + i;

      sheet.getRow(row).values = [
        i + 1,
        m.nama,
        m.nama_unit,
        m.nama_register,
        m.skala_inheren,
        m.skala_target,
        m.skala_realisasi,
      ];

      if (m.id_tingkat_inheren) {
        sheet.getCell(`E${row}`).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: props.warna[m.id_tingkat_inheren].replace("#", "") },
        };
      }
      if (m.id_tingkat_target) {
        sheet.getCell(`F${row}`).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: props.warna[m.id_tingkat_target].replace("#", "") },
        };
      }
      if (m.id_tingkat_realisasi) {
        sheet.getCell(`G${row}`).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: props.warna[m.id_tingkat_realisasi].replace("#", ""),
          },
        };
      }
    });

    workbook.xls.writeBuffer().then(function (data) {
      const blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "download.xls";
      anchor.click();
      window.URL.revokeObjectURL(url);
    });
  };

  const handleExportGrafik = async () => {
    const { sebaran_risiko, korporat_total, labels_tingkat } = initDataGrafik();
    console.log("handleExportGrafik");
    console.log(korporat_total);
    console.log(sebaran_risiko);
    // return
    // console.log('handleExportGrafik')
    // console.log(props.is_negatif)
    // console.log(props.id_tingkat)

    let start = 3;
    let startid_tingkat_idx = !props.is_negatif ? 1 : 5;
    let endid_tingkat_idx = !props.is_negatif ? 4 : 9;

    let tingkat_head = {};
    // console.log(start)
    // console.log(startid_tingkat_idx)
    // console.log(endid_tingkat_idx)

    for (let i = startid_tingkat_idx; i < 10; i++) {
      if (i >= startid_tingkat_idx && i <= endid_tingkat_idx) {
        tingkat_head[i] = props.id_tingkat[i];
        start + 1;
      }
    }
    // console.log('tingkat_head')
    // console.log(tingkat_head)
    // return
    const node = document.getElementById(
      props.is_doughnut ? "doughnut_grafik" : "bar_grafik"
    );
    let nodeimg = await handleHtmlToImage(node, "toPng");

    let workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("My Sheet");

    const image = workbook.addImage({
      base64: nodeimg.base64,
      extension: "png",
    });

    sheet.addImage(image, {
      tl: { col: 1, row: 1 },
      ext: { width: 1050, height: 300 },
    });

    var head = [["Kelompok Bisnis"]];
    sheet.insertRows(19, head);
    sheet.mergeCells("A19:A21");

    sheet.getCell("B19").value = "Jumlah Risiko";
    sheet.mergeCells("B19:Q19");

    sheet.getCell("B20").value = "Total";
    sheet.mergeCells("B20:B21");

    sheet.getCell("C20").value = "Inheren";
    sheet.mergeCells("C20:G20");
    sheet.getCell("H20").value = "Target Residual";
    sheet.mergeCells("H20:L20");
    sheet.getCell("M20").value = "Target Residual";
    sheet.mergeCells("M20:Q20");

    start = 3;
    // let startid_tingkat_idx = !props.is_negatif ? 1 : 5
    // let endid_tingkat_idx = !props.is_negatif ? 5 : 9

    for (let x = 0; x < 3; x++) {
      for (let m in tingkat_head) {
        const pos = `${angkaKeHuruf(start)}21`.toUpperCase();
        sheet.getCell(pos).value = tingkat_head[m];
        // console.log('pos')
        // console.log(pos)
        // console.log(start)
        sheet.getCell(pos).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: props.warna[m].replace("#", "") },
        };
        start += 1;
      }
    }

    let rownumb = 22;
    // start = 3

    Object.keys(sebaran_risiko).map((mm, i) => {
      const m = sebaran_risiko[mm];

      const pos_label = `${angkaKeHuruf(1)}${rownumb}`.toUpperCase();
      const pos = `${angkaKeHuruf(2)}${rownumb}`.toUpperCase();

      sheet.getCell(pos_label).value = mm;
      sheet.getCell(pos).value = m.total;

      let startval = 3;
      Object.keys(m.risiko_awal).map((x, y) => {
        const pos = `${angkaKeHuruf(startval)}${rownumb}`.toUpperCase();
        sheet.getCell(pos).value = m.risiko_awal[x] ? m.risiko_awal[x] : "";

        sheet.getCell(pos).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: labels_tingkat[x].backgroundColor.replace("#", "") },
        };
        startval += 1;
      });
      Object.keys(m.rencana_mitigasi).map((x, y) => {
        const pos = `${angkaKeHuruf(startval)}${rownumb}`.toUpperCase();
        sheet.getCell(pos).value = m.rencana_mitigasi[x]
          ? m.rencana_mitigasi[x]
          : "";

        sheet.getCell(pos).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: labels_tingkat[x].backgroundColor.replace("#", "") },
        };
        startval += 1;
      });
      Object.keys(m.setelah_mitigasi).map((x, y) => {
        const pos = `${angkaKeHuruf(startval)}${rownumb}`.toUpperCase();
        sheet.getCell(pos).value = m.setelah_mitigasi[x]
          ? m.setelah_mitigasi[x]
          : "";

        sheet.getCell(pos).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: labels_tingkat[x].backgroundColor.replace("#", "") },
        };
        startval += 1;
      });

      rownumb += 1;
    });

    const pos_label = `${angkaKeHuruf(1)}${rownumb}`.toUpperCase();
    const pos = `${angkaKeHuruf(2)}${rownumb}`.toUpperCase();
    sheet.getCell(pos_label).value = korporat_total["Korporat"];
    sheet.getCell(pos_label).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "#2b2a4c".replace("#", "") },
    };
    sheet.getCell(pos_label).font = {
      color: { argb: "FFFFFF" },
    };
    sheet.getCell(pos).value = korporat_total["total"];
    sheet.getCell(pos).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "#2b2a4c".replace("#", "") },
    };
    sheet.getCell(pos).font = {
      color: { argb: "FFFFFF" },
    };

    let startval = 3;
    Object.keys(korporat_total.risiko_awal).map((x, y) => {
      const pos = `${angkaKeHuruf(startval)}${rownumb}`.toUpperCase();
      sheet.getCell(pos).value = korporat_total.risiko_awal[x]
        ? korporat_total.risiko_awal[x]
        : "";

      sheet.getCell(pos).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "#2b2a4c".replace("#", "") },
      };
      sheet.getCell(pos).font = {
        color: { argb: "FFFFFF" },
      };
      startval += 1;
    });
    Object.keys(korporat_total.rencana_mitigasi).map((x, y) => {
      const pos = `${angkaKeHuruf(startval)}${rownumb}`.toUpperCase();
      sheet.getCell(pos).value = korporat_total.rencana_mitigasi[x]
        ? korporat_total.rencana_mitigasi[x]
        : "";

      sheet.getCell(pos).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "#2b2a4c".replace("#", "") },
      };
      sheet.getCell(pos).font = {
        color: { argb: "FFFFFF" },
      };
      startval += 1;
    });
    Object.keys(korporat_total.setelah_mitigasi).map((x, y) => {
      const pos = `${angkaKeHuruf(startval)}${rownumb}`.toUpperCase();
      sheet.getCell(pos).value = korporat_total.setelah_mitigasi[x]
        ? korporat_total.setelah_mitigasi[x]
        : "";

      sheet.getCell(pos).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "#2b2a4c".replace("#", "") },
      };
      sheet.getCell(pos).font = {
        color: { argb: "FFFFFF" },
      };
      startval += 1;
    });
    // 8494999599

    workbook.xls.writeBuffer().then(function (data) {
      const blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "download.xls";
      anchor.click();
      window.URL.revokeObjectURL(url);
    });
  };

  const initDataGrafik = () => {
    // console.log('props.tingkat')
    // console.log(props.tingkat)

    let labels_tingkat = {};
    let labels = {};
    let ids = {};

    if (!props.tingkat) return;
    props.tingkat.map((m) => {
      // m.kode = m.id_tingkat
      if (m.jenis == props.jenis) {
        labels_tingkat[m.kode] = {
          label: m.kode,
          color: "#333",
          backgroundColor: m.warna,
        };
        labels[m.kode] = 0;
        ids[m.id_tingkat] = m.kode;
      }
    });
    // setlabels_tingkat(labels_tingkat);
    // setlabels(labels);
    // setids(ids);

    // console.log('labels')
    // console.log(labels)
    // console.log('ids')
    // console.log(ids)
    // console.log(props.tingkat)
    // return

    const params = { labels, ids };

    let namacolumnstr = "nama_group";
    let sebaran_risiko = {};
    props.data_sebaran_risiko.map((m, i) => {
      // is_kelompok_bisnis_obj = m.nama_kelompok_bisnis ? true : false
      // if (is_kelompok_bisnis_obj) {
      //     namacolumnstr = 'nama_kelompok_bisnis'
      // } else {
      //     namacolumnstr = 'nama_taksonomi'
      // }
      if (!sebaran_risiko[m[namacolumnstr]]) {
        sebaran_risiko[m[namacolumnstr]] = {
          total: 0,
          risiko_awal: { ...params.labels },
          rencana_mitigasi: { ...params.labels },
          setelah_mitigasi: { ...params.labels },
        };
      }

      if (m.id_tingkat_inheren && params.ids[m.id_tingkat_inheren]) {
        sebaran_risiko[m[namacolumnstr]].risiko_awal[
          params.ids[m.id_tingkat_inheren]
        ] += m.tot_tingkat_inheren;
        sebaran_risiko[m[namacolumnstr]].total += m.tot_tingkat_inheren;
      }
      if (m.id_tingkat_target && params.ids[m.id_tingkat_target]) {
        sebaran_risiko[m[namacolumnstr]].rencana_mitigasi[
          params.ids[m.id_tingkat_target]
        ] += m.tot_tingkat_target;
        sebaran_risiko[m[namacolumnstr]].total += m.tot_tingkat_target;
      }
      if (m.id_tingkat_real && params.ids[m.id_tingkat_real]) {
        sebaran_risiko[m[namacolumnstr]].setelah_mitigasi[
          params.ids[m.id_tingkat_real]
        ] += m.tot_tingkat_real;
        sebaran_risiko[m[namacolumnstr]].total += m.tot_tingkat_real;
      }
    });

    let korporat_total = {
      Korporat: "Korporat",
    };

    Object.keys(sebaran_risiko).map((mm) => {
      const m = sebaran_risiko[mm];
      if (!korporat_total["total"]) {
        korporat_total["total"] = 0;
      }
      korporat_total["total"] += m.total;
      Object.keys(m.risiko_awal).map((x) => {
        if (!korporat_total["risiko_awal"]) {
          korporat_total["risiko_awal"] = {};
        }
        if (!korporat_total["risiko_awal"][x]) {
          korporat_total["risiko_awal"][x] = 0;
        }
        if (m.risiko_awal[x]) {
          korporat_total["risiko_awal"][x] += m.risiko_awal[x];
        }
      });
      Object.keys(m.rencana_mitigasi).map((x) => {
        if (!korporat_total["rencana_mitigasi"]) {
          korporat_total["rencana_mitigasi"] = {};
        }
        if (!korporat_total["rencana_mitigasi"][x]) {
          korporat_total["rencana_mitigasi"][x] = 0;
        }
        if (m.rencana_mitigasi[x]) {
          korporat_total["rencana_mitigasi"][x] += m.rencana_mitigasi[x];
        }
      });
      Object.keys(m.setelah_mitigasi).map((x) => {
        if (!korporat_total["setelah_mitigasi"]) {
          korporat_total["setelah_mitigasi"] = {};
        }
        if (!korporat_total["setelah_mitigasi"][x]) {
          korporat_total["setelah_mitigasi"][x] = 0;
        }
        if (m.setelah_mitigasi[x]) {
          korporat_total["setelah_mitigasi"][x] += m.setelah_mitigasi[x];
        }
      });
    });

    // console.log('sebaran_risiko')
    // console.log(sebaran_risiko)
    // console.log('korporat_total')
    // console.log(korporat_total)
    // setsebaran_risiko(sebaran_risiko);
    // setkorporat_total(korporat_total);

    return { sebaran_risiko, korporat_total, labels_tingkat };
  };

  const handlepreview_top_risk = async () => {
    // console.log('props.data')
    // console.log(props.data)
    // const body = props.data

    setbtn_loading(true);
    // // const response = await postapi_services({ setErrors, ...body, api_path: props.url })

    const nodematrix = document.getElementById("coba");
    let matriximg = "";
    if (props.is_matrix) {
      matriximg = await handleHtmlToImage(nodematrix, "toPng");
    }

    // console.log('matriximg.img.outerHTML')
    // console.log(matriximg.img.outerHTML)
    if (!props.is_matrix) {
      await sleep(1000);
    }

    if (iframeRef.current) {
      var iframedoc =
        iframeRef.current.contentDocument ||
        iframeRef.current.contentWindow.document;

      let htmlstr = "";
      if (props.is_matrix) {
        htmlstr += matriximg.img.outerHTML;
      }
      htmlstr += props.data;
      htmlstr += css;

      iframedoc.body.innerHTML = htmlstr;

      // console.log(iframedoc)
    }

    setbtn_loading(false);
  };

  const handleExportMatrixTopRisk = async () => {
    // console.log('props.data_table')
    // console.log(props.data_table)
    // return
    const nodematrix = document.getElementById("coba");
    let matriximg = await handleHtmlToImage(nodematrix, "toPng");

    let workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("My Sheet");

    const image = workbook.addImage({
      base64: matriximg.base64,
      extension: "png",
    });

    sheet.addImage(image, {
      tl: { col: 1, row: 1 },
      ext: { width: 1000, height: 500 },
    });

    const header = [
      "No",
      "Nama Risiko",
      "Unit",
      "Risk Register",
      "Risk Owner",
      "Inheren",
      "Target Residual",
      "Realisasi Residual",
    ];
    const start = 33;
    sheet.getRow(start - 1).values = header;
    sheet.getRow(start - 1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2b2a4c" },
      color: { argb: "FFFFFF" },
    };
    props.data_table.risk_matriks.map((m, i) => {
      const row = start + i;

      sheet.getRow(row).values = [
        i + 1,
        m.nama,
        m.nama_unit,
        m.nama_register,
        m.risk_owner,
        m.skala_inheren,
        m.skala_target,
        m.skala_realisasi,
      ];

      if (m.id_tingkat_inheren) {
        sheet.getCell(`F${row}`).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: props.warna[m.id_tingkat_inheren].replace("#", "") },
        };
      }
      if (m.id_tingkat_target) {
        sheet.getCell(`G${row}`).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: props.warna[m.id_tingkat_target].replace("#", "") },
        };
      }
      if (m.id_tingkat_realisasi) {
        sheet.getCell(`H${row}`).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: props.warna[m.id_tingkat_realisasi].replace("#", ""),
          },
        };
      }
    });

    let start_x_banding = 9;
    header.map((m) => {
      const pos = `${angkaKeHuruf(start_x_banding)}${start - 1}`.toUpperCase();
      sheet.getCell(pos).value = m;
      start_x_banding += 1;
    });

    let start_y_banding = 33;
    props.data_table.risk_matriks_banding.map((m, i) => {
      let start_x_banding = 9;
      const row = start_y_banding;

      let pos = `${angkaKeHuruf(start_x_banding)}${row}`.toUpperCase();
      sheet.getCell(pos).value = i + 1;
      start_x_banding += 1;

      pos = `${angkaKeHuruf(start_x_banding)}${row}`.toUpperCase();
      sheet.getCell(pos).value = m.nama;
      start_x_banding += 1;

      pos = `${angkaKeHuruf(start_x_banding)}${row}`.toUpperCase();
      sheet.getCell(pos).value = m.risk_owner;
      start_x_banding += 1;

      pos = `${angkaKeHuruf(start_x_banding)}${row}`.toUpperCase();
      sheet.getCell(pos).value = m.skala_inheren;
      if (m.id_tingkat_inheren) {
        sheet.getCell(pos).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: props.warna[m.id_tingkat_inheren].replace("#", "") },
        };
      }
      start_x_banding += 1;

      pos = `${angkaKeHuruf(start_x_banding)}${row}`.toUpperCase();
      sheet.getCell(pos).value = m.skala_target;
      if (m.id_tingkat_target) {
        sheet.getCell(pos).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: props.warna[m.id_tingkat_target].replace("#", "") },
        };
      }
      start_x_banding += 1;

      pos = `${angkaKeHuruf(start_x_banding)}${row}`.toUpperCase();
      sheet.getCell(pos).value = m.skala_realisasi;
      if (m.id_tingkat_realisasi) {
        sheet.getCell(pos).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: props.warna[m.id_tingkat_realisasi].replace("#", ""),
          },
        };
      }
      start_x_banding += 1;

      start_y_banding += 1;
    });

    workbook.xls.writeBuffer().then(function (data) {
      const blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "download.xls";
      anchor.click();
      window.URL.revokeObjectURL(url);
    });
  };

  const handleExportMatrixTopRiskDetail = async () => {
    // console.log('props.data_table')
    // console.log(props.data_table)
    // return
    const nodematrix = document.getElementById("coba");
    let matriximg = await handleHtmlToImage(nodematrix, "toPng");

    let workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("My Sheet");

    const image = workbook.addImage({
      base64: matriximg.base64,
      extension: "png",
    });

    sheet.addImage(image, {
      tl: { col: 1, row: 1 },
      ext: { width: 1000, height: 500 },
    });

    const header = [
      "No",
      "Nama Risiko",
      "Risk Owner",
      "Inheren",
      "Target Residual",
      "Realisasi Residual",
    ];
    const start = 33;
    sheet.getRow(start - 1).values = header;

    sheet.getRow(start - 1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2b2a4c" },
      color: { argb: "FFFFFF" },
    };
    props.data_table.risk_matriks.map((m, i) => {
      const row = start + i;

      sheet.getRow(row).values = [
        i + 1,
        m.nama,
        m.risk_owner,
        m.skala_inheren,
        m.skala_target,
        m.skala_realisasi,
      ];

      if (m.id_tingkat_inheren) {
        sheet.getCell(`D${row}`).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: props.warna[m.id_tingkat_inheren].replace("#", "") },
        };
      }
      if (m.id_tingkat_target) {
        sheet.getCell(`E${row}`).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: props.warna[m.id_tingkat_target].replace("#", "") },
        };
      }
      if (m.id_tingkat_realisasi) {
        sheet.getCell(`F${row}`).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: props.warna[m.id_tingkat_realisasi].replace("#", ""),
          },
        };
      }
    });

    let start_x_banding = 9;
    header.map((m) => {
      const pos = `${angkaKeHuruf(start_x_banding)}${start - 1}`.toUpperCase();
      sheet.getCell(pos).value = m;
      start_x_banding += 1;
    });

    let start_y_banding = 33;
    props.data_table.risk_matriks_banding.map((m, i) => {
      let start_x_banding = 9;
      const row = start_y_banding;

      let pos = `${angkaKeHuruf(start_x_banding)}${row}`.toUpperCase();
      sheet.getCell(pos).value = i + 1;
      start_x_banding += 1;

      pos = `${angkaKeHuruf(start_x_banding)}${row}`.toUpperCase();
      sheet.getCell(pos).value = m.nama;
      start_x_banding += 1;

      pos = `${angkaKeHuruf(start_x_banding)}${row}`.toUpperCase();
      sheet.getCell(pos).value = m.risk_owner;
      start_x_banding += 1;

      pos = `${angkaKeHuruf(start_x_banding)}${row}`.toUpperCase();
      sheet.getCell(pos).value = m.skala_inheren;
      if (m.id_tingkat_inheren) {
        sheet.getCell(pos).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: props.warna[m.id_tingkat_inheren].replace("#", "") },
        };
      }
      start_x_banding += 1;

      pos = `${angkaKeHuruf(start_x_banding)}${row}`.toUpperCase();
      sheet.getCell(pos).value = m.skala_target;
      if (m.id_tingkat_target) {
        sheet.getCell(pos).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: props.warna[m.id_tingkat_target].replace("#", "") },
        };
      }
      start_x_banding += 1;

      pos = `${angkaKeHuruf(start_x_banding)}${row}`.toUpperCase();
      sheet.getCell(pos).value = m.skala_realisasi;
      if (m.id_tingkat_realisasi) {
        sheet.getCell(pos).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: props.warna[m.id_tingkat_realisasi].replace("#", ""),
          },
        };
      }
      start_x_banding += 1;

      start_y_banding += 1;
    });

    workbook.xls.writeBuffer().then(function (data) {
      const blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "download.xls";
      anchor.click();
      window.URL.revokeObjectURL(url);
    });
  };

  const handlepreview_progress_efektifitas = async () => {
    console.log("handlepreview_progress_efektifitas");
    // console.log('props.data')
    // console.log(props.data)
    // const body = props.data

    setbtn_loading(true);
    // // const response = await postapi_services({ setErrors, ...body, api_path: props.url })

    const nodematrix = document.getElementById("donat");
    let matriximg = "";
    matriximg = await handleHtmlToImage(nodematrix, "toPng");

    console.log("matriximg.img.outerHTML");
    console.log(matriximg);
    // if (!props.is_matrix) {
    //     await sleep(1000)
    // }

    if (iframeRef.current) {
      var iframedoc =
        iframeRef.current.contentDocument ||
        iframeRef.current.contentWindow.document;

      let htmlstr = "";

      // htmlstr += `<table style="margin-bottom:1000px;">`
      // htmlstr += `<thead>`
      // htmlstr += `<tr>`
      // htmlstr += `<th>`
      // htmlstr += matriximg.img.outerHTML
      // htmlstr += `</th>`
      // htmlstr += `</tr>`
      // htmlstr += `</thead>`
      // htmlstr += `</table>`

      htmlstr += matriximg.img.outerHTML;
      htmlstr += '<div style="height: 30px;"></div>';
      htmlstr += props.data;
      // console.log('XXXX')
      if (props.is_empty_table) {
        htmlstr += `<table class="w-full table table-auto border-collapse border">`;
        htmlstr += `<thead>`;
        htmlstr += `<tr>`;

        htmlstr += `<td class="border">No</td>`;
        {
          headers.map((v, i) => {
            htmlstr += `<th class="border text-center">
                    ${v.label}
                  </th>`;
          });
        }

        htmlstr += `</tr>`;
        htmlstr += `</thead>`;
        htmlstr += `<tbody>`;
        props.data_table.map((v, i) => {
          let tr = "";

          let collspan = null;
          if (v.progress && Object.keys(v.progress).length) {
            collspan = Object.keys(v.progress).length + 1;
          }

          let td_empty_progress = "";
          if (!collspan) {
            td_empty_progress = `
                        <td class="border"></td>
                       <td class="border"></td>
                       `;
          }

          tr += `
                    <tr>
                        <td class="border" rowspan="${collspan}">
                            ${i + 1}
                        </td>
                        <td class="border" rowspan="${collspan}">
                            ${v.nama}
                        </td>
                        <td class="border" rowspan="${collspan}">
                            ${v.nama_owner}
                        </td>
                        <td class="border" rowspan="${collspan}"></td>
                        <td class="border" rowspan="${collspan}">
                            ${v.efektifitas}
                        </td>
                      ${td_empty_progress}
                    </tr>
                    `;
          {
            v.progress &&
              Object.keys(v.progress).map((v_progres, i_progress) => {
                tr += `
                            <tr>
                            <td class="border">
                                ${v.progress[v_progres].nama_mitigasi}
                            </td>
                            <td class="border">
                                ${v.progress[v_progres].progress}
                            </td>
                        </tr>
                        `;
              });
          }

          htmlstr += tr;
        });
        htmlstr += `</tbody>`;
        htmlstr += `</table>`;
      }

      htmlstr += css;

      iframedoc.body.innerHTML = htmlstr;

      // console.log(iframedoc)
    }

    setbtn_loading(false);
  };
  const handlepreview_project_risk_level = async () => {
    console.log("handlepreview_project_risk_level");

    setbtn_loading(true);

    const nodeDashboardMobil1 = document.getElementById("dashboard-mobil1");
    let dashboardMobilPng1 = "";
    dashboardMobilPng1 = await handleHtmlToImage(nodeDashboardMobil1, "toPng");

    const nodeDashboardMobil2 = document.getElementById("dashboard-mobil2");
    let dashboardMobilPng2 = "";
    dashboardMobilPng2 = await handleHtmlToImage(nodeDashboardMobil2, "toPng");

    const nodeDashboardMobil3 = document.getElementById("dashboard-mobil3");
    let dashboardMobilPng3 = "";
    dashboardMobilPng3 = await handleHtmlToImage(nodeDashboardMobil3, "toPng");

    const headerProjectRiskLevel = document.getElementById(
      "headerProjectRiskLevel"
    );

    // console.log("matriximg.img.outerHTML");
    // console.log(matriximg);

    if (iframeRef.current) {
      var iframedoc =
        iframeRef.current.contentDocument ||
        iframeRef.current.contentWindow.document;

      let htmlstr = "";

      // table static dashboard

      // htmlstr += ` <table
      //   className="w-full table table-auto border-collapse border"
      //   id="table"
      // >
      //   <thead id="headerProjectRiskLevel">
      //     <tr>
      //       <th className="border" rowSpan={2}>
      //         Risk Criteria
      //       </th>
      //       <th className="border text-center" rowSpan={2}>
      //         Weight
      //       </th>
      //       <th className="border text-center" colSpan={3}>
      //       Inheren Risk
      //       </th>
      //       <th className="border text-center" colSpan={3}>
      //       Expected Risk
      //       </th>
      //       <th className="border text-center" colSpan={3}>
      //       Residual Risk
      //       </th>
      //     </tr>
      //     <tr>
      //       <th className="border text-center">Impact</th>
      //       <th className="border text-center">Probability</th>
      //       <th className="border text-center">Risk Level</th>
      //       <th className="border text-center">Impact</th>
      //       <th className="border text-center">Probability</th>
      //       <th className="border text-center">Risk Level</th>
      //       <th className="border text-center">Impact</th>
      //       <th className="border text-center">Probability</th>
      //       <th className="border text-center">Risk Level</th>
      //     </tr>
      //   </thead>
      //   <tbody>`;

      // console.log("===================");
      // console.log(props.data_table);
      // props.data_table.map((m, i) => {
      //   console.log(m);
      // });

      // props.data_table.map(
      //   (m, i) =>
      //     (htmlstr +=
      //       `
      //       <tr key={${i}}>
      //         <td className="border">{m.nama}</td>
      //         <td className="border text-center">{m.bobot} %</td>
      //         <td className="border text-center">
      //           {m.id_dampak_inheren ? m.id_dampak_inheren : ""}
      //         </td>
      //         <td className="border text-center">
      //           {m.id_kemungkinan_inheren ? m.id_kemungkinan_inheren : ""}
      //         </td>
      //         <td className="border text-center">
      //           ${m.risk_level_inheren ? m.risk_level_inheren : ""}
      //           ${
      //             props.is_bantuan
      //               ? m.risk_bobot_inheren
      //                 ? m.risk_bobot_inheren
      //                 : ""
      //               : ""
      //           }

      //           // sampai sini
      //         </td>
      //         <td className="border text-center">
      //           {m.id_dampak_target ? m.id_dampak_target : ""}
      //         </td>
      //         <td className="border text-center">
      //           {m.id_kemungkinan_target ? m.id_kemungkinan_target : ""}
      //         </td>
      //         <td className="border text-center">
      //           {m.risk_level_target ? m.risk_level_target : ""}
      //           {props.is_bantuan
      //             ? ` +
      //       `/${m.risk_bobot_target ? m.risk_bobot_target : ""}` +
      //       `
      //             : ""}
      //         </td>
      //         <td className="border text-center">
      //           {m.id_dampak_realisasi ? m.id_dampak_realisasi : ""}
      //         </td>
      //         <td className="border text-center">
      //           {m.id_kemungkinan_realisasi ? m.id_kemungkinan_realisasi : ""}
      //         </td>
      //         <td className="border text-center">
      //           {m.risk_level_realisasi ? m.risk_level_realisasi : ""}
      //           {props.is_bantuan
      //             ? ` +
      //       `/${m.risk_bobot_realisasi ? m.risk_bobot_realisasi : ""}` +
      //       `
      //             : ""}
      //         </td>
      //       </tr>
      //     `)
      // );
      //         ? ` + //       {props.is_bantuan //       {props.average_risk_level.inheren} //     <td className="border bold text-center"> //     <td className="border bold"></td> //     <td className="border bold"></td> //     <td className="border bold text-center">100%</td> //     <td className="border bold">Total (Average)</td> //   <tr>
      // `/${props.average_bobot.inheren ? props.average_bobot.inheren : ""}` +
      // `
      //         : ""}
      //     </td>
      //     <td className="border bold"></td>
      //     <td className="border bold"></td>
      //     <td className="border bold text-center">
      //       {props.average_risk_level.target}
      //       {props.is_bantuan
      //         ? ` +
      // `/${props.average_bobot.target ? props.average_bobot.target : ""}` +
      // `
      //         : ""}
      //     </td>
      //     <td className="border bold"></td>
      //     <td className="border bold"></td>
      //     <td className="border bold text-center">
      //       {props.average_risk_level.realisasi}
      //       {props.is_bantuan
      //         ? ` +
      // `/${
      //   props.average_bobot.realisasi ? props.average_bobot.realisasi : ""
      // }` +
      // `
      //         : ""}
      //     </td>
      //   </tr>
      //   <tr>
      //     <td className="border bold"></td>
      //     <td className="border bold text-center"></td>
      //     <td className="border bold"></td>
      //     <td className="border bold"></td>
      //     <td
      //       className="border bold text-center"
      //       style={{
      //         backgroundColor:
      //           props.average_bobot.inheren && props.warna
      //             ? props.warna[props.average_bobot.inheren]
      //             : "",
      //       }}
      //     >
      //       {props.is_bantuan ? ` +
      // `${props.average_bobot.inheren}/` +
      // ` : ""}
      //       {props.average_bobot.inheren && props.skala
      //         ? props.skala[props.average_bobot.inheren]
      //         : ""}
      //     </td>
      //     <td className="border bold"></td>
      //     <td className="border bold"></td>
      //     <td
      //       className="border bold text-center"
      //       style={{
      //         backgroundColor:
      //           props.average_bobot.target && props.warna
      //             ? props.warna[props.average_bobot.target]
      //             : "",
      //       }}
      //     >
      //       {props.is_bantuan ? ` +
      // `${props.average_bobot.target}/` +
      // ` : ""}
      //       {props.average_bobot.target && props.skala
      //         ? props.skala[props.average_bobot.target]
      //         : ""}
      //     </td>
      //     <td className="border bold"></td>
      //     <td className="border bold"></td>
      //     <td
      //       className="border bold text-center"
      //       style={{
      //         backgroundColor:
      //           props.average_bobot.realisasi && props.warna
      //             ? props.warna[props.average_bobot.realisasi]
      //             : "",
      //       }}
      //     >
      //       {props.is_bantuan ? ` +
      // `${props.average_bobot.realisasi}/` +
      // ` : ""}
      //       {props.average_bobot.realisasi && props.skala
      //         ? props.skala[props.average_bobot.realisasi]
      //         : ""}
      //     </td>
      //   </tr>
      //   <tr id="rowterakhir">
      //     <td className="border bold"></td>
      //     <td className="border bold text-center"></td>

      //     <td className="border bold " colSpan={3}>
      //       <div className="td-dashboard-mobil" id="dashboard-mobil1">
      //         <DashboardMobil {...props} jarum={jarum_inheren} />
      //       </div>
      //     </td>

      //     <td className="border bold" colSpan={3}>
      //       <div className="td-dashboard-mobil" id="dashboard-mobil2">
      //         <DashboardMobil {...props} jarum={jarum_target} />
      //       </div>
      //     </td>

      //     <td className="border bold" colSpan={3}>
      //       <div className="td-dashboard-mobil" id="dashboard-mobil3">
      //         <DashboardMobil {...props} jarum={jarum_realisasi} />
      //       </div>
      //     </td>
      //   </tr>
      // </tbody>
      // `</table>`;

      htmlstr += '<div style="height: 30px;"></div>';
      htmlstr += props.data;

      htmlstr +=
        '<table class=" mt-2 w-full table table-auto border-collapse border">';
      htmlstr += "<thead>";
      htmlstr += "<tr>";
      htmlstr += "<th class='border'>Inheren Risk</th>";
      htmlstr += "<th class='border'>Expected Risk</th>";
      htmlstr += "<th class='border'>Residual Risk</th>";
      htmlstr += "</tr>";
      htmlstr += "</thead>";
      htmlstr += "<tr>";
      htmlstr += "<td class='border'>";
      htmlstr += dashboardMobilPng1.img.outerHTML;
      htmlstr += "</td>";
      htmlstr += "<td class='border'>";
      htmlstr += dashboardMobilPng2.img.outerHTML;
      htmlstr += "</td>";
      htmlstr += "<td class='border'>";
      htmlstr += dashboardMobilPng3.img.outerHTML;
      htmlstr += "</td>";
      htmlstr += "</tr>";
      htmlstr += "</table>";

      htmlstr += css;

      iframedoc.body.innerHTML = htmlstr;
    }

    setbtn_loading(false);
  };

  const handleExportprogress_efektifitas = async () => {
    // console.log('props.data_table')
    // console.log(props.data_table)
    // return
    const nodematrix = document.getElementById("donat");
    let matriximg = await handleHtmlToImage(nodematrix, "toPng");

    let workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("My Sheet");

    const image = workbook.addImage({
      base64: matriximg.base64,
      extension: "png",
    });

    sheet.addImage(image, {
      tl: { col: 1, row: 1 },
      ext: { width: 1000, height: 500 },
    });

    const header = [
      "No",
      "Peristiwa Risiko",
      "Owner",
      "Penyebab",
      "Efektifitas",
      "Mitigasi",
      "Progress",
    ];
    const start = 33;
    sheet.getRow(start - 1).values = header;

    sheet.getRow(start - 1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2b2a4c" },
      color: { argb: "FFFFFF" },
    };

    let start_y = start;
    props.data_table.map((m, i) => {
      if (true) {
        console.log("INDEX=>" + i);
        let start_x = 1;

        let rowspan = null;
        if (m.progress && Object.keys(m.progress).length) {
          rowspan = Object.keys(m.progress).length - 1;
        }
        // console.log('rowspan')
        // console.log(rowspan)
        var pos = `${angkaKeHuruf(start_x)}${start_y}`.toUpperCase();
        sheet.getCell(pos).value = i + 1;
        var merged = `${angkaKeHuruf(start_x)}${start_y}:${angkaKeHuruf(
          start_x
        )}${start_y + rowspan}`.toUpperCase();
        console.log(merged);
        sheet.mergeCells(merged);
        start_x += 1;

        pos = `${angkaKeHuruf(start_x)}${start_y}`.toUpperCase();
        sheet.getCell(pos).value = m.nama;
        merged = `${angkaKeHuruf(start_x)}${start_y}:${angkaKeHuruf(start_x)}${
          start_y + rowspan
        }`.toUpperCase();
        console.log(merged);
        sheet.mergeCells(merged);
        start_x += 1;

        pos = `${angkaKeHuruf(start_x)}${start_y}`.toUpperCase();
        sheet.getCell(pos).value = m.nama_owner;
        merged = `${angkaKeHuruf(start_x)}${start_y}:${angkaKeHuruf(start_x)}${
          start_y + rowspan
        }`.toUpperCase();
        console.log(merged);
        sheet.mergeCells(merged);
        start_x += 1;

        pos = `${angkaKeHuruf(start_x)}${start_y}`.toUpperCase();
        sheet.getCell(pos).value = "";
        merged = `${angkaKeHuruf(start_x)}${start_y}:${angkaKeHuruf(start_x)}${
          start_y + rowspan
        }`.toUpperCase();
        console.log(merged);
        sheet.mergeCells(merged);
        start_x += 1;

        pos = `${angkaKeHuruf(start_x)}${start_y}`.toUpperCase();
        sheet.getCell(pos).value = m.efektifitas;
        merged = `${angkaKeHuruf(start_x)}${start_y}:${angkaKeHuruf(start_x)}${
          start_y + rowspan
        }`.toUpperCase();
        console.log(merged);
        sheet.mergeCells(merged);
        start_x += 1;

        if (!rowspan) {
          pos = `${angkaKeHuruf(start_x)}${start_y}`.toUpperCase();
          sheet.getCell(pos).value = "";
          start_x += 1;

          pos = `${angkaKeHuruf(start_x)}${start_y}`.toUpperCase();
          sheet.getCell(pos).value = "";
          start_x += 1;

          start_y += 1;
        }

        if (m.progress) {
          Object.keys(m.progress).map((v_progres, i_progress) => {
            if (start_x > 6) {
              start_x = 6;
            }
            // console.log('START X MITIGASI')
            // console.log(start_x)
            pos = `${angkaKeHuruf(start_x)}${start_y}`.toUpperCase();
            sheet.getCell(pos).value = m.progress[v_progres].nama_mitigasi;
            start_x += 1;

            pos = `${angkaKeHuruf(start_x)}${start_y}`.toUpperCase();
            sheet.getCell(pos).value = m.progress[v_progres].progress;
            start_x += 1;

            start_y += 1;
          });
        }
      }
    });

    workbook.xls.writeBuffer().then(function (data) {
      const blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "download.xls";
      anchor.click();
      window.URL.revokeObjectURL(url);
    });
  };
  const iframeRef = useRef();

  return (
    <div className="flex justify-end">
      <Modal
        show={props.show}
        className="modal-laporan"
        onShow={() => {
          if (props.top_risk) {
            handlepreview_top_risk();
          } else if (props.progress_efektifitas) {
            handlepreview_progress_efektifitas();
          } else if (props.project_risk_level) {
            handlepreview_project_risk_level();
          } else {
            handlepreview();
          }
        }}
        onHide={() => {
          props.onClose();
        }}
      >
        <Modal.Header closeButton={true}>
          {/* <button onClick={() => {
                    if (iframeRef.current) {
                        var iframedoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
                        // var sa = window.location = ('data:application/vnd.ms-excel,' + encodeURIComponent(iframedoc.body.innerHTML));
                        var tab_text = iframedoc.body.innerHTML;
                        var msie = window.navigator.userAgent.indexOf("MSIE ");

                        // If Internet Explorer
                        if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
                            txtArea1.document.open("txt/html", "replace");
                            txtArea1.document.write(tab_text);
                            txtArea1.document.close();
                            txtArea1.focus();

                            var sa = txtArea1.document.execCommand("SaveAs", true, "Say Thanks to Sumit.xls");
                        } else {
                            // other browser not tested on IE 11
                            var sa = window.location = ('data:application/vnd.ms-excel,' + encodeURIComponent(tab_text));
                        }
                    }
                }}>Export Excel</button> */}

          {props.is_matrix || props.is_grafik || props.progress_efektifitas ? (
            <button
              onClick={() => {
                if (props.top_risk) {
                  if (props.is_matrix) {
                    handleExportMatrixTopRisk();
                  } else {
                    handleExportMatrixTopRiskDetail();
                  }
                } else if (props.progress_efektifitas) {
                  handleExportprogress_efektifitas();
                } else if (props.project_risk_level) {
                  handleExportproject_risk_level();
                } else {
                  if (props.is_matrix) {
                    handleExportMatrix();
                  } else if (props.is_grafik) {
                    handleExportGrafik();
                  }
                }
              }}
              className="btn btn-success"
              type="button"
            >
              Export Excel
            </button>
          ) : (
            <>
              {iframeRef.current ? (
                <a
                  className="btn btn-success"
                  href={
                    "data:application/vnd.ms-excel," +
                    encodeURIComponent(
                      (
                        iframeRef.current.contentDocument ||
                        iframeRef.current.contentWindow.document
                      ).body.innerHTML
                    )
                  }
                  download={props.name + ".xls"}
                >
                  Export Excel
                </a>
              ) : null}
            </>
          )}

          {iframeRef.current ? (
            <button
              onClick={() => {
                var id = "export";
                const iframe = document.frames
                  ? document.frames[id]
                  : document.getElementById(id);
                const iframeWindow = iframe.contentWindow || iframe;

                iframe.focus();
                iframeWindow.print();
              }}
              className="ml-1 btn btn-primary"
              type="button"
            >
              Print
            </button>
          ) : null}

          {/* <button onClick={handleExport}>Tes</button> */}

          <h5 className="ml-1 mt-1">{props.name}</h5>
        </Modal.Header>
        <Modal.Body>
          <iframe title="a" ref={iframeRef} id="export"></iframe>
        </Modal.Body>
      </Modal>
    </div>
  );
};
