/*
工作日办公考勤打卡提醒
早上 08:40 08:50 09:00 提醒
下午 18:00 18:10 18:20 提醒

cron: 00,10,20,40,50 8,18 * * *
const $ = new Env("考勤提醒");
*/

const { sendNotify } = require('../sendNotify');
const dayjs = require('dayjs');
const { isWorkday } = require('chinese-workday');

let now = dayjs();
let today = now.format('YYYY-MM-DD');
let hour = now.get('hour');
let minute = now.get('minute');

let title = '签到提醒';
let subtitle = '💼 上班啦!';
let time = '⏰ 现在是 ' + now.format('YYYY-MM-DD HH:mm:ss');
let remind = '📝 记得签到哦！';

// 判断是否是工作日
if(isWorkday(today)){
    if(hour > 17 && (minute >= 0 && minute <= 30) ) {
        title = '💼 签退提醒';
        subtitle = '下班啦!';
        remind = '📝 记得签退哦！';

        // 发送消息
        sendNotify(title, `${subtitle}\n${time}\n${remind}`, {}, '\n');
    }
    
    if(hour < 12 && (minute <= 50 && minute >= 30 || minute == 0)) {
        // 发送消息
        sendNotify(title, `${subtitle}\n${time}\n${remind}`, {}, '\n');
    }
}

console.log(time);
console.log('工作日: %s', isWorkday(today));