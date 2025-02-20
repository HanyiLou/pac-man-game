document.addEventListener("DOMContentLoaded", () => {
    // DOM 元素
    const rulesModal = document.getElementById("rules-modal");
    const knowRulesButton = document.getElementById("know-rules");//“我已了解”按钮
    const closeRulesButton = document.getElementById("close-rules");
    const rulesLink = document.getElementById("rules-link");
    const gameContainer = document.getElementById("game-container");
    const matchButton = document.getElementById("matchButton");
    const deadlineBar = document.getElementById("deadline");
    
    // 游戏参数
    const totalRounds = 10; // 总轮次数
    const piecesPerImage = 50; // 每张图片的拼图碎片数量
    const playerPiecesRatio = 0.5; // 玩家分配拼图碎片比例
    const computerPiecesRatio = 0.5; // 电脑分配拼图碎片比例
    const roundTimeLimit = 300; // 每轮时间限制（秒）
    const computerSpeed = 1500; // 电脑拼图速度（ms/片）
    const computerCompletion = 0.7; // 电脑基础完成率
    const bonusThreshold = 20; // 每快20秒得1分

    let currentRound = 1;
    let totalScore = 0;
    let roundScore = 0;
    let timeLeft = roundTimeLimit;
    let timerInterval;
    
    // 游戏相关的 DOM 元素
    const currentRoundDisplay = document.getElementById("current-round");
    const totalScoreDisplay = document.getElementById("total-score");
    const roundScoreDisplay = document.getElementById("round-score");
    const timerDisplay = document.getElementById("timer");
    const playerPiecesContainer = document.getElementById("player-pieces");
    const computerPiecesContainer = document.getElementById("computer-pieces");
    const puzzleBoard = document.getElementById("puzzle-board");
    const helpButton = document.getElementById("help-button");

    // 页面加载时显示规则弹窗和“我已了解”按钮
    rulesModal.style.display = "block";
    knowRulesButton.style.display = "block"; // 默认显示“我已了解”按钮

    // 点击“我已了解”按钮后关闭规则弹窗并显示游戏界面
    knowRulesButton.addEventListener("click", () => {
        rulesModal.style.display = "none";
        gameContainer.style.display = "block";
        matchButton.style.display = "block";  // 显示“开始匹配队友”按钮
        
    });

    // 点击关闭按钮后隐藏规则弹窗
    closeRulesButton.addEventListener("click", () => {
        rulesModal.style.display = "none";
        knowRulesButton.style.display = "block"; // 显示“开始游戏”按钮
    });

    // 点击导航栏的“规则”选项时重新显示规则弹窗
    rulesLink.addEventListener("click", (e) => {
        e.preventDefault();
        rulesModal.style.display = "block";
        knowRulesButton.style.display = "none"; // 隐藏“开始游戏”按钮
    });

    // 点击“开始匹配队友”按钮后出现匹配进度条
    matchButton.addEventListener("click", () => {
        matchButton.style.display = "none"; // 隐藏“开始匹配队友”按钮
        deadline.style.display = "block"; // 显示倒计时进度条
    
        // 10秒后隐藏进度条并显示匹配成功提示框
        setTimeout(() => {
            deadline.style.display = "none";
            document.getElementById("match-success").style.display = "block"; // 显示匹配成功提示框
    
            // 2秒后隐藏提示框
            setTimeout(() => {
                document.getElementById("match-success").style.display = "none"; // 2秒后隐藏提示框
                window.location.href = 'game.html'; // 跳转到 index.html
            }, 2000); // 从提示框显示开始计时
        }, 10000); // 10秒后执行
    });



    //在点击“开始游戏”按钮后初始化游戏

    initGame(); // 初始化游戏

    // 初始化游戏
    function initGame() {
    }

    // 开始新一轮游戏
    function startRound() {
    }


    // 更新计时器显示
    function updateTimer(timeLeft) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    // 结束一轮游戏
    function endRound() {
        
    }

    // 模拟电脑行为
    function simulateComputerBehavior() {
        
    }

    // 检查拼图完成情况
    function checkCompletion() {
       
    }

    // 随机打乱数组顺序
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
});



// 进度条显示界面
// Init
var $ = jQuery;
var animationTime = 21,
    days = 7;
 
$(document).ready(function(){

    // timer arguments: 
    //   #1 - time of animation in mileseconds, 
    //   #2 - days to deadline

    $('#progress-time-fill, #death-group').css({'animation-duration': animationTime+'s'});

    var deadlineAnimation = function () {
        setTimeout(function(){
            $('#designer-arm-grop').css({'animation-duration': '1.5s'});
        },0);

        setTimeout(function(){
            $('#designer-arm-grop').css({'animation-duration': '1s'});
        },4000);

        setTimeout(function(){
            $('#designer-arm-grop').css({'animation-duration': '0.7s'});
        },8000);

        setTimeout(function(){
            $('#designer-arm-grop').css({'animation-duration': '0.3s'});
        },12000);

        setTimeout(function(){
            $('#designer-arm-grop').css({'animation-duration': '0.2s'});
        },15000);
    };

    function timer(totalTime, deadline) {
        var time = totalTime * 1000;
        var dayDuration = time / deadline;
        var actualDay = deadline;

        var timer = setInterval(countTime, dayDuration);

        function countTime() {
            --actualDay;
            $('.deadline-days .day').text(actualDay);

            if (actualDay == 0) {
                clearInterval(timer);
                $('.deadline-days .day').text(deadline);
            }
        }
    }

    var deadlineText = function () {
        var $el = $('.deadline-days');
        var html = '<div class="mask-red"><div class="inner">' + $el.html() + '</div></div><div class="mask-white"><div class="inner">' + $el.html() + '</div></div>';
        $el.html(html);
    }

    deadlineText();

    deadlineAnimation();
    timer(animationTime, days);

    setInterval(function(){
        timer(animationTime, days);
        deadlineAnimation();

        console.log('begin interval', animationTime * 1000);

    }, animationTime * 1000);

});
