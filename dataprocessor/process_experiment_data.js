// process_experiment_data.js
const fs = require('fs').promises;
const path = require('path');
const XLSX = require('xlsx');

/**
 * 将处理后的数据保存为 CSV 文件
 * @param {Array<Object>} data - 要保存的数据数组
 * @param {string} filePath - 输出 CSV 文件的路径
 */
async function saveToCsv(data, filePath) {
    if (!data || data.length === 0) {
        console.log("没有数据可保存。");
        return;
    }
    // 定义 CSV 文件头 (添加新指标)
    const headers = [
        'ParticipantID',
        'GameID',
        'RoundNumber',
        'TotalBeansInRound',
        'PlayerChoice',
        'TimeToHalfPointMs',
        'DecisionTimeMs',
        'PlayerBeansBeforeDecision',
        'PlayerBeansAfterDecisionHelp',
        'PlayerTotalBeans',
        'NPCTotalBeans',
        'TeamTotalBeans',
        'RoundDurationMs',
        'AvgTimePerBeanBeforeDecisionMs',     // <--- 新增
        'AvgSpeedBeforeDecisionBeansPerSec',  // <--- 新增
        'AvgTimePerBeanAfterDecisionHelpMs',  // <--- 新增
        'AvgSpeedAfterDecisionHelpBeansPerSec',// <--- 新增
        'StartTime',
        'HalfPointTimestamp',
        'ChoiceTimestamp',
        'EndTime',
    ];
    const csvRows = data.map(row => {
        return headers.map(header => {
            let value = row[header];
             // 保留数字精度，避免 Excel 自动转换成科学计数法 (特别是速度)
            if (typeof value === 'number' && !Number.isInteger(value)) {
                value = value.toFixed(3); // 保留3位小数，可调整
            }
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            return value !== undefined && value !== null ? value : ''; // null 值显示为空
        }).join(',');
    });
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    try {
        await fs.writeFile(filePath, csvContent, 'utf8');
        console.log(`处理结果已成功保存到: ${filePath}`);
    } catch (error) {
        console.error(`保存 CSV 文件时出错: ${error}`);
    }
}

/**
 * 从 Excel 文件中提取元数据 (保持不变)
 * @param {XLSX.WorkBook} workbook
 * @returns {Object|null}
 */
function extractMetadata(workbook) {
    const sheetName = "被试信息";
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
        console.warn(`未在 Excel 文件中找到名为 "${sheetName}" 的工作表。`);
        return null;
    }
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const metadata = {};
    for (let i = 1; i < data.length; i++) {
        const key = data[i][0];
        const value = data[i][1];
        if (key) {
            switch (key) {
                case "被试编号": metadata.participant_id = value; break;
                case "游戏ID": metadata.game_id = value; break;
            }
        }
    }
    return metadata;
}


/**
 * 处理单个游戏日志 Excel 文件
 * @param {string} excelFilePath
 * @param {string} outputCsvPath
 */
