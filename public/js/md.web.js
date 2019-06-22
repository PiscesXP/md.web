'use strict'
const textTypeArray = [
    {md: "#", html: "h1"},
    {md: "##", html: "h2"},
    {md: "###", html: "h3"},
];
const inlineTypeArray = [
    {md: "*", html: "strong"},
    {md: "**", html: "strong"},
    {md: "_", html: "strong"},
    {md: "__", html: "strong"},
];

/**
 * 转换markdown文本，并append到html node上。
 * */
function mountMarkdown(markDownText, htmlNode) {
    const mdNode = mdText2Html(markDownText);
    htmlNode.appendChild(mdNode);
}

/**
 * @return Html dom of the content
 * */
function mdText2Html(mdText) {
    const rootNode = document.createElement("div");
    if (typeof mdText === "string") {
        let isNextNewLine = false;
        for (const line of mdText.split("\n")) {
            if (line === "") {
                if (isNextNewLine) {
                    rootNode.appendChild(document.createElement("br"));
                }
                isNextNewLine = !isNextNewLine;
            }
            //先声明要添加的html node
            let htmlTagName = null;
            let htmlContent = null;
            //使用正则进行匹配
            const regexp = /^(.*?) (.*)$/;
            const matchResults = regexp.exec(line);
            if (matchResults && matchResults[2] !== "") {
                //带有标签的文本
                htmlContent = matchResults[2];
                for (const type of textTypeArray) {
                    if (matchResults[1] === type.md) {
                        htmlTagName = type.html;
                        break;
                    }
                }
            }
            if (htmlTagName === null) {
                //常规文本(其中可能含有加粗等等标签)
                htmlTagName = "p";
                const regexpBold = /^(.*)(\*{1,2})([^\*]*?)\2(.*)$/;
                const matchResults = regexpBold.exec(line);
                if (matchResults) {
                    console.debug("Found bold text");
                    //before text
                    const beforeText = matchResults[1];
                    const beforeTextNode = document.createElement("p");
                    beforeTextNode.innerText = beforeText;
                    rootNode.appendChild(beforeTextNode);
                    //bold
                    const boldText = matchResults[3];
                    const boldNode = document.createElement("strong");
                    boldNode.innerText = boldText;
                    //rootNode.appendChild(boldNode);
                    beforeTextNode.appendChild(boldNode);
                    //after text
                    const afterText = matchResults[4];
                    const afterTextNode = document.createElement("p");
                    afterTextNode.innerText = afterText;
                    beforeTextNode.appendChild(afterTextNode);


                    //TODO delete this
                    htmlContent = null;
                } else {
                    htmlContent = line;
                }
            }
            //添加到rootNode
            if (htmlContent !== null) {
                const el = document.createElement(htmlTagName);
                el.innerText = htmlContent;
                rootNode.appendChild(el);
                console.debug(`Add ${htmlTagName}, content:${htmlContent}`);
            }
        }
    }
    return rootNode
}