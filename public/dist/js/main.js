$(document).ready(function(){
    $('#table_1').DataTable();
    
});

// $(document).ready( function() {   
//     $('#table_1').DataTable({
//         ajax : './ajax/coba.json',
//         dataSrc : 'data',
//         columns : [
//                { 'data' : 'no' },
//                { 'data' : 'nama' },
//                { 'data' : 'email' },
//                { 'data' : 'nohp' }
//     ]
//     });
// } );


// $.fn.dataTable.ext.errMode = 'throw';
   

// var keyword = document.getElementById('keyword');
// var container = document.getElementById('container');

// // tambahkan event ketika keyword ditulis
// keyword.addEventListener('keyup', function() {
//     // console.log(keyword.value)
//     //buat object ajax
//     var xhr = new XMLHttpRequest();

//     //cek kesiapan ajax
//     xhr.onreadystatechange = function() {
//         if( xhr.readyState == 4 && xhr.status == 200 ) {
//             container.innerHTML = xhr.responseText;
//         }
//     }

//     // eksekusi ajax
//     xhr.open('GET', '/ajax/coba.ejs', + keyword.value, true);
//     xhr.send();
// })