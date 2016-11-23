'use strict';

let http = require('http');
let express = require('express');
let app = express();
let oracledb = require('oracledb');
let bodyParser = require('body-parser');
const cors = require('cors')
let PORT = process.env.PORT || 8089;


var originsWhitelist = [
    'http://localhost:9089', //this is my front-end url for development
    'http://www.myproductionurl.com'
];

var corsOptions = {
    origin: function(origin, callback) {
        var isWhitelisted = originsWhitelist.indexOf(origin) !== -1;
        callback(null, isWhitelisted);
    },
    credentials: true
};

app.use(cors(corsOptions));

var router = express.Router([{
    mergeParams: true
}]);

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

const selectVolquetas = "SELECT VO.PLACA, COVL.ID_COLOR, COVL.DESCRIPCION_COLOR AS COLOR_VOLQUETA, MOVO.ID_MODELO, MOVO.DESCRIPCION_MODELO AS MODELO_VOLQUETA, MAVO.ID_MARCA_VOLQUETA, MAVO.NOMBRE_MARCA AS MARCA, EM.NIT AS ID_EMPRESA, EM.NOMBRE AS EMPRESA FROM VOLQUETAS VO" +
    " INNER JOIN COLORES_VOLQUETAS COVL ON VO.ID_COLOR = COVL.ID_COLOR" +
    " INNER JOIN MODELOS_VOLQUETAS MOVO ON VO.ID_MODELO = MOVO.ID_MODELO" +
    " INNER JOIN MARCAS_VOLQUETAS MAVO ON MOVO.ID_MARCA = MAVO.ID_MARCA_VOLQUETA" +
    " INNER JOIN EMPRESAS EM ON VO.ID_EMPRESA = EM.NIT";


let buildUpdateVolquetaStatement = (req) => {
    // ID_COLOR, ID_MODELO, ID_EMPRESA
    let statement = "",
        bindValues = {};
    if (req.body.ID_COLOR) {
        statement += "ID_COLOR = :ID_COLOR";
        bindValues.ID_COLOR = req.body.ID_COLOR;
    }
    if (req.body.ID_EMPRESA) {
        if (statement) statement = statement + ", ";
        statement += "ID_EMPRESA = :ID_EMPRESA";
        bindValues.ID_EMPRESA = req.body.ID_EMPRESA;
    }
    if (req.body.ID_MODELO) {
        if (statement) statement = statement + ", ";
        statement += "ID_MODELO = :ID_MODELO";
        bindValues.ID_MODELO = req.body.ID_MODELO;
    }

    statement += " WHERE PLACA = :PLACA";
    bindValues.PLACA = req.query.PLACA;
    statement = "UPDATE VOLQUETAS SET " + statement;

    console.log({
        statement: statement,
        bindValues: bindValues
    });

    return {
        statement: statement,
        bindValues: bindValues
    };
};


app.put('/volquetas', (req, res) => {

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
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error en la conexión",
                detailed_message: err.message
            }));
            return;
        }

        var updateStatement = buildUpdateVolquetaStatement(req);
        connection.execute(updateStatement.statement, updateStatement.bindValues, {
            autoCommit: true,
            outFormat: oracledb.OBJECT
        }, (err, result) => {
            if (err || result.rowsAffected === 0) {
                // Error
                res.set('Content-Type', 'application/json');
                res.status(400).send(JSON.stringify({
                    status: 400,
                    message: err ? "Hay un error con los parametros" : "No existe una volqueta con esa placa",
                    detailed_message: err ? err.message : ""
                }));
            } else {
                res.status(204).end();
            }

            connection.release(
                function(err) {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log("PUT /volquetas : Connection released");
                    }
                });

        });

    });

});

app.delete('/volquetas', (req, res) => {
    oracledb.getConnection(connectionProperties, (err, connection) => {
        if (err) {
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error en la conexión",
                detailed_message: err.message
            }));
            return;
        }
        connection.execute('DELETE FROM VOLQUETAS WHERE PLACA = :PLACA', [req.query.PLACA], {
            autoCommit: true,
            outFormat: oracledb.OBJECT
        }, (err, result) => {
            if (err || result.rowsAffected === 0) {
                //Error
                res.set('Content-Type', 'application/json');
                res.status(400).send(JSON.stringify({
                    status: 400,
                    message: err ? "No se pudo eliminar la volqueta" : "No existe una volqueta con esa placa",
                    detailed_message: err ? err.message : ""
                }));
            } else {
                res.status(204).end();
            }

            connection.release(
                function(err) {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log("DELETE /volquetas : Connection released");
                    }
                });

        });


    });
});


