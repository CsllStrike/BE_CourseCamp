module.exports = (express, con, authenticateToken) => {
    const app = express.Router();

    app.post('/insert-course', authenticateToken, (req, res) => {
        con.query(
            "INSERT INTO course(id_category, nama, kesulitan, deskripsi, sumber, tgl_dibuat, status) VALUES (?, ?, ?, ?, ?, CURRENT_DATE, 0)",
            [
                req.body.id_category,
                req.body.nama,
                req.body.kesulitan,
                req.body.deskripsi,
                req.body.sumber
            ],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ message: "Course berhasil ditambahkan", success: true })
            }
        )
    });

    //mengambil seluruh course untuk ditampilkan pada menu admin
    app.post('/get-courses', authenticateToken, (req, res) => {
        con.query(
            `SELECT 
                crs.nama AS nama_course, 
                ctg.nama AS kategori, 
                crs.kesulitan, 
                COUNT(mdl.id_modul) AS total_modul, 
                crs.tgl_dibuat, 
                crs.status, 
                crs.id_course 
            FROM 
                course crs 
            JOIN 
                category ctg ON ctg.id_category = crs.id_category 
            LEFT JOIN 
                modul mdl ON mdl.id_course = crs.id_course 
            GROUP BY 
                crs.id_course
            ORDER BY 
                crs.id_course DESC`,
            [],
            function (err, result) {
                if (err)
                    throw err;

                res.send(result)
            }
        )
    });

    app.post('/get-all-active-course', (req, res) => {
        con.query(
            `SELECT 
                crs.id_course,
                crs.nama AS nama_course, 
                ctg.nama AS kategori, 
                crs.kesulitan, 
                crs.deskripsi, 
                count(DISTINCT mdl.id_modul) AS jumlah_modul,
                count(DISTINCT l.id_user) AS followed,
                AVG(l.rating) AS rating,
                crs.tgl_dibuat 
            FROM course crs 
            JOIN category ctg ON (ctg.id_category=crs.id_category)
            LEFT JOIN modul mdl ON (mdl.id_course=crs.id_course) 
            LEFT JOIN learn l ON (l.id_course=crs.id_course)
            WHERE crs.status=1
            GROUP BY crs.id_course
            `,
            [],
            function (err, result) {
                if (err)
                    throw err;

                res.send(result)
            }
        )
    });

    app.put('/update-course', authenticateToken, (req, res) => {
        con.query(
            "UPDATE course SET id_category = ?, nama = ?, kesulitan = ?, deskripsi = ?, sumber = ?, status = ? WHERE id_course = ?",
            [
                req.body.id_category,
                req.body.nama,
                req.body.kesulitan,
                req.body.deskripsi,
                req.body.sumber,
                req.body.status,
                req.body.id_course
            ],
            function (err, result) {
                if (err) {
                    throw err;
                }

                if (result.affectedRows === 0) {
                    res.send({ message: "Course tidak mengalami perubahan!", success: false })
                } else if (result.affectedRows === 1) {
                    res.send({ message: "Perubahan berhasil disimpan", success: true })
                } else {
                    res.send({ message: "Something Might Gone Wrong", success: false })
                }
            }
        )
    });

    app.delete('/delete-course', authenticateToken, (req, res) => {// belum ditambahkan jika course sudah diambil oleh user
        con.query(
            (
                req.body.status ?
                    "UPDATE course SET status=0 where id_course = ?"
                    :
                    "SELECT * FROM course crs JOIN modul mdl ON (mdl.id_course=crs.id_course) WHERE crs.id_course=?"
            ),
            [
                req.body.id_course,
            ],
            function (err, result) {
                if (err) {
                    throw err;
                } else {
                    if (req.body.status) {
                        if (result.affectedRows === 0) {
                            res.send({ message: "Course tidak mengalami perubahan!", success: false })
                        } else if (result.affectedRows === 1) {
                            res.send({ message: "Course berhasil dinonaktifkan!", success: true })
                        } else {
                            res.send({ message: "Something Might Gone Wrong!", success: false })
                        }
                    } else {
                        if (result.length > 0) {
                            res.send({ message: "Course ini sudah memiliki modul, silahkan hapus modul terlebih dahulu untuk dapat menghapus course!", success: false })
                        } else {
                            //letak query untuk mengecek sudah dipelajari atau belum
                            con.query("DELETE FROM course where id_course = ?",
                                [
                                    req.body.id_course
                                ],
                                function (err, result) {
                                    if (err) {
                                        throw err;
                                    } else {

                                        if (result.affectedRows === 0) {
                                            res.send({ message: "Course tidak mengalami perubahan!", success: false })
                                        } else if (result.affectedRows === 1) {
                                            res.send({ message: "Course berhasil dihapus!", success: true })
                                        } else {
                                            res.send({ message: "Something Might Gone Wrong", success: false })
                                        }
                                    }
                                }
                            )
                        }
                    }
                }
            }
        )
    });

    app.post('/detail-course/:id', authenticateToken, (req, res) => {
        con.query(
            `SELECT 
                crs.nama, 
                ctg.id_category,
                mc.nama as kategori,
                ctg.nama as subkategori, 
                crs.kesulitan, 
                COUNT(l.id_user) AS followed,
                crs.tgl_dibuat, 
                crs.deskripsi, 
                AVG(l.rating) AS rating,
                COUNT(l.rating) AS rated,
                crs.status 
            FROM course crs 
            JOIN category ctg ON (ctg.id_category=crs.id_category)
            JOIN main_category mc ON (mc.id_main=ctg.id_main) 
            LEFT JOIN learn l ON (l.id_course=crs.id_course)
            WHERE crs.id_course = ? GROUP BY l.id_course`,
            [
                req.params.id
            ],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ result })
            }
        )
    });

    //sama seperti diatas namun lebih difokuskan ke bagian edit
    app.post('/detail-course-edit/:id', authenticateToken, (req, res) => {
        con.query(
            `SELECT 
                crs.nama, 
                mc.id_main as id_main,
                mc.nama as main_kategori,
                ctg.id_category,
                ctg.nama as kategori, 
                crs.kesulitan, 
                crs.deskripsi,
                crs.sumber, 
                crs.status 
            FROM course crs 
            JOIN category ctg ON (ctg.id_category=crs.id_category)
            JOIN main_category mc ON (mc.id_main=ctg.id_main)
            WHERE crs.id_course = ?`,
            [
                req.params.id
            ],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ result })
            }
        )
    });

    app.put('/complete-course', authenticateToken, (req, res) => {
        con.query(
            "UPDATE learn SET tgl_mulai = CURRENT_DATE, status = 1 WHERE id_course = ?",
            [
                req.body.id_course
            ],
            function (err, result) {
                if (err) {
                    throw err;
                }

                if (result.affectedRows === 0) {
                    res.send({ message: "Course tidak mengalami perubahan!", success: false })
                } else if (result.affectedRows === 1) {
                    res.send({ message: "Perubahan berhasil disimpan", success: true })
                } else {
                    res.send({ message: "Something Might Gone Wrong", success: false })
                }
            }
        )
    });

    app.post('/course-by-category', authenticateToken, (req, res) => {
        con.query(
            `SELECT 
                crs.id_course, 
                crs.nama AS nama_course, 
                ctg.nama AS kategori, 
                count(DISTINCT mdl.id_modul) AS total_modul,
                count(DISTINCT l.id_user) AS followed,
                AVG(l.rating) AS rating
            FROM course crs 
            JOIN category ctg ON (ctg.id_category=crs.id_category) 
            LEFT JOIN modul mdl ON (mdl.id_course=crs.id_course) 
            LEFT JOIN learn l ON (l.id_course=crs.id_course)
            WHERE 
                ctg.nama = ?
            AND  
                crs.status = 1 
            GROUP BY crs.id_course`,
            [
                req.body.kategori
            ],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ result })
            }
        )
    });

    app.post('/course-by-name', authenticateToken, (req, res) => {
        con.query(
            `SELECT 
                crs.id_course, 
                crs.nama AS nama_course, 
                ctg.nama AS kategori, 
                count(DISTINCT mdl.id_modul) AS total_modul,
                count(DISTINCT l.id_user) AS followed,
                AVG(l.rating) AS rating
            FROM course crs 
            JOIN category ctg ON (ctg.id_category=crs.id_category) 
            LEFT JOIN modul mdl ON (mdl.id_course=crs.id_course) 
            LEFT JOIN learn l ON (l.id_course=crs.id_course)
            WHERE 
                crs.nama LIKE ?
            AND 
                crs.status = 1 
            GROUP BY crs.id_course`,
            [
                `%${req.body.nama_course}%`
            ],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ result })
            }
        )
    });

    app.post('/count-course', authenticateToken, (req, res) => {
        con.query(
            "SELECT COUNT(*) AS jumlah_course FROM course",
            [],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ result: result[0].jumlah_course })
            }
        )
    })

    app.post('/get-course-comment', authenticateToken, (req, res) => {
        con.query(
            `
            SELECT 
                u.nama, 
                l.rating,
                l.tgl_mulai, 
                l.komentar 
            FROM learn l 
            JOIN users u ON (u.id_user=l.id_user) 
            WHERE l.id_course = ? AND l.komentar !=""
            `,
            [
                req.body.id_course
            ],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ result });
            }
        )
    })

    app.post('/get-course-rating', authenticateToken, (req, res) => {
        con.query(
            `SELECT 
                r.rating,
                COUNT(l.rating) AS jumlah_rating
            FROM 
                (SELECT 1 AS rating UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) AS r
            LEFT JOIN learn l ON r.rating = l.rating AND l.ID_COURSE = ?
            GROUP BY r.rating 
            ORDER BY r.rating DESC;
            `,
            [
                req.body.id_course,
            ],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ result });
            }
        )
    })
    return app;
} 