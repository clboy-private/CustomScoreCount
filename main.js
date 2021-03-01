const DATACENTER = {
    type: {
        P: '手机使用',
        E: '考试成绩',
        X: '其他惩罚',
        C: '自定义'
    },
    bgColor: {
        P: {
            '娱乐': '#E6A23C',
            '学习': '#f8f8f8',
            '社交': '#409EFF',
        },
        X: '#F56C6C',
        reward: '#67C23A'
    },
    PScore: {
        play: {
            '0-4': -1,
            '4-6': -1.5,
            '6-8': -2,
            '8-12': -3
        },
        study: {
            '0-4': 0.5,
            '4-6': 0.8,
            '6-8': 1,
            '8-12': 1.2
        },
        chat: {
            '0-4': -0.5,
            '4-6': -0.8,
            '6-8': -0.8,
            '8-12': -1
        }
    },
    EScore: {
        "语文": { noPass: -0.5, pass: 0.1, total: 120, reward: 0.05 },
        "数学": { noPass: -0.5, pass: 0.1, total: 120, reward: 0.05 },
        "英语": { noPass: -0.5, pass: 0.1, total: 120, reward: 0.05 },
        "历史": { noPass: -0.5, pass: 0.1, total: 70, reward: 0.08 },
        "物理": { noPass: -0.5, pass: 0.1, total: 70, reward: 0.08 },
        "地理": { noPass: -0.5, pass: 0.1, total: 50, reward: 0.1 },
        "生物": { noPass: -0.5, pass: 0.1, total: 50, reward: 0.1 },
        "政治": { noPass: -0.5, pass: 0.1, total: 50, reward: 0.1 },
        "总分": { noPass: -0.8, pass: 0.05, total: 650, reward: 0.02 },
    },
    weekScore: {
        study: 10,
        play: -20,
        chat: -10
    },
    ignoreTime: {
        dayPlay: 0.2,
        weekPlay: 8,
        chatScale: 0.2
    }

}
const Calculations = {
    P: {
        playScore(hour, range) {
            //小数计算精度问题
            return DATACENTER.PScore.play[range] * 10 * hour / 10;
        },
        studyScore(hour, range) {
            return DATACENTER.PScore.study[range] * 10 * hour / 10;
        },
        chatScore(hour, range) {
            return DATACENTER.PScore.chat[range] * 10 * hour / 10;
        },
        getScore(category, hour, total) {
            if (total > 12) {
                return -total;
            }
            let range = this.getRange(total);
            switch (category) {
                case "娱乐": return hour < 0.2 ? 0 : this.playScore(hour, range);
                case "学习": return this.studyScore(hour, range);
                case "社交": return hour < total * 0.2 ? 0 : this.chatScore(hour, range);
            }
        },
        getRange(hour) {
            if (hour <= 4) {
                return '0-4';
            } else if (hour <= 6) {
                return '4-6';
            } else if (hour <= 8) {
                return '6-8';
            } else if (hour <= 12) {
                return '8-12';
            }
        },
        getReward(category, hour, total) {
            return 0;
        }
    },
    E: {
        getScore(category, socre) {
            let co = DATACENTER.EScore[category];
            let passScore = co.total * 0.6;
            //是否及格
            if (socre < passScore) {
                return (passScore - socre) * (co.noPass * 10) / 10;
            }

            return socre * (co.pass * 10) / 10;

        },
        getReward(category, socre) {
            let co = DATACENTER.EScore[category];
            let rewardScore = Math.floor(co.total * 0.95);
            //是否奖励
            if (socre < rewardScore) {
                return 0;
            }

            return socre * (co.reward * 10) / 10;
        }

    },
    getScore(type, category, value, total) {
        return this[type].getScore(category, value, total);
    },
    getReward(type, category, value, total) {
        return this[type].getReward(category, value, total);
    }
}

const NaNToZero = function (text) {
    if (isNaN(text)) {
        return 0;
    }
    return Number(text);
}
const hookFn = function () {
    let total = 0;
    let dayTable = document.querySelector('#day-tb');

    if (dayTable) {
        formatDayLine(dayTable);
        total += countScore(dayTable);
    };

    let phoneWeekTable = document.querySelector('#phone-week-tb');

    if (phoneWeekTable) {
        formatPhoneWeekLine(phoneWeekTable);
        total += countScore(phoneWeekTable);
    }

    let quarterScore = document.querySelector('#quarter-score');
    if (quarterScore) {
        quarterScore.innerHTML = '当前分值：' + total;
    }
}

const lineBg = function (type, category) {
    switch (type) {
        case 'P': return DATACENTER.bgColor.P[category];
        case 'X': return DATACENTER.bgColor.X;
    }
}
const formatDayLine = function (dayTableDom) {
    let trs = dayTableDom.querySelectorAll('tbody>tr');

    for (let i = 0; i < trs.length; i++) {
        let tds = trs[i].querySelectorAll('td');
        //获取类型
        let type = tds[1].innerHTML.trim();
        let category = tds[2].innerHTML.trim();

        if (!type) continue;
        tds[1].innerHTML = DATACENTER.type[type];
        if (type == 'C' || !category) continue;

        let value = NaNToZero(tds[3].innerHTML.trim());
        let total = NaNToZero(tds[4].innerHTML.trim());
        let scoreTd = tds[5];
        let rewardTd = tds[6];
        let totalScoreTd = tds[tds.length - 1];
        let score = Calculations.getScore(type, category, value, total);
        let reward = Calculations.getReward(type, category, value, total);
        scoreTd.innerHTML = score;
        rewardTd.innerHTML = reward;
        totalScoreTd.innerHTML = score + reward;

        //设置背景
        if (reward) {
            trs[i].style.backgroundColor = DATACENTER.bgColor.reward;
        } else {
            trs[i].style.backgroundColor = lineBg(type, category);
        }
    }
}

const formatPhoneWeekLine = function (phoneWeekTableDom) {
    let trs = phoneWeekTableDom.querySelectorAll('tbody>tr');
    for (let i = 0; i < trs.length; i++) {
        let tds = trs[i].querySelectorAll('td');
        let totalTime = Number(tds[4].innerHTML.trim());
        //学习
        let studyScore = weekCellConvert(tds[1], DATACENTER.weekScore.study, totalTime, 0);
        //娱乐
        let playScore = weekCellConvert(tds[2], DATACENTER.weekScore.play, totalTime, DATACENTER.ignoreTime.weekPlay);
        //社交
        let chatScore = weekCellConvert(tds[3], DATACENTER.weekScore.chat, totalTime, DATACENTER.ignoreTime.chatScale * 10 * totalTime / 10);
        //得分
        let totalScoreTd = tds[tds.length - 1];
        totalScoreTd.innerHTML = studyScore + playScore + chatScore;
    }
}

const countScore = function (tableDom) {
    let scores = tableDom.querySelectorAll('tbody>tr>td:last-child');
    scores = Array.from(scores);
    let total = scores.reduce((total, val) => {
        return total + Number(val.innerHTML)
    }, 0)
    let totalLine = document.createElement('tr');
    totalLine.innerHTML = '<td colSpan="9" style="text-align:center;font-size:24px"><b>总计：' + total + '</b></td>';
    tableDom.querySelector('tbody').append(totalLine);
    return total;
}

const weekCellConvert = function (cellDom, scale, totalTime, ignoreTime) {
    let value = Number(cellDom.innerHTML.trim()) - ignoreTime;
    console.log(ignoreTime);
    let result = 0;
    if (totalTime && value > 0) {
        result = Math.floor(scale * value / totalTime);
    }
    // cellDom.innerHTML = result;
    return result;
}