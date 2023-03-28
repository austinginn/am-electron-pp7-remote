//front end
const connected = ts;

const body = document.querySelector('body');
const ipSelect = document.getElementById("ip_select");
const portInput = document.getElementById("port_input");
const connection = document.getElementById("connection");

//check connection
setInterval(() => {
    if(Date.now() - ts > 5000){
        connection.classList.remove('green');
        connection.classList.add('red');
    }
});

//QR
const qrcode = new QRCode(document.getElementById("qr"), {
    text: "https://afumc.org",
    width: 150,
    height: 150,
    colorDark: "#262527",
    colorLight: "#4B565A",
    correctLevel: QRCode.CorrectLevel.H
});

body.addEventListener("keypress", (key) => {
    if (key.key == 'Enter') {
        console.log(ipSelect.value);
        console.log(portInput.value);
        window.api.send("save", {
            ip: ipSelect.value,
            port: portInput.value
        });
    }
})

window.api.receive('render', (data) => {
    console.log("receieved render: ", data);

    //ip
    const ipSelect = document.getElementById("ip_select");
    ipSelect.innerHTML = "";
    data.localIP.forEach(element => {
        let option = document.createElement("option");
        option.text = element
        option.value = element
        ipSelect.appendChild(option);
    });

    ipSelect.value = data.ip;

    //port
    const portInput = document.getElementById("port_input");
    portInput.value = data.port

    //QR
    qrcode.clear();
    qrcode.makeCode("http://" + data.ip + ":8080?ip=" + data.localIP[0] + '&port=' + data.port);
});


window.api.receive('message', (data) => {
    console.log(data);
})

window.api.receive('pulse', (data) => {
    connected = Date.now();
    connection.classList.remove('red');
    connection.classList.remove('green');
});