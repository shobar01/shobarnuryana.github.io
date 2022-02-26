const mongoose = require('mongoose');

const Prodi = mongoose.model('Prodi', {
    kode_prodi:{
        type: String,
        required: true,
    },
    nama_prodi: {
        type: String,
        required: true,
    },
    jenjang: {
        type: String,
        required: true,
    },
});

module.exports = Prodi;