async function processLogFile(excelFilePath, outputCsvPath) {
    console.log(`开始处理日志文件: ${excelFilePath}`);
    let workbook;
    let logSheetData;
    let metadata;

    // 1. 读取 Excel 文件 (保持不变)
    try {
        workbook = XLSX.readFile(excelFilePath);
        const sheetName = "游戏行为记录";
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) { throw new Error(`未找到 "${sheetName}" 工作表。`); }
        logSheetData = XLSX.utils.sheet_to_json(worksheet);
        metadata = extractMetadata(workbook);
        if (!metadata || !metadata.participant_id) {
             const filename = path.basename(excelFilePath, '.xlsx');
             if (filename.startsWith('P') && filename.length >= 13) {
                 metadata = metadata || {};
                 metadata.participant_id = filename;
                 console.log(`从文件名解析 Participant ID: ${metadata.participant_id}`);
             } else { console.error("无法确定被试编号。"); return; }
        }
        console.log("提取到的元数据:", metadata);
    } catch (error) {
        console.error(`读取或解析 Excel 文件时出错: ${error}`); return;
    }

    const processedRounds = [];
    let currentRoundData = null;

    // 2. 遍历日志事件行
    for (const row of logSheetData) {
        const eventType = row["事件类型"];
        const timestamp = row["时间戳(ms)"]; // 直接用 Excel 列名获取
        const round = row["回合"];
        let details = {};
        try {
            details = JSON.parse(row["原始Details(JSON)"] || '{}');
        } catch (e) { /* ... 忽略解析错误或记录警告 ... */ }

        if (!eventType || timestamp === undefined) continue;

        // --- 回合开始 ---
        if (eventType === 'RoundStart' && details.round !== undefined) {
            if (currentRoundData && !currentRoundData.EndTime) {
                 console.warn(`警告: 回合 ${currentRoundData.RoundNumber} 未正常结束。`);
            }
            currentRoundData = {
                ParticipantID: metadata.participant_id, GameID: metadata.game_id || 'N/A',
                RoundNumber: details.round, TotalBeansInRound: details.totalBeansInRound,
                StartTime: details.startTimestamp, PlayerChoice: 'none',
                TimeToHalfPointMs: null, DecisionTimeMs: null,
                PlayerBeansBeforeDecision: 0, PlayerBeansAfterDecisionHelp: 0,
                PlayerTotalBeans: 0, NPCTotalBeans: 0, TeamTotalBeans: 0,
                RoundDurationMs: null, HalfPointTimestamp: null, ChoiceTimestamp: null, EndTime: null,
                decisionMade: false,
                // --- 初始化新字段和时间戳存储 ---
                playerBeanTimestampsBeforeDecision: [], // 存储决策前吃豆时间戳
                playerBeanTimestampsAfterDecisionHelp: [], // 存储决策后(帮助)吃豆时间戳
                AvgTimePerBeanBeforeDecisionMs: null,
                AvgSpeedBeforeDecisionBeansPerSec: null,
                AvgTimePerBeanAfterDecisionHelpMs: null,
                AvgSpeedAfterDecisionHelpBeansPerSec: null,
            };
        }

        if (!currentRoundData) continue;

        // --- 玩家吃豆 ---
        if (eventType === 'PlayerBeanEaten') {
             const beanTimestamp = details.timestamp || timestamp; // 优先用 details 里的，否则用行时间戳
             // 判断并记录时间戳
             if (currentRoundData.HalfPointTimestamp === null || beanTimestamp < currentRoundData.HalfPointTimestamp) {
                 currentRoundData.PlayerBeansBeforeDecision++; // 仍然计数
                 currentRoundData.playerBeanTimestampsBeforeDecision.push(beanTimestamp); // 存储时间戳
             } else if (currentRoundData.ChoiceTimestamp !== null && beanTimestamp >= currentRoundData.ChoiceTimestamp && currentRoundData.PlayerChoice === 'help') {
                 currentRoundData.PlayerBeansAfterDecisionHelp++; // 仍然计数
                 currentRoundData.playerBeanTimestampsAfterDecisionHelp.push(beanTimestamp); // 存储时间戳
             }
             // 总数在 RoundEnd 处理
        }

        // --- 到达决策点 ---
        if (eventType === 'HalfBeansReached') {
            currentRoundData.HalfPointTimestamp = details.timestamp;
            currentRoundData.TimeToHalfPointMs = details.timestamp - currentRoundData.StartTime;
             // 验证豆数 (可选)
            if (currentRoundData.PlayerBeansBeforeDecision !== details.playerScore) {
                 console.warn(`警告: 回合 ${currentRoundData.RoundNumber} 决策点豆数计算 (${currentRoundData.PlayerBeansBeforeDecision}) 与记录 (${details.playerScore}) 不符。`);
            }
        }

        // --- 做出选择 ---
        if (eventType === 'ChoiceMade') {
            currentRoundData.PlayerChoice = details.choice;
            currentRoundData.ChoiceTimestamp = details.timestamp;
            currentRoundData.decisionMade = true;
            if (currentRoundData.HalfPointTimestamp !== null) {
                 currentRoundData.DecisionTimeMs = details.timestamp - currentRoundData.HalfPointTimestamp;
                 if (details.timeSinceDecisionPointMs !== undefined) {
                     currentRoundData.DecisionTimeMs = details.timeSinceDecisionPointMs;
                 }
            } else {
                 console.warn(`警告: 回合 ${currentRoundData.RoundNumber} ChoiceMade 时无 HalfPointTimestamp。`);
            }
        }

        // --- 回合结束 ---
        if (eventType === 'RoundEnd' && details.round !== undefined && String(details.round) === String(currentRoundData.RoundNumber)) {
            currentRoundData.EndTime = details.endTimestamp;
            currentRoundData.RoundDurationMs = details.durationMs;
            currentRoundData.PlayerTotalBeans = details.playerRoundScore;
            currentRoundData.NPCTotalBeans = details.npcRoundScore;
            currentRoundData.TeamTotalBeans = details.playerRoundScore + details.npcRoundScore;

            // --- 计算时间序列指标 ---
            const beansBefore = currentRoundData.PlayerBeansBeforeDecision;
            if (beansBefore > 0) {
                let durationBeforeMs;
                // 如果到达了决策点，时间段是 Start -> HalfPoint
                if (currentRoundData.HalfPointTimestamp !== null) {
                    durationBeforeMs = currentRoundData.HalfPointTimestamp - currentRoundData.StartTime;
                }
                // 如果没到决策点就结束了，时间段是 Start -> End
                else {
                    durationBeforeMs = currentRoundData.EndTime - currentRoundData.StartTime;
                    // 确保 PlayerBeansBeforeDecision 包含所有豆子
                    if(currentRoundData.PlayerTotalBeans !== beansBefore){
                         console.warn(`警告: 回合 ${currentRoundData.RoundNumber} 未达决策点，但PlayerBeansBeforeDecision (${beansBefore}) != PlayerTotalBeans (${currentRoundData.PlayerTotalBeans})`);
                         // currentRoundData.PlayerBeansBeforeDecision = currentRoundData.PlayerTotalBeans; // 修正计数
                         // beansBefore = currentRoundData.PlayerTotalBeans; // 更新用于计算的变量
                    }
                }

                if (durationBeforeMs > 0) { // 避免除以0或负数
                    currentRoundData.AvgTimePerBeanBeforeDecisionMs = durationBeforeMs / beansBefore;
                    currentRoundData.AvgSpeedBeforeDecisionBeansPerSec = beansBefore / (durationBeforeMs / 1000);
                } else {
                     currentRoundData.AvgTimePerBeanBeforeDecisionMs = 0; // 或 null，取决于你如何定义
                     currentRoundData.AvgSpeedBeforeDecisionBeansPerSec = 0; // 或 null
                }
            } else {
                currentRoundData.AvgTimePerBeanBeforeDecisionMs = null; // 没有豆子，无法计算
                currentRoundData.AvgSpeedBeforeDecisionBeansPerSec = 0; // 速度为0
            }

            // 计算决策后 (仅当选择 'help' 且吃了豆)
            const beansAfterHelp = currentRoundData.PlayerBeansAfterDecisionHelp;
            if (currentRoundData.PlayerChoice === 'help' && beansAfterHelp > 0 && currentRoundData.ChoiceTimestamp !== null) {
                const durationAfterHelpMs = currentRoundData.EndTime - currentRoundData.ChoiceTimestamp;
                if (durationAfterHelpMs > 0) {
                    currentRoundData.AvgTimePerBeanAfterDecisionHelpMs = durationAfterHelpMs / beansAfterHelp;
                    currentRoundData.AvgSpeedAfterDecisionHelpBeansPerSec = beansAfterHelp / (durationAfterHelpMs / 1000);
                } else {
                    currentRoundData.AvgTimePerBeanAfterDecisionHelpMs = 0; // 或 null
                    currentRoundData.AvgSpeedAfterDecisionHelpBeansPerSec = 0; // 或 null
                }
            } else {
                 currentRoundData.AvgTimePerBeanAfterDecisionHelpMs = null; // 未选择帮助或未吃豆
                 currentRoundData.AvgSpeedAfterDecisionHelpBeansPerSec = (currentRoundData.PlayerChoice === 'help' ? 0 : null); // 选了帮助但没吃豆速度是0
            }
            // --- 计算结束 ---

            processedRounds.push(currentRoundData);
            currentRoundData = null;
        }
    } // 结束事件循环

    if (currentRoundData && !currentRoundData.EndTime) {
        console.warn(`警告: 文件处理结束时，回合 ${currentRoundData.RoundNumber} 未找到 RoundEnd 事件。`);
    }

    // 3. 保存处理结果
    if (processedRounds.length > 0) {
        await saveToCsv(processedRounds, outputCsvPath);
    } else {
        console.log("在日志文件中没有找到完整的可处理的回合数据。");
    }
}

// --- 主程序入口 (保持不变) ---
const args = process.argv.slice(2);
if (args.length === 0) { /* ... 错误提示 ... */ process.exit(1); }
const inputExcelFile = args[0];
const scriptDir = __dirname;
fs.access(inputExcelFile)
    .then(() => {
        const inputBasename = path.basename(inputExcelFile, '.xlsx');
        const outputCsvFile = path.join(scriptDir, 'processed_data', `${inputBasename}_processed.csv`);
        return fs.mkdir(path.dirname(outputCsvFile), { recursive: true })
            .then(() => processLogFile(inputExcelFile, outputCsvFile));
    })
    .catch(err => { /* ... 错误处理 ... */ process.exit(1); });