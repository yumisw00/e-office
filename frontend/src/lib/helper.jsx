export function rupiah2(amount) {
  if (!amount) return;

  return new Intl.NumberFormat(["id"]).format(amount);
}

export function rupiah1(amount) {
  if (!amount) return;

  return new Intl.NumberFormat(["id"]).format(amount);
}

// export function rupiah(amount) {
//     if (amount > 1000000000000)
//         return rupiah1(Math.round(amount / 1000000000000)).toString() + ' T';
//     if (amount > 1000000000)
//         return rupiah1(Math.round(amount / 1000000000)).toString() + ' M';
//     if (amount > 1000000000000)
//         return rupiah1(Math.round(amount / 1000000)).toString() + ' Jt';

//     return rupiah1(amount);
// }

export function rupiah(amount) {
  //   if (amount > 1000000000000)
  //       return rupiah1(Math.round(amount / 1000000000000)).toString() + ' T';

  // if (amount > 1000000000)
  //   return (
  //     rupiah1(
  //       Math.round((amount / 1000000000 + Number.EPSILON) * 100) / 100
  //     ).toString() + " M"
  //   );
  // else if (amount < 10000000)
  //   return rupiah1(amount)
  // else
  //   return (
  //     (
  //       Math.round((amount / 1000000000 + Number.EPSILON) * 100) / 100
  //     ).toString() + " M"
  //   );

  //   if (amount > 1000000000000)
  //       return rupiah1(Math.round(amount / 1000000)).toString() + ' Jt';

  if (isNaN(amount)) {
    return "";
  } else {
    return rupiah1(amount);
  }
}

export function rupiah_satuan_miliar(amount) {
  if (isNaN(amount)) {
    return "";
  } else {
    return (((amount / 1000000000) * 100) / 100).toFixed(3).toString();
  }
  // return `${rupiah1(amount)}/${(((amount / 1000000000) * 100) / 100).toString()}`
}

// export function rupiah(amount) {
//     if (amount > 1000000000000)
//         return rupiah1(Math.round(amount / 1000000000000)).toString() + ' T';
//     if (amount > 1000000000)
//         return rupiah1(Math.round(amount / 1000000000)).toString() + ' M';
//     if (amount > 1000000000000)
//         return rupiah1(Math.round(amount / 1000000)).toString() + ' Jt';

//     return rupiah1(amount);
// }

export function nl2br(str, is_xhtml) {
  if (typeof str === "undefined" || str === null) {
    return "";
  }
  var breakTag =
    is_xhtml || typeof is_xhtml === "undefined" ? "<br />" : "<br>";
  return (str + "").replace(
    /([^>\r\n]?)(\r\n|\n\r|\r|\n)/g,
    "$1" + breakTag + "$2"
  );
}

export function combobulan() {
  return [
    { value: "01", label: "Januari" },
    { value: "02", label: "Februari" },
    { value: "03", label: "Maret" },
    { value: "04", label: "April" },
    { value: "05", label: "Mei" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "Agustus" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];
}

export function combobulanidx() {
  let data = {}
  combobulan().map(m => {
    data[m.value] = m.label
  })
  return data
}

export function combotriwulan() {
  return [
    { value: "1", label: "Triwulan 1" },
    { value: "2", label: "Triwulan 2" },
    { value: "3", label: "Triwulan 3" },
    { value: "4", label: "Triwulan 4" },
  ];
}

export function combojenis() {
  return [
    { value: "1", label: "Positif" },
    { value: "-1", label: "Negatif" },
  ];
}

export function combojenisidx() {
  let data = {}
  combojenis().map(m => {
    data[m.value] = m.label
  })
  return data
}
