/*
机票信息查询
const flight_list = [];
cron: 00 10,18 * * *
const $ = new Env("机票查询");
*/

const axios = require('axios');
const dayjs = require('dayjs');
const nunjucks = require('nunjucks');
const echarts = require('echarts');

// 用户信息
const flight_list = [
  {
    from: '深圳',
    to: '昆明',
    id: '@all'
  }
];

/**
 * 主执行程序
 */
console.log("共检测到：%s个账号", flight_list.length);
for (const item of flight_list) {
  console.log("开始发送账号：%s", item);
  main(item);
}

/**
 * 主程序
 * @param {object} info 用户信息
 */
async function main(info) {
  let flightInfo = {
    qunarPrice: '', // 去哪价格曲线
    oneWayUrl: '',
    oneWay: [], // 单程
    roundTrip: [], // 往返
    qunarLowPrice: [], // 去哪儿低价
  };

  // 单程
  let priceCalendar = await ctripPriceCalendar('Oneway');
  const prices = Object.values(priceCalendar.data.data.oneWayPrice[0]);
  const dates = Object.keys(priceCalendar.data.data.oneWayPrice[0]).map(x => x.substring(4, 6) + '-' + x.substring(6, 9));
  // 往返
  // priceCalendar = await ctripPriceCalendar();
  // const roundPrices = Object.values(priceCalendar.data.data.roundTripPrice[0]);

  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 400,
    height: 350
  });

  // 像正常使用一样 setOption
  chart.setOption({
    animation: false,
    xAxis: {
      type: 'category',
      name: '日期',
      data: [...dates]
    },
    yAxis: {
      type: 'value',
      name: '价格'
    },
    series: [
      {
        data: [...prices],
        type: 'line',
        smooth: true,
        name: '单程'
      }
    ],
    legend: {
      data: ['单程']
    }
  });

  // 输出字符串
  const svgStr = chart.renderToSVGString();
  // 微信推送需要删除,否则无法正常展示
  flightInfo.qunarPrice = svgStr.replace(/<defs[^>]*>[\s\S]*?<\/defs>/g, '');
  flightInfo.oneWayUrl = `https://m.flight.qunar.com/ncs/page/flightlist?depCity=${info.from}&arrCity=${info.to}&goDate=${dayjs().format('YYYY-MM-DD')}&from=touch_index_search&child=0&baby=0&cabinType=0`;

  // 调用 dispose 以释放内存
  chart.dispose();

  // 单程
  let qunarGlobalPriceResult = await qunarGlobalPrice(info.from, info.to);
  for (const item of qunarGlobalPriceResult.cityFlights) {
    for (const flight of item.flights) {
      console.log("%s → %s\t航班号:%s\t价格:%s(%s)\t出发日期:%s\t返回日期:%s\n", info.from, info.to, flight.carrier, flight.price, flight.tip, flight.depDate, flight.backDate ? flight.backDate : 'null');
      flightInfo.oneWay.push({
        schema: item.allPriceSchemaUrl,
        depCity: qunarGlobalPriceResult.depCity,
        arrCity: flight.arrCity,
        tip: flight.tip,
        discountTip: flight.discountTip,
        depDate: flight.depDate,
        backDate: flight.backDate,
        carrier: flight.carrier,
        price: flight.price
      });
    }
  }

  // 往返
  qunarGlobalPriceResult = await qunarGlobalPrice(info.from, info.to, true);
  for (const item of qunarGlobalPriceResult.cityFlights) {
    for (const flight of item.flights) {
      console.log("%s → %s\t航班号:%s\t价格:%s(%s)\t出发日期:%s\t返回日期:%s", info.from, info.to, flight.carrier, flight.price, flight.tip, flight.depDate, flight.backDate ? flight.backDate : 'null');
      flightInfo.roundTrip.push({
        schema: item.allPriceSchemaUrl,
        depCity: qunarGlobalPriceResult.depCity,
        arrCity: flight.arrCity,
        tip: flight.tip,
        discountTip: flight.discountTip,
        depDate: flight.depDate,
        backDate: flight.backDate,
        carrier: flight.carrier,
        price: flight.price
      });
    }
  }

  // 低价机票
  const qunarResult = await qunar(info.from);
  for (const item of qunarResult.data.items) {
    console.log("%s", item.title);
    flightInfo.qunarLowPrice.push(item);
    for (const flight of item.flightInfoList) {
      console.log("%s → %s\t航班号:%s\t票价:%s(%s)\t出发日期:%s(%s)", flight.depCity, flight.arrCity, flight.flightNo, flight.price, flight.discount === undefined ? 'null' : flight.discount, flight.originDepDate, flight.depWeekDay);
    }
    console.log("");
  }

  // 模版路径
  nunjucks.configure('views', {
    autoescape: true
  });

  // 模版渲染
  const html = nunjucks.render('index.html', flightInfo);

  // 发送的html
  // console.log('发送的HTML:\n%s\n', html);

  // 消息推送
  sendMsg(info.id, 'wwe758307ce630ee74', '3YrzZFoqgXdi0Xtyea8fN8-a5u8c_cWHaWsjfiXf8SM', '1000008', '机票信息', '2te06Li1BraZz2ETHA_Gpanu6Y5PwMVT_QsuP4vwH90dcMsqClrJegBnpZHVgVd8V', html, '机票助手', dayjs().format('YYYY-MM-DD HH:mm:ss') + ` 机票信息`);
};

