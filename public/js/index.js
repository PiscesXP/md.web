const editor = document.querySelector("#markDownEditor");
const outputNode = document.querySelector("#markDownOutput");
const refreshInterval = 100;
let timer = null;
if (editor) {
    //初始化时生成一次
    mountMarkdown(editor.value, outputNode);
    //添加listener
    editor.addEventListener("input", () => {
            if (timer === null) {
                timer = setTimeout(() => {
                    mountMarkdown(editor.value, outputNode);
                    timer = null;
                }, refreshInterval);
            }
        }
    )
} else {
    console.debug("Editor not found.")
}