const axios = require('axios');
const dayjs = require('dayjs');

/**
 * 获取access_token
 * @param {string} corpid        企业ID
 * @param {string} corpsecret    应用的凭证密钥
 * @returns access_token
 */
async function getToken(corpid, corpsecret) {
  const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpid}&corpsecret=${corpsecret}`;
  try {
    let result = await axios.get(url);
    return result.data.access_token;
  } catch (error) {
    console.log(error);
  }
};

/**
 * 微信应用图文消息推送
 * @param {string} corpid           企业ID
 * @param {string} corpsecret       应用的凭证密钥
 * @param {string} agentid          应用ID
 * @param {string} title            标题(<128字节)
 * @param {string} thumb_media_id   图文素材
 * @param {string} content          图文消息
 * @param {string} author           图文消息作者
 * @param {string} digest           图文消息描述
 */
async function sendMsg(corpid, corpsecret, agentid, title, thumb_media_id, content, author, digest) {
  const token = await getToken(corpid, corpsecret);
  const data = {
    touser: "@all",
    msgtype: "mpnews",
    agentid,
    mpnews: {
      articles: [
        {
          title,
          thumb_media_id,
          author,
          content,
          digest
        }
      ]
    },
    "safe": 0
  };
  const url = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${token}`;
  try {
    const result = await axios.post(url, data);
    if (result.data.errcode === 0) {
      console.log('\n🎉发送成功!🎉\n');
    } else {
      console.log(result.data);
    }
  } catch (error) {
    console.log(error);
  }
}

/**
 * 去哪儿特价机票查询
 * @param {string} locationCity 位置城市 eg: 深圳
 * @returns 机票数据
 */
async function qunar(locationCity) {
  const url = 'https://m.flight.qunar.com/lowFlightInterface/api/getAirLine';
  let data = {
    b: {
      locationCity,
      simpleData: "yes",
      t: "f_urInfo_page_superLow",
      cat: "touch_flight_home_lowFlight-cheap-ticket"
    },
    c: {}
  };
  const result = await axios.post(url, data);
  return result.data;
};

/**
 * 
 * @param {boolean} flag 往返(true)
 * @returns 机票信息
 */
async function qunarGlobalPrice(flag = false) {
  // 单程
  let b = { "uid": "0bc15ef0-8f88-41c2-8501-60197d63c8d3", "sortType": 1, "cat": "touch_flight_home_multiOneWay", "gid": "", "conditions": { "newCityList": ["昆明"] }, "tripType": 0, "depTime": { "startTime": "2023-11-19", "endTime": "2024-05-17" }, "depCity": "深圳", "selectPriceCeiling": 0, "selectPriceFloor": 1, "travelDays": [2, 15], "userName": "", "isIos": 2, "defaultTravelDays": false, "unite": 1, "qpversion": 120 };
  if (flag) {
    // 往返
    b = { "isIos": 2, "depCity": "深圳", "gid": "", "uid": "0bc15ef0-8f88-41c2-8501-60197d63c8d3", "userName": "", "conditions": { "newCityList": ["昆明"] }, "depTime": { "startTime": "2023-11-19", "endTime": "2024-05-17" }, "travelDays": [2, 15], "tripType": 1, "sortType": 1, "selectPriceCeiling": 0, "selectPriceFloor": 1, "cat": "touch_flight_home_multiOneWay", "qpversion": 120, "flyTime": {}, "topics": [], "visas": [], "defaultTravelDays": true, "unite": 1 };
  }
  const result = await axios.get(`https://m.flight.qunar.com/hy/proxy/globalPrice/getFlightList?b=${JSON.stringify(b)}`);
  return result.data;
};