/**
 * 获取access_token
 * @link  https://developer.work.weixin.qq.com/document/path/91039
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
 * @link  https://developer.work.weixin.qq.com/document/path/90236#%E5%9B%BE%E6%96%87%E6%B6%88%E6%81%AF%EF%BC%88mpnews%EF%BC%89
 * @param {string} touser           成员ID列表(多个用|分隔)
 * @param {string} corpid           企业ID
 * @param {string} corpsecret       应用的凭证密钥
 * @param {string} agentid          应用ID
 * @param {string} title            标题(<128字节)
 * @param {string} thumb_media_id   图文素材
 * @param {string} content          图文消息
 * @param {string} author           图文消息作者
 * @param {string} digest           图文消息描述
 */
async function sendMsg(touser, corpid, corpsecret, agentid, title, thumb_media_id, content, author, digest) {
  const token = await getToken(corpid, corpsecret);
  const data = {
    touser,
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
 * @link https://touch.qunar.com/lowFlight/index?cat=touch_flight_home
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
 * 目的地机票查询(endTime时间需要修改)
 * @param {boolean} flag 往返(true)
 * @returns 机票信息
 */
async function qunarGlobalPrice(depCity, arrCity, flag = false) {
  // 单程
  let b = { "uid": "0bc15ef0-8f88-41c2-8501-60197d63c8d3", "sortType": 1, "cat": "touch_flight_home_multiOneWay", "gid": "", "selectPriceCeiling": 0, "selectPriceFloor": 1, "travelDays": [2, 15], "userName": "", "isIos": 2, "tripType": 0, "depTime": { "startTime": "2023-11-19", "endTime": "2024-05-17" }, "depCity": depCity, "conditions": { "newCityList": [arrCity] }, "defaultTravelDays": false, "unite": 1, "qpversion": 120 };
  if (flag) {
    // 往返
    b = { "uid": "0bc15ef0-8f88-41c2-8501-60197d63c8d3", "sortType": 1, "cat": "touch_flight_home_multiOneWay", "gid": "", "selectPriceCeiling": 0, "selectPriceFloor": 1, "travelDays": [2, 15], "userName": "", "isIos": 2, "tripType": 1, "depTime": { "startTime": "2023-11-19", "endTime": "2024-05-17" }, "depCity": depCity, "conditions": { "newCityList": [arrCity] }, "defaultTravelDays": true, "unite": 1, "qpversion": 120, "flyTime": {}, "topics": [], "visas": [] };
  }
  const result = await axios.get(`https://m.flight.qunar.com/hy/proxy/globalPrice/getFlightList?b=${JSON.stringify(b)}`);
  return result.data;
};

/**
 * 携程低价日历
 * @param {string} flightWay eg:Oneway-单程 Roundtrip-往返
 * @returns 
 */
async function ctripPriceCalendar(flightWay) {
  if (flightWay === 'Oneway') {
    return await axios.get(`https://flights.ctrip.com/itinerary/api/12808/lowestPrice?flightWay=Oneway&dcity=SZX&acity=KMG&direct=true`);
  }
  return await axios.get(`https://flights.ctrip.com/itinerary/api/12808/lowestPrice?flightWay=Roundtrip&dcity=SZX&acity=KMG&direct=true`);
};
