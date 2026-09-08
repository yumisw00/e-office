import { Chart, ArcElement } from "chart.js";
Chart.register(ArcElement);
import ChartDataLabels from "chartjs-plugin-datalabels";
Chart.register(ChartDataLabels);

Chart.defaults.set("plugins.datalabels", {
  color: "#000",
});

import { Doughnut } from "react-chartjs-2";
import { colorsPallette } from "pages/Utils";
import BtnIcon from "./BtnIcon";

const DoughnutProgress = (props) => {
  return (
    <div className="col-lg-12">
      <div className="card">
        <div className="bg-danger card-header d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center flex-1">
            <div className="card-header-title">Grafik Pengendalian Risiko</div>
          </div>
          {props.onDownload ? (
            <BtnIcon
              icon={"download"}
              onTap={props.onDownload}
              size={30}
              color={"white"}
              tooltips={`Download`}
            />
          ) : null}
        </div>
        <div className="card-body">
          <div className="row justify-content-center" id="donat">
            <div
              className="col-lg-4"
              style={{ paddingLeft: "5%", paddingRight: "5%" }}
            >
              {/* {props.jumlah_efektif && props.jumlah_tidak_efektif ? (
                <Doughnut
                  options={props.options}
                  data={{
                    labels: ["Efektif", "Tidak Efektif"],
                    datasets: [
                      {
                        label: "Grafik Pengendalian",
                        data: [
                          props.jumlah_efektif,
                          props.jumlah_tidak_efektif,
                        ],
                        backgroundColor: [
                          colorsPallette.success,
                          colorsPallette.danger,
                        ],
                        hoverOffset: 4,
                      },
                    ],
                  }}
                />
              ) : (
                " "
              )} */}
              <Doughnut
                options={props.options}
                data={{
                  labels: ["Efektif", "Tidak Efektif"],
                  datasets: [
                    {
                      label: "Grafik Pengendalian",
                      data: [
                        props.jumlah_efektif,
                        props.jumlah_tidak_efektif,
                      ],
                      backgroundColor: [
                        colorsPallette.success,
                        colorsPallette.danger,
                      ],
                      hoverOffset: 4,
                    },
                  ],
                }}
              />

              <div className="label-title text-center">
                Efektifitas Pengendalian Risiko
              </div>
            </div>
            <div
              className="col-lg-4"
              style={{ paddingLeft: "5%", paddingRight: "5%" }}
            >
              <div className="relative">
                <div className="absolute-center">
                  <div
                    className="label-count-progress"
                    style={{
                      color: colorsPallette.info,
                    }}
                  >
                    {!isNaN(props.rata_rata_progress) &&
                      props.rata_rata_progress}
                  </div>
                </div>
                {/* {props.jumlah_efektif && props.jumlah_tidak_efektif ? (
                  <Doughnut
                    options={props.options}
                    data={{
                      labels: ["Progress", ""],
                      datasets: [
                        {
                          label: "Progress Pengendalian",
                          data: [
                            props.rata_rata_progress,
                            100 - props.rata_rata_progress,
                          ],
                          backgroundColor: [colorsPallette.info, "#ddd"],
                          hoverOffset: 4,
                        },
                      ],
                    }}
                  />
                ) : (
                  ""
                )} */}
                <Doughnut
                  options={props.options}
                  data={{
                    labels: ["Progress", ""],
                    datasets: [
                      {
                        label: "Progress Pengendalian",
                        data: [
                          props.rata_rata_progress,
                          100 - props.rata_rata_progress,
                        ],
                        backgroundColor: [colorsPallette.info, "#ddd"],
                        hoverOffset: 4,
                      },
                    ],
                  }}
                />

              </div>
              <div className="label-title text-center">
                Progress Pengendalian Lanjutan
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoughnutProgress;
