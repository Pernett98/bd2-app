(() => {
    "use strict";

    let empresasModel = {};

    exports.getEmpresas = getEmpresas;

    function getEmpresas(err, result) {
        if (err) {
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error al obtener las empresas",
                detailed_message: err.message
            }));
        } else {
            res.contentType('application/json').status(200);
            res.send(JSON.stringify(result.rows));
        }
    }

})();
