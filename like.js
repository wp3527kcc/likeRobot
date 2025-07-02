const headers = {
    cookie: process.env.TUCHONG_COOKIE,
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
};
function fetchReq(url, body, method = 'POST') {
    return fetch(url, {
        headers: {
            "Content-Type": "application/json",
        },
        method,
        body,
    })
};
async function logToFeiShu(
    content,
    webhookUrl = "https://open.feishu.cn/open-apis/bot/v2/hook/ad15802e-b359-451e-931e-78af5fc8c68d",
) {
    const res = await fetchReq(webhookUrl, JSON.stringify({
        card: {
            elements: [
                {
                    tag: "div",
                    text: {
                        tag: "lark_md",
                        content,
                    },
                },
            ],
        },
        msg_type: "interactive",
    }));
    const data = await res.json();
    return data
}


function main() {
    fetch("https://tuchong.com/rest/categories/%E6%9C%80%E6%96%B0/recommend", {
        headers,
        "body": null,
        "method": "GET"
    })
        .then((res) => res.json())
        .then(res => {
            res.feedList.forEach(item => {
                const runFlag = Math.random() * 2.5 < 1 // 点赞40%的内容
                if (!runFlag) return;
                fetch("https://tuchong.com/gapi/interactive/favorite", {
                    headers,
                    body: `post_id=${item.post_id}&nonce=${process.env.TUCHONG_NONCE}&referer=&position=community`,
                    method: "PUT",
                })
                    .then((res) => res.json())
                    .then(console.log)
                    .catch(err => {
                        logToFeiShu('出错了' + err)
                    })
            })
        })
        .catch(err => {
            logToFeiShu('出错了' + err)
        });
}

main()