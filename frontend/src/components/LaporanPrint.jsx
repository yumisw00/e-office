import { Modal } from "react-bootstrap";
import React, {
  useState,
  useEffect,
  useRef,
  Component,
  createRef,
} from "react";
import {
  checkNotAuthorized,
  colorsPallette,
  initAccessMethod,
  urlPreviewNew,
} from "pages/Utils";
import Button from "components/Button";
import $ from 'jquery'


export default class LaporanPrint extends Component {
  constructor(props) {
    super(props);
    // inisialisasi state
    this.state = {
      trigger: 0,
    };
  }

  iframeRef = createRef();

  styleTable =
    "display:table; width:100%; border-collapse:collapse; border:1px solid #000;";
  styleTH =
    "padding: 10px; border:1px; color:#000; text-align:center; vertical-align:center; border:1px solid #000; font-family:Roboto, sans-serif;";
  styleTD =
    "padding: 10px; border:1px; color:#000; text-align:left; vertical-align:center; border:1px solid #000; font-family:Roboto, sans-serif;";
  styleListTH =
    "padding: 10px; color:#000; text-align:left; font-family:Roboto, sans-serif;";
  styleListTD =
    "padding: 10px; color:#000; text-align:left; font-family:Roboto, sans-serif;";

  initListHtml = (data, event) => {
    let html = "";
    html += `<thead >`;
    for (let m of data) {
      html += `<tr>`;
      html += `<th style="${this.styleListTH}">${m.label}</th>`;
      html += `<td style="${this.styleListTD}">${m?.value || ""}</td>`;
      html += `</tr>`;
    }
    html += "</thead>";
    return html;
  };

  initTheadHtml = (data, event, isNoNumber) => {
    let html = "";

    if (event && event == "rowcol") {
      return this.generateTableHeadHTMLString(data);
    }
    html += `<thead ><tr>`;
    html += `<th style="${this.styleTH}">No</th>`;
    for (let m of data) {
      html += `<th style="${this.styleTH}">${m.label}</th>`;
    }
    html += "</tr></thead>";
    return html;
  };

  initTbodyHtml = (data, event, isNoNumber) => {
    let html = "";
    html += `<tbody>`;

    let i = 0;
    for (let m of data) {
      html += "<tr>";
      html += `<td style="${this.styleTD}">${i + 1}</td>`;
      for (let x of this.props.data_print.head) {
        html += `<td style="${this.styleTD}">${m?.[x.name] || ""}</td>`;
      }
      html += "</tr>";

      i += 1;
    }
    html += "</tbody>";
    return html;
  };

  generateTableHeadHTMLString = (headData) => {
    let html = `<thead>`;

    headData.forEach((rowObj) => {
      html += "<tr>";

      rowObj.tr.forEach((cell) => {
        let th = `<th style="${this.styleTH}"`;

        if (cell.colspan) {
          th += ` colspan="${cell.colspan}"`;
        }
        if (cell.rowspan) {
          th += ` rowspan="${cell.rowspan}"`;
        }

        th += `>${cell.label}</th>`;
        html += th;
      });

      html += "</tr>";
    });

    html += "</thead>";
    return html;
  };

  handleShow = () => {
    const { data_print } = this.props;
    console.log("HADLESHOW=>");
    console.log(this.props);

    if (this.props.printFromBackend) {
      var html = data_print;
      var iframedoc =
        this.iframeRef.current.contentDocument ||
        this.iframeRef.current.contentWindow.document;
      iframedoc.body.innerHTML = html;
    } else {
      let html = "";
      if (
        data_print.event &&
        data_print.event == "review_konsep_laporan" &&
        this.iframeRef.current
      ) {
        html += '<table style="margin-bottom: 20px;">';
        html += this.initListHtml(data_print.datalist);
        html += "</table>";
      }

      html += `<table style="${this.styleTable}">`;
      if (this.iframeRef.current) {
        html += this.initTheadHtml(data_print.head, data_print?.event || null);
        html += this.initTbodyHtml(data_print.body);

        html += "</table>";

        var iframedoc =
          this.iframeRef.current.contentDocument ||
          this.iframeRef.current.contentWindow.document;
        iframedoc.body.innerHTML = html;
      }
    }

    this.setState((state) => ({
      trigger: state.trigger + 1,
    }));
  };



  render() {
    return (
      <Modal
        show={this.props.show}
        className="modal-laporan"
        onShow={this.handleShow}
        onHide={() => {
          this.props.onHide();
        }}
      >
        <Modal.Header closeButton={true}>
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

          {this.iframeRef.current ? (
            <a
              className="btn btn-warning ms-2"
              href={
                "data:application/vnd.ms-excel," +
                encodeURIComponent(
                  (
                    this.iframeRef.current.contentDocument ||
                    this.iframeRef.current.contentWindow.document
                  ).body.innerHTML
                )
              }
              download={this.props?.data_print?.title || (`${this.props.title_print || 'print'}`) + ".xls"}
            >
              Export Excel
            </a>
          ) : null}

          <h5 className="ml-2 mt-1 bold">
            {this.props?.data_print?.title || ""}
          </h5>
        </Modal.Header>
        <Modal.Body>
          <iframe title="a" ref={this.iframeRef} id="export"></iframe>
        </Modal.Body>
      </Modal>
    );
  }
}
