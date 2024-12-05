

function str(S) {
    // do something
    let indexArr = [];
    let _indexArr = [];
    for(let i = 0; i < S.length; i++) {
        const isNumber = /[0-9]/g.test(S[i]);
        if(isNumber){
            _indexArr.push(i);
            indexArr.push(i);
        }else {
            if(i ===0 || i ===S.length - 1){
              indexArr.push(i===0 ? -1: S.length);
            }
        }
    } // 存所有的数字的下标，找到连续的3个值 间隔值相加最大
    if(_indexArr.length === 0 || _indexArr.length === S.length){
        return -1;
    }
    console.log(indexArr);
    if(_indexArr.length === 1){
        return S.length;
    }
    // eg [0,4,5,10,18,19]; 要返回
     let max= 0;
    for(let i = 0; i < indexArr.length-2; i++){
        const nextNum = indexArr[i+2];
        const gap = nextNum-indexArr[i]-1;
        console.log(gap);
        max = Math.max(max, gap);
        console.log(max);
    }
    return max;
}

function StrLength(S){
    if(!S){
        return -1;
    }
    let len = 0, //返回的长度
        max = -1, //最大长度
        prev = 0,//数字前面的长度
        next = 0, //数字后面的长度
        gap= 0, // 间隔几个数字
        i =0; //循环
    while(i<=S.length-1){
        if(/[0-9]/g.test(S[i])){
            gap++;
            if(gap === 1){
                next= -1;
            }
        }
        if(gap===0){
            prev++;
        }
        if(gap===1){
           next++;
           max = Math.max(max, prev+next+1);
        }
        if(gap === 2){
            gap--;
            prev = next;
            next= 0;
        }
        i++;
    }
    return max;
}
async function async1() {
    console.log('async1 start') // 2
    await async2()
    console.log('async1 end') //6
}
async function async2() {
    console.log('async2')  // 3
}
console.log('script start') // 1
setTimeout(function() {
    console.log('setTimeout') //8
}, 0)
async1()
new Promise(function(resolve)  {
    console.log('promise1')  //4
    resolve()})
    .then(function() {
        console.log('promise2') //7
    })
console.log('script end') //5
const rl = require("readline").createInterface({ input: process.stdin });
var iter = rl[Symbol.asyncIterator]();
const readline = async () => (await iter.next()).value;

function test(arr,money,count){
    // const money = 1000; // 钱
    // const count = 5;  // 数量
    let index = 0;
    let primary = {};// 主附件
    let annex = {};// 附件
    // const arr =[
    //     [800,2, 0],
    //     [400, 5, 1],
    //     [300, 5, 1],
    //     [400,3,0],
    //     [500,2, 0]
    // ]; // 商品集合

    while(index < count){
        const [p,w,z] = arr[index];
        const key = z===0? index+1: z;
        if(z===0){
            primary[key]= [p,w]
        }else {
            if(annex[z]){
                annex[z].push([p,w])
            }else {
                annex[z] = [[p,w]]}
        }
        index++;
    }

    const dp =[];
   console.log(primary,annex)
    for(let key in primary){
        const [p,w] = primary[key];
        dp.push({
            price: p,
            good: p*w,
            key,
        })
        if(annex[key]){
            const [p1,w1] = annex[key][0];
            dp.push({
                price: p+p1,
                good: p*w+p1*w1,
                key,
            })
            if(annex[key].length ===2){
                const [p2,w2] = annex[key][1];
                dp.push({
                    price: p+p2,
                    good: p*w+p2*w2,
                    key,
                },{
                    price: p+p2+p1,
                    good: p*w+p2*w2+p1*w1,
                    key,
                })
            }
        }
    }
    console.log(dp);
    let max = 0;
    for(let i =0; i< dp.length;i++){
        let price = dp[i].price;
        let good = dp[i].good;
        let sumPrice = 0, sumGood= 0;
        if(price > money){
            continue;
        }
        max = Math.max(max, good);
        sumPrice += price;
        sumGood += good;
        let key = dp[i].key;
        for(let j = 1;j<dp.length; j++){
            if((dp[i].key === dp[j].key)
                || ((price+ dp[j].price)> money)
            ){
                continue;
            }
            max = Math.max(max, good+dp[j].good);
            console.log(max, dp[j]);
            if(key !== dp[j].key){
                sumPrice += dp[j].price;
                sumGood += dp[j].good;
                if(sumPrice <= money ){
                    max= Math.max(max, sumGood);
                }
            }
            key = dp[j].key
        }
    }
    console.log(max)
}
function test1(arr,money,count){
    // const money = 1000; // 钱
    // const count = 5;  // 数量
    let index = 0;
    let primary = {};// 主附件
    let annex = {};// 附件
    // const arr =[
    //     [800,2, 0],
    //     [400, 5, 1],
    //     [300, 5, 1],
    //     [400,3,0],
    //     [500,2, 0]
    // ]; // 商品集合

    while(index < count){
        const [p,w,z] = arr[index];
        const key = z===0? index+1: z;
        if(z===0){
            primary[key]= [p,w]
        }else {
            if(annex[z]){
                annex[z].push([p,w])
            }else {
                annex[z] = [[p,w]]}
        }
        index++;
    }

    const dp =[];
    console.log(primary,annex)
    for(let key in primary){
        const [p,w] = primary[key];
        dp.push({
            price: p,
            good: p*w,
            key,
        })
        if(annex[key]){
            const [p1,w1] = annex[key][0];
            dp.push({
                price: p+p1,
                good: p*w+p1*w1,
                key,
            })
            if(annex[key].length ===2){
                const [p2,w2] = annex[key][1];
                dp.push({
                    price: p+p2,
                    good: p*w+p2*w2,
                    key,
                },{
                    price: p+p2+p1,
                    good: p*w+p2*w2+p1*w1,
                    key,
                })
            }
        }
    }
    console.log(dp);
    let max = 0;
    for(let i =0; i< dp.length;i++){
        let price = dp[i].price;
        let good = dp[i].good;
        console.log(dp[i]);
        let sumPrice = 0, sumGood= 0;
        if(price > money){
            continue;
        }
        max = Math.max(max, good);
        sumPrice += price;
        sumGood += good;
        let key = dp[i].key;
        for(let j = 1;j<dp.length; j++){
            if((dp[i].key === dp[j].key)
                || ((price+ dp[j].price)> money)
            ){
                continue;
            }
            max = Math.max(max, good+dp[j].good);
            console.log(max, dp[j]);
            if(key !== dp[j].key){
                sumPrice += dp[j].price;
                sumGood += dp[j].good;
                if(sumPrice <= money ){
                    max= Math.max(max, sumGood);
                }
            }
            key = dp[j].key
        }
    }
    console.log(max)
}
