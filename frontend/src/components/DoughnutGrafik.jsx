import { useState, useEffect, useRef } from 'react'
import { Chart, ArcElement } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(ArcElement);
Chart.register(ChartDataLabels);
Chart.defaults.set('plugins.datalabels', {
    color: '#000'
});

import { Doughnut, Bar } from 'react-chartjs-2'
import { labelBK1, labelBK2, labelBK3 } from 'pages/(app)/dashboard/page';

const DoughnutGrafik = props => {
    const [grafiks, setgrafiks] = useState({})

    const initialized = useRef(false)
    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true
        }
        if (true) {
            if (props.show) {
                initLabels()
            }

        }
    }, [props.data, props.show])

    const initLabels = () => {
        let labels_tingkat = {}
        let labels = {}
        let ids = {}

        if (!props.tingkat) return
        props.tingkat.map(m => {
            if (m.jenis == props.jenis) {
                labels_tingkat[m.nama] = {
                    label: m.nama,
                    color: '#333',
                    backgroundColor: m.warna,
                }
                labels[m.nama] = 0
                ids[m.id_tingkat] = m.nama
            }
        })

        // console.log('labels')
        // console.log(labels)
        // console.log('ids')
        // console.log(ids)

        initData({ labels, ids, labels_tingkat })
    }

    const initData = (params) => {
        let is_kelompok_bisnis_obj = true
        let namacolumnstr = ''
        let sebaran_risiko = {}
        props.data.map((m, i) => {
            is_kelompok_bisnis_obj = m.nama_kelompok_bisnis ? true : false
            if (is_kelompok_bisnis_obj) {
                namacolumnstr = 'nama_kelompok_bisnis'
            } else {
                namacolumnstr = 'nama_taksonomi'
            }
            if (!sebaran_risiko[m[namacolumnstr]]) {
                sebaran_risiko[m[namacolumnstr]] = {
                    total: 0,
                    risiko_awal: { ...params.labels },
                    rencana_mitigasi: { ...params.labels },
                    setelah_mitigasi: { ...params.labels }
                }
            }


            if (m.id_tingkat_inheren && params.ids[m.id_tingkat_inheren]) {
                sebaran_risiko[m[namacolumnstr]].risiko_awal[params.ids[m.id_tingkat_inheren]] += m.tot_tingkat_inheren
                sebaran_risiko[m[namacolumnstr]].total += m.tot_tingkat_inheren
            }
            if (m.id_tingkat_target && params.ids[m.id_tingkat_target]) {
                sebaran_risiko[m[namacolumnstr]].rencana_mitigasi[params.ids[m.id_tingkat_target]] += m.tot_tingkat_target
                sebaran_risiko[m[namacolumnstr]].total += m.tot_tingkat_target
            }
            if (m.id_tingkat_real && params.ids[m.id_tingkat_real]) {
                sebaran_risiko[m[namacolumnstr]].setelah_mitigasi[params.ids[m.id_tingkat_real]] += m.tot_tingkat_real
                sebaran_risiko[m[namacolumnstr]].total += m.tot_tingkat_real
            }


        })


        handleGrafik(params, sebaran_risiko)
    }

    const handleGrafik = (params, sebaran_risiko) => {
        // console.log('sebaran_risiko')
        // console.log(sebaran_risiko)
        // console.log(params)

        let labels = []
        let backgroundcolors = []

        Object.keys(params.labels_tingkat).map(m => {
            labels.push(m)
            backgroundcolors.push(params.labels_tingkat[m].backgroundColor)
        })

        const labels_data_inheren = { ...params.labels }
        const labels_data_target = { ...params.labels }
        const labels_data_real = { ...params.labels }

        // labels.map(m => {
        //     datagrafik.datasets[0].data.push(0)
        // })

        let inheren = {
            labels,
            datasets: [
                {
                    label: labelBK1,
                    data: [],
                    backgroundColor: backgroundcolors,
                    hoverOffset: 4,
                }
            ],
        }
        let target = {
            labels,
            datasets: [
                {
                    label: labelBK2,
                    data: [],
                    backgroundColor: backgroundcolors,
                    hoverOffset: 4,
                }
            ],
        }
        let real = {
            labels,
            datasets: [
                {
                    label: labelBK3,
                    data: [],
                    backgroundColor: backgroundcolors,
                    hoverOffset: 4,
                }
            ],
        }

        // console.log('datagrafik')
        // console.log(inheren)
        // console.log(target)
        // console.log(real)

        Object.keys(sebaran_risiko).map(x => {
            labels.map(z => {
                labels_data_inheren[z] += sebaran_risiko[x].risiko_awal[z]
                labels_data_target[z] += sebaran_risiko[x].rencana_mitigasi[z]
                labels_data_real[z] += sebaran_risiko[x].setelah_mitigasi[z]
            })
        })

        // console.log('inheren=>target=>real')
        // console.log(labels_data_inheren)
        // console.log(labels_data_target)
        // console.log(labels_data_real)

        Object.keys(labels_data_inheren).map(m => {
            inheren.datasets[0].data.push(labels_data_inheren[m])
        })
        Object.keys(labels_data_target).map(m => {
            target.datasets[0].data.push(labels_data_target[m])
        })
        Object.keys(labels_data_real).map(m => {
            real.datasets[0].data.push(labels_data_real[m])
        })

        const grafiks = { inheren, target, real }

        // console.log('grafiks')
        // console.log(grafiks)

        setgrafiks(grafiks)
    }

    return (
        <div className="row" id="doughnut_grafik">
            <div className="col-lg-4" style={{ paddingLeft: "5%", paddingRight: "5%" }}>
                <div className="relative">
                    {grafiks.inheren ? (
                        <Doughnut
                            options={props.options}
                            // options={{
                            //     ...props.options,
                            //     plugins: {
                            //         ...props.options.plugins,
                            //         legend: {
                            //             display: true
                            //         }
                            //     }
                            // }}
                            data={grafiks.inheren}
                        />
                    ) : null}
                    <div className="col-arrow"></div>
                </div>
                <div className="label-title text-center">{labelBK1}</div>
            </div>
            <div className="col-lg-4" style={{ paddingLeft: "5%", paddingRight: "5%" }}>
                <div className="relative">
                    {grafiks.target ? (
                        <Doughnut
                            options={props.options}
                            // options={{
                            //     ...props.options,
                            //     plugins: {
                            //         ...props.options.plugins,
                            //         legend: {
                            //             display: false
                            //         }
                            //     }
                            // }}
                            data={grafiks.target}
                        />
                    ) : null}
                    <div className="col-arrow"></div>
                </div>
                <div className="label-title text-center">{labelBK2}</div>
            </div>
            <div className="col-lg-4" style={{ paddingLeft: "5%", paddingRight: "5%" }}>
                {grafiks.real ? (
                    <Doughnut
                        options={props.options}
                        // options={{
                        //     ...props.options,
                        //     plugins: {
                        //         ...props.options.plugins,
                        //         legend: {
                        //             display: true
                        //         }
                        //     }
                        // }}
                        data={grafiks.real}
                    />
                ) : null}
                <div className="label-title text-center">
                    {labelBK3}
                </div>
            </div>
        </div>
    )
}

export default DoughnutGrafik