@api_router.get("/absensi/riwayat")
async def get_absensi_riwayat(
    tanggal_start: str,
    tanggal_end: Optional[str] = None,
    asrama_id: Optional[str] = None,
    gender: Optional[str] = None,
    _: dict = Depends(get_current_admin)
):
    """Get absensi riwayat for date range with summary and detail grouped by waktu sholat"""
    if not tanggal_end:
        tanggal_end = tanggal_start
    
    # Get all santri with filters
    santri_query = {}
    if asrama_id:
        santri_query['asrama_id'] = asrama_id
    if gender:
        santri_query['gender'] = gender
    
    all_santri = await db.santri.find(santri_query, {"_id": 0}).to_list(10000)
    santri_dict = {s['id']: s for s in all_santri}
    
    # Get absensi for the date range
    absensi_query = {"tanggal": {"$gte": tanggal_start, "$lte": tanggal_end}}
    absensi_list = await db.absensi.find(absensi_query, {"_id": 0}).to_list(10000)

    # Map pengabsen_id -> nama
    pengabsen_map = {
        p["id"]: p.get("nama", "-")
        for p in await db.pengabsen.find({}, {"_id": 0, "id": 1, "nama": 1}).to_list(1000)
    }
    
    # Organize by waktu sholat and status
    waktu_sholat_list = ["subuh", "dzuhur", "ashar", "maghrib", "isya"]
    status_list = ["hadir", "alfa", "sakit", "izin", "haid", "istihadhoh"]
    
    # Initialize summary
    summary = {
        "total_records": len(absensi_list),
        "by_waktu": {}
    }
    
    for waktu in waktu_sholat_list:
        summary["by_waktu"][waktu] = {}
        for st in status_list:
            summary["by_waktu"][waktu][st] = 0
    
    # Initialize detail structure
    detail = {}
    for waktu in waktu_sholat_list:
        detail[waktu] = {}
        for st in status_list:
            detail[waktu][st] = []
    
    # Process absensi data
    for a in absensi_list:
        waktu = a.get("waktu_sholat")
        status = a.get("status")
        santri_id = a.get("santri_id")
        
        if (waktu in waktu_sholat_list and 
            status in status_list and 
            santri_id in santri_dict):
            
            # Update summary
            summary["by_waktu"][waktu][status] += 1
            
            # Add to detail
            pengabsen_id = a.get("pengabsen_id")
            santri = santri_dict[santri_id]
            
            detail[waktu][status].append({
                "santri_id": santri_id,
                "nama": santri["nama"],
                "nis": santri["nis"],
                "asrama_id": santri["asrama_id"],
                "tanggal": a.get("tanggal"),
                "pengabsen_id": pengabsen_id,
                "pengabsen_nama": pengabsen_map.get(pengabsen_id, "-") if pengabsen_id else "-",
            })
    
    return {"summary": summary, "detail": detail}

