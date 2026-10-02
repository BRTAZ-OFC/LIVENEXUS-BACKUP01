import { useState, useEffect } from 'react';
import { Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { useNewUserDataCentral } from '@dashboard/configuracao/DataCentral_NewUserDataCentral';

export default function D1UserGalleryTestSection() {
  const { userId, galleryBranch } = useNewUserDataCentral();
  const [gallery, setGallery] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (userId) galleryBranch('GET').then(setGallery).catch(console.error);
  }, [userId, galleryBranch]);

  const loadGallery = async () => {
    setGallery(await galleryBranch('GET'));
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      await galleryBranch('POST', { payload: { action: 'upload', filename: file.name, fileData: event.target.result } });
      setUploading(false);
      loadGallery();
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (item) => {
    await galleryBranch('DELETE', { id: item.id });
    loadGallery();
  };

  if (!userId) return <div>Carregando usuário...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="bg-slate-900 p-4 rounded-xl">
        <h2 className="text-xl font-bold">Teste D1 → Central → Galeria</h2>
        <p>ID: {userId}</p>
        <p>Nome: {userId}</p>
        <p>JSON: <code className="text-emerald-400">/dashboard/Imagem/user_galleries/{userId}.json</code></p>
      </div>

      <input type="file" onChange={handleUpload} disabled={uploading} />
      {uploading && <Loader2 className="animate-spin" />}

      <div className="grid grid-cols-3 gap-4">
        {gallery.map(item => (
          <div key={item.id} className="border p-4 rounded-xl">
            <img src={item.url} alt="" className="w-full h-32 object-cover" />
            <div className="flex gap-2 mt-2">
              <a href={item.url} target="_blank" rel="noreferrer"><ExternalLink /></a>
              <button onClick={() => handleDelete(item)}><Trash2 className="text-rose-500" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
