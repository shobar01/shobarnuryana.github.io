const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/wpu', {
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    useCreateIndex: true,
});





// // menambah 1 data
// const prodi1 = new Prodi({
//     kode_prodi: 'TM',
//     nama_prodi: 'Teknik Mesin',
//     jenjang: 'S1',
// });

// // // simpan ke collection
// prodi1.save().then((prodi) => console.log(prodi));