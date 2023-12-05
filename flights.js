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
  // zhang
  {
    from: '深圳',
    from_code: 'SZX',
    to: '昆明',
    to_code: 'KMG',
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
    info,
    priceSvg: '', // 价格曲线
    tripUrl: '', // 携程url
    qunarUrl: '', // 去哪儿url
    oneWay: [], // 去哪儿单程
    roundTrip: [], // 去哪儿往返
    qunarLowPrice: [], // 去哪儿低价
    tripLowPrice: [], // 携程低价
  };

  // 携程单程
  let priceCalendar = await ctripPriceCalendar('Oneway', info);
  const prices = Object.values(priceCalendar.data.data.oneWayPrice[0]);
  const dates = Object.keys(priceCalendar.data.data.oneWayPrice[0]).map(x => x.substring(4, 6) + '-' + x.substring(6, 9));
  // 往返(暂没想到什么好的表现形式)
  // priceCalendar = await ctripPriceCalendar();
  // const roundPrices = Object.values(priceCalendar.data.data.roundTripPrice[0]);

  // 去哪儿单程日历
  let qunarLowResult = await qunarPriceCalendar(info);
  const qunarLowPrices = qunarLowResult.data.data.gflights.map(x => x.price);

  // 飞猪单程低价日历
  let fliggyResult = await fliggyCalendar(info);
  let fliggyLowPrices = [];
  if (fliggyResult.data.data.cheapestPriceCalendar !== undefined) {
    fliggyLowPrices = fliggyResult.data.data.cheapestPriceCalendar.map(x => x.price);
  }

  // 单程加个曲线展示
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 400,
    height: 350
  });

  chart.setOption({
    animation: false,
    title: {
      text: `${info.from} → ${info.to}`,
      left: '5%',
      textStyle: {
        color: '#2080f0'
      }
    },
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
        name: '携程',
        color: '#FBDB0F'
      },
      {
        data: [...qunarLowPrices],
        type: 'line',
        smooth: true,
        name: '去哪儿',
        color: '#7415DB'
      },
      {
        data: [...fliggyLowPrices],
        type: 'line',
        smooth: true,
        name: '飞猪',
        color: '#AC3B2A'
      }
    ],
    legend: {
      data: ['携程', '去哪儿', '飞猪'],
      right: '10%',
    }
  });

  // 输出字符串
  const svgStr = chart.renderToSVGString();
  // 微信推送需要删除,否则无法正常展示
  flightInfo.priceSvg = svgStr.replace(/<defs[^>]*>[\s\S]*?<\/defs>/g, '');
  flightInfo.tripUrl = `https://m.ctrip.com/html5/flight/pages/middle?dcode=${info.from_code}&acode=${info.to_code}&ddate=${dayjs().format('YYYY-MM-DD')}&tripType=ONE_WAY`;
  flightInfo.qunarUrl = `https://m.flight.qunar.com/ncs/page/flightlist?depCity=${info.from}&arrCity=${info.to}&goDate=${dayjs().format('YYYY-MM-DD')}&from=touch_index_search&child=0&baby=0&cabinType=0`;

  let initUrl = `https://m.ctrip.com/webapp/flightactivity/muse/multiCityList.html?info={"aCityCode":${info.from_code},"aCityName":${info.from},"aCityType":1,"dCityCode":${info.to_code},"dCityName":${info.to_code},"dCityType":1,"departDate":${day().format('YYYY-MM-DD')},"intl":false}&source=theme`;
  flightInfo.tripUrl = encodeURIComponent(initUrl);
  // 调用 dispose 以释放内存
  chart.dispose();

  // 单程
  let qunarGlobalPriceResult = await qunarGlobalPrice(info.from, info.to);
  console.log('单程');
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
  console.log('往返');
  for (const item of qunarGlobalPriceResult.cityFlights) {
    for (const flight of item.flights) {
      console.log("%s → %s\t航班号:%s\t价格:%s(%s)\t出发日期:%s\t返回日期:%s\n", info.from, info.to, flight.carrier, flight.price, flight.tip, flight.depDate, flight.backDate ? flight.backDate : 'null');
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

  // 携程低价榜单
  const tripLowFlightResult = await tripLowFlight(info);
  console.log("携程低价榜");
  tripLowFlightResult.data.routes.map(x => {
    for (const item of x.pl) {
      flightInfo.tripLowPrice.push({
        depCity: x.departCity.name,
        arrCity: x.arriveCity.name,
        depDate: item.departDate,
        price: item.price,
        prePrice: item.prePrice,
        discount: Math.abs(item.rate) * 100,
        jumpUrl: item.jumpUrl
      });
      console.log("%s → %s\t票价:%s(历史价:%s)\t出发日期:%s(折扣:%s)", x.departCity.name, x.arriveCity.name, item.price, item.prePrice, item.departDate, item.rate);
    }
  });
  const tripLowFlightOtherResult = await tripLowFlightOther(info);
  tripLowFlightOtherResult.data.routes.map(x => {
    for (const item of x.pl) {
      flightInfo.tripLowPrice.push({
        depCity: x.departCity.name,
        arrCity: x.arriveCity.name,
        depDate: item.departDate,
        price: item.price,
        prePrice: item.prePrice,
        discount: Math.abs(item.decRate) * 100,
        jumpUrl: item.jumpUrl
      });
      console.log("%s → %s\t票价:%s(历史价:%s)\t出发日期:%s(折扣:%s)", x.departCity.name, x.arriveCity.name, item.price, item.prePrice, item.departDate, item.decRate);
    }
  });

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
 * 目的地机票查询(时间范围:当日-当日+180天)
 * @param {boolean} flag 往返(true)
 * @returns 机票信息
 */
async function qunarGlobalPrice(depCity, arrCity, flag = false) {
  const time = dayjs();
  // 单程
  let b = { "uid": "0bc15ef0-8f88-41c2-8501-60197d63c8d3", "sortType": 1, "cat": "touch_flight_home_multiOneWay", "gid": "", "selectPriceCeiling": 0, "selectPriceFloor": 1, "travelDays": [2, 15], "userName": "", "isIos": 2, "tripType": 0, "depTime": { "startTime": time.format('YYYY-MM-DD'), "endTime": time.add(180, 'day').format('YYYY-MM-DD') }, "depCity": depCity, "conditions": { "newCityList": [arrCity] }, "defaultTravelDays": false, "unite": 1, "qpversion": 120 };
  if (flag) {
    // 往返
    b = { "uid": "0bc15ef0-8f88-41c2-8501-60197d63c8d3", "sortType": 1, "cat": "touch_flight_home_multiOneWay", "gid": "", "selectPriceCeiling": 0, "selectPriceFloor": 1, "travelDays": [2, 15], "userName": "", "isIos": 2, "tripType": 1, "depTime": { "startTime": time.format('YYYY-MM-DD'), "endTime": time.add(180, 'day').format('YYYY-MM-DD') }, "depCity": depCity, "conditions": { "newCityList": [arrCity] }, "defaultTravelDays": true, "unite": 1, "qpversion": 120, "flyTime": {}, "topics": [], "visas": [] };
  }
  const result = await axios.get(`https://m.flight.qunar.com/hy/proxy/globalPrice/getFlightList?b=${JSON.stringify(b)}`);
  return result.data;
};

/**
 * 携程低价日历
 * @param {string} flightWay Oneway-单程 Roundtrip-往返
 * @param {object} info      用户信息
 * @returns 
 */
async function ctripPriceCalendar(flightWay, info) {
  let url = `https://flights.ctrip.com/itinerary/api/12808/lowestPrice?flightWay=${flightWay}&dcity=${info.from_code}&acity=${info.to_code}&direct=true`;
  return await axios.get(url);
};

/**
 * 去哪儿低价日历(默认查询180天)
 * @param {object} info 用户信息
 * @returns 
 */
async function qunarPriceCalendar(info) {
  let url = `https://gw.flight.qunar.com/api/f/priceCalendar?dep=${info.from}&arr=${info.to}&days=180&priceType=1`;
  return await axios.get(url);
}

/**
 * 飞猪低价日历(默认查询365天)
 * @param {object} info 用户信息
 * @returns 
 */
async function fliggyCalendar(info) {
  let data = { depCityCode: info.from_code, arrCityCode: info.to_code, dayNum: 365, h5Version: "1.39.3" };
  let cookie = '_fli_titleHeight=0; _fli_screenDix=1.8115942028985508; miid=406052881856623991; mt=ci%3D-1_0; cna=ymfrHbdUiiECATr6+jqI6sHr; _fli_isNotch=0; l=fBjwkZ4lPu-yn8wZBOfwFurza77OQIRAguPzaNbMi9fP9K195xPAW1Eu-a8pCnGVFsGyR3zzwi5HBeYBc3K-nxvTMXGfHtHmnmOk-Wf..; _samesite_flag_=true; cookie2=19b6a0bb41402363d2aea74ac0b60b52; t=51c6c42a24f81b48b540a02d10a80cc8; _tb_token_=330f3117857b3; _m_h5_tk=5e4398d44c37e6902024c086f955e3fd_1701593113354; _m_h5_tk_enc=12e7b0657b957524a24f6a3c012b4bf2; isg=BMfHIYN9bjL7suqIlNKTlrvBVn2RzJuuEgkW4Zm04tZ9COXKoZyG_pCOr85WvXMm';
  const url = `https://h5api.m.taobao.com/h5/mtop.trip.flight.getCheapestPriceCalendar/1.0?type=originaljson&api=mtop.trip.flight.getCheapestPriceCalendar&v=1.0&data=${encodeURIComponent(JSON.stringify(data))}&needLogin=false&ttid=201300@travel_h5_3.1.0&appKey=12574478&t=1701584482334&sign=63cf6bdb59d373568f68ee4349ff762e`;
  return await axios.get(url, { headers: { cookie: cookie, Host: 'h5api.m.taobao.com' } });
}

/**
 * 携程低价查询(默认查询180天)
 * @param {object} info 用户信息
 * @link https://m.ctrip.com/webapp/flightactivity/muse/index.html
 * @returns 
 */
async function tripLowFlight(info) {
  const time = dayjs();
  let data = {
    "guid": "4692ed20-d63f-4e46-821d-c0af0134756c",
    "tt": 1,
    "st": 11,
    "source": "priceReduction",
    "segments": [
      {
        "dcl": [info.from_code],
        "drl": [
          {
            "begin": time.format('YYYY-MM-DD'),
            "end": time.add(180, 'day').format('YYYY-MM-DD')
          }
        ],
        "acl": [
          "all"
        ]
      }
    ],
    "head": {
      "cid": "09031120316726350642",
      "ctok": "",
      "cver": "",
      "lang": "01",
      "sid": "8888",
      "syscode": "09",
      "auth": "",
      "extension": [
        {
          "name": "protocal",
          "value": "https"
        }
      ]
    }
  };
  return await axios.post('https://m.ctrip.com/restapi/soa2/19728/fuzzySearch?_fxpcqlniredt=09031120316726350642', data);
}

/**
 * 携程其他分类低价查询(默认查询180天)
 * @param {object} info 用户信息
 * @link https://m.ctrip.com/webapp/flightactivity/muse/index.html
 * @returns 
 */
async function tripLowFlightOther(info) {
  let data = {
    "guid": "4692ed20-d63f-4e46-821d-c0af0134756c",
    "source": "theme",
    "st": 14,
    "segments": [
      {
        "dcl": [info.from_code],
      }
    ],
    "head": {
      "cid": "09031120316726350642",
      "ctok": "",
      "cver": "",
      "lang": "01",
      "sid": "8888",
      "syscode": "09",
      "auth": "",
      "extension": [
        {
          "name": "protocal",
          "value": "https"
        }
      ]
    }
  };
  return await axios.post('https://m.ctrip.com/restapi/soa2/19728/fuzzySearch?_fxpcqlniredt=09031120316726350642', data);
}
