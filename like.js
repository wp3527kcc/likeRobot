const { neon } = require('@neondatabase/serverless');
require('dotenv').config()
const sql = neon(`${process.env.REMOTE_URL}`);

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
    const logId = await initLog()
    try {
        const res = await fetch('https://tuchong.com/category/%E6%9C%80%E6%96%B0', { headers })
        const result = await res.text()
        const index = result.indexOf('window.nonce =')
        const nonce = result.slice(index + 16, index + 32)
        const recommendRes = await fetch("https://tuchong.com/rest/categories/%E6%9C%80%E6%96%B0/recommend", { headers })
        const recommendResult = await recommendRes.json()
        const promises = []
        recommendResult.feedList?.forEach(item => {
            for (let i = 0; i < Math.round(50 * Math.random()); i++)
                fetch(`https://tuchong.com/rest/2/posts/${item.post_id}/comments?page=1&count=15`);
            const runFlag = Math.random() * 1.5 < 1 // 点赞67%的内容
            if (!runFlag || item.is_favorite) return;
            promises.push(new Promise(resolve => {
                fetch("https://tuchong.com/gapi/interactive/favorite", {
                    headers,
                    body: `post_id=${item.post_id}&nonce=${nonce}&referer=&position=community`,
                    method: "PUT",
                }).then(res => res.json()).then(result => resolve({ ...result, post_id: item.post_id, title: item.title }))
            }))
        })
        const results = await Promise.all(promises)
        const outputJSON = JSON.stringify(results)
        updateLog(logId, outputJSON)
    } catch (err) {
        logToFeiShu('出错了' + err)
    }
}

const cookies = process.env.TUCHONG_COOKIES.split(',')
async function main() {
    for (const cookie of cookies) {
        await run(cookie);
    }
}
main()

async function initLog() {
    const result = await sql.query(`
    INSERT INTO script_execution_logs (
        start_time
    ) VALUES (
        CURRENT_TIMESTAMP
    ) RETURNING id;
 `);
    return result[0].id;
}
async function updateLog(id, outputJSON) {
    await sql.query(`update script_execution_logs set end_time=CURRENT_TIMESTAMP, output='${outputJSON}' where id=${id}`);
}
