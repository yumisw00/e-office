import React, { useEffect, useRef } from "react";
import BtnGroup from "./BtnGroup";
import Header from "pages/(app)/Header";
import Link from "components/Link";
import axios, { CancelToken } from "lib/axios";
import { Button } from "react-bootstrap";
import { go_logout } from "pages/Utils";

const HeaderApp = (props) => {
  const initialized = useRef(false);
  useEffect(() => {
    // console.log('HeaderApp')
    // console.log(props.data_btn)
    // console.log('sys_log');
    if (initialized.current != window.location.href) {
      initialized.current = window.location.href;
      axios
        .post("/api/sys_log", {
          page: window.location.href,
          activity: "Mengakses halaman " + props.title,
          action: "access",
        })
        .then((res) => {
          return res.data;
        })
        .catch((error) => {
          if (error.response && error.response.data && error.response.data.code) {
            go_logout()
          }
        });
    }
  }, []);

  return (
    <div className="container-header-app flex flex-row align-items-center justify-content-space-between">
      <div className="col">
        <div className="d-flex align-items-center gap-3">
          {!props.hideTitle && (
            <Header
              title={props.title}
              subtitle={props.subtitle ? props.subtitle : false}
              breadcrumbs={props.breadcrumbs}
            />
          )}
          {props.filterTabs ? (
            <div className="d-flex flex-wrap gap-2" role="tablist" aria-label="Filter tabs">
              {props.filterTabs}
            </div>
          ) : null}
        </div>
      </div>
      <div className="pr-4 flex justify-end">
        <div className="flex justify-center align-center">
          {props.is_loading ? (
            <div
              className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]"
              role="status"
            >
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                Loading...
              </span>
            </div>
          ) : null}
        </div>
        {/* {!props.is_page_unit ? (
          <>
            {props.btnExport ? props.btnExport : null}
            {props.btnImport ? props.btnImport : null}
          </>
        ) : null} */}
        {props.btnExport ? props.btnExport : null}
        {!props.is_page_unit ? (
          <>
            {props.btnImport ? props.btnImport : null}
          </>
        ) : null}
        {props.btn_nihil && (
          <button
            onClick={() => {
              props.is_nihil(true);
            }}
            className="btn-default-app"
          >
            Nihil
          </button>
        )}
        {props.btnCustom ? props.btnCustom : null}
        {props.leftControls ? <div className="mr-3 flex items-center">{props.leftControls}</div> : null}
        <BtnGroup
          btn_top
          data={props.data_btn}
          onDelete={props.onDelete ? props.onDelete : false}
          oncheck={props.oncheck ? props.oncheck : false}
          onAdd={props.onAdd ? props.onAdd : null}
        />
      </div>
    </div>
  );
};

export default HeaderApp;
