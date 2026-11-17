const socket_server = "http://localhost:3000";
const sendMessageButton = document.getElementById("compose-send-message");
const messageTextBox = document.getElementById("compose-textbox");
const chatBox = document.getElementById("messages-box");
let url;
let socket;
function appendMessage(data){
    message = document.createElement("p");
            message.innerHTML = data.message;
            message.style.color = data.color;
            console.log(data);
            chatBox.appendChild(message).scrollIntoView();
}
    chrome.tabs.query({active: true, lastFocusedWindow: true}, async (tabs) => {
        url = tabs[0].url;
        console.log(url);
        let color = await browser.storage.local.get(["color"]);
        console.log(color.color);
        let coloralready = color.color != null && color.color != undefined;
        if(!coloralready){
            color = undefined;
        }
        socket = io(socket_server, {
            query: {
                "url":url,
                "color":JSON.stringify(color)
            }
        });
        socket.on("colorassign", async (assignedColor) => {
            if(!coloralready){
                await browser.storage.local.set({ "color": JSON.parse(assignedColor)});
                console.log("Color Assigned");
            }
            
        });
        socket.on("messagescache", (data) => {
            console.log(data);
            data.forEach(appendMessage);
        })
        socket.on("message", appendMessage);
    })
const messageSendFunction = () => {
    console.log(messageTextBox.value);
    socket.emit("message",messageTextBox.value);
    messageTextBox.value = "";
}
messageTextBox.addEventListener("keydown", (event) => {
    if(event.key === "Enter"){
        messageSendFunction();
    }
})
sendMessageButton.addEventListener("click", messageSendFunction);