app.get('/colores', function(req, res) {
    oracledb.getConnection(connectionProperties, (err, connection) => {
        if (err) {
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error en la conexión",
                detailed_message: err.message
            }));
            return;
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

        let statement = "SELECT * FROM MARCAS_VOLQUETAS"

        connection.execute(statement, {}, {
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

        let statement = "SELECT MODELOS_VOLQUETAS.ID_MODELO, MODELOS_VOLQUETAS.DESCRIPCION_MODELO, MARCAS_VOLQUETAS.NOMBRE_MARCA FROM MODELOS_VOLQUETAS INNER JOIN MARCAS_VOLQUETAS ON (MODELOS_VOLQUETAS.ID_MARCA = MARCAS_VOLQUETAS.ID_MARCA_VOLQUETA)";

        if (req.query) {
            if (req.query.ID_MARCA) {
                statement += "WHERE ID_MARCA = " + req.query.ID_MARCA;
            }
        }

        connection.execute(statement, {}, {
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

        connection.execute("SELECT C.ID_CONDUCTOR, C.OBJ_PER_CONDUCTOR.NOMBRE AS NOMBRE, C.OBJ_PER_CONDUCTOR.APELLIDO_1 AS APELLIDO_1 , C.OBJ_PER_CONDUCTOR.APELLIDO_2 AS APELLIDO_2, C.ID_VOLQUETA AS PLACA_VOLQUETA, E.NOMBRE AS EMPRESAS" +
            " FROM CONDUCTORES C" +
            " INNER JOIN VOLQUETAS V ON (C.ID_VOLQUETA = V.PLACA)" +
            " INNER JOIN EMPRESAS E ON (V.ID_EMPRESA = E.NIT)", {}, {
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

app.get('/ventas_entradas', function(req, res) {
    oracledb.getConnection(connectionProperties, (err, connection) => {
        if (err) {
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error en la conexión",
                detailed_message: err.message
            }));
        }

        connection.execute("SELECT VE.ID_VENTA, VE.ID_VOLQUETA AS PLACA, EM.NOMBRE AS EMPRESA, VE.FECHA_VENTA, VE.VALOR_ENTRADA, VE.CANTIDAD_ENTRADAS, VE.ID_USUARIO, US.OBJ_PERSONA_USUARIO.NOMBRE AS NOMBRE_USUARIO" +
            " FROM VENTAS_ENTRADAS VE" +
            " INNER JOIN VOLQUETAS VO ON (VE.ID_VOLQUETA = VO.PLACA)" +
            " INNER JOIN EMPRESAS EM ON (VO.ID_EMPRESA = EM.NIT)" +
            " INNER JOIN USUARIOS US ON (VE.ID_USUARIO = US.ID_USUARIO)", {}, {
                outFormat: oracledb.OBJECT
            }, (err, result) => {
                if (err) {
                    res.status(500).send(JSON.stringify({
                        status: 500,
                        message: "Error al obtener las ventas de las entradas",
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
                    console.log("GET /ventas_entradas : Connection released");
                }
            });

    });
});

app.post('/ventas_entradas', (req, res) => {
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
            "INSERT INTO VENTAS_ENTRADAS" +
            "(ID_VOLQUETA, FECHA_VENTA, VALOR_ENTRADA, CANTIDAD_ENTRADAS, ID_USUARIO) VALUES " +
            "(:ID_VOLQUETA, :FECHA_VENTA, :VALOR_ENTRADA, :CANTIDAD_ENTRADAS, :ID_USUARIO)", [
                req.body.ID_VOLQUETA,
                req.body.FECHA_VENTA ? req.body.FECHA_VENTA : new Date(),
                req.body.VALOR_ENTRADA,
                req.body.CANTIDAD_ENTRADAS,
                req.body.ID_USUARIO
            ], {
                autoCommit: true,
                outFormat: oracledb.OBJECT
            },
            (err, result) => {
                if (err) {
                    res.status(400).send(JSON.stringify({
                        status: 400,
                        message: err.message.indexOf("ORA-00001") > -1 ? "Ya existe una venta con ese id" : "Error al insertar la volqueta",
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
                        console.log("POST /ventas_entradas : Connection liberada");
                    }
                });
            }
        );
    });

});

app.get('/entradas', function(req, res) {
    oracledb.getConnection(connectionProperties, (err, connection) => {
        if (err) {
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error en la conexión",
                detailed_message: err.message
            }));
        }

        connection.execute("SELECT VE.ID_VENTA, VE.ID_VOLQUETA AS PLACA, EM.NOMBRE AS EMPRESA, VE.FECHA_VENTA, VE.VALOR_ENTRADA, VE.CANTIDAD_ENTRADAS, VE.ID_USUARIO, US.OBJ_PERSONA_USUARIO.NOMBRE AS NOMBRE_USUARIO" +
            " FROM VENTAS_ENTRADAS VE" +
            " INNER JOIN VOLQUETAS VO ON (VE.ID_VOLQUETA = VO.PLACA)" +
            " INNER JOIN EMPRESAS EM ON (VO.ID_EMPRESA = EM.NIT)" +
            " INNER JOIN USUARIOS US ON (VE.ID_USUARIO = US.ID_USUARIO)", {}, {
                outFormat: oracledb.OBJECT
            }, (err, result) => {
                if (err) {
                    res.status(500).send(JSON.stringify({
                        status: 500,
                        message: "Error al obtener las ventas de las entradas",
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
                    console.log("GET /ventas_entradas : Connection released");
                }
            });

    });
});
