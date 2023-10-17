var wrapper = document.getElementById("signature-pad");
var clearButton = wrapper.querySelector("[data-action=clear]");
var undoButton = wrapper.querySelector("[data-action=undo]");
var savePNGButton = wrapper.querySelector("[data-action=save-png]");
var canvas = wrapper.querySelector("canvas");
var signaturePad = new SignaturePad(canvas, {
  // It's Necessary to use an opaque color when saving image as JPEG;
  // this option can be omitted if only saving as PNG or SVG
  backgroundColor: 'rgb(255, 255, 255)'
});

// Adjust canvas coordinate space taking into account pixel ratio,
// to make it look crisp on mobile devices.
// This also causes canvas to be cleared.
function resizeCanvas() {
  // When zoomed out to less than 100%, for some very strange reason,
  // some browsers report devicePixelRatio as less than 1
  // and only part of the canvas is cleared then.
  var ratio =  Math.max(window.devicePixelRatio || 1, 1);

  // This part causes the canvas to be cleared
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  canvas.getContext("2d").scale(ratio, ratio);

  // This library does not listen for canvas changes, so after the canvas is automatically
  // cleared by the browser, SignaturePad#isEmpty might still return false, even though the
  // canvas looks empty, because the internal data of this library wasn't cleared. To make sure
  // that the state of this library is consistent with visual state of the canvas, you
  // have to clear it manually.
  signaturePad.clear();
}

// On mobile devices it might make more sense to listen to orientation change,
// rather than window resize events.
window.onresize = resizeCanvas;
resizeCanvas();

function download(dataURL, filename) {
  var blob = dataURLToBlob(dataURL);
  var url = window.URL.createObjectURL(blob);

  var a = document.createElement("a");
  a.style = "display: none";
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();

  window.URL.revokeObjectURL(url);
}

// One could simply use Canvas#toBlob method instead, but it's just to show
// that it can be done using result of SignaturePad#toDataURL.
function dataURLToBlob(dataURL) {
  // Code taken from https://github.com/ebidel/filer.js
  var parts = dataURL.split(';base64,');
  var contentType = parts[0].split(":")[1];
  var raw = window.atob(parts[1]);
  var rawLength = raw.length;
  var uInt8Array = new Uint8Array(rawLength);

  for (var i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

clearButton.addEventListener("click", function (event) {
  signaturePad.clear();
});

undoButton.addEventListener("click", function (event) {
  var data = signaturePad.toData();

  if (data) {
    data.pop(); // remove the last dot or line
    signaturePad.fromData(data);
  }
});

function checkFormAndButton() {
  const submitButton = document.querySelector('input.hs-button[type="submit"]');
  console.log("Button: ", submitButton);
  const forms = document.querySelectorAll('form.hs-form');

  if (forms.length > 0 && submitButton) {
    const sigForm = forms[0];
    console.log('Form found:', sigForm);

    // Add an event listener to the form submit button
    submitButton.addEventListener("click", function (event) {
      // Check if the signature pad is empty
      if (signaturePad.isEmpty()) {
        // Prevent form submission if the signature pad is empty
        event.preventDefault();
        alert("Please provide a signature first.");
      } else {
        // Perform the "save-png" action
        var dataURL = signaturePad.toDataURL();
        download(dataURL, "signature.png");

        // After saving, you can allow the form to submit
        sigForm.submit();
      }
    });

    // Add a listener to enable or disable the submit button based on the signature's status
    signaturePad.onBegin = function () {
      // Enable the submit button when the user starts drawing a signature
      submitButton.disabled = false;
    };

    signaturePad.onEnd = function () {
      // Check if the signature pad is empty when the user finishes drawing
      if (signaturePad.isEmpty()) {
        submitButton.disabled = true;
      }
    };
  } else {
    // The form and button are not found, so check again in 1000 milliseconds (1 second)
    setTimeout(checkFormAndButton, 1000);
  }
}

// Start the initial check
checkFormAndButton();