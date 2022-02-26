const mongoose = require('mongoose');

const Mahasiswa = mongoose.model('Mahasiswa', {
    nim:{
        type: String,
        required: true,
    },
    nama_lengkap: {
        type: String,
        required: true,
    },
    email: {
        type: String,
    },
    alamat: {
        type: String,
    },
    nohp: {
        type: String,
    },
    jenis_kelamin: {
        type: String,
    },
    tempat_lahir: {
        type: String,
    },
    tanggal_lahir: {
        type: String,
    },
    nama_prodi: {
        type: String,
    },
});

module.exports = Mahasiswa;