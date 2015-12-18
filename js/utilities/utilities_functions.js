// Handle window resize timeouts
var rtime = new Date(1, 1, 2000, 12,00,00);
var timeout = false;
var delta = 200;

function shouldResize() {
  $(window).resize(function() {
    rtime = new Date();
    if (timeout === false) {
      timeout = true;
      setTimeout(resizeend, delta);
    }
  });
}

// Reload the page when done resizing
// This is hacky but at least ensures the map is rendered correctly.
function resizeend() {
  if (new Date() - rtime < delta) {
    setTimeout(resizeend, delta);
  } else {
    timeout = false;
    // Disabling this for now as it's not working well on some devices (causing constant reload)
    //window.location=window.location;
  }               
}
