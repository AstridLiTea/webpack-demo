// 华为机式题
/**
 * @param K 新字符长度
 * @param S 输入的字符串
 * @return s 全新的string
 * */

const  splitStrFn = (K, S)=>{
    if(!S){
        return ""
    }
    const strArr = S.split("-");
    if (strArr.length === 1){
        return S
    }
    let _S = strArr.shift(); //拿出第一个元素
    const lastStr = strArr.join(""); // 后面元素组成一个新的str
    // const arr = [firstStr];
    for(let i = 0; i < Math.ceil(lastStr.length / K) ; i++){
       let str = lastStr.substring(i*K, i*K + K);
        let upper = 0, lower = 0;
       for(let j = 0; j<str.length; j++){
           if(str[j] <="Z" && str[j] >="A") upper++;
           if(str[j] <="z" && str[j] >="a") lower++;
       }
       if(upper >lower){
           str = str.toUpperCase();
       }else if(upper <lower){
           str = str.toLowerCase();
       }
        _S += "-"+ str;
       // arr.push(str);
    }
    return _S
}

console.log('script start')

async function async1() {
    await async2()
    console.log('async1 end')
}
async function async2() {
    console.log('async2 end')
}
function test(){
    console.log("test")
}
async1()
test()
setTimeout(function() {
    console.log('setTimeout')
    new Promise(resolve => {
        console.log('promise3')
        resolve();
    })
}, 0)

new Promise(resolve => {
    console.log('Promise')
    resolve()
    setTimeout(function() {
        console.log('setTimeout2')
    }, 0)
})
    .then(function() {
        console.log('promise1')
    })
    .then(function() {
        console.log('promise2')
    })

console.log('script end')
