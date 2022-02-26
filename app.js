const express = require('express');
const expressLayouts = require('express-ejs-layouts');

const { body, validationResult, check } = require('express-validator');
const methodOverride = require('method-override');

const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const exflash = require('express-flash');
// const Auth_mdw = require('./middleware/auth');
const crypto = require('crypto');
const bcryptjs = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');
// const middleware = require('./middleware/middleware');
const { kirimEmail } = require('./helpers');
const options = require('./helpers/options');
const pdf = require('pdf-creator-node');

JWT_SECRET='dgdgdgdgkkkl'
CLIENT_URL='http://localhost:3000'

require('./utils/db');
const Contact = require('./model/contact');
const User = require('./model/user');
const Mahasiswa = require('./model/mahasiswa');
const Dosen = require('./model/dosen');
const Matkul = require('./model/matkul');
const Prodi = require('./model/prodi');




const app = express();
const port = 3000;

// setup method override
app.use(methodOverride('_method'));

// setup ejs
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true })); 

// body-parser
app.use(bodyParser.json());

// konfigurasi flash
app.use(cookieParser('secret'));
app.use(session({
    cookie: { maxAge: 1000000},
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
})
);
app.use(flash());


let sess;

function checkUserSession(req, res, next) {
  if (req.session.loggedin) {
    next();
  } else {
    req.flash('msg', 'Anda harus login terlebih dahulu!');
    res.redirect('/login');
  }
}
  
// route for Home-Page
app.get("/",  (req, res) => {
    res.redirect("/login");
    });




//halaman register
app.get('/register', (req, res) => {
    res.render('register', {
        layout: 'layouts/main-layout',
         title: 'Halaman register',
         msg: req.flash('msg'),
        });
});



// proses tambah registrasi user
app.post('/register/add', async (req,res) => {
    const { username, email, password} = req.body

    const emailUser = await User.findOne({email: email})
    const usernameuser = await User.findOne({username: username})
   
   if(usernameuser) {
    return res.status(404).json({
        status: false,
        message: 'username sudah tersedia'
    })
}

   if(emailUser) {
       return res.status(404).json({
           status: false,
           message: 'email sudah tersedia'
       })
   }
    const hashPassword = await bcryptjs.hash(password, 10)
    const user = new User({
        username: username,
        email: email,
        password: hashPassword,
    })
    
    user.save()
    req.flash('msg', 'Data user berhasil ditambahkan!');
    res.render('add-register', {
        layout: 'layouts/main-layout',
         title: 'Halaman register',
         msg: req.flash('msg'),
    });
});
 

app.get('/register/add', async (req, res) => {

        res.render('add-register', {
            layout: 'layouts/main-layout',
            title: 'Halaman register',
            users,
            msg: req.flash('msg'),
        });
    });

//halaman cetak pdf
app.get('/cetak', (req, res) => {
    res.render('cetak-pdf', {
        layout: 'layouts/main-layout',
         title: 'Halaman pdf',
         msg: req.flash('msg'),
        });
});



//halaman Lupa PASSWORD
app.get('/lupa-password', (req, res) => {
    res.render('lupa-password', {
        layout: 'layouts/main-layout',
         title: 'Halaman Lupa Password',
         msg: req.flash('msg'),
        });
});

//halaman reset PASSWORD
app.get('/resetpassword/:token', (req, res) => {
    res.render('resetpassword', {
        layout: 'layouts/main-layout',
         title: 'Halaman Reset Password',
         msg: req.flash('msg'),
        });
});

