module.exports = (express, con, authenticateToken) => {
    const app = express.Router();

    app.post('/insert-modul', authenticateToken, (req, res) => {
        con.query(
            "INSERT INTO modul(id_course, nama) VALUES (?, ?)",
            [
                req.body.id_course,
                req.body.nama
            ],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ message: "Modul berhasil ditambahkan", success: true })
            }
        )
    });

    app.put('/update-modul', authenticateToken, (req, res) => {
        con.query(
            "UPDATE modul SET nama = ? WHERE id_modul = ?",
            [
                req.body.nama,
                req.body.id_modul
            ],
            function (err, result) {
                if (err) {
                    throw err;
                }

                if (result.affectedRows === 0) {
                    res.send({ message: "Modul tidak mengalami perubahan!", success: false })
                } else if (result.affectedRows === 1) {
                    res.send({ message: "Modul berhasil diubah", success: true })
                } else {
                    res.send({ message: "Something Might Gone Wrong", success: false })
                }
            }
        )
    });

    //dari database secara otomatis cascade delete materi
    app.delete('/delete-modul', authenticateToken, (req, res) => {
        con.query(
            (
                "DELETE FROM modul where id_modul = ?"
            ),
            [
                req.body.id_modul,
            ],
            function (err, result) {
                console.log(req)
                if (err) {
                    throw err;
                } else {
                    if (result.affectedRows === 0) {
                        res.send({ message: "Modul tidak mengalami perubahan!", success: false })
                    } else if (result.affectedRows === 1) {
                        res.send({ message: "Modul berhasil dihapus!", success: true })
                    } else {
                        res.send({ message: "Something Might Gone Wrong", success: false })
                    }
                }
            }
        )
    });

    //mengambil data modul dan materi kemudian merapikan data yang dikirimkan sehingga menjadi lebih singkat
    app.post('/get-modul-materi-course/:id', authenticateToken, (req, res) => {
        con.query(
            `SELECT 
                crs.nama AS nama_course,
                mdl.id_modul,
                mdl.nama AS nama_modul,
                mtr.id_materi,
                mtr.nama AS nama_materi,
                mtr.is_latihan
            FROM COURSE crs
            LEFT JOIN MODUL mdl ON mdl.id_course = crs.id_course
            LEFT JOIN MATERI mtr ON mdl.id_modul = mtr.id_modul
            WHERE 
                crs.id_course = ?
            ORDER BY mdl.id_modul, mtr.id_materi`,
            [
                req.params.id
            ],
            function (err, result) {
                if (err)
                    throw err;

                if (result.length === 0) {
                    return res.status(404).send({ error: 'Course not found' });
                }
                const formattedResult = {
                    nama_course: result[0].nama_course,
                    modul: []
                };

                let currentModule = null;
                let currentModuleIndex = -1;

                result.forEach(row => {
                    if (row.id_modul !== currentModule) {
                        currentModule = row.id_modul;
                        currentModuleIndex++;
                        formattedResult.modul.push({
                            id_modul: row.id_modul,
                            nama_modul: row.nama_modul,
                            materi: []
                        });
                    }
                    if (row.id_modul) {
                        if (row.id_materi) {
                            formattedResult.modul[currentModuleIndex].materi.push({
                                id_materi: row.id_materi,
                                nama_materi: row.nama_materi,
                                is_latihan: row.is_latihan
                            });
                        }
                    }
                });
                res.send({ formattedResult });
            }
        );
    });

    app.post('/insert-materi', authenticateToken, (req, res) => {
        con.query(
            "INSERT INTO materi(id_modul, nama, is_latihan) VALUES (?, ?, ?)",
            [
                req.body.id_modul,
                req.body.nama,
                req.body.is_latihan
            ],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ message: "Materi berhasil ditambahkan", success: true })
            }
        )
    });

    app.put('/update-materi', authenticateToken, (req, res) => {
        con.query(
            "UPDATE materi SET nama = ? WHERE id_materi = ?",
            [
                req.body.nama,
                req.body.id_materi
            ],
            function (err, result) {
                if (err) {
                    throw err;
                }

                if (result.affectedRows === 0) {
                    res.send({ message: "Materi tidak mengalami perubahan!", success: false })
                } else if (result.affectedRows === 1) {
                    res.send({ message: "Materi berhasil diubah", success: true })
                } else {
                    res.send({ message: "Something Might Gone Wrong", success: false })
                }
            }
        )
    });

    app.delete('/delete-materi', authenticateToken, (req, res) => {
        con.query(
            "DELETE FROM materi where id_materi = ?",
            [
                req.body.id_materi
            ],
            function (err, result) {
                if (err) {
                    throw err;
                } else {
                    if (result.affectedRows === 0) {
                        res.send({ message: "Materi tidak mengalami perubahan!", success: false })
                    } else if (result.affectedRows === 1) {
                        res.send({ message: "Materi berhasil dihapus!", success: true })
                    } else {
                        res.send({ message: "Something Might Gone Wrong", success: false })
                    }
                }
            }
        )
    });

    return app;
}  