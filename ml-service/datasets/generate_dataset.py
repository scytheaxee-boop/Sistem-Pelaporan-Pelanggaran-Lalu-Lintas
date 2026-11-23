"""
Dataset Generator for LaporLintas AI Spam Detection
Generates labeled Indonesian traffic report descriptions (Normal vs Spam).
Marked as synthetic academic prototype data.
"""

import csv
import os
import random

random.seed(42)

# Templates and components for NORMAL (Traffic related)
VEHICLES = ["Pengendara motor", "Pengemudi mobil", "Truk muatan besar", "Angkot", "Bus kota", "Pengendara ojek online", "Pengendara sepeda motor matic", "Sopir pikap", "Pengendara motor sport", "Mobil pribadi", "Kendaraan roda dua", "Pengemudi taksi"]
LOCATIONS = ["di persimpangan lampu merah", "di depan pasar", "di atas trotoar pejalan kaki", "di zebra cross", "di jalan layang", "di jalur busway", "di tikungan tajam", "di jalan satu arah", "di depan sekolah", "di gerbang tol", "di bahu jalan tol", "di jalan bypass", "di kawasan tertib lalu lintas", "di dekat halte bus", "di pertigaan jalan utama", "di area putar balik (U-turn)"]
VIOLATIONS = [
    "menerobos lampu merah dengan kecepatan tinggi saat kendaraan lain sudah jalan",
    "melawan arus lalu lintas sehingga membahayakan pengendara lain dari arah berlawanan",
    "parkir sembarangan di badan jalan hingga menimbulkan kemacetan parah",
    "parkir di atas trotoar dan menghalangi hak pejalan kaki serta difabel",
    "berkendara sambil bermain ponsel tanpa memperhatikan jalan di depannya",
    "tidak menggunakan helm standar SNI baik pengemudi maupun penumpangnya",
    "menggunakan knalpot brong yang sangat bising dan mengganggu kenyamanan warga",
    "melakukan aksi balap liar bersama rombongan tanpa memedulikan keselamatan",
    "berputar arah di tempat yang jelas terpasang rambu dilarang putar balik",
    "berhenti melebihi garis marka jalan saat lampu merah menyala",
    "memotong jalur kendaraan lain secara mendadak tanpa memberi lampu sein",
    "masuk ke jalur khusus busway padahal kondisi jalan umum sedang lancar",
    "membawa muatan berlebih (ODOL) hingga miring dan membahayakan pengendara di belakangnya",
    "tidak menyalakan lampu utama saat berkendara di malam hari yang gelap",
    "kendaraan tidak memasang plat nomor kendaraan bagian belakang dan depan",
    "mengangkut penumpang melebihi kapasitas motor bonceng tiga tanpa helm",
    "ugal-ugalan dan zig-zag di tengah padatnya arus kendaraan sore hari",
    "menaikkan dan menurunkan penumpang di sembarang tempat di tengah jalan",
    "merusak fasilitas pembatas jalan untuk putar balik sembarangan",
    "membunyikan klakson telolet berulang kali di dekat area rumah sakit"
]

VARIATIONS_NORMAL = [
    # Explicit reports with specific contextual details
    "Pengendara motor Beat warna hitam menerobos lampu merah di Simpang Lima, hampir menabrak penyeberang jalan.",
    "Mobil sedan putih plat B parkir di bahu jalan tol arah timur, sangat membahayakan pengendara lain di malam hari.",
    "Banyak motor lawan arah di turunan flyover Antasari setiap pagi jam sibuk kerja.",
    "Truk gandeng over kapasitas mogok di tanjakan jalan poros, lalu lintas macet total 3 kilometer.",
    "Sopir angkutan umum mengetem di tengah persimpangan lampu merah bikin macet panjang.",
    "Pengendara tidak memakai helm dan berboncengan tiga orang melintas di depan pos polisi yang kosong.",
    "Rombongan pengendara motor knalpot bising konvoi ugal-ugalan sambil menggeber gas di jalan protokol.",
    "Mobil boks bongkar muatan barang di badan jalan saat jam padat tanpa memasang segitiga pengaman.",
    "Pelanggaran marka jalan garis lurus tidak putus, sering disalip dari kiri secara membahayakan.",
    "Pengemudi mobil Avanza hitam asyik mengetik chat HP saat menyetir sampai oleng ke kanan.",
    "Sepeda motor masuk jalur cepat jalan arteri padahal sudah ada rambu dilarang masuk.",
    "Mobil parkir sembarangan di depan pintu keluar darurat rumah sakit menghalangi ambulans.",
    "Angkot berhenti mendadak di tikungan tanpa lampu sein menyebabkan pengendara di belakang kaget.",
    "Pengendara motor menaiki trotoar pejalan kaki untuk menghindari antrean lampu merah.",
    "Plat nomor kendaraan belakang sengaja dicopot atau ditutup stiker agar tidak kena tilang elektronik.",
    "Lampu lalu lintas di perempatan padam sehingga kendaraan saling serobot dan terjadi benturan kecil.",
    "Pohon tumbang menutupi separuh badan jalan dan rambu petunjuk jalan tidak terlihat jelas.",
    "Tumpahan solar atau oli di tikungan jalan licin menyebabkan pengendara motor banyak yang tergelincir.",
    "Kendaraan roda empat menerobos palang pintu perlintasan kereta api yang sudah mulai berbunyi.",
    "Pengendara motor merokok sambil berkendara, abunya mengenai mata pengendara di belakangnya.",
    "Mobil mewah menggunakan lampu strobo dan sirine ilegal memaksa pengendara lain menepi.",
    "Ada anak di bawah umur mengendarai motor tanpa kelengkapan surat dan tidak memakai helm.",
    "Kendaraan roda dua berputar arah di celah separator jalan yang sengaja dibongkar paksa.",
    "Truk pengangkut tanah tidak memakai terpal penutup sehingga material debu dan batu berjatuhan.",
    "Bus malam ngeblong mengambil lajur lawan arah di jalur pantura dengan kecepatan membahayakan."
]

