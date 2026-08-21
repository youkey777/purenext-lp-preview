/* PureNext LP v2 — お客様の声カルーセル（横スライド・ロール式） & FAQアコーディオン（素のJS・依存なし） */
(function () {
  "use strict";

  /* ---------- お客様の声カルーセル（ロール式） ----------
     トラック上に [最後のクローン][実スライド1..3][最初のクローン] を並べ、
     translateX で横にスライドする。端まで来たらアニメなしで実スライドへ
     つなぎ替えることで、無限に同方向へ回転しているように見せる。 */
  var STAGE_W = 1024;   // ステージ幅
  var SLIDE_W = 660;    // カード幅（全カード共通）
  var GAP = 24;         // カード間隔
  var STEP = SLIDE_W + GAP;
  var BASE = (STAGE_W - SLIDE_W) / 2; // 中央カードの左端位置

  var track = document.getElementById("voiceTrack");
  if (track) {
    var real = track.children.length; // 実スライド数
    // 両端にクローンを追加（無限ループ用）
    var firstClone = track.children[0].cloneNode(true);
    var lastClone = track.children[real - 1].cloneNode(true);
    firstClone.setAttribute("aria-hidden", "true");
    lastClone.setAttribute("aria-hidden", "true");
    track.appendChild(firstClone);
    track.insertBefore(lastClone, track.children[0]);

    var cards = track.children; // [cloneLast, s1..sN, cloneFirst]
    var pos = 1;                // 現在の中央カード（トラック内の添字）
    var busy = false;

    function apply(anim) {
      if (anim) track.classList.add("is-anim");
      else track.classList.remove("is-anim");
      track.style.transform = "translateX(" + (BASE - STEP * pos) + "px)";
      for (var i = 0; i < cards.length; i++) {
        if (i === pos) cards[i].classList.add("is-active");
        else cards[i].classList.remove("is-active");
      }
      if (!anim) void track.offsetHeight; // 即時反映（トランジション抑止を確定させる）
    }

    function settle() {
      // クローン上で止まったら、同じ見た目の実スライドへアニメなしで差し替え
      if (pos === 0) { pos = real; apply(false); }
      else if (pos === real + 1) { pos = 1; apply(false); }
      busy = false;
    }

    var settleTimer = null;
    function go(step) {
      if (busy) return;
      busy = true;
      pos += step;
      apply(true);
      // transitionend が飛ばない環境向けの保険
      settleTimer = window.setTimeout(settle, 650);
    }
    track.addEventListener("transitionend", function (e) {
      if (e.target !== track) return;
      if (settleTimer) { window.clearTimeout(settleTimer); settleTimer = null; }
      settle();
    });

    document.getElementById("voicePrev").addEventListener("click", function () { go(-1); });
    document.getElementById("voiceNext").addEventListener("click", function () { go(1); });
    apply(false);
  }

  /* ---------- FAQアコーディオン（体感即時） ---------- */
  var btns = document.querySelectorAll(".faq__qbtn");
  for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener("click", function () {
      var open = this.getAttribute("aria-expanded") === "true";
      this.setAttribute("aria-expanded", open ? "false" : "true");
      var panel = this.parentElement.querySelector(".faq__a");
      if (panel) panel.hidden = open;
    });
  }
})();
