import { Modal } from "react-bootstrap";
import React, { useState, useEffect, useRef } from "react";
import { checkNotAuthorized, initAccessMethod } from "pages/Utils";
import Button from "components/Button";
import { DownloadTableExcel } from "react-export-table-to-excel";
import { api_services } from "hooks/api_services";
import axios, { CancelToken } from "lib/axios";

const css = `
<style>
.table {
    font-size: 14px !important;
}
.border {
    border-width: 1px;
}
.border-collapse {
    border-collapse: collapse;
}
.table-auto {
    table-layout: auto;
}
.table {
    display: table;
}
.w-full {
    width: 100%;
}
.border {
    border: var(--bs-border-width) var(--bs-border-style) var(--bs-border-color) !important;
}

table.w-full.table.table-auto.border-collapse.border>thead>tr>th, table.w-full.table.table-auto.border-collapse.border>thead>tr>th>a, tr.datagrid-header-row:not(.datagrid-filter-row) {
    background-color: var(--primary);
    color: white;
    font-weight: 500;
    text-align: center;
    vertical-align: middle;
}

.table thead th {
    border-width: 0 1px 3px 0 !important;
}

.table> :not(caption)>*>* {
    padding: 0.3rem 0.2rem !important;
}

.color-black {
    color: #333 !important;
}

.bg-primary {
    background-color: #00adef !important;
}

.bg-danger {
    background-color: #ed1c25 !important;
}

.bg-success {
background-color: #02aa02 !important;
}

.bg-warning {
    background-color: #ffd369 !important;
}

.border {
    border: 1px solid black !important;
}

.bg-secondary-table {
    background-color: #a0a8b0 !important;
}

.text-uppercase {
    text-transform: uppercase !important;
}

.table-list-rcm tr>th {
    font-weight: bold !important;
}
</style>

`

export default ({ ...props }) => {

  const [content, setcontent] = useState("");
  const [show, setShow] = useState(false);
  const [btn_loading, setbtn_loading] = useState(false);

  const iframeRef = useRef(null);

  useEffect(() => {
    setShow(props.show)
  }, [props.show]);

  // const handlepreview = async () => {

  //   setbtn_loading(true);

  //   const response = await axios
  //     .get(
  //       "/api/" +
  //       props.url +
  //       "/print?" +
  //       new URLSearchParams(props.data).toString() +
  //       "&" +
  //       new Date().getTime() +
  //       Math.floor(Math.random() * 1000000)
  //     )
  //     .then((res) => {
  //       if (iframeRef.current) {
  //         var iframedoc =
  //           iframeRef.current.contentDocument ||
  //           iframeRef.current.contentWindow.document;
  //         iframedoc.body.innerHTML = res.data;
  //       }
  //       // console.log('respon data')
  //       // console.log(res.data)
  //       return res.data;
  //     })
  //     .catch((error) => {
  //       return error.response.data;
  //     });

  //   setbtn_loading(false);

  //   checkNotAuthorized(response);

  //   if (response.error) return;

  // };

  const handlepreview = async () => {
    if (iframeRef.current) {
      var iframedoc =iframeRef.current.contentDocument ||iframeRef.current.contentWindow.document;

      var html = ''
      html += props.data 
      html += css 
      iframedoc.body.innerHTML = html;

      setcontent(props.data)
    }

  };


  return (
    <div className="flex justify-end">
      <Modal
        show={show}
        className="modal-laporan"
        onShow={() => {
          handlepreview();
        }}
        onHide={() => {
          setcontent('')
          props.onHide()
        }}
      >
        <Modal.Header closeButton={true}>

          {iframeRef.current ? (
            <a
              className="btn btn-warning"
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

          {/* {iframeRef.current ? (
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
          ) : null} */}
          <h5 className="ml-2 mt-1 bold">{props.name}</h5>
        </Modal.Header>
        <Modal.Body>
          <iframe title="a" ref={iframeRef} id="export"></iframe>
        </Modal.Body>
      </Modal>

      {props.noButton ? null : (
        <Button
          className="btn-default-app"
          disabled={btn_loading}
          onClick={() => {
            // console.log(props)
            setShow(true);
          }}
        >
          {btn_loading ? (
            "Loading..."
          ) : (
            <>
              <span className="material-icons icon-btn-left mr-1">preview</span>
              Preview {props.name}
            </>
          )}
        </Button>
      )}

    </div>
  );
};
