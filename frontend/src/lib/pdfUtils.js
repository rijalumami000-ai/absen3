import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Function to download Pengabsen Sholat as PDF
export const downloadPengabsenPDF = (pengabsenList, asramaList) => {
  try {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Daftar Pengabsen Sholat', 14, 20);
    
    doc.setFontSize(11);
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);
    
    // Get asrama names helper
    const getAsramaNames = (asramaIds) => {
      if (!asramaIds || asramaIds.length === 0) return '-';
      return asramaIds
        .map(id => {
          const asrama = asramaList.find(a => a.id === id);
          return asrama ? asrama.nama : '';
        })
        .filter(name => name)
        .join(', ');
    };
    
    // Prepare table data
    const tableData = pengabsenList.map((p, index) => [
      index + 1,
      p.nama,
      p.username,
      p.kode_akses || '-',
      p.email_atau_hp || '-',
      getAsramaNames(p.asrama_ids)
    ]);
    
    // Generate table
    autoTable(doc, {
      startY: 35,
      head: [['No', 'Nama', 'Username', 'Kode Akses', 'Kontak', 'Asrama']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], fontStyle: 'bold' },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 10 },
        3: { cellWidth: 25 },
        5: { cellWidth: 35 }
      }
    });
    
    // Save PDF
    doc.save(`Pengabsen_Sholat_${new Date().getTime()}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Gagal membuat PDF: ' + error.message);
  }
};

// Function to download Pembimbing/Monitoring Sholat as PDF
export const downloadPembimbingPDF = (pembimbingList, asramaList) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Daftar Monitoring Sholat', 14, 20);
  
  doc.setFontSize(11);
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);
  
  const getAsramaNames = (asramaIds) => {
    if (!asramaIds || asramaIds.length === 0) return '-';
    return asramaIds
      .map(id => {
        const asrama = asramaList.find(a => a.id === id);
        return asrama ? asrama.nama : '';
      })
      .filter(name => name)
      .join(', ');
  };
  
  const tableData = pembimbingList.map((p, index) => [
    index + 1,
    p.nama,
    p.username,
    p.kode_akses || '-',
    p.email_atau_hp || '-',
    getAsramaNames(p.asrama_ids)
  ]);
  
  autoTable(doc, {
    startY: 35,
    head: [['No', 'Nama', 'Username', 'Kode Akses', 'Kontak', 'Asrama']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [22, 163, 74], fontStyle: 'bold' },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 10 },
      3: { cellWidth: 25 },
      5: { cellWidth: 35 }
    }
  });
  
  doc.save(`Monitoring_Sholat_${new Date().getTime()}.pdf`);
};

// Function to download Siswa Madin as PDF
export const downloadSiswaAliyahPDF = (siswaList, kelasList) => {
  const doc = new jsPDF('p', 'mm', 'a4');

  doc.setFontSize(16);
  doc.text('Daftar Siswa Madrasah Aliyah', 14, 18);

  doc.setFontSize(10);
  doc.text(`Total siswa: ${siswaList.length}`, 14, 24);

  const kelasMap = {};
  (kelasList || []).forEach((k) => {
    kelasMap[k.id] = k.nama;
  });

  const tableData = (siswaList || []).map((s, idx) => [
    idx + 1,
    s.nama || '-',
    s.nis || '-',
    s.gender || '-',
    s.kelas_nama || kelasMap[s.kelas_id] || '-',
  ]);

  autoTable(doc, {
    startY: 30,
    head: [['No', 'Nama', 'NIS', 'Gender', 'Kelas']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 60 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20 },
      4: { cellWidth: 40 },
    },
  });

  doc.save(`Daftar_Siswa_Aliyah_${new Date().getTime()}.pdf`);
};

export const downloadSiswaMadinPDF = (siswaList, kelasList) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Daftar Siswa Madrasah Diniyah', 14, 20);
  
  doc.setFontSize(11);
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);
  
  const getKelasName = (kelasId) => {
    if (!kelasId) return '-';
    const kelas = kelasList.find(k => k.id === kelasId);
    return kelas ? kelas.nama : '-';
  };
  
  const tableData = siswaList.map((s, index) => [
    index + 1,
    s.nama,
    s.nis,
    s.gender === 'putra' ? 'Putra' : 'Putri',
    getKelasName(s.kelas_id),
    s.santri_id ? 'Ya' : 'Tidak'
  ]);
  
  autoTable(doc, {
    startY: 35,
    head: [['No', 'Nama', 'NIS', 'Gender', 'Kelas', 'Linked']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], fontStyle: 'bold' },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 10 },
      3: { cellWidth: 20 },
      5: { cellWidth: 20 }
    }
  });
  
  doc.save(`Siswa_Madin_${new Date().getTime()}.pdf`);
};

// Function to download Siswa PMQ as PDF
export const downloadSiswaPMQPDF = (siswaList) => {
  const doc = new jsPDF('p', 'mm', 'a4');

  doc.setFontSize(16);
  doc.text('Daftar Siswa PMQ', 14, 18);

  doc.setFontSize(10);
  doc.text(`Total siswa: ${siswaList.length}`, 14, 24);

  const tableData = (siswaList || []).map((s, idx) => [
    idx + 1,
    s.nama || '-',
    s.gender === 'putra' ? 'Putra' : s.gender === 'putri' ? 'Putri' : '-',
    s.tingkatan_label || '-',
    s.kelompok_nama || '-',
    s.santri_id ? 'Link Santri' : 'Manual',
  ]);

  autoTable(doc, {
    startY: 30,
    head: [['No', 'Nama', 'Gender', 'Tingkatan', 'Kelompok', 'Tipe']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 55 },
      2: { cellWidth: 20 },
      3: { cellWidth: 35 },
      4: { cellWidth: 35 },
      5: { cellWidth: 25 },
    },
  });

  doc.save(`Daftar_Siswa_PMQ_${new Date().getTime()}.pdf`);
};

// Function to download Pengabsen Kelas Madin as PDF
export const downloadPengabsenKelasPDF = (pengabsenList, kelasList) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Daftar Pengabsen Kelas Aliyah', 14, 20);
  
  doc.setFontSize(11);
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);
  
  const getKelasNames = (kelasIds) => {
    if (!kelasIds || kelasIds.length === 0) return '-';
    return kelasIds
      .map(id => {
        const kelas = kelasList.find(k => k.id === id);
        return kelas ? kelas.nama : '';
      })
      .filter(name => name)
      .join(', ');
  };
  
  const tableData = pengabsenList.map((p, index) => [
    index + 1,
    p.nama,
    p.username,
    p.kode_akses || '-',
    getKelasNames(p.kelas_ids)
  ]);
  
  autoTable(doc, {
    startY: 35,
    head: [['No', 'Nama', 'Username', 'Kode Akses', 'Kelas']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], fontStyle: 'bold' },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 10 },
      3: { cellWidth: 25 }
    }
  });
  
  doc.save(`Pengabsen_Kelas_Aliyah_${new Date().getTime()}.pdf`);
};

// Function to download Pengabsen PMQ as PDF
export const downloadPengabsenPMQPDF = (pengabsenList, tingkatanList, kelompokList) => {
  const doc = new jsPDF('p', 'mm', 'a4');

  doc.setFontSize(16);
  doc.text('Daftar Pengabsen PMQ', 14, 18);

  doc.setFontSize(10);
  doc.text(`Total pengabsen: ${pengabsenList.length}`, 14, 24);

  const tingkatanMap = {};
  (tingkatanList || []).forEach((t) => {
    tingkatanMap[t.key] = t.label;
  });

  const kelompokMap = {};
  (kelompokList || []).forEach((k) => {
    kelompokMap[k.id] = `${k.nama} (${tingkatanMap[k.tingkatan_key] || k.tingkatan_key})`;
  });

  const formatTingkatan = (keys) => {
    if (!keys || !keys.length) return '-';
    return keys
      .map((k) => tingkatanMap[k] || k)
      .join(', ');
  };

  const formatKelompok = (ids) => {
    if (!ids || !ids.length) return '-';
    return ids
      .map((id) => kelompokMap[id])
      .filter(Boolean)
      .join(', ');
  };

  const tableData = (pengabsenList || []).map((p, idx) => [
    idx + 1,
    p.nama || '-',
    p.username || '-',
    p.kode_akses || '-',
    p.email_atau_hp || '-',
    formatTingkatan(p.tingkatan_keys),
    formatKelompok(p.kelompok_ids),
  ]);

  autoTable(doc, {
    startY: 30,
    head: [['No', 'Nama', 'Username', 'Kode Akses', 'Kontak', 'Tingkatan', 'Kelompok']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [22, 163, 74], fontStyle: 'bold' },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 35 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25 },
      4: { cellWidth: 30 },
      5: { cellWidth: 30 },
      6: { cellWidth: 40 },
    },
  });

  doc.save(`Daftar_Pengabsen_PMQ_${new Date().getTime()}.pdf`);
};

// Function to download Monitoring Kelas Madin as PDF
export const downloadMonitoringKelasPDF = (monitoringList, kelasList) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Daftar Monitoring Kelas Aliyah', 14, 20);
  
  doc.setFontSize(11);
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);
  
  const getKelasNames = (kelasIds) => {
    if (!kelasIds || kelasIds.length === 0) return '-';
    return kelasIds
      .map(id => {
        const kelas = kelasList.find(k => k.id === id);
        return kelas ? kelas.nama : '';
      })
      .filter(name => name)
      .join(', ');
  };
  
  const tableData = monitoringList.map((m, index) => [
    index + 1,
    m.nama,
    m.username,
    m.kode_akses || '-',
    getKelasNames(m.kelas_ids)
  ]);
  
  autoTable(doc, {
    startY: 35,
    head: [['No', 'Nama', 'Username', 'Kode Akses', 'Kelas']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [22, 163, 74], fontStyle: 'bold' },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 10 },
      3: { cellWidth: 25 }
    }
  });
  
  doc.save(`Monitoring_Kelas_Aliyah_${new Date().getTime()}.pdf`);
};

// Function to download Riwayat Absensi Aliyah as PDF
export const downloadRiwayatAbsensiAliyahPDF = (detail, filters) => {
  const doc = new jsPDF('p', 'mm', 'a4');

  doc.setFontSize(16);
  doc.text('Riwayat Absensi Madrasah Aliyah', 14, 18);

  doc.setFontSize(10);
  const periodeText = filters.periodeLabel || '';
  const tanggalText = `Periode: ${filters.tanggalStart} s.d. ${filters.tanggalEnd}`;
  const kelasText = filters.kelasLabel ? `Kelas: ${filters.kelasLabel}` : 'Kelas: Semua';
  const genderText = filters.genderLabel ? `Gender: ${filters.genderLabel}` : 'Gender: Semua';

  doc.text(periodeText, 14, 26);
  doc.text(tanggalText, 14, 31);
  doc.text(kelasText, 14, 36);
  doc.text(genderText, 14, 41);

  const tableData = detail.map((row, index) => [
    index + 1,
    row.tanggal || '-',
    row.siswa_nama || '-',
    row.kelas_nama || '-',
    row.gender || '-',
    row.status || '-',
    row.waktu_absen
      ? new Date(row.waktu_absen).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : '-',
  ]);

  autoTable(doc, {
    startY: 46,
    head: [['No', 'Tanggal', 'Nama Siswa', 'Kelas', 'Gender', 'Status', 'Waktu Absen']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], fontStyle: 'bold' },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 20 },
      2: { cellWidth: 45 },
      3: { cellWidth: 30 },
      4: { cellWidth: 20 },
      5: { cellWidth: 18 },
      6: { cellWidth: 25 },
    },
  });

  doc.save(`Riwayat_Absensi_Aliyah_${new Date().getTime()}.pdf`);
};

// Function to download Riwayat Absensi PMQ as PDF
export const downloadRiwayatAbsensiPMQPDF = (detail, filters) => {
  const doc = new jsPDF('p', 'mm', 'a4');

  doc.setFontSize(16);
  doc.text('Riwayat Absensi PMQ', 14, 18);

  doc.setFontSize(10);
  const periodeText = filters.periodeLabel || '';
  const tanggalText = `Periode: ${filters.tanggalStart} s.d. ${filters.tanggalEnd}`;
  const tingkatanText = filters.tingkatanLabel ? `Tingkatan: ${filters.tingkatanLabel}` : 'Tingkatan: Semua';
  const kelompokText = filters.kelompokLabel ? `Kelompok: ${filters.kelompokLabel}` : 'Kelompok: Semua';

  doc.text(periodeText, 14, 26);
  doc.text(tanggalText, 14, 31);
  doc.text(tingkatanText, 14, 36);
  doc.text(kelompokText, 14, 41);

  const tableData = detail.map((row, index) => [
    index + 1,
    row.tanggal || '-',
    row.sesi || '-',
    row.siswa_nama || '-',
    row.tingkatan_label || '-',
    row.kelompok_nama || '-',
    row.status || '-',
    row.waktu_absen
      ? new Date(row.waktu_absen).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : '-',
  ]);

  autoTable(doc, {
    startY: 46,
    head: [['No', 'Tanggal', 'Sesi', 'Nama Siswa', 'Tingkatan', 'Kelompok', 'Status', 'Waktu Absen']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [5, 150, 105], fontStyle: 'bold' },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 20 },
      2: { cellWidth: 18 },
      3: { cellWidth: 40 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
      6: { cellWidth: 18 },
      7: { cellWidth: 20 },
    },
  });

  doc.save(`Riwayat_Absensi_PMQ_${new Date().getTime()}.pdf`);
};

// Function to download Riwayat Absensi Madin as PDF
export const downloadRiwayatAbsensiMadinPDF = (detail, filters) => {
  const doc = new jsPDF('p', 'mm', 'a4');

  doc.setFontSize(16);
  doc.text('Riwayat Absensi Madrasah Diniyah', 14, 18);

  doc.setFontSize(10);
  const periodeText = filters.periodeLabel || '';
  const tanggalText = `Periode: ${filters.tanggalStart} s.d. ${filters.tanggalEnd}`;
  const kelasText = filters.kelasLabel ? `Kelas: ${filters.kelasLabel}` : 'Kelas: Semua';
  const genderText = filters.genderLabel ? `Gender: ${filters.genderLabel}` : 'Gender: Semua';

  doc.text(periodeText, 14, 26);
  doc.text(tanggalText, 14, 31);
  doc.text(kelasText, 14, 36);
  doc.text(genderText, 14, 41);

  const tableData = detail.map((row, index) => [
    index + 1,
    row.tanggal || '-',
    row.siswa_nama || '-',
    row.kelas_nama || '-',
    row.gender || '-',
    row.status || '-',
    row.waktu_absen
      ? new Date(row.waktu_absen).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : '-',
  ]);

  autoTable(doc, {
    startY: 46,
    head: [['No', 'Tanggal', 'Nama Siswa', 'Kelas', 'Gender', 'Status', 'Waktu Absen']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [4, 120, 87], fontStyle: 'bold' },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 20 },
      2: { cellWidth: 45 },
      3: { cellWidth: 30 },
      4: { cellWidth: 20 },
      5: { cellWidth: 18 },
      6: { cellWidth: 25 },
    },
  });

  doc.save(`Riwayat_Absensi_Madin_${new Date().getTime()}.pdf`);
};

// Function to download Riwayat Absensi Sholat as PDF
export const downloadRiwayatAbsensiSholatPDF = (detailData, filters) => {
  const doc = new jsPDF('p', 'mm', 'a4');

  doc.setFontSize(16);
  doc.text('Riwayat Absensi Sholat', 14, 18);

  doc.setFontSize(10);
  const periodeText = filters.periodeLabel || '';
  const tanggalText = `Periode: ${filters.tanggalStart} s.d. ${filters.tanggalEnd}`;
  const asramaText = filters.asramaLabel ? `Asrama: ${filters.asramaLabel}` : 'Asrama: Semua';
  const genderText = filters.genderLabel ? `Gender: ${filters.genderLabel}` : 'Gender: Semua';

  doc.text(periodeText, 14, 26);
  doc.text(tanggalText, 14, 31);
  doc.text(asramaText, 14, 36);
  doc.text(genderText, 14, 41);

  // Flatten the grouped data into table rows
  const tableData = [];
  const waktuSholatList = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];
  const statusList = ['hadir', 'alfa', 'sakit', 'izin', 'haid', 'istihadhoh'];

  waktuSholatList.forEach(waktu => {
    statusList.forEach(status => {
      const santriList = detailData[waktu]?.[status] || [];
      santriList.forEach((santri, index) => {
        tableData.push([
          tableData.length + 1,
          santri.tanggal || '-',
          waktu.charAt(0).toUpperCase() + waktu.slice(1),
          santri.nama || '-',
          santri.nis || '-',
          santri.asrama_id || '-',
          status.charAt(0).toUpperCase() + status.slice(1),
          santri.pengabsen_nama || '-',
        ]);
      });
    });
  });

  autoTable(doc, {
    startY: 46,
    head: [['No', 'Tanggal', 'Waktu Sholat', 'Nama Santri', 'NIS', 'Asrama', 'Status', 'Pengabsen']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], fontStyle: 'bold' },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 20 },
      2: { cellWidth: 22 },
      3: { cellWidth: 40 },
      4: { cellWidth: 18 },
      5: { cellWidth: 20 },
      6: { cellWidth: 18 },
      7: { cellWidth: 30 },
    },
  });

  doc.save(`Riwayat_Absensi_Sholat_${new Date().getTime()}.pdf`);
};
