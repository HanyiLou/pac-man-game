// watch_data_folder.js
const chokidar = require('chokidar');
const path = require('path');
const { execFile } = require('child_process'); // Use execFile for security
const fs = require('fs').promises;

const dataFolderPath = path.join(__dirname, 'data'); // Path to the 'data' folder
const processingScriptName = 'process_experiment_data.js';
const processingScriptPath = path.join(__dirname, processingScriptName);

// 确保 data 文件夹存在
fs.mkdir(dataFolderPath, { recursive: true })
    .then(() => {
        console.log(`正在监视文件夹: ${dataFolderPath}`);
        console.log('请将被试导出的 Excel (.xlsx) 文件放入此文件夹中进行自动处理。');

        // 初始化 Chokidar 监视器
        const watcher = chokidar.watch(dataFolderPath, {
            ignored: /(^|[\/\\])\../, // 忽略隐藏文件
            persistent: true,         // 持续运行
            ignoreInitial: true,      // 忽略启动时已存在的文件
            awaitWriteFinish: {       // 尝试等待文件写入完成
                stabilityThreshold: 2000, // 文件大小稳定 2 秒后认为写入完成
                pollInterval: 100         // 每 100ms 检查一次
            }
        });

        // 监听 'add' 事件 (新文件添加)
        watcher.on('add', (filePath) => {
            // 仅处理 .xlsx 文件，并且不是以 _processed.csv 结尾的 (以防万一)
            if (path.extname(filePath).toLowerCase() === '.xlsx' && !filePath.endsWith('_processed.csv')) {
                console.log(`检测到新 Excel 文件: ${path.basename(filePath)}`);
                console.log(`准备调用处理脚本...`);

                // 调用 process_experiment_data.js 脚本
                execFile('node', [processingScriptPath, filePath], (error, stdout, stderr) => {
                    if (error) {
                        console.error(`执行处理脚本时出错 (${filePath}): ${error}`);
                        console.error(`错误详情 (stderr): ${stderr}`);
                        return;
                    }
                    if (stderr) {
                        console.warn(`处理脚本 (${filePath}) 输出到 stderr: ${stderr}`);
                    }
                    console.log(`处理脚本 (${path.basename(filePath)}) 输出:\n${stdout}`);
                    console.log(`文件 ${path.basename(filePath)} 处理完成。\n等待下一个文件...`);
                });
            }
        });

        // 监听错误事件
        watcher.on('error', error => console.error(`监视器错误: ${error}`));

    })
    .catch(err => {
        console.error(`无法创建或访问 data 文件夹: ${dataFolderPath}`);
        console.error(err);
    });