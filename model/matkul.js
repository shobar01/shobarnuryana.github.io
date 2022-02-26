const mongoose = require('mongoose');

const Matkul = mongoose.model('Matkul', {
    kode_matkul:{
        type: String,
        required: true,
    },
    nama_matkul: {
        type: String,
        required: true,
    },
    sks: {
        type: String,
    },
    semester: {
        type: String,
    },
    nama_prodi: {
        type: String,
    },
});

module.exports = Matkul;