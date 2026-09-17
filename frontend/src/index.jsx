import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Keep every application modal open until the user uses its explicit close action.
Modal.defaultProps = {
  ...Modal.defaultProps,
  backdrop: 'static',
  keyboard: false,
};

document.documentElement.lang = 'id'

document.addEventListener('invalid', event => {
  const field = event.target
  if (field?.validity?.valueMissing) {
    field.setCustomValidity('Harap isi kolom ini.')
  }
}, true)

document.addEventListener('input', event => {
  event.target?.setCustomValidity?.('')
})

const root = createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
reportWebVitals();

// HALAMAN BARU
// csa_tlc_ipe=CSA PLC IPE
// csa_elc_ipe=CSA ELC IPE
// csa_itgc_ipe=CSA ITGC IPE
// remediasi_tlc_pemutakhiran=Remediasi PLC Pemutakhiran
// remediasi_elc_pemutakhiran=Remediasi ELC Pemutakhiran
// remediasi_itgc_pemutakhiran=Remediasi ITGC Pemutakhiran
// remediasi_tlc_csa=Remediasi PLC CSA
// remediasi_elc_csa=Remediasi ELC CSA
// remediasi_itgc_csa=Remediasi ITGC CSA
// remediasi_tlc_ipe=Remediasi PLC IPE
// remediasi_elc_ipe=Remediasi ELC IPE
// remediasi_itgc_ipe=Remediasi ITGC IPE
// remediasi_tlc_leadsheet=Remediasi PLC Leadsheet
// remediasi_elc_leadsheet=Remediasi ELC Leadsheet
// remediasi_itgc_leadsheet=Remediasi ITGC Leadsheet
// mt_sumber_ipe_csa=Sumber IPE CSA
// mt_hasil_ipe_csa=Hasil IPE CSA

// const data = [
//   { nama: 'CSA PLC IPE', url: 'csa_tlc_ipe', is_show: null, id_parent_menu: '157' },
//   { nama: 'CSA ELC IPE', url: 'csa_elc_ipe', is_show: null, id_parent_menu: '160' },
//   { nama: 'CSA ITGC IPE', url: 'csa_itgc_ipe', is_show: null, id_parent_menu: '161' },

//   { nama: 'Remediasi PLC Pemutakhiran', url: 'remediasi_tlc_pemutakhiran', is_show: null, id_parent_menu: '182' },
//   { nama: 'Remediasi ELC Pemutakhiran', url: 'remediasi_elc_pemutakhiran', is_show: null, id_parent_menu: '183' },
//   { nama: 'Remediasi ITGC Pemutakhiran', url: 'remediasi_itgc_pemutakhiran', is_show: null, id_parent_menu: '184' },

//   { nama: 'Remediasi PLC CSA', url: 'remediasi_tlc_csa', is_show: null, id_parent_menu: '182' },
//   { nama: 'Remediasi ELC CSA', url: 'remediasi_elc_csa', is_show: null, id_parent_menu: '183' },
//   { nama: 'Remediasi ITGC CSA', url: 'remediasi_itgc_csa', is_show: null, id_parent_menu: '184' },

//   { nama: 'Remediasi PLC IPE', url: 'remediasi_tlc_ipe', is_show: null, id_parent_menu: '182' },
//   { nama: 'Remediasi ELC IPE', url: 'remediasi_elc_ipe', is_show: null, id_parent_menu: '183' },
//   { nama: 'Remediasi ITGC IPE', url: 'remediasi_itgc_ipe', is_show: null, id_parent_menu: '184' },

//   { nama: 'Remediasi PLC Leadsheet', url: 'remediasi_tlc_leadsheet', is_show: null, id_parent_menu: '182' },
//   { nama: 'Remediasi ELC Leadsheet', url: 'remediasi_elc_leadsheet', is_show: null, id_parent_menu: '183' },
//   { nama: 'Remediasi ITGC Leadsheet', url: 'remediasi_itgc_leadsheet', is_show: null, id_parent_menu: '184' },