app.post('/lupa-password', async (req, res) => {
    const { email } = req.body

    const user = await User.findOne({email: email})
    if(!user) {
        // return res.status(200).json ({
        //     status: false,
        //     message: 'Email tidak tersedia'
        // })
        req.flash('msg','Email tidak tersedia');
        res.render('lupa-password', {
          msg: req.flash('msg'),
          layout: 'layouts/main-layout',
          title: 'Halaman Lupa Password',
        });
    }
    

    const token = jsonwebtoken.sign({
        iduser: user._id
    }, JWT_SECRET)

    await user.updateOne({resetPasswordLink: token})

    const templateEmail = {
        from: 'SISTEM AKADEMIK',
        to: email,
        subject: 'Link Reset Password',
        html: `<p>silahkan klik link dibawah untuk reset password anda</p> <p>${CLIENT_URL}/resetpassword/${token}</p>`
    }
    kirimEmail(templateEmail)
    req.flash('msg','Link reset password berhasil terkirim, silahkan cek email anda');
        res.render('lupa-password', {
          msg: req.flash('msg'),
          layout: 'layouts/main-layout',
          title: 'Halaman Lupa Password',
        });
})



app.get('/login', function (req, res) {
    sess = req.session;
    if (sess.loggedin) {
      return res.redirect('/dashboard');
    }
    if (req.query.logout) {
      req.flash('msg', 'Anda telah logout!')
      return res.redirect('/logout')
    }
    res.render('login', {
        layout: 'layouts/main-layout',
        title: 'Halaman Login',
        msg: req.flash('msg'),
      belumLogin: req.flash('msg'),
      logout: req.flash('logout')
    });
  });


  // PROSES LOGIN 
app.post('/login', async (req,res) => { 
    sess = req.session;
    const { username, password } = req.body
    const datauser = await User.findOne({$or: [{username: username}, {email: username}]})
    if(datauser) {
        // jika username nya ada masuk proses ini
        const passwordUser = await bcryptjs.compare(password, datauser.password)
        if(passwordUser) {
            //jika passnya ada masuk ke proses ini
            const data = {
                id: datauser._id
            }
            const token = await jsonwebtoken.sign(data,JWT_SECRET)
            sess.username = username;
            sess.password = password;
            sess.loggedin = true;
            
            res.render('dashboard', {
                msg: req.flash("msg"),
                layout: 'layouts/main-layout',
                title: 'Halaman Dashboard',
                message: 'berhasil',
                token: token
            })
        
    } else {
        req.flash('msg','Password tidak sama!');
        res.render('login', {
          msg: req.flash('msg'),
          layout: 'layouts/main-layout',
          title: 'Halaman login',
        });
      }
    } else {
      req.flash('msg', 'Username atau email tidak tersedia!');
      res.render('login', {
        msg: req.flash('msg'),
        layout: 'layouts/main-layout',
        title: 'Halaman login',
      });
    }
});

// halaman dashboard
app.get('/dashboard', checkUserSession, async (req, res) => {
    sess = req.session;
    sess.loggedin = true;
    req.flash("msg", "Anda telah login!");
    res.render('dashboard', {
        title: 'Halaman Dashboard',
        msg: req.flash('msg'),
        layout: 'layouts/main-layout',
        loggedin: sess.loggedin
    });
});



// halaman user
app.get('/user', checkUserSession,  async (req, res) => {

    const users = await User.find();
    
    res.render('user', {
        layout: 'layouts/main-layout',
        title: 'Halaman User',
        msg: req.flash('msg'),
        users,
        
    });
});

// halaman form ubah data user
app.get('/user/edit/:username', checkUserSession, async (req, res) => {
    const user = await User.findOne({ username: req.params.username });

    res.render('edit-user', {
        title: 'Form Ubah Data user',
        layout: 'layouts/main-layout',
        user,
        
    });
});

// proses ubah data user
app.put('/user', 
[
    body('username').custom(async (value, { req }) => {
        const duplikat = await User.findOne({ username: value});
        if(value !== req.body.oldUsername && duplikat) {
            throw new Error('Nama user sudah ada');
        }
        return true;
    }),
    check ('email', 'Email tidak valid!').isEmail(),
    check('password', 'Password tidak valid')
 ], 
 (req, res)=> {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
    res.render('edit-user', {
        title: 'Form Ubah Data User',
        layout: 'layouts/main-layout',
        errors: errors.array(),
        user: req.body,
    });
    } else {
    User.updateOne(
    { _id: req.body._id },
    {
        $set: {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
        },
    }
    ).then((result) => {
    // kirimkan flash message
       req.flash('msg', 'Data user berhasil diubah!');
       res.redirect('/user');

    });
    }

});

