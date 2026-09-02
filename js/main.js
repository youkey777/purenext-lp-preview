/* PureNext LP v2 — お客様の声カルーセル（横スライド・ロール式） & FAQアコーディオン（素のJS・依存なし） */
(function () {
  "use strict";

  /* rev22-r4: 767 → 1023。600〜1023px を「タブレット層」として responsive.css で
     1カラムのまま組み直したので、カルーセルの実測（measure）とスワイプもこの帯まで効かせる */
  var SP_MAX = 1023;  // これ以下は1カラム（responsive.css が効いている幅）
  var PC_MIN = 1024;  // これ以上は変更前とまったく同じ挙動

  function vw() { return document.documentElement.clientWidth; }

  /* ---------- rev22-r4: タブレット（768〜1023px）の zoom 縮小を廃止 ----------
     もとは .page（1024px固定）に zoom を掛けて丸ごと縮めていた。
     ところが Galaxy Z Fold 7 の横向き（約800px）では文字が 78% まで縮み、
     本文が実質 12px 相当になって読めない。600〜1023px は responsive.css の
     タブレット層（1カラム＋内容の最大幅800px）で組むので、zoom は一切掛けない。
     1024px 以上の挙動は従来どおり（zoom を空文字に戻すだけ＝描画は変更前と同一）。
     関数と呼び出しは、将来また幅で切り替えたくなったときの入口として残す。 */
  function fitPage() {
    var pg = document.querySelector(".page");
    if (!pg) return;
    pg.style.zoom = "";
  }

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
  var stage = document.getElementById("voiceStage");
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

    /* rev22-r4: 1023px 以下（スマホ＋タブレット層）で、ステージ幅・カード幅・間隔を
       実測値に置き換える。1024px 以上（PC）は従来の固定値 1024/660/24 のまま。 */
    function measure() {
      if (!stage || vw() > SP_MAX) {
        if (stage) {
          stage.style.removeProperty("--slide-w");
          stage.style.removeProperty("--photo-h");
        }
        STAGE_W = 1024; SLIDE_W = 660; GAP = 24;
      } else {
        var sw = stage.clientWidth;
        /* rev22-r4: 上限 560px。タブレット層（600〜1023）では 80% が 480〜818px になり、
           カードが本文の最大幅（800px）より広くなって1枚だけ間延びするため頭を止める */
        var want = Math.min(Math.round(sw * 0.80), 560); /* 統括検品: 0.84→0.80（隣カードの見え幅を確保。responsive.css の 80vw と対） */
        stage.style.setProperty("--slide-w", want + "px");
        stage.style.setProperty("--photo-h", Math.round(want * 442 / 660) + "px");
        STAGE_W = sw;
        SLIDE_W = cards[1] ? cards[1].offsetWidth : want;
        var cs = window.getComputedStyle(track);
        var g = parseFloat(cs.columnGap);
        if (isNaN(g)) g = parseFloat(cs.gap);
        GAP = isNaN(g) ? 12 : g;
      }
      STEP = SLIDE_W + GAP;
      BASE = (STAGE_W - SLIDE_W) / 2;
    }

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

    /* スマホのスワイプ送り（横40px以上で1枚送る。縦スクロールは邪魔しない） */
    if (stage) {
      var sx = 0, sy = 0, dragging = false, fired = false;
      stage.addEventListener("pointerdown", function (e) {
        if (vw() > SP_MAX) return;
        dragging = true; fired = false; sx = e.clientX; sy = e.clientY;
      });
      stage.addEventListener("pointermove", function (e) {
        if (!dragging || fired) return;
        var dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) {
          fired = true; dragging = false;
          go(dx < 0 ? 1 : -1);
        }
      });
      stage.addEventListener("pointerup", function () { dragging = false; });
      stage.addEventListener("pointercancel", function () { dragging = false; });
    }

    measure();
    apply(false);

    var rt = null;
    window.addEventListener("resize", function () {
      if (rt) window.clearTimeout(rt);
      rt = window.setTimeout(function () { measure(); apply(false); }, 120);
    });
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

  /* ---------- rev22-r4: zoom は掛けないが、1024px 以上へ戻ったときに残骸を消すため呼ぶ ---------- */
  fitPage();
  window.addEventListener("resize", fitPage);
  window.addEventListener("orientationchange", fitPage);
})();
