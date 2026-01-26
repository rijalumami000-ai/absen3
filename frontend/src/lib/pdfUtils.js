import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Function to download Pengabsen Sholat as PDF
export const downloadPengabsenPDF = (pengabsenList, asramaList) => {
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
  
  doc.autoTable({
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
  
  doc.autoTable({
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

// Function to download Pengabsen Kelas Madin as PDF
export const downloadPengabsenKelasPDF = (pengabsenList, kelasList) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Daftar Pengabsen Kelas Madin', 14, 20);
  
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
  
  doc.autoTable({
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
  
  doc.save(`Pengabsen_Kelas_Madin_${new Date().getTime()}.pdf`);
};

// Function to download Monitoring Kelas Madin as PDF
export const downloadMonitoringKelasPDF = (monitoringList, kelasList) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Daftar Monitoring Kelas Madin', 14, 20);
  
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
  
  doc.autoTable({
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
  
  doc.save(`Monitoring_Kelas_Madin_${new Date().getTime()}.pdf`);
};
