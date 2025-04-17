
Pac-Man Game with AI Collaboration
这是一个经过修改的Pac-Man游戏，加入了人机协作的特性。玩家可以与AI（NPC）一起收集豆子，并在特定条件下做出协作决策。

版权
源代码由 passer-by.com 制作，为确保实验环境，将游戏界面中作者信息删除。

项目演示(DEMO)地址：https://passer-by.com/pacman/

## 实验前准备

在运行项目或处理数据前，请确保安装了以下软件：

1.  **Node.js:** 用于运行数据处理脚本。请从 [Node.js 官网](https://nodejs.org/) 下载并安装 LTS 版本。npm (Node Package Manager) 会随 Node.js 一起安装。
2.  **本地 Web 服务器:** 由于浏览器安全限制，直接从本地文件系统打开 `index.html` 可能导致资源加载或 `localStorage` 访问问题。推荐使用本地 Web 服务器来运行游戏。常用的选择有：
    *   **`http-server` (基于 Node.js):** 安装命令 `npm install -g http-server`，然后在项目根目录运行 `http-server`。
    *   **VS Code Live Server 扩展:** 如果你使用 Visual Studio Code，可以安装 Live Server 扩展并右键点击 `index.html` 选择 "Open with Live Server"。
    *   其他 WAMP/MAMP/LAMP 等服务器。

## 安装与设置

1.  **克隆或下载项目:** 获取项目文件到你的本地计算机。
2.  **安装 Node.js 依赖:**
    *   打开你的终端（命令提示符、PowerShell、Terminal 等）。
    *   使用 `cd` 命令导航到 **`PacManDataProcessor` 文件夹** (如果你的脚本和 `package.json` 在那里)。如果你把脚本放在根目录，就 `cd` 到根目录 (`pac-man-game-main`)。
    *   运行以下命令安装数据处理脚本所需的库：
      ```bash
      npm install xlsx chokidar
      ```
    *   **(Windows PowerShell 用户注意)** 如果遇到 `无法加载文件 ... npm.ps1，因为在此系统上禁止运行脚本` 的错误，请在 **当前 PowerShell 窗口** 运行以下命令以临时允许脚本执行，然后再试一次 `npm install`：
      ```powershell
      Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
      ```

## 运行实验流程

1.  **启动 Web 服务器:** 在你的项目 **根目录** (`pac-man-game-main`) 启动本地 Web 服务器。例如，使用 `http-server`:
    ```bash
    cd D:\path\to\your\pac-man-game-main
    http-server
    ```
    记下服务器运行的地址和端口（通常是 `http://localhost:8080` 或类似地址）。

2.  **打开入口页面:** 在你的网页浏览器中，访问 Web 服务器提供的地址，指向 `index.html`。例如： `http://localhost:8080/index.html`。

3.  **填写被试信息:** 被试在 `index.html` 页面填写姓名、性别、出生日期、游戏 ID 等信息。被试编号会自动生成。

4.  **进入游戏:** 点击“开始游戏”按钮，信息将被存储在浏览器的 `localStorage` 中，并跳转到下一页（可能是 `match.html` 或直接到 `game.html`）。

5.  **进行游戏:** 被试根据 `game.html` 中的规则提示进行游戏，完成所有回合。

6.  **导出数据:** 游戏结束后（到达结束画面），点击“结束实验并导出数据”按钮。

7.  **【关键手动步骤】保存/移动 Excel 文件:** 浏览器会提示下载一个 `.xlsx` 文件（文件名通常基于被试编号，如 `P202310271200.xlsx`）。**你需要将这个文件保存或移动到项目中的 `PacManDataProcessor/data/` 文件夹内。** 这是后续数据处理脚本查找文件的位置。

## 数据处理

导出的 Excel 文件包含了详细的原始事件日志。为了方便分析，你需要运行 Node.js 脚本来处理这些日志并提取关键指标。

你有两种方式运行处理脚本：

**方式一：手动处理单个文件（推荐用于简单场景）**

每次下载一个新的 `.xlsx` 文件并将其放入 `PacManDataProcessor/data/` 文件夹后，执行以下步骤：

1.  打开终端。
2.  使用 `cd` 命令进入 `PacManDataProcessor` 文件夹。
3.  运行以下命令，将 `<你的Excel文件的完整路径>` 替换为 **`data` 文件夹中** 你要处理的那个 Excel 文件的实际路径：
    ```bash
    node process_experiment_data.js <你的Excel文件的完整路径>
    ```
    **示例 (假设文件在 `data` 子目录):**
    ```bash
    # 假设当前在 PacManDataProcessor 目录
    node process_experiment_data.js ./data/P202310271200.xlsx
    ```
    或者使用绝对路径：
    ```bash
    node process_experiment_data.js D:\path\to\project\PacManDataProcessor\data\P202310271200.xlsx
    ```
4.  处理完成后，结构化的 `.csv` 文件会出现在 `PacManDataProcessor/processed_data/` 文件夹中，文件名类似 `P202310271200_processed.csv`。

**方式二：使用 Watcher 自动处理（推荐用于批量处理）**

如果你需要连续处理多个被试的数据，可以使用 `watch_data_folder.js` 脚本。

1.  打开一个**新的**终端窗口（保持这个窗口运行）。
2.  使用 `cd` 命令进入 `PacManDataProcessor` 文件夹。
3.  运行以下命令启动监视器：
    ```bash
    node watch_data_folder.js
    ```
4.  终端会显示正在监视 `data` 文件夹。
5.  现在，**每当你将一个新的 `.xlsx` 文件放入 `PacManDataProcessor/data/` 文件夹时**，这个脚本会自动检测到它，并调用 `process_experiment_data.js` 进行处理。
6.  处理脚本的输出（包括成功信息或错误）会显示在这个监视终端窗口中。
7.  处理后的 `.csv` 文件同样会出现在 `PacManDataProcessor/processed_data/` 文件夹中。
8.  当你完成所有实验，不再需要监控时，回到这个监视终端窗口，按 `Ctrl + C` 停止脚本。

## 输出数据格式 (`_processed.csv` 文件)

处理脚本生成的 CSV 文件包含以下列，每行代表一个完整的游戏回合：

*   **ParticipantID:** 被试编号 (从 Excel 元数据或文件名提取)
*   **GameID:** 游戏 ID (从 Excel 元数据提取)
*   **RoundNumber:** 回合数 (1-10)
*   **TotalBeansInRound:** 本回合总豆数
*   **PlayerChoice:** 玩家在决策点的选择 ('help', 'wait', 或 'none' 表示未到达决策点或未选择)
*   **TimeToHalfPointMs:** 从回合开始到玩家吃到一半豆子（触发决策点）所用的时间（毫秒）。若未触发则为 `null`。
*   **DecisionTimeMs:** 从触发决策点到玩家做出选择（点击按钮）所用的时间（毫秒）。若未选择则为 `null`。
*   **PlayerBeansBeforeDecision:** 玩家在触发决策点之前吃掉的豆子数量。
*   **PlayerBeansAfterDecisionHelp:** 如果玩家选择 'help'，这是他在做出选择之后吃掉的豆子数量。否则为 0。
*   **PlayerTotalBeans:** 玩家在该回合总共吃掉的豆子数量。
*   **NPCTotalBeans:** NPC 在该回合总共吃掉的豆子数量。
*   **TeamTotalBeans:** 团队（玩家+NPC）在该回合总共吃掉的豆子数量。
*   **RoundDurationMs:** 整个回合持续的总时间（毫秒）。
*   **AvgTimePerBeanBeforeDecisionMs:** 决策前阶段，玩家平均吃一个豆子所需的时间（毫秒）。若阶段内未吃豆则为 `null`。
*   **AvgSpeedBeforeDecisionBeansPerSec:** 决策前阶段，玩家吃豆子的平均速度（豆/秒）。若阶段内未吃豆则为 `0`。
*   **AvgTimePerBeanAfterDecisionHelpMs:** 决策后选择帮助阶段，玩家平均吃一个豆子所需的时间（毫秒）。若未选择帮助或阶段内未吃豆则为 `null`。
*   **AvgSpeedAfterDecisionHelpBeansPerSec:** 决策后选择帮助阶段，玩家吃豆子的平均速度（豆/秒）。若未选择帮助则为 `null`，若选择帮助但未吃豆则为 `0`。
*   **StartTime:** 回合开始的 Unix 时间戳 (毫秒)。
*   **HalfPointTimestamp:** 到达决策点时的 Unix 时间戳 (毫秒)，若未到达则为 `null`。
*   **ChoiceTimestamp:** 做出选择时的 Unix 时间戳 (毫秒)，若未选择则为 `null`。
*   **EndTime:** 回合结束的 Unix 时间戳 (毫秒)。

## 注意事项与故障排除

*   **PowerShell 执行策略:** 如上文所述，Windows 用户首次运行 `npm` 命令可能需要调整执行策略。
*   **文件路径:** 在手动运行 `process_experiment_data.js` 时，请务必提供**正确且完整**的 Excel 文件路径。
*   **依赖安装:** 确保在包含 `package.json` 的目录下运行 `npm install`，这样脚本才能找到所需的库 (`xlsx`, `chokidar`)。
*   **手动放置文件:** 再次强调，将下载的 `.xlsx` 文件放入 `data` 文件夹是**必须手动完成**的步骤。
*   **Web 服务器:** 运行游戏时强烈建议使用本地 Web 服务器，以避免潜在的文件访问和跨域问题。
*   **Node.js 版本:** 脚本应与较新的 Node.js LTS 版本兼容。如果遇到奇怪的错误，可以尝试更新 Node.js。

---
