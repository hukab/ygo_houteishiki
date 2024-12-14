window.onload = loadMonsters;

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

// 個々のモンスターに対して条件チェック
function checkForMonster(fusionLevels, xyzRanksInput, totalHands, monsterLevel) {
  if (fusionLevels.length === 0 || xyzRanksInput.length === 0 || isNaN(totalHands) || isNaN(monsterLevel)) {
    return { possible: false };
  }

  const xyzCounts = {};
  xyzRanksInput.forEach(rank => {
    xyzCounts[rank] = 2; // 各ランクは2体
  });

  const y = 2 * monsterLevel - totalHands; 
  const x = monsterLevel - y;

  if (fusionLevels.includes(y) && xyzCounts[x] === 2) {
    return { possible: true, combination: { y, x } };
  } else {
    return { possible: false };
  }
}

function calculate() {
  const fusionLevels = document.getElementById("fusion_levels").value.split(",").map(Number).filter(n => !isNaN(n));
  const xyzRanksInput = document.getElementById("xyz_ranks").value.split(",").map(Number).filter(n => !isNaN(n));
  const totalHandsOriginal = parseInt(document.getElementById("total_hands").value);
  const opponentMonstersLevels = document.getElementById("opponent_monsters").value
    .split(",").map(Number).filter(n => !isNaN(n));

  const resultEl = document.getElementById("result");
  const adjustedResultsEl = document.getElementById("adjusted_results");
  resultEl.innerHTML = "";
  adjustedResultsEl.innerHTML = "";

  if (isNaN(totalHandsOriginal) || fusionLevels.length === 0 || xyzRanksInput.length === 0 || opponentMonstersLevels.length === 0) {
    resultEl.innerHTML = `<div class="result-card fail"><h3>入力エラー</h3><p>すべての入力項目を正しく入力してください。</p></div>`;
    return;
  }

  let anySuccess = false;

  // 成立したモンスターのみ格納
  let successHtml = `<div class="result-card"><h3>相手モンスター別判定結果</h3>`;
  opponentMonstersLevels.forEach(monsterLevel => {
    const check = checkForMonster(fusionLevels, xyzRanksInput, totalHandsOriginal, monsterLevel);
    if (check.possible) {
      anySuccess = true;
      successHtml += `
      <div class="result-combination">
        <h4>相手モンスター レベル: ${monsterLevel}</h4>
        <p>条件成立！</p>
        <ul>
          <li>融合モンスター レベル: ${check.combination.y}</li>
          <li>Xモンスター ランク: ${check.combination.x}</li>
        </ul>
      </div>
      `;
    }
  });
  successHtml += `</div>`;

  // 成否判定後の表示
  if (!anySuccess) {
    // 全て不成立の場合
    resultEl.innerHTML = `
      <div class="result-card fail">
        <h3>条件不成立</h3>
        <p>条件を満たす組み合わせは見つかりませんでした。</p>
      </div>
    `;
  } else {
    // 成立したもののみ表示
    resultEl.innerHTML = successHtml;
  }

  // ±5で再チェック
  const maxAdjust = 5;
  const adjustedPossibilities = [];

  for (let diff = -maxAdjust; diff <= maxAdjust; diff++) {
    if (diff === 0) continue;
    const newTotal = totalHandsOriginal + diff;
    if (newTotal < 0) continue;

    let combosForThisAdjustment = [];
    opponentMonstersLevels.forEach(monsterLevel => {
      const check = checkForMonster(fusionLevels, xyzRanksInput, newTotal, monsterLevel);
      if (check.possible) {
        combosForThisAdjustment.push({
          monsterLevel: monsterLevel,
          combination: check.combination
        });
      }
    });

    if (combosForThisAdjustment.length > 0) {
      adjustedPossibilities.push({
        diff: diff,
        totalHands: newTotal,
        results: combosForThisAdjustment
      });
    }
  }

  if (adjustedPossibilities.length > 0) {
    adjustedPossibilities.sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff));

    let adjustedHtml = `<h3>増減で実現可能な組み合わせ</h3>`;
    adjustedPossibilities.forEach(item => {
      const sign = (item.diff > 0) ? `+${item.diff}` : `${item.diff}`;
      adjustedHtml += `
        <div class="adjusted-item">
          <h4>手札・フィールド合計: ${item.totalHands} (${sign}枚調整)</h4>
      `;

      item.results.forEach(r => {
        adjustedHtml += `
          <ul>
            <li>相手モンスター レベル: ${r.monsterLevel}</li>
            <li>融合レベル: ${r.combination.y}, Xランク: ${r.combination.x}</li>
          </ul>
        `;
      });

      adjustedHtml += `</div>`;
    });

    adjustedResultsEl.innerHTML = adjustedHtml;
  }
}
