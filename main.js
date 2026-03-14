var data;

// 加载 JSON 数据并渲染对应页面
async function loadData() {
    try {
        const response = await fetch('data/data.json');
        data = await response.json();

        // 根据当前页面路径执行不同渲染
        if (window.location.pathname.includes('history.html')) {
            renderHistoryTournament(data);
        } else if (window.location.pathname.includes('teams.html')) {
            renderTeams(data);
        } else {
            renderHome(data);
        }
    } catch (error) {
        console.error('数据加载失败:', error);
        // 可选：在页面上显示错误提示
        const containers = ['matches-container', 'fury-matches', 'teams-grid'];
        containers.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<p style="color: red;">数据加载失败，请稍后重试。</p>';
        });
    }
}

function renderHistoryTournament(data) {
    const tournaments = document.querySelector(".tournaments");
    if (!tournaments) return;

    tournaments.innerHTML = data.tournaments.map(tournament => {
        const start = new Date(tournament.startDate).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
        const end = new Date(tournament.endDate).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })

        const hasEnded = new Date(tournament.endDate) < new Date();
        return `
            <section class="tournament-header" data-tournament-id="${tournament.id}">
                <div class="tournament-info">
                    <div>
                        <h1>${tournament.name}</h1>
                        ${hasEnded ? `<h2>冠军队伍：${data.teams.find(team => team.id == tournament.winningTeam).name}</h2>` : ``}
                        <p>比赛时间：${start} - ${end} | 状态：${tournament.status}</p>
                    </div>
                    <div class="tournament-actions">
                        <button onclick="openOrFoldMatches(${tournament.id})">详情</button>
                    </div>
                </div>
                <div id="fury-matches" class="matches-grid">
            </section>
        `
    }).join('');
}

function openOrFoldMatches(tournamentId) {
    const btn = document.querySelector(`[data-tournament-id="${tournamentId}"]`).querySelector('button');
    const matchContainer = document.querySelector(`[data-tournament-id="${tournamentId}"]`).querySelector("#fury-matches");
    if (matchContainer.children.length == 0) {
        btn.textContent = "折叠"
        renderHistory(data, tournamentId);
    }
    else {
        matchContainer.innerHTML = "";
        btn.textContent = "详情"
    }
}

function renderHome(data) {
    const container = document.getElementById('matches-container');
    if (!container) return;

    // 取所有比赛，按时间排序，展示最近的3场
    const sortedMatches = [...data.history].sort((a, b) => new Date(a.time) - new Date(b.time));
    const upcoming = sortedMatches.slice(0, 3);

    if (upcoming.length === 0) {
        container.innerHTML = '<p>暂无比赛</p>';
        return;
    }

    container.innerHTML = upcoming.map(match => {
        const team1 = data.teams.find(t => t.id === match.teams[0]) || { name: '待定' };
        const team2 = data.teams.find(t => t.id === match.teams[1]) || { name: '待定' };
        const team1Wins = match.scores[0] > match.scores[1];
        const team2Wins = match.scores[1] > match.scores[2];
        return `
            <div class="match-card" onclick="openMatchDetail(${match.id})">
                <div class="match-teams">
                    <span style="color:var(--accent);font-weight:${team1Wins ? "bold" : "normal"};">${team1.name}</span>
                    <span class="vs">VS</span>
                    <span style="color:var(--accent2);font-weight:${team2Wins ? "bold" : "normal"};">${team2.name}</span>
                </div>
                <div class="match-score">
                    <span style="color:var(--accent);font-weight:${team1Wins ? "bold" : "normal"};">${match.scores[0]}</span>
                    <span style="color:white;"> : </span>
                    <span style="color:var(--accent2);font-weight:${team2Wins ? "bold" : "normal"};">${match.scores[1]}</span>
                </div>
                <div class="match-time">${new Date(match.time).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</div>
            </div>
        `;
    }).join('');
}

