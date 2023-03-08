"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var CardSuit;
(function (CardSuit) {
    CardSuit[CardSuit["Diamond"] = 0] = "Diamond";
    CardSuit[CardSuit["Club"] = 1] = "Club";
    CardSuit[CardSuit["Heart"] = 2] = "Heart";
    CardSuit[CardSuit["Spade"] = 3] = "Spade";
})(CardSuit || (CardSuit = {}));
var Card = /** @class */ (function () {
    function Card(id) {
        if (id < 1 || id > 52) {
            throw new Error("Invalid Card number");
        }
        this.id = id;
        this.suit = 0 | ((id - 1) / 13);
        if (id % 13 === 0) {
            this.face = 13;
        }
        else {
            this.face = id % 13;
        }
    }
    Object.defineProperty(Card.prototype, "point", {
        get: function () {
            return this.face > 10 ? 10 : this.face;
        },
        enumerable: false,
        configurable: true
    });
    return Card;
}());
var MeldType;
(function (MeldType) {
    /** 豹子、炸弹 */
    MeldType[MeldType["Pairs"] = 0] = "Pairs";
    /** 同花顺 */
    MeldType[MeldType["StraightFlush"] = 1] = "StraightFlush";
})(MeldType || (MeldType = {}));

var SmallCardRectValue = 42;

