import { useState } from 'react';

export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [uploadUrl, setUploadUrl] = useState('');
  const [status, setStatus] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Bitte zuerst eine Datei auswählen!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setStatus('Uploading...');

    try {
      const res = await fetch('http://localhost:5000/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload fehlgeschlagen');

      const data = await res.json();
      setUploadUrl(data.url);
      setStatus('Upload erfolgreich!');
    } catch (err) {
      setStatus('Fehler: ' + err.message);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto border rounded shadow">
      <h2 className="text-xl font-bold mb-4">Datei hochladen</h2>

      <input type="file" onChange={handleFileChange} />

      <button
        onClick={handleUpload}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Hochladen
      </button>

      <p className="mt-4">{status}</p>

      {uploadUrl && (
        <div className="mt-4">
          <p>Hochgeladene Datei:</p>
          <a href={uploadUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            {uploadUrl}
          </a>
        </div>
      )}
    </div>
  );
}
