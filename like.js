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
async function run(cookie) {
    const headers = {
        cookie,
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    };
    const res = await fetch('https://tuchong.com/category/%E6%9C%80%E6%96%B0', { headers })
    const result = await res.text()
    const index = result.indexOf('window.nonce =')
    const nonce = result.slice(index + 16, index + 32)
    logToFeiShu('nonce: ' + nonce)
    fetch("https://tuchong.com/rest/categories/%E6%9C%80%E6%96%B0/recommend", {
        headers,
        "body": null,
        "method": "GET"
    })
        .then((res) => res.json())
        .then(res => {
            res.feedList?.forEach(item => {
                for (let i = 0; i < Math.round(100 * Math.random()); i++)
                    fetch(`https://tuchong.com/rest/2/posts/${item.post_id}/comments?page=1&count=15`);
                const runFlag = Math.random() * 1.5 < 1 // 点赞60%的内容
                if (!runFlag) return;
                fetch("https://tuchong.com/gapi/interactive/favorite", {
                    headers,
                    body: `post_id=${item.post_id}&nonce=${nonce}&referer=&position=community`,
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

const cookies = process.env.TUCHONG_COOKIES.split(',')
async function main() {
    for (const cookie of cookies) {
        await run(cookie);
    }
}
main()
