'use strict'
const textTypeArray = [
    {md: "#", html: "h1"},
    {md: "##", html: "h2"},
    {md: "###", html: "h3"},
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
                    console.debug(`Add ${htmlTagName}, content:${htmlContent}`);
                }
            }
            if (htmlTagName === null) {
                //常规文本(其中可能含有加粗等等标签)
                const el = document.createElement("p");
                let remainContent = line; //剩余要处理的内容
                while (remainContent !== "") {
                    console.debug(`Parsing remain:${remainContent}`);

                    let nearestMatchedTypeInfo = null; //离开头最近的一个
                    for (const type of inlineTypeArray) {
                        const regexp = new RegExp(
                            "^(.*?[^\\\\])(?!\\\\)(" + type.md + ")(.*?)\\2(.*)$");
                        const matchResults = regexp.exec(remainContent);
                        if (matchResults) {
                            //比较，如果离开头更近就用它
                            if (nearestMatchedTypeInfo === null ||
                                matchResults[1].length < nearestMatchedTypeInfo.matchResults[1].length) {
                                nearestMatchedTypeInfo = {
                                    type,
                                    matchResults
                                }
                            }
                        }
                    }


                    if (nearestMatchedTypeInfo !== null) {
                        //
                        const {type, matchResults} = nearestMatchedTypeInfo;
                        const content = matchResults[3];
                        console.debug(`Found md type:${type.md}, content:${content}`);
                        const typedElement = document.createElement(type.html);
                        typedElement.innerText = content;
                        el.append(matchResults[1]);  //前面的文本
                        el.appendChild(typedElement);
                        remainContent = matchResults[4];

                    } else {
                        //只剩下纯文本
                        el.append(remainContent);
                        remainContent = "";
                    }

                }
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
        {md: "\\*\\*", html: "i"}
    ];
    //逐个查找匹配的类型
    let nearestMatchedTypeInfo = null; //离开头最近的一个
    for (const inlineType of inlineTypeList) {
        const regexp = new RegExp(
            "^(.*?[^\\\\])(?!\\\\)(" + type.md + ")(.*?)\\2(.*)$");
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
        parentNode.append(text);
    } else {
        //已找到匹配，加入html node并继续
        parentNode.append(nearestMatchedTypeInfo.matchResults[1]);
        const newNode = document.createElement(nearestMatchedTypeInfo.inlineType);
        parseInlineText(nearestMatchedTypeInfo.matchResults[3], newNode);
        parentNode.appendChild(newNode);
    }
}