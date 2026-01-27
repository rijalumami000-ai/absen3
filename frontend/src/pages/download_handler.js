
  const handleDownloadPDF = () => {
    if (!detailData) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data untuk diunduh",
        variant: "destructive",
      });
      return;
    }

    const filters = {
      periodeLabel: getPeriodeLabel(),
      tanggalStart,
      tanggalEnd,
      asramaLabel: filterAsrama ? asramaList.find(a => a.id === filterAsrama)?.nama : null,
      genderLabel: filterGender ? (filterGender === 'putra' ? 'Putra' : 'Putri') : null,
    };

    try {
      downloadRiwayatAbsensiSholatPDF(detailData, filters);
      toast({
        title: "Berhasil",
        description: "File PDF berhasil diunduh",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Gagal",
        description: "Gagal mengunduh file PDF",
        variant: "destructive",
      });
    }
  };
