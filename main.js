// 加载 JSON 数据并渲染对应页面
async function loadData() {
    try {
        const response = await fetch('data/data.json');
        const data = await response.json();

        // 根据当前页面路径执行不同渲染
        if (window.location.pathname.includes('furycup.html')) {
            renderFuryCup(data);
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

function renderHome(data) {
    const container = document.getElementById('matches-container');
    if (!container) return;

    // 取所有比赛，按时间排序，展示最近的3场
    const sortedMatches = [...data.matches].sort((a, b) => new Date(a.time) - new Date(b.time));
    const upcoming = sortedMatches.slice(0, 3);

    if (upcoming.length === 0) {
        container.innerHTML = '<p>暂无即将开始的比赛</p>';
        return;
    }

    container.innerHTML = upcoming.map(match => {
        const team1 = data.teams.find(t => t.id === match.team1Id) || { name: '待定' };
        const team2 = data.teams.find(t => t.id === match.team2Id) || { name: '待定' };
        return `
            <div class="match-card">
                <div class="match-teams">
                    <span>${team1.name}</span>
                    <span class="vs">VS</span>
                    <span>${team2.name}</span>
                </div>
                <div class="match-score">${match.score}</div>
                <div class="match-time">${new Date(match.time).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</div>
            </div>
        `;
    }).join('');
}

function renderFuryCup(data) {
    const container = document.getElementById('fury-matches');
    if (!container) return;

    const furyMatches = data.matches.filter(m => m.tournamentId === 1);
    if (furyMatches.length === 0) {
        container.innerHTML = '<p>暂无福瑞杯的比赛</p>';
        return;
    }

    container.innerHTML = furyMatches.map(match => {
        const team1 = data.teams.find(t => t.id === match.team1Id) || { name: '待定' };
        const team2 = data.teams.find(t => t.id === match.team2Id) || { name: '待定' };
        return `
            <div class="match-card">
                <div class="match-teams">
                    <span>${team1.name}</span>
                    <span class="vs">VS</span>
                    <span>${team2.name}</span>
                </div>
                <div class="match-score">${match.score}</div>
                <div class="match-time">${new Date(match.time).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</div>
            </div>
        `;
    }).join('');
}

function renderTeams(data) {
    const container = document.getElementById('teams-grid');
    if (!container) return;

    if (data.teams.length === 0) {
        container.innerHTML = '<p>暂无队伍信息</p>';
        return;
    }

    container.innerHTML = data.teams.map(team => `
        <div class="team-card">
            <div class="team-logo">
                <img src="${team.logo}" alt="${team.name}" onerror="this.onerror=null; this.src='https://via.placeholder.com/100x100?text=${team.name.charAt(0)}'">
            </div>
            <div class="team-name">${team.name}</div>
            <div class="team-rating">战力: ${team.rating}</div>
        </div>
    `).join('');
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', loadData);