// form delete user
app.delete('/user', (req, res) => {
    User.deleteOne({ username: req.body.username }).then((result) => {
    req.flash('msg', 'Data user berhasil dihapus!');
    res.redirect('/user');
  });
});

// halaman logout
app.get('/logout', (req, res) => {
    res.redirect("/?logout=true");
    req.session.destroy((err) => {
        if (err) {
          return console.log(err);
        }
        
    });
});



// halaman home
// app.get('/', (req, res) => { 
//     const mahasiswa = [
//      {
//         nama: 'Shobar Nuryana',
//         email: 'shobarnuryana@gmail.com',
//      },
//      {
//         nama: 'Dendy',
//         email: 'dendy@gmail.com',
//      },
//      {
//         nama: 'Doddy',
//         email: 'doddy@gmail.com',
//      },
// ];
// res.render('index', { 
//     nama: 'Shobar Nuryana', 
//     title: 'Halaman Home',
//     mahasiswa,
//     layout: 'layouts/main-layout',
//    });
// console.log('ini halaman home');
// });

//halaman about
app.get('/about', checkUserSession, (req, res) => {
    res.render('about', {
        layout: 'layouts/main-layout',
         title: 'Halaman About',
        });
});

// halaman contact
app.get('/contact', checkUserSession, async (req, res) => {

    const contacts = await Contact.find();
    
    res.render('contact', {
        layout: 'layouts/main-layout',
        title: 'Halaman Contact',
        contacts,
        msg: req.flash('msg'),
    });
});

// halaman tambah contact
app.get('/tambah', checkUserSession, (req, res) => {
        sess = req.session;
        sess.loggedin = true;
        res.render('add-contact', {
        title: 'Halaman tambah contact',
        layout: 'layouts/main-layout',
    });
});

// halaman form tambah data contact
app.get('/contact/add',  checkUserSession, (req, res) => {
    res.render('add-contact', {
        title: 'Form Tambah Data Contact',
        layout: 'layouts/main-layout',
    });
});

// proses tambah data contact
app.post('/contact', 
[
    body('nama').custom(async (value) => {
        const duplikat = await Contact.findOne({ nama: value });
        if(duplikat) {
            throw new Error('Nama contact sudah ada');
        }
        return true;
    }),
    check ('email', 'Email tidak valid!').isEmail(),
    check('nohp', 'No HP tidak valid').isMobilePhone('id-ID')
 ], 
 (req, res)=> {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {

    res.render('add-contact', {
        title: 'Form Tambah Data Contact',
        layout: 'layouts/main-layout',
        errors: errors.array(),
    });
    } else {
    Contact.insertMany(req.body, (error, result) => {
    // kirimkan flash message
    req.flash('msg', 'Data contact berhasil ditambahkan!');
    res.redirect('/contact');
    });
    }
});



// halaman form ubah data contact
app.get('/contact/edit/:nama', checkUserSession, async (req, res) => {
    const contact = await Contact.findOne({ nama: req.params.nama });

    res.render('edit-contact', {
        title: 'Form Ubah Data Contact',
        layout: 'layouts/main-layout',
        contact,
    });
});

// proses ubah data
app.put('/contact', 
[
    body('nama').custom(async (value, { req }) => {
        const duplikat = await Contact.findOne({ nama: value});
        if(value !== req.body.oldNama && duplikat) {
            throw new Error('Nama contact sudah ada');
        }
        return true;
    }),
    check ('email', 'Email tidak valid!').isEmail(),
    check('nohp', 'No HP tidak valid').isMobilePhone('id-ID')
 ], 
 (req, res)=> {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
    res.render('edit-contact', {
        title: 'Form Ubah Data Contact',
        layout: 'layouts/main-layout',
        errors: errors.array(),
        contact: req.body,
    });
    } else {
    Contact.updateOne(
    { _id: req.body._id },
    {
        $set: {
            nama: req.body.nama,
            email: req.body.email,
            nohp: req.body.nohp,
        },
    })
    .then((result) => {
    // kirimkan flash message
       req.flash('msg', 'Data contact berhasil diubah!');
       res.redirect('/contact');

    });
    }

});

