import React, { useState, useEffect } from 'react';
import { waliAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Edit, UserCircle, MessageCircle, Copy } from 'lucide-react';

const WaliSantri = () => {
  const [waliList, setWaliList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [waDialogOpen, setWaDialogOpen] = useState(false);
  const [selectedWali, setSelectedWali] = useState(null);
  const [waMessage, setWaMessage] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const waliRes = await waliAPI.getAll();
      setWaliList(waliRes.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (wali) => {
    setSelectedWali(wali);
    setFormData({
      username: wali.username,
      password: ''
    });
    setEditDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {};
      if (formData.username !== selectedWali.username) {
        submitData.username = formData.username;
      }
      if (formData.password) {
        submitData.password = formData.password;
      }

      if (Object.keys(submitData).length > 0) {
        await waliAPI.update(selectedWali.id, submitData);
        toast({ title: "Sukses", description: "Data wali berhasil diupdate" });
        setEditDialogOpen(false);
        loadData();
      } else {
        toast({ title: "Info", description: "Tidak ada perubahan" });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Gagal update data",
        variant: "destructive",
      });
    }
  };

  const handleWhatsApp = async (wali) => {
    try {
      const response = await waliAPI.getWhatsAppMessage(wali.id);
      setWaMessage(response.data);
      setSelectedWali(wali);
      setWaDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal generate pesan WhatsApp",
        variant: "destructive",
      });
    }
  };

  const copyMessage = () => {
    if (waMessage) {
      navigator.clipboard.writeText(waMessage.message);
      toast({ title: "Sukses", description: "Pesan berhasil dicopy" });
    }
  };

  const openWhatsApp = () => {
    if (waMessage) {
      window.open(waMessage.whatsapp_link, '_blank');
    }
  };

  if (loading) return <div className="flex justify-center p-8">Memuat data...</div>;

  return (
    <div data-testid="wali-page">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Kelola Wali Santri</h1>
        <p className="text-gray-600 mt-1">Data wali santri (otomatis dari data santri)</p>
        <p className="text-sm text-amber-600 mt-2">⚠️ Data wali tidak bisa dihapus. Untuk mengubah data, edit dari menu Santri.</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nomor HP</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Anak</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Anak</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {waliList.map((wali) => (
              <tr key={wali.id} data-testid={`wali-row-${wali.id}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <UserCircle className="mr-2 text-gray-400" size={20} />
                    <span className="text-sm font-medium text-gray-900">{wali.nama}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{wali.username}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{wali.nomor_hp}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{wali.email || '-'}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {wali.jumlah_anak} anak
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {wali.nama_anak.join(', ')}
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEdit(wali)} 
                      data-testid={`edit-wali-${wali.id}`}
                      title="Edit Username/Password"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="default" 
                      onClick={() => handleWhatsApp(wali)} 
                      data-testid={`wa-wali-${wali.id}`}
                      className="bg-green-600 hover:bg-green-700"
                      title="Kirim ke WhatsApp"
                    >
                      <MessageCircle size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {waliList.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Belum ada data wali santri. Tambahkan santri terlebih dahulu.
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Username & Password</DialogTitle>
          </DialogHeader>
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Wali:</strong> {selectedWali?.nama}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Username untuk login"
                required
                data-testid="wali-username-input"
              />
            </div>
            <div>
              <Label>Password Baru (Kosongkan jika tidak diubah)</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Password baru"
                data-testid="wali-password-input"
              />
            </div>
            <Button type="submit" className="w-full" data-testid="submit-wali-button">
              Update
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Dialog */}
      <Dialog open={waDialogOpen} onOpenChange={setWaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kirim Data ke WhatsApp - {selectedWali?.nama}</DialogTitle>
          </DialogHeader>
          {waMessage && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap font-mono">{waMessage.message}</pre>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={copyMessage} 
                  variant="outline" 
                  className="flex-1"
                  data-testid="copy-message-button"
                >
                  <Copy className="mr-2" size={16} />
                  Copy Pesan
                </Button>
                <Button 
                  onClick={openWhatsApp} 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  data-testid="open-whatsapp-button"
                >
                  <MessageCircle className="mr-2" size={16} />
                  Buka WhatsApp
                </Button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Nomor WhatsApp: {waMessage.nomor_whatsapp}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WaliSantri;
