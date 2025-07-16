const { neon } = require('@neondatabase/serverless');
const cron = require('node-cron');
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
async function run(cookie, userName) {
    const headers = {
        cookie,
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    };
    const logId = await initLog(userName)
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
        updateLog(logId, results)
    } catch (err) {
        logToFeiShu('出错了' + err)
    }
}

async function main() {
    const cookies = await sql.query(`select * from tuchong_cookies`)
    for (const item of cookies) {
        await run(item.cookie, item.userName);
    }
}
const redisUrl = 'https://brief-kid-53738.upstash.io/incr/' + process.env.REDIS_KEY;
async function initLog(userName) {
    const rr = await fetch(redisUrl, {
        headers: {
            Authorization: `Bearer ${process.env.REDIS_TOKEN}`,
        }
    });
    const { result: count } = await rr.json();
    if (count % 100 === 99) logToFeiShu(`当前执行次数：${count}`);
    console.log(`当前执行次数：${count}，执行时间：${new Date()}`);
    const result = await sql.query(`
    INSERT INTO script_execution_logs (
        start_time,
        "userName"
    ) VALUES (
        CURRENT_TIMESTAMP,
        '${userName}'
    ) RETURNING id;
 `);
    return result[0].id;
}
async function updateLog(id, output) {
    await sql.query(`update script_execution_logs set end_time=CURRENT_TIMESTAMP, output='${JSON.stringify(output)}', effect_rows=${output.length} where id=${id}`);
}
cron.schedule('*/2 8-21 * * *', () => {
    setTimeout(() => {
        main();
    }, Math.random() * 1000)
});
// main()