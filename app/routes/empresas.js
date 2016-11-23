module.exports = (app) => {
    'use strict';
    app.get('/empresas', function(req, res) {
        oracledb.getConnection(connectionProperties, (err, connection) => {
            if (err) {
                res.set('Content-Type', 'application/json');
                res.status(500).send(JSON.stringify({
                    status: 500,
                    message: "Error en la conexión",
                    detailed_message: err.message
                }));
            }

            connection.execute("SELECT * FROM EMPRESAS", {}, {
                outFormat: oracledb.OBJECT
            }, (err, result) => {
                if (err) {
                    res.status(500).send(JSON.stringify({
                        status: 500,
                        message: "Error al obtener las empresas",
                        detailed_message: err.message
                    }));
                } else {
                    res.contentType('application/json').status(200);
                    console.log(result);
                    res.send(JSON.stringify(result.rows));
                }
            });
            connection.release(
                function(err) {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log("GET /user_profiles : Connection released");
                    }
                });

        });
    });

};
