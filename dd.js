const fs = require('fs')
console.time('t1')
console.log(Date.now())

// const url = 'https://static-prod.ituchong.com/operation-resource/c4aa_2skQj9isKE97lbWXCwNWUdT1Ha0ueUTu9vUiG2iFc.jpg'
// const url = 'https://5zfyqefjb6rzvlwz.public.blob.vercel-storage.com/avatar/lol紫发美丽女孩Seraphine英雄联盟壁纸_彼岸壁纸.jpg'
const url = 'https://image-cdn.tuchong.com/weili/smh/1780720602428735489.webp?app_id=wi7cb9992d7e20f283'
fetch(url).then(res => {
    console.timeEnd('t1')
    console.log(Date.now())
    return res.blob()
}).then(async res => {
    console.log(Date.now())
    return res.arrayBuffer();
}).then(res => {
    fs.writeFileSync('./2.jpg', Buffer.from(res))
    console.log(Date.now())
})