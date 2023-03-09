"user strict"
const CardColor = {
    "Diamond": 0,
    "Club": 1,
    "Heart": 2,
    "Spade": 3,
}
const PlayerSettleStatus = {
    Winner: 1, // 未出现Tongits胜利时的赢家
    Tongits: 2,    // Tongits胜利的赢家
    Fight: 3,      // 发起决斗且失败
    Challenge: 4,  // 响应决斗，挑战后失败
    Fold: 5,       // 响应决斗，盖牌失败
    Burned: 6,     // 响应决斗，烧牌失败
    Empty: 7,      // Tongits胜利的输家
}
const FightChoice = {
    /** 发起决斗 */
    Fight: 0,
    /** 放弃决斗 */
    Fold: 1,
    /** 挑战决斗 */
    Challenge: 2,
    /** 自动烧毁 */
    Burnt: 3,
    /** 未选择 */
    Unchosen: 4,
}
const statusIconPath = ["", "winner", "tongits", "fight", "challenge", "fold", "burned"];
const colors = ["#23A400", "#E70000"];

/**初始化 */
async function init() {
    // const me=10441;//我方uid，之后要获取真实id
    const content = document.getElementById('content');
    const mid = document.getElementById('mid');
    const items = [];
    // const details = await getData();
    const details = await getDetail(getGameId());
    items.push(getItem());
    for (let i = 0; i < 2; i++) {//创建item
        const it = createItem();
        content.appendChild(it);
        items.push(it);
    }
    items.map((it, i) => {//显示item
        const isWin = i == 0;
        // const isMe = details.userInfoList[i].uid.toString() == me;
        const isMe=isWin;//没有用户id,就只显示胜者为黄色底
        const midPlane = it.getElementsByClassName('midPlane')[0];
        const userInfo = details.userInfoList[i];
        !isMe && setItemNoMe(it);
        const row = addCardGroup(midPlane, userInfo.droppedMeld);

        addHandCardGroup(it.getElementsByClassName('bottomPlane')[0], userInfo.cards);
        setAvatar(it.getElementsByClassName('avatar')[0], userInfo, isWin)
        const midH = row == 1 ? 90 : 160;
        const itemH = row == 1 ? 220 : 290;
        it.style.height = itemH + "px";
        midPlane.style.height = midH + "px";
        it.getElementsByClassName("score")[0].innerText=userInfo.point;
        const reward=it.getElementsByClassName("reward")[0];
        reward.innerText=userInfo.coin;
        reward.style.color=userInfo.coin<0?colors[1]:colors[0];
        showItem(it);
        
    })


    const ddd = content.getElementsByClassName("score")

    // item.hidden=true;
    const gamename = document.getElementById("gamename");
    gamename.innerText = details.name;
    const gametime = document.getElementById("gametime");
    gametime.innerText = isoToTime(details.settleTime);

    mid.style.height = (content.offsetHeight + 30) + "px";
}






/**中间亮牌区添加牌组 */
function addCardGroup(plane, droppedMeld) {
    const groups = droppedMeldToGroups(droppedMeld);
    const cardPos = getPos(groups);
    groups.map((v, i) => {
        v.map((card, index) => {
            const p = revisePos(cardPos.array[i][index]);
            const cardNode = createCard(card.id, p.x, p.y);
            plane.appendChild(cardNode)
            showStar(cardNode,card,false)//之后牌上有对应用户id才改isMycard参数
        })
    })
    return cardPos.rows;
}
/**手牌区添加牌组 */
function addHandCardGroup(plane, cards) {
    if(!cards||cards.length==0)return;
    const groups = getBestGroups(cards);
    const cardPos = getPos(groups);
    groups.map((v, i) => {
        v.map((card, index) => {
            const p = revisePos(cardPos.array[i][index]);
            const cardNode = createCard(card.id, p.x, 0);
            plane.appendChild(cardNode)
            if (index == v.length - 1 &&
                isGroup(v) &&
                isSpecialCombo(v)
                ) {//显示秘密卡组        
                const spe = createSpecified();
                plane.appendChild(spe);
                const w = 42 + 23 * (v.length - 1)
                spe.style.width=w+"px";
                spe.style.top=42+'px';
                spe.style.left= revisePos(cardPos.array[i][0]).x+"px";
            }
            showStar(cardNode,card,true)
        })
    })
}

/**显示星星 */
function showStar(node,card,isMycard){
    if (isMycard && (card.face == 1 || card.face == 13)) {
        const star=document.createElement("img");
        star.src=getImg("bonus_star.png");
        star.className="star";
        node.appendChild(star);
    }
}
/**显示皇冠 */
function showCrown(node,count){
    const crown=document.createElement('div')
    crown.className="crown";
    crown.innerHTML=`
    <img src="../assets/imgs/GameRecord/icon_crown.png" >
    <p></p>
    `
    crown.children[1].innerText=count;
    node.appendChild(crown);
}
/**显示Pot */
function showPot(node){
    const pot=document.createElement("img")
    pot.className="pot";
    pot.src=getImg("icon_pot.png");
    node.appendChild(pot);
}



