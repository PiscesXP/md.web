'use strict';

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
 * @return HTMLDivElement dom of the content
 * */
function mdText2Html(mdText) {
    const rootNode = document.createElement("div");
    if (typeof mdText === "string") {
        let isNextNewLine = false;
        for (const line of mdText.split("\n")) {
            rootNode.appendChild(parseALineText(line));
        }
    }
    return rootNode
}

/**
 * 解析一整行
 * @return HTMLElement
 * */
function parseALineText(text) {
    const regexpHeadings = /^(#{1,6})\s(.*)$/
    if (regexpHeadings.test(text)) {
        //h1-h6
        const {1: sharpString, 2: headingText} = regexpHeadings.exec(text);
        const hNode = document.createElement(`h${sharpString.length}`);
        hNode.innerText = headingText;
        return hNode;
    }
    else {
        const pNode = document.createElement("p");
        parseInlineText(text, pNode);
        return pNode;
    }
}


/**
 * 解析一行里的一部分text，并将结果追加到parentNode.
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
                linkNode.target = "_blank"; //使用新标签打开
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