function renderHistory(data, id) {
    const container = document.querySelector(`[data-tournament-id="${id}"]`).querySelector('#fury-matches');
    if (!container) return;

    const furyMatches = data.history.filter(m => m.tournamentId === id);
    if (furyMatches.length === 0) {
        container.innerHTML = `<p>暂无 ${data.tournaments.find(t => t.id == id).name} 的比赛</p>`;
        return;
    }

    container.innerHTML = furyMatches.map(match => {
        const team1 = data.teams.find(t => t.id === match.teams[0]) || { name: '待定' };
        const team2 = data.teams.find(t => t.id === match.teams[1]) || { name: '待定' };
        const team1Wins = match.scores[0] > match.scores[1];
        const team2Wins = match.scores[1] > match.scores[2];
        return `
            <div class="match-card" onclick="openMatchDetail(${match.id})">
                <div class="match-teams">
                    <span style="color:var(--accent);font-weight:${team1Wins ? "bold" : "normal"};">${team1.name}</span>
                    <span class="vs">VS</span>
                    <span style="color:var(--accent2);font-weight:${team2Wins ? "bold" : "normal"};">${team2.name}</span>
                </div>
                <div class="match-score">
                    <span style="color:var(--accent);font-weight:${team1Wins ? "bold" : "normal"};">${match.scores[0]}</span>
                    <span style="color:white;"> : </span>
                    <span style="color:var(--accent2);font-weight:${team2Wins ? "bold" : "normal"};">${match.scores[1]}</span>
                </div>
                <div class="match-time">${new Date(match.time).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</div>
            </div>
        `;
    }).join('');
}

function openMatchDetail(matchId) {
    const detail = document.querySelector(".match-detail");
    const match = data.history.find(m => m.id == matchId)
    document.querySelector(".cover").style.display = "block"
    detail.style.display = "flex"

    detail.querySelector("#team-1").textContent = match.scores[0]
    detail.querySelector("#team-2").textContent = match.scores[1]

    document.querySelector(".match-detail-team-1").textContent = data.teams.find(t => t.id == match.teams[0]).name
    document.querySelector(".match-detail-team-2").textContent = data.teams.find(t => t.id == match.teams[1]).name

    detail.querySelector("#team-1-list").innerHTML = match.detail[0].map(player => {
        return `
            <tr>
                <td class="player-name">${player[0]}</td>
                <td>${player[1]}/${player[2]}/${player[3]}</td>
                <td>${((player[1] + 0.5 * player[3]) / player[2]).toFixed(1)}</td>
            </tr>
        `
    }).join(" ")
    
    detail.querySelector("#team-2-list").innerHTML = match.detail[1].map(player => {
        return `
            <tr>
                <td class="player-name">${player[0]}</td>
                <td>${player[1]}/${player[2]}/${player[3]}</td>
                <td>${((player[1] + 0.5 * player[3]) / player[2]).toFixed(1)}</td>
            </tr>
        `
    }).join(" ")
}

function closeMatchDetail() {
    const detail = document.querySelector(".match-detail");
    document.querySelector(".cover").style.display = "none"
    detail.style.display = "none"
}
 
function renderTeams(data) {
    const container = document.getElementById('teams-grid');
    if (!container) return;

    if (data.teams.length === 0) {
        container.innerHTML = '<p>暂无队伍信息</p>';
        return;
    }

    container.innerHTML = data.teams.map(team => `
        <div class="team-card" onclick="openTeamDetail(${team.id})">
            <div class="team-logo">
                <img src="${team.logo}" alt="${team.name}" onerror="this.onerror=null; this.src='https://via.placeholder.com/100x100?text=${team.name.charAt(0)}'">
            </div>
            <div class="team-name">${team.name}</div>
            <div class="team-rating">ID: ${team.id}</div>
        </div>
    `).join('');
}

function openTeamDetail(teamId) {
    const detail = document.querySelector(".match-detail");
    const team = data.teams.find(m => m.id == teamId)
    document.querySelector(".cover").style.display = "block"
    detail.style.display = "flex"

    document.querySelector(".match-detail-team-1").textContent = team.name

    detail.querySelector("#team-1-list").innerHTML = team.teammates.map(player => {
        return `
            <tr>
                <td class="player-name">${player}</td>
            </tr>
        `
    }).join(" ")
    
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', loadData);
