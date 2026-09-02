/* PureNext LP v2 — お客様の声カルーセル（横スライド・ロール式） & FAQアコーディオン（素のJS・依存なし） */
(function () {
  "use strict";

  var SP_MAX = 767;   // これ以下は1カラム（responsive.css が効いている幅）
  var PC_MIN = 1024;  // これ以上は変更前とまったく同じ挙動

  function vw() { return document.documentElement.clientWidth; }

  /* ---------- タブレット（768〜1023px）: PCレイアウトを幅に合わせて縮小 ----------
     1カラム化はせず、.page（1024px固定）に zoom を掛けて丸ごと縮める。
     1024px 以上では zoom を空文字に戻すので、描画は変更前と同一。 */
  function fitPage() {
    var w = vw();
    var pg = document.querySelector(".page");
    if (!pg) return;
    if (w >= 768 && w < PC_MIN) { pg.style.zoom = String(w / PC_MIN); }
    else { pg.style.zoom = ""; }
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

    /* 767px 以下だけ、ステージ幅・カード幅・間隔を実測値に置き換える。
       768px 以上（タブレットの zoom 表示・PC）は従来の固定値のまま。 */
    function measure() {
      if (!stage || vw() > SP_MAX) {
        if (stage) {
          stage.style.removeProperty("--slide-w");
          stage.style.removeProperty("--photo-h");
        }
        STAGE_W = 1024; SLIDE_W = 660; GAP = 24;
      } else {
        var sw = stage.clientWidth;
        var want = Math.round(sw * 0.80); /* 統括検品: 0.84→0.80（隣カードの見え幅を確保。responsive.css の 80vw と対） */
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

  /* ---------- タブレットの縮小表示を有効化 ---------- */
  fitPage();
  window.addEventListener("resize", fitPage);
  window.addEventListener("orientationchange", fitPage);
})();
