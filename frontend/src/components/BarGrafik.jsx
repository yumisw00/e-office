import { useState, useEffect, useRef } from 'react'
import { Chart, ArcElement } from 'chart.js'
Chart.register(ArcElement);
import { Doughnut, Bar } from 'react-chartjs-2'

const fake_labels = [
    'Rendah',
    'Moderat',
    'Moderat to High',
    'Tinggi',
    'Ekstrem',
]
const fake_background_color = [
    '#00a707',
    '#99ec25',
    '#ffeb00',
    '#ff9f00',
    '#ff001f',
]

const fake_grafik_tingkat_risiko = {
    bk1: {
        labels: fake_labels,
        datasets: [
            {
                label: 'My First Dataset',
                data: [300, 50, 100, 20, 5],
                backgroundColor: fake_background_color,
                hoverOffset: 4,
            },
        ],
    },
    bk2: {
        labels: fake_labels,
        datasets: [
            {
                label: 'My First Dataset',
                data: [240, 110, 60, 15, 12],
                backgroundColor: fake_background_color,
                hoverOffset: 4,
            },
        ],
    },
    bk3: {
        labels: fake_labels,
        datasets: [
            {
                label: 'My First Dataset',
                data: [200, 80, 70, 40, 8],
                backgroundColor: fake_background_color,
                hoverOffset: 4,
            },
        ],
    },
}

const BarGrafik = props => {
    const [bar_tingkat_risiko, setbar_tingkat_risiko] = useState({
        labels: [],
        datasets: [],
    })

    const initialized = useRef(false)
    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true
        }
        if (true) {
            if (props.data.length > 0 && props.show) {
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
                    label: 'Inheren',
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
                    label: 'Target Residual',
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
                    label: 'Realisasi Residual',
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

        initBarGrafik(grafiks)
    }

    const initBarGrafik = (grafiks) => {
        // console.log('initBarGrafik')
        // console.log(grafiks)
        const grafik_tingkat = grafiks

        let bar_tingkat_risiko_obj = {}
        bar_tingkat_risiko_obj.datasets = [];
        bar_tingkat_risiko_obj.labels = grafik_tingkat.inheren.labels
        bar_tingkat_risiko_obj.datasets.push(
            grafik_tingkat.inheren.datasets[0],
        )
        bar_tingkat_risiko_obj.datasets.push(
            grafik_tingkat.target.datasets[0],
        )
        bar_tingkat_risiko_obj.datasets.push(
            grafik_tingkat.real.datasets[0],
        )

        // console.log('bar_tingkat_risiko_obj')
        // console.log(bar_tingkat_risiko_obj)

        setbar_tingkat_risiko(bar_tingkat_risiko_obj)
    }

    return (
        <div className="row" id='bar_grafik'>
            <div className="col-lg-12">
                {bar_tingkat_risiko.labels.length > 0 ? (
                    <Bar data={bar_tingkat_risiko} options={props.options} height={70} />
                ) : null}
            </div>
        </div>
    )
}

export default BarGrafik