var CardHelper;
(function (CardHelper) {
    /**
     * 根据传入卡牌数组获取牌组最优解
     * @param cards 原始数组
     * @param isSecretPriority 是否优先秘密卡组
     * @returns 最优解数组. 所有单牌组成一个组合, 放到牌组末尾返回
     */
    function getBestGroupsBy(cards, isSecretPriority) {
        if (isSecretPriority === void 0) { isSecretPriority = false; }
        var priority = isSecretPriority ? 1 : 2;
        return calculateBestGroups(cards, priority);
    }
    CardHelper.getBestGroupsBy = getBestGroupsBy;
    /**
     * 根据传入卡牌数组获取牌组最优解
     * @param cards 原始数组
     * @param priority 优先级, 1: 秘密卡组优先, 2: 牌组点数最大优先
     * @return 最优解数组. 所有单牌组成一个组合, 放到牌组末尾返回
     */
    function calculateBestGroups(cards, priority) {
        if (priority === void 0) { priority = 2; }
        if (!cards || cards.length <= 0)
            return null;
        var start = Date.now();
        // 1. 排序并找到组合牌
        var sortedCards = cards.sort(function (c1, c2) { return c1.id - c2.id; });
        var straights = getStraights(sortedCards);
        var booms = getSameFaces(sortedCards);
        // console.log(`straights=${straights.map(group => `[${group.map(card => `${card.suit}-${card.face}`)}]`)}`);
        // console.log(`booms=${booms.map(group => `[${group.map(card => `${card.suit}-${card.face}`)}]`)}`);
        // 2. 找出存在交集的牌组
        var totalGroup = straights.concat(booms);
        var duplicateArray = [];
        var unionArray = [];
        var dupCards = new Set();
        for (var i = 0; i < totalGroup.length; i++) {
            var iGroup = totalGroup[i];
            var isUnion = true;
            var _loop_1 = function (j) {
                if (i === j)
                    return "continue";
                var jGroup = totalGroup[j];
                if (iGroup.some(function (iCard) { return jGroup.some(function (jCard) {
                    if (iCard.id === jCard.id) {
                        dupCards.add(iCard);
                        return true;
                    }
                }); })) {
                    isUnion = false;
                    return "break";
                }
            };
            for (var j = 0; j < totalGroup.length; j++) {
                var state_1 = _loop_1(j);
                if (state_1 === "break")
                    break;
            }
            if (isUnion) {
                unionArray.push(iGroup);
            }
            else {
                duplicateArray.push(iGroup);
            }
        }
        // console.log(`duplicateArray=${duplicateArray.map(group => `[${group.map(card => `${card.suit}-${card.face}`)}]`)}`);
        // console.log(`unionArray=${unionArray.map(group => `[${group.map(card => `${card.suit}-${card.face}`)}]`)}`);
        // console.log(`dupCards=${(Array.from(dupCards)).map(card => `${card.suit}-${card.face}`)}`);
        // 3. 处理交集, 计算所有可能的分组
        var dupArray = Array.from(dupCards);
        var totalComboItems = [];
        var _loop_2 = function (i) {
            var group = duplicateArray[i];
            var type = getGroupType(group);
            var groupSplitWays = [];
            groupSplitWays.push(group);
            var _loop_3 = function (j) {
                var card = dupArray[j];
                if (type === MeldType.StraightFlush) {
                    var index = group.findIndex(function (c) { return c.id === card.id; });
                    if (index !== -1) {
                        var brokens = splitGroup(group, index);
                        brokens.forEach(function (array) {
                            if (array.length >= 3 && !isExist(array, groupSplitWays))
                                groupSplitWays.push(array);
                        });
                    }
                }
                else {
                    // _.remove(copy, (c) => c.id === card.id);
                    var copy = group.filter(function (c) { return c.id !== card.id; });
                    if (copy.length >= 3 && !isExist(copy, groupSplitWays))
                        groupSplitWays.push(copy);
                }
            };
            for (var j = 0; j < dupArray.length; j++) {
                _loop_3(j);
            }
            totalComboItems.push(groupSplitWays);
        };
        for (var i = 0; i < duplicateArray.length; i++) {
            _loop_2(i);
        }
        // console.log(`totalComboItems=${totalComboItems.map(groupArray => `【${groupArray.map(group => `[${group.map(card => `${card.suit}-${card.face}`)}]`)}】`)}`);
        // 4. 从所有可能的分组中找到最优解
        var curGroup = [];
        var bestGroup = [];
        var temp = [];
        var exchange = function (curArray) {
            // 牌组点数最大优先
            if (curArray.length <= 0)
                return;
            var prePoint = flattenDeep(bestGroup).map(function (card) { return card.point; }).reduce(function (pre, cur) { return pre + cur; });
            var curPoint = flattenDeep(curArray).map(function (card) { return card.point; }).reduce(function (pre, cur) { return pre + cur; });
            if (curPoint > prePoint) {
                bestGroup.length = 0;
                bestGroup.push.apply(bestGroup, curArray);
            }
        };
        var combine = function (array, index) {
            var _a;
            if (index === void 0) { index = 0; }
            (_a = array[index]) === null || _a === void 0 ? void 0 : _a.forEach(function (groups) {
                temp[index] = groups;
                if (index + 1 < array.length) {
                    combine(array, index + 1);
                }
                else {
                    curGroup.push.apply(curGroup, temp.slice());
                }
                if (curGroup && curGroup.length > 0) {
                    // console.log(`++++++++++++ValidGroup curGroup++++++++++++=${curGroup.map(group => `[${group.map(card => `${card.suit}-${card.face}`)}]`)}`);
                    var validGroup = validGroups(curGroup, priority);
                    // console.log(`++++++++++++ValidGroup final++++++++++++=${validGroup.map(group => `[${group.map(card => `${card.suit}-${card.face}`)}]`)}`);
                    if (bestGroup && bestGroup.length > 0) {
                        if (priority === 2) {
                            // 牌组点数最大优先
                            exchange(validGroup);
                        }
                        else {
                            // 秘密卡组优先
                            /**
                             * 1. 先判断curGroup有没有秘密卡组
                             *      无，若 preGroup 存在，则跳过; 不存在，bestGroup = curGroup;
                             *      有, 先判断preGroup有无秘密卡组，
                             *          无，preGroup = curGroup;
                             *          有, 比较 prePoint 与 curPoint, 若curPoint 点数大，bestGroup = curGroup;
                             */
                            // console.log(`curGroup5555=${validGroup.map(group => `[${group.map(card => `${card.suit}-${card.face}`)}]`)}`);
                            // console.log(`preGroup5555=${bestGroup.map(group => `[${group.map(card => `${card.suit}-${card.face}`)}]`)}`);
                            if (!isContainedSecrets(validGroup)) {
                                if (bestGroup.length <= 0) {
                                    bestGroup.push.apply(bestGroup, validGroup);
                                }
                            }
                            else {
                                if (!isContainedSecrets(bestGroup)) {
                                    bestGroup.length = 0;
                                    bestGroup.push.apply(bestGroup, validGroup);
                                }
                                else {
                                    exchange(validGroup);
                                }
                            }
                        }
                    }
                    else {
                        bestGroup.push.apply(bestGroup, validGroup);
                    }
                    // console.log(`curGroup2222=${validGroup.map(group => `[${group.map(card => `${card.suit}-${card.face}`)}]`)}`);
                    // console.log(`preGroup2222=${bestGroup.map(group => `[${group.map(card => `${card.suit}-${card.face}`)}]`)}`);
                }
                curGroup.length = 0;
            });
        };
        combine(totalComboItems);
        bestGroup.push.apply(bestGroup, unionArray);
        bestGroup.sort(function (a, b) { return computeCardsPoint(b) - computeCardsPoint(a); });
        var singles = sortedCards.filter(function (card) { return flattenDeep(bestGroup).findIndex(function (c) { return c.id === card.id; }) === -1; });
        if (singles && singles.length > 0) {
            var sortedSingles = singles.sort(function (a, b) { return (a.face - b.face); });
            bestGroup.push(sortedSingles);
        }
        else
            bestGroup.push([]);
        var end = Date.now();
        console.log("\u8017\u65F6: ".concat(end - start, "ms"));
        console.log("bestGroup=".concat(bestGroup.map(function (group) { return "[".concat(group.map(function (card) { return "".concat(card.suit, "-").concat(card.face); }), "]"); })));
        return bestGroup;
    }
    function getGroupType(group) {
        var isStraight = false;
        var suit = null;
        group.forEach(function (element) {
            if (suit === null)
                suit = element.suit;
            else
                isStraight = suit === element.suit;
        });
        if (isStraight)
            return MeldType.StraightFlush;
        return MeldType.Pairs;
    }
    /**
     * 卡组是否合规（无重复卡牌）
     * @param groups
     * @returns
     */
    function isValidGroup(groups) {
        // console.log("---------------------isValidGroup----------------------");
        if (!groups || groups.length <= 0)
            return false;
        var array = flattenDeep(groups);
        // console.log(`${array.map(card => `${card.id}(${card.suit}-${card.face})`)}`);
        var ids = array.map(function (card) { return card.id; });
        var set = new Set(ids);
        var isValid = ids.length === set.size;
        // console.log(`groups=${groups.map(group => `[${group.map(card => `${card.suit}-${card.face}`)}]`)}`);
        // console.log(`isValid=${isValid}`);
        // console.log("---------------------isValidGroup----------------------");
        return isValid;
    }
    function isContainedSecrets(groups) {
        var _a;
        return ((_a = (groups === null || groups === void 0 ? void 0 : groups.findIndex(function (group) {
            if (getGroupType(group) === MeldType.Pairs)
                return group.length === 4;
            else
                return group.length >= 5;
        }))) !== null && _a !== void 0 ? _a : -1) !== -1;
    }
    function validGroups(groups, priority) {
        var _a;
        if (priority === void 0) { priority = 2; }
        if (!isValidGroup(groups)) {
            // 不符合规则
            if (priority === 1 && isContainedSecrets(groups)) {
                // 含秘密卡组，首先过滤不含秘密卡组的组合，剩下的对比点数
                var preGroups_1 = [];
                var totals = findAllCombo(groups);
                (_a = totals === null || totals === void 0 ? void 0 : totals.filter(function (groupArray) { return isContainedSecrets(groupArray); })) === null || _a === void 0 ? void 0 : _a.forEach(function (curGroups) {
                    if (curGroups.length > 0 && isValidGroup(curGroups)) {
                        if (preGroups_1.length > 0) {
                            var prePoint = flattenDeep(preGroups_1).map(function (card) { return card.point; }).reduce(function (pre, cur) { return pre + cur; });
                            var curPoint = flattenDeep(curGroups).map(function (card) { return card.point; }).reduce(function (pre, cur) { return pre + cur; });
                            if (curPoint > prePoint) {
                                preGroups_1.length = 0;
                                preGroups_1.push.apply(preGroups_1, curGroups);
                            }
                        }
                        else {
                            preGroups_1.push.apply(preGroups_1, curGroups);
                        }
                    }
                });
                return preGroups_1;
            }
            else {
                // 不含秘密卡组，存在重合的卡组只保留点数大的哪个
                var preGroups_2 = [];
                // console.log(`validGroups---originGroups=${groups.map(group => `[${group.map(card => `${card.suit}-${card.face}`)}]`)}`);
                var totals = findAllCombo(groups);
                // console.log(`validGroups---totals=${totals.map(groupArray => `【${groupArray.map(group => `[${group.map(card => `${card.suit}-${card.face}`)}]`)}】`)}`);
                totals.forEach(function (curGroups) {
                    // console.log(`validGroups---curGroup=${curGroups.map(group => `[${group.map(card => `${card.suit}-${card.face}`)}]`)}`);
                    // console.log(`validGroups---preGroup=${preGroups.map(group => `[${group.map(card => `${card.suit}-${card.face}`)}]`)}`);
                    if (curGroups.length > 0 && isValidGroup(curGroups)) {
                        if (preGroups_2.length > 0) {
                            var prePoint = flattenDeep(preGroups_2).map(function (card) { return card.point; }).reduce(function (pre, cur) { return pre + cur; });
                            var curPoint = flattenDeep(curGroups).map(function (card) { return card.point; }).reduce(function (pre, cur) { return pre + cur; });
                            if (curPoint > prePoint) {
                                preGroups_2.length = 0;
                                preGroups_2.push.apply(preGroups_2, curGroups);
                            }
                            else if (curPoint === prePoint && isContainedSecrets(curGroups)) {
                                preGroups_2.length = 0;
                                preGroups_2.push.apply(preGroups_2, curGroups);
                            }
                        }
                        else {
                            preGroups_2.push.apply(preGroups_2, curGroups);
                        }
                    }
                });
                // console.log(`validGroups---brestGroups=${preGroups.map(group => `[${group.map(card => `${card.suit}-${card.face}`)}]`)}`);
                return preGroups_2;
            }
        }
        // 符合规则直接返回
        return groups;
    }
    /** 找出传入牌组所有可能的组合 */
    function findAllCombo(groups) {
        var tempCombos = [];
        var n = groups.length;
        while (n > 0) {
            findCombo(groups, n, tempCombos);
            n--;
        }
        return tempCombos;
    }
    function findCombo(groups, idx, combos) {
        var count = groups.length;
        var func = function (index, array) {
            if (index === void 0) { index = 0; }
            if (count - index === idx - array.length) {
                for (var i = index; i < count; i++) {
                    array.push(groups[i]);
                }
                combos.push(array);
                return;
            }
            if (array.length === idx) {
                combos.push(array);
                return;
            }
            func(index + 1, __spreadArray(__spreadArray([], array, true), [groups[index]], false));
            func(index + 1, __spreadArray([], array, true));
        };
        func(0, []);
    }
    function isExist(array, inArray) {
        return inArray.findIndex(function (group) {
            return array.length === group.length && array.every(function (card) { return group.findIndex(function (c) { return c.id === card.id; }) !== -1; });
        }) !== -1;
    }
    function splitGroup(array, index) {
        var leftArray = [];
        var rightArray = [];
        for (var i = 0; i < array.length; i++) {
            var element = array[i];
            if (i < index)
                leftArray.push(element);
            else if (i > index)
                rightArray.push(element);
        }
        return [leftArray, rightArray];
    }
    function getSameFaces(cards) {
        var arr = [];
        for (var i = 0; i < cards.length; i++) {
            var sameCards = findSameFaceCards(cards[i], cards);
            if (sameCards && sameCards.length !== 0 && !isSameFaceInArray(sameCards, arr))
                arr.push(sameCards);
        }
        return arr;
    }
    function findSameFaceCards(targetCard, srcCards) {
        if (!targetCard || !srcCards)
            return null;
        var arr = [targetCard];
        for (var i = 0; i < srcCards.length; i++) {
            if (targetCard === srcCards[i])
                continue;
            if (targetCard.face === srcCards[i].face)
                arr.push(srcCards[i]);
        }
        if (arr.length >= 3)
            return arr;
        return null;
    }
    function isSameFaceInArray(targetCards, cardsArr) {
        for (var i = 0; i < cardsArr.length; i++) {
            if (cardsArr[i][0].face === targetCards[0].face)
                return true;
        }
        return false;
    }
    function getStraights(cards) {
        var arr = [];
        var cloneCards = Object.assign([], cards);
        // 排序， 然后从小到大取
        cloneCards.sort(function (a, b) {
            return (a.suit === b.suit) ? a.face - b.face : a.suit - b.suit;
        });
        for (var i = 0; i < cloneCards.length;) {
            var endIdx = findStraightEndIndex(i, cloneCards);
            if (endIdx === -1) {
                i++;
            }
            else {
                arr.push(cloneCards.slice(i, endIdx));
                i = endIdx;
            }
        }
        return arr;
    }
    function findStraightEndIndex(startIdx, srcCards) {
        if (!srcCards || srcCards.length === 0)
            return -1;
        var selCard = srcCards[startIdx];
        var count = 1;
        for (var i = startIdx + 1; i < srcCards.length; i++) {
            if (selCard.face + count !== srcCards[i].face || selCard.suit !== srcCards[i].suit)
                return (count >= 3) ? i : -1;
            count++;
        }
        return (count >= 3) ? srcCards.length : -1;
    }
    function computeCardsPoint(cards) {
        if (!cards || cards.length === 0)
            return 0;
        var point = 0;
        for (var i = 0; i < cards.length; i++) {
            point += cards[i].point;
        }
        return point;
    }
    function flattenDeep(data) {
        var ret = [];
        data.forEach(function (item) {
            if (Array.isArray(item)) {
                ret = ret.concat(flattenDeep(item));
            }
            else {
                ret.push(item);
            }
        });
        return ret;
    }
    function getVector3By(cards) {
        var lastGroupRight = SmallCardRectValue / 2;
        var y = 0;
        var count = 0;
        var py_x = 6;
        var py_y = -35;
        var maxX = 350;
        var rows = 1;
        var array = cards.map(function (group, idx) {
            var xArray = [];
            if (idx > 0) {
                lastGroupRight += 24;
            }
            for (var i = 0; i < group.length; i++) {
                if (lastGroupRight > maxX) {
                    rows = 2;
                    lastGroupRight = SmallCardRectValue / 2;
                    y = -70;
                }
                else {
                    if (count > 0) {
                        lastGroupRight += 23;
                    }
                }
                xArray.push({
                    x: lastGroupRight + py_x,
                    y: y + py_y,
                    z: 0
                });
                count++;
            }
            return xArray;
        });
        return { array: array, rows: rows };
    }
    CardHelper.getVector3By = getVector3By;
})(CardHelper || (CardHelper = {}));

function test() {
    console.log("Test run !");
    var cards = [1, 2, 3, 4, 6, 7, 8, 22, 33].map(c => new Card(c));
    console.log("getBestGroups:");
    console.log(CardHelper.getBestGroupsBy(cards));
}

function getVector3() {
    const cardArr=[1, 2, 3, 4, 6, 7, 8, 22, 33]
    var cards = cardArr.map(c => new Card(c));
    var groups = CardHelper.getBestGroupsBy(cards);
    return CardHelper.getVector3By(groups);
}
// function getBestGroups(){
//     const cardArr=[1, 2, 3, 4, 6, 
//                     7, 8, 22, 33,23,
//                     24,25,26,27,45]
//     var cards = cardArr.map(c => new Card(c));
//     return CardHelper.getBestGroupsBy(cards)
// }
// function getPos(groups){
//     return CardHelper.getVector3By(groups);
// }
