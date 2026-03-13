(function() {
    const DATA_PATH = './data/';  // 确保 data 文件夹存在

    // 获取DOM元素
    const homePanel = document.getElementById('homePanel');
    const matchesPanel = document.getElementById('matchesPanel');
    const powerPanel = document.getElementById('powerPanel');
    const navTabs = document.querySelectorAll('.nav-tab');

    const tournamentList = document.getElementById('tournamentList');
    const matchesCenter = document.getElementById('matchesCenterContent');
    const rankingsSide = document.getElementById('rankingsSideContent');
    const powerGrid = document.getElementById('powerGrid');

    const modal = document.getElementById('playerModal');
    const modalClose = modal.querySelector('.modal-close');
    const modalTeamName = document.getElementById('modalTeamName');
    const modalPlayerList = document.getElementById('modalPlayerList');

    // 全局数据
    let playersData = [];
    let teamsData = [];
    let matchesData = [];

    // 当前选中的赛事（默认第一届）
    let currentTournament = '第一届福瑞杯';

    // 导航切换
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const panelId = tab.dataset.panel;
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            document.getElementById(panelId + 'Panel').classList.add('active');
        });
    });

    // 关闭模态框
    modalClose.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // 加载数据
    async function fetchJSON(file) {
        const res = await fetch(DATA_PATH + file);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }

    // 计算战队胜场（从比赛数据）
    function calculateTeamWins(matches) {
        const wins = {};
        teamsData.forEach(t => wins[t.id] = 0);
        matches.forEach(m => {
            if (m.status === 'completed') {
                if (m.teamA.score > m.teamB.score) wins[m.teamA.id] += 1;
                else if (m.teamB.score > m.teamA.score) wins[m.teamB.id] += 1;
            }
        });
        return wins;
    }

    // 计算战队总胜/负场（用于实力排行）
    function calculateTeamRecords(matches) {
        const records = {};
        teamsData.forEach(t => records[t.id] = { wins: 0, losses: 0 });
        matches.forEach(m => {
            if (m.status === 'completed') {
                if (m.teamA.score > m.teamB.score) {
                    records[m.teamA.id].wins += 1;
                    records[m.teamB.id].losses += 1;
                } else if (m.teamB.score > m.teamA.score) {
                    records[m.teamB.id].wins += 1;
                    records[m.teamA.id].losses += 1;
                }
            }
        });
        return records;
    }

    // 渲染左侧赛事列表（从matches.json中提取唯一的tournament字段）
    function renderTournamentList() {
        const tournaments = [...new Set(matchesData.map(m => m.tournament).filter(Boolean))];
        if (tournaments.length === 0) tournaments.push('第一届福瑞杯'); // 默认
        let html = '';
        tournaments.forEach(t => {
            const activeClass = t === currentTournament ? 'active' : '';
            html += `<li class="tournament-item ${activeClass}" data-tournament="${t}">${t}</li>`;
        });
        tournamentList.innerHTML = html;

        // 添加点击事件
        document.querySelectorAll('.tournament-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.tournament-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                currentTournament = item.dataset.tournament;
                renderMatchesCenter();
            });
        });
    }

    // 渲染中间赛程（按当前赛事筛选）
    function renderMatchesCenter() {
        const filtered = matchesData.filter(m => m.tournament === currentTournament);
        if (!filtered.length) {
            matchesCenter.innerHTML = '<div class="error">暂无赛程</div>';
            return;
        }

        const getTeamName = (id) => {
            const t = teamsData.find(t => t.id === id);
            return t ? t.name : id;
        };

        // 按日期分组
        const groups = {};
        filtered.forEach(m => {
            const date = m.date || '待定';
            if (!groups[date]) groups[date] = [];
            groups[date].push(m);
        });
        const sortedDates = Object.keys(groups).sort((a, b) => new Date(a) - new Date(b));

        let html = '';
        sortedDates.forEach(date => {
            html += `<div style="margin-bottom:1.5rem;"><div class="date-header">${date}</div>`;
            groups[date].forEach(m => {
                const teamA = getTeamName(m.teamA.id);
                const teamB = getTeamName(m.teamB.id);
                const scoreA = m.teamA.score ?? 0;
                const scoreB = m.teamB.score ?? 0;
                const statusClass = m.status === 'completed' ? 'status-completed' : 'status-scheduled';
                const statusText = m.status === 'completed' ? '已结束' : '未开始';
                const timeStr = m.time ? `🕒 ${m.time}` : '';

                html += `
                    <div class="match-item">
                        <div class="match-row">
                            <span class="match-teams">${teamA} vs ${teamB}</span>
                            <span class="match-score">${scoreA}:${scoreB}</span>
                        </div>
                        <div class="match-meta">
                            <span class="match-status ${statusClass}">${statusText}</span>
                            <span>${timeStr}</span>
                            ${m.maps ? `<span>🗺️ ${m.maps.join(', ')}</span>` : ''}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        });
        matchesCenter.innerHTML = html;
    }

    // 渲染右侧战队实力榜（按胜场排序）
    function renderRankingsSide() {
        const wins = calculateTeamWins(matchesData);
        const sorted = teamsData.map(t => ({ ...t, wins: wins[t.id] }))
            .sort((a, b) => b.wins - a.wins);

        let html = '<ol class="ranking-list">';
        sorted.forEach((t, idx) => {
            html += `
                <li class="ranking-item">
                    <span class="rank-number">#${idx + 1}</span>
                    <div class="team-info">
                        <div class="team-name">${t.name}</div>
                        <div class="team-wins">胜场 <span>${t.wins}</span></div>
                    </div>
                </li>
            `;
        });
        html += '</ol>';
        rankingsSide.innerHTML = html;
    }

    // 渲染实力排行页面（战队卡片）
    function renderPowerRankings() {
        const records = calculateTeamRecords(matchesData);
        let html = '';
        teamsData.forEach(t => {
            const rec = records[t.id] || { wins: 0, losses: 0 };
            html += `
                <div class="team-power-card" data-team-id="${t.id}">
                    <div class="team-power-header">
                        <span class="team-power-name">${t.name}</span>
                        <span class="team-power-record">${rec.wins}胜 - ${rec.losses}负</span>
                    </div>
                    <div class="team-power-stats">
                        <span>胜率: ${rec.wins + rec.losses ? ((rec.wins / (rec.wins + rec.losses)) * 100).toFixed(1) : 0}%</span>
                    </div>
                </div>
            `;
        });
        powerGrid.innerHTML = html;

        // 为每个卡片添加点击事件显示队员
        document.querySelectorAll('.team-power-card').forEach(card => {
            card.addEventListener('click', () => {
                const teamId = card.dataset.teamId;
                const team = teamsData.find(t => t.id === teamId);
                const teamPlayers = playersData.filter(p => p.team === team.name);
                modalTeamName.innerText = team.name + ' 队员';
                let playerHtml = '';
                teamPlayers.forEach(p => {
                    const kd = p.deaths ? (p.kills / p.deaths).toFixed(2) : p.kills.toFixed(2);
                    playerHtml += `
                        <div class="player-row">
                            <span>${p.name}</span>
                            <span class="stat">${p.kills}</span>
                            <span class="stat">${p.deaths}</span>
                            <span class="stat">${p.assists}</span>
                            <span class="stat">${kd}</span>
                        </div>
                    `;
                });
                if (!playerHtml) playerHtml = '<div style="color:#aaa;">暂无队员数据</div>';
                modalPlayerList.innerHTML = playerHtml;
                modal.style.display = 'flex';
            });
        });
    }

    // 加载所有数据
    async function loadAll() {
        try {
            [playersData, teamsData, matchesData] = await Promise.all([
                fetchJSON('players.json'),
                fetchJSON('teams.json'),
                fetchJSON('matches.json')
            ]);

            // 渲染赛事面板
            renderTournamentList();
            renderMatchesCenter();
            renderRankingsSide();

            // 渲染实力排行
            renderPowerRankings();
        } catch (e) {
            console.error(e);
            const errMsg = `<div class="error">加载失败: ${e.message}</div>`;
            matchesCenter.innerHTML = errMsg;
            rankingsSide.innerHTML = errMsg;
            powerGrid.innerHTML = errMsg;
        }
    }

    loadAll();
})();
