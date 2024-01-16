module.exports = (express, mysql) => {
  const app = express.Router();

  const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
  });

  db.query("CREATE DATABASE if not exists coursecamp2", function (err, result) {
    if (err) throw err;

    if (!(result.affectedRows == 0)) {//jika database belum pernah dibuat
      const con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "coursecamp2",
        multipleStatements: true
      });

      con.query(
        `            
            create table if not exists USERS
            (
              ID_USER                         INTEGER                not null AUTO_INCREMENT,
              IS_ADMIN                        BOOLEAN              not null    ,
              NAMA                            VARCHAR(30)           not null    ,
              EMAIL                           VARCHAR(20)           not null UNIQUE   ,
              PASSWORD                        VARCHAR(255)          not null    ,
              TGL_MASUK                       DATE                   not null    ,
              constraint PK_USER primary key (ID_USER)
            );
            
            create table if not exists CATEGORY
            ( 
              ID_CATEGORY                     INTEGER                not null AUTO_INCREMENT,
              NAMA                            VARCHAR(30)           not null    ,
              constraint PK_CATEGORY primary key (ID_CATEGORY)
            );
             
            create table if not exists COURSE
            (
              ID_COURSE                       INTEGER                not null AUTO_INCREMENT,
              ID_CATEGORY                     INTEGER               not null    ,
              NAMA                            VARCHAR(30)           not null    ,
              KESULITAN                       VARCHAR(10)           not null    ,
              DESKRIPSI                       VARCHAR(255)          not null    ,
              TGL_DIBUAT                      DATE                  not null    ,
              STATUS                          BOOLEAN              not null    ,
              constraint PK_COURSE primary key (ID_COURSE)
            );
            
            create table if not exists MODUL
            (
              ID_MODUL                        INTEGER                not null AUTO_INCREMENT,
              ID_COURSE                       INTEGER                not null,
              NAMA                            VARCHAR(30)           not null    ,
              constraint PK_MODUL primary key (ID_MODUL)
            );
            
            create index if not exists RELATION_69_FK on MODUL (ID_COURSE asc);
            
            create table if not exists MATERI
            (
              ID_MATERI                       INTEGER                not null AUTO_INCREMENT ON DELETE CASCADE,
              ID_MODUL                        INTEGER                not null,
              NAMA                            VARCHAR(30)           not null    ,
              KONTEN                          VARCHAR(1000)         not null    ,
              URL_VIDEO                       VARCHAR(100)          null    ,
              URL_GAMBAR                      VARCHAR(100)          null    ,
              constraint PK_MATERI primary key (ID_MATERI)
            ); 
            
            create index if not exists RELATION_70_FK on MATERI (ID_MODUL asc);
             
            create table if not exists LATIHAN
            (
              ID_LATIHAN                      INTEGER                not null AUTO_INCREMENT,
              ID_MODUL                        INTEGER                not null,
              SOAL                            VARCHAR(50)           not null,
              constraint PK_LATIHAN primary key (ID_LATIHAN)
            );
            
            create index if not exists RELATION_71_FK on LATIHAN (ID_MODUL asc);
            
            create table if not exists LEARN
            (
              ID_COURSE                       INTEGER                not null,
              ID_USER                         INTEGER                not null,
              RATING                          FLOAT(5)               null    ,
              KOMENTAR                        VARCHAR(30)           null,
              STATUS                          BOOLEAN              not null    ,
              TGL_MULAI                       DATE                   not null    ,
              TGL_SELESAI                     DATE                   null    ,
              constraint PK_LEARN primary key (ID_COURSE, ID_USER)
            );
            
            create table if not exists PILIHAN_JAWABAN
            (
              ID_PILIHAN                      INTEGER                not null AUTO_INCREMENT,
              PILIHAN                         VARCHAR(20)           not null    ,
              JAWABAN                         BOOLEAN              null    ,
              ID_LATIHAN                      INTEGER                not null,
              constraint PK_PILIHAN_JAWABAN primary key (ID_PILIHAN)
            );
            
            create index if not exists RELATION_88_FK on PILIHAN_JAWABAN (ID_LATIHAN asc);
            
            create table if not exists PROGRESS
            (
              ID_MATERI                       INTEGER                not null,
              ID_COURSE                       INTEGER                not null,
              ID_USER                         INTEGER                not null,
              STATUS                          BOOLEAN              not null    ,
              ID_LATIHAN                      INTEGER                not null,
              constraint PK_PROGRESS primary key (ID_MATERI, ID_COURSE, ID_USER, ID_LATIHAN)
            );
            
            create table if not exists MINAT
            ( 
              ID_CATEGORY                     INTEGER                not null,
              ID_USER                         INTEGER                not null,
              constraint PK_MINAT primary key (ID_CATEGORY, ID_USER)
            ); 
  
            INSERT INTO category (nama) 
              SELECT * FROM (SELECT 'C Programming') AS tmp WHERE NOT EXISTS ( SELECT nama FROM category WHERE nama = 'Pemrograman C' ) LIMIT 1;
            INSERT INTO category (nama) 
              SELECT * FROM (SELECT 'Java') AS tmp WHERE NOT EXISTS ( SELECT nama FROM category WHERE nama = 'Java' ) LIMIT 1;
            INSERT INTO category (nama) 
              SELECT * FROM (SELECT 'JavaScript') AS tmp WHERE NOT EXISTS ( SELECT nama FROM category WHERE nama = 'JavaScript') LIMIT 1;
            INSERT INTO category (nama) 
              SELECT * FROM (SELECT 'Web Programming') AS tmp WHERE NOT EXISTS ( SELECT nama FROM category WHERE nama = 'JavaScript') LIMIT 1;
            INSERT INTO category (nama) 
              SELECT * FROM (SELECT 'Mobile Development') AS tmp WHERE NOT EXISTS ( SELECT nama FROM category WHERE nama = 'JavaScript') LIMIT 1;
            `,
        function (err, result) {
          if (err) throw err;
          console.log("Database is Ready");
        }
      );

      //** END REGION DB INITILIZATION **
      con.end()
    }
  });

  return app;
}