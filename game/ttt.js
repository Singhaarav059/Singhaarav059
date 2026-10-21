// Tic-tac-toe played through issues: a visitor's move (X) arrives as an issue titled "ttt|move|<0-8>",
// the bot answers with O, the board in README.md is redrawn, and the issue is closed with a reply.
const fs = require('fs');

const REPO = 'Singhaarav059/Singhaarav059';
const STATE = 'game/ttt.json';
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

const winner = (b) => {
  for (const [a, c, d] of LINES) if (b[a] !== ' ' && b[a] === b[c] && b[a] === b[d]) return b[a];
  return b.includes(' ') ? null : 'draw';
};

// Win, else block, else centre, else a random corner, else any square: good, but a fork beats it.
const reply = (b) => {
  const free = b.flatMap((v, i) => (v === ' ' ? [i] : []));
  for (const who of ['O', 'X'])
    for (const i of free) {
      const t = [...b];
      t[i] = who;
      if (winner(t) === who) return i;
    }
  if (b[4] === ' ') return 4;
  const corners = [0, 2, 6, 8].filter((i) => b[i] === ' ');
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  return free[0];
};

const issueLink = (title) =>
  `https://github.com/${REPO}/issues/new?title=${encodeURIComponent(title)}` +
  `&body=${encodeURIComponent('Press "Create" to play. The board on the profile updates in about 30 seconds.')}`;

const render = (st) => {
  const over = winner(st.board);
  const cell = (v, i) =>
    v === 'X' ? '❌' : v === 'O' ? '⭕' : over ? '⬜' : `<a href="${issueLink(`ttt|move|${i}`)}">⬜</a>`;
  const rows = [0, 3, 6]
    .map((r) => `<tr>${[0, 1, 2].map((c) => `<td align="center" width="56" height="56">${cell(st.board[r + c], r + c)}</td>`).join('')}</tr>`)
    .join('\n');
  const status =
    over === 'X' ? 'Visitor wins! 🎉' : over === 'O' ? 'The bot wins.' : over === 'draw' ? 'Draw.' : 'Your move: you are ❌. Click an empty square.';
  const last = st.last ? ` Last move by [@${st.last}](https://github.com/${st.last}).` : '';
  return [
    '<!-- TTT:START -->',
    '<div align="center">',
    '',
    `<table>\n${rows}\n</table>`,
    '',
    `**${status}**${over ? ` [Start a new game](${issueLink('ttt|new')})` : ''}${last}`,
    '',
    `<sub>Visitors ${st.score.you} · Bot ${st.score.me} · Draws ${st.score.draw}</sub>`,
    '',
    '</div>',
    '<!-- TTT:END -->',
  ].join('\n');
};

module.exports = async ({ github, context }) => {
  const issue = context.payload.issue;
  const st = JSON.parse(fs.readFileSync(STATE, 'utf8'));
  const m = issue.title.trim().match(/^ttt\|(?:move\|([0-8])|(new))$/);
  let msg;
  if (!m) msg = "That move wasn't recognised. Use the squares on the profile.";
  else if (m[2]) {
    st.board = Array(9).fill(' ');
    st.last = issue.user.login;
    msg = 'New game started. Your move!';
  } else {
    const i = +m[1];
    if (winner(st.board)) msg = 'This game is over. Start a new one from the profile.';
    else if (st.board[i] !== ' ') msg = 'That square is already taken. Pick another one.';
    else {
      st.board[i] = 'X';
      let w = winner(st.board);
      if (!w) {
        st.board[reply(st.board)] = 'O';
        w = winner(st.board);
      }
      if (w) st.score[w === 'X' ? 'you' : w === 'O' ? 'me' : 'draw']++;
      st.last = issue.user.login;
      msg = w === 'X' ? 'You beat the bot 🎉' : w === 'O' ? 'The bot wins this one.' : w === 'draw' ? "It's a draw." : 'Your move is in and the bot has replied.';
    }
  }
  fs.writeFileSync(STATE, JSON.stringify(st, null, 2) + '\n');
  const readme = fs.readFileSync('README.md', 'utf8');
  fs.writeFileSync('README.md', readme.replace(/<!-- TTT:START -->[\s\S]*<!-- TTT:END -->/, render(st)));

  const where = { owner: context.repo.owner, repo: context.repo.repo, issue_number: issue.number };
  await github.rest.issues.createComment({ ...where, body: `${msg}\n\nBack to the board: https://github.com/${REPO}` });
  await github.rest.issues.update({ ...where, state: 'closed', state_reason: 'completed' });
};

module.exports.render = render;