// form delete contact
app.delete('/contact', (req, res) => {
    Contact.deleteOne({ nama: req.body.nama }).then((result) => {
    req.flash('msg', 'Data contact berhasil dihapus!');
    res.redirect('/contact');
  });
});

// halaman mahasiswa
app.get('/mahasiswa', checkUserSession, async (req, res) => {

    const mahasiswas = await Mahasiswa.find();
    
    res.render('mahasiswa', {                           
        layout: 'layouts/main-layout',
        title: 'Halaman Mahasiswa',
        mahasiswas,
        msg: req.flash('msg'),
    });
});

// halaman tambah mahasiswa
app.get('/tambahmhs', checkUserSession, (req, res) => {
    sess = req.session;
    sess.loggedin = true;
    res.render('add-mahasiswa', {
    title: 'Halaman tambah mahasiswa',
    layout: 'layouts/main-layout',
});
});

// halaman form tambah data mhs
app.get('/mahasiswa/add',  checkUserSession, (req, res) => {
res.render('add-mahasiswa', {
    title: 'Form Tambah Data Mahasiswa',
    layout: 'layouts/main-layout',
});
});

// proses tambah data mhs
app.post('/mahasiswa', 
[
    body('nim').custom(async (value) => {
        const duplikat = await Mahasiswa.findOne({ nim: value });
        if(duplikat) {
            throw new Error('nim sudah ada');
        }
        return true;
    }),
    check ('nama', 'Nama sudah ada!'),
    check ('email', 'Email tidak valid!').isEmail(),
    check ('alamat', 'Alamat tidak sesuai!'),
    check('nohp', 'No HP tidak valid').isMobilePhone('id-ID'),
    check ('jenis_kelamin', ''),
    check ('tempat_lahir', ''),
    check('tanggal_lahir', ''),
    check('nama_prodi', ''),
    
 ], 
 (req, res)=> {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {

    res.render('add-mahasiswa', {
        title: 'Form Tambah Data mahasiswa',
        layout: 'layouts/main-layout',
        errors: errors.array(),
    });
    } else {
    Mahasiswa.insertMany(req.body, (error, result) => {
    // kirimkan flash message
    req.flash('msg', 'Data mahasiswa berhasil ditambahkan!');
    res.redirect('/mahasiswa');
    });
    }
});



// halaman form ubah data mhs
app.get('/mahasiswa/edit/:nim', checkUserSession, async (req, res) => {
    const mahasiswa = await Mahasiswa.findOne({ nim: req.params.nim });

    res.render('edit-mahasiswa', {
        title: 'Form Ubah Data Mahasiswa',
        layout: 'layouts/main-layout',
        mahasiswa,
    });
});

// proses ubah data
app.put('/mahasiswa', 
[
    body('nim').custom(async (value, { req }) => {
        const duplikat = await Mahasiswa.findOne({ nim: value});
        if(value !== req.body.oldNim && duplikat) {
            throw new Error('nim mhs sudah ada');
        }
        return true;
    }),
    check ('nama', 'Nama sudah ada!'),
    check ('email', 'Email tidak valid!').isEmail(),
    check ('alamat', 'Alamat tidak sesuai!'),
    check('nohp', 'No HP tidak valid').isMobilePhone('id-ID'),
    check ('jenis_kelamin', ''),
    check ('tempat_lahir', ''),
    check('tanggal_lahir', ''),
    check('nama_prodi', ''),
 ], 
 (req, res)=> {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
    res.render('edit-mahasiswa', {
        title: 'Form Ubah Data mahasiswa',
        layout: 'layouts/main-layout',
        errors: errors.array(),
        mahasiswa: req.body,
    });
    } else {
    Mahasiswa.updateOne(
    { _id: req.body._id },
    {
        $set: {
            nim: req.body.nim,
            nama_lengkap: req.body.nama_lengkap,
            email: req.body.email,
            alamat: req.body.alamat,
            nohp: req.body.nohp,
            jenis_kelamin: req.body.jenis_kelamin,
            tempat_lahir: req.body.tempat_lahir,
            tanggal_lahir: req.body.tanggal_lahir,
            nama_prodi: req.body.nama_prodi,
        },
    })
    .then((result) => {
    // kirimkan flash message
       req.flash('msg', 'Data mahasiswa berhasil diubah!');
       res.redirect('/mahasiswa');

    });
    }

});