function getItem() {
    return document.getElementsByClassName("item")[0];
}
function createItem() {
    const item = getItem();
    const a = item.cloneNode(true);
    return a;
}
/**item不为我方时UI */
function setItemNoMe(item) {
    item.style.backgroundColor = "#FCE59E";
    item.style.border = "1px solid #FCE59E";
    const midPlane = item.getElementsByClassName('midPlane')[0];
    midPlane.style.backgroundColor = "#EBC170";
    midPlane.style.height = "120px";
}
function showItem(item) {
    item.style.visibility = "visible"
}

function createCard(id, x, y) {
    const card = document.createElement('div')
    card.className = getCardClass(id);
    card.style.top = y + "px";
    card.style.left = x + "px";
    return card;

}
function getCardClass(id) {
    return `card card_${id}`
}
/**设置头像信息 */
function setAvatar(node, userInfo, isWin) {
    const icon = node.children[0];

    icon.src = userInfo.avatar ?? getImg("default_avatar.png");//头像为空就显示默认头像

    const name = node.children[2];
    name.innerText = userInfo.name;

    const state = node.children[3];
    const pss = toPlayerSettleStatus(userInfo.isTongits, isWin, userInfo.fightChoice);
    setStatusShow(state, pss);//显示结算状态

    const isPot=userInfo.jackPot&&isWin;
    if(isPot){
        showPot(node);
        showCrown(node,userInfo.jackPotCount+1);
    }
}
function getImg(url) {
    return "../assets/imgs/GameRecord/" + url;
}

/**计算最佳牌组 */
function getBestGroups(cardArr) {
    var cards = cardArr.map(c => fromFace(c));
    return CardHelper.getBestGroupsBy(cards)
}
/**明牌变牌组，并调整排序 */
function droppedMeldToGroups(droppedMeld) {
    const mc = [];
    for (const a of droppedMeld) {
        valueSort(a.cards);
        mc.push(a.cards);
    }
    return mc.map(c => c.map(v => fromFace(v)))
}

/**计算卡牌位置 */
function getPos(groups) {
    return CardHelper.getVector3By(groups);
}
/**修正卡牌坐标 */
function revisePos(pos) {
    return { x: pos.x - 20, y: - pos.y - 20 }
}
/**牌数值大小排序 */
function valueSort(ic) {
    ic.sort((a, b) => { return a.value - b.value })
}