async function main() {
  let html = `<style>
  .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 5px;
    padding: 10px;
    box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;
    margin: 5px 5px;
    height: 70px;
    flex-basis: calc(50% - 30px);
    max-width: calc(50% - 30px);
    text-decoration: none;
  }

  .left {
    display: flex;
    flex-direction: column;
  }

  .title {
    font-weight: bold;
    font-size: 17px;
    padding-bottom: 5px;
    color: #56004F;
  }

  .subtitle {
    color: rgb(153, 153, 153);
    font-size: 13px;
  }

  .right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .discount {
    color: rgb(153, 153, 153);
    font-size: 10px;
  }

  .price {
    font-size: 18px;
    color: rgb(255, 102, 0);
    font-weight: bold;
  }

  .currency {
    font-size: 12px;
    padding-right: 5px;
  }

  .separator {
    border-top: 1px dashed rgb(239, 239, 245);
    margin: 10px 0;
  }
  
  .main-title {
    font-weight: bold;
    padding-left: 5px;
    font-size: 18px;
    color: #BE002F;
  }
</style>
`;

  // 单程
  qunarGlobalPriceResult = await qunarGlobalPrice();
  html += `<div class="main-title">单程</div>`;
  for (const item of qunarGlobalPriceResult.cityFlights) {
    for (const flight of item.flights) {
      console.log("航班号:%s 价格:%s(%s) 出发日期:%s 返回日期:%s", flight.carrier, flight.price, flight.tip, flight.depDate, flight.backDate);

      html += `<a href="${item.allPriceSchemaUrl}" class="container" style="min-height:100px; max-width:100%">
    <div class="left">
      <div class="title">${qunarGlobalPriceResult.depCity} → ${flight.arrCity}</div>
      <div class="subtitle">${flight.depDate}</div>
    </div>
    <div class="right">
      <div class="discount">${flight.tip === undefined ? '' : flight.discountTip}(${flight.tip})</div>
      <div class="price"><span class="currency">¥</span>${flight.price}</div>
    </div>
  </a>`;
    }
    html += `<div class="separator"></div>`;
  }

  // 往返
  qunarGlobalPriceResult = await qunarGlobalPrice(true);
  html += `<div class="main-title">往返</div>`;
  for (const item of qunarGlobalPriceResult.cityFlights) {
    for (const flight of item.flights) {
      console.log("航班号:%s 价格:%s(%s) 出发日期:%s 返回日期:%s", flight.carrier, flight.price, flight.tip, flight.depDate, flight.backDate);

      html += `<a href="${item.allPriceSchemaUrl}" class="container" style="min-height:100px; max-width:100%">
    <div class="left">
      <div class="title">${qunarGlobalPriceResult.depCity} ↔ ${flight.arrCity}</div>
      <div class="subtitle">${flight.depDate}(去)</div>
      <div class="subtitle">${flight.backDate}(回)</div>
    </div>
    <div class="right">
      <div class="discount">${flight.tip === undefined ? '' : flight.discountTip}(${flight.tip})</div>
      <div class="price"><span class="currency">¥</span>${flight.price}</div>
    </div>
  </a>`;
    }
    html += `<div class="separator"></div>`;
  }

  // 低价机票
  const qunarResult = await qunar("深圳");
  for (const item of qunarResult.data.items) {
    console.log("%s", item.title);
    html += `<div class="main-title">${item.title}</div>`;
    html += `<div style="display: flex; flex-wrap: wrap; justify-content: center">`;
    for (const flight of item.flightInfoList) {
      console.log("出发地:%s 目的地:%s 航班号:%s 票价:%s(%s) 出发日期:%s(%s)", flight.depCity, flight.arrCity, flight.flightNo, flight.price, flight.discount, flight.originDepDate, flight.depWeekDay);
      html += `<a href="${flight.scheme}" class="container">
      <div class="left">
        <div class="title">${flight.depCity} ${flight.backWeekDay === undefined ? '→' : '↔'}  ${flight.arrCity}</div>
        <div class="subtitle">${flight.originDepDate} ${flight.depWeekDay}</div>
      </div>
      <div class="right">
        <div class="discount">${item.title === '国内降价榜' ? `均价¥${flight.averagePrice}` : flight.discount === undefined ? '' : flight.discount}</div >
      <div class="price"><span class="currency">¥</span>${flight.price}</div>
      </div>
    </a >`;
    }
    html += `</div > <div class="separator"></div>`;
  }

  // 发送的html
  console.log('html:%s', html);

  // 消息推送
  sendMsg('wwe758307ce630ee74', '3YrzZFoqgXdi0Xtyea8fN8-a5u8c_cWHaWsjfiXf8SM', '1000008', '机票信息', '2te06Li1BraZz2ETHA_Gpanu6Y5PwMVT_QsuP4vwH90dcMsqClrJegBnpZHVgVd8V', html, '机票助手', dayjs().format('YYYY-MM-DD HH:mm:ss') + ` 机票信息`);
};

main();

