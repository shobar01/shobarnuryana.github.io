const mongoose = require('mongoose');

const Dosen = mongoose.model('Dosen', {
    nidn:{
        type: String,
        required: true,
    },
    nama_dosen: {
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
});

module.exports = Dosen;