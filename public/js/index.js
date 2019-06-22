const editor = document.querySelector("#markDownEditor");
const outputNode = document.querySelector("#markDownOutput");
if (editor) {
    //初始化时生成一次
    mountMarkdown(editor.value, outputNode);
    //添加listener
    editor.addEventListener("input", () => {
            mountMarkdown(editor.value, outputNode);
        }
    )
} else {
    console.debug("Editor not found.")
}