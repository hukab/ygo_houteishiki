// 記録したデータを取得する
function loadMonsters() {
  const fusionLevels = sessionStorage.getItem("fusion_levels");
  const xyzRanks = sessionStorage.getItem("xyz_ranks");

  if (fusionLevels) {
    document.getElementById("fusion_levels").value = fusionLevels;
  }
  if (xyzRanks) {
    document.getElementById("xyz_ranks").value = xyzRanks;
  }
}

// 融合モンスターとXモンスターを記録する
function saveMonsters() {
  const fusionLevels = document.getElementById("fusion_levels").value.trim();
  const xyzRanks = document.getElementById("xyz_ranks").value.trim();

  if (fusionLevels) {
    sessionStorage.setItem("fusion_levels", fusionLevels);
  }
  if (xyzRanks) {
    sessionStorage.setItem("xyz_ranks", xyzRanks);
  }

  document.getElementById("saved_message").textContent = "記録しました！";
}

// 記録をクリアする
function clearMonsters() {
  sessionStorage.removeItem("fusion_levels");
  sessionStorage.removeItem("xyz_ranks");

  document.getElementById("fusion_levels").value = "";
  document.getElementById("xyz_ranks").value = "";
  document.getElementById("saved_message").textContent = "記録をクリアしました。";
}

// 融合条件をチェックする関数（再利用可能に）
function checkCombination(fusionLevels, xyzRanksInput, totalHands, opponentLevel) {
  if (fusionLevels.length === 0 || xyzRanksInput.length === 0 || isNaN(totalHands) || isNaN(opponentLevel)) {
    return { possible: false, combinations: [] };
  }

  const xyzCounts = {};
  xyzRanksInput.forEach(rank => {
    xyzCounts[rank] = 2; // 各ランクを2体としてカウント
  });

  const y = 2 * opponentLevel - totalHands; // 融合モンスターのレベル
  const x = opponentLevel - y; // Xモンスターのランク

  let isPossible = false;
  const combinations = [];

  if (fusionLevels.includes(y) && xyzCounts[x] === 2) {
    isPossible = true;
    combinations.push({y, x});
  }

  return { possible: isPossible, combinations };
}

function calculate() {
  const fusionLevels = document.getElementById("fusion_levels").value.split(",").map(Number).filter(n => !isNaN(n));
  const xyzRanksInput = document.getElementById("xyz_ranks").value.split(",").map(Number).filter(n => !isNaN(n));
  const totalHandsOriginal = parseInt(document.getElementById("total_hands").value);
  const opponentLevel = parseInt(document.getElementById("opponent_level").value);

  const resultEl = document.getElementById("result");
  const adjustedResultsEl = document.getElementById("adjusted_results");

  // 初期化
  resultEl.innerHTML = "";
  adjustedResultsEl.innerHTML = "";

  // メインチェック
  let baseCheck = checkCombination(fusionLevels, xyzRanksInput, totalHandsOriginal, opponentLevel);

  if (isNaN(totalHandsOriginal) || isNaN(opponentLevel) || fusionLevels.length === 0 || xyzRanksInput.length === 0) {
    resultEl.innerHTML = `<div class="result-card fail"><h3>入力エラー</h3><p>すべての入力項目を正しく入力してください。</p></div>`;
    return;
  }

  if (baseCheck.possible) {
    // 成功表示
    let combosHtml = baseCheck.combinations.map(c => `
      <div class="result-combination">
        <h4>組み合わせ:</h4>
        <ul>
          <li>融合モンスター レベル: ${c.y}</li>
          <li>Xモンスター ランク: ${c.x}</li>
        </ul>
      </div>
    `).join("");

    resultEl.innerHTML = `
      <div class="result-card success">
        <h3>条件を満たしました！</h3>
        ${combosHtml}
      </div>
    `;
  } else {
    // 不成功
    resultEl.innerHTML = `<div class="result-card fail"><h3>条件不成立</h3><p>条件を満たす組み合わせは見つかりませんでした。</p></div>`;
  }

  // ±5での再チェック
  const maxAdjust = 5;
  const adjustedPossibilities = [];

  for (let diff = -maxAdjust; diff <= maxAdjust; diff++) {
    if (diff === 0) continue;
    const newTotal = totalHandsOriginal + diff;
    if (newTotal < 0) continue; 
    const check = checkCombination(fusionLevels, xyzRanksInput, newTotal, opponentLevel);
    if (check.possible) {
      adjustedPossibilities.push({
        diff: diff,
        totalHands: newTotal,
        combinations: check.combinations
      });
    }
  }

  if (adjustedPossibilities.length > 0) {
    adjustedPossibilities.sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff));

    let adjustedHtml = `<h3>増減で実現可能な組み合わせ</h3>`;
    adjustedPossibilities.forEach(item => {
      const sign = (item.diff > 0) ? `+${item.diff}` : `${item.diff}`;
      const comboItems = item.combinations.map(c => `
        <ul>
          <li>融合レベル: ${c.y}, Xランク: ${c.x}</li>
        </ul>
      `).join("");

      adjustedHtml += `
        <div class="adjusted-item">
          <h4>手札とフィールド合計: ${item.totalHands} (${sign}枚調整)</h4>
          ${comboItems}
        </div>
      `;
    });

    adjustedResultsEl.innerHTML = adjustedHtml;
  }
}

// ページ読み込み時に記録したデータを自動的に表示
window.onload = loadMonsters;
