module.exports = (express, con, authenticateToken) => {
    const app = express.Router();

    app.post('/add-learn', authenticateToken, (req, res) => {
        con.beginTransaction(function (err) {
            if (err) {
                throw err;
            }

            con.query(
                "INSERT INTO learn(id_course, id_user, status, tgl_mulai) VALUES (?, ?, 0, CURRENT_DATE)",
                [
                    req.body.id_course,
                    req.body.id_user,
                ],
                function (err, result) {
                    if (err) {
                        con.rollback(function () {
                            throw err;
                        });
                    } else {
                        con.query(
                            `
                            INSERT INTO progress (ID_USER, ID_COURSE, ID_MATERI, STATUS)
                            SELECT
                                ? AS ID_USER,
                                ? AS ID_COURSE,
                                m.ID_MATERI,
                                0 AS STATUS
                            FROM
                                materi m
                            JOIN
                                modul mdl ON m.ID_MODUL = mdl.ID_MODUL
                            WHERE
                                mdl.ID_COURSE = ?`,
                            [
                                req.body.id_user,
                                req.body.id_course,
                                req.body.id_course,
                            ],
                            function (err, result) {
                                if (err) {
                                    con.rollback(function () {
                                        throw err;
                                    });
                                } else {
                                    con.commit(function (err) {
                                        if (err) {
                                            con.rollback(function () {
                                                throw err;
                                            });
                                        }
                                        res.send({ message: "Pembelajaran Telah Dimulai!" });
                                    });
                                }
                            }
                        );
                    }
                }
            );
        });
    });

    app.post('/get-progress-learn', authenticateToken, (req, res) => {
        con.query(
            `
            SELECT 
                crs.nama AS nama_course,
                crs.sumber,
                mdl.id_modul,
                mdl.nama AS nama_modul,
                mtr.id_materi,
                mtr.nama AS nama_materi,
                mtr.is_latihan,
                pgrs.skor,
                pgrs.status
            FROM progress pgrs
            LEFT JOIN MATERI mtr ON mtr.id_materi = pgrs.id_materi
            LEFT JOIN MODUL mdl ON mdl.id_modul = mtr.id_modul
            LEFT JOIN COURSE crs ON crs.id_course = mdl.id_course
            WHERE 
                pgrs.id_user = ? 
            AND 
                crs.id_course = ?
            `,
            [
                req.body.id_user,
                req.body.id_course,
            ],
            function (err, result) {
                if (err)
                    throw err;

                const formattedResult = {
                    nama_course: result[0].nama_course || "",
                    sumber: result[0].sumber,
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
                                is_latihan: row.is_latihan,
                                skor: row.skor,
                                status: row.status
                            });
                        }
                    }
                });
                res.send({ formattedResult });
            }
        )
    })

    app.post('/update-progress', authenticateToken, (req, res) => {
        con.query(
            `UPDATE progress SET status = 1 WHERE id_user = ? AND id_course = ? AND id_materi = ?`,
            [
                req.body.id_user,
                req.body.id_course,
                req.body.id_materi,
            ],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ message: "Progress Success Updated" });
            }
        )
    })

    app.post('/finish-learn', authenticateToken, (req, res) => {
        con.query(
            "UPDATE learn SET status = 1, tgl_selesai = CURRENT_DATE WHERE id_user = ? AND id_course = ?",
            [
                req.body.id_user,
                req.body.id_course
            ],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ message: "Congratulation for finishing this Course!" });
            }
        )
    })

    app.post('/next-progress-learn', authenticateToken, (req, res) => {
        con.query(
            "SELECT id_materi FROM progress WHERE id_user = ? AND id_course = ? AND status=0 LIMIT 1",
            [
                req.body.id_user,
                req.body.id_course,
            ],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ result });
            }
        )
    })

    //mengambil data course yang sudah diambil oleh user
    app.post('/get-all-learn', authenticateToken, (req, res) => {
        con.query(
            `SELECT 
                l.id_course,
                crs.nama, 
                ctg.nama AS kategori, 
                (
                    SELECT AVG(l1.rating) 
                    FROM learn l1 
                    WHERE l.ID_COURSE = l1.ID_COURSE
                ) AS rating,
                COUNT(DISTINCT mdl.id_modul) AS jumlah_modul,
                crs.kesulitan,
                crs.deskripsi,
                l.tgl_mulai,
                l.status,
                (
                    SELECT ROUND(AVG(pr.STATUS) * 100, 2) 
                    FROM progress pr 
                    WHERE 
                        pr.ID_USER = l.ID_USER 
                    AND 
                        pr.ID_COURSE = l.ID_COURSE
                ) AS progress
            FROM 
                learn l 
            JOIN 
                course crs ON l.id_course = crs.id_course 
            JOIN 
                category ctg ON ctg.id_category = crs.id_category 
            LEFT JOIN 
                modul mdl ON mdl.id_course = crs.id_course 
            WHERE 
                l.id_user = ?
            AND 
                crs.status = 1
            GROUP BY 
                l.id_course, l.ID_USER`,
            [
                req.body.id_user,
            ],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ result });
            }
        )
    })

    app.post('/get-all-unfinished-learn', authenticateToken, (req, res) => {
        con.query(
            `SELECT
                l.id_user,
                l.id_course,
                crs.nama,
                ROUND(AVG(p.status) * 100, 2) AS progress,
                MIN(CASE WHEN p.status = 0 THEN p.id_materi END) AS next_materi_id
            FROM
                learn l
            JOIN
                course crs ON l.id_course = crs.id_course
            LEFT JOIN
                progress p ON l.id_user = p.id_user AND l.id_course = p.id_course
            WHERE
                l.id_user = ?
                AND l.status = 0
                AND crs.status = 1
            GROUP BY
                l.id_course, l.id_user
            ORDER BY
                progress DESC`,
            [
                req.body.id_user,
            ],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ result });
            }
        )
    })

    app.post('/get-rating', authenticateToken, (req, res) => {
        con.query(
            "SELECT COALESCE(rating, 0) AS rating, komentar FROM learn WHERE id_course=? AND id_user=?",
            [
                req.body.id_course,
                req.body.id_user
            ],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ result });
            }
        )
    })

    app.post('/update-rating', authenticateToken, (req, res) => {
        con.query(
            "UPDATE learn SET rating = ?, komentar = ? WHERE id_user = ? AND id_course = ?",
            [
                req.body.rating,
                req.body.komentar,
                req.body.id_user,
                req.body.id_course
            ],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ message: "Penilaian berhasil Diubah!" });
            }
        )
    })

    app.post('/add-konten', authenticateToken, (req, res) => {
        con.query(
            "INSERT INTO konten(id_materi, text, url_gambar, url_video) VALUES (?, ?, ?, ?)",
            [
                req.body.id_materi,
                req.body.text,
                req.body.url_gambar,
                req.body.url_video,
            ],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ result });
            }
        )
    })

    app.post('/get-konten', authenticateToken, (req, res) => {
        con.query(
            "SELECT id_materi, id_konten, text, url_gambar, url_video FROM konten WHERE id_materi=?",
            [
                req.body.id_materi,
            ],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ result });
            }
        )
    })

    app.put('/update-konten', authenticateToken, (req, res) => {
        con.query(
            "UPDATE konten SET text = ?, url_gambar = ?, url_video = ? WHERE id_materi = ? AND id_konten = ?",
            [
                req.body.text,
                req.body.url_gambar,
                req.body.url_video,
                req.body.id_materi,
                req.body.id_konten
            ],
            function (err, result) {
                if (err) {
                    throw err;
                }
                if (result.affectedRows === 0) {
                    res.send({ message: "Materi gagal diubah!", success: false })
                } else if (result.affectedRows === 1) {
                    res.send({ message: "Konten berhasil diubah", success: true })
                } else {
                    res.send({ message: "Something Might Gone Wrong", success: false })
                }
            }
        )
    });

    app.delete('/delete-konten', authenticateToken, (req, res) => {
        con.query("DELETE FROM konten where id_konten = ?",
            [
                req.body.id_konten
            ],
            function (err, result) {
                if (err) {
                    throw err;
                } else {
                    if (result.affectedRows === 0) {
                        res.send({ message: "Konten gagal dihapus!", success: false })
                    } else if (result.affectedRows === 1) {
                        res.send({ message: "Konten berhasil dihapus!", success: true })
                    } else {
                        res.send({ message: "Something Might Gone Wrong", success: false })
                    }
                }
            }
        )
    });

    app.post('/add-pertanyaan', authenticateToken, (req, res) => {
        con.query(
            "INSERT INTO latihan( id_materi, pertanyaan, status) VALUES (?, ?, 0)",
            [
                req.body.id_materi,
                req.body.pertanyaan,
            ],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ result });
            }
        )
    })

    app.put('/update-pertanyaan', authenticateToken, (req, res) => {
        con.query(
            "UPDATE latihan SET pertanyaan = ?, status = ? WHERE id_latihan = ?",
            [
                req.body.pertanyaan,
                req.body.status,
                req.body.id_latihan,
            ],
            function (err, result) {
                if (err) {
                    throw err;
                } else {
                    if (result.affectedRows === 0) {
                        res.send({ message: "Pertanyaan gagal diubah!", success: false })
                    } else if (result.affectedRows === 1) {
                        res.send({ message: "Pertanyaan berhasil diubah", success: true })
                    } else {
                        res.send({ message: "Something Might Gone Wrong", success: false })
                    }
                }
            }
        )
    })

    app.post('/get-latihan', authenticateToken, (req, res) => {
        con.query(
            `
            SELECT 
                lat.id_latihan, 
                lat.id_materi, 
                lat.pertanyaan,
                pil.id_pilihan,
                pil.pilihan,
                pil.is_jawaban, 
                lat.status 
            FROM latihan lat
            LEFT JOIN pilihan_jawaban pil ON (pil.id_latihan=lat.id_latihan)
            WHERE 
                lat.id_materi=?
            `,
            [
                req.body.id_materi,
            ],
            function (err, result) {
                if (err)
                    throw err;

                const formattedResult = [];

                if (result.length > 0) {
                    let currentLatihan = null;
                    let currentLatihanIndex = -1;

                    result.forEach(row => {
                        if (row.id_latihan !== currentLatihan) {
                            currentLatihan = row.id_latihan;
                            currentLatihanIndex++;

                            //id_latihan diberikan nama aksi terpaksa karena package
                            formattedResult[currentLatihanIndex] = {
                                aksi: row.id_latihan,
                                id_materi: row.id_materi,
                                pertanyaan: row.pertanyaan,
                                jumlah_pilihan: [],
                                status: row.status
                            };
                        }

                        if (row.id_pilihan) {
                            formattedResult[currentLatihanIndex].jumlah_pilihan.push({
                                id_pilihan: row.id_pilihan,
                                pilihan: row.pilihan,
                                is_jawaban: row.is_jawaban
                            });
                        }
                    });
                }

                res.send({ formattedResult });
            }
        )
    })

    app.delete('/delete-pertanyaan', authenticateToken, (req, res) => {
        con.query("DELETE FROM latihan where id_latihan = ?",
            [
                req.body.id_latihan
            ],
            function (err, result) {
                if (err) {
                    throw err;
                } else {
                    if (result.affectedRows === 0) {
                        res.send({ message: "Pertanyaan gagal dihapus!", success: false })
                    } else if (result.affectedRows === 1) {
                        res.send({ message: "Pertanyaan berhasil dihapus!", success: true })
                    } else {
                        res.send({ message: "Something Might Gone Wrong", success: false })
                    }
                }
            }
        )
    });

    app.post('/add-pilihan', authenticateToken, (req, res) => {
        con.query("INSERT INTO pilihan_jawaban( id_latihan, pilihan, is_jawaban) VALUES (?, ?, ?)",
            [
                req.body.id_latihan,
                req.body.pilihan,
                req.body.is_jawaban,
            ],
            function (err, result) {
                if (err) {
                    throw err;
                } else {
                    if (result.affectedRows === 0) {
                        res.send({ message: "Pilihan gagal ditambah!", success: false })
                    } else if (result.affectedRows === 1) {
                        res.send({ message: "Pilihan berhasil ditambahkan!", success: true })
                    } else {
                        res.send({ message: "Something Might Gone Wrong", success: false })
                    }
                }
            }
        )
    });

    app.put('/update-pilihan', authenticateToken, (req, res) => {
        con.query("UPDATE pilihan_jawaban SET pilihan = ?, is_jawaban = ? WHERE id_pilihan = ?",
            [
                req.body.pilihan,
                req.body.is_jawaban,
                req.body.id_pilihan,
            ],
            function (err, result) {
                if (err) {
                    throw err;
                } else {
                    if (result.affectedRows === 0) {
                        res.send({ message: "Pilihan gagal diubah!", success: false })
                    } else if (result.affectedRows === 1) {
                        res.send({ message: "Pilihan berhasil diubah!", success: true })
                    } else {
                        res.send({ message: "Something Might Gone Wrong", success: false })
                    }
                }
            }
        )
    });

    app.put('/update-high-score', authenticateToken, (req, res) => {
        con.query("UPDATE progress SET skor = ? WHERE id_course = ? AND id_user = ? AND id_materi = ?",
            [
                req.body.skor,
                req.body.id_course,
                req.body.id_user,
                req.body.id_materi
            ],
            function (err, result) {
                if (err) {
                    throw err;
                } else {
                    if (result.affectedRows === 0) {
                        res.send({ message: "Skor gagal diperbaharui!", success: false })
                    } else if (result.affectedRows === 1) {
                        res.send({ message: "Skor berhasil diperbaharui!", success: true })
                    } else {
                        res.send({ message: "Something Might Gone Wrong", success: false })
                    }
                }
            }
        )
    });

    app.delete('/delete-pilihan', authenticateToken, (req, res) => {
        con.query("DELETE FROM pilihan_jawaban where id_pilihan = ?",
            [
                req.body.id_pilihan
            ],
            function (err, result) {
                if (err) {
                    throw err;
                } else {
                    if (result.affectedRows === 0) {
                        res.send({ message: "Pilihan gagal dihapus!", success: false })
                    } else if (result.affectedRows === 1) {
                        res.send({ message: "Pilihan berhasil dihapus!", success: true })
                    } else {
                        res.send({ message: "Something Might Gone Wrong", success: false })
                    }
                }
            }
        )
    });

    return app;
} 