# SPAM categories
GIBBERISH = [
    "asdfghjklqwertyuiopzxcvbnm",
    "12345678901234567890",
    "asdf asdf test 1234567890",
    "zzzzzzxxxxxxxccccvvvvbbbb",
    "qwerty uiop asdfgh jkl zxcvbnm",
    "testing testing doang ini sistem",
    "abcdefghijklmnopqrstuvwxyz",
    "coba kirim laporan tanpa isi beneran",
    "halo tes halo tes satu dua tiga",
    "hsdjkasdhjkashdjkashdjkas",
    "aslkdjlaksjdlkasjdlkasjdlk",
    "poiuytrewqasdfghjklmnbvcxz",
    "1111122222333334444455555",
    "test 123 tes coba fitur sistem",
    "akjsdhfkjashdfkjhasdkfjh",
    "cuma nyoba tombol kirim laporan doang ya min",
    "aaaaaaaaabbbbbbbbbbbcccccccccc",
    "random text untuk ngetes aplikasi",
    "lorem ipsum dolor sit amet consectetur",
    "blablablablablablablablabla"
]

PROMOS = [
    "Jual obat pelangsing herbal alami bergaransi turun 10kg hubungi wa 08123456789.",
    "Promo sepatu sneakers original diskon sampai 70 persen kunjungi toko online kami.",
    "Mau pinjaman dana tunai cair cepat tanpa jaminan bunga rendah kontak nomor admin.",
    "Jasa penambah followers instagram aktif dan like murah meriah order sekarang.",
    "Sedia pulsa murah token pln dan kuota data termurah se-Indonesia klik link bio.",
    "Dapatkan cashback hingga ratusan ribu belanja di olshop kami gratis ongkir sepuasnya.",
    "Jual rumah subsidi cicilan murah tanpa dp lokasi strategis dekat stasiun dan tol.",
    "Promo handphone banting harga cuci gudang edisi terbatas buruan pesan sekarang.",
    "Jual akun netflix premium dan spotify murah garansi anti hold hubungi telegram kami.",
    "Slot gacor hari ini gampang menang jackpot terbesar daftar dan klaim bonus member baru.",
    "Obat kuat pria tahan lama terbukti manjur pesan rahasia terjamin privasi aman.",
    "Jasa joki skripsi tesis tugas kuliah cepat kelar harga mahasiswa langsung wa admin.",
    "Grosir daster kencana ungu termurah melayani pengiriman seluruh nusantara.",
    "Open reseller dropship produk kosmetik kecantikan modal kecil untung jutaan rupiah.",
    "Jual mobil bekas tarikan leasing harga murah kelengkapan bpkb stnk faktur lengkap."
]

GREETINGS_CHATTER = [
    "Selamat pagi semuanya semoga harimu menyenangkan dan selalu bahagia amin.",
    "Ada yang mau mabar mobile legends ga nih rank mythic butuh roamer sekarang.",
    "Hari ini cuaca panas banget ya enaknya minum es kelapa muda dingin seger.",
    "Lagi galau mikirin masa depan enaknya jalan-jalan ke mana ya guys tolong saran.",
    "Siapa artis favorit kalian tahun ini menurutku lagu barunya keren banget.",
    "Lapar banget jam segini tapi mager keluar rumah pengen pesan martabak manis.",
    "Terima kasih atas pelayanannya sukses selalu buat kita semua salam kenal.",
    "Jangan lupa makan siang kawan kawan biar tubuh tetap kuat dan sehat beraktivitas.",
    "Tugas kuliah numpuk banget rasanya pengen liburan ke pantai healing sejenak.",
    "Semangat hari senin pejuang rupiah semoga rezeki mengalir berkah dan melimpah.",
    "Bintang kecil di langit yang biru amat banyak menghias angkasa aku ingin terbang.",
    "Sayur kol sayur kol makan daging anjing dengan sayur kol lagu hits di tiktok.",
    "Siapakah jodohku kelak semoga orang yang baik hati dan sholehah mencintaiku.",
    "Film terbaru di bioskop bagus ga ya rekomendasi dong yang seru buat ditonton malam ini.",
    "Kucing tetangga lucu banget warnanya oren suka main di teras rumahku tiap sore."
]