// form delete mhs
app.delete('/mahasiswa', (req, res) => {
    Mahasiswa.deleteOne({ nim: req.body.nim }).then((result) => {
    req.flash('msg', 'Data mahasiswa berhasil dihapus!');
    res.redirect('/mahasiswa');
  });
});


// halaman dosen
app.get('/dosen', checkUserSession, async (req, res) => {

    const dosens = await Dosen.find();
    
    res.render('dosen', {                           
        layout: 'layouts/main-layout',
        title: 'Halaman Dosen',
        dosens,
        msg: req.flash('msg'),
    });
});

// halaman tambah dosen
app.get('/tambah-dosen', checkUserSession, (req, res) => {
    sess = req.session;
    sess.loggedin = true;
    res.render('add-dosen', {
    title: 'Halaman Tambah Dosen',
    layout: 'layouts/main-layout',
});
});

// halaman form tambah data dosen
app.get('/dosen/add',  checkUserSession, (req, res) => {
res.render('add-dosen', {
    title: 'Form Tambah Data Dosen',
    layout: 'layouts/main-layout',
});
});

// proses tambah data dosen
app.post('/dosen', 
[
    body('nidn').custom(async (value) => {
        const duplikat = await Dosen.findOne({ nidn: value });
        if(duplikat) {
            throw new Error('nidn sudah ada');
        }
        return true;
    }),
    check ('nama_dosen', 'Nama sudah ada!'),
    check ('email', 'Email tidak valid!').isEmail(),
    check ('alamat', 'Alamat tidak sesuai!'),
    check('nohp', 'No HP tidak valid').isMobilePhone('id-ID'),
    check ('jenis_kelamin', ''),
    
 ], 
 (req, res)=> {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {

    res.render('add-dosen', {
        title: 'Form Tambah Data Dosen',
        layout: 'layouts/main-layout',
        errors: errors.array(),
    });
    } else {
    Dosen.insertMany(req.body, (error, result) => {
    // kirimkan flash message
    req.flash('msg', 'Data dosen berhasil ditambahkan!');
    res.redirect('/dosen');
    });
    }
});



// halaman form ubah data dosen
app.get('/dosen/edit/:nidn', checkUserSession, async (req, res) => {
    const dosen = await Dosen.findOne({ nidn: req.params.nidn });

    res.render('edit-dosen', {
        title: 'Form Ubah Data Dosen',
        layout: 'layouts/main-layout',
        dosen,
    });
});

// proses ubah data
app.put('/dosen', 
[
    body('nidn').custom(async (value, { req }) => {
        const duplikat = await Dosen.findOne({ nidn: value});
        if(value !== req.body.oldNidn && duplikat) {
            throw new Error('nidn dosen sudah ada');
        }
        return true;
    }),
    check ('nama_dosen', 'Nama sudah ada!'),
    check ('email', 'Email tidak valid!').isEmail(),
    check ('alamat', 'Alamat tidak sesuai!'),
    check('nohp', 'No HP tidak valid').isMobilePhone('id-ID'),
    check ('jenis_kelamin', ''),
 ], 
 (req, res)=> {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
    res.render('edit-dosen', {
        title: 'Form Ubah Data Dosen',
        layout: 'layouts/main-layout',
        errors: errors.array(),
        dosen: req.body,
    });
    } else {
    Dosen.updateOne(
    { _id: req.body._id },
    {
        $set: {
            nidn: req.body.nidn,
            nama_dosen: req.body.nama_dosen,
            email: req.body.email,
            alamat: req.body.alamat,
            nohp: req.body.nohp,
            jenis_kelamin: req.body.jenis_kelamin,
        },
    })
    .then((result) => {
    // kirimkan flash message
       req.flash('msg', 'Data dosen berhasil diubah!');
       res.redirect('/dosen');

    });
    }

});

