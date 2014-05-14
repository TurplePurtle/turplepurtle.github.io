
var imgurUpload = function(data, onsuccess, onfailure) {
    var request = new XMLHttpRequest();
    request.open("POST", "https://api.imgur.com/2/upload.json?key=1b3ed3ea4516d7c4ca0c8b7b4bcdbbf2", true); // PLEASE DON'T STEAL MY KEY OKAY THANKS
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    request.onreadystatechange = function() {
        if (request.readyState === 4) {
            if (request.status === 200) {
                if (typeof onsuccess === "function") {
                    onsuccess(request.responseText);
                }
            } else {
                if (typeof onfailure === "function") {
                    onfailure(request.responseText);
                }
            }
        }
    };
    request.send(data);
};
