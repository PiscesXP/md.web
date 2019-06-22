'use strict'
const textTypeArray = [
    {md: "#", html: "h1"},
    {md: "##", html: "h2"},
    {md: "###", html: "h3"},
    {md: "####", html: "h4"},
    {md: "#####", html: "h5"},
    {md: "######", html: "h6"},
];
const inlineTypeArray = [
    {md: "\\*\\*", html: "i"},
    {md: "__", html: "i"},
    {md: "\\*", html: "strong"},
    {md: "_", html: "strong"},
];

/**
 * 转换markdown文本，并append到html node上。
 * */
function mountMarkdown(markDownText, htmlNode, removeOld = true) {
    const contentNodeID = "markDownContent";
    const contentNode = document.createElement("div");
    contentNode.id = contentNodeID;
    if (removeOld) {
        for (const childNode of htmlNode.childNodes) {
            if (childNode.id === contentNodeID) {
                htmlNode.removeChild(childNode);
            }
        }
    }
    const markdownNode = mdText2Html(markDownText);
    contentNode.appendChild(markdownNode);
    htmlNode.appendChild(contentNode);
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
                //添加到rootNode
                if (htmlTagName !== null) {
                    const el = document.createElement(htmlTagName);
                    el.innerText = htmlContent;
                    rootNode.appendChild(el);
                    //console.debug(`Add ${htmlTagName}, content:${htmlContent}`);
                }
            }
            if (htmlTagName === null) {
                //常规文本(其中可能含有加粗等等标签)
                const el = document.createElement("p");
                parseInlineText(line, el);
                rootNode.appendChild(el);

            }
        }
    }
    return rootNode
}

/**
 * 解析text，并将结果追加到parentNode.
 * @return undefined
 * */
function parseInlineText(text, parentNode) {
    const inlineTypeList = [
        {md: "\\*\\*", html: "i"},
        {md: "__", html: "i"},
        {md: "\\*", html: "strong"},
        {md: "_", html: "strong"},
    ];
    //逐个查找匹配的类型
    let nearestMatchedTypeInfo = null; //离开头最近的一个
    for (const inlineType of inlineTypeList) {
        //这里不考虑转义
        const regexp = new RegExp(
            "^(.*?[^\\\\])(" + inlineType.md + ")(.*?[^\\\\])\\2(.*)$");
        const matchResults = regexp.exec(text);
        if (matchResults) {
            //比较，如果离开头更近就用它
            if (nearestMatchedTypeInfo === null ||
                matchResults[1].length < nearestMatchedTypeInfo.matchResults[1].length) {
                nearestMatchedTypeInfo = {
                    inlineType,
                    matchResults
                }
            }
        }

    }
    if (nearestMatchedTypeInfo === null) {
        //未找到匹配
        //处理链接、图片
        const linkRegexp = /^(.*?)([!]?)\[(.*?)]\((.*?)\)(.*)$/;
        if (linkRegexp.test(text)) {
            const [shit, beforeText, imgPrefix, altText, src, afterText, ...rest] = linkRegexp.exec(text);
            //处理前面的文字
            parseInlineText(beforeText, parentNode);
            if (imgPrefix === "!") {
                //图片
                const imgNode = document.createElement("img");
                imgNode.src = src;
                imgNode.alt = altText;
                parentNode.append(imgNode);
            } else {
                //链接
                const linkNode = document.createElement("a");
                linkNode.href = src;
                linkNode.innerText = altText;
                parentNode.append(linkNode);
            }
            //处理后面的文字
            parseInlineText(afterText, parentNode);
        } else {
            //console.debug(`Non inline text found.`);
            //把转义字符替换掉
            text = text.replace(/\\(.)/g, "$1");
            parentNode.append(text);
        }
    } else {
        //已找到匹配，加入html node并继续
        //console.debug(`Inline text found:${nearestMatchedTypeInfo.inlineType.html}`);
        //console.debug(`Inline text content:${nearestMatchedTypeInfo.matchResults[3]}`);
        parseInlineText(nearestMatchedTypeInfo.matchResults[1], parentNode);
        const newNode = document.createElement(nearestMatchedTypeInfo.inlineType.html);
        parseInlineText(nearestMatchedTypeInfo.matchResults[3], newNode);
        parentNode.appendChild(newNode);
        parseInlineText(nearestMatchedTypeInfo.matchResults[4], parentNode);
    }
}