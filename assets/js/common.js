var g_userName   = localStorage.getItem("WA_username");
var g_loadedFile = "";

var g_senders    = {};
var g_nSenders   = 0;
var g_messages     = [];
var g_itemsPerLoad = 100; // Number of messages loaded when scrolling past in history
var g_currMsgIdx   = 0;

var g_months = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE",
              "JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];

var g_reg  = /(\d{1,2}\/\d{1,2}\/\d{2,4}), (\d{2}:\d{2}) - ([^:]+): (.*)$/;
var g_prevDate = "";


// It all starts here when a new file is loaded
document.getElementById("getFile").onchange = function(e){
    var file = e.target.files[0],
        reader = new FileReader();

    // Set chat name
    let fname = file.name;
    chat_with.innerHTML = fname.substr(0, fname.lastIndexOf('.'));

    reader.onload = () => {
        let file_text = reader.result;
        // Senders are extracted from the file
        [g_nSenders, g_senders] = sendersList(file_text);

        // Save new-lines in messages...
        file_text = file_text.replace(/\n(?!\d{1,2}\/)/g, "<br>");
        // ...and split file by line
        g_messages   = file_text.split('\n');

        // A username is needed to show the user side of the chat
        // If the username is not already saved, ask the user
        if (!(g_userName in g_senders))
            ask_username(g_senders);
        else reset_chat ();
    };

    reader.readAsText(file);
}

function reset_chat () {
    g_prevDate          = "";
    msgs_list.innerHTML = "";

    // Load the first batch of messages
    g_currMsgIdx = g_messages.length;
    load_msg_batch();

    setTimeout(() => {
        msgs_list.scrollTop = msgs_list.scrollHeight;
    },50);
}

function load_msg_batch () {
    let newMsgIdx = g_currMsgIdx - g_itemsPerLoad;
    if (newMsgIdx < 0) newMsgIdx = 0;

    for (let i = g_currMsgIdx-1; i >= newMsgIdx; i-- )
    {
        let newMsg = parse_msg(g_messages[i]);
        if (!newMsg) continue;
        msgs_list.insertBefore(newMsg, msgs_list.children[0]);
    }

    g_currMsgIdx = newMsgIdx;
}

function ask_username(senders)
{
    let block = document.createElement('div');
    let html_list = document.createElement('ul');
    let html_msg    = document.createElement('p');
    html_msg.innerHTML = "Select your name:";

    Object.keys(senders).forEach(e => {
        let li = document.createElement("li");
        let input = document.createElement("input");
        let label = document.createElement("label");
        input.type = "radio";
        input.id   = e;
        label.innerHTML = e;
        label.setAttribute("for", e);

        input.onchange = (e) => {
            g_userName = input.id;
            localStorage.setItem("WA_username", g_userName);
            reset_chat();
        }
        
        li.appendChild(input);
        li.appendChild(label);
        html_list.appendChild(li);
    }); 
    
    block.appendChild(html_msg);
    block.appendChild(html_list);
    showElemAsMessage(block)
}

function showElemAsMessage (elem)
{
    let wrap = document.createElement("div");
    let html_msgblk = document.createElement('div');

    elem.classList.add('message');
    html_msgblk.classList.add('msg_block');

    html_msgblk.appendChild(elem);
    wrap.appendChild(html_msgblk);
    msgs_list.appendChild(wrap);
    msgs_list.scrollTop = msgs_list.scrollHeight;
}

// Attempt to extract senders from a subset of the text
function sendersList (text)
{
    let newSenders = {};
    let nSenders   = 0;
    let evalText = text.substr(0, 5000);
    let matches = Array.from(evalText.matchAll(/- (.{3,50}?):/gm));

    for (let m of matches)
    {
        let name = m[1];
        if (name in newSenders) continue;
        let hue = Math.floor(Math.random()*360);
        let lum = Math.floor(Math.random()*20+60);
        newSenders[name] = `hsl(${hue}, 50%, ${lum}%)`;
        nSenders++;
    }

    return [nSenders, newSenders];
}

function parse_msg (line)
{
    let m = line.match(g_reg); 
    if (!m) return false;

    let mdate   = m[1], mhour = m[2],
        msender = m[3], mmsg  = m[4],
        mSenderClr = "";

    // Sender
    mSenderClr = g_senders[msender];

    // Date
    if (g_prevDate != mdate && g_prevDate != "") 
    {
        dateArr = g_prevDate.split("/");
        g_prevDate = `${g_months[dateArr[0]-1]} ${dateArr[1]}, ${dateArr[2]}`;

        let html_date = document.createElement('div');
        let html_datewrp = document.createElement('div');
        html_date.classList.add('date');
        html_date.innerHTML = g_prevDate;
        html_datewrp.appendChild(html_date);
        html_datewrp.style.textAlign = 'center';
        msgs_list.insertBefore(html_datewrp, msgs_list.children[0]);
    }

    g_prevDate = mdate;

    // Create HTML
    let html_msgwrp = document.createElement('div');
    let html_msgblk = document.createElement('div');
    let html_msg    = document.createElement('p');
    let html_sender = document.createElement('span');
    let html_hour   = document.createElement('span');

    html_msgblk.classList.add('msg_block');
    html_msg.classList.add('message');
    html_hour.classList.add('hr');

    if (mmsg.length < 50) html_msgblk.classList.add('min');
    if (g_userName == msender) html_msgwrp.classList.add('me');

    if (mmsg.indexOf("(file attached)") > -1)
        mmsg = mmsg.replace(/([\w-]+\.[A-z]{3,4}) \(file attached\)/, (m0, m1) => {
            return `<img src="WA_imgs/${m1}" />`;
        });
    else if (mmsg.toLowerCase().indexOf("<media omitted>") > -1)
        mmsg = "[Media Omitted]";

    html_msg.innerHTML = mmsg;

    if (g_nSenders > 2) html_sender.innerHTML = msender;
    html_hour.innerHTML   = mhour;

    html_sender.style.color = mSenderClr;

    html_msgblk.appendChild(html_sender);
    html_msgblk.appendChild(html_msg);
    html_msgblk.appendChild(html_hour);

    html_msgwrp.appendChild(html_msgblk);
    return html_msgwrp;
}



/****************************************/
/*      Event Listeners & Handlers      */
/****************************************/
trash.onclick = () => {
    localStorage.removeItem("WA_username");
    getFile.value = null;
    g_userName = null;
    let p = document.createElement("p");
    p.innerHTML = "Your username has been removed";
    showElemAsMessage(p);
}

var _lock = false;
msgs_list.addEventListener("scroll", (e) => {
    if (!_lock && msgs_list.scrollTop < 5000)
    {
        console.log("Loading new batch...")
        load_msg_batch();
        _lock = true;
        setTimeout( () => {_lock = false;}, 1000);
    }
})

function resize () {
    msgs_list.style.height = (window.innerHeight - 119) + "px";
}

window.addEventListener("resize", resize);
resize();
