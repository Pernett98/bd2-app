'use strict';

let http = require('http');
let express = require('express');
let app = express();
let oracledb = require('oracledb');
let bodyParser = require('body-parser');
let PORT = process.env.PORT || 8089;

let connectionProperties = {
    user: process.env.DBAAS_USER_NAME || "us_manantial",
    password: process.env.DBAAS_USER_PASSWORD || "12345",
    connectString: process.env.DBAAS_DEFAULT_CONNECT_DESCRIPTOR || "localhost/xe"
};

app.use(bodyParser.json());

let server = app.listen(PORT, function() {
    let host = server.address().address !== '::' ? server.address().address : '0.0.0.0';
    console.log(server.address());
    console.log('Server running, Express is listening at http://%s:%s', host, PORT);
});

app.get('/', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });
    res.write("No Data Requested, so none is returned");
    res.end();
});

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

app.get('/volquetas', function(req, res) {
    oracledb.getConnection(connectionProperties, (err, connection) => {
        if (err) {
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error en la conexión",
                detailed_message: err.message
            }));
        }

        connection.execute(selectVolquetas, {}, {
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

app.post('/volquetas', (req, res) => {
    "use strict";

    if ("application/json" !== req.get('Content-Type')) {
        res.set('Content-Type', 'application/json').status(415).send(JSON.stringify({
            status: 415,
            message: "Content-Type incorrecto, Solo application/json es soportado",
            detailed_message: null
        }));
        return;
    }

    oracledb.getConnection(connectionProperties, (err, connection) => {
        if (err) {
            //Error en la conexión
            res.set('Content-Type', 'application/json').status(500).send(JSON.stringify({
                status: 500,
                message: "Error al conectarse con la Base de Datos",
                detailed_message: err.message
            }));
            return;
        }

        connection.execute(
            "INSERT INTO VOLQUETAS" +
            "(PLACA, ID_COLOR, ID_MODELO, ID_EMPRESA) VALUES " +
            "(:PLACA, :ID_COLOR, :ID_MODELO, :ID_EMPRESA)", [
                req.body.PLACA,
                req.body.ID_COLOR,
                req.body.ID_MODELO,
                req.body.ID_EMPRESA
            ], {
                autoCommit: true,
                outFormat: oracledb.OBJECT
            },
            (err, result) => {
                if (err) {
                    res.status(400).send(JSON.stringify({
                        status: 400,
                        message: err.message.indexOf("ORA-00001") > -1 ? "Ya existe una volqueta con esa placa" : "Error al insertar la volqueta",
                        detailed_message: err.message
                    }));
                } else {
                    console.log(result);
                    res.status(201).set('Location', '/volquetas').end();
                }
                // Release a la conexión
                connection.release((err) => {
                    if (err) {
                        console.err(err.message);
                    } else {
                        console.log("POST /volquetas : Connection liberada");
                    }
                });
            }
        );
    });

});

const selectVolquetas = "SELECT VO.PLACA, COVL.DESCRIPCION_COLOR AS COLOR_VOLQUETA, MOVO.DESCRIPCION_MODELO AS MODELO_VOLQUETA, MAVO.NOMBRE_MARCA AS MARCA, EM.NOMBRE AS EMPRESA FROM VOLQUETAS VO" +
    " INNER JOIN COLORES_VOLQUETAS COVL ON VO.ID_COLOR = COVL.ID_COLOR" +
    " INNER JOIN MODELOS_VOLQUETAS MOVO ON VO.ID_MODELO = MOVO.ID_MODELO" +
    " INNER JOIN MARCAS_VOLQUETAS MAVO ON MOVO.ID_MARCA = MAVO.ID_MARCA_VOLQUETA" +
    " INNER JOIN EMPRESAS EM ON VO.ID_EMPRESA = EM.NIT";

app.get('/colores', function(req, res) {
    oracledb.getConnection(connectionProperties, (err, connection) => {
        if (err) {
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error en la conexión",
                detailed_message: err.message
            }));
        }

        connection.execute("SELECT * FROM COLORES_VOLQUETAS", {}, {
            outFormat: oracledb.OBJECT
        }, (err, result) => {
            if (err) {
                res.status(500).send(JSON.stringify({
                    status: 500,
                    message: "Error al obtener los colores de las volquetas",
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

app.get('/marcas', function(req, res) {
    oracledb.getConnection(connectionProperties, (err, connection) => {
        if (err) {
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error en la conexión",
                detailed_message: err.message
            }));
        }

        connection.execute("SELECT * FROM MARCAS_VOLQUETAS", {}, {
            outFormat: oracledb.OBJECT
        }, (err, result) => {
            if (err) {
                res.status(500).send(JSON.stringify({
                    status: 500,
                    message: "Error al obtener las marcas de volquetas",
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

app.get('/modelos', function(req, res) {
    oracledb.getConnection(connectionProperties, (err, connection) => {
        if (err) {
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error en la conexión",
                detailed_message: err.message
            }));
        }

        connection.execute("SELECT MODELOS_VOLQUETAS.ID_MODELO, MODELOS_VOLQUETAS.DESCRIPCION_MODELO, MARCAS_VOLQUETAS.NOMBRE_MARCA FROM MODELOS_VOLQUETAS INNER JOIN MARCAS_VOLQUETAS ON (MODELOS_VOLQUETAS.ID_MARCA = MARCAS_VOLQUETAS.ID_MARCA_VOLQUETA)", {}, {
            outFormat: oracledb.OBJECT
        }, (err, result) => {
            if (err) {
                res.status(500).send(JSON.stringify({
                    status: 500,
                    message: "Error al obtener los modelos de volquetas",
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

app.get('/conductores', function(req, res) {
    oracledb.getConnection(connectionProperties, (err, connection) => {
        if (err) {
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error en la conexión",
                detailed_message: err.message
            }));
        }

        connection.execute("SELECT C.ID_CONDUCTOR, C.OBJ_PER_CONDUCTOR.NOMBRE AS NOMBRE, C.OBJ_PER_CONDUCTOR.APELLIDO_1 AS APELLIDO_1 , C.OBJ_PER_CONDUCTOR.APELLIDO_2 AS APELLIDO_2, C.ID_VOLQUETA AS PLACA_VOLQUETA, E.NOMBRE AS EMPRESAS"
        +" FROM CONDUCTORES C"
        +" INNER JOIN VOLQUETAS V ON (C.ID_VOLQUETA = V.PLACA)"
        +" INNER JOIN EMPRESAS E ON (V.ID_EMPRESA = E.NIT)", {}, {
            outFormat: oracledb.OBJECT
        }, (err, result) => {
            if (err) {
                res.status(500).send(JSON.stringify({
                    status: 500,
                    message: "Error al obtener los modelos de volquetas",
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

app.post('/colores', (req, res) => {
    "use strict";

    if ("application/json" !== req.get('Content-Type')) {
        res.set('Content-Type', 'application/json').status(415).send(JSON.stringify({
            status: 415,
            message: "Content-Type incorrecto, Solo application/json es soportado",
            detailed_message: null
        }));
        return;
    }

    oracledb.getConnection(connectionProperties, (err, connection) => {
        if (err) {
            //Error en la conexión
            res.set('Content-Type', 'application/json').status(500).send(JSON.stringify({
                status: 500,
                message: "Error al conectarse con la Base de Datos",
                detailed_message: err.message
            }));
            return;
        }

        connection.execute(
            "INSERT INTO COLORES_VOLQUETAS" +
            "(DESCRIPCION_COLOR) VALUES " +
            "(:DESCRIPCION_COLOR)", [
                req.body.DESCRIPCION_COLOR,
            ], {
                autoCommit: true,
                outFormat: oracledb.OBJECT
            },
            (err, result) => {
                if (err) {
                    res.status(400).send(JSON.stringify({
                        status: 400,
                        message: err.message.indexOf("ORA-00001") > -1 ? "Ya existe una color con esa descripción" : "Error al insertar la color",
                        detailed_message: err.message
                    }));
                } else {
                    console.log(result);
                    res.status(201).set('Location', '/colores').end();
                }
                // Release a la conexión
                connection.release((err) => {
                    if (err) {
                        console.err(err.message);
                    } else {
                        console.log("POST /colores : Connection liberada");
                    }
                });
            }
        );
    });

});
