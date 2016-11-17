'use strict';

var http = require('http');
var express = require('express');
var app = express();
var oracledb = require('oracledb');
var bodyParser = require('body-parser');

app.use(bodyParser.json());

var connectionProperties = {
    user: process.env.DBAAS_USER_NAME || "us_manantial",
    password: process.env.DBAAS_USER_PASSWORD || "12345",
    connectString: process.env.DBAAS_DEFAULT_CONNECT_DESCRIPTOR || "localhost/xe"
};

var PORT = process.env.PORT || 8089;

app.listen(PORT, function() {
    console.log('Server running, Express is listening...\nIn port:' + PORT);
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

const selectVolquetas = "SELECT VO.PLACA, COVL.DESCRIPCION_COLOR AS COLOR_VOLQUETA, MOVO.DESCRIPCION_MODELO AS MODELO_VOLQUETA, MAVO.NOMBRE_MARCA AS MARCA, EM.NOMBRE AS EMPRESA FROM VOLQUETAS VO"+
" INNER JOIN COLORES_VOLQUETAS COVL ON VO.ID_COLOR = COVL.ID_COLOR"+
" INNER JOIN MODELOS_VOLQUETAS MOVO ON VO.ID_MODELO = MOVO.ID_MODELO"+
" INNER JOIN MARCAS_VOLQUETAS MAVO ON MOVO.ID_MARCA = MAVO.ID_MARCA_VOLQUETA"+
" INNER JOIN EMPRESAS EM ON VO.ID_EMPRESA = EM.NIT";