// form delete dosen
app.delete('/dosen', (req, res) => {
    Dosen.deleteOne({ nidn: req.body.nidn }).then((result) => {
    req.flash('msg', 'Data dosen berhasil dihapus!');
    res.redirect('/dosen');
  });
});


// halaman matkul
app.get('/matkul', checkUserSession, async (req, res) => {

    const matkuls = await Matkul.find();
    
    res.render('matkul', {                           
        layout: 'layouts/main-layout',
        title: 'Halaman Matkul',
        matkuls,
        msg: req.flash('msg'),
    });
});

// halaman tambah matkul
app.get('/tambah-matkul', checkUserSession, (req, res) => {
    sess = req.session;
    sess.loggedin = true;
    res.render('add-matkul', {
    title: 'Halaman Tambah Matkul',
    layout: 'layouts/main-layout',
});
});

// halaman form tambah data matkul
app.get('/matkul/add',  checkUserSession, (req, res) => {
res.render('add-matkul', {
    title: 'Form Tambah Data Matkul',
    layout: 'layouts/main-layout',
});
});

// proses tambah data matkul
app.post('/matkul', 
[
    body('kode_matkul').custom(async (value) => {
        const duplikat = await Matkul.findOne({ kode_matkul: value });
        if(duplikat) {
            throw new Error('Kode matkul sudah ada');
        }
        return true;
    }),
    check ('nama_matkul', 'Nama sudah ada!'),
    check ('sks', ''),
    check ('semester', ''),
    check ('nama_prodi', ''),
    
 ], 
 (req, res)=> {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {

    res.render('add-matkul', {
        title: 'Form Tambah Data Matkul',
        layout: 'layouts/main-layout',
        errors: errors.array(),
    });
    } else {
    Matkul.insertMany(req.body, (error, result) => {
    // kirimkan flash message
    req.flash('msg', 'Data Mata Kuliah berhasil ditambahkan!');
    res.redirect('/matkul');
    });
    }
});



// halaman form ubah data matkul
app.get('/matkul/edit/:kode_matkul', checkUserSession, async (req, res) => {
    const matkul = await Matkul.findOne({ kode_matkul: req.params.kode_matkul });

    res.render('edit-matkul', {
        title: 'Form Ubah Data Matkul',
        layout: 'layouts/main-layout',
        matkul,
    });
});

// proses ubah data
app.put('/matkul', 
[
    body('kode_matkul').custom(async (value, { req }) => {
        const duplikat = await Matkul.findOne({ kode_matkul: value});
        if(value !== req.body.oldKodematkul && duplikat) {
            throw new Error('kode matkul sudah ada');
        }
        return true;
    }),
    check ('nama_matkul', 'Nama sudah ada!'),
    check ('sks', ''),
    check ('semester', ''),
    check ('nama_prodi', ''),
 ], 
 (req, res)=> {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
    res.render('edit-matkul', {
        title: 'Form Ubah Data Matkul',
        layout: 'layouts/main-layout',
        errors: errors.array(),
        matkul: req.body,
    });
    } else {
    Matkul.updateOne(
    { _id: req.body._id },
    {
        $set: {
            kode_matkul: req.body.kode_matkul,
            nama_matkul: req.body.nama_matkul,
            sks: req.body.sks,
            semester: req.body.semester,
            nama_prodi: req.body.nama_prodi,
        },
    })
    .then((result) => {
    // kirimkan flash message
       req.flash('msg', 'Data matkul berhasil diubah!');
       res.redirect('/matkul');

    });
    }

});

