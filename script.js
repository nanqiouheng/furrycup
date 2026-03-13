(function() {
    const DATA_PATH = './data/';

    // DOM 元素
    const timelineDiv = document.getElementById('timelineStages');
    const matchesDiv = document.getElementById('matchesList');
    const rankingsDiv = document.getElementById('rankingsList');
    const modal = document.getElementById('playerModal');
    const modalClose = modal.querySelector('.modal-close');
    const modalTeamName = document.getElementById('modalTeamName');
    const modalPlayerList = document.getElementById('modalPlayerList');

    // 全局数据
    let playersData = [];
    let teamsData = [];
    let matchesData = [];

    // 关闭模态框
    modalClose.addEventListener('click', () => modal.style.display = 'none');
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    async function fetchJSON(file) {
        const res = await fetch(DATA_PATH + file);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }

    // 计算战队记录
    function calculateTeamRecords(matches) {
        const records = {};
        teamsData.forEach(t => records[t.id] = { wins: 0, losses: 0 });
        matches.forEach(m => {
            if (m.status === 'completed') {
                if (m.teamA.score > m.teamB.score) {
                    records[m.teamA.id].wins++;
                    records[m.teamB.id].losses++;
                } else if (m.teamB.score > m.teamA.score) {
                    records[m.teamB.id].wins++;
                    records[m.teamA.id].losses++;
                }
            }
        });
        return records;
    }

    // 渲染左侧时间轴（从赛事阶段数据）
    function renderTimeline() {
        // 示例阶段数据，可根据实际赛事从matches.json提取
        const stages = [
            { name: '所有地区前哨战', date: '1月15日 - 2月15日', active: true },
            { name: 'Masters Santiago', date: '2月28日 - 3月16日', active: false },
            { name: '所有地区第一阶段', date: '4月1日 - 5月24日', active: false }
        ];
        let html = '';
        stages.forEach((s, idx) => {
            html += `
                <div class="stage-item ${s.active ? 'active' : ''}">
                    <div class="stage-name">${s.name}</div>
                    <div class="stage-date">${s.date}</div>
                </div>
            `;
        });
        timelineDiv.innerHTML = html;
    }

    // 渲染中央赛程
    function renderMatches() {
        if (!matchesData.length) {
            matchesDiv.innerHTML = '<div class="error">暂无赛程</div>';
            return;
        }

        const getTeamName = (id) => {
            const t = teamsData.find(t => t.id === id);
            return t ? t.name : id;
        };

        let html = '';
        // 按日期分组，只显示今天及之后的比赛
        const today = new Date().toISOString().slice(0,10);
        const upcoming = matchesData.filter(m => m.date >= today).sort((a,b) => a.date.localeCompare(b.date));

        upcoming.forEach(m => {
            const teamA = getTeamName(m.teamA.id);
            const teamB = getTeamName(m.teamB.id);
            const scoreA = m.teamA.score ?? 0;
            const scoreB = m.teamB.score ?? 0;
            const statusClass = m.status === 'completed' ? 'status-completed' : 'status-scheduled';
            const statusText = m.status === 'completed' ? '已结束' : '未开始';
            const timeStr = m.time ? `🕒 ${m.time}` : '';

            html += `
                <div class="match-card">
                    <div class="match-header">
                        <span class="match-series">VALORANT大师赛 • 瑞士制循环赛</span>
                        <span class="match-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="match-teams">
                        <div class="team">
                            <span class="team-name">${teamA}</span>
                        </div>
                        <span class="score">${scoreA} : ${scoreB}</span>
                        <div class="team">
                            <span class="team-name">${teamB}</span>
                        </div>
                    </div>
                    <div class="match-footer">
                        <span>📅 ${m.date}</span>
                        <span>${timeStr}</span>
                        ${m.maps ? `<span>🗺️ ${m.maps.join(', ')}</span>` : ''}
                    </div>
                </div>
            `;
        });
        matchesDiv.innerHTML = html || '<div class="error">暂无近期比赛</div>';
    }

    // 渲染右侧排名
    function renderRankings() {
        const records = calculateTeamRecords(matchesData);
        const sorted = teamsData.map(t => ({
            ...t,
            wins: records[t.id]?.wins || 0,
            losses: records[t.id]?.losses || 0
        })).sort((a, b) => b.wins - a.wins);

        let html = '';
        sorted.forEach((t, idx) => {
            html += `
                <div class="ranking-item" data-team-id="${t.id}">
                    <span class="rank-number">#${idx+1}</span>
                    <div class="rank-info">
                        <div class="rank-name">${t.name}</div>
                        <div class="rank-stats">${t.wins}胜 ${t.losses}负</div>
                    </div>
                    <span class="rank-record">${((t.wins/(t.wins+t.losses||1))*100).toFixed(0)}%</span>
                </div>
            `;
        });
        rankingsDiv.innerHTML = html;

        // 点击排名显示队员
        document.querySelectorAll('.ranking-item').forEach(item => {
            item.addEventListener('click', () => {
                const teamId = item.dataset.teamId;
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
                modalPlayerList.innerHTML = playerHtml || '<div style="color:#aaa;">暂无队员数据</div>';
                modal.style.display = 'flex';
            });
        });
    }

    async function loadAll() {
        try {
            [playersData, teamsData, matchesData] = await Promise.all([
                fetchJSON('players.json'),
                fetchJSON('teams.json'),
                fetchJSON('matches.json')
            ]);

            renderTimeline();
            renderMatches();
            renderRankings();
        } catch (e) {
            const errMsg = `<div class="error">加载失败: ${e.message}</div>`;
            matchesDiv.innerHTML = errMsg;
            rankingsDiv.innerHTML = errMsg;
        }
    }

    loadAll();
})();
