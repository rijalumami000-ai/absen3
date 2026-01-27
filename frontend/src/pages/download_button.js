          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Menampilkan data: <strong>{tanggalStart}</strong> s/d <strong>{tanggalEnd}</strong>
            </div>
            {detailData && (
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <FileDown size={16} />
                Download PDF
              </Button>
            )}
          </div>