//   { nama: 'Sumber IPE CSA', url: 'mt_sumber_ipe_csa', is_show: 1, id_parent_menu: '137' },
//   { nama: 'Hasil IPE CSA', url: 'mt_hasil_ipe_csa', is_show: 1, id_parent_menu: '137' },


//   { nama: 'TOO Remediasi PLC UTP', url: 'too_remediasi_tlc_utp', is_show: null, id_parent_menu: '331' },
//   { nama: 'TOO Remediasi PLC Inquiries', url: 'too_remediasi_tlc_inquiries', is_show: null, id_parent_menu: '331' },
//   { nama: 'TOO Remediasi PLC EUC', url: 'too_remediasi_tlc_euc', is_show: null, id_parent_menu: '331' },
//   { nama: 'TOO Remediasi PLC MRC IPE', url: 'too_remediasi_tlc_mrc_ipe', is_show: null, id_parent_menu: '331' },
//   { nama: 'TOO Remediasi PLC Evaluation', url: 'too_remediasi_tlc_evaluation', is_show: null, id_parent_menu: '331' },
//   { nama: 'TOO Remediasi PLC MoM', url: 'too_remediasi_tlc_mom', is_show: null, id_parent_menu: '331' },
//   { nama: 'TOO Remediasi PLC Agreed Fact', url: 'too_remediasi_tlc_agreed_fact', is_show: null, id_parent_menu: '331' },
//   { nama: 'TOO Remediasi PLC Leadsheet', url: 'too_remediasi_tlc_leadsheet', is_show: null, id_parent_menu: '331' },

//   { nama: 'TOO Remediasi ELC UTP', url: 'too_remediasi_elc_utp', is_show: null, id_parent_menu: '332' },
//   { nama: 'TOO Remediasi ELC Inquiries', url: 'too_remediasi_elc_inquiries', is_show: null, id_parent_menu: '332' },
//   { nama: 'TOO Remediasi ELC EUC', url: 'too_remediasi_elc_euc', is_show: null, id_parent_menu: '332' },
//   { nama: 'TOO Remediasi ELC MRC IPE', url: 'too_remediasi_elc_mrc_ipe', is_show: null, id_parent_menu: '332' },
//   { nama: 'TOO Remediasi ELC Evaluation', url: 'too_remediasi_elc_evaluation', is_show: null, id_parent_menu: '332' },
//   { nama: 'TOO Remediasi ELC MoM', url: 'too_remediasi_elc_mom', is_show: null, id_parent_menu: '332' },
//   { nama: 'TOO Remediasi ELC Agreed Fact', url: 'too_remediasi_elc_agreed_fact', is_show: null, id_parent_menu: '332' },
//   { nama: 'TOO Remediasi ELC Leadsheet', url: 'too_remediasi_elc_leadsheet', is_show: null, id_parent_menu: '332' },

//   { nama: 'TOO Remediasi ITGC UTP', url: 'too_remediasi_itgc_utp', is_show: null, id_parent_menu: '333' },
//   { nama: 'TOO Remediasi ITGC Inquiries', url: 'too_remediasi_itgc_inquiries', is_show: null, id_parent_menu: '333' },
//   { nama: 'TOO Remediasi ITGC EUC', url: 'too_remediasi_itgc_euc', is_show: null, id_parent_menu: '333' },
//   { nama: 'TOO Remediasi ITGC MRC IPE', url: 'too_remediasi_itgc_mrc_ipe', is_show: null, id_parent_menu: '333' },
//   { nama: 'TOO Remediasi ITGC Evaluation', url: 'too_remediasi_itgc_evaluation', is_show: null, id_parent_menu: '333' },
//   { nama: 'TOO Remediasi ITGC MoM', url: 'too_remediasi_itgc_mom', is_show: null, id_parent_menu: '333' },
//   { nama: 'TOO Remediasi ITGC Agreed Fact', url: 'too_remediasi_itgc_agreed_fact', is_show: null, id_parent_menu: '333' },
//   { nama: 'TOO Remediasi ITGC Leadsheet', url: 'too_remediasi_itgc_leadsheet', is_show: null, id_parent_menu: '333' },
// ]

// contoh too evaluation 1 halaman berat
// https://icofr.hutamakarya.com/too_tlc_utp/55
