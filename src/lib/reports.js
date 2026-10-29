export const CATEGORIES = [
  'Menerobos lampu merah',
  'Parkir sembarangan',
  'Melawan arus',
  'Tidak menggunakan helm/sabuk pengaman',
  'Menggunakan ponsel saat berkendara',
  'Pelanggaran marka/rambu',
  'Kondisi lalu lintas berbahaya',
  'Lainnya'
];

export const STATUS = {
  pending: { label: 'Menunggu verifikasi', className: 'blue' },
  reviewing: { label: 'Sedang diverifikasi', className: 'purple' },
  revision: { label: 'Perlu perbaikan', className: 'orange' },
  rejected: { label: 'Ditolak', className: 'red' },
  forwarded: { label: 'Diteruskan', className: 'green' },
  in_progress: { label: 'Dalam tindak lanjut', className: 'teal' },
  completed: { label: 'Selesai', className: 'gray' }
};

export const formatDate = (value) => value
  ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '—';

export const shortId = (id) => id ? `LL-${id.slice(0, 8).toUpperCase()}` : '—';