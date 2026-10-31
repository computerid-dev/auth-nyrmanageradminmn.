MUCHINEKO Auth Manager

DEPLOY (Vercel, domain: auth-nyrmanageradminmn.vercel.app)
1. Unggah project ini ke Vercel (nama project dibuat sama dengan subdomain di atas).
2. Settings > Environment Variables: isi semua pasangan Key dan Value dari env-setup.txt.
3. Redeploy setelah environment variable tersimpan.
4. Firebase Authentication > Settings > Authorized domains: tambahkan auth-nyrmanageradminmn.vercel.app.

SETUP FIREBASE (sekali saja, project muchineko-admin-auth)
1. Firestore Database: buat database edisi Standard, lokasi asia-southeast2, mode Production.
2. Tab Rules: tempel isi firestore.rules, lalu Publish.
3. Buat koleksi admins, dokumen ID = UID owner, field: email (string), role (string) = owner, createdAt (timestamp).

TES LOKAL (opsional)
Ubah PIN di anti-clone.js dan ALLOWED_HOSTS di env-setup.txt untuk menyertakan localhost, lalu jalankan: node server.js
