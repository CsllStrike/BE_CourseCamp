module.exports = (express, con, authenticateToken) => {
    const app = express.Router();

    //untuk pemilihan minat belajar
    // app.get('/get-categories-main-option', (req, res) => {
    //     con.query(
    //         `SELECT c.id_category AS value, CONCAT(c.nama, ' (', mc.nama,')') AS label
    //         FROM main_category mc 
    //         JOIN category c ON c.id_main = mc.id_main`,
    //         [],
    //         function (err, result) {
    //             if (err)
    //                 throw err;

    //             res.send({ result });
    //         }
    //     )
    // });

    //pilihan main kategori
    app.post('/get-maincategories-option', authenticateToken, (req, res) => {
        con.query(
            "SELECT id_main AS value, nama AS label FROM main_category",
            [],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ result });
            }
        )
    });

    //pilihan subkategori
    app.post('/get-subcategories-option', authenticateToken, (req, res) => {
        con.query(
            `SELECT id_category AS value, id_main, nama AS label FROM category`,
            [],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ result });
            }
        )
    });

    //mencari sub kategori berdasarkan nama dari main kategori 
    app.post('/get-categories-by-main-option', authenticateToken, (req, res) => {
        con.query(
            `SELECT c.id_category AS value, c.nama AS label FROM main_category mc 
            JOIN category c ON (c.id_main = mc.id_main) 
            WHERE mc.nama= ?`,
            [
                req.body.nama
            ],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ result });
            }
        )
    });

    //menampilkan kategori skill yang dapat dipelajari oleh pengguna ketika membuat akun
    app.get('/get-skills', (req, res) => {
        con.query(
            `SELECT id_skill AS value, nama AS label FROM skill`,
            [
                req.body.nama
            ],
            function (err, result) {
                if (err)
                    throw err;

                res.send({ result });
            }
        )
    });
    return app;
} 