const express = require("express");
const cors = require('cors');
const app = express();

function coi(req, res, next) {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    next();
}

app.use(cors());
app.use(coi);

app.use(express.static(__dirname));

let server = require("http").createServer(app);
server.listen(80);
console.log("started server");