/**获取数据 */
async function getData() {
    const a = `
        {"name":"NEWBIE","settleFactor":1,"settleTime":"2023-03-07T11:08:24.577Z","userInfoList":[{"uid":10441,"coin":11.7,"settleInfo":{"jackpot":10.7,"win":2,"tongits":0,"secret_meld":0,"bonus_card":2,"challenge":0,"burnt":2},"name":"stephan, steven","nameDec":"classical","avatar":null,"avatarDec":"classical","fightChoice":0,"point":58,"cards":[{"color":"Diamond","value":3},{"color":"Heart","value":8},{"color":"Spade","value":6},{"color":"Spade","value":7},{"color":"Heart","value":11},{"color":"Spade","value":12},{"color":"Spade","value":3},{"color":"Diamond","value":1},{"color":"Heart","value":10}],"droppedMeld":[{"cards":[{"color":"Club","value":4},{"color":"Diamond","value":4},{"color":"Heart","value":4}],"type":"Pairs"} ,{"cards":[{"color":"Club","value":4},{"color":"Diamond","value":4},{"color":"Heart","value":4},{"color":"Heart","value":4},{"color":"Heart","value":4},{"color":"Heart","value":4},{"color":"Heart","value":4},{"color":"Heart","value":4},{"color":"Heart","value":4},{"color":"Heart","value":4},{"color":"Heart","value":4},{"color":"Heart","value":4}],"type":"Pairs"}  
    ],"isTongits":false,"jackPot":true,"jackPotCount":1},{"uid":10689,"coin":-3,"settleInfo":{"jackpot":-1,"win":-1,"tongits":0,"secret_meld":0,"bonus_card":-1,"challenge":0,"burnt":-1},"name":"Kelley, Kelly","nameDec":"classical","avatar":null,"avatarDec":"classical","fightChoice":3,"point":77,"cards":[{"color":"Spade","value":1},{"color":"Heart","value":9},{"color":"Heart","value":5},{"color":"Diamond","value":5},{"color":"Spade","value":11},{"color":"Heart","value":2},{"color":"Club","value":2},{"color":"Diamond","value":2},{"color":"Spade","value":2},{"color":"Diamond","value":8},{"color":"Diamond","value":11},{"color":"Club","value":9},{"color":"Spade","value":10},{"color":"Heart","value":6}],"droppedMeld":[],"isTongits":false,"jackPot":false,"jackPotCount":1},{"uid":10951,"coin":-3,"settleInfo":{"jackpot":-1,"win":-1,"tongits":0,"secret_meld":0,"bonus_card":-1,"challenge":0,"burnt":-1},"name":"rtrte4","nameDec":"classical","avatar":null,"avatarDec":"classical","fightChoice":3,"point":80,"cards":[{"color":"Heart","value":3},{"color":"Club","value":5},{"color":"Club","value":4},{"color":"Spade","value":9},{"color":"Club","value":2},{"color":"Club","value":6},{"color":"Club","value":11},{"color":"Club","value":13},{"color":"Club","value":7},{"color":"Club","value":8},{"color":"Heart","value":1},{"color":"Diamond","value":9},{"color":"Club","value":12}],"droppedMeld":[],"isTongits":false,"jackPot":false,"jackPotCount":1}]}
    `
    return JSON.parse(a);
}
function fromFace(card) {
    const cardNo = CardColor[card.color] * 13 + card.value;
    return new Card(cardNo);
}
function colorToNumber(color) {
    if (color == CardColor.DIAMOND) return 0;//方块
    if (color == CardColor.CLUB) return 1;//梅花
    if (color == CardColor.HEART) return 2;//红桃
    if (color == CardColor.SPADE) return 3;//黑桃
}
/**时间格式转换 例如：2022/04/11/ 12:00:00*/
function isoToTime(iso) {
    const date = new Date(iso);
    const year = date.getFullYear();
    const month = fill0(date.getMonth() + 1);
    const day = fill0(date.getDate());
    const hour = fill0(date.getHours());
    const minute = fill0(date.getMinutes());
    const second = fill0(date.getSeconds());
    return year + "/" + month + "/" + day + " " + hour + ":" + minute + ":" + second;
}
/**不足两位数填充0 */
function fill0(v) {
    return v < 10 ? "0" + v : v.toString();
}
/**计算状态转换为PlayersettleStatus类型 */
function toPlayerSettleStatus(isTongits, win, fightChoice) {
    if (isTongits) return PlayerSettleStatus.Tongits;
    if (win) return PlayerSettleStatus.Winner;
    if (fightChoice == FightChoice.Unchosen) return PlayerSettleStatus.Empty;
    if (fightChoice == FightChoice.Fight) return PlayerSettleStatus.Fight;
    if (fightChoice == FightChoice.Burnt) return PlayerSettleStatus.Burned;
    if (fightChoice == FightChoice.Fold) return PlayerSettleStatus.Fold;
    if (fightChoice == FightChoice.Challenge) return PlayerSettleStatus.Challenge;
}
/**设置status图片显示和图片路径 */
function setStatusShow(status, pss) {
    if (pss == PlayerSettleStatus.Empty) {
        status.style.visibility = "hidden";
    } else {
        status.style.visibility = "visible";
        status.src = getImg("icon_" + statusIconPath[pss] + ".png")
    }
}

/**
* 判断传入的牌组是否符合组合规则
* 1. 同花顺
* 2. 三张/炸弹
* @param cards
* @returns
*/
function isGroup(cards) {
    if (!cards || cards.length <= 2)
        return false;
    const sortedArray = cards.sort((card1, card2) => card1.face - card2.face);

    const firstCard = sortedArray[0];
    const isBoom = !sortedArray.some(card => card.face !== firstCard.face);

    if (isBoom)
        return true;

    if (sortedArray.some(card => card.suit !== firstCard.suit)) {
        return false
    }

    let isStraight = true;
    sortedArray.forEach((element, idx) => {
        if (element.face !== firstCard.face + idx) {
            isStraight = false;
            return;
        }
    });

    return isStraight;
}

/**
 * 判断组合是否为Special牌
 * @param comboCards 确认组合为有效的Combo
 * @return {boolean} 是SpecialCard返回true, 否则返回false
 */
function isSpecialCombo(comboCards) {
    if (!comboCards || comboCards.length < 3)
        return false;

    if (comboCards[0].face === comboCards[1].face)  // 同花色
        return comboCards.length > 3;
    if (comboCards[0].suit === comboCards[1].suit)
        return comboCards.length > 4
    return false;
}
/**创建秘密卡组绿标 */
function createSpecified() {
    const s = document.createElement("div");
    s.className = "specified";
    s.innerHTML = `<img src="../assets/imgs/GameRecord/text_specifiedcard.png" class="specified_text">`
    // const a=`
    // <div class="specified">
    // <img src="../assets/imgs/GameRecord/text_specifiedcard.png" class="specified_text">
    // </div>
    // `
    return s;
}
init();