// form delete matkul
app.delete('/matkul', (req, res) => {
    Matkul.deleteOne({ kode_matkul: req.body.kode_matkul }).then((result) => {
    req.flash('msg', 'Data matkul berhasil dihapus!');
    res.redirect('/matkul');
  });
});


// halaman prodi
app.get('/prodi', checkUserSession, async (req, res) => {

    const prodis = await Prodi.find();
    
    res.render('prodi', {                           
        layout: 'layouts/main-layout',
        title: 'Halaman Prodi',
        prodis,
        msg: req.flash('msg'),
    });
});

// halaman tambah prodi
app.get('/tambah-prodi', checkUserSession, (req, res) => {
    sess = req.session;
    sess.loggedin = true;
    res.render('add-prodi', {
    title: 'Halaman Tambah Prodi',
    layout: 'layouts/main-layout',
});
});

// halaman form tambah data prodi
app.get('/prodi/add',  checkUserSession, (req, res) => {
res.render('add-prodi', {
    title: 'Form Tambah Data Prodi',
    layout: 'layouts/main-layout',
});
});

// proses tambah data prodi
app.post('/prodi', 
[
    body('kode_prodi').custom(async (value) => {
        const duplikat = await Prodi.findOne({ kode_prodi: value });
        if(duplikat) {
            throw new Error('Kode prodi sudah ada');
        }
        return true;
    }),
    check ('nama_prodi', 'Nama sudah ada!'),
    check ('jenjang', ''),
    
 ], 
 (req, res)=> {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {

    res.render('add-prodi', {
        title: 'Form Tambah Data Prodi',
        layout: 'layouts/main-layout',
        errors: errors.array(),
    });
    } else {
    Prodi.insertMany(req.body, (error, result) => {
    // kirimkan flash message
    req.flash('msg', 'Data Prodi berhasil ditambahkan!');
    res.redirect('/prodi');
    });
    }
});



// halaman form ubah data prodi
app.get('/prodi/edit/:kode_prodi', checkUserSession, async (req, res) => {
    const prodi = await Prodi.findOne({ kode_prodi: req.params.kode_prodi });

    res.render('edit-prodi', {
        title: 'Form Ubah Data Prodi',
        layout: 'layouts/main-layout',
        prodi,
    });
});

// proses ubah data
app.put('/prodi', 
[
    body('kode_prodi').custom(async (value, { req }) => {
        const duplikat = await Prodi.findOne({ kode_prodi: value});
        if(value !== req.body.oldKodeprodi && duplikat) {
            throw new Error('kode prodi sudah ada');
        }
        return true;
    }),
    check ('nama_prodi', 'Nama sudah ada!'),
    check ('jenjang', ''),

 ], 
 (req, res)=> {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
    res.render('edit-prodi', {
        title: 'Form Ubah Data Prodi',
        layout: 'layouts/main-layout',
        errors: errors.array(),
        prodi: req.body,
    });
    } else {
    Prodi.updateOne(
    { _id: req.body._id },
    {
        $set: {
            kode_prodi: req.body.kode_prodi,
            nama_prodi: req.body.nama_prodi,
            jenjang: req.body.jenjang,
        },
    })
    .then((result) => {
    // kirimkan flash message
       req.flash('msg', 'Data Prodi berhasil diubah!');
       res.redirect('/prodi');

    });
    }

});

// form delete prodi
app.delete('/prodi', (req, res) => {
    Prodi.deleteOne({ kode_prodi: req.body.kode_prodi }).then((result) => {
    req.flash('msg', 'Data prodi berhasil dihapus!');
    res.redirect('/prodi');
  });
});




app.use("/login", (req, res) => {
    res.status(404);
    res.render('404');
  });


app.listen(port, () => {
    console.log(`Mongo Contact App | listening aat http://localhost:${port}`);
});