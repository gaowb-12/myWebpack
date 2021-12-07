const fs = require("fs");
const path = require("path");
const { getAst, getCode, getDeps } = require("./parser");

class Compiler{
    constructor(options = {}){
        // webpack配置
        this.options = options;
        // 所有依赖的容器
        this.modules = [];
    }
    // 启动webpack打包
    run(){
        // 读取入口文件路径
        const filePath = this.options.entry;
        // 第一次构建，得到入口文件的信息
        const fileInfo = this.build(filePath);
        this.modules.push(fileInfo);
        // 遍历所有的依赖
        this.modules.forEach(fileInfo => {
            const deps = fileInfo.deps;
            for (const relativePath in deps) {
                // 依赖的绝对路径
                const absolutePath = deps[relativePath];
                const fileInfo = this.build(absolutePath);
                this.modules.push(fileInfo);
            }
        });
        const depsGraph = this.modules.reduce((graph, module)=>{
            return {
                ...graph,
                [module.filePath]: {
                    code: module.code,
                    deps: module.deps
                }
            }
        }, {});
        this.generate(depsGraph);
    }
    // 开始构建
    build(filePath){
        // 1.将文件解析成ast
        const ast = getAst(filePath);
        // 2.获取ast中的依赖
        const deps = getDeps(ast, filePath);
        // 3.将ast解析成code
        const code = getCode(ast);
        return {
            filePath,
            deps,
            code
        }
    }
    // 生成输出资源
    generate(depsGraph){
        console.log(depsGraph)
        // 定义js文件内容
        const bundle = `
            (function(depsGraph){
                // 加载入口文件
                function require(module){
                    // 定义模块内部的require函数
                    function localRequire(relativePath){
                        // 引入模块的绝对路径，通过require加载
                        return require(depsGraph[module].deps[relativePath])
                    };
                    // 定义暴漏出去的对象（将来我们模块要爆露的内容）
                    var exports = {};
                    // 执行模块内部代码
                    (function(require,exports,code){
                        eval(code);
                    })(localRequire,exports,depsGraph[module].code);
                    // 作为require函数的返回值返回出去，为了后面的require函数能得到暴露的内容
                    return exports;
                }
                // 加载入口文件
                require(${JSON.stringify(this.options.entry)});
            })(${JSON.stringify(depsGraph)});
        `;
        // 生成输出文件的绝对路径
        const filePath = path.resolve(this.options.output.path,this.options.output.filename);
        // 生成文件
        fs.writeFileSync(filePath,bundle,"utf-8");
    }
}

module.exports = Compiler;