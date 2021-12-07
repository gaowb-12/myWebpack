const fs = require("fs");
const path = require("path");
const { transformFromAst, parseSync, traverse } = require("@babel/core");

const parser = {
    // 获取抽象语法树
    getAst(filePath){
        const file = fs.readFileSync(filePath, "utf-8");
        // 将其解析成ast抽象语法树
        const ast = parseSync(file, {
            sourceType:"module", // 解析文件的模块化方案是ESM
        });
        return ast;
    },
    // 获取依赖
    getDeps(ast, filePath){
        // 获取文件夹路径
        const dirname = path.dirname(filePath);
        // 存储依赖的容器
        const deps = {}
        // 收集依赖 
        traverse(ast, {
            // 内部会遍历ast中program.body，判断里面的语句类型
            // 如果type：ImportDeclaration 就会触发当前函数
            ImportDeclaration({node}){
                // 文件相对路径 "./add.js"
                const relativePath = node.source.value;
                // 生成基于入口文件的绝对路径
                const absolutePath = path.resolve(dirname, relativePath);
                // absolutePath.replace(/\\/g, "\/");
                deps[relativePath] = absolutePath;
            }
        });
        return deps;
    },
    // 将ast解析成code
    getCode(ast){
        // 编译成了require语法
        const { code } = transformFromAst(ast, null, {
            presets:["@babel/preset-env"]
        });
        return code;
    }
};
module.exports = parser;