
var editors = document.querySelectorAll(".music-editor");
for (var i = 0; i < editors.length; i++) {
    new Musicker.Editor(editors[i]);
}
