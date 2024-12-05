// 针对二叉树，我们需要了解有哪几种遍历方法
/**
 * 1.前序遍历：访问根节点->遍历左子树-> 遍历右子树
 * 2.后序遍历：遍历左子树-> 遍历右子树 -> 访问根节点
 * 3.中序遍历：遍历左子树 -> 访问根节点 -> 遍历右子树
 * 4.广度遍历： 一层层遍历
 *
 *  ------------
 *  ------------
 *  前序遍历：可以用来显示目录结构
 *  中序遍历：可以实现表达式树，在编译器底层很有用
 *  后序遍历：可以用来实现加笋目录内的文件及其信息等
 * */

/** 前序遍历  */
 // 递归写法
const preListFn = (tree)=>{
    const preListRec = [];
    const preOrderRec = (node)=> {
        if(node){
            preListRec.push(node.value); // 将节点放进数组
            preOrderRec(node.left); //递归遍历左子树
            preOrderRec(node.right); //递归遍历右子树
        }
    }
    preOrderRec(tree);
    return preListRec;
}
// 非递归写法
const preListUnRecFn = (tree)=> {
    const preListUnRec = [];
    const preOrderUnRec = (node)=> {
        if(node){
           const stack = [node]; //将二叉树压入栈
            while (stack.length!==0){
                const _node = stack.pop();
                preListUnRec.push(_node.value);
                if(_node.right) stack.push(_node.right); // 因为pop是截取后面的值，所以需要把右边放前面
                if(_node.left) stack.push(_node.left); //
            }
        }
    }
    preOrderUnRec(tree);
    return preListUnRec
}
/** 后序遍历  */
    // 递归写法
const postListFn = (tree)=>{
        const postListRec = [];
        const postOrderRec = (node)=> {
            if(node){
                postOrderRec(node.left); //递归遍历左子树
                postOrderRec(node.right); //递归遍历右子树
                postListRec.push(node.value); // 将节点放进数组
            }
        }
        postOrderRec(tree);
        return postListRec;
    }
// 非递归写法
const postListUnRecFn = (tree)=> {
    const postListUnRec = [];
    const postOrderUnRec = (node)=> {
        if(node){
            const stack = [node]; //将二叉树压入栈
            while (stack.length!==0){
                const _node = stack.pop();

                // if(_node.right) stack.push(_node.right); // 因为pop是截取后面的值，所以需要把右边放前面
                // if(_node.left) stack.push(_node.left); //
                // postListUnRec.push(_node.value);
                if
            }
        }
    }
    postOrderUnRec(tree);
    return postListUnRec
}
