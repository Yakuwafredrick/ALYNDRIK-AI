// This is a very basic example and often unreliable/performance heavy
    // More sophisticated methods involve detecting changes in debugger status or window size
    document.onkeydown = function(e) {
        if (e.keyCode == 123) { // F12 key
            alert("😡You Fool! Developer Tools are not allowed here!");
            return false;
        }
    };
    // Example for detecting devtools opening (can be flaky)
    (function() {
        var devtools = /./;
        devtools.toString = function() {
            this.opened = true;
        };
        setInterval(function() {
            console.log(devtools);
            console.clear();
            if (devtools.opened) {
                // Do something when devtools are opened
                alert("Hey! Close those dev tools! Now! 😠");
                window.location.href = "about:blank"; // Redirect
                devtools.opened = false; // Reset for next detection
            }
        }, 1000);
    })();