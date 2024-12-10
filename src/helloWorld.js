export function helloWorld(name) {
    console.log("Hello 蔡徐坤")
    return `Hello ，${getName(name)}`;
}

const getName = (name) => {
    return `I am ${name}, What's your name?`;
};