def generate_normal_samples(count=360):
    samples = set()
    
    # 1. Base curated realistic reports
    for item in VARIATIONS_NORMAL:
        samples.add(item.strip())
        
    # 2. Combinatorial generation with realistic traffic variations
    while len(samples) < count:
        v = random.choice(VEHICLES)
        loc = random.choice(LOCATIONS)
        viol = random.choice(VIOLATIONS)
        
        style = random.randint(1, 6)
        if style == 1:
            text = f"{v} {viol} {loc}."
        elif style == 2:
            text = f"Terjadi dugaan pelanggaran {loc}, {v.lower()} {viol}."
        elif style == 3:
            text = f"Mohon ditindaklanjuti, {v.lower()} terlihat {viol} {loc}."
        elif style == 4:
            text = f"Setiap hari {loc} sering sekali {v.lower()} {viol}."
        elif style == 5:
            # More informal / citizen tone
            text = f"Lapor min, {v.lower()} {viol} {loc}, sangat membahayakan orang lain."
        else:
            text = f"Kondisi lalu lintas {loc} kacau karena {v.lower()} {viol}."
            
        samples.add(text)
        
    return list(samples)[:count]


def generate_spam_samples(count=360):
    samples = set()
    
    # 1. Base samples
    for item in GIBBERISH + PROMOS + GREETINGS_CHATTER:
        samples.add(item.strip())
        
    # 2. Expand Promos & Ads variations
    items_promo = ["sepatu", "baju", "jaket", "jam tangan", "tas wanita", "kamera", "laptop", "helm sepeda", "kacamata", "parfum"]
    contacts = ["wa 08123456789", "dm ig @tokoberkah", "hubungi 08987654321", "kontak telegram @adminpromo", "kunjungi link bio kami"]
    
    while len(samples) < count:
        cat = random.randint(1, 4)
        if cat == 1:
            # Promo product generator
            prod = random.choice(items_promo)
            contact = random.choice(contacts)
            diskon = random.choice(["diskon 50%", "cuci gudang harga miring", "beli 1 gratis 1 promo akhir pekan", "harga termurah kualitas import"])
            text = f"Jual {prod} original {diskon} minat langsung {contact}."
        elif cat == 2:
            # Random gibberish generator
            chars = "abcdefghijklmnopqrstuvwxyz1234567890"
            tokens = ["".join(random.choices(chars, k=random.randint(4, 12))) for _ in range(random.randint(3, 8))]
            text = " ".join(tokens)
        elif cat == 3:
            # General casual conversation / off-topic
            topic = random.choice([
                "Makan bakso sore sore pas hujan enak banget ya kawan kawan",
                "Ada yang tahu cara download video dari youtube tanpa aplikasi tambahan?",
                "Liburan akhir pekan enaknya tidur seharian di kasur nonton drakor",
                "Hari ini capek banget kerja lembur dari pagi sampai tengah malam",
                "Kira kira harga emas besok bakal naik apa turun ya butuh info",
                "Lirik lagu balonku ada lima rupa rupa warnanya hijau kuning kelabu",
                "Review kopi susu gula aren di kafe dekat kampus manisnya pas banget",
                "Tolong rekomendasi tempat makan enak dan murah sekitar jakarta selatan",
                "Semoga ujian skripsi minggu depan berjalan lancar dan dapat nilai A",
                "Kucing oren emang tingkahnya selalu aneh tapi bikin gemes banget"
            ])
            text = f"{topic} {random.randint(100, 999)}."
        else:
            # Test text
            t = random.choice(["Tes coba kirim", "Cuman ngecek aplikasi", "Testing sistem laporan", "Halo admin cuma ngetes ya", "Coba input data random"])
            text = f"{t} {' '.join([str(random.randint(1, 99)) for _ in range(random.randint(3, 6))])}."
            
        samples.add(text)
        
    return list(samples)[:count]


def main():
    os.makedirs(os.path.dirname(os.path.abspath(__file__)), exist_ok=True)
    out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "traffic_spam_dataset.csv")
    
    normal_data = generate_normal_samples(360)
    spam_data = generate_spam_samples(360)
    
    rows = []
    for text in normal_data:
        rows.append({"text": text, "label": "normal", "is_synthetic": "True"})
    for text in spam_data:
        rows.append({"text": text, "label": "spam", "is_synthetic": "True"})
        
    random.shuffle(rows)
    
    with open(out_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["text", "label", "is_synthetic"])
        writer.writeheader()
        writer.writerows(rows)
        
    print(f"Generated {len(rows)} samples: {len(normal_data)} normal, {len(spam_data)} spam.")
    print(f"Saved to: {out_path}")


if __name__ == "__main__":
    main()
