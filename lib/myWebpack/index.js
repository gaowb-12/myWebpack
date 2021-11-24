const fs = require("fs");
const path = require("path");
const babelParser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

function myWebpack(config){
    return new Compiler(config);
}
class Compiler{
    constructor(options = {}){
        this.options = options;
    }
    // 启动webpack打包
    run(){
        // 1.读取入口文件内容
        const filePath = this.options.entry;
        const file = fs.readFileSync(path.join(process.cwd(), filePath), "utf-8");
        // 2.将其解析成ast抽象语法树
        const ast = babelParser.parse(file, {
            sourceType:"module", // 解析文件的模块化方案是ESM
        });
        // 收集依赖 
        traverse(ast, {
            // 内部会遍历ast中program.body，判断里面的语句类型
            // 如果type：ImportDeclaration 就会触发当前函数
            ImportDeclaration(code){
                console.log(code)
            }
        })
    }
}

module.exports = myWebpack;