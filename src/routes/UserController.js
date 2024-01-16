module.exports = (express, con, authenticateToken) => {
    var bcrypt = require("bcrypt");
    const jwt = require("jsonwebtoken");

    require('dotenv').config();
    const app = express.Router();

    //generate jwt
    function generateAccessToken(payload) {
        return jwt.sign(payload, process.env.TOKEN_SECRET, { expiresIn: "3d" });
    }

    app.post('/login', (req, res) => {
        con.query(
            "SELECT * FROM users where email = ?",
            [
                req.body.email,
            ],
            async function (err, result) {
                if (err) {
                    throw err
                } else {
                    if (!result[0]) {
                        res.send({ message: "Email tidak ditemukan!", success: false })
                    } else {
                        if (!req.body.password) {
                            res.send({ message: "Password masih kosong", success: false })
                        } else {
                            if (await bcrypt.compare(req.body.password, result[0].PASSWORD)) {
                                const token = generateAccessToken({
                                    uid: result[0].ID_USER,
                                    urn: result[0].NAMA,
                                    isa: result[0].IS_ADMIN,
                                    tma: result[0].TGL_MASUK,
                                });
                                res.send({ token: token, message: "Login Berhasil", success: true });
                            } else {
                                res.send({ message: "Gagal Login, Silahkan coba lagi", success: false })
                            }
                        }
                    }
                }
            }
        )
    });

    app.post('/register', (req, res) => {
        con.query(
            "SELECT * FROM users WHERE email = ?",//query ini untuk mencari apakah emailnya sudah pernah digunakan?
            [
                req.body.email
            ],
            function (err, result) {
                if (err) {
                    throw err
                }
                else if (result[0]) {
                    return res.send({ message: "Email ini sudah digunakan", success: false })
                } else {
                    con.query(
                        "INSERT INTO users(nama, email, password, is_admin, tgl_masuk) VALUES (?, ?, ?, 0, CURRENT_DATE)",
                        [
                            req.body.nama,
                            req.body.email,
                            (bcrypt.hashSync(req.body.password, 10)),
                        ],
                        function (err, result) {
                            if (err) {
                                throw err;
                            }
                            return res.send({ message: "Akun Berhasil dibuat", success: true });
                        }
                    )
                }
            }
        )
    });

    app.put('/change-password/:id', authenticateToken, (req, res) => {
        con.query(
            "SELECT * FROM users WHERE id_user = ?",
            [
                req.params.id
            ],
            async function (err, result) {
                if (err) {
                    throw err
                }

                if (await bcrypt.compare(req.body.passwordLama, result[0].PASSWORD)) {
                    if (req.body.passwordBaru === req.body.conPassword) {
                        con.query(
                            "UPDATE users SET password = ? WHERE id_user = ?",
                            [
                                (bcrypt.hashSync(req.body.passwordBaru, 10)),
                                req.params.id
                            ],
                            function (err, result) {
                                if (err) {
                                    throw err
                                }
                                return res.send({ message: "Password Berhasil diganti", success: true });
                            }
                        )
                    } else {
                        return res.send({ message: "Konfirmasi sandi tidak cocok!", success: false });
                    }
                } else {
                    return res.send({ message: "Kata Sandi Lama Tidak Valid", success: false });
                }
            }
        )
    })

    app.post('/get-id-user', (req, res) => {
        con.query(
            "SELECT id_user FROM users WHERE email = ?",
            [
                req.body.email
            ],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ result });
            }
        )
    });

    app.post('/count-user', authenticateToken, (req, res) => {
        con.query(
            "SELECT COUNT(*) AS jumlah_user FROM users",
            [],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ result: result[0].jumlah_user })
            }
        )
    })

    app.post('/add-minat', (req, res) => {
        con.query(
            "INSERT INTO minat(id_user, id_skill) VALUES (?, ?)",
            [
                req.body.id_user,
                req.body.id_skill,
            ],
            function (err, result) {
                if (err) throw err;

                res.send({ message: "Minat Success Added" });
            }
        )
    });

    app.post('/is-new-user', (req, res) => {
        con.query(
            "SELECT is_new FROM users WHERE id_user=?",
            [
                req.body.id_user,
            ],
            function (err, result) {
                if (err) throw err;
                let is_new = result[0].is_new ? true : false
                res.send({ result: is_new });
            }
        )
    });

    app.post('/update-new-user', (req, res) => {
        con.query(
            "UPDATE users SET is_new=0 WHERE id_user=?",
            [
                req.body.id_user,
            ],
            function (err, result) {
                if (err) throw err;

                res.send({ message: "User has logined to the system" });
            }
        )
    });

    app.post('/minat-recommend', authenticateToken, (req, res) => {
        con.query(
            `
            SELECT 
                s.id_skill,
                s.NAMA AS nama_skill, 
                mc.NAMA AS main_kategori, 
                ctg.id_category,
                ctg.NAMA AS nama_kategori, 
                sc.level 
            FROM 
                minat mnt 
            JOIN skill s ON (s.ID_SKILL=mnt.ID_SKILL) 
            JOIN skill_category sc ON (sc.id_skill=mnt.id_skill) 
            JOIN category ctg ON (ctg.id_category=sc.id_category) 
            JOIN main_category mc ON (mc.id_main=ctg.id_main) 
            WHERE 
                id_user = ?`,
            [
                req.body.id_user,
            ],
            function (err, result) {
                if (err) throw err;

                if (result.length === 0) {
                    return res.status(404).send({ error: 'Recommend not found' });
                }

                const formattedResult = {
                    // nama_skill: result[0].nama_skill,
                    skill: []
                };

                let currentSkill = null;
                let currentSkillIndex = -1;

                result.forEach(row => {
                    if (row.id_skill !== currentSkill) {
                        currentSkill = row.id_skill;
                        currentSkillIndex++;
                        formattedResult.skill.push({
                            id_skill: row.id_skill,
                            nama_skill: row.nama_skill,
                            kategori: []
                        });
                    }
                    if (row.id_skill) {
                        formattedResult.skill[currentSkillIndex].kategori.push({
                            id_kategori: row.id_category,
                            main_kategori: row.main_kategori,
                            nama_kategori: row.nama_kategori,
                            tingkat_kesulitan: row.level
                        });
                    }
                });
                res.send({ result: formattedResult.skill });
            }
        )
    });

    return app;
}  