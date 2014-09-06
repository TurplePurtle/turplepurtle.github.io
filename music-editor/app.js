
var editorNode = document.querySelector(".music-editor-container");
var editor = new Musicker.Editor(editorNode);
editorNode.scrollTop = (editor.height - editorNode.offsetHeight) / 2;
