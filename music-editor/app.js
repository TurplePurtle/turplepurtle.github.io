
var editors = document.querySelectorAll(".music-editor-container");
for (var i = 0; i < editors.length; i++) {
    new Musicker.Editor(editors[i